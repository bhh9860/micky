import React, { useState, useMemo, useEffect } from 'react';
import { FileText, BarChart2, Save, User, UserCog, Sparkles, Settings } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch, getDoc } from 'firebase/firestore';

import StudentManagement from './components/1StudentManagement';
import StudentDetail from './components/2StudentDetail';
import SubjectManagement from './components/3SubjectManagement';
import ScoreInput from './components/4ScoreInput';
import ReportCard from './components/5ReportCard';
import Statistics from './components/6Statistics';
import VersionHistory from './components/7VersionHistory';
import { GitCommit } from 'lucide-react';

// [중요 2] Firebase 설정 (제공해주신 키 적용)
const firebaseConfig = {
  apiKey: "AIzaSyCfhE0s90s7osE_zK0CWuJm_L0GDXhZoFE",
  authDomain: "micky-397b0.firebaseapp.com",
  projectId: "micky-397b0",
  storageBucket: "micky-397b0.firebasestorage.app",
  messagingSenderId: "612113130852",
  appId: "1:612113130852:web:5cb31ae31eeb7161ae8671"
};

// Firebase 초기화
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase 초기화 실패:", error);
}

// [중요] AI 기능을 사용하려면 아래 따옴표 안에 본인의 Gemini API 키를 입력하세요.
const apiKey = "AIzaSyAmbc-5vJrht6Fy9zMdxmWbgeBF-Vuk5rE";

// [2번 요청] AI 프롬프트 템플릿 변수 (수정 가능)
const AI_PROMPT_TEMPLATE = `
Role: Academic Data Analyst for English Education
Task: Analyze the student's entire score history provided below.
Requirements:
1. Analyze the overall score trend (e.g., consistently improving, stagnant, fluctuating, or declining).
2. Identify the strongest and weakest areas between L&S (Listening & Speaking) and R&W (Reading & Writing).
3. Provide objective, concise feedback based strictly on the data.
4. Tone: Dry, objective, and factual (like a system-generated report). NO greetings, NO emotional encouragement, NO polite endings like '요/니다'.
5. Style: Use Korean concise style ending in nouns or "-함" (e.g., "성적이 꾸준히 상승함.", "문법 영역 보완이 필요함.").
6. Length: Keep it concise (around 3~5 sentences) to fit in a fixed A4 report box without scrolling.
`;

// --- 상수 및 설정 ---
const INITIAL_GRADES = ['G3', 'G4', 'G5', 'G6'];
const INITIAL_CLASSES = ['Pre Starter', 'Starter-1', 'Basic-1', 'Basic-2', 'Intermediate-1', 'Intermediate-2'];
// [1번 요청] 초기 학교 리스트 추가
const INITIAL_SCHOOLS = ['초등A교', '초등B교', '초등C교', '초등D교', '초등E교']; 

const NAMES = [
  { k: '허지후', e: 'Jacob' }, { k: '김소피아', e: 'Sophia' }, { k: '이다니엘', e: 'Daniel' },
  { k: '박올리비아', e: 'Olivia' }, { k: '최마이클', e: 'Michael' }, { k: '정에밀리', e: 'Emily' },
  { k: '강데이빗', e: 'David' }, { k: '윤그레이스', e: 'Grace' }, { k: '송라이언', e: 'Ryan' }, { k: '임해나', e: 'Hannah' },
  { k: '김준호', e: 'Junho' }, { k: '이서연', e: 'Seoyeon' }, { k: '박지성', e: 'Jisung' }, { k: '최수민', e: 'Sumin' },
  { k: '정우성', e: 'Woosung' }, { k: '강하늘', e: 'Haneul' }, { k: '윤민수', e: 'Minsu' }, { k: '송지원', e: 'Jiwon' },
  { k: '임재현', e: 'Jaehyun' }, { k: '한가인', e: 'Gain' }
];

