import React from 'react';
import { UserPlus, Trash2, Settings, X } from 'lucide-react';

const StudentManagement = ({
  students = [],
  grades = [],
  classes = [],
  schools = [],
  showConfig = false,
  setShowConfig = () => {},
  newStudent = { nameK: '', nameE: '', school: '', grade: '', classInfo: '' },
  setNewStudent = () => {},
  newSchoolInput = '',
  setNewSchoolInput = () => {},
  handleAddSchool = () => {},
  handleDeleteSchool = () => {},
  newGradeInput = '',
  setNewGradeInput = () => {},
  handleAddGrade = () => {},
  handleDeleteGrade = () => {},
  newClassInput = '',
  setNewClassInput = () => {},
  handleAddClass = () => {},
  handleDeleteClass = () => {},
  handleAddStudent = () => {},
  handleDeleteStudent = () => {},
  handleNameClick = () => {},
  handleSeedSpecialData = () => {}
}) => {
  // 안전한 배열 및 객체 보장 (Props Validation Check)
  const safeSchools = Array.isArray(schools) ? schools : [];
  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeStudents = Array.isArray(students) ? students : [];
  const safeNewStudent = newStudent || { nameK: '', nameE: '', school: '', grade: '', classInfo: '' };

  return (
    <div className="flex flex-col gap-6">
      {/* 설정(Configuration) 섹션 */}
      {showConfig && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6 animate-fade-in-down">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Settings size={20}/> 환경 설정 (학교, 학년, 클래스 관리)</h3>
            <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-red-500 bg-transparent"><X size={20}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 학교 관리 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold text-gray-600">학교(School) 목록</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {safeSchools.map(s => (
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
                {safeGrades.map(g => (
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
                {safeClasses.map(c => (
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
        <div className="absolute top-6 right-6 flex gap-2">
            <button 
              onClick={handleSeedSpecialData} 
              className="text-indigo-400 hover:text-indigo-600 transition-colors bg-transparent font-bold text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-100"
              title="테스트용 특수 학생 5명 생성 (꾸준이, 성장이...)"
            >
              + Test Data
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)} 
              className="text-gray-400 hover:text-indigo-600 transition-colors bg-transparent"
              title="환경 설정 (학년/클래스/학교 관리)"
            >
              <Settings size={20}/>
            </button>
        </div>
        <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center gap-2"><UserPlus size={20}/> 신규 학생 등록</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">한글 이름</label><input type="text" placeholder="예: 홍길동" className="border p-2 rounded w-32 bg-white text-gray-900" value={safeNewStudent.nameK || ''} onChange={(e) => setNewStudent({...safeNewStudent, nameK: e.target.value})} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">영어 이름</label><input type="text" placeholder="예: Gildong" className="border p-2 rounded w-32 bg-white text-gray-900" value={safeNewStudent.nameE || ''} onChange={(e) => setNewStudent({...safeNewStudent, nameE: e.target.value})} /></div>
          
          <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학교</label><select className="border p-2 rounded w-32 bg-white text-gray-900" value={safeNewStudent.school || ''} onChange={(e) => setNewStudent({...safeNewStudent, school: e.target.value})}>{safeSchools.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">학년</label><select className="border p-2 rounded w-24 bg-white text-gray-900" value={safeNewStudent.grade || ''} onChange={(e) => setNewStudent({...safeNewStudent, grade: e.target.value})}>{safeGrades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-bold text-gray-600">Class</label><select className="border p-2 rounded w-32 bg-white text-gray-900" value={safeNewStudent.classInfo || ''} onChange={(e) => setNewStudent({...safeNewStudent, classInfo: e.target.value})}>{safeClasses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <button onClick={handleAddStudent} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold">+ 등록</button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">학생 목록</h2>
        <table className="w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="p-2 border w-16">No.</th><th className="p-2 border">이름 (클릭하여 관리)</th><th className="p-2 border">학교</th><th className="p-2 border">학년</th><th className="p-2 border">Class</th><th className="p-2 border w-20">관리</th></tr></thead>
          <tbody>{safeStudents.map((s, idx) => (
            <tr key={s?.id || idx} className="border-b hover:bg-gray-50">
              <td className="p-2 border text-center">{idx + 1}</td>
              <td className="p-2 border font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => s?.id && handleNameClick(s.id)}>{s?.nameE} ({s?.nameK})</td>
              <td className="p-2 border">{s?.school}</td>
              <td className="p-2 border">{s?.grade}</td>
              <td className="p-2 border text-indigo-600">{s?.classInfo}</td>
              <td className="p-2 border text-center"><button onClick={() => s?.id && handleDeleteStudent(s.id)} className="bg-white p-1 rounded border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16}/></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManagement;