import React, { useState, useMemo, useEffect } from 'react';
import { FileText, BarChart2, Save, User, UserCog, Sparkles, Settings, MessageCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';

import StudentManagement from './components/1StudentManagement';
import StudentDetail from './components/2StudentDetail';
import LevelManagement from './components/3LevelManagement';
import ScoreInput from './components/4ScoreInput';
import ReportCard from './components/5ReportCard';
import Statistics from './components/6Statistics';
import VersionHistory, { LATEST_VERSION } from './components/7VersionHistory';
import FeatureRequest from './components/8FeatureRequest';
import { GitCommit } from 'lucide-react';

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
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// [2번 요청] AI 프롬프트 템플릿 변수
const AI_PROMPT_TEMPLATE = `
Role: Korea's Top-tier English Education Expert (1타 강사)
Task: Analyze the student's score data and provide a sharp, strategic report.
Requirements:
1. [Trend]: Briefly analyze the overall score trajectory (Rising, Fluctuating, etc.).
2. [Diagnosis]: Analyze L&S (Listening & Speaking) and R&W (Reading & Writing) SEPARATELY. clearly identify specific strengths and weaknesses in sub-areas for EACH section.
3. [Solution]: Provide specific, high-impact study strategies to improve scores, mimicking the insight of a top-tier instructor.
4. [Format]: **MUST insert a line break (Enter) after EVERY single sentence for readability.**
5. [Length]: The total output must be strictly under 20 lines.
6. [Style]: Professional Korean report style ending in nouns or "~함/mm" (e.g., "문법 보완이 시급함.", "어휘 학습량 증대 요망."). NO polite endings like '요/니다'. NO greetings.
`;

// --- 상수 및 설정 ---
const INITIAL_GRADES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
const INITIAL_LEVELS = [];
const INITIAL_SCHOOLS = ['학교 A', '학교 B', '학교 C']; 

const NAMES = [];

const YEARS = Array.from({ length: 80 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// Text Data for Initialization
const CLASS_SCORE_TXT = `1. PHONICS
       (Phonics 1) - Consonant- Beginning Sound(b, c, d, e, f, g, h, j, k, l) - 0문항
       (Phonics 1) - Consonant- Beginning Sound(m, n, p, q, r, s, t, v) - 0문항
       (Phonics 1) - Consonant- Beginning Sound(w, x, y, z) - 0문항
       (Phonics 1) - Short vowel (a, e, i, o, u) - 0문항
       (Phonics 2) - Long  vowels(-a-e, ee-, -i-e, -o-e, -u-e) - 0문항
       (Phonics 2) - Consonant Blends(sm, sn, sp, sw, cl, gl, pl, br, dr, fr, mp, nk, ft) - 0문항
       (Phonics 2) - Consonant Digraphs(ch, sh, th, wh, ch, ck, ng, sh) - 0문항

2. PRE STARTER
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 5문항
       (RW) - Spell the words (철자쓰고 단어알기) - 5문항
       (RW) - Look and Recognize (그림보고 이해하기) - 5문항
       (RW) - Read and Retell (글을 읽고 질문에 답하기) - 10문항

3. STARTER
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 10문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 5문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항

4. Basic
       (LS) - Listen and Recognize (듣고 이해하기) - 5문항
       (LS) - Listen and Respond (질문 듣고 답하기) - 5문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 15문항
       (LS) - Listen and Speak (듣고 말하기) - 5문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 10문항
       (RW) - Practical Reading and Retelling (실용적인 글을 읽고 질문에 답하기) - 10문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항

5. Junior
       (LS) - Listen and Respond (질문 듣고 답하기) - 10문항
       (LS) - Listen and Retell (대화를 듣고 질문에 답하기) - 10문항
       (LS) - Listen and Speak (듣고 말하기) - 10문항
       (RW) - Sentence Completion (문법, 문장 이해하기) - 5문항
       (RW) - Situational Writing (문장쓰기) - 5문항
       (RW) - Practical Reading and Retelling (실용적인 글을 읽고 질문에 답하기) - 10문항
       (RW) - Reading and Retelling (글을 읽고 질문에 답하기) - 10문항`;

const ATTITUDE_SCORE = { 'Excellent': 10, 'Good': 7, 'NI': 3 };
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Helper for parsing (Parsing Logic handles "Class" text from file, maps to Level)
const parseClassSubjects = (text) => {
  const lines = text.split('\n');
  const config = {};
  let currentLevel = null;

  lines.forEach(line => {
    const classMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (classMatch) {
      let rawName = classMatch[2].trim();
      let levelName = rawName.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
      if (rawName === 'PHONICS') levelName = 'Phonics';
      
      currentLevel = levelName;
      config[currentLevel] = { 
        ls: [], 
        rw: [], 
        lsTitle: 'Listening & Speaking (L&S)', 
        rwTitle: 'Reading & Writing (R&W)' 
      }; 
      return;
    }

    if (!currentLevel) return;
    const trimmed = line.trim();
    if (!trimmed) return;

    const lsMatch = trimmed.match(/^\(LS\)\s-\s(.+?)\s-\s(\d+)문항/);
    const rwMatch = trimmed.match(/^\(RW\)\s-\s(.+?)\s-\s(\d+)문항/);
    const phonicsMatch = trimmed.match(/^\(Phonics\s(\d+)\)\s-\s(.+)$/);

    if (lsMatch) {
      config[currentLevel].ls.push({ name: lsMatch[1].trim(), max: parseInt(lsMatch[2]) });
    } else if (rwMatch) {
      config[currentLevel].rw.push({ name: rwMatch[1].trim(), max: parseInt(rwMatch[2]) });
    } else if (phonicsMatch) {
      const pLevel = phonicsMatch[1];
      const pName = phonicsMatch[2].trim();
      const pMax = 5; 

      if (pLevel === '1') {
        config[currentLevel].ls.push({ name: pName, max: pMax });
        config[currentLevel].lsTitle = 'Phonics 1';
      } else {
        config[currentLevel].rw.push({ name: pName, max: pMax });
        config[currentLevel].rwTitle = 'Phonics 2';
      }
    }
  });
  
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
    
    const [grades, setGrades] = useState(INITIAL_GRADES);
    const [levels, setLevels] = useState(INITIAL_LEVELS);
    const [schools, setSchools] = useState(INITIAL_SCHOOLS); 
    
    const [levelConfig, setLevelConfig] = useState({});
  
    const [newGradeInput, setNewGradeInput] = useState('');
    const [newLevelInput, setNewLevelInput] = useState('');
    const [newSchoolInput, setNewSchoolInput] = useState(''); 
  
    const [showConfig, setShowConfig] = useState(false); 
  
    // Note: classInfo property is kept for DB consistency, but represents "Level"
    const [newStudent, setNewStudent] = useState({ nameK: '', nameE: '', school: '', grade: 'G3', classInfo: '' });
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [statCriteria, setStatCriteria] = useState('level'); // 'level' or 'grade'
  
    const [selectedReportGraphs, setSelectedReportGraphs] = useState([]);
  
    const today = new Date();
    const [inputYear, setInputYear] = useState(today.getFullYear());
    const [inputMonth, setInputMonth] = useState(today.getMonth() + 1);
    
    const [reportDate, setReportDate] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  
    const [graphMode, setGraphMode] = useState('monthly'); 
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
    useEffect(() => {
      const fetchData = async () => {
          if (!db) return;
          setLoading(true);
          try {
              const sSnapshot = await getDocs(collection(db, 'students'));
              const scSnapshot = await getDocs(collection(db, 'scores'));
              const configDoc = await getDoc(doc(db, 'settings', 'subjectConfig'));
              const levelsDoc = await getDoc(doc(db, 'settings', 'classList')); // Originally classList
              const schoolsDoc = await getDoc(doc(db, 'settings', 'schoolList')); 
              const gradesDoc = await getDoc(doc(db, 'settings', 'gradeList')); 

              let loadedLevels = [];
              if (levelsDoc.exists()) {
                  loadedLevels = levelsDoc.data().list;
                  if (loadedLevels && loadedLevels.length > 0) setLevels(loadedLevels);
              } else {
                  await setDoc(doc(db, 'settings', 'classList'), { list: INITIAL_LEVELS });
              }

              if (schoolsDoc.exists()) {
                  const loadedSchools = schoolsDoc.data().list;
                  if (loadedSchools && loadedSchools.length > 0) setSchools(loadedSchools);
              } else {
                  await setDoc(doc(db, 'settings', 'schoolList'), { list: INITIAL_SCHOOLS });
              }

              if (gradesDoc.exists()) {
                  const loadedGrades = gradesDoc.data().list;
                  if (loadedGrades && loadedGrades.length > 0) setGrades(loadedGrades);
              } else {
                  await setDoc(doc(db, 'settings', 'gradeList'), { list: INITIAL_GRADES });
              }
  
              if (configDoc.exists()) {
                  setLevelConfig(configDoc.data());
              } 
  
              const shouldInit = (sSnapshot.empty && !levelsDoc.exists()) || (loadedLevels.length > 0 && !loadedLevels.includes('Phonics'));

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
            
            const parsedConfig = parseClassSubjects(CLASS_SCORE_TXT);
            const levelList = Object.keys(parsedConfig);
            
            if (levelList.length === 0) {
                alert("텍스트 파일 파싱 실패: 레벨을 찾을 수 없습니다.");
                return;
            }

            const batch = writeBatch(db);

            const subjectConfigRef = doc(db, 'settings', 'subjectConfig');
            batch.set(subjectConfigRef, parsedConfig);
            
            const levelListRef = doc(db, 'settings', 'classList');
            batch.set(levelListRef, { list: levelList });
            
            const schoolListRef = doc(db, 'settings', 'schoolList');
            batch.set(schoolListRef, { list: INITIAL_SCHOOLS });
            
            const gradeListRef = doc(db, 'settings', 'gradeList');
            batch.set(gradeListRef, { list: INITIAL_GRADES });

            const firstNames = ['지훈', '서준', '민준', '도윤', '예준', '시우', '하준', '지호', '주원', '지우', '서현', '하은', '민서', '지유', '윤서', '채원', '수아', '지아', '서영', '다은'];
            const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
            const engNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];

            for (let i = 1; i <= 10; i++) {
                const id = `S${String(i).padStart(3, '0')}`;
                const nameK = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
                const nameE = engNames[Math.floor(Math.random() * engNames.length)];
                const school = INITIAL_SCHOOLS[Math.floor(Math.random() * INITIAL_SCHOOLS.length)];
                const grade = INITIAL_GRADES[Math.floor(Math.random() * INITIAL_GRADES.length)];
                const classInfo = levelList[Math.floor(Math.random() * levelList.length)];

                const studentRef = doc(db, 'students', id);
                batch.set(studentRef, {
                    id, nameK, nameE, school, grade, classInfo
                });
            }

            await batch.commit();
            
            setLevelConfig(parsedConfig);
            setLevels(levelList);
            setSchools(INITIAL_SCHOOLS);
            setGrades(INITIAL_GRADES);
            
            alert(`초기화 완료! ${levelList.length}개 레벨과 10명의 학생이 생성되었습니다.\n(${levelList.join(', ')})`);
            
        } catch (e) {
            console.error("DB Init Error:", e);
            alert("초기화 중 오류가 발생했습니다.");
        }
    };

  
  
    const getStudentInfo = (id) => students.find(s => s.id === id);
  
    const getMaxPoints = (levelName) => {
        const config = levelConfig[levelName] || { ls: [], rw: [] };
        const lsMax = (config.ls || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        const rwMax = (config.rw || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        return lsMax + rwMax || 60; 
    };
  
        // --- 데이터 가공 ---
  
        const enrichedScores = useMemo(() => {
  
          return scores.map(score => {
  
            const sInfo = getStudentInfo(score.studentId);
  
            const currentLevel = score.classInfo || sInfo?.classInfo || levels[0] || '';
  
            const config = levelConfig[currentLevel] || { ls: [], rw: [] };
  
            let lsTotal = 0;
            if (config.ls) {
                config.ls.forEach((_, idx) => {
                    lsTotal += Number(score[`ls${idx + 1}`]) || 0;
                });
            } else { 
                 lsTotal = (Number(score.ls1)||0) + (Number(score.ls2)||0) + (Number(score.ls3)||0) + (Number(score.ls4)||0);
            }
  
            let rwTotal = 0;
            if (config.rw) {
                config.rw.forEach((_, idx) => {
                    rwTotal += Number(score[`rw${idx + 1}`]) || 0;
                });
            } else { 
                 rwTotal = (Number(score.rw1)||0) + (Number(score.rw2)||0) + (Number(score.rw3)||0) + (Number(score.rw4)||0);
            }
  
            const total = lsTotal + rwTotal;
            const max = getMaxPoints(currentLevel);
            const percentage = max > 0 ? (total / max) * 100 : 0;
            
            let classProgress = 'NI';
            if (percentage >= 90) classProgress = 'EX';
            else if (percentage >= 60) classProgress = 'GD';

            if (currentLevel === 'Phonics' && total === 0) {
                classProgress = score.classProgress || '';
            }
  
            const displayName = sInfo ? `${sInfo.nameE} (${sInfo.nameK})` : 'Unknown';
  
            return {
              ...score,
              name: displayName, 
              classInfo: currentLevel, 
              grade: sInfo?.grade || '-',
              lsTotal,
              rwTotal,
              total,
              classProgress, // This represents Level Progress
              percentage     
            };
          });
  
        }, [scores, students, levelConfig, getMaxPoints, getStudentInfo]);
  
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
          classInfo: student.classInfo, // Level Info
          grade: student.grade,
          date: targetDate,
          examId: `${inputYear}년 ${inputMonth}월 평가`,
          ls1: 0, ls2: 0, ls3: 0, ls4: 0,
          rw1: 0, rw2: 0, rw3: 0, rw4: 0,
          att_attendance: 'Good', att_homework: 'Good', // 태도는 Good 기본
          lsTotal: 0, rwTotal: 0, total: 0,
          classProgress: isPhonics ? '' : 'NI', // Level Progress
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
          classInfo: '', 
          classProgress: '', 
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
      
    return filtered.filter((item, index, self) => 
        index === self.findIndex((t) => (
            t.date === item.date
        ))
    );
  }, [enrichedScores, selectedStudentId, reportDate]);

  const latestScore = studentHistory.length > 0 ? studentHistory[0] : {};
  
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

    const getMaxPoints = (levelName) => {
        const config = levelConfig[levelName] || { ls: [], rw: [] };
        const lsMax = (config.ls || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        const rwMax = (config.rw || []).reduce((sum, subj) => sum + (subj.max || 0), 0);
        return lsMax + rwMax || 60; 
    };

    const trendData = dataForGraph.map(s => {
        const max = getMaxPoints(s.classInfo);
        return {
            ...s,
            total: Math.round((s.total / max) * 100) 
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

    const subjectScoreAnalysisData = dataForGraph.slice(-4).map(s => {
      const max = getMaxPoints(s.classInfo);
      return {
          date: s.date.substring(5), 
          MyScore: Math.round((s.total / max) * 100),
          LevelAvg: 75 + Math.random() * 10, 
          TotalAvg: 70 + Math.random() * 10  
      };
    });

    const compareData = dataForGraph.map(s => {
      const scoresThisMonth = enrichedScores.filter(es => es.date === s.date && es.classInfo === s.classInfo); 
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
        LevelAvg: avgPercent
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
      const max = getMaxPoints(s.classInfo);
      const myPercent = (s.total / max) * 100;
      const avgPercent = 75; 
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
      const max = getMaxPoints(s.classInfo);
      quarterlyMap[key].push((s.total / max) * 100);
    });
    const quarterlyData = Object.keys(quarterlyMap).map(key => ({
      name: key,
      Avg: Math.round(quarterlyMap[key].reduce((a,b)=>a+b,0) / quarterlyMap[key].length)
    }));

    return { trendData, areaData, lsStackData, rwStackData, subjectScoreAnalysisData, compareData, attitudeData, speakingData, writingData, grammarData, readingData, deviationData, quarterlyData };
  }, [studentDetailScores, enrichedScores, levelConfig]);


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

  const statisticsData = useMemo(() => {
    const grouped = {};
    const currentMonthTarget = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
    const validScores = enrichedScores.filter(s => s.date === currentMonthTarget);

    validScores.forEach(score => {
      const key = statCriteria === 'level' ? score.classInfo : score.grade;
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

  const handleUpdateLevelSubject = async (levelName, subjects) => {
    const updatedSubjects = {
        ...levelConfig,
        [levelName]: subjects
    };
    
    setLevelConfig(updatedSubjects);
    
    try {
        await setDoc(doc(db, 'settings', 'subjectConfig'), updatedSubjects);
    } catch(e) {
        console.error("Failed to save subject config", e);
    }
  };

  const getMaxScoreForField = (levelName, field) => {
      const config = levelConfig[levelName] || { ls: [], rw: [] };
      let max = 5; 
      if (field.startsWith('ls')) {
          const idx = parseInt(field.replace('ls', '')) - 1;
          if (config.ls && config.ls[idx]) max = config.ls[idx].max;
      } else if (field.startsWith('rw')) {
          const idx = parseInt(field.replace('rw', '')) - 1;
          if (config.rw && config.rw[idx]) max = config.rw[idx].max;
      }
      return max;
  };

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
    
    try {
        await setDoc(doc(db, 'students', newId), studentToAdd);
        setStudents([...students, studentToAdd]);
        setNewStudent({ nameK: '', nameE: '', school: schools[0], grade: grades[0], classInfo: levels[0] }); 
        alert(`${newStudent.nameE} 학생이 추가되었습니다!`);
    } catch (e) {
        console.error(e);
        alert("저장 실패");
    }
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('학생을 삭제하면 모든 성적 데이터도 삭제됩니다.')) {
      alert("DB 삭제는 구현되지 않았습니다. (화면에서만 사라짐)");
      setStudents(students.filter(s => s.id !== id));
      setScores(scores.filter(s => s.studentId !== id));
    }
  };

  const handleInputScoreChange = async (studentId, field, value) => {
    const targetDate = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
    const existingScoreIndex = scores.findIndex(s => s.studentId === studentId && s.date === targetDate);
    const student = students.find(s => s.id === studentId);
    const levelInfo = student?.classInfo || levels[0] || '';

    let cleanValue = value;
    if (typeof value === 'number') {
        const max = getMaxScoreForField(levelInfo, field);
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
      const newScore = {
        id: `${Date.now()}_${studentId}`,
        examId: `${inputYear}년 ${inputMonth}월 평가`,
        date: targetDate,
        studentId: studentId,
        classInfo: student?.classInfo, 
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
    const updatedStudents = students.map(s => s.id === selectedStudentId ? { ...s, [field]: value } : s);
    setStudents(updatedStudents);
    
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
    
    let levelInfo = selectedStudentInfo.classInfo;
    if (!String(scoreId).startsWith('dummy_')) {
        const s = scores.find(sc => sc.id === scoreId);
        if (s && s.classInfo) levelInfo = s.classInfo;
    }

    if (typeof value === 'number') {
        const max = getMaxScoreForField(levelInfo, field);
        if (value < 0) cleanValue = 0;
        if (value > max) cleanValue = max;
    }

    let scoreToSave;

    if (String(scoreId).startsWith('dummy_')) {
      const dateStr = scoreId.replace('dummy_', '');
      const sLevel = selectedStudentInfo.classInfo;
      const max = getMaxPoints(sLevel);
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
          classInfo: sLevel, 
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
      
      const sLevel = updatedScore.classInfo || levels[0] || '';
      const config = levelConfig[sLevel] || { ls: [], rw: [] };
      
      let newTotal = 0;
      let lsTotal = 0;
      let rwTotal = 0;

      const lsCount = config.ls ? config.ls.length : 4;
      for (let i = 1; i <= 4; i++) {
          if (i > lsCount) {
              updatedScore[`ls${i}`] = 0; 
          } else {
              lsTotal += Number(updatedScore[`ls${i}`]) || 0;
          }
      }

      const rwCount = config.rw ? config.rw.length : 4;
      for (let i = 1; i <= 4; i++) {
          if (i > rwCount) {
              updatedScore[`rw${i}`] = 0; 
          } else {
              rwTotal += Number(updatedScore[`rw${i}`]) || 0;
          }
      }

      newTotal = lsTotal + rwTotal;
      const max = getMaxPoints(sLevel);
      
      const percent = max > 0 ? (newTotal / max) * 100 : 0;
      let newProgress = 'NI';
      if (percent >= 90) newProgress = 'EX'; else if (percent >= 60) newProgress = 'GD';

      updatedScore.lsTotal = lsTotal;
      updatedScore.rwTotal = rwTotal;
      updatedScore.total = newTotal;
      
      if (field !== 'classProgress') {
          updatedScore.classProgress = newProgress;
      }
      
      updatedScore.percentage = percent;

      const updatedScores = scores.map(s => s.id === scoreId ? updatedScore : s);
      setScores(updatedScores);
      scoreToSave = updatedScore;
    }
    
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

  const handleEditScore = (scoreId, field, value) => {
    setScores(scores.map(s => s.id === scoreId ? { ...s, [field]: value } : s));
  };

  const generateAIComment = async () => {
    if (!latestScore) return;
    if (!apiKey) return alert('API Key가 없습니다.');
    setIsGeneratingAI(true);
    
    const data = latestScore;
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

  const handleAddLevel = async () => {
    if (newLevelInput && !levels.includes(newLevelInput)) {
      const newLevels = [...levels, newLevelInput];
      setLevels(newLevels);
      
      const newSubjectConfig = { ...levelConfig };
      newSubjectConfig[newLevelInput] = { ls: [], rw: [], lsTitle: 'L&S', rwTitle: 'R&W' }; 
      setLevelConfig(newSubjectConfig);

      try {
        if(db) {
          await setDoc(doc(db, 'settings', 'classList'), { list: newLevels });
          await setDoc(doc(db, 'settings', 'subjectConfig'), newSubjectConfig);
        }
      } catch(e) { console.error("Error saving level:", e); }
      
      setNewLevelInput('');
    }
  };

  const handleDeleteLevel = async (c) => {
    if (window.confirm(`'${c}' 레벨을 삭제하시겠습니까?`)) {
      const newLevels = levels.filter(item => item !== c);
      setLevels(newLevels);
      
      try {
        if(db) {
           await setDoc(doc(db, 'settings', 'classList'), { list: newLevels });
        }
      } catch(e) { console.error("Error deleting level:", e); }
    }
  };

  const toggleReportGraph = (graphId) => {
    if (selectedReportGraphs.includes(graphId)) {
      setSelectedReportGraphs(selectedReportGraphs.filter(id => id !== graphId));
    } else {
      setSelectedReportGraphs([...selectedReportGraphs, graphId]);
    }
  };

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

  // 임시 데이터 생성 (특수 학생)
  const handleSeedSpecialData = async () => {
      if(!db) return;
      if(window.confirm('테스트용 특수 학생 5명을 생성하시겠습니까?')) {
          const batch = writeBatch(db);
          const specialStudents = [
              { id: 'ST001', nameK: '꾸준이', nameE: 'Steady', school: 'Test A', grade: 'G5', classInfo: levels[0] || 'Starter' },
              { id: 'ST002', nameK: '성장이', nameE: 'Grow', school: 'Test A', grade: 'G4', classInfo: levels[0] || 'Starter' },
              { id: 'ST003', nameK: '노력이', nameE: 'Try', school: 'Test B', grade: 'G3', classInfo: levels[0] || 'Starter' },
              { id: 'ST004', nameK: '천재', nameE: 'Genius', school: 'Test C', grade: 'G6', classInfo: levels[1] || 'Basic' },
              { id: 'ST005', nameK: '시작이', nameE: 'Begin', school: 'Test A', grade: 'G1', classInfo: 'Phonics' }
          ];
          specialStudents.forEach(s => {
              const ref = doc(db, 'students', s.id);
              batch.set(ref, s);
          });
          await batch.commit();
          setStudents([...students, ...specialStudents.filter(s => !students.find(e => e.id === s.id))]);
          alert('생성 완료');
      }
  };


  return (
    <>
      <style>{`
        html, body, #root {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
          color-scheme: light;
        }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {  
           transform: scale(1.5);
           margin-left: 5px;
           cursor: pointer;
           opacity: 1;
           padding: 4px;
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
                { id: 'subjects', label: '3. 레벨관리', icon: Settings },
                { id: 'input', label: '4. 점수입력', icon: Save }, 
                { id: 'report', label: '5. 성적표', icon: FileText }, 
                { id: 'dashboard', label: '6. 통계', icon: BarChart2 },
                { id: 'version', label: '7. 수정사항', icon: GitCommit },
                { id: 'request', label: '8. 기능 문의하기', icon: MessageCircle }
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
                {activeTab === 'students' && (
                   <StudentManagement 
                     students={students}
                     grades={grades}
                     levels={levels}
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
                     newLevelInput={newLevelInput}
                     setNewLevelInput={setNewLevelInput}
                     handleAddLevel={handleAddLevel}
                     handleDeleteLevel={handleDeleteLevel}
                     handleAddStudent={handleAddStudent}
                     handleDeleteStudent={handleDeleteStudent}
                     handleNameClick={handleNameClick}
                     handleSeedSpecialData={handleSeedSpecialData}
                   />
                )}

                {activeTab === 'detail' && (
                  <StudentDetail 
                    students={students}
                    selectedStudentId={selectedStudentId}
                    setSelectedStudentId={setSelectedStudentId}
                    selectedStudentInfo={selectedStudentInfo}
                    handleGoToReport={handleGoToReport}
                    grades={grades}
                    levels={levels}
                    handleUpdateStudentInfo={handleUpdateStudentInfo}
                    studentDetailScores={studentDetailScores}
                    handleDetailScoreChange={handleDetailScoreChange}
                    handleDeleteDetailScore={handleDeleteDetailScore}
                    analysisCharts={analysisCharts}
                    toggleReportGraph={toggleReportGraph}
                    selectedReportGraphs={selectedReportGraphs}
                    levelConfig={levelConfig} 
                    schools={schools} 
                  />
                )}

                {activeTab === 'subjects' && (
                  <LevelManagement
                    levels={levels}
                    levelConfig={levelConfig}
                    handleUpdateLevelSubject={handleUpdateLevelSubject}
                    newLevelInput={newLevelInput}
                    setNewLevelInput={setNewLevelInput}
                    handleAddLevel={handleAddLevel}
                    handleDeleteLevel={handleDeleteLevel}
                  />
                )}

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
                    levels={levels} 
                    levelConfig={levelConfig} 
                  />
                )}

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
                    levelConfig={levelConfig}
                    reportDate={reportDate} 
                    setReportDate={setReportDate}
                    YEARS={YEARS}
                    MONTHS={MONTHS}
                    availableDates={availableDates}
                  />
                )}

                {activeTab === 'dashboard' && (
                  <Statistics 
                    statCriteria={statCriteria}
                    setStatCriteria={setStatCriteria}
                    inputYear={inputYear}
                    inputMonth={inputMonth}
                    statisticsData={statisticsData}
                  />
                )}

                {activeTab === 'version' && (
                  <VersionHistory />
                )}

                {activeTab === 'request' && (
                  <FeatureRequest db={db} />
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