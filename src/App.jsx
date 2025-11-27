import React, { useState, useMemo, useEffect } from 'react';
import { FileText, BarChart2, Save, User, UserCog, Sparkles, Settings } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';

import StudentManagement from './components/1StudentManagement';
import StudentDetail from './components/2StudentDetail';
import SubjectManagement from './components/3SubjectManagement';
import ScoreInput from './components/4ScoreInput';
import ReportCard from './components/5ReportCard';
import Statistics from './components/6Statistics';
import VersionHistory, { LATEST_VERSION } from './components/7VersionHistory';
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
const INITIAL_GRADES = [];
const INITIAL_CLASSES = [];
const INITIAL_SCHOOLS = []; 

const NAMES = [];

const YEARS = Array.from({ length: 80 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// Text Data for Initialization
const CLASS_SCORE_TXT = `0. PHONICS
       (Phonics 1) - Consonant- Beginning Sound(b, c, d, e, f, g, h, j, k, l)
       (Phonics 1) - Consonant- Beginning Sound(m, n, p, q, r, s, t, v)
       (Phonics 1) - Consonant- Beginning Sound(w, x, y, z)
       (Phonics 1) - Short vowel (a, e, i, o, u)
       (Phonics 2) - Long  vowels(-a-e, ee-, -i-e, -o-e, -u-e)
       (Phonics 2) - Consonant Blends(sm, sn, sp, sw, cl, gl, pl, br, dr, fr, mp, nk, ft)
       (Phonics 2) - Consonant Digraphs(ch, sh, th, wh, ch, ck, ng, sh)

1. PRE STARTER
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 5문항
       (RW) - Spell the words (철자쓰고 단어알기) - 5문항
       (RW) - Look and Recognize (그림보고 이해하기) - 5문항
       (RW) - Read and Retell (글을 읽고 질문에 답하기) - 10문항

2. STARTER
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 10문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 5문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항

3. Basic
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 15문항
       (LS) - Listen and Speak (듣고 말하기) - 5문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 10문항
       (RW) - Practical Reading and Retelling (실용적인 글을 읽고 질문에 답하기) - 10문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항

4. Junior
       (LS) - Listen and Respond (질문 듣고 답하기) - 10문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 10문항
       (LS) - Listen and Speak (듣고 말하기) - 10문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 5문항
       (RW) - Practical Reading and Retelling (실용적인 글을 읽고 질문에 답하기) - 10문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항`;

const ATTITUDE_SCORE = { 'Excellent': 10, 'Good': 7, 'NI': 3 };
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Helper for parsing
const parseClassSubjects = (text) => {
  const lines = text.split('\n');
  const config = {};
  let currentClass = null;

  lines.forEach(line => {
    const classMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (classMatch) {
      let rawName = classMatch[2].trim();
      // Normalize Class Name (Title Case)
      let className = rawName.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
      // Handle specific casing if needed, e.g. "Pre Starter" is fine.
      if (rawName === 'PHONICS') className = 'Phonics'; // Special case if needed
      
      currentClass = className;
      // Default structure
      config[currentClass] = { 
        ls: [], 
        rw: [], 
        lsTitle: 'Listening & Speaking (L&S)', 
        rwTitle: 'Reading & Writing (R&W)' 
      };
      return;
    }

    if (!currentClass) return;
    const trimmed = line.trim();
    if (!trimmed) return;

    // Parse (LS)/(RW)
    // Regex: (LS) - Name - 5문항
    const lsMatch = trimmed.match(/^\(LS\)\s-\s(.+?)\s-\s(\d+)문항/);
    const rwMatch = trimmed.match(/^\(RW\)\s-\s(.+?)\s-\s(\d+)문항/);
    // Regex: (Phonics 1) - Name (No max score specified, defaulting to 5)
    const phonicsMatch = trimmed.match(/^\(Phonics\s(\d+)\)\s-\s(.+)$/);

    if (lsMatch) {
      config[currentClass].ls.push({ name: lsMatch[1].trim(), max: parseInt(lsMatch[2]) });
    } else if (rwMatch) {
      config[currentClass].rw.push({ name: rwMatch[1].trim(), max: parseInt(rwMatch[2]) });
    } else if (phonicsMatch) {
      const pLevel = phonicsMatch[1];
      const pName = phonicsMatch[2].trim();
      const pMax = 5; // Default max score for Phonics

      if (pLevel === '1') {
        config[currentClass].ls.push({ name: pName, max: pMax });
        config[currentClass].lsTitle = 'Phonics 1';
      } else {
        config[currentClass].rw.push({ name: pName, max: pMax });
        config[currentClass].rwTitle = 'Phonics 2';
      }
    }
  });
  
  // Filter out classes with no subjects (like Phonics if we didn't add any)
  // Or keep them? App expects ls/rw arrays.
  // If Phonics has empty ls/rw, it might cause issues if we try to use it.
  // Let's remove empty classes for safety unless they are valid.
  Object.keys(config).forEach(key => {
      if (config[key].ls.length === 0 && config[key].rw.length === 0) {
          delete config[key];
      }
  });

  return config;
};
  
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
    const [classSubjects, setClassSubjects] = useState({});
  
    // 클래스가 추가될 때 기본 과목 설정도 추가 (useEffect removed to avoid overwriting custom loaded config, handled in addClass)
  
    const [newGradeInput, setNewGradeInput] = useState('');
    const [newClassInput, setNewClassInput] = useState('');
    const [newSchoolInput, setNewSchoolInput] = useState(''); 
  
    const [showConfig, setShowConfig] = useState(false); 
  
    // [2번 요청] 이름 입력 분리 (nameK, nameE)
    const [newStudent, setNewStudent] = useState({ nameK: '', nameE: '', school: '', grade: 'G3', classInfo: '' });
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [statCriteria, setStatCriteria] = useState('class');
  
    const [selectedReportGraphs, setSelectedReportGraphs] = useState([]);
  
    const today = new Date();
    const [inputYear, setInputYear] = useState(today.getFullYear());
    const [inputMonth, setInputMonth] = useState(today.getMonth() + 1);
    
    // [New] 성적표 출력 기준 날짜 (기본값: 현재)
    const [reportDate, setReportDate] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  
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
              const classesDoc = await getDoc(doc(db, 'settings', 'classList')); 
              const schoolsDoc = await getDoc(doc(db, 'settings', 'schoolList')); 
              const gradesDoc = await getDoc(doc(db, 'settings', 'gradeList')); 

              // Load Classes
              let loadedClasses = [];
              if (classesDoc.exists()) {
                  loadedClasses = classesDoc.data().list;
                  if (loadedClasses && loadedClasses.length > 0) setClasses(loadedClasses);
              } else {
                  await setDoc(doc(db, 'settings', 'classList'), { list: INITIAL_CLASSES });
              }

              // Load Schools
              if (schoolsDoc.exists()) {
                  const loadedSchools = schoolsDoc.data().list;
                  if (loadedSchools && loadedSchools.length > 0) setSchools(loadedSchools);
              } else {
                  await setDoc(doc(db, 'settings', 'schoolList'), { list: INITIAL_SCHOOLS });
              }

              // Load Grades
              if (gradesDoc.exists()) {
                  const loadedGrades = gradesDoc.data().list;
                  if (loadedGrades && loadedGrades.length > 0) setGrades(loadedGrades);
              } else {
                  await setDoc(doc(db, 'settings', 'gradeList'), { list: INITIAL_GRADES });
              }
  
              // Load Subjects
              if (configDoc.exists()) {
                  setClassSubjects(configDoc.data());
              } 
  
              // Check if Phonics is missing (Migration/Update Trigger)
              const shouldInit = (sSnapshot.empty && !classesDoc.exists()) || (loadedClasses.length > 0 && !loadedClasses.includes('Phonics'));

              if (shouldInit) {
                  console.log("Database update required (Phonics or Empty). Initializing...");
                  await initializeDatabase();
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
  
    const initializeDatabase = async () => {
        if (!db) return;
        
        try {
            console.log("Initializing Database from Class Score Text...");
            
            // 1. Parse Config
            const parsedConfig = parseClassSubjects(CLASS_SCORE_TXT);
            const classList = Object.keys(parsedConfig);
            
            if (classList.length === 0) {
                alert("텍스트 파일 파싱 실패: 클래스를 찾을 수 없습니다.");
                return;
            }

            const batch = writeBatch(db);

            // 2. Save Settings
            const subjectConfigRef = doc(db, 'settings', 'subjectConfig');
            batch.set(subjectConfigRef, parsedConfig);
            
            const classListRef = doc(db, 'settings', 'classList');
            batch.set(classListRef, { list: classList });
            
            // Save Default Schools/Grades if needed during Init
            const schoolListRef = doc(db, 'settings', 'schoolList');
            batch.set(schoolListRef, { list: INITIAL_SCHOOLS });
            
            const gradeListRef = doc(db, 'settings', 'gradeList');
            batch.set(gradeListRef, { list: INITIAL_GRADES });

            // 3. Commit
            await batch.commit();
            
            // 4. Update Local State
            setClassSubjects(parsedConfig);
            setClasses(classList);
            setSchools(INITIAL_SCHOOLS);
            setGrades(INITIAL_GRADES);
            
            alert(`초기화 완료! ${classList.length}개 클래스가 생성되었습니다.\n(${classList.join(', ')})`);
            
        } catch (e) {
            console.error("DB Init Error:", e);
            alert("초기화 중 오류가 발생했습니다.");
        }
    };

  
  
    const getStudentInfo = (id) => students.find(s => s.id === id);
  
    // Helper to get max points
    const getMaxPoints = (classInfo) => {
        const config = classSubjects[classInfo] || { ls: [], rw: [] };
        const lsMax = (config.ls || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        const rwMax = (config.rw || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        return lsMax + rwMax || 60; 
    };
  
        // --- 데이터 가공 ---
  
        const enrichedScores = useMemo(() => {
  
          return scores.map(score => {
  
            const sInfo = getStudentInfo(score.studentId);
  
            const currentClassInfo = score.classInfo || sInfo?.classInfo || classes[0] || '';
  
            const config = classSubjects[currentClassInfo] || { ls: [], rw: [] };
  
    
  
            // [Fix] Dynamic Total Calculation
  
            let lsTotal = 0;
  
            if (config.ls) {
  
                config.ls.forEach((_, idx) => {
  
                    lsTotal += Number(score[`ls${idx + 1}`]) || 0;
  
                });
  
            } else { // Fallback
  
                 lsTotal = (Number(score.ls1)||0) + (Number(score.ls2)||0) + (Number(score.ls3)||0) + (Number(score.ls4)||0);
  
            }
  
    
  
            let rwTotal = 0;
  
            if (config.rw) {
  
                config.rw.forEach((_, idx) => {
  
                    rwTotal += Number(score[`rw${idx + 1}`]) || 0;
  
                });
  
            } else { // Fallback
  
                 rwTotal = (Number(score.rw1)||0) + (Number(score.rw2)||0) + (Number(score.rw3)||0) + (Number(score.rw4)||0);
  
            }
  
    
  
                            const total = lsTotal + rwTotal;
  
    
  
                            const max = getMaxPoints(currentClassInfo);
  
    
  
                            const percentage = max > 0 ? (total / max) * 100 : 0;
  
    
  
                            
  
    
  
                            let classProgress = 'NI';
  
                            if (percentage >= 90) classProgress = 'EX';
  
                            else if (percentage >= 60) classProgress = 'GD';

                            // [Fix] Phonics Handling: If Phonics and total is 0 (no score), use stored progress or empty
                            if (currentClassInfo === 'Phonics' && total === 0) {
                                classProgress = score.classProgress || '';
                            }
  
                    
  
                            // 이름 조합
  
            // 이름 조합
  
            const displayName = sInfo ? `${sInfo.nameE} (${sInfo.nameK})` : 'Unknown';
  
      
  
            return {
  
              ...score,
  
              name: displayName, 
  
              classInfo: currentClassInfo, 
  
              grade: sInfo?.grade || '-',
  
              lsTotal,
  
              rwTotal,
  
              total,
  
              classProgress, 
  
              percentage     
  
            };
  
          });
  
        }, [scores, students, classSubjects, getMaxPoints, getStudentInfo]);
  
    // [3번 탭] 점수 입력용 데이터
    const inputTableData = useMemo(() => {
      const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
      
      let data = students.map(student => {
        const existingScore = enrichedScores.find(s => s.studentId === student.id && s.date === targetDate);
        if (existingScore) return existingScore;
  
        const displayName = `${student.nameE} (${student.nameK})`;
        const isPhonics = student.classInfo === 'Phonics';
  
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
          att_attendance: 'Good', att_homework: 'Good', // 태도는 Good 기본
          lsTotal: 0, rwTotal: 0, total: 0,
          classProgress: isPhonics ? '' : 'NI', // Default
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
          classInfo: '', // [Fix] 더미 데이터는 '미지정' 상태로 시작
          classProgress: '', // [Fix] 삭제된 데이터(더미)는 등급 표시 없음
          percentage: 0
        };
      });
  
      return details.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [enrichedScores, selectedStudentId]);

  const studentHistory = useMemo(() => {
    const limitDate = `${reportDate.year}-${String(reportDate.month).padStart(2, '0')}`;
    const filtered = enrichedScores
      .filter(s => s.studentId === selectedStudentId && s.date <= limitDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
      
    // [Fix] Deduplicate by date to prevent multiple entries for the same month in graphs/tables
    return filtered.filter((item, index, self) => 
        index === self.findIndex((t) => (
            t.date === item.date
        ))
    );
  }, [enrichedScores, selectedStudentId, reportDate]);

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
        const config = classSubjects[classInfo] || { ls: [], rw: [] };
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
      return sortedHistory.map(s => ({ name: s.date, score: s.percentage }));
    } else if (graphMode === 'quarterly') {
      const qMap = {};
      sortedHistory.forEach(s => {
         const d = new Date(s.date);
         const year = String(d.getFullYear()).slice(2);
         const q = Math.ceil((d.getMonth() + 1) / 3);
         const key = `${year}.${q}Q`;
         if (!qMap[key]) qMap[key] = [];
         qMap[key].push(s.percentage);
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
        data[monthIndex][year] = s.percentage; 
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

  const availableDates = useMemo(() => {
    if (!selectedStudentId) return [];
    return enrichedScores
      .filter(s => s.studentId === selectedStudentId)
      .map(s => s.date)
      .sort((a, b) => new Date(b) - new Date(a));
  }, [enrichedScores, selectedStudentId]);

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
      const config = classSubjects[classInfo] || { ls: [], rw: [] };
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
    const classInfo = student?.classInfo || classes[0] || '';

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
      // [Fix] Recalculate total/progress for new dummy score
      const sClass = selectedStudentInfo.classInfo;
      const max = getMaxPoints(sClass);
      const tempScore = { 
          ls1: 0, ls2: 0, ls3: 0, ls4: 0, 
          rw1: 0, rw2: 0, rw3: 0, rw4: 0, 
          [field]: cleanValue 
      };
      const newTotal = Object.keys(tempScore).reduce((sum, key) => {
          if (key.startsWith('ls') || key.startsWith('rw')) return sum + (Number(tempScore[key]) || 0);
          return sum;
      }, 0);
      const percent = max > 0 ? (newTotal / max) * 100 : 0;
      let newProgress = 'NI';
      if (percent >= 90) newProgress = 'EX'; else if (percent >= 60) newProgress = 'GD';

      const newScore = {
          id: `${Date.now()}_${selectedStudentId}_${dateStr}`,
          examId: `${dateStr.split('-')[0]}년 ${parseInt(dateStr.split('-')[1])}월 평가`,
          date: dateStr,
          studentId: selectedStudentId,
          classInfo: sClass, 
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          lsTotal: 0, rwTotal: 0, 
          total: newTotal,
          classProgress: newProgress,
          percentage: percent,
          cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
          att_attendance: 'Good', att_homework: 'Good',
          teacher_comment: '',
          [field]: cleanValue
       };
       setScores([...scores, newScore]);
       scoreToSave = newScore;
    } else {
      const targetScore = scores.find(s => s.id === scoreId);
      const updatedScore = { ...targetScore, [field]: cleanValue };
      
      // [Fix] Recalculate total/progress immediately based on DYNAMIC config
      const sClass = updatedScore.classInfo || classes[0] || '';
      const config = classSubjects[sClass] || { ls: [], rw: [] };
      
      let newTotal = 0;
      let lsTotal = 0;
      let rwTotal = 0;

      // Sanitize & Calculate LS
      const lsCount = config.ls ? config.ls.length : 4;
      for (let i = 1; i <= 4; i++) {
          if (i > lsCount) {
              updatedScore[`ls${i}`] = 0; // Reset hidden scores
          } else {
              lsTotal += Number(updatedScore[`ls${i}`]) || 0;
          }
      }

      // Sanitize & Calculate RW
      const rwCount = config.rw ? config.rw.length : 4;
      for (let i = 1; i <= 4; i++) {
          if (i > rwCount) {
              updatedScore[`rw${i}`] = 0; // Reset hidden scores
          } else {
              rwTotal += Number(updatedScore[`rw${i}`]) || 0;
          }
      }

      newTotal = lsTotal + rwTotal;
      const max = getMaxPoints(sClass);
      
      const percent = max > 0 ? (newTotal / max) * 100 : 0;
      let newProgress = 'NI';
      if (percent >= 90) newProgress = 'EX'; else if (percent >= 60) newProgress = 'GD';

      updatedScore.lsTotal = lsTotal;
      updatedScore.rwTotal = rwTotal;
      updatedScore.total = newTotal;
      
      // [Fix] Only auto-calculate classProgress if user is NOT manually editing it
      if (field !== 'classProgress') {
          updatedScore.classProgress = newProgress;
      }
      
      updatedScore.percentage = percent;

      const updatedScores = scores.map(s => s.id === scoreId ? updatedScore : s);
      setScores(updatedScores);
      scoreToSave = updatedScore;
    }
    
    // Firebase Save
    if (scoreToSave) {
        try {
            await setDoc(doc(db, 'scores', scoreToSave.id.toString()), scoreToSave);
        } catch (e) { console.error(e); }
    }
  };

  const handleDeleteDetailScore = async (scoreId) => {
    if(window.confirm('삭제하시겠습니까?')) {
      setScores(scores.filter(s => s.id !== scoreId));
      try {
          await deleteDoc(doc(db, 'scores', scoreId));
      } catch(e) { console.error("Error deleting score:", e); }
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

  const handleResetScore = async (studentId) => {
    if (window.confirm('점수를 초기화하시겠습니까? (0점/Good)')) {
      const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
      const scoreToDelete = scores.find(s => s.studentId === studentId && s.date === targetDate);
      
      if (scoreToDelete) {
          try {
              await deleteDoc(doc(db, 'scores', scoreToDelete.id.toString()));
              setScores(scores.filter(s => s.id !== scoreToDelete.id));
          } catch (e) {
              console.error("Error deleting score:", e);
              alert("점수 초기화 실패 (DB 오류)");
          }
      }
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
    } catch { alert('AI 오류 발생'); } finally { setIsGeneratingAI(false); }
  };

  // [1번 요청] 학년/클래스/학교 관리 핸들러
  const handleAddGrade = async () => { 
      if (newGradeInput && !grades.includes(newGradeInput)) { 
          const newGrades = [...grades, newGradeInput];
          setGrades(newGrades); 
          setNewGradeInput(''); 
          try {
              await setDoc(doc(db, 'settings', 'gradeList'), { list: newGrades });
          } catch (e) { console.error("Error saving grades:", e); }
      }
  };

  const handleDeleteGrade = async (g) => { 
      if (window.confirm('삭제하시겠습니까?')) {
          const newGrades = grades.filter(item => item !== g);
          setGrades(newGrades); 
          try {
              await setDoc(doc(db, 'settings', 'gradeList'), { list: newGrades });
          } catch (e) { console.error("Error deleting grade:", e); }
      }
  };
  
  const handleAddSchool = async () => { 
      if (newSchoolInput && !schools.includes(newSchoolInput)) { 
          const newSchools = [...schools, newSchoolInput];
          setSchools(newSchools); 
          setNewSchoolInput(''); 
          try {
              await setDoc(doc(db, 'settings', 'schoolList'), { list: newSchools });
          } catch (e) { console.error("Error saving schools:", e); }
      }
  };

  const handleDeleteSchool = async (s) => { 
      if (window.confirm('삭제하시겠습니까?')) { 
          const newSchools = schools.filter(item => item !== s);
          setSchools(newSchools);
          try {
              await setDoc(doc(db, 'settings', 'schoolList'), { list: newSchools });
          } catch (e) { console.error("Error deleting school:", e); }
      }
  };

  const handleAddClass = async () => {
    if (newClassInput && !classes.includes(newClassInput)) {
      const newClasses = [...classes, newClassInput];
      setClasses(newClasses);
      
      // 새 클래스에 대한 기본 과목 설정 추가
      const newSubjectConfig = { ...classSubjects };
      // Use empty config for new class or a default template?
      // Let's use a  default if not in file, or just empty.
      newSubjectConfig[newClassInput] = { ls: [], rw: [], lsTitle: 'L&S', rwTitle: 'R&W' }; 
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
            <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={24} /> 미키영어 학원 성적관리 Ver {LATEST_VERSION}</h1>
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
                    newClassInput={newClassInput}
                    setNewClassInput={setNewClassInput}
                    handleAddClass={handleAddClass}
                    handleDeleteClass={handleDeleteClass}
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
                    reportDate={reportDate} // [New]
                    setReportDate={setReportDate} // [New]
                    YEARS={YEARS} // [New]
                    MONTHS={MONTHS} // [New]
                    availableDates={availableDates} // [New]
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