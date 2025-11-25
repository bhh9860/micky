import React, { useState, useMemo } from 'react';
import { User, FileText, BarChart2, Save, Plus, Trash2, PieChart, UserPlus, X, Sparkles, Loader2, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, UserCog, RefreshCcw, ExternalLink, TrendingUp, Activity, BarChart as BarChartIcon, PieChart as PieChartIcon, Layers, ScatterChart as ScatterIcon, Target, LineChart as LineChartIcon, Settings, CheckSquare, Square } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area, AreaChart, ScatterChart, Scatter, Pie, Cell, LabelList } from 'recharts';
// import './index.css' 

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
const INITIAL_CLASSES = ['Starter-1', 'Basic-1', 'Basic-2', 'Intermediate-1', 'Intermediate-2'];
// [1번 요청] 초기 학교 리스트 추가
const INITIAL_SCHOOLS = ['초등A교', '초등B교', '초등C교']; 

const NAMES = [
  { k: '허지후', e: 'Jacob' }, { k: '김소피아', e: 'Sophia' }, { k: '이다니엘', e: 'Daniel' },
  { k: '박올리비아', e: 'Olivia' }, { k: '최마이클', e: 'Michael' }, { k: '정에밀리', e: 'Emily' },
  { k: '강데이빗', e: 'David' }, { k: '윤그레이스', e: 'Grace' }, { k: '송라이언', e: 'Ryan' }, { k: '임해나', e: 'Hannah' }
];