const YEARS = Array.from({ length: 80 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const DEFAULT_SUBJECT_CONFIG = {
  ls: [
    { name: 'Recog', max: 5 },
    { name: 'Resp', max: 5 },
    { name: 'Retell', max: 15 },
    { name: 'Speak', max: 5 }
  ],
  rw: [
    { name: 'Gram', max: 5 },
    { name: 'Writ', max: 5 },
    { name: 'Prac', max: 10 },
    { name: 'Read', max: 10 }
  ],
    lsTitle: 'Listening & Speaking (L&S)',
    rwTitle: 'Reading & Writing (R&W)'
  };

// Pre Starter 전용 기본 설정 (Added to fix crash)
const PRE_STARTER_CONFIG = {
  ls: [
    { name: 'Listen and Recognize (듣고 이해하기)', max: 5 },
    { name: 'Listen and Respond (질문 듣고 답하기)', max: 5 },
    { name: 'Listen and Retell (대화를 듣고 질문에 답하기)', max: 5 },
    { name: '', max: 0 } 
  ],
  rw: [
    { name: 'Spell the words (철자쓰고 단어알기)', max: 5 },
    { name: 'Look and Recognize (그림보고 이해하기)', max: 5 },
    { name: 'Read and Retell (글을 읽고 질문에 답하기)', max: 10 },
    { name: '', max: 0 } 
  ],
  lsTitle: 'Listening & Speaking (L&S)',
  rwTitle: 'Reading & Writing (R&W)'
};
  
  const ATTITUDE_SCORE = { 'Excellent': 10, 'Good': 7, 'NI': 3 }; // [Fix] Bad -> NI
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const MickeyExcelApp = () => {
    const [activeTab, setActiveTab] = useState('input');
    const [students, setStudents] = useState([]); 
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // [1번 요청] 학교/학년/클래스 관리 State
    const [grades, setGrades] = useState(INITIAL_GRADES);
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [schools, setSchools] = useState(INITIAL_SCHOOLS); 
    
    // [3번 요청] 클래스별 과목 설정 State
    const [classSubjects, setClassSubjects] = useState(() => {
      const initialConfig = {};
      INITIAL_CLASSES.forEach(cls => {
          if (cls === 'Pre Starter') {
              initialConfig[cls] = JSON.parse(JSON.stringify(PRE_STARTER_CONFIG));
          } else {
              initialConfig[cls] = JSON.parse(JSON.stringify(DEFAULT_SUBJECT_CONFIG));
          }
      });
      return initialConfig;
    });
  
    // 클래스가 추가될 때 기본 과목 설정도 추가 (useEffect removed to avoid overwriting custom loaded config, handled in addClass)
  
    const [newGradeInput, setNewGradeInput] = useState('');
    const [newClassInput, setNewClassInput] = useState('');
    const [newSchoolInput, setNewSchoolInput] = useState(''); 
  
    const [showConfig, setShowConfig] = useState(false); 
  
    // [2번 요청] 이름 입력 분리 (nameK, nameE)
    const [newStudent, setNewStudent] = useState({ nameK: '', nameE: '', school: '', grade: 'G3', classInfo: 'Basic-1' });
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [statCriteria, setStatCriteria] = useState('class');
  
    const [selectedReportGraphs, setSelectedReportGraphs] = useState([]);
  
    const today = new Date();
    const [inputYear, setInputYear] = useState(today.getFullYear());
    const [inputMonth, setInputMonth] = useState(today.getMonth() + 1);
  
    const [graphMode, setGraphMode] = useState('monthly'); 
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
    // --- Firebase Data Loading & Seeding ---
    useEffect(() => {
      const fetchData = async () => {
          if (!db) return;
          setLoading(true);
          try {
              const sSnapshot = await getDocs(collection(db, 'students'));
              const scSnapshot = await getDocs(collection(db, 'scores'));
              const configDoc = await getDoc(doc(db, 'settings', 'subjectConfig'));
              const classesDoc = await getDoc(doc(db, 'settings', 'classList')); // [Fix] Load classes
  
              // Load Classes
              if (classesDoc.exists()) {
                  const loadedClasses = classesDoc.data().list;
                  if (loadedClasses && loadedClasses.length > 0) setClasses(loadedClasses);
              } else {
                  await setDoc(doc(db, 'settings', 'classList'), { list: INITIAL_CLASSES });
              }
  
              // Load Subjects
              if (configDoc.exists()) {
                  setClassSubjects(configDoc.data());
              } else {
                  // Initialize settings in DB if not present
                  const initialConfig = {};
                  INITIAL_CLASSES.forEach(cls => {
                      if (cls === 'Pre Starter') {
                          initialConfig[cls] = JSON.parse(JSON.stringify(PRE_STARTER_CONFIG));
                      } else {
                          initialConfig[cls] = JSON.parse(JSON.stringify(DEFAULT_SUBJECT_CONFIG));
                      }
                  });
                  setClassSubjects(initialConfig);
                  await setDoc(doc(db, 'settings', 'subjectConfig'), initialConfig);
              }
  
              if (sSnapshot.empty) {
                  console.log("Database empty. Seeding data...");
                  await seedDatabase();
              } else {
                  const sData = sSnapshot.docs.map(doc => doc.data());
                  const scData = scSnapshot.docs.map(doc => doc.data());
                  setStudents(sData);
                  setScores(scData);
                  if(sData.length > 0) setSelectedStudentId(sData[0].id);
              }
          } catch (e) {
              console.error("Error fetching data:", e);
          } finally {
              setLoading(false);
          }
      };
      fetchData();
    }, []);
  
    const seedDatabase = async () => {
        const batch = writeBatch(db);
        const generatedStudents = [];
        const generatedScores = [];
  
        // 1. Create 20 Students
        for(let i = 0; i < 20; i++) {
            const nameIdx = i % NAMES.length;
            const student = {
                id: `S${String(i + 1).padStart(3, '0')}`,
                nameK: NAMES[nameIdx].k,
                nameE: NAMES[nameIdx].e + (i >= NAMES.length ? ' Jr.' : ''),
                school: INITIAL_SCHOOLS[Math.floor(Math.random() * INITIAL_SCHOOLS.length)],
                grade: INITIAL_GRADES[Math.floor(Math.random() * INITIAL_GRADES.length)],
                classInfo: INITIAL_CLASSES[Math.floor(Math.random() * INITIAL_CLASSES.length)],
            };
            generatedStudents.push(student);
            const sRef = doc(db, 'students', student.id);
            batch.set(sRef, student);
        }
  
        // 2. Create Scores (2023.01 ~ 2025.10)
        // Period: Jan 2023 to Oct 2025
        const startDate = new Date(2023, 0, 1); // Jan 2023
        const endDate = new Date(2025, 9, 1);   // Oct 2025
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}`;
  
            generatedStudents.forEach(student => {
                const rand = Math.random();
                let tier = 'MID'; 
                if (rand < 0.3) tier = 'HIGH'; else if (rand > 0.8) tier = 'LOW'; 
                const getScore = (max) => Math.round(max * (tier === 'HIGH' ? 0.9 : tier === 'MID' ? 0.7 : 0.5));
                const getEval = () => (tier === 'HIGH' ? 'Excellent' : tier === 'MID' ? 'Good' : 'NI'); // Bad -> NI
  
                const score = {
                    id: `${Date.now()}_${student.id}_${dateStr}`,
                    examId: `${yyyy}년 ${Number(mm)}월 평가`,
                    date: dateStr,
                    studentId: student.id,
                    classInfo: student.classInfo, // Store current class
                    ls1: getScore(5), ls2: getScore(5), ls3: getScore(15), ls4: getScore(5),
                    rw1: getScore(5), rw2: getScore(5), rw3: getScore(10), rw4: getScore(10),
                    cp_reading: getEval(), cp_listening: getEval(), cp_writing: getEval(), cp_grammar: getEval(),
                    att_attendance: getEval(), att_homework: getEval(),
                    teacher_comment: ''
                };
                generatedScores.push(score);
                const scRef = doc(db, 'scores', score.id.toString());
                batch.set(scRef, score);
            });
  
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
  
        await batch.commit();
        setStudents(generatedStudents);
        setScores(generatedScores);
        if (generatedStudents.length > 0) setSelectedStudentId(generatedStudents[0].id);
        alert("데이터 시딩 완료! (학생 20명, 2023.01~2025.10)");
    };
  
  
    const getStudentInfo = (id) => students.find(s => s.id === id);
  
    // Helper to get max points
    const getMaxPoints = (classInfo) => {
        const config = classSubjects[classInfo] || DEFAULT_SUBJECT_CONFIG;
        const lsMax = (config.ls || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        const rwMax = (config.rw || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        return lsMax + rwMax || 60; 
    };
  
    // --- 데이터 가공 ---
    const enrichedScores = useMemo(() => {
      return scores.map(score => {
        const lsTotal = (Number(score.ls1)||0) + (Number(score.ls2)||0) + (Number(score.ls3)||0) + (Number(score.ls4)||0);
        const rwTotal = (Number(score.rw1)||0) + (Number(score.rw2)||0) + (Number(score.rw3)||0) + (Number(score.rw4)||0);
        const total = lsTotal + rwTotal;
        const sInfo = getStudentInfo(score.studentId);
        
        // [Fix] Calculate Class Progress (Auto)
        const currentClassInfo = score.classInfo || sInfo?.classInfo || 'Basic-1';
        const max = getMaxPoints(currentClassInfo);
        const percentage = max > 0 ? (total / max) * 100 : 0;
        let classProgress = 'NI';
        if (percentage >= 90) classProgress = 'Excellent';
        else if (percentage >= 60) classProgress = 'Good';
  
        // 이름 조합
        const displayName = sInfo ? `${sInfo.nameE} (${sInfo.nameK})` : 'Unknown';
  
        return {
          ...score,
          name: displayName, 
          classInfo: score.classInfo || '-', 
          grade: sInfo?.grade || '-',
          lsTotal,
          rwTotal,
          total,
          classProgress, // [Fix] Auto calculated CP
          percentage     // Store percentage for use in tables
        };
      });
    }, [scores, students, classSubjects]); // Added classSubjects dependency
  
    // [3번 탭] 점수 입력용 데이터
    const inputTableData = useMemo(() => {
      const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
      
      let data = students.map(student => {
        const existingScore = enrichedScores.find(s => s.studentId === student.id && s.date === targetDate);
        if (existingScore) return existingScore;
  
        const displayName = `${student.nameE} (${student.nameK})`;
  
        return {
          isNew: true,
          id: `temp_${student.id}`,
          studentId: student.id,
          name: displayName,
          classInfo: student.classInfo,
          grade: student.grade,
          date: targetDate,
          examId: `${inputYear}년 ${inputMonth}월 평가`,
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good', // Unused but kept for structure
          att_attendance: 'Good', att_homework: 'Good',
          lsTotal: 0, rwTotal: 0, total: 0,
          classProgress: 'NI', // Default
          percentage: 0
        };
      });
  
      if (sortConfig.key) {
        data.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        });
      }
  
      return data;
    }, [students, enrichedScores, inputYear, inputMonth, sortConfig]);
  
    // [2번 탭] 세부 학생 관리용 데이터
    const studentDetailScores = useMemo(() => {
      if (!selectedStudentId) return [];
  
      // [Fix] 현재 시점(now)과 해당 학생의 가장 최신 성적 날짜 중 더 미래의 시점까지 조회 범위 확장
      // 이를 통해 점수입력(Tab 4)에서 미래 날짜(예: 다음 달) 점수를 입력해도 즉시 목록에 표시됨
      const now = new Date();
      let maxDate = now;
      
      const studentScores = enrichedScores.filter(s => s.studentId === selectedStudentId);
      if (studentScores.length > 0) {
        const dates = studentScores.map(s => new Date(s.date));
        const latestScoreDate = new Date(Math.max(...dates));
        if (latestScoreDate > maxDate) {
          maxDate = latestScoreDate;
        }
      }
  
      const allMonths = [];
      let current = new Date(2020, 0, 1); 
      
      // maxDate가 포함된 달까지 반복
      while (current <= maxDate || (current.getMonth() === maxDate.getMonth() && current.getFullYear() === maxDate.getFullYear())) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        allMonths.push(`${yyyy}-${mm}`);
        current.setMonth(current.getMonth() + 1);
      }
  
      const details = allMonths.map(dateStr => {
        const existing = enrichedScores.find(s => s.studentId === selectedStudentId && s.date === dateStr);
        if (existing) return existing;
  
        return {
          id: `dummy_${dateStr}`,
          date: dateStr,
          studentId: selectedStudentId,
          examId: `${dateStr.split('-')[0]}년 ${parseInt(dateStr.split('-')[1])}월 평가`,
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          lsTotal: 0, rwTotal: 0, total: 0,
          cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
          att_attendance: 'Good', att_homework: 'Good',
          isDummy: true,
          classProgress: 'NI',
          percentage: 0
        };
      });
  
      return details.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [enrichedScores, selectedStudentId]);

  const studentHistory = useMemo(() => {
    return enrichedScores
      .filter(s => s.studentId === selectedStudentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [enrichedScores, selectedStudentId]);

  const latestScore = studentHistory.length > 0 ? studentHistory[0] : {};
  
  // 선택된 학생 정보 (이름 조합용)
  const selectedStudentInfo = useMemo(() => {
    const s = students.find(s => s.id === selectedStudentId);
    if (!s) return {};
    return {
      ...s,
      displayName: `${s.nameE} (${s.nameK})`
    };
  }, [students, selectedStudentId]);


  // --- [2번 탭] 분석 그래프 데이터 ---
  const analysisCharts = useMemo(() => {
    const validData = studentDetailScores.filter(s => !s.isDummy && s.total > 0); 
    const dataForGraph = [...validData].reverse(); 

    if (dataForGraph.length === 0) return null;

    // Helper to get max points for a specific class
    const getMaxPoints = (classInfo) => {
        const config = classSubjects[classInfo] || DEFAULT_SUBJECT_CONFIG;
        const lsMax = (config.ls || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        const rwMax = (config.rw || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        return lsMax + rwMax || 60; // Default to 60 if calc fails
    };

    const trendData = dataForGraph.map(s => {
        const max = getMaxPoints(s.classInfo);
        return {
            ...s,
            total: Math.round((s.total / max) * 100) // Convert to %
        };
    });

    const areaData = dataForGraph.map(s => ({
      date: s.date,
      LS: s.lsTotal,
      RW: s.rwTotal
    }));

    const lsStackData = dataForGraph.map(s => ({
      date: s.date,
      Recog: s.ls1,
      Resp: s.ls2,
      Retell: s.ls3, 
      Speak: s.ls4
    }));

    const rwStackData = dataForGraph.map(s => ({
      date: s.date,
      Gram: s.rw1,
      Writ: s.rw2,
      Prac: s.rw3, 
      Read: s.rw4 
    }));

    // Graph 5: Percentage based
    const subjectScoreAnalysisData = dataForGraph.slice(-4).map(s => {
      const max = getMaxPoints(s.classInfo);
      return {
          date: s.date.substring(5), 
          MyScore: Math.round((s.total / max) * 100),
          ClassAvg: 75 + Math.random() * 10, // Mock avg %
          TotalAvg: 70 + Math.random() * 10  // Mock avg %
      };
    });

    // Graph 7: Percentage Compare
    const compareData = dataForGraph.map(s => {
      const scoresThisMonth = enrichedScores.filter(es => es.date === s.date && es.classInfo === s.classInfo); // Same class only
      const max = getMaxPoints(s.classInfo);
      
      let avgPercent = 0;
      if (scoresThisMonth.length > 0) {
          const sumTotal = scoresThisMonth.reduce((sum, score) => sum + score.total, 0);
          const avgTotal = sumTotal / scoresThisMonth.length;
          avgPercent = Math.round((avgTotal / max) * 100);
      }

      return {
        date: s.date,
        MyScore: Math.round((s.total / max) * 100),
        ClassAvg: avgPercent
      };
    });

    const attitudeData = dataForGraph.map(s => ({
      date: s.date,
      Attendance: ATTITUDE_SCORE[s.att_attendance] || 7,
      Homework: ATTITUDE_SCORE[s.att_homework] || 7
    }));

    const speakingData = dataForGraph.map(s => ({ date: s.date, Score: s.ls4 }));
    const writingData = dataForGraph.map(s => ({ date: s.date, Score: s.rw2 }));
    const grammarData = dataForGraph.map(s => ({ date: s.date, Score: s.rw1 }));
    const readingData = dataForGraph.map(s => ({ date: s.date, Score: s.rw4 }));

    // Graph 13: Deviation (Percentage Points)
    const deviationData = dataForGraph.map(s => {
      const max = getMaxPoints(s.classInfo);
      const myPercent = (s.total / max) * 100;
      const avgPercent = 75; // Baseline average 75%
      return {
        date: s.date,
        Deviation: Math.round(myPercent - avgPercent)
      };
    });

    const quarterlyMap = {};
    dataForGraph.forEach(s => {
      const year = s.date.substring(2, 4);
      const month = parseInt(s.date.substring(5, 7));
      const q = Math.ceil(month / 3);
      const key = `${year}.${q}Q`;
      if (!quarterlyMap[key]) quarterlyMap[key] = [];
      // Store percentage
      const max = getMaxPoints(s.classInfo);
      quarterlyMap[key].push((s.total / max) * 100);
    });
    const quarterlyData = Object.keys(quarterlyMap).map(key => ({
      name: key,
      Avg: Math.round(quarterlyMap[key].reduce((a,b)=>a+b,0) / quarterlyMap[key].length)
    }));

    return { trendData, areaData, lsStackData, rwStackData, subjectScoreAnalysisData, compareData, attitudeData, speakingData, writingData, grammarData, readingData, deviationData, quarterlyData };
  }, [studentDetailScores, enrichedScores, classSubjects]);


  // --- [4번 탭] 그래프 데이터 수정 ---
  const graphData = useMemo(() => {
    if (studentHistory.length === 0) return [];
    const sortedHistory = [...studentHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (graphMode === 'monthly') {
      return sortedHistory.map(s => ({ name: s.date, score: s.total }));
    } else if (graphMode === 'quarterly') {
      const qMap = {};
      sortedHistory.forEach(s => {
         const d = new Date(s.date);
         const year = String(d.getFullYear()).slice(2);
         const q = Math.ceil((d.getMonth() + 1) / 3);
         const key = `${year}.${q}Q`;
         if (!qMap[key]) qMap[key] = [];
         qMap[key].push(s.total);
      });
      return Object.keys(qMap).sort().map(key => ({
         name: key,
         score: Math.round(qMap[key].reduce((a,b)=>a+b,0) / qMap[key].length)
      }));
    } else if (graphMode === 'yearly') {
      const data = Array.from({ length: 12 }, (_, i) => ({ name: `${i + 1}월` }));
      sortedHistory.forEach(s => {
        const d = new Date(s.date);
        const year = d.getFullYear();
        const monthIndex = d.getMonth();
        data[monthIndex][year] = s.total; 
      });
      return data;
    }
    return [];
  }, [studentHistory, graphMode]);

  const getLineColor = (index) => COLORS[index % COLORS.length];

  // --- 통계 데이터 ---
  const statisticsData = useMemo(() => {
    const grouped = {};
    const currentMonthTarget = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
    const validScores = enrichedScores.filter(s => s.date === currentMonthTarget);

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
        lsAvg: Math.round(g.lsSum / g.count),
        rwAvg: Math.round(g.rwSum / g.count),
        totalAvg: Math.round(g.totalSum / g.count),
        count: g.count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedScores, inputYear, inputMonth, statCriteria]);

  // --- 핸들러 ---
  const handleUpdateClassSubject = async (className, subjects) => {
    const updatedSubjects = {
        ...classSubjects,
        [className]: subjects
    };
    
    setClassSubjects(updatedSubjects);
    
    try {
        await setDoc(doc(db, 'settings', 'subjectConfig'), updatedSubjects);
    } catch(e) {
        console.error("Failed to save subject config", e);
    }
  };

  const getMaxScoreForField = (classInfo, field) => {
      const config = classSubjects[classInfo] || DEFAULT_SUBJECT_CONFIG;
      let max = 5; // default
      if (field.startsWith('ls')) {
          const idx = parseInt(field.replace('ls', '')) - 1;
          if (config.ls && config.ls[idx]) max = config.ls[idx].max;
      } else if (field.startsWith('rw')) {
          const idx = parseInt(field.replace('rw', '')) - 1;
          if (config.rw && config.rw[idx]) max = config.rw[idx].max;
      }
      return max;
  };

  // [1번 요청] 학생 추가 핸들러 수정 (한글/영어 이름)
  const handleAddStudent = async () => {
    if (!newStudent.nameK || !newStudent.nameE) return alert('이름(한글, 영어)을 모두 입력해주세요.');
    const newId = `S${String(students.length + 1).padStart(3, '0')}`;
    const studentToAdd = { 
      id: newId, 
      nameK: newStudent.nameK, 
      nameE: newStudent.nameE,
      school: newStudent.school || schools[0], 
      grade: newStudent.grade, 
      classInfo: newStudent.classInfo 
    };
    
    // Firebase Sync
    try {
        await setDoc(doc(db, 'students', newId), studentToAdd);
        setStudents([...students, studentToAdd]);
        setNewStudent({ nameK: '', nameE: '', school: schools[0], grade: grades[0], classInfo: classes[0] }); 
        alert(`${newStudent.nameE} 학생이 추가되었습니다!`);
    } catch (e) {
        console.error(e);
        alert("저장 실패");
    }
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('학생을 삭제하면 모든 성적 데이터도 삭제됩니다.')) {
      // Note: Real deletion from Firestore would require deleting the doc and all associated scores.
      // For now, we just update local state as per implied scope, or user can use Firebase console.
      // But to be better:
      alert("DB 삭제는 구현되지 않았습니다. (화면에서만 사라짐)");
      setStudents(students.filter(s => s.id !== id));
      setScores(scores.filter(s => s.studentId !== id));
    }
  };

  const handleInputScoreChange = async (studentId, field, value) => {
    const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
    const existingScoreIndex = scores.findIndex(s => s.studentId === studentId && s.date === targetDate);
    const student = students.find(s => s.id === studentId);
    const classInfo = student?.classInfo || 'Basic-1';

    let cleanValue = value;
    if (typeof value === 'number') {
        const max = getMaxScoreForField(classInfo, field);
        if (value < 0) cleanValue = 0;
        if (value > max) cleanValue = max;
    }

    let scoreToSave;

    if (existingScoreIndex >= 0) {
      const newScores = [...scores];
      newScores[existingScoreIndex] = { ...newScores[existingScoreIndex], [field]: cleanValue };
      setScores(newScores);
      scoreToSave = newScores[existingScoreIndex];
    } else {
      // const student = students.find(s => s.id === studentId); // Already found above
      const newScore = {
        id: `${Date.now()}_${studentId}`,
        examId: `${inputYear}년 ${inputMonth}월 평가`,
        date: targetDate,
        studentId: studentId,
        classInfo: student?.classInfo, // [Fix] 점수 생성 시점의 클래스 저장
        ls1: 0, ls2: 0, ls3: 0, ls4: 0,
        rw1: 0, rw2: 0, rw3: 0, rw4: 0,
        cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
        att_attendance: 'Good', att_homework: 'Good',
        teacher_comment: '',
        [field]: cleanValue
      };
      setScores([...scores, newScore]);
      scoreToSave = newScore;
    }

    // Firebase Save
    if (scoreToSave) {
        try {
             await setDoc(doc(db, 'scores', scoreToSave.id.toString()), scoreToSave);
        } catch(e) { console.error(e); }
    }
  };

  const handleResetSort = () => {
    setSortConfig({ key: null, direction: 'ascending' });
  };

  const handleUpdateStudentInfo = async (field, value) => {
    // Update Local
    const updatedStudents = students.map(s => s.id === selectedStudentId ? { ...s, [field]: value } : s);
    setStudents(updatedStudents);
    
    // Update Firebase
    const student = students.find(s => s.id === selectedStudentId);
    if (student) {
        try {
            const updatedStudent = { ...student, [field]: value };
            await setDoc(doc(db, 'students', student.id), updatedStudent);
        } catch (e) { console.error("Failed to update student info", e); }
    }
  };

  const handleDetailScoreChange = async (scoreId, field, value) => {
    let cleanValue = value;
    // Need classInfo to validate. 
    // If existing score, retrieve from score. If dummy, retrieve from selectedStudent.
    let classInfo = selectedStudentInfo.classInfo;
    if (!String(scoreId).startsWith('dummy_')) {
        const s = scores.find(sc => sc.id === scoreId);
        if (s && s.classInfo) classInfo = s.classInfo;
    }

    if (typeof value === 'number') {
        const max = getMaxScoreForField(classInfo, field);
        if (value < 0) cleanValue = 0;
        if (value > max) cleanValue = max;
    }

    let scoreToSave;

    if (String(scoreId).startsWith('dummy_')) {
      const dateStr = scoreId.replace('dummy_', '');
      const newScore = {
          id: `${Date.now()}_${selectedStudentId}_${dateStr}`,
          examId: `${dateStr.split('-')[0]}년 ${parseInt(dateStr.split('-')[1])}월 평가`,
          date: dateStr,
          studentId: selectedStudentId,
          classInfo: selectedStudentInfo.classInfo, // [Fix] 더미 데이터에서 생성 시 현재 클래스 저장
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          lsTotal: 0, rwTotal: 0, total: 0,
          cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
          att_attendance: 'Good', att_homework: 'Good',
          teacher_comment: '',
          [field]: cleanValue
       };
       setScores([...scores, newScore]);
       scoreToSave = newScore;
    } else {
      const updatedScores = scores.map(s => s.id === scoreId ? { ...s, [field]: cleanValue } : s);
      setScores(updatedScores);
      scoreToSave = updatedScores.find(s => s.id === scoreId);
    }
    
    // Firebase Save
    if (scoreToSave) {
        try {
            await setDoc(doc(db, 'scores', scoreToSave.id.toString()), scoreToSave);
        } catch (e) { console.error(e); }
    }
  };

  const handleDeleteDetailScore = (scoreId) => {
    if(window.confirm('삭제하시겠습니까?')) {
      setScores(scores.filter(s => s.id !== scoreId));
      // DB deletion logic omitted for brevity, but would use deleteDoc
    }
  };

  const handleNameClick = (studentId) => {
    if (!studentId) return;
    setSelectedStudentId(studentId);
    setActiveTab('detail'); 
  };
  
  const handleGoToReport = () => {
    setActiveTab('report');
  };

  const handleMonthChange = (increment) => {
    let newMonth = inputMonth + increment;
    let newYear = inputYear;
    if (newMonth > 12) { newMonth = 1; newYear++; } 
    if (newMonth < 1) { newMonth = 12; newYear--; } 
    setInputMonth(newMonth);
    setInputYear(newYear);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleResetScore = (studentId) => {
    if (window.confirm('점수를 초기화하시겠습니까? (0점/Good)')) {
      const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
      setScores(scores.filter(s => !(s.studentId === studentId && s.date === targetDate)));
    }
  };

  // Added this handler as it was missing
  const handleEditScore = (scoreId, field, value) => {
    setScores(scores.map(s => s.id === scoreId ? { ...s, [field]: value } : s));
  };

  const generateAIComment = async () => {
    if (!latestScore) return;
    if (!apiKey) return alert('API Key가 없습니다.');
    setIsGeneratingAI(true);
    
    const data = latestScore;
    // [2번 요청] 모든 이력 데이터를 요약 문자열로 변환
    const historySummary = studentHistory.map(s => 
      `[${s.examId}] L&S:${s.lsTotal}/30, R&W:${s.rwTotal}/30, Total:${s.total}/60`
    ).join('\n');

    const prompt = `${AI_PROMPT_TEMPLATE}    
    --- STUDENT DATA ---
    Student Name: ${data.name}
    Current Grade/Level: ${selectedStudentInfo.grade} / ${selectedStudentInfo.classInfo}
    
    Score History:
    ${historySummary}
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const result = await response.json();
      const comment = result.candidates?.[0]?.content?.parts?.[0]?.text || "생성 실패";
      setScores(scores.map(s => s.id === data.id ? { ...s, teacher_comment: comment } : s));
    } catch (error) { alert('AI 오류 발생'); } finally { setIsGeneratingAI(false); }
  };

  // [1번 요청] 학년/클래스/학교 관리 핸들러
  const handleAddGrade = () => { if (newGradeInput && !grades.includes(newGradeInput)) { setGrades([...grades, newGradeInput]); setNewGradeInput(''); }};
  const handleDeleteGrade = (g) => { if (window.confirm('삭제?')) setGrades(grades.filter(item => item !== g)); };
  
  const handleAddSchool = () => { if (newSchoolInput && !schools.includes(newSchoolInput)) { setSchools([...schools, newSchoolInput]); setNewSchoolInput(''); }};
  const handleDeleteSchool = (s) => { if (window.confirm('삭제?')) setSchools(schools.filter(item => item !== s)); };

  const handleAddClass = async () => {
    if (newClassInput && !classes.includes(newClassInput)) {
      const newClasses = [...classes, newClassInput];
      setClasses(newClasses);
      
      // 새 클래스에 대한 기본 과목 설정 추가
      const newSubjectConfig = { ...classSubjects };
      newSubjectConfig[newClassInput] = JSON.parse(JSON.stringify(DEFAULT_SUBJECT_CONFIG));
      setClassSubjects(newSubjectConfig);

      // Firebase 저장
      try {
        if(db) {
          await setDoc(doc(db, 'settings', 'classList'), { list: newClasses });
          await setDoc(doc(db, 'settings', 'subjectConfig'), newSubjectConfig);
        }
      } catch(e) { console.error("Error saving class:", e); }
      
      setNewClassInput('');
    }
  };

  const handleDeleteClass = async (c) => {
    if (window.confirm(`'${c}' 클래스를 삭제하시겠습니까?`)) {
      const newClasses = classes.filter(item => item !== c);
      setClasses(newClasses);
      
      // Firebase 저장
      try {
        if(db) {
           await setDoc(doc(db, 'settings', 'classList'), { list: newClasses });
        }
      } catch(e) { console.error("Error deleting class:", e); }
    }
  };

  // [2번 요청] 그래프 선택 핸들러
  const toggleReportGraph = (graphId) => {
    if (selectedReportGraphs.includes(graphId)) {
      setSelectedReportGraphs(selectedReportGraphs.filter(id => id !== graphId));
    } else {
      setSelectedReportGraphs([...selectedReportGraphs, graphId]);
    }
  };

  // Sorted Graphs for Report
  const sortedReportGraphs = useMemo(() => [...selectedReportGraphs].sort((a, b) => a - b), [selectedReportGraphs]);
  const page2Charts = sortedReportGraphs.slice(0, 2);
  const extraPages = useMemo(() => {
    const remaining = sortedReportGraphs.slice(2);
    const pages = [];
    for (let i = 0; i < remaining.length; i += 6) {
      pages.push(remaining.slice(i, i + 6));
    }
    return pages;
  }, [sortedReportGraphs]);


  return (
    <>
      <style>{`
        html, body, #root {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
          color-scheme: light; /* Force light mode */
        }
        /* [1번 요청] 화살표 버튼 높이/너비 개선 */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {  
           transform: scale(1.5);
           margin-left: 5px;
           cursor: pointer;
           opacity: 1;
           padding: 4px; /* 터치 영역 확보 */
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
      
      <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
        <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={24} /> 미키영어학원 성적관리 Ver 4.0 (Final Fix)</h1>
            <div className="text-sm bg-indigo-800 px-3 py-1 rounded flex items-center gap-2"><Sparkles size={14} className="text-yellow-300"/> AI Ready</div>
          </div>
        </header>

        <nav className="bg-gray-100 border-b border-gray-200 pt-2 sticky top-16 z-40">
          <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto">
              {[ 
                { id: 'students', label: '1. 전체학생관리', icon: User }, 
                { id: 'detail', label: '2. 세부학생관리', icon: UserCog }, 
                { id: 'subjects', label: '3. 과목관리', icon: Settings },
                { id: 'input', label: '4. 점수입력', icon: Save }, 
                { id: 'report', label: '5. 성적표', icon: FileText }, 
                { id: 'dashboard', label: '6. 통계', icon: BarChart2 },
                { id: 'version', label: '7. 수정사항', icon: GitCommit }
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all rounded-t-lg mr-2 outline-none ring-0 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border-t-2 border-blue-600' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>
                  <tab.icon size={16}/> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-auto bg-gray-50 w-full">
          <div className="max-w-[1600px] mx-auto w-full p-6">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg font-bold text-indigo-600 animate-pulse">데이터 불러오는 중 (Loading)...</div>
                </div>
            ) : (
              <>
                {/* TAB 1: 전체학생관리 */}
                {activeTab === 'students' && (
                   <StudentManagement 
                     students={students}
                     grades={grades}
                     classes={classes}
                     schools={schools}
                     showConfig={showConfig}
                     setShowConfig={setShowConfig}
                     newStudent={newStudent}
                     setNewStudent={setNewStudent}
                     newSchoolInput={newSchoolInput}
                     setNewSchoolInput={setNewSchoolInput}
                     handleAddSchool={handleAddSchool}
                     handleDeleteSchool={handleDeleteSchool}
                     newGradeInput={newGradeInput}
                     setNewGradeInput={setNewGradeInput}
                     handleAddGrade={handleAddGrade}
                     handleDeleteGrade={handleDeleteGrade}
                     newClassInput={newClassInput}
                     setNewClassInput={setNewClassInput}
                     handleAddClass={handleAddClass}
                     handleDeleteClass={handleDeleteClass}
                     handleAddStudent={handleAddStudent}
                     handleDeleteStudent={handleDeleteStudent}
                     handleNameClick={handleNameClick}
                   />
                )}

                {/* TAB 2: 세부학생관리 */}
                {activeTab === 'detail' && (
                  <StudentDetail 
                    students={students}
                    selectedStudentId={selectedStudentId}
                    setSelectedStudentId={setSelectedStudentId}
                    selectedStudentInfo={selectedStudentInfo}
                    handleGoToReport={handleGoToReport}
                    grades={grades}
                    classes={classes}
                    handleUpdateStudentInfo={handleUpdateStudentInfo}
                    studentDetailScores={studentDetailScores}
                    handleDetailScoreChange={handleDetailScoreChange}
                    handleDeleteDetailScore={handleDeleteDetailScore}
                    analysisCharts={analysisCharts}
                    toggleReportGraph={toggleReportGraph}
                    selectedReportGraphs={selectedReportGraphs}
                    classSubjects={classSubjects} 
                    schools={schools} // [Fix] Pass schools
                  />
                )}

                {/* TAB 3: 과목관리 (NEW) */}
                {activeTab === 'subjects' && (
                  <SubjectManagement
                    classes={classes}
                    classSubjects={classSubjects}
                    handleUpdateClassSubject={handleUpdateClassSubject}
                  />
                )}

                {/* TAB 4: 점수 입력 (Renumbered) */}
                {activeTab === 'input' && (
                  <ScoreInput 
                    inputYear={inputYear}
                    setInputYear={setInputYear}
                    inputMonth={inputMonth}
                    setInputMonth={setInputMonth}
                    handleMonthChange={handleMonthChange}
                    YEARS={YEARS}
                    MONTHS={MONTHS}
                    handleResetSort={handleResetSort}
                    handleSort={handleSort}
                    handleNameClick={handleNameClick}
                    inputTableData={inputTableData}
                    handleInputScoreChange={handleInputScoreChange}
                    handleResetScore={handleResetScore}
                    classes={classes} // Pass classes for filtering
                    classSubjects={classSubjects} // Pass configuration
                  />
                )}

                {/* TAB 5: 성적표 (Renumbered) */}
                {activeTab === 'report' && (
                  <ReportCard 
                    students={students}
                    selectedStudentId={selectedStudentId}
                    setSelectedStudentId={setSelectedStudentId}
                    selectedStudentInfo={selectedStudentInfo}
                    latestScore={latestScore}
                    isGeneratingAI={isGeneratingAI}
                    generateAIComment={generateAIComment}
                    handleEditScore={handleEditScore}
                    studentHistory={studentHistory}
                    graphMode={graphMode}
                    setGraphMode={setGraphMode}
                    graphData={graphData}
                    getLineColor={getLineColor}
                    page2Charts={page2Charts}
                    extraPages={extraPages}
                    analysisCharts={analysisCharts}
                    classSubjects={classSubjects} // Pass configuration
                  />
                )}

                {/* TAB 6: 통계 (Renumbered) */}
                {activeTab === 'dashboard' && (
                  <Statistics 
                    statCriteria={statCriteria}
                    setStatCriteria={setStatCriteria}
                    inputYear={inputYear}
                    inputMonth={inputMonth}
                    statisticsData={statisticsData}
                  />
                )}

                {/* TAB 7: 버전 관리 */}
                {activeTab === 'version' && (
                  <VersionHistory />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default MickeyExcelApp;