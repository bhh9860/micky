import React, { useState, useEffect, useMemo } from 'react';
import { User, FileText, BarChart2, Save, Plus, Trash2, PieChart, UserPlus, X, Sparkles, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
// import './index.css' // [수정] 미리보기 환경 오류 방지를 위해 제거 (Tailwind 자동 적용됨)

// [중요 1] Firebase 라이브러리
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, writeBatch } from "firebase/firestore";

// [중요 2] Firebase 설정 (제공해주신 키 적용)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase 초기화 실패:", error);
}

// [중요 3] Gemini API Key (제공해주신 키 적용)
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

// --- 초기 데이터 (DB가 비었을 때 자동 생성용) ---
const NAMES = [
  { k: '허지후', e: 'Jacob' }, { k: '김소피아', e: 'Sophia' }, { k: '이다니엘', e: 'Daniel' },
  { k: '박올리비아', e: 'Olivia' }, { k: '최마이클', e: 'Michael' }, { k: '정에밀리', e: 'Emily' },
  { k: '강데이빗', e: 'David' }, { k: '윤그레이스', e: 'Grace' }, { k: '송라이언', e: 'Ryan' }, { k: '임해나', e: 'Hannah' }
];
const GRADES = ['G3', 'G4', 'G5', 'G6'];
const CLASSES = ['Starter-1', 'Basic-1', 'Basic-2', 'Intermediate-1', 'Intermediate-2'];

const MickeyExcelApp = () => {
  const [activeTab, setActiveTab] = useState('input');
  
  // DB 데이터 상태
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: 'G3', classInfo: 'Basic-1' });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [statCriteria, setStatCriteria] = useState('class');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // --- 초기 데이터 생성 함수 (DB 업로드) ---
  const uploadInitialData = async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      const batch = writeBatch(db); // 한 번에 저장하기 위한 batch

      // 1. 학생 데이터 생성
      const studentRefs = [];
      for (let i = 0; i < NAMES.length; i++) {
        const sData = {
          name: `${NAMES[i].e} (${NAMES[i].k})`,
          school: i % 2 === 0 ? '초등A교' : '초등B교',
          grade: i === 0 ? 'G5' : GRADES[Math.floor(Math.random() * GRADES.length)],
          classInfo: i === 0 ? 'Basic-2' : CLASSES[Math.floor(Math.random() * CLASSES.length)]
        };
        const sRef = doc(collection(db, "students")); // ID 자동 생성
        batch.set(sRef, sData);
        studentRefs.push({ id: sRef.id, ...sData });
      }

      // 2. 성적 데이터 생성
      for (let i = 0; i < studentRefs.length; i++) {
        const s = studentRefs[i];
        let scoreData = {};

        // 1번 학생(허지후) 고정 데이터
        if (i === 0) {
          scoreData = {
            id: Date.now() + i,
            examId: 'T25-11',
            studentId: s.id,
            ls1: 5, ls2: 4, ls3: 13, ls4: 5,
            rw1: 4, rw2: 5, rw3: 10, rw4: 10,
            cp_reading: 'Excellent', cp_listening: 'Excellent', cp_writing: 'Excellent', cp_grammar: 'Excellent',
            att_attendance: 'Excellent', att_homework: 'Excellent',
            teacher_comment: ''
          };
        } else {
          // 랜덤 데이터
          const rand = Math.random();
          let tier = 'MID';
          if (rand < 0.3) tier = 'HIGH'; else if (rand > 0.8) tier = 'LOW';
          
          const getScore = (max) => Math.round(max * (tier === 'HIGH' ? 0.9 : tier === 'MID' ? 0.7 : 0.5));
          const getEval = () => (tier === 'HIGH' ? 'Excellent' : tier === 'MID' ? 'Good' : 'Bad');

          scoreData = {
            id: Date.now() + i,
            examId: 'T25-11',
            studentId: s.id,
            ls1: getScore(5), ls2: getScore(5), ls3: getScore(15), ls4: getScore(5),
            rw1: getScore(5), rw2: getScore(5), rw3: getScore(10), rw4: getScore(10),
            cp_reading: getEval(), cp_listening: getEval(), cp_writing: getEval(), cp_grammar: getEval(),
            att_attendance: getEval(), att_homework: getEval(),
            teacher_comment: ''
          };
        }
        const scoreRef = doc(collection(db, "scores"));
        batch.set(scoreRef, scoreData);
      }

      await batch.commit(); // DB에 전송
      alert("초기 데이터가 DB에 생성되었습니다!");
      window.location.reload(); // 새로고침해서 데이터 불러오기
    } catch (e) {
      console.error("초기 데이터 생성 실패:", e);
    }
  };

  // --- 데이터 불러오기 (Read) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // 학생 데이터
        const studentSnapshot = await getDocs(collection(db, "students"));
        const loadedStudents = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 성적 데이터
        const scoreSnapshot = await getDocs(query(collection(db, "scores"), orderBy("id", "asc")));
        const loadedScores = scoreSnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));

        if (loadedStudents.length === 0 && loadedScores.length === 0) {
          // 데이터가 하나도 없으면 초기 데이터 생성 제안
          if(window.confirm("DB에 데이터가 없습니다. 초기 테스트 데이터를 생성할까요?")) {
            await uploadInitialData();
            return; 
          }
        }

        setStudents(loadedStudents);
        setScores(loadedScores);
        if (loadedStudents.length > 0) setSelectedStudentId(loadedStudents[0].id);

      } catch (error) {
        console.error("데이터 불러오기 오류:", error);
        alert("데이터 로드 실패. Firebase 설정을 확인하세요.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 헬퍼 함수 ---
  const getStudentInfo = (id) => students.find(s => s.id === id);

  // --- 데이터 가공 ---
  const enrichedScores = useMemo(() => {
    return scores.map(score => {
      const lsTotal = (Number(score.ls1)||0) + (Number(score.ls2)||0) + (Number(score.ls3)||0) + (Number(score.ls4)||0);
      const rwTotal = (Number(score.rw1)||0) + (Number(score.rw2)||0) + (Number(score.rw3)||0) + (Number(score.rw4)||0);
      const total = lsTotal + rwTotal;
      
      const sInfo = getStudentInfo(score.studentId);
      
      return {
        ...score,
        name: sInfo?.name || '삭제된 학생', 
        classInfo: sInfo?.classInfo || '-',
        grade: sInfo?.grade || '-',
        lsTotal,
        rwTotal,
        total,
      };
    });
  }, [scores, students]);

  const studentReportData = useMemo(() => {
    return enrichedScores.filter(s => s.studentId === selectedStudentId);
  }, [enrichedScores, selectedStudentId]);

  const selectedStudentInfo = students.find(s => s.id === selectedStudentId) || {};

  const statisticsData = useMemo(() => {
    const grouped = {};
    const validScores = enrichedScores.filter(s => s.name !== '삭제된 학생' && s.classInfo !== '-');

    validScores.forEach(score => {
      const key = statCriteria === 'class' ? score.classInfo : score.grade;
      if (!grouped[key]) grouped[key] = { name: key, count: 0, lsSum: 0, rwSum: 0, totalSum: 0 };
      grouped[key].count += 1;
      grouped[key].lsSum += score.lsTotal;
      grouped[key].rwSum += score.rwTotal;
      grouped[key].totalSum += score.total;
    });

    return Object.values(grouped)
      .map(g => ({
        name: g.name,
        lsAvg: Math.round(g.lsSum / g.count) || 0,
        rwAvg: Math.round(g.rwSum / g.count) || 0,
        totalAvg: Math.round(g.totalSum / g.count) || 0,
        count: g.count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedScores, statCriteria]);

  // --- 핸들러 ---
  const handleAddStudent = async () => {
    if (!newStudent.name) return alert('이름을 입력해주세요.');
    if (!db) return alert("DB 연결이 안되어 있습니다.");

    try {
      // 학생 추가
      const docRef = await addDoc(collection(db, "students"), newStudent);
      const newStudentObj = { id: docRef.id, ...newStudent };
      setStudents([...students, newStudentObj]);

      // 성적표 자동 생성
      const newScoreData = {
        id: Date.now(), 
        examId: 'T25-11',
        studentId: docRef.id, 
        ls1: 0, ls2: 0, ls3: 0, ls4: 0,
        rw1: 0, rw2: 0, rw3: 0, rw4: 0,
        cp_reading: 'Excellent', cp_listening: 'Excellent', cp_writing: 'Excellent', cp_grammar: 'Excellent',
        att_attendance: 'Excellent', att_homework: 'Excellent',
        teacher_comment: ''
      };
      const scoreRef = await addDoc(collection(db, "scores"), newScoreData);
      setScores([...scores, { docId: scoreRef.id, ...newScoreData }]);

      setNewStudent({ name: '', school: '', grade: 'G3', classInfo: 'Basic-1' }); 
      alert(`${newStudent.name} 학생 등록 완료!`);
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('학생을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, "students", id));
      setStudents(students.filter(s => s.id !== id));
    } catch (e) {
      alert("삭제 실패");
    }
  };

  const handleDeleteScoreRow = async (docId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, "scores", docId));
      setScores(prev => prev.filter(row => row.docId !== docId));
    } catch (e) {
      alert("삭제 실패");
    }
  };

  const handleEditScore = async (docId, field, value) => {
    // 로컬 먼저 업데이트 (반응성)
    setScores(prev => prev.map(row => 
      row.docId === docId ? { ...row, [field]: value } : row
    ));
    // DB 업데이트
    try {
      const ref = doc(db, "scores", docId);
      await updateDoc(ref, { [field]: value });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNameClick = (studentId) => {
    if (!studentId) return;
    setSelectedStudentId(studentId);
    setActiveTab('report');
  };

  const generateAIComment = async () => {
    if (!studentReportData.length) return;
    if (!geminiApiKey) return alert('Gemini API Key가 없습니다.');
    
    setIsGeneratingAI(true);
    const data = studentReportData[0];
    
    const prompt = `
      Role: Warm English Teacher. Task: Monthly report comment for student (Korean).
      Student: ${data.name} (${data.grade}, ${data.classInfo}).
      Scores(60): L&S ${data.lsTotal}, R&W ${data.rwTotal}.
      Attitude: Attend ${data.att_attendance}, HW ${data.att_homework}.
      Progress: Read ${data.cp_reading}, List ${data.cp_listening}, Writ ${data.cp_writing}, Gram ${data.cp_grammar}.
      Guidelines: Polite Korean(존댓말). Warm greeting. Praise strengths. Gentle advice for weak points.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const result = await response.json();
      const comment = result.candidates?.[0]?.content?.parts?.[0]?.text || "생성 실패";
      handleEditScore(data.docId, 'teacher_comment', comment);
    } catch (error) {
      alert('AI 오류 발생');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center w-screen bg-white"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50 text-gray-800 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={24} /> 미키영어학원 성적관리 (DB Ver)
          </h1>
          <div className="text-sm bg-indigo-800 px-3 py-1 rounded flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-300"/> Live Data
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-100 border-b border-gray-200 pt-2">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {[{ id: 'students', label: '1. 학생관리', icon: User }, { id: 'input', label: '2. 점수입력', icon: Save }, { id: 'report', label: '3. 성적표', icon: FileText }, { id: 'dashboard', label: '4. 통계', icon: BarChart2 }].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`
                  px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all rounded-t-lg mr-2 outline-none ring-0
                  ${activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm border-t-2 border-blue-600' 
                    : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200'}
                `}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto w-full p-6">
          {/* TAB 1: 학생관리 */}
          {activeTab === 'students' && (
             <div className="flex flex-col gap-6">
               <div className="bg-white p-6 rounded-lg shadow border border-indigo-200 bg-indigo-50">
                 <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center gap-2"><UserPlus size={20}/> 신규 학생 등록</h3>
                 <div className="flex flex-wrap gap-4 items-end">
                   <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">이름</label><input type="text" placeholder="예: Jacob" className="border p-2 rounded w-40 bg-white text-gray-900" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} /></div>
                   <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학교</label><input type="text" placeholder="예: 초등A교" className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.school} onChange={(e) => setNewStudent({...newStudent, school: e.target.value})} /></div>
                   <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학년</label><select className="border p-2 rounded w-24 bg-white text-gray-900" value={newStudent.grade} onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                   <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">Class</label><select className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.classInfo} onChange={(e) => setNewStudent({...newStudent, classInfo: e.target.value})}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                   <button onClick={handleAddStudent} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold">+ 등록</button>
                 </div>
                 <p className="text-xs text-indigo-600 mt-2">* 학생을 등록하면 2번 탭에 점수 입력란이 자동으로 생성됩니다.</p>
               </div>
               <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                 <h2 className="text-lg font-bold text-gray-800 mb-4">학생 목록 (DB)</h2>
                 <table className="w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="p-2 border w-16">No.</th><th className="p-2 border">이름</th><th className="p-2 border">학교</th><th className="p-2 border">학년</th><th className="p-2 border">Class</th><th className="p-2 border w-20">관리</th></tr></thead>
                   <tbody>{students.map((s, idx) => (<tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-2 border text-center">{idx + 1}</td><td className="p-2 border font-bold">{s.name}</td><td className="p-2 border">{s.school}</td><td className="p-2 border">{s.grade}</td><td className="p-2 border text-indigo-600">{s.classInfo}</td><td className="p-2 border text-center"><button onClick={() => handleDeleteStudent(s.id)} className="bg-white p-1 rounded border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16}/></button></td></tr>))}</tbody>
                 </table>
               </div>
             </div>
          )}

          {/* TAB 2: 점수 입력 */}
          {activeTab === 'input' && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">2. 점수 입력 (학생 연동형)</h2>
                <div className="text-sm text-gray-500">이름을 클릭하면 성적표로 이동합니다.</div>
              </div>
              
              <div className="flex-1 overflow-auto border rounded-lg shadow-inner bg-gray-50 relative">
                <table className="w-full text-xs text-center whitespace-nowrap bg-white border-collapse">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0 z-30 font-bold shadow-sm">
                    <tr>
                      <th className="p-2 border bg-indigo-50 sticky left-0 z-40 w-32 border-r-2 border-r-gray-300">이름 (클릭)</th>
                      <th className="p-2 border bg-indigo-50 w-20">Class</th>
                      <th colSpan="4" className="p-2 border bg-blue-100 text-blue-900 border-b-2 border-blue-300">Monthly Eval (L&S)</th>
                      <th colSpan="4" className="p-2 border bg-green-100 text-green-900 border-b-2 border-green-300">Monthly Eval (R&W)</th>
                      <th colSpan="4" className="p-2 border bg-purple-100 text-purple-900 border-b-2 border-purple-300">Class Progress</th>
                      <th colSpan="2" className="p-2 border bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300">Attitude</th>
                      <th className="p-2 border bg-gray-200 w-16 sticky right-10 z-40 shadow-l">Total</th>
                      <th className="p-2 border bg-gray-200 w-10 sticky right-0 z-40">삭제</th>
                    </tr>
                    <tr>
                      <th className="p-2 border bg-indigo-50 sticky left-0 z-40 border-r-2 border-r-gray-300"></th>
                      <th className="p-2 border bg-indigo-50"></th>
                      
                      <th className="p-1 border min-w-[40px] bg-blue-50">Recog</th><th className="p-1 border min-w-[40px] bg-blue-50">Resp</th><th className="p-1 border min-w-[40px] bg-blue-50">Retell</th><th className="p-1 border min-w-[40px] bg-blue-50">Speak</th>
                      <th className="p-1 border min-w-[40px] bg-green-50">Gram</th><th className="p-1 border min-w-[40px] bg-green-50">Writ</th><th className="p-1 border min-w-[40px] bg-green-50">Prac</th><th className="p-1 border min-w-[40px] bg-green-50">Read</th>
                      <th className="p-1 border min-w-[60px] bg-purple-50">Read</th><th className="p-1 border min-w-[60px] bg-purple-50">List</th><th className="p-1 border min-w-[60px] bg-purple-50">Writ</th><th className="p-1 border min-w-[60px] bg-purple-50">Gram</th>
                      <th className="p-1 border min-w-[60px] bg-yellow-50">Attend</th><th className="p-1 border min-w-[60px] bg-yellow-50">H.W</th>
                      <th className="p-2 border bg-gray-100 sticky right-10 z-40 shadow-l">60</th>
                      <th className="p-2 border bg-gray-100 sticky right-0 z-40"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedScores.map((row) => (
                      <tr key={row.docId} className="border-b hover:bg-indigo-50 transition-colors h-10 group">
                        <td className="p-2 border sticky left-0 bg-white z-20 border-r-2 border-r-gray-200 font-bold text-indigo-600 cursor-pointer hover:underline hover:text-indigo-800 text-left" onClick={() => handleNameClick(row.studentId)} title="성적표 보기">{row.name}</td>
                        <td className="p-2 border text-gray-500 bg-gray-50">{row.classInfo}</td>
                        
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-blue-100 outline-none h-full" value={row.ls1} onChange={e => handleEditScore(row.docId, 'ls1', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-blue-100 outline-none h-full" value={row.ls2} onChange={e => handleEditScore(row.docId, 'ls2', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-blue-100 font-bold outline-none h-full" value={row.ls3} onChange={e => handleEditScore(row.docId, 'ls3', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-blue-100 outline-none h-full" value={row.ls4} onChange={e => handleEditScore(row.docId, 'ls4', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-green-100 outline-none h-full" value={row.rw1} onChange={e => handleEditScore(row.docId, 'rw1', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-green-100 outline-none h-full" value={row.rw2} onChange={e => handleEditScore(row.docId, 'rw2', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-green-100 font-bold outline-none h-full" value={row.rw3} onChange={e => handleEditScore(row.docId, 'rw3', Number(e.target.value))} /></td>
                        <td className="p-0 border"><input type="number" className="w-full text-center p-1 bg-transparent text-gray-900 focus:bg-green-100 font-bold outline-none h-full" value={row.rw4} onChange={e => handleEditScore(row.docId, 'rw4', Number(e.target.value))} /></td>

                        {['cp_reading', 'cp_listening', 'cp_writing', 'cp_grammar', 'att_attendance', 'att_homework'].map(field => (
                          <td key={field} className="p-0 border">
                            <select className="w-full text-xs text-center bg-transparent text-gray-900 p-1 outline-none h-full" value={row[field]} onChange={e => handleEditScore(row.docId, field, e.target.value)}>
                              <option value="Excellent">Ex</option><option value="Good">Gd</option><option value="Bad">Bd</option>
                            </select>
                          </td>
                        ))}

                        <td className={`p-2 border font-bold text-lg sticky right-10 z-20 shadow-l ${row.total >= 50 ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 bg-gray-100'}`}>{row.total}</td>
                        <td className="p-0 border text-center sticky right-0 z-20 bg-white group-hover:bg-gray-50">
                          <button onClick={() => handleDeleteScoreRow(row.docId)} className="w-full h-full flex items-center justify-center text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 성적표 */}
          {activeTab === 'report' && (
            <div className="flex flex-col h-full gap-6">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                <label className="font-bold">성적표 출력 대상:</label>
                <select className="border p-2 rounded w-64 bg-white text-gray-900" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classInfo})</option>)}
                </select>
              </div>

              {selectedStudentId ? (
              <div className="flex-1 bg-white p-8 rounded-lg shadow-lg border border-gray-400 flex flex-col gap-4 max-w-4xl mx-auto w-full overflow-y-auto">
                <div className="flex justify-between items-end border-b-4 border-gray-800 pb-4">
                  <div>
                    <h1 className="text-4xl font-serif font-bold tracking-wider text-gray-900">PROGRESS REPORT</h1>
                    <div className="mt-4 text-lg font-medium space-y-1">
                      <p>Name : <span className="font-bold text-xl">{selectedStudentInfo?.name || '-'}</span></p>
                      <p>Grade : {selectedStudentInfo?.grade || '-'} &nbsp;|&nbsp; Level : {selectedStudentInfo?.classInfo || '-'}</p>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center font-serif font-bold text-xl">M<br/><span className="text-xs">ENGLISH</span></div>
                </div>

                {/* 1. Monthly Evaluation */}
                <div>
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Monthly Evaluation</h3>
                  <table className="w-full border-2 border-gray-800 text-sm">
                    <thead>
                      <tr className="bg-gray-200 border-b-2 border-gray-800">
                        <th className="p-2 border-r border-gray-400 w-1/4">영역</th><th className="p-2 border-r border-gray-400 w-1/2">세부 항목</th><th className="p-2 border-r border-gray-400">배점</th><th className="p-2">득점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReportData.length > 0 ? (
                        <>
                          <tr className="border-b border-gray-300"><td rowSpan="4" className="p-2 border-r text-center bg-blue-50 font-bold">Listening<br/>& Speaking</td><td className="p-2 border-r">Listen and Recognize</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{studentReportData[0].ls1}</td></tr>
                          <tr className="border-b border-gray-300"><td className="p-2 border-r">Listen and Respond</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{studentReportData[0].ls2}</td></tr>
                          <tr className="border-b border-gray-300"><td className="p-2 border-r">Listen and Retell</td><td className="p-2 border-r text-center">15</td><td className="p-2 text-center font-bold">{studentReportData[0].ls3}</td></tr>
                          <tr className="border-b-2 border-gray-800"><td className="p-2 border-r">Listen and Speak</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{studentReportData[0].ls4}</td></tr>
                          <tr className="border-b border-gray-300"><td rowSpan="4" className="p-2 border-r text-center bg-green-50 font-bold">Reading<br/>& Writing</td><td className="p-2 border-r">Sentence Completion</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{studentReportData[0].rw1}</td></tr>
                          <tr className="border-b border-gray-300"><td className="p-2 border-r">Situational Writing</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{studentReportData[0].rw2}</td></tr>
                          <tr className="border-b border-gray-300"><td className="p-2 border-r">Practical Reading</td><td className="p-2 border-r text-center">10</td><td className="p-2 text-center font-bold">{studentReportData[0].rw3}</td></tr>
                          <tr className="border-b-2 border-gray-800"><td className="p-2 border-r">Reading & Retelling</td><td className="p-2 border-r text-center">10</td><td className="p-2 text-center font-bold">{studentReportData[0].rw4}</td></tr>
                          <tr className="bg-gray-100 font-bold"><td colSpan="2" className="p-2 border-r text-center">TOTAL SCORE</td><td className="p-2 border-r text-center">60</td><td className="p-2 text-center text-indigo-700 text-lg">{studentReportData[0].total}</td></tr>
                        </>
                      ) : <tr><td colSpan="4" className="p-4 text-center text-gray-400">데이터 없음</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* 2. Class Progress & 3. Detail Analysis & Attitude & AI Comment */}
                {studentReportData.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Class Progress</h3>
                      <table className="w-full border-2 border-gray-800 text-sm text-center">
                        <thead className="bg-gray-200 border-b-2 border-gray-800"><tr><th className="p-2 border-r border-gray-400 w-1/4">Reading</th><th className="p-2 border-r border-gray-400 w-1/4">Listening</th><th className="p-2 border-r border-gray-400 w-1/4">Writing</th><th className="p-2 w-1/4">Grammar</th></tr></thead>
                        <tbody><tr className="border-b border-gray-800"><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{studentReportData[0].cp_reading}</td><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{studentReportData[0].cp_listening}</td><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{studentReportData[0].cp_writing}</td><td className="p-2 font-bold text-indigo-700">{studentReportData[0].cp_grammar}</td></tr></tbody>
                      </table>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="h-56 border-2 border-gray-800 p-2 relative rounded-sm">
                          <h4 className="absolute top-2 left-2 font-bold text-sm bg-white px-1 z-10">* Detail Analysis</h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="55%" outerRadius="70%" data={[
                                { subject: 'Recognize', A: ((studentReportData[0]?.ls1 || 0) / 5) * 100, full: 5 },
                                { subject: 'Respond', A: ((studentReportData[0]?.ls2 || 0) / 5) * 100, full: 5 },
                                { subject: 'L-Retell', A: ((studentReportData[0]?.ls3 || 0) / 15) * 100, full: 15 },
                                { subject: 'Speak', A: ((studentReportData[0]?.ls4 || 0) / 5) * 100, full: 5 },
                                { subject: 'Grammar', A: ((studentReportData[0]?.rw1 || 0) / 5) * 100, full: 5 },
                                { subject: 'Writing', A: ((studentReportData[0]?.rw2 || 0) / 5) * 100, full: 5 },
                                { subject: 'Reading', A: ((studentReportData[0]?.rw3 || 0) / 10) * 100, full: 10 },
                                { subject: 'R-Retell', A: ((studentReportData[0]?.rw4 || 0) / 10) * 100, full: 10 },
                              ]}>
                              <PolarGrid gridType="polygon" />
                              <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                              <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
                              <Legend verticalAlign="bottom" height={20}/>
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="border-2 border-gray-800 p-4 rounded-sm flex flex-col justify-center bg-gray-50">
                          <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-300 pb-2">* Class Attitude</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Attendance</span><span className={`font-bold px-3 py-1 rounded text-white ${studentReportData[0]?.att_attendance === 'Excellent' ? 'bg-green-600' : studentReportData[0]?.att_attendance === 'Good' ? 'bg-blue-500' : 'bg-red-400'}`}>{studentReportData[0]?.att_attendance || '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Homework</span><span className={`font-bold px-3 py-1 rounded text-white ${studentReportData[0]?.att_homework === 'Excellent' ? 'bg-green-600' : studentReportData[0]?.att_homework === 'Good' ? 'bg-blue-500' : 'bg-red-400'}`}>{studentReportData[0]?.att_homework || '-'}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 border-2 border-gray-800 p-4 rounded-sm bg-indigo-50 relative">
                        <div className="flex justify-between items-center mb-3 border-b-2 border-gray-300 pb-2">
                          <h3 className="font-bold text-lg flex items-center gap-2">* Teacher's Comment</h3>
                          <button onClick={generateAIComment} disabled={isGeneratingAI} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded text-xs font-bold shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingAI ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                            {isGeneratingAI ? '생성 중...' : 'AI 코멘트 생성'}
                          </button>
                        </div>
                        <textarea 
                          className="w-full h-64 p-3 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-indigo-300 outline-none resize-none text-sm leading-relaxed text-gray-900"
                          placeholder="AI 버튼을 누르거나 직접 입력하세요."
                          value={studentReportData[0]?.teacher_comment || ''}
                          onChange={(e) => handleEditScore(studentReportData[0].docId, 'teacher_comment', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              ) : <div className="text-center p-10 text-gray-500">학생을 선택해주세요.</div>}
            </div>
          )}

          {/* TAB 4: 통계 */}
          {activeTab === 'dashboard' && (
             <div className="flex flex-col gap-6 h-full">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg flex items-center gap-2"><PieChart size={20}/> 통계 기준 선택:</span>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setStatCriteria('class')} className={`px-4 py-2 rounded-md text-sm font-medium ${statCriteria === 'class' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>클래스 레벨별</button>
                      <button onClick={() => setStatCriteria('grade')} className={`px-4 py-2 rounded-md text-sm font-medium ${statCriteria === 'grade' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>학년별(Grade)</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">평균 점수 비교</h3>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statisticsData} layout="vertical" margin={{ left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 30]} hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                          <RechartsTooltip cursor={{fill: 'transparent'}} />
                          <Legend wrapperStyle={{paddingTop: '20px'}}/>
                          <Bar dataKey="lsAvg" fill="#60a5fa" name="L&S 평균" radius={[0, 4, 4, 0]} barSize={20} />
                          <Bar dataKey="rwAvg" fill="#34d399" name="R&W 평균" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">상세 데이터</h3>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm text-center">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr><th className="p-3 border">구분</th><th className="p-3 border">인원</th><th className="p-3 border text-blue-700">L&S 평균</th><th className="p-3 border text-green-700">R&W 평균</th><th className="p-3 border bg-gray-200">총점 평균</th></tr>
                        </thead>
                        <tbody>
                          {statisticsData.map((d, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="p-3 border font-bold text-indigo-900">{d.name}</td>
                              <td className="p-3 border">{d.count}명</td>
                              <td className="p-3 border bg-blue-50 font-medium">{d.lsAvg}</td>
                              <td className="p-3 border bg-green-50 font-medium">{d.rwAvg}</td>
                              <td className="p-3 border font-bold bg-gray-100">{d.totalAvg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MickeyExcelApp;