const YEARS = Array.from({ length: 80 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const MAX_SCORES = {
  ls1: 5, ls2: 5, ls3: 15, ls4: 5,
  rw1: 5, rw2: 5, rw3: 10, rw4: 10
};

const ATTITUDE_SCORE = { 'Excellent': 10, 'Good': 7, 'Bad': 3 };
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- 데이터 생성 로직 ---
const initialStudents = NAMES.map((name, idx) => ({
  id: `S00${idx + 1}`,
  // [2번 요청] 이름 분리 저장
  nameK: name.k,
  nameE: name.e,
  // 편의상 display name getter처럼 사용하거나 조합해서 사용
  school: idx % 2 === 0 ? '초등A교' : '초등B교',
  grade: idx === 0 ? 'G5' : INITIAL_GRADES[Math.floor(Math.random() * INITIAL_GRADES.length)], 
  classInfo: idx === 0 ? 'Basic-2' : INITIAL_CLASSES[Math.floor(Math.random() * INITIAL_CLASSES.length)]
}));

const initialScores = initialStudents.flatMap((student, idx) => {
  const createScore = (monthOffset = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const scoreDate = `${yyyy}-${mm}`;

    // 1번 학생 데이터 고정
    if (student.id === 'S001' && monthOffset === 0) {
      return {
        id: Date.now() + idx + monthOffset,
        examId: `${yyyy}년 ${Number(mm)}월 평가`,
        date: scoreDate,
        studentId: student.id,
        ls1: 5, ls2: 4, ls3: 13, ls4: 5,
        rw1: 4, rw2: 5, rw3: 10, rw4: 10,
        cp_reading: 'Excellent', cp_listening: 'Excellent', cp_writing: 'Excellent', cp_grammar: 'Excellent',
        att_attendance: 'Excellent', att_homework: 'Excellent',
        teacher_comment: ''
      };
    }
    
    if (student.id === 'S001') {
       return {
        id: Date.now() + idx + monthOffset * 100,
        examId: `${yyyy}년 ${Number(mm)}월 평가`,
        date: scoreDate,
        studentId: student.id,
        ls1: 4, ls2: 4, ls3: 10 + (monthOffset % 3), ls4: 4,
        rw1: 3, rw2: 4, rw3: 8 + (monthOffset % 2), rw4: 8,
        cp_reading: 'Good', cp_listening: 'Excellent', cp_writing: 'Good', cp_grammar: 'Excellent',
        att_attendance: 'Excellent', att_homework: 'Excellent',
        teacher_comment: ''
      };
    }

    const rand = Math.random();
    let tier = 'MID'; 
    if (rand < 0.3) tier = 'HIGH'; 
    else if (rand > 0.8) tier = 'LOW'; 
    const getScore = (max) => Math.round(max * (tier === 'HIGH' ? 0.9 : tier === 'MID' ? 0.7 : 0.5));
    const getEval = () => (tier === 'HIGH' ? 'Excellent' : tier === 'MID' ? 'Good' : 'Bad');

    return {
      id: Date.now() + idx + monthOffset * 1000,
      examId: `${yyyy}년 ${Number(mm)}월 평가`,
      date: scoreDate,
      studentId: student.id,
      ls1: getScore(5), ls2: getScore(5), ls3: getScore(15), ls4: getScore(5),
      rw1: getScore(5), rw2: getScore(5), rw3: getScore(10), rw4: getScore(10),
      cp_reading: getEval(), cp_listening: getEval(), cp_writing: getEval(), cp_grammar: getEval(),
      att_attendance: getEval(), att_homework: getEval(),
      teacher_comment: ''
    };
  };
  return Array.from({length: 24}, (_, i) => createScore(i));
});

const MickeyExcelApp = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [students, setStudents] = useState(initialStudents); 
  const [scores, setScores] = useState(initialScores);
  
  // [1번 요청] 학교/학년/클래스 관리 State
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [schools, setSchools] = useState(INITIAL_SCHOOLS); // 학교 state 추가

  const [newGradeInput, setNewGradeInput] = useState('');
  const [newClassInput, setNewClassInput] = useState('');
  const [newSchoolInput, setNewSchoolInput] = useState(''); // 학교 입력 state

  const [showConfig, setShowConfig] = useState(false); 

  // [2번 요청] 이름 입력 분리 (nameK, nameE)
  const [newStudent, setNewStudent] = useState({ nameK: '', nameE: '', school: '', grade: 'G3', classInfo: 'Basic-1' });
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudents[0].id);
  const [statCriteria, setStatCriteria] = useState('class');

  const [selectedReportGraphs, setSelectedReportGraphs] = useState([]);

  const today = new Date();
  const [inputYear, setInputYear] = useState(today.getFullYear());
  const [inputMonth, setInputMonth] = useState(today.getMonth() + 1);

  const [graphMode, setGraphMode] = useState('monthly'); 
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const getStudentInfo = (id) => students.find(s => s.id === id);

  // --- 데이터 가공 ---
  const enrichedScores = useMemo(() => {
    return scores.map(score => {
      const lsTotal = (Number(score.ls1)||0) + (Number(score.ls2)||0) + (Number(score.ls3)||0) + (Number(score.ls4)||0);
      const rwTotal = (Number(score.rw1)||0) + (Number(score.rw2)||0) + (Number(score.rw3)||0) + (Number(score.rw4)||0);
      const total = lsTotal + rwTotal;
      const sInfo = getStudentInfo(score.studentId);
      
      // 이름 조합
      const displayName = sInfo ? `${sInfo.nameE} (${sInfo.nameK})` : 'Unknown';

      return {
        ...score,
        name: displayName, 
        classInfo: sInfo?.classInfo || '-',
        grade: sInfo?.grade || '-',
        lsTotal,
        rwTotal,
        total,
      };
    });
  }, [scores, students]);

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
        cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
        att_attendance: 'Good', att_homework: 'Good',
        lsTotal: 0, rwTotal: 0, total: 0
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

    const allMonths = [];
    let current = new Date(2020, 0, 1); 
    const now = new Date();
    
    while (current <= now) {
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
        isDummy: true
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
    const latest = validData[0] || {};

    if (dataForGraph.length === 0) return null;

    const trendData = dataForGraph;

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

    const subjectScoreAnalysisData = dataForGraph.slice(-4).map(s => ({
      date: s.date.substring(5), 
      MyScore: (s.total / 60) * 100,
      ClassAvg: 70 + Math.random() * 10,
      TotalAvg: 60 + Math.random() * 10
    }));

    // [3번 요청] Graph 6 Removed

    const compareData = dataForGraph.map(s => {
      const scoresThisMonth = enrichedScores.filter(es => es.date === s.date);
      const avg = scoresThisMonth.length > 0 
        ? scoresThisMonth.reduce((sum, score) => sum + score.total, 0) / scoresThisMonth.length
        : 0;

      return {
        date: s.date,
        MyScore: s.total,
        ClassAvg: Math.round(avg * 100) / 100 
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

    const deviationData = dataForGraph.map(s => {
      const avg = 45;
      return {
        date: s.date,
        Deviation: s.total - avg
      };
    });

    const quarterlyMap = {};
    dataForGraph.forEach(s => {
      const year = s.date.substring(2, 4);
      const month = parseInt(s.date.substring(5, 7));
      const q = Math.ceil(month / 3);
      const key = `${year}.${q}Q`;
      if (!quarterlyMap[key]) quarterlyMap[key] = [];
      quarterlyMap[key].push(s.total);
    });
    const quarterlyData = Object.keys(quarterlyMap).map(key => ({
      name: key,
      Avg: Math.round(quarterlyMap[key].reduce((a,b)=>a+b,0) / quarterlyMap[key].length)
    }));

    return { trendData, areaData, lsStackData, rwStackData, subjectScoreAnalysisData, compareData, attitudeData, speakingData, writingData, grammarData, readingData, deviationData, quarterlyData };
  }, [studentDetailScores, enrichedScores]);


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
  // [1번 요청] 학생 추가 핸들러 수정 (한글/영어 이름)
  const handleAddStudent = () => {
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
    setStudents([...students, studentToAdd]);
    setNewStudent({ nameK: '', nameE: '', school: schools[0], grade: grades[0], classInfo: classes[0] }); 
    alert(`${newStudent.nameE} 학생이 추가되었습니다!`);
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('학생을 삭제하면 모든 성적 데이터도 삭제됩니다.')) {
      setStudents(students.filter(s => s.id !== id));
      setScores(scores.filter(s => s.studentId !== id));
    }
  };

  const handleInputScoreChange = (studentId, field, value) => {
    const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
    const existingScoreIndex = scores.findIndex(s => s.studentId === studentId && s.date === targetDate);

    let cleanValue = value;
    if (typeof value === 'number') {
      if (value < 0) cleanValue = 0;
      if (MAX_SCORES[field] !== undefined && value > MAX_SCORES[field]) {
        cleanValue = MAX_SCORES[field];
      }
    }

    if (existingScoreIndex >= 0) {
      const newScores = [...scores];
      newScores[existingScoreIndex] = { ...newScores[existingScoreIndex], [field]: cleanValue };
      setScores(newScores);
    } else {
      const newScore = {
        id: Date.now(),
        examId: `${inputYear}년 ${inputMonth}월 평가`,
        date: targetDate,
        studentId: studentId,
        ls1: 0, ls2: 0, ls3: 0, ls4: 0,
        rw1: 0, rw2: 0, rw3: 0, rw4: 0,
        cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
        att_attendance: 'Good', att_homework: 'Good',
        teacher_comment: '',
        [field]: cleanValue
      };
      setScores([...scores, newScore]);
    }
  };

  const handleResetSort = () => {
    setSortConfig({ key: null, direction: 'ascending' });
  };

  const handleUpdateStudentInfo = (field, value) => {
    setStudents(students.map(s => s.id === selectedStudentId ? { ...s, [field]: value } : s));
  };

  const handleDetailScoreChange = (scoreId, field, value) => {
    if (String(scoreId).startsWith('dummy_')) {
      let cleanValue = value;
      if (typeof value === 'number') {
        if (value < 0) cleanValue = 0;
        if (MAX_SCORES[field] !== undefined && value > MAX_SCORES[field]) cleanValue = MAX_SCORES[field];
      }
      const dateStr = scoreId.replace('dummy_', '');
      const newScore = {
          id: Date.now(),
          examId: `${dateStr.split('-')[0]}년 ${parseInt(dateStr.split('-')[1])}월 평가`,
          date: dateStr,
          studentId: selectedStudentId,
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          lsTotal: 0, rwTotal: 0, total: 0,
          cp_reading: 'Good', cp_listening: 'Good', cp_writing: 'Good', cp_grammar: 'Good',
          att_attendance: 'Good', att_homework: 'Good',
          teacher_comment: '',
          [field]: cleanValue
       };
       setScores([...scores, newScore]);
    } else {
      let cleanValue = value;
      if (typeof value === 'number') {
        if (value < 0) cleanValue = 0;
        if (MAX_SCORES[field] !== undefined && value > MAX_SCORES[field]) {
          cleanValue = MAX_SCORES[field];
        }
      }
      setScores(scores.map(s => s.id === scoreId ? { ...s, [field]: cleanValue } : s));
    }
  };

  const handleDeleteDetailScore = (scoreId) => {
    if(window.confirm('삭제하시겠습니까?')) {
      setScores(scores.filter(s => s.id !== scoreId));
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
  
  const handleAddClass = () => { if (newClassInput && !classes.includes(newClassInput)) { setClasses([...classes, newClassInput]); setNewClassInput(''); }};
  const handleDeleteClass = (c) => { if (window.confirm('삭제?')) setClasses(classes.filter(item => item !== c)); };

  const handleAddSchool = () => { if (newSchoolInput && !schools.includes(newSchoolInput)) { setSchools([...schools, newSchoolInput]); setNewSchoolInput(''); }};
  const handleDeleteSchool = (s) => { if (window.confirm('삭제?')) setSchools(schools.filter(item => item !== s)); };

  // [2번 요청] 그래프 선택 핸들러
  const toggleReportGraph = (graphId) => {
    if (selectedReportGraphs.includes(graphId)) {
      setSelectedReportGraphs(selectedReportGraphs.filter(id => id !== graphId));
    } else {
      setSelectedReportGraphs([...selectedReportGraphs, graphId]);
    }
  };

  // [2번 요청] 성적표용 그래프 렌더링 헬퍼
  const renderReportGraph = (graphId) => {
    const chartMargin = { top: 25, right: 10, left: 10, bottom: 0 };
    const yAxisWidth = 24;
    const commonX = <XAxis dataKey="date" tick={{fontSize:10}}/>;
    const commonY = <YAxis width={yAxisWidth}/>;
    const commonGrid = <CartesianGrid strokeDasharray="3 3"/>;

    const renderCustomLabel = (props) => {
      const { x, y, width, value } = props;
      if (value === null || value === undefined) return null;
      const cx = x + (width ? width / 2 : 0);
      const cy = y - 5; 
      return (
        <text x={cx} y={cy} fill="#000" textAnchor="middle" fontSize={10} fontWeight="bold">
          {Math.round(value)}
        </text>
      );
    };

    const renderStackLabel = (props) => {
      const { x, y, width, height, value } = props;
      if (!value || value <= 0) return null;
      return (
        <text x={x + width / 2} y={y + height / 2 + 3} fill="#000" textAnchor="middle" fontSize={10} fontWeight="bold">
          {Math.round(value)}
        </text>
      );
    };

    const sliceData = (data) => data.slice(-8);

    switch(graphId) {
      case 1: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.trendData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,60]}/><Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} label={renderCustomLabel}/><Line type="monotone" dataKey="Average" stroke="#9ca3af" strokeDasharray="3 3"/></LineChart></ResponsiveContainer>
      );
      case 2: return (
        <ResponsiveContainer><AreaChart data={sliceData(analysisCharts.areaData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={['auto', 'auto']}/><Area type="monotone" dataKey="LS" stackId="1" stroke="#8884d8" fill="#8884d8" label={renderStackLabel}/><Area type="monotone" dataKey="RW" stackId="1" stroke="#82ca9d" fill="#82ca9d" label={renderStackLabel}/></AreaChart></ResponsiveContainer>
      );
      case 3: return (
        <ResponsiveContainer><BarChart data={sliceData(analysisCharts.lsStackData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,30]}/><Legend verticalAlign="top" align="right" height={36} iconSize={10}/><Bar dataKey="Recog" stackId="a" fill="#8884d8" label={renderStackLabel}/><Bar dataKey="Resp" stackId="a" fill="#82ca9d" label={renderStackLabel}/><Bar dataKey="Retell" stackId="a" fill="#ffc658" label={renderStackLabel}/><Bar dataKey="Speak" stackId="a" fill="#ff8042" label={renderStackLabel}/></BarChart></ResponsiveContainer>
      );
      case 4: return (
        <ResponsiveContainer><BarChart data={sliceData(analysisCharts.rwStackData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,30]}/><Legend verticalAlign="top" align="right" height={36} iconSize={10}/><Bar dataKey="Gram" stackId="a" fill="#8884d8" label={renderStackLabel}/><Bar dataKey="Writ" stackId="a" fill="#82ca9d" label={renderStackLabel}/><Bar dataKey="Prac" stackId="a" fill="#ffc658" label={renderStackLabel}/><Bar dataKey="Read" stackId="a" fill="#ff8042" label={renderStackLabel}/></BarChart></ResponsiveContainer>
      );
      case 5: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.subjectScoreAnalysisData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={['auto', 'auto']}/><Legend/><Line type="monotone" dataKey="MyScore" stroke="#D97706" strokeWidth={2} label={renderCustomLabel}/><Line type="monotone" dataKey="ClassAvg" stroke="#F59E0B" strokeWidth={2} label={renderCustomLabel}/><Line type="monotone" dataKey="TotalAvg" stroke="#10B981" strokeWidth={2} label={renderCustomLabel}/></LineChart></ResponsiveContainer>
      );
      case 7: return (
        <ResponsiveContainer><ComposedChart data={sliceData(analysisCharts.compareData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0, 60]}/><Bar dataKey="MyScore" barSize={20} fill="#413ea0" label={renderCustomLabel}/><Line type="monotone" dataKey="ClassAvg" stroke="#ff7300"/></ComposedChart></ResponsiveContainer>
      );
      case 8: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.attitudeData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,12]} ticks={[3, 7, 10]} tickFormatter={(val) => val === 10 ? 'Ex' : val === 7 ? 'Gd' : 'Bd'} /><Line type="step" dataKey="Attendance" stroke="#82ca9d" label={(props) => <text x={props.x} y={props.y - 5} fill="#000" textAnchor="middle" fontSize={10} fontWeight="bold">{props.value === 10 ? 'Ex' : props.value === 7 ? 'Gd' : 'Bd'}</text>}/><Line type="step" dataKey="Homework" stroke="#8884d8"/></LineChart></ResponsiveContainer>
      );
      case 9: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.speakingData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,5]}/><Line type="monotone" dataKey="Score" stroke="#ff7300" strokeWidth={2} label={renderCustomLabel}/></LineChart></ResponsiveContainer>
      );
      case 10: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.writingData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,5]}/><Line type="monotone" dataKey="Score" stroke="#387908" strokeWidth={2} label={renderCustomLabel}/></LineChart></ResponsiveContainer>
      );
      case 11: return (
        <ResponsiveContainer><AreaChart data={sliceData(analysisCharts.grammarData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,5]}/><Area type="monotone" dataKey="Score" stroke="#8884d8" fill="#8884d8" label={renderCustomLabel}/></AreaChart></ResponsiveContainer>
      );
      case 12: return (
        <ResponsiveContainer><LineChart data={sliceData(analysisCharts.readingData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[0,10]}/><Line type="monotone" dataKey="Score" stroke="#82ca9d" strokeWidth={2} label={renderCustomLabel}/></LineChart></ResponsiveContainer>
      );
      case 13: return (
        <ResponsiveContainer><BarChart data={sliceData(analysisCharts.deviationData)} margin={chartMargin}>{commonGrid}{commonX}<YAxis width={yAxisWidth} domain={[-30, 30]}/><Bar dataKey="Deviation" fill="#8884d8" label={renderCustomLabel}/></BarChart></ResponsiveContainer>
      );
      case 14: return (
        <ResponsiveContainer><BarChart data={sliceData(analysisCharts.quarterlyData)} margin={chartMargin}>{commonGrid}<XAxis dataKey="name" tick={{fontSize:10}}/><YAxis width={yAxisWidth} domain={[0,60]}/><Bar dataKey="Avg" fill="#82ca9d" label={renderCustomLabel}/></BarChart></ResponsiveContainer>
      );
      default: return null;
    }
  };

  const getGraphTitle = (id) => {
    switch(id) {
      case 1: return "1. 종합 점수 추이";
      case 2: return "2. L&S vs R&W 비중 변화";
      case 3: return "3. L&S 세부 영역 누적";
      case 4: return "4. R&W 세부 영역 누적";
      case 5: return "5. 회차별 종합 성적 비교"; 
      // case 6: Removed
      case 7: return "7. 전체 평균 대비 위치";
      case 8: return "8. 월별 태도 변화";
      case 9: return "9. Speaking 성장세";
      case 10: return "10. Writing 성장세";
      case 11: return "11. Grammar 정확도";
      case 12: return "12. Reading 독해력";
      case 13: return "13. 평균 대비 편차";
      case 14: return "14. 분기별 평균 점수";
      default: return "";
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
                { id: 'input', label: '3. 점수입력', icon: Save },
                { id: 'report', label: '4. 성적표', icon: FileText },
                { id: 'dashboard', label: '5. 통계', icon: BarChart2 }
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
            
            {/* TAB 1: 전체학생관리 */}
            {activeTab === 'students' && (
               <div className="flex flex-col gap-6">
                 {/* 설정(Configuration) 섹션 */}
                 {showConfig && (
                   <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6 animate-fade-in-down">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Settings size={20}/> 환경 설정 (학교, 학년, 클래스 관리)</h3>
                       <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-red-500 bg-transparent"><X size={20}/></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* [1번 요청] 학교 관리 추가 */}
                        <div className="flex flex-col gap-2">
                         <h4 className="text-sm font-bold text-gray-600">학교(School) 목록</h4>
                         <div className="flex flex-wrap gap-2 mb-2">
                           {schools.map(s => (
                             <span key={s} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 border">
                               {s} <button onClick={() => handleDeleteSchool(s)} className="text-gray-400 hover:text-red-500 bg-transparent"><X size={12}/></button>
                             </span>
                           ))}
                         </div>
                         <div className="flex gap-2">
                           <input type="text" placeholder="예: 초등Z교" className="border p-2 rounded text-sm flex-1 bg-white" value={newSchoolInput} onChange={(e) => setNewSchoolInput(e.target.value)}/>
                           <button onClick={handleAddSchool} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">추가</button>
                         </div>
                       </div>
                       {/* 학년 관리 */}
                       <div className="flex flex-col gap-2">
                         <h4 className="text-sm font-bold text-gray-600">학년(Grade) 목록</h4>
                         <div className="flex flex-wrap gap-2 mb-2">
                           {grades.map(g => (
                             <span key={g} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 border">
                               {g} <button onClick={() => handleDeleteGrade(g)} className="text-gray-400 hover:text-red-500 bg-transparent"><X size={12}/></button>
                             </span>
                           ))}
                         </div>
                         <div className="flex gap-2">
                           <input type="text" placeholder="예: Middle-1" className="border p-2 rounded text-sm flex-1 bg-white" value={newGradeInput} onChange={(e) => setNewGradeInput(e.target.value)}/>
                           <button onClick={handleAddGrade} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">추가</button>
                         </div>
                       </div>
                       {/* 클래스 관리 */}
                       <div className="flex flex-col gap-2">
                         <h4 className="text-sm font-bold text-gray-600">클래스(Class) 목록</h4>
                         <div className="flex flex-wrap gap-2 mb-2">
                           {classes.map(c => (
                             <span key={c} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 border">
                               {c} <button onClick={() => handleDeleteClass(c)} className="text-gray-400 hover:text-red-500 bg-transparent"><X size={12}/></button>
                             </span>
                           ))}
                         </div>
                         <div className="flex gap-2">
                           <input type="text" placeholder="예: Adv-A" className="border p-2 rounded text-sm flex-1 bg-white" value={newClassInput} onChange={(e) => setNewClassInput(e.target.value)}/>
                           <button onClick={handleAddClass} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">추가</button>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="bg-white p-6 rounded-lg shadow border border-indigo-200 bg-indigo-50 relative">
                   <button 
                     onClick={() => setShowConfig(!showConfig)} 
                     className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-colors bg-transparent"
                     title="환경 설정 (학년/클래스/학교 관리)"
                   >
                     <Settings size={20}/>
                   </button>
                   <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center gap-2"><UserPlus size={20}/> 신규 학생 등록</h3>
                   <div className="flex flex-wrap gap-4 items-end">
                     {/* [2번 요청] 이름 입력 분리 */}
                     <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">한글 이름</label><input type="text" placeholder="예: 홍길동" className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.nameK} onChange={(e) => setNewStudent({...newStudent, nameK: e.target.value})} /></div>
                     <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">영어 이름</label><input type="text" placeholder="예: Gildong" className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.nameE} onChange={(e) => setNewStudent({...newStudent, nameE: e.target.value})} /></div>
                     
                     <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학교</label><select className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.school} onChange={(e) => setNewStudent({...newStudent, school: e.target.value})}>{schools.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                     <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학년</label><select className="border p-2 rounded w-24 bg-white text-gray-900" value={newStudent.grade} onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}>{grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">Class</label><select className="border p-2 rounded w-32 bg-white text-gray-900" value={newStudent.classInfo} onChange={(e) => setNewStudent({...newStudent, classInfo: e.target.value})}>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                     <button onClick={handleAddStudent} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold">+ 등록</button>
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                   <h2 className="text-lg font-bold text-gray-800 mb-4">학생 목록</h2>
                   <table className="w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="p-2 border w-16">No.</th><th className="p-2 border">이름 (클릭하여 관리)</th><th className="p-2 border">학교</th><th className="p-2 border">학년</th><th className="p-2 border">Class</th><th className="p-2 border w-20">관리</th></tr></thead>
                     <tbody>{students.map((s, idx) => (
                       <tr key={s.id} className="border-b hover:bg-gray-50">
                         <td className="p-2 border text-center">{idx + 1}</td>
                         <td className="p-2 border font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handleNameClick(s.id)}>{s.nameE} ({s.nameK})</td>
                         <td className="p-2 border">{s.school}</td>
                         <td className="p-2 border">{s.grade}</td>
                         <td className="p-2 border text-indigo-600">{s.classInfo}</td>
                         <td className="p-2 border text-center"><button onClick={() => handleDeleteStudent(s.id)} className="bg-white p-1 rounded border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16}/></button></td>
                       </tr>
                     ))}</tbody>
                   </table>
                 </div>
               </div>
            )}

            {/* TAB 2: 세부학생관리 */}
            {activeTab === 'detail' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-bold text-gray-800">학생 선택:</h2>
                      <select className="border p-2 rounded w-64 bg-white text-gray-900" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        {students.map(s => <option key={s.id} value={s.id}>{s.nameE} ({s.nameK}) - {s.classInfo}</option>)}
                      </select>
                    </div>
                    {selectedStudentInfo.id && (
                      <button onClick={handleGoToReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm">
                        <ExternalLink size={16}/> 📄 성적표 보기
                      </button>
                    )}
                  </div>

                  {selectedStudentInfo.id && (
                    <>
                      <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded border">
                        <div><label className="text-xs font-bold text-gray-500">이름</label><input type="text" className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.displayName} readOnly /></div>
                        <div><label className="text-xs font-bold text-gray-500">학교</label><input type="text" className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.school} onChange={(e) => handleUpdateStudentInfo('school', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-gray-500">학년</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.grade} onChange={(e) => handleUpdateStudentInfo('grade', e.target.value)}>{grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500">Class</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.classInfo} onChange={(e) => handleUpdateStudentInfo('classInfo', e.target.value)}>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      </div>

                      {/* 전체 기간 성적 관리 (Scrollable) */}
                      <div className="mb-8">
                         <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2"><Save size={20}/> 전체 기간 성적 관리 (2020-01 ~)</h3>
                         <div className="border rounded-lg bg-white relative shadow-sm">
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-xs text-center whitespace-nowrap bg-white">
                                <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 shadow-sm">
                                  <tr><th className="p-3 border-b">Date</th><th className="p-3 border-b">Recog(5)</th><th className="p-3 border-b">Resp(5)</th><th className="p-3 border-b">Retell(15)</th><th className="p-3 border-b">Speak(5)</th><th className="p-3 border-b">Gram(5)</th><th className="p-3 border-b">Writ(5)</th><th className="p-3 border-b">Prac(10)</th><th className="p-3 border-b">Read(10)</th><th className="p-3 border-b">Total</th><th className="p-3 border-b">삭제</th></tr>
                                </thead>
                                <tbody>
                                  {studentDetailScores.map(score => (
                                    <tr key={score.id} className={`border-b ${score.isDummy ? 'bg-gray-50 opacity-60' : 'hover:bg-indigo-50'} last:border-none`}>
                                      <td className="p-2 border-r bg-gray-50">{score.date}</td>
                                      {[1,2,3,4].map(i => <td key={`ls${i}`} className="p-0 border-r"><input type="number" className="w-full text-center p-2 bg-transparent outline-none" value={score[`ls${i}`]} onChange={(e) => handleDetailScoreChange(score.id, `ls${i}`, Number(e.target.value))}/></td>)}
                                      {[1,2,3,4].map(i => <td key={`rw${i}`} className="p-0 border-r"><input type="number" className="w-full text-center p-2 bg-transparent outline-none" value={score[`rw${i}`]} onChange={(e) => handleDetailScoreChange(score.id, `rw${i}`, Number(e.target.value))}/></td>)}
                                      <td className="p-2 border-r font-bold">{score.total}</td>
                                      <td className="p-0"><button onClick={() => handleDeleteDetailScore(score.id)} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500 bg-transparent"><Trash2 size={14}/></button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                         </div>
                      </div>

                      {/* 15+ Analysis Graphs Dashboard */}
                      {analysisCharts && (
                        <div>
                          <div className="flex items-center justify-between mb-4 border-b pb-2 border-indigo-100">
                            <h3 className="font-bold text-xl text-indigo-800 flex items-center gap-2"><Activity size={24}/> 종합 분석 대시보드 (Analysis Dashboard)</h3>
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">성적표에 추가하려면 각 그래프 상단의 체크박스를 선택하세요.</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            
                            {[
                                { id: 1, title: '1. 종합 점수 추이', icon: TrendingUp, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,60]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2}/><Line type="monotone" dataKey="Average" stroke="#9ca3af" strokeDasharray="3 3"/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 2, title: '2. L&S vs R&W 비중 변화', icon: Layers, content: (
                                    <div className="h-48"><ResponsiveContainer><AreaChart data={analysisCharts.areaData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Area type="monotone" dataKey="LS" stackId="1" stroke="#8884d8" fill="#8884d8"/><Area type="monotone" dataKey="RW" stackId="1" stroke="#82ca9d" fill="#82ca9d"/></AreaChart></ResponsiveContainer></div>
                                )},
                                { id: 3, title: '3. L&S 세부 영역 누적', icon: BarChartIcon, content: (
                                    <div className="h-48"><ResponsiveContainer><BarChart data={analysisCharts.lsStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 30]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Recog" stackId="a" fill="#8884d8"/><Bar dataKey="Resp" stackId="a" fill="#82ca9d"/><Bar dataKey="Retell" stackId="a" fill="#ffc658"/><Bar dataKey="Speak" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
                                )},
                                { id: 4, title: '4. R&W 세부 영역 누적', icon: BarChartIcon, content: (
                                    <div className="h-48"><ResponsiveContainer><BarChart data={analysisCharts.rwStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 30]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Gram" stackId="a" fill="#8884d8"/><Bar dataKey="Writ" stackId="a" fill="#82ca9d"/><Bar dataKey="Prac" stackId="a" fill="#ffc658"/><Bar dataKey="Read" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
                                )},
                                { id: 5, title: '5. 회차별 종합 성적 비교', icon: LineChartIcon, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.subjectScoreAnalysisData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={['auto', 'auto']}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Legend verticalAlign="top" height={36}/><Line type="monotone" dataKey="MyScore" stroke="#D97706" strokeWidth={2} name="내점수"/><Line type="monotone" dataKey="ClassAvg" stroke="#F59E0B" strokeWidth={2} name="반평균"/><Line type="monotone" dataKey="TotalAvg" stroke="#10B981" strokeWidth={2} name="전체응시생"/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 7, title: '7. 전체 평균 대비 위치', icon: TrendingUp, content: (
                                    <div className="h-48"><ResponsiveContainer><ComposedChart data={analysisCharts.compareData}><CartesianGrid stroke="#f5f5f5"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="MyScore" barSize={20} fill="#413ea0"/><Line type="monotone" dataKey="ClassAvg" stroke="#ff7300"/></ComposedChart></ResponsiveContainer></div>
                                )},
                                { id: 8, title: '8. 월별 태도 변화', icon: Sparkles, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.attitudeData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,12]} ticks={[3, 7, 10]} tickFormatter={(val) => val === 10 ? 'Ex' : val === 7 ? 'Gd' : 'Bd'} width={40} tick={{fontSize: 10}}/><RechartsTooltip formatter={(val) => val === 10 ? 'Excellent' : val === 7 ? 'Good' : val === 3 ? 'Bad' : val}/><Line type="step" dataKey="Attendance" stroke="#82ca9d"/><Line type="step" dataKey="Homework" stroke="#8884d8"/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 9, title: '9. Speaking 성장세', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.speakingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#ff7300" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 10, title: '10. Writing 성장세', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.writingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#387908" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 11, title: '11. Grammar 정확도', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><AreaChart data={analysisCharts.grammarData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Area type="monotone" dataKey="Score" stroke="#8884d8" fill="#8884d8" /></AreaChart></ResponsiveContainer></div>
                                )},
                                { id: 12, title: '12. Reading 독해력', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><LineChart data={analysisCharts.readingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,10]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#82ca9d" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                                )},
                                { id: 13, title: '13. 평균 대비 편차', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><BarChart data={analysisCharts.deviationData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Deviation" fill="#8884d8" /></BarChart></ResponsiveContainer></div>
                                )},
                                { id: 14, title: '14. 분기별 평균 점수', icon: null, content: (
                                    <div className="h-48"><ResponsiveContainer><BarChart data={analysisCharts.quarterlyData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,60]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Avg" fill="#82ca9d" /></BarChart></ResponsiveContainer></div>
                                )}
                            ].map((chart) => (
                              <div key={chart.id} className="bg-white border rounded-lg p-4 shadow-sm flex flex-col gap-2 relative">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-sm text-gray-600 flex gap-2 items-center">
                                    {chart.icon && <chart.icon size={14}/>} {chart.title}
                                  </h4>
                                  <button 
                                    onClick={() => toggleReportGraph(chart.id)} 
                                    className={`p-1 rounded transition-colors ${selectedReportGraphs.includes(chart.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title="성적표에 추가"
                                  >
                                    {selectedReportGraphs.includes(chart.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                                  </button>
                                </div>
                                {chart.content}
                              </div>
                            ))}

                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: 점수 입력 */}
            {activeTab === 'input' && (
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">3. 월별 점수 입력</h2>
                    <div className="text-sm text-gray-500">입력 시 자동 저장됩니다. 최대 배점: L&S(5,5,15,5) / R&W(5,5,10,10)</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={handleResetSort} className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 bg-white border px-3 py-1 rounded shadow-sm">
                      <RefreshCcw size={14}/> 정렬 초기화 (No.순)
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg border border-gray-200">
                      <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-white rounded bg-transparent"><ChevronLeft size={20}/></button>
                      <select value={inputYear} onChange={(e) => setInputYear(Number(e.target.value))} className="bg-white border border-gray-300 text-sm rounded p-1">{YEARS.map(y => <option key={y} value={y}>{y}년</option>)}</select>
                      <select value={inputMonth} onChange={(e) => setInputMonth(Number(e.target.value))} className="bg-white border border-gray-300 text-sm rounded p-1">{MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}</select>
                      <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-white rounded bg-transparent"><ChevronRight size={20}/></button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto border rounded-lg shadow-inner bg-gray-50 relative">
                  <table className="w-full text-xs text-center whitespace-nowrap bg-white border-collapse">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 z-30 font-bold shadow-sm">
                      <tr>
                        <th onClick={() => handleSort('name')} className="p-2 border bg-indigo-50 sticky left-0 z-40 w-24 cursor-pointer hover:bg-indigo-100 border-r-2 border-r-gray-300">이름 <ArrowUpDown size={12} className="inline"/></th>
                        <th onClick={() => handleSort('classInfo')} className="p-2 border bg-indigo-50 w-20 cursor-pointer hover:bg-indigo-100">Class <ArrowUpDown size={12} className="inline"/></th>
                        <th colSpan="4" className="p-1 border bg-blue-100 text-blue-900 border-b-2 border-blue-300">Monthly Eval (L&S)</th>
                        <th colSpan="4" className="p-1 border bg-green-100 text-green-900 border-b-2 border-green-300">Monthly Eval (R&W)</th>
                        <th colSpan="4" className="p-1 border bg-purple-100 text-purple-900 border-b-2 border-purple-300">Class Progress</th>
                        <th colSpan="2" className="p-1 border bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300">Attitude</th>
                        <th onClick={() => handleSort('total')} className="p-2 border bg-gray-200 w-12 sticky right-0 z-40 shadow-l cursor-pointer hover:bg-gray-300">Total <ArrowUpDown size={12} className="inline"/></th>
                      </tr>
                      <tr>
                        <th className="p-2 border bg-indigo-50 sticky left-0 z-40 border-r-2 border-r-gray-300"></th><th className="p-2 border bg-indigo-50"></th>
                        <th onClick={() => handleSort('ls1')} className="p-1 border bg-blue-50 cursor-pointer w-10">Recog</th><th onClick={() => handleSort('ls2')} className="p-1 border bg-blue-50 cursor-pointer w-10">Resp</th><th onClick={() => handleSort('ls3')} className="p-1 border bg-blue-50 cursor-pointer w-10">Retell</th><th onClick={() => handleSort('ls4')} className="p-1 border bg-blue-50 cursor-pointer w-10">Speak</th>
                        <th onClick={() => handleSort('rw1')} className="p-1 border bg-green-50 cursor-pointer w-10">Gram</th><th onClick={() => handleSort('rw2')} className="p-1 border bg-green-50 cursor-pointer w-10">Writ</th><th onClick={() => handleSort('rw3')} className="p-1 border bg-green-50 cursor-pointer w-10">Prac</th><th onClick={() => handleSort('rw4')} className="p-1 border bg-green-50 cursor-pointer w-10">Read</th>
                        <th className="p-1 border w-10 bg-purple-50">Read</th><th className="p-1 border w-10 bg-purple-50">List</th><th className="p-1 border w-10 bg-purple-50">Writ</th><th className="p-1 border w-10 bg-purple-50">Gram</th>
                        <th className="p-1 border w-10 bg-yellow-50">Att</th><th className="p-1 border w-10 bg-yellow-50">H.W</th>
                        <th className="p-2 border bg-gray-100 sticky right-0 z-40 shadow-l">60</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inputTableData.map((row) => (
                        <tr key={row.id} className={`border-b hover:bg-indigo-50 transition-colors h-10 group ${row.isNew ? 'bg-gray-50 opacity-80' : 'bg-white'}`}>
                          <td className="p-2 border sticky left-0 bg-white z-20 font-bold text-indigo-600 text-left border-r-2 border-r-gray-200 cursor-pointer hover:underline truncate max-w-[100px]" onClick={() => handleNameClick(row.studentId)}>{row.name}</td>
                          <td className="p-2 border text-gray-500 bg-gray-50 truncate max-w-[80px]">{row.classInfo}</td>
                          {[1,2,3,4].map(i => <td key={`ls${i}`} className="p-0 border h-10"><input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={row[`ls${i}`]} onChange={e => handleInputScoreChange(row.studentId, `ls${i}`, Number(e.target.value))} /></td>)}
                          {[1,2,3,4].map(i => <td key={`rw${i}`} className="p-0 border h-10"><input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={row[`rw${i}`]} onChange={e => handleInputScoreChange(row.studentId, `rw${i}`, Number(e.target.value))} /></td>)}
                          {['cp_reading', 'cp_listening', 'cp_writing', 'cp_grammar', 'att_attendance', 'att_homework'].map(field => (
                            <td key={field} className="p-0 border h-10"><select className="w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0" value={row[field]} onChange={e => handleInputScoreChange(row.studentId, field, e.target.value)}><option value="Excellent">Ex</option><option value="Good">Gd</option><option value="Bad">Bd</option></select></td>
                          ))}
                          <td className="p-0 border text-center sticky right-0 z-20 bg-white group-hover:bg-gray-50 h-10">
                               <div className="flex items-center justify-center gap-1 w-full h-full">
                                  <span className={`font-bold text-lg ${row.total >= 50 ? 'text-indigo-700' : 'text-gray-700'}`}>{row.total}</span>
                                  {!row.isNew && (
                                     <button onClick={() => handleResetScore(row.studentId)} className="text-gray-300 hover:text-red-500 transition-colors bg-transparent" title="초기화 (0점/Good)"><RefreshCcw size={10}/></button>
                                  )}
                               </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: 성적표 */}
            {activeTab === 'report' && (
              <div className="flex flex-col h-full gap-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                  <label className="font-bold">성적표 출력 대상:</label>
                  <select className="border p-2 rounded w-64 bg-white text-gray-900" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nameE} ({s.nameK}) - {s.classInfo}</option>)}
                  </select>
                </div>

                {selectedStudentId ? (
                <div className="w-full flex flex-col items-center gap-8 pb-20">
                  {/* === PAGE 1 === */}
                  <div style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} className="bg-white p-12 rounded-lg shadow-lg border border-gray-400 flex flex-col gap-4 mx-auto print:break-after-page">
                    <div className="flex justify-between items-end border-b-4 border-gray-800 pb-4">
                      <div>
                        <h1 className="text-4xl font-serif font-bold tracking-wider text-gray-900">PROGRESS REPORT</h1>
                        <div className="mt-4 text-lg font-medium space-y-1">
                          <p>Name : <span className="font-bold text-xl">{selectedStudentInfo?.nameE} ({selectedStudentInfo?.nameK})</span></p>
                          <p>Grade : {selectedStudentInfo?.grade || '-'} &nbsp;|&nbsp; Level : {selectedStudentInfo?.classInfo || '-'}</p>
                          <p className="text-sm text-gray-500 mt-1">Date : {latestScore?.examId || '-'}</p>
                        </div>
                      </div>
                      <div className="w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center font-serif font-bold text-xl">M<br/><span className="text-xs">ENGLISH</span></div>
                    </div>

                    {latestScore?.id ? (
                      <>
                        {/* Monthly Evaluation */}
                        <div>
                          <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Monthly Evaluation</h3>
                          <table className="w-full border-2 border-gray-800 text-sm">
                            <thead><tr className="bg-gray-200 border-b-2 border-gray-800"><th className="p-2 border-r border-gray-400 w-1/4">영역</th><th className="p-2 border-r border-gray-400 w-1/2">세부 항목</th><th className="p-2 border-r border-gray-400">배점</th><th className="p-2">득점</th></tr></thead>
                            <tbody>
                                <tr className="border-b border-gray-300"><td rowSpan="4" className="p-2 border-r text-center bg-blue-50 font-bold">Listening<br/>& Speaking</td><td className="p-2 border-r">Listen and Recognize</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{latestScore.ls1}</td></tr>
                                <tr className="border-b border-gray-300"><td className="p-2 border-r">Listen and Respond</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{latestScore.ls2}</td></tr>
                                <tr className="border-b border-gray-300"><td className="p-2 border-r">Listen and Retell</td><td className="p-2 border-r text-center">15</td><td className="p-2 text-center font-bold">{latestScore.ls3}</td></tr>
                                <tr className="border-b-2 border-gray-800"><td className="p-2 border-r">Listen and Speak</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{latestScore.ls4}</td></tr>
                                <tr className="border-b border-gray-300"><td rowSpan="4" className="p-2 border-r text-center bg-green-50 font-bold">Reading<br/>& Writing</td><td className="p-2 border-r">Sentence Completion</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{latestScore.rw1}</td></tr>
                                <tr className="border-b border-gray-300"><td className="p-2 border-r">Situational Writing</td><td className="p-2 border-r text-center">5</td><td className="p-2 text-center font-bold">{latestScore.rw2}</td></tr>
                                <tr className="border-b border-gray-300"><td className="p-2 border-r">Practical Reading</td><td className="p-2 border-r text-center">10</td><td className="p-2 text-center font-bold">{latestScore.rw3}</td></tr>
                                <tr className="border-b-2 border-gray-800"><td className="p-2 border-r">Reading & Retelling</td><td className="p-2 border-r text-center">10</td><td className="p-2 text-center font-bold">{latestScore.rw4}</td></tr>
                                <tr className="bg-gray-100 font-bold"><td colSpan="2" className="p-2 border-r text-center">TOTAL SCORE</td><td className="p-2 border-r text-center">60</td><td className="p-2 text-center text-indigo-700 text-lg">{latestScore.total}</td></tr>
                            </tbody>
                          </table>
                        </div>
                        {/* Class Progress */}
                        <div>
                          <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Class Progress</h3>
                          <table className="w-full border-2 border-gray-800 text-sm text-center">
                            <thead className="bg-gray-200 border-b-2 border-gray-800"><tr><th className="p-2 border-r border-gray-400 w-1/4">Reading</th><th className="p-2 border-r border-gray-400 w-1/4">Listening</th><th className="p-2 border-r border-gray-400 w-1/4">Writing</th><th className="p-2 w-1/4">Grammar</th></tr></thead>
                            <tbody><tr className="border-b border-gray-800"><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{latestScore.cp_reading}</td><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{latestScore.cp_listening}</td><td className="p-2 border-r border-gray-400 font-bold text-indigo-700">{latestScore.cp_writing}</td><td className="p-2 font-bold text-indigo-700">{latestScore.cp_grammar}</td></tr></tbody>
                          </table>
                        </div>
                        {/* Detail & Comment */}
                        <div className="flex flex-col md:flex-row gap-6 flex-1">
                          <div className="flex-1 flex flex-col gap-4">
                            <div className="h-56 border-2 border-gray-800 p-2 relative rounded-sm">
                              <h4 className="absolute top-2 left-2 font-bold text-sm bg-white px-1 z-10">* Detail Analysis</h4>
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="55%" outerRadius="70%" data={[{ subject: 'Recognize', A: ((latestScore.ls1 || 0) / 5) * 100, full: 5 }, { subject: 'Respond', A: ((latestScore.ls2 || 0) / 5) * 100, full: 5 }, { subject: 'L-Retell', A: ((latestScore.ls3 || 0) / 15) * 100, full: 15 }, { subject: 'Speak', A: ((latestScore.ls4 || 0) / 5) * 100, full: 5 }, { subject: 'Grammar', A: ((latestScore.rw1 || 0) / 5) * 100, full: 5 }, { subject: 'Writing', A: ((latestScore.rw2 || 0) / 5) * 100, full: 5 }, { subject: 'Reading', A: ((latestScore.rw3 || 0) / 10) * 100, full: 10 }, { subject: 'R-Retell', A: ((latestScore.rw4 || 0) / 10) * 100, full: 10 }]}>
                                  <PolarGrid gridType="polygon" /><PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} /><PolarRadiusAxis angle={30} domain={[0, 100]} hide /><Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
                                  {/* [2번 요청] Legend 삭제 */}
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="border-2 border-gray-800 p-4 rounded-sm flex flex-col justify-center bg-gray-50">
                              <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-300 pb-2">* Class Attitude</h3>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Attendance</span><span className={`font-bold px-3 py-1 rounded text-white ${latestScore.att_attendance === 'Excellent' ? 'bg-green-600' : latestScore.att_attendance === 'Good' ? 'bg-blue-500' : 'bg-red-400'}`}>{latestScore.att_attendance || '-'}</span></div>
                                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Homework</span><span className={`font-bold px-3 py-1 rounded text-white ${latestScore.att_homework === 'Excellent' ? 'bg-green-600' : latestScore.att_homework === 'Good' ? 'bg-blue-500' : 'bg-red-400'}`}>{latestScore.att_homework || '-'}</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 border-2 border-gray-800 p-4 rounded-sm bg-indigo-50 relative flex flex-col">
                            <div className="flex justify-between items-center mb-3 border-b-2 border-gray-300 pb-2">
                              <h3 className="font-bold text-lg flex items-center gap-2">* Teacher's Comment</h3>
                              <button onClick={generateAIComment} disabled={isGeneratingAI} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded text-xs font-bold shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50">{isGeneratingAI ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}{isGeneratingAI ? '생성 중...' : 'AI 코멘트 생성'}</button>
                            </div>
                            <textarea className="w-full flex-1 p-3 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-indigo-300 outline-none resize-none text-sm leading-relaxed text-gray-900" placeholder="AI 버튼을 누르거나 직접 입력하세요." value={latestScore.teacher_comment || ''} onChange={(e) => handleEditScore(latestScore.id, 'teacher_comment', e.target.value)} />
                          </div>
                        </div>
                      </>
                    ) : <div className="text-center py-20 text-gray-500">선택된 학생의 성적 데이터가 없습니다.</div>}
                  </div>

                  {/* === PAGE 2: History & Trend === */}
                  <div style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} className="bg-white p-12 rounded-lg shadow-lg border border-gray-400 flex flex-col gap-8 mx-auto mt-8 print:mt-0 print:break-after-page">
                     <div className="border-b-4 border-gray-800 pb-4 mb-4">
                        <h1 className="text-3xl font-serif font-bold tracking-wider text-gray-900">HISTORY & ANALYSIS</h1>
                        <p className="text-gray-600 mt-2">{selectedStudentInfo.name} 학생의 성적 변화 추이</p>
                     </div>
                     <div className="flex-1">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-l-4 border-indigo-600 pl-2">1. Score History (Recent 5 Months)</h3>
                        <table className="w-full border-2 border-gray-800 text-sm text-center">
                          <thead className="bg-gray-100 border-b-2 border-gray-800 font-bold"><tr><th className="p-3 border-r border-gray-300">Date</th><th className="p-3 border-r border-gray-300">L&S Score</th><th className="p-3 border-r border-gray-300">R&W Score</th><th className="p-3 bg-yellow-50">Total Score</th></tr></thead>
                          <tbody>
                            {studentHistory.slice(0, 5).map((score) => (
                              <tr key={score.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 border-r border-gray-200">{score.date}</td><td className="p-3 border-r border-gray-200 text-blue-600">{score.lsTotal} / 30</td><td className="p-3 border-r border-gray-200 text-green-600">{score.rwTotal} / 30</td><td className="p-3 font-bold text-lg bg-yellow-50 border-l-2 border-l-gray-200">{score.total}</td>
                              </tr>
                            ))}
                            {studentHistory.length === 0 && <tr><td colSpan="4" className="p-4">기록이 없습니다.</td></tr>}
                          </tbody>
                        </table>
                     </div>
                     <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg flex items-center gap-2 border-l-4 border-indigo-600 pl-2">2. Growth Trend</h3>
                          <div className="flex bg-gray-100 p-1 rounded-lg text-xs">
                            <button onClick={() => setGraphMode('monthly')} className={`px-3 py-1 rounded ${graphMode === 'monthly' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}>월별</button>
                            <button onClick={() => setGraphMode('quarterly')} className={`px-3 py-1 rounded ${graphMode === 'quarterly' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}>분기별</button>
                            <button onClick={() => setGraphMode('yearly')} className={`px-3 py-1 rounded ${graphMode === 'yearly' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}>년도별</button>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 h-80 bg-white mb-6">
                           {graphData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={graphData} margin={{ top: 30, right: 10, left: 10, bottom: 10 }}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                 <XAxis dataKey="name" padding={{ left: 30, right: 30 }} tick={{fontSize: 12}} />
                                 <YAxis domain={[0, 60]} hide/>
                                 <RechartsTooltip />
                                 <Legend />
                                 {Object.keys(graphData[0]).filter(key => key !== 'name').map((key, index) => (
                                   <Line key={key} type="monotone" dataKey={key} stroke={getLineColor(index)} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls label={{position: 'top', dy: -5, fontSize: 10, fill: getLineColor(index)}} />
                                 ))}
                               </LineChart>
                             </ResponsiveContainer>
                           ) : <div className="h-full flex items-center justify-center text-gray-400">데이터가 부족합니다.</div>}
                        </div>

                        {/* Page 2 Bottom: Up to 2 selected charts */}
                        {page2Charts.length > 0 && (
                          <div className="mt-6">
                             <h3 className="font-bold text-lg mb-2 flex items-center gap-2 border-l-4 border-indigo-600 pl-2">3. Detailed Analysis Charts</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {page2Charts.map(graphId => (
                                 <div key={graphId} className="border rounded-lg p-2 bg-white shadow-sm h-56 flex flex-col">
                                    <h4 className="font-bold text-sm text-gray-700 mb-1">{getGraphTitle(graphId)}</h4>
                                    <div className="flex-1">
                                       {renderReportGraph(graphId)}
                                    </div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* === PAGE 3+: Extra Detailed Charts === */}
                  {extraPages.map((pageCharts, idx) => (
                    <div key={idx} style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} className="bg-white p-12 rounded-lg shadow-lg border border-gray-400 flex flex-col gap-4 mx-auto mt-8 print:break-before-page print:mt-0">
                       <div className="border-b-4 border-gray-800 pb-2 mb-2">
                          <h1 className="text-2xl font-serif font-bold tracking-wider text-gray-900">DETAILED ANALYSIS ({idx + 2})</h1>
                          <p className="text-gray-600 mt-1">{selectedStudentInfo.name} - 추가 분석 차트</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                          {pageCharts.map(graphId => (
                             <div key={graphId} className="border rounded-lg p-2 bg-white shadow-sm h-72 flex flex-col">
                                <h4 className="font-bold text-sm text-gray-700 mb-1">{getGraphTitle(graphId)}</h4>
                                <div className="flex-1">
                                   {renderReportGraph(graphId)}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
                ) : <div className="text-center p-10 text-gray-500">학생을 선택해주세요.</div>}
              </div>
            )}

            {/* TAB 5: 통계 */}
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
                      <h3 className="font-bold text-lg mb-4 text-gray-800">평균 점수 비교 ({inputYear}년 {inputMonth}월)</h3>
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
                                <td className="p-3 border font-bold text-indigo-900">{d.name}</td><td className="p-3 border">{d.count}명</td><td className="p-3 border bg-blue-50 font-medium">{d.lsAvg}</td><td className="p-3 border bg-green-50 font-medium">{d.rwAvg}</td><td className="p-3 border font-bold bg-gray-100">{d.totalAvg}</td>
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
    </>
  );
};

export default MickeyExcelApp;