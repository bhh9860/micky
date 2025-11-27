import React, { useState, useMemo } from 'react';
import { RefreshCcw, ChevronLeft, ChevronRight, ArrowUpDown, Filter, CheckSquare, Square } from 'lucide-react';

const ScoreInput = ({
  inputYear,
  setInputYear,
  inputMonth,
  setInputMonth,
  handleMonthChange,
  YEARS,
  MONTHS,
  handleResetSort,
  handleSort,
  handleNameClick,
  inputTableData,
  handleInputScoreChange,
  handleResetScore,
  classes,
  classSubjects
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState(classes[0]);
  const [isFilterActive, setIsFilterActive] = useState(false); 

  // 필터링 로직 
  const filteredData = useMemo(() => {
    if (!isFilterActive) {
        return inputTableData; 
    }
    return inputTableData.filter(row => row.classInfo === selectedClassFilter);
  }, [inputTableData, selectedClassFilter, isFilterActive]);

  const currentSubjects = useMemo(() => {
    if (classSubjects && classSubjects[selectedClassFilter]) {
      return classSubjects[selectedClassFilter];
    }
    return {
      ls: [],
      rw: []
    };
  }, [classSubjects, selectedClassFilter]);

  const getShortName = (name) => name ? name.split('(')[0].trim() : '';

  // Helper to get subjects for a specific row
  const getRowSubjects = (classInfo) => {
    if (classInfo && classSubjects && classSubjects[classInfo]) {
        return classSubjects[classInfo];
    }
    return {
        ls: [],
        rw: []
    };
  };

  const maxSubjectCounts = useMemo(() => {
      let maxLs = 0;
      let maxRw = 0;

      // 1. Current Filter Class
      if (currentSubjects) {
          maxLs = Math.max(maxLs, currentSubjects.ls.length);
          maxRw = Math.max(maxRw, currentSubjects.rw.length);
      }

      // 2. Filtered Data Class Configs
      if (filteredData) {
          filteredData.forEach(row => {
             const sClass = row.classInfo;
             if (sClass && classSubjects && classSubjects[sClass]) {
                 maxLs = Math.max(maxLs, classSubjects[sClass].ls?.length || 0);
                 maxRw = Math.max(maxRw, classSubjects[sClass].rw?.length || 0);
             }
          });
      }
      
      return { ls: Math.max(maxLs, 0), rw: Math.max(maxRw, 0) };
  }, [filteredData, currentSubjects, classSubjects]);

    const getClassProgressColor = (val) => {
        if (!val) return 'text-gray-400';
        if (val === 'EX' || val === 'Excellent') return 'text-indigo-600';
        if (val === 'GD' || val === 'Good') return 'text-green-600';
        if (val === 'NI') return 'text-red-500';
        return 'text-gray-600';
    };

    return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">4. 월별 점수 입력</h2>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>입력 시 자동 저장됩니다.</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isFilterActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
               {isFilterActive ? `현재 입력 대상: ${selectedClassFilter}` : '전체 학생 표시'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Class Filter with Checkbox */}
           <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isFilterActive ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
             <button 
                onClick={() => setIsFilterActive(!isFilterActive)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-700 focus:outline-none"
             >
                {isFilterActive ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16} className="text-gray-400"/>}
                <span className={isFilterActive ? 'text-indigo-700' : 'text-gray-500'}>클래스 필터:</span>
             </button>
             
             <select 
               value={selectedClassFilter} 
               onChange={(e) => setSelectedClassFilter(e.target.value)}
               disabled={!isFilterActive} 
               className={`border text-sm rounded p-1 font-bold outline-none ${isFilterActive ? 'bg-white border-indigo-300 text-indigo-900' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
             >
               {classes.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </div>

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
              <th rowSpan="2" className="p-2 border bg-indigo-50 sticky left-0 z-40 w-24 cursor-pointer hover:bg-indigo-100 border-r-2 border-r-gray-300" onClick={() => handleSort('name')}>이름 <ArrowUpDown size={12} className="inline"/></th>
              <th rowSpan="2" className="p-2 border bg-indigo-50 w-20 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('classInfo')}>Class <ArrowUpDown size={12} className="inline"/></th>
              <th colSpan={maxSubjectCounts.ls} className="p-1 border bg-blue-100 text-blue-900 border-b-2 border-blue-300">Monthly Eval (L&S)</th>
              <th colSpan={maxSubjectCounts.rw} className="p-1 border bg-green-100 text-green-900 border-b-2 border-green-300">Monthly Eval (R&W)</th>
              <th colSpan="1" className="p-1 border bg-purple-100 text-purple-900 border-b-2 border-purple-300">Class Progress</th>
              <th colSpan="2" className="p-1 border bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300">Attitude</th>
              <th rowSpan="2" className="p-2 border bg-gray-200 w-12 sticky right-0 z-40 shadow-l cursor-pointer hover:bg-gray-300" onClick={() => handleSort('total')}>Total <ArrowUpDown size={12} className="inline"/></th>
              <th rowSpan="2" className="p-2 border bg-gray-200 w-12 sticky right-0 z-40 shadow-l">Score(%)</th>
            </tr>
            <tr>
              {Array.from({ length: maxSubjectCounts.ls }).map((_, idx) => {
                  const subj = currentSubjects.ls[idx];
                  return (
                      <th key={`ls-h-${idx}`} className="p-1 border bg-blue-50 w-10" title={subj ? `Questions: ${subj.max}` : ''}>
                          {subj ? (getShortName(subj.name) || `LS${idx+1}`) : '-'}
                      </th>
                  );
              })}
              {Array.from({ length: maxSubjectCounts.rw }).map((_, idx) => {
                  const subj = currentSubjects.rw[idx];
                  return (
                      <th key={`rw-h-${idx}`} className="p-1 border bg-green-50 w-10" title={subj ? `Questions: ${subj.max}` : ''}>
                          {subj ? (getShortName(subj.name) || `RW${idx+1}`) : '-'}
                      </th>
                  );
              })}
              <th className="p-1 border w-16 bg-purple-50">Grade</th>
              <th className="p-1 border w-10 bg-yellow-50">Att</th><th className="p-1 border w-10 bg-yellow-50">H.W</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => {
              const rowSubjects = getRowSubjects(row.classInfo);
              const rawMaxPoints = (rowSubjects.ls.reduce((acc, cur) => acc + (cur.max || 0), 0) + rowSubjects.rw.reduce((acc, cur) => acc + (cur.max || 0), 0));
              const maxPoints = rawMaxPoints || 1;
              const percentage = Math.round((row.total / maxPoints) * 100);

              return (
              <tr key={row.id} className={`border-b hover:bg-indigo-50 transition-colors h-10 group ${row.isNew ? 'bg-gray-50 opacity-80' : 'bg-white'}`}>
                <td className="p-2 border sticky left-0 bg-white z-20 font-bold text-indigo-600 text-left border-r-2 border-r-gray-200 cursor-pointer hover:underline truncate max-w-[100px]" onClick={() => handleNameClick(row.studentId)}>{row.name}</td>
                <td className="p-2 border text-gray-500 bg-gray-50 truncate max-w-[80px]">{row.classInfo}</td>
                
                {/* L&S Dynamic Cells */}
                {Array.from({ length: maxSubjectCounts.ls }).map((_, idx) => {
                    const subj = rowSubjects.ls[idx];
                    if (subj) {
                        return (
                        <td key={`ls${idx+1}`} className="p-0 border h-10" title={subj.name || ''}>
                            {subj.max > 0 ? (
                                <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={row[`ls${idx+1}`]} onChange={e => handleInputScoreChange(row.studentId, `ls${idx+1}`, Number(e.target.value))} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">-</div>
                            )}
                        </td>
                        );
                    } else {
                        return <td key={`ls${idx+1}-empty`} className="p-0 border h-10 bg-gray-100"></td>;
                    }
                })}

                {/* R&W Dynamic Cells */}
                {Array.from({ length: maxSubjectCounts.rw }).map((_, idx) => {
                    const subj = rowSubjects.rw[idx];
                    if (subj) {
                        return (
                        <td key={`rw${idx+1}`} className="p-0 border h-10" title={subj.name || ''}>
                            {subj.max > 0 ? (
                                <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={row[`rw${idx+1}`]} onChange={e => handleInputScoreChange(row.studentId, `rw${idx+1}`, Number(e.target.value))} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">-</div>
                            )}
                        </td>
                        );
                    } else {
                        return <td key={`rw${idx+1}-empty`} className="p-0 border h-10 bg-gray-100"></td>;
                    }
                })}

                {/* Class Progress (Auto Calculated or Manual) */}
                <td className="p-0 border h-10">
                    {rawMaxPoints > 0 ? (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${getClassProgressColor(row.classProgress)}`}>
                            {!row.isNew && row.classProgress}
                        </div>
                    ) : (
                        <select 
                            className={`w-full h-full text-center bg-transparent outline-none font-bold text-sm cursor-pointer ${getClassProgressColor(row.classProgress)}`}
                            value={row.classProgress || ''} 
                            onChange={e => handleInputScoreChange(row.studentId, 'classProgress', e.target.value)}
                        >
                            <option value="" className="text-gray-400">-</option>
                            <option value="EX" className="text-indigo-600 font-bold">EX</option>
                            <option value="GD" className="text-green-600 font-bold">GD</option>
                            <option value="NI" className="text-red-500 font-bold">NI</option>
                        </select>
                    )}
                </td>

                {/* Attitude Inputs */}
                {['att_attendance', 'att_homework'].map(field => (
                  <td key={field} className="p-0 border h-10"><select className="w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0" value={row[field]} onChange={e => handleInputScoreChange(row.studentId, field, e.target.value)}><option value="Excellent">Ex</option><option value="Good">Gd</option><option value="NI">NI</option></select></td>
                ))}
                
                <td className="p-0 border text-center sticky right-0 z-20 bg-white group-hover:bg-gray-50 h-10 relative">
                      <div className="flex items-center justify-center w-full h-full relative">
                        <span className={`font-bold text-lg ${row.total >= 50 ? 'text-indigo-700' : 'text-gray-700'}`}>{row.total}</span>
                        {!row.isNew && (
                            <button onClick={() => handleResetScore(row.studentId)} className="absolute right-1 text-gray-300 hover:text-red-500 transition-colors bg-transparent p-1" title="초기화 (0점/Good)"><RefreshCcw size={12}/></button>
                        )}
                      </div>
                  </td>
                  <td className="p-0 border text-center sticky right-0 z-20 bg-white group-hover:bg-gray-50 h-10">
                      <span className="font-bold text-indigo-600">{percentage}%</span>
                  </td>
              </tr>
              );
            })}
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan="20" className="p-8 text-center text-gray-400">
                        {isFilterActive ? `선택된 클래스(${selectedClassFilter})의 학생이 없습니다.` : '표시할 데이터가 없습니다.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreInput;