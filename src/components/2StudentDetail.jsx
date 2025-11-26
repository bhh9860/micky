import React, { useMemo, useState } from 'react';
import { ExternalLink, Save, Trash2, Activity, TrendingUp, Layers, BarChart as BarChartIcon, LineChart as LineChartIcon, Sparkles, CheckSquare, Square, Filter } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

const StudentDetail = ({
  students,
  selectedStudentId,
  setSelectedStudentId,
  selectedStudentInfo,
  handleGoToReport,
  grades,
  classes,
  handleUpdateStudentInfo,
  studentDetailScores,
  handleDetailScoreChange,
  handleDeleteDetailScore,
  analysisCharts,
  toggleReportGraph,
  selectedReportGraphs,
  classSubjects,
  schools 
}) => {
  
  const [dashboardClassFilter, setDashboardClassFilter] = useState('ALL');

  const availableHistoryClasses = useMemo(() => {
    if (!studentDetailScores) return [];
    const classSet = new Set();
    studentDetailScores.forEach(s => {
        if (s.classInfo && !s.isDummy) {
            classSet.add(s.classInfo);
        }
    });
    if (selectedStudentInfo.classInfo) {
        classSet.add(selectedStudentInfo.classInfo);
    }
    return Array.from(classSet).sort();
  }, [studentDetailScores, selectedStudentInfo]);

  useMemo(() => {
      if (selectedStudentInfo.classInfo) {
          setDashboardClassFilter(selectedStudentInfo.classInfo);
      } else {
          setDashboardClassFilter('ALL');
      }
  }, [selectedStudentId]);

  const filteredCharts = useMemo(() => {
      if (!analysisCharts) return null;
      if (dashboardClassFilter === 'ALL') return analysisCharts;

      const filterData = (data) => {
          if (!data) return [];
          return data.filter(item => {
              const score = studentDetailScores.find(s => s.date === item.date);
              const itemClass = score?.classInfo || selectedStudentInfo.classInfo; 
              return itemClass === dashboardClassFilter;
          });
      };

      return {
          ...analysisCharts,
          trendData: filterData(analysisCharts.trendData),
          areaData: filterData(analysisCharts.areaData),
          lsStackData: filterData(analysisCharts.lsStackData),
          rwStackData: filterData(analysisCharts.rwStackData),
          subjectScoreAnalysisData: analysisCharts.subjectScoreAnalysisData.filter(item => {
             return true; 
          }), 
          compareData: filterData(analysisCharts.compareData),
          attitudeData: filterData(analysisCharts.attitudeData),
          speakingData: filterData(analysisCharts.speakingData),
          writingData: filterData(analysisCharts.writingData),
          grammarData: filterData(analysisCharts.grammarData),
          readingData: filterData(analysisCharts.readingData),
          deviationData: filterData(analysisCharts.deviationData),
          quarterlyData: analysisCharts.quarterlyData 
      };
  }, [analysisCharts, dashboardClassFilter, studentDetailScores, selectedStudentInfo]);

  const currentSubjects = useMemo(() => {
      if (selectedStudentInfo.classInfo && classSubjects && classSubjects[selectedStudentInfo.classInfo]) {
          return classSubjects[selectedStudentInfo.classInfo];
      }
    return {
      ls: Array(4).fill({ name: 'LS', max: 5 }),
      rw: Array(4).fill({ name: 'RW', max: 5 })
    };
  }, [selectedStudentInfo.classInfo, classSubjects]);

  const getRowSubjects = (classInfo) => {
    if (classInfo && classSubjects && classSubjects[classInfo]) {
        return classSubjects[classInfo];
    }
    return {
        ls: Array(4).fill({ name: 'LS', max: 5 }),
        rw: Array(4).fill({ name: 'RW', max: 5 })
    };
  };

  const getShortName = (name) => name ? name.split('(')[0].trim() : '';

  return (
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
              <div><label className="text-xs font-bold text-gray-500">이름</label><input type="text" className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.displayName || ''} readOnly /></div>
              <div>
                  <label className="text-xs font-bold text-gray-500">학교</label>
                  <select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.school || ''} onChange={(e) => handleUpdateStudentInfo('school', e.target.value)}>
                      {schools && schools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500">학년</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.grade || ''} onChange={(e) => handleUpdateStudentInfo('grade', e.target.value)}>{grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Class</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.classInfo || ''} onChange={(e) => handleUpdateStudentInfo('classInfo', e.target.value)}>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>

            {/* 전체 기간 성적 관리 (Scrollable) */}
            <div className="mb-8">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2"><Save size={20}/> 전체 기간 성적 관리 (2020-01 ~)</h3>
              <div className="border rounded-lg bg-white relative shadow-sm">
                <div className="max-h-80 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-xs text-center whitespace-nowrap bg-white">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 z-20 w-24">Date</th>
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 z-20 w-24">Class</th>
                        <th colSpan="4" className="p-1 border bg-blue-100 text-blue-900 border-b-2 border-blue-300">Monthly Eval (L&S)</th>
                        <th colSpan="4" className="p-1 border bg-green-100 text-green-900 border-b-2 border-green-300">Monthly Eval (R&W)</th>
                        <th colSpan="4" className="p-1 border bg-purple-100 text-purple-900 border-b-2 border-purple-300">Class Progress</th>
                        <th colSpan="2" className="p-1 border bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300">Attitude</th>
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 w-16">Total</th>
                        <th rowSpan="2" className="p-2 border-b bg-gray-100 w-12">삭제</th>
                      </tr>
                      <tr>
                        {currentSubjects.ls.map((subj, idx) => (
                            <th key={`ls-h-${idx}`} className="p-1 border bg-blue-50 w-10" title={`Max: ${subj.max}`}>
                                {getShortName(subj.name) || `LS${idx+1}`}
                            </th>
                        ))}
                        {currentSubjects.rw.map((subj, idx) => (
                            <th key={`rw-h-${idx}`} className="p-1 border bg-green-50 w-10" title={`Max: ${subj.max}`}>
                                {getShortName(subj.name) || `RW${idx+1}`}
                            </th>
                        ))}
                        <th className="p-1 border w-10 bg-purple-50">Read</th><th className="p-1 border w-10 bg-purple-50">List</th><th className="p-1 border w-10 bg-purple-50">Writ</th><th className="p-1 border w-10 bg-purple-50">Gram</th>
                        <th className="p-1 border w-10 bg-yellow-50">Att</th><th className="p-1 border w-10 bg-yellow-50">H.W</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentDetailScores.map(score => {
                        const rowSubjects = getRowSubjects(score.classInfo || selectedStudentInfo.classInfo);
                        const isDifferentClass = score.classInfo && score.classInfo !== selectedStudentInfo.classInfo;

                        return (
                        <tr key={score.id} className={`border-b h-10 ${score.isDummy ? 'bg-gray-50 opacity-60' : 'hover:bg-indigo-50'} last:border-none`}>
                          <td className="p-2 border-r bg-gray-50">{score.date}</td>
                          <td className={`p-0 border-r h-10 ${isDifferentClass ? 'bg-yellow-50' : ''}`}>
                             <select 
                                className={`w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0 font-medium ${isDifferentClass ? 'text-yellow-700' : 'text-gray-600'}`}
                                value={score.classInfo || ''}
                                onChange={(e) => handleDetailScoreChange(score.id, 'classInfo', e.target.value)}
                             >
                                <option value="">(미지정)</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </td>
                          {[1,2,3,4].map((i, idx) => (
                            <td key={`ls${i}`} className="p-0 border-r h-10" title={rowSubjects.ls[idx]?.name || ''}>
                                <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={score[`ls${i}`]} onChange={(e) => handleDetailScoreChange(score.id, `ls${i}`, Number(e.target.value))}/>
                            </td>
                          ))}
                          {[1,2,3,4].map((i, idx) => (
                            <td key={`rw${i}`} className="p-0 border-r h-10" title={rowSubjects.rw[idx]?.name || ''}>
                                <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={score[`rw${i}`]} onChange={(e) => handleDetailScoreChange(score.id, `rw${i}`, Number(e.target.value))}/>
                            </td>
                          ))}
                          {['cp_reading', 'cp_listening', 'cp_writing', 'cp_grammar', 'att_attendance', 'att_homework'].map(field => (
                            <td key={field} className="p-0 border-r h-10 w-16"><select className="w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0" value={score[field]} onChange={e => handleDetailScoreChange(score.id, field, e.target.value)}><option value="Excellent">Ex</option><option value="Good">Gd</option><option value="Bad">Bd</option></select></td>
                          ))}
                          <td className="p-2 border-r font-bold">{score.total}</td>
                          <td className="p-0 h-10"><button onClick={() => handleDeleteDetailScore(score.id)} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500 bg-transparent"><Trash2 size={14}/></button></td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 15+ Analysis Graphs Dashboard */}
            {filteredCharts && (
              <div>
                <div className="flex items-center justify-between mb-4 border-b pb-2 border-indigo-100">
                  <div className="flex items-center gap-4">
                      <h3 className="font-bold text-xl text-indigo-800 flex items-center gap-2"><Activity size={24}/> 종합 분석 대시보드 (Analysis Dashboard)</h3>
                      <div className="flex items-center gap-2 bg-white border px-2 py-1 rounded-lg shadow-sm">
                          <Filter size={14} className="text-gray-500"/>
                          <span className="text-xs font-bold text-gray-600">기간(클래스) 필터:</span>
                          <select 
                            className="text-sm font-bold text-indigo-600 outline-none bg-transparent cursor-pointer"
                            value={dashboardClassFilter}
                            onChange={(e) => setDashboardClassFilter(e.target.value)}
                          >
                              <option value="ALL">전체 기간 (All History)</option>
                              {availableHistoryClasses.map(c => (
                                  <option key={c} value={c}>{c} 과정 ({c} Only)</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">성적표에 추가하려면 각 그래프 상단의 체크박스를 선택하세요.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {[
                      { id: 1, title: '1. 종합 점수 추이 (백분율 %)', icon: TrendingUp, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><RechartsTooltip formatter={(value) => `${value}%`}/><Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} name="Score (%)"/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 2, title: '2. L&S vs R&W 비중 변화', icon: Layers, content: (
                          <div className="h-48"><ResponsiveContainer><AreaChart data={filteredCharts.areaData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Area type="monotone" dataKey="LS" stackId="1" stroke="#8884d8" fill="#8884d8"/><Area type="monotone" dataKey="RW" stackId="1" stroke="#82ca9d" fill="#82ca9d"/></AreaChart></ResponsiveContainer></div>
                      )},
                      { id: 3, title: '3. L&S 세부 영역 누적', icon: BarChartIcon, content: (
                          <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.lsStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 30]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Recog" stackId="a" fill="#8884d8"/><Bar dataKey="Resp" stackId="a" fill="#82ca9d"/><Bar dataKey="Retell" stackId="a" fill="#ffc658"/><Bar dataKey="Speak" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
                      )},
                      { id: 4, title: '4. R&W 세부 영역 누적', icon: BarChartIcon, content: (
                          <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.rwStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 30]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Gram" stackId="a" fill="#8884d8"/><Bar dataKey="Writ" stackId="a" fill="#82ca9d"/><Bar dataKey="Prac" stackId="a" fill="#ffc658"/><Bar dataKey="Read" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
                      )},
                      { id: 5, title: '5. 회차별 종합 성적 비교 (%)', icon: LineChartIcon, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.subjectScoreAnalysisData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 100]}/><RechartsTooltip formatter={(value) => `${value}%`}/><Legend verticalAlign="top" height={36}/><Line type="monotone" dataKey="MyScore" stroke="#D97706" strokeWidth={2} name="내점수"/><Line type="monotone" dataKey="ClassAvg" stroke="#F59E0B" strokeWidth={2} name="반평균"/><Line type="monotone" dataKey="TotalAvg" stroke="#10B981" strokeWidth={2} name="전체응시생"/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 7, title: '7. 전체 평균 대비 위치 (%)', icon: TrendingUp, content: (
                          <div className="h-48"><ResponsiveContainer><ComposedChart data={filteredCharts.compareData}><CartesianGrid stroke="#f5f5f5"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 100]}/><RechartsTooltip formatter={(value) => `${value}%`}/><Bar dataKey="MyScore" barSize={20} fill="#413ea0"/><Line type="monotone" dataKey="ClassAvg" stroke="#ff7300"/></ComposedChart></ResponsiveContainer></div>
                      )},
                      { id: 8, title: '8. 월별 태도 변화', icon: Sparkles, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.attitudeData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,12]} ticks={[3, 7, 10]} tickFormatter={(val) => val === 10 ? 'Ex' : val === 7 ? 'Gd' : 'Bd'} width={40} tick={{fontSize: 10}}/><RechartsTooltip formatter={(val) => val === 10 ? 'Excellent' : val === 7 ? 'Good' : val === 3 ? 'Bad' : val}/><Line type="step" dataKey="Attendance" stroke="#82ca9d"/><Line type="step" dataKey="Homework" stroke="#8884d8"/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 9, title: '9. Speaking 성장세', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.speakingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#ff7300" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 10, title: '10. Writing 성장세', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.writingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#387908" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 11, title: '11. Grammar 정확도', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><AreaChart data={filteredCharts.grammarData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,5]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Area type="monotone" dataKey="Score" stroke="#8884d8" fill="#8884d8" /></AreaChart></ResponsiveContainer></div>
                      )},
                      { id: 12, title: '12. Reading 독해력', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.readingData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,10]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Line type="monotone" dataKey="Score" stroke="#82ca9d" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
                      )},
                      { id: 13, title: '13. 평균 대비 편차 (Avg: 75%)', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.deviationData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => `${value}%p`}/><Bar dataKey="Deviation" fill="#8884d8" /></BarChart></ResponsiveContainer></div>
                      )},
                      { id: 14, title: '14. 분기별 평균 점수 (%)', icon: null, content: (
                          <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.quarterlyData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><RechartsTooltip formatter={(value) => `${value}%`}/><Bar dataKey="Avg" fill="#82ca9d" /></BarChart></ResponsiveContainer></div>
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
  );
};

export default StudentDetail;