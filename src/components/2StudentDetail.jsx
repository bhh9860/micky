
import React, { useMemo, useState, useEffect } from 'react';
import { ExternalLink, Save, Trash2, Activity, TrendingUp, Layers, BarChart as BarChartIcon, LineChart as LineChartIcon, Sparkles, CheckSquare, Square, Filter } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

const StudentDetail = ({
  students,
  selectedStudentId,
  setSelectedStudentId,
  selectedStudentInfo,
  handleGoToReport,
  grades,
  levels,
  handleUpdateStudentInfo,
  studentDetailScores,
  handleDetailScoreChange,
  handleDeleteDetailScore,
  analysisCharts,
  toggleReportGraph,
  selectedReportGraphs,
  levelConfig,
  schools 
}) => {
  
  const [dashboardLevelFilter, setDashboardLevelFilter] = useState('ALL');

  const availableHistoryLevels = useMemo(() => {
    if (!studentDetailScores) return [];
    const levelSet = new Set();
    studentDetailScores.forEach(s => {
        if (s.classInfo && !s.isDummy) {
            levelSet.add(s.classInfo);
        }
    });
    if (selectedStudentInfo.classInfo) {
        levelSet.add(selectedStudentInfo.classInfo);
    }
    return Array.from(levelSet).sort();
  }, [studentDetailScores, selectedStudentInfo]);

  useEffect(() => {
      if (selectedStudentInfo.classInfo) {
          setDashboardLevelFilter(selectedStudentInfo.classInfo);
      } else {
          setDashboardLevelFilter('ALL');
      }
  }, [selectedStudentId, selectedStudentInfo.classInfo]);

  const axisMaxPoints = useMemo(() => {
    const targetLevel = dashboardLevelFilter !== 'ALL' ? dashboardLevelFilter : selectedStudentInfo.classInfo;
    const config = levelConfig[targetLevel] || { ls: [], rw: [] };
    
    const lsMax = (config.ls || []).reduce((acc, cur) => acc + (cur.max || 0), 0);
    const rwMax = (config.rw || []).reduce((acc, cur) => acc + (cur.max || 0), 0);

    return {
        ls: lsMax > 0 ? lsMax : 30,
        rw: rwMax > 0 ? rwMax : 30
    };
  }, [levelConfig, dashboardLevelFilter, selectedStudentInfo.classInfo]);


  const filteredCharts = useMemo(() => {
      if (!analysisCharts) return null;
      if (dashboardLevelFilter === 'ALL') return analysisCharts;

      const filterData = (data) => {
          if (!data) return [];
          return data.filter(item => {
              const score = studentDetailScores.find(s => s.date === item.date);
              const itemLevel = score?.classInfo || selectedStudentInfo.classInfo; 
              return itemLevel === dashboardLevelFilter;
          });
      };

      return {
          ...analysisCharts,
          trendData: filterData(analysisCharts.trendData),
          areaData: filterData(analysisCharts.areaData),
          lsStackData: filterData(analysisCharts.lsStackData),
          rwStackData: filterData(analysisCharts.rwStackData),
          subjectScoreAnalysisData: analysisCharts.subjectScoreAnalysisData.filter(() => true), 
          compareData: filterData(analysisCharts.compareData),
          attitudeData: filterData(analysisCharts.attitudeData),
          deviationData: filterData(analysisCharts.deviationData),
          quarterlyData: analysisCharts.quarterlyData 
      };
  }, [analysisCharts, dashboardLevelFilter, studentDetailScores, selectedStudentInfo]);

  const dynamicSubjectCharts = useMemo(() => {
    if (!studentDetailScores) return [];

    const targetLevel = dashboardLevelFilter !== 'ALL' ? dashboardLevelFilter : selectedStudentInfo.classInfo;
    const config = levelConfig[targetLevel] || { ls: [], rw: [] };
    
    const validScores = studentDetailScores.filter(s => {
        if (s.isDummy) return false;
        if (dashboardLevelFilter !== 'ALL' && s.classInfo !== dashboardLevelFilter) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const lsCount = (config.ls || []).length;
    
    const createChartObj = (subject, idx, type) => {
        const key = `${type}${idx + 1}`;
        const data = validScores.map(s => ({
            date: s.date,
            Score: s[key] || 0
        }));

        const chartId = type === 'ls' ? 100 + idx : 200 + idx;
        const color = type === 'ls' ? '#ff7300' : '#387908';
        
        const displayNum = 11 + (type === 'rw' ? lsCount : 0) + idx;

        return {
            id: chartId,
            title: `${displayNum}. ${subject.name} 성장세`,
            titleText: `${subject.name} 성장세`,
            icon: null,
            content: (
                <div className="h-48">
                    <ResponsiveContainer>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="date" tick={{fontSize:10}}/>
                            <YAxis domain={[0, subject.max]}/>
                            <RechartsTooltip formatter={(value) => Number(value).toFixed(1)}/>
                            <Line type="monotone" dataKey="Score" stroke={color} strokeWidth={2}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )
        };
    };

    const lsCharts = (config.ls || []).map((subj, i) => createChartObj(subj, i, 'ls'));
    const rwCharts = (config.rw || []).map((subj, i) => createChartObj(subj, i, 'rw'));

    return [...lsCharts, ...rwCharts];

  }, [studentDetailScores, dashboardLevelFilter, selectedStudentInfo, levelConfig]);


  const currentSubjects = useMemo(() => {
      if (selectedStudentInfo.classInfo && levelConfig && levelConfig[selectedStudentInfo.classInfo]) {
          return levelConfig[selectedStudentInfo.classInfo];
      }
    return {
      ls: Array(4).fill({ name: 'LS', max: 5 }),
      rw: Array(4).fill({ name: 'RW', max: 5 })
    };
  }, [selectedStudentInfo.classInfo, levelConfig]);

  const getRowSubjects = (classInfo) => {
    if (classInfo && levelConfig && levelConfig[classInfo]) {
        return levelConfig[classInfo];
    }
    return {
        ls: Array(4).fill({ name: 'LS', max: 5 }),
        rw: Array(4).fill({ name: 'RW', max: 5 })
    };
  };

  const maxSubjectCounts = useMemo(() => {
      let maxLs = 0;
      let maxRw = 0;

      if (currentSubjects) {
          maxLs = Math.max(maxLs, currentSubjects.ls.length);
          maxRw = Math.max(maxRw, currentSubjects.rw.length);
      }

      if (studentDetailScores) {
          studentDetailScores.forEach(s => {
             const sLevel = s.classInfo;
             if (sLevel && levelConfig && levelConfig[sLevel]) {
                 maxLs = Math.max(maxLs, levelConfig[sLevel].ls?.length || 0);
                 maxRw = Math.max(maxRw, levelConfig[sLevel].rw?.length || 0);
             }
          });
      }
      
      return { ls: Math.max(maxLs, 4), rw: Math.max(maxRw, 4) };
  }, [studentDetailScores, currentSubjects, levelConfig, selectedStudentInfo]);

  const getShortName = (name) => name ? name.split('(')[0].trim() : '';

  const getLevelProgressColor = (val) => {
    if (!val) return 'text-gray-400';
    if (val === 'EX' || val === 'Excellent') return 'text-indigo-600';
    if (val === 'GD' || val === 'Good') return 'text-green-600';
    if (val === 'NI') return 'text-red-500';
    return 'text-gray-600';
  };

  const allDashboardCharts = useMemo(() => {
      if (!filteredCharts) return [];
      
      const fixedCharts = [
          { id: 1, title: '1. 종합 점수 추이 (백분율 %)', icon: TrendingUp, content: (
              <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><RechartsTooltip formatter={(value) => value}/><Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} name="Score (%)"/></LineChart></ResponsiveContainer></div>
          )},
          { id: 2, title: '2. L&S vs R&W 비중 변화', icon: Layers, content: (
              <div className="h-48"><ResponsiveContainer><AreaChart data={filteredCharts.areaData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, axisMaxPoints.ls + axisMaxPoints.rw]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Area type="monotone" dataKey="LS" stackId="1" stroke="#8884d8" fill="#8884d8"/><Area type="monotone" dataKey="RW" stackId="1" stroke="#82ca9d" fill="#82ca9d"/></AreaChart></ResponsiveContainer></div>
          )},
          { id: 3, title: '3. L&S 세부 영역 누적', icon: BarChartIcon, content: (
              <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.lsStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, axisMaxPoints.ls]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Recog" stackId="a" fill="#8884d8"/><Bar dataKey="Resp" stackId="a" fill="#82ca9d"/><Bar dataKey="Retell" stackId="a" fill="#ffc658"/><Bar dataKey="Speak" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
          )},
          { id: 4, title: '4. R&W 세부 영역 누적', icon: BarChartIcon, content: (
              <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.rwStackData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, axisMaxPoints.rw]}/><RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/><Bar dataKey="Gram" stackId="a" fill="#8884d8"/><Bar dataKey="Writ" stackId="a" fill="#82ca9d"/><Bar dataKey="Prac" stackId="a" fill="#ffc658"/><Bar dataKey="Read" stackId="a" fill="#ff8042"/></BarChart></ResponsiveContainer></div>
          )},
          { id: 5, title: '5. 회차별 종합 성적 비교 (%)', icon: LineChartIcon, content: (
              <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.subjectScoreAnalysisData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={['auto', 'auto']}/><RechartsTooltip formatter={(value) => value}/><Legend verticalAlign="top" height={36}/><Line type="monotone" dataKey="MyScore" stroke="#D97706" strokeWidth={2} name="내점수"/><Line type="monotone" dataKey="LevelAvg" stroke="#F59E0B" strokeWidth={2} name="레벨평균"/><Line type="monotone" dataKey="TotalAvg" stroke="#10B981" strokeWidth={2} name="전체응시생"/></LineChart></ResponsiveContainer></div>
          )},
          { id: 7, title: '7. 레벨 평균 대비 위치 (%)', icon: TrendingUp, content: (
              <div className="h-48"><ResponsiveContainer><ComposedChart data={filteredCharts.compareData}><CartesianGrid stroke="#f5f5f5"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0, 100]}/><RechartsTooltip formatter={(value) => value}/><Bar dataKey="LevelAvg" barSize={20} fill="#ff7300"/><Line type="monotone" dataKey="MyScore" stroke="#413ea0" strokeWidth={3}/></ComposedChart></ResponsiveContainer></div>
          )},
          { id: 8, title: '8. 월별 태도 변화', icon: Sparkles, content: (
              <div className="h-48"><ResponsiveContainer><LineChart data={filteredCharts.attitudeData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,12]} ticks={[3, 7, 10]} tickFormatter={(val) => val === 10 ? 'Ex' : val === 7 ? 'Gd' : 'NI'} width={40} tick={{fontSize: 10}}/><RechartsTooltip formatter={(val) => val === 10 ? 'Excellent' : val === 7 ? 'Good' : val === 3 ? 'NI' : val}/><Line type="step" dataKey="Attendance" stroke="#82ca9d"/><Line type="step" dataKey="Homework" stroke="#8884d8"/></LineChart></ResponsiveContainer></div>
          )},
          { id: 9, title: '9. 평균 대비 편차 (Avg: 75%)', icon: null, content: (
              <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.deviationData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><RechartsTooltip formatter={(value) => `${value}%p`}/><Bar dataKey="Deviation" fill="#8884d8" /></BarChart></ResponsiveContainer></div>
          )},
          { id: 10, title: '10. 분기별 평균 점수 (%)', icon: null, content: (
              <div className="h-48"><ResponsiveContainer><BarChart data={filteredCharts.quarterlyData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><RechartsTooltip formatter={(value) => `${value}%`}/><Bar dataKey="Avg" fill="#82ca9d" /></BarChart></ResponsiveContainer></div>
          )}
      ];
      
      return [...fixedCharts, ...dynamicSubjectCharts];

  }, [filteredCharts, dynamicSubjectCharts, axisMaxPoints]);


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
              <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">한글 이름</label>
                      <input type="text" className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.nameK || ''} onChange={(e) => handleUpdateStudentInfo('nameK', e.target.value)} />
                  </div>
                  <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">English Name</label>
                      <input type="text" className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.nameE || ''} onChange={(e) => handleUpdateStudentInfo('nameE', e.target.value)} />
                  </div>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500">학교</label>
                  <select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.school || ''} onChange={(e) => handleUpdateStudentInfo('school', e.target.value)}>
                      {schools && schools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500">학년</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.grade || ''} onChange={(e) => handleUpdateStudentInfo('grade', e.target.value)}>{grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500">Level</label><select className="w-full border p-1 rounded bg-white" value={selectedStudentInfo.classInfo || ''} onChange={(e) => handleUpdateStudentInfo('classInfo', e.target.value)}>{levels.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
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
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 z-20 w-24">Level</th>
                        <th colSpan={maxSubjectCounts.ls} className="p-1 border bg-blue-100 text-blue-900 border-b-2 border-blue-300">Monthly Eval (L&S)</th>
                        <th colSpan={maxSubjectCounts.rw} className="p-1 border bg-green-100 text-green-900 border-b-2 border-green-300">Monthly Eval (R&W)</th>
                        <th colSpan="1" className="p-1 border bg-purple-100 text-purple-900 border-b-2 border-purple-300">Level Progress</th>
                        <th colSpan="2" className="p-1 border bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300">Attitude</th>
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 w-16">Total</th>
                        <th rowSpan="2" className="p-2 border-b border-r bg-gray-100 w-16">Score(%)</th>
                        <th rowSpan="2" className="p-2 border-b bg-gray-100 w-12">삭제</th>
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
                      {studentDetailScores.map(score => {
                        const rowSubjects = getRowSubjects(score.classInfo || selectedStudentInfo.classInfo);
                        const isDifferentLevel = score.classInfo && score.classInfo !== selectedStudentInfo.classInfo;
                        const rawMaxPoints = (rowSubjects.ls.reduce((acc, cur) => acc + (cur.max || 0), 0) + rowSubjects.rw.reduce((acc, cur) => acc + (cur.max || 0), 0));
                        const maxPoints = rawMaxPoints || 1;
                        const percentage = Math.round((score.total / maxPoints) * 100);

                        return (
                        <tr key={score.id} className={`border-b h-10 ${score.isDummy ? 'bg-gray-50 opacity-60' : 'hover:bg-indigo-50'} last:border-none`}>
                          <td className="p-2 border-r bg-gray-50">{score.date}</td>
                          <td className={`p-0 border-r h-10 ${isDifferentLevel ? 'bg-yellow-50' : ''}`}>
                             <select 
                                className={`w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0 font-medium ${isDifferentLevel ? 'text-yellow-700' : 'text-gray-600'}`}
                                value={score.classInfo || ''}
                                onChange={(e) => handleDetailScoreChange(score.id, 'classInfo', e.target.value)}
                             >
                                <option value="">(미지정)</option>
                                {levels.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </td>
                          {/* L&S Dynamic Cells */}
                          {Array.from({ length: maxSubjectCounts.ls }).map((_, idx) => {
                             const subj = rowSubjects.ls[idx];
                             if (subj) {
                                 return (
                                    <td key={`ls${idx+1}`} className="p-0 border-r h-10" title={subj.name || ''}>
                                        {subj.max > 0 ? (
                                            <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={score[`ls${idx+1}`]} onChange={(e) => handleDetailScoreChange(score.id, `ls${idx+1}`, Number(e.target.value))}/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">-</div>
                                        )}
                                    </td>
                                 );
                             } else {
                                 return <td key={`ls${idx+1}-empty`} className="p-0 border-r h-10 bg-gray-100"></td>;
                             }
                          })}
                          
                          {/* R&W Dynamic Cells */}
                          {Array.from({ length: maxSubjectCounts.rw }).map((_, idx) => {
                             const subj = rowSubjects.rw[idx];
                             if (subj) {
                                 return (
                                    <td key={`rw${idx+1}`} className="p-0 border-r h-10" title={subj.name || ''}>
                                        {subj.max > 0 ? (
                                            <input type="number" className="w-full h-full text-center text-lg bg-transparent outline-none p-0 m-0" value={score[`rw${idx+1}`]} onChange={(e) => handleDetailScoreChange(score.id, `rw${idx+1}`, Number(e.target.value))}/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">-</div>
                                        )}
                                    </td>
                                 );
                             } else {
                                 return <td key={`rw${idx+1}-empty`} className="p-0 border-r h-10 bg-gray-100"></td>;
                             }
                          })}
                          
                          {/* Level Progress (Auto or Manual) */}
                          <td className="p-0 border-r h-10">
                             {rawMaxPoints > 0 ? (
                                 <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${getLevelProgressColor(score.classProgress)}`}>
                                    {score.classProgress}
                                 </div>
                             ) : (
                                 <select 
                                    className={`w-full h-full text-center bg-transparent outline-none font-bold text-sm cursor-pointer ${getLevelProgressColor(score.classProgress)}`}
                                    value={score.classProgress || ''}
                                    onChange={(e) => handleDetailScoreChange(score.id, 'classProgress', e.target.value)}
                                 >
                                    <option value="" className="text-gray-400">-</option>
                                    <option value="EX" className="text-indigo-600 font-bold">EX</option>
                                    <option value="GD" className="text-green-600 font-bold">GD</option>
                                    <option value="NI" className="text-red-500 font-bold">NI</option>
                                 </select>
                             )}
                          </td>

                          {/* Attitude */}
                          {['att_attendance', 'att_homework'].map(field => (
                            <td key={field} className="p-0 border-r h-10 w-16"><select className="w-full h-full text-center bg-transparent outline-none text-xs p-0 m-0" value={score[field]} onChange={e => handleDetailScoreChange(score.id, field, e.target.value)}><option value="Excellent">Ex</option><option value="Good">Gd</option><option value="NI">NI</option></select></td>
                          ))}
                          <td className="p-2 border-r font-bold">{score.total}</td>
                          <td className="p-2 border-r font-bold text-indigo-600">{percentage}</td>
                          <td className="p-0 h-10"><button onClick={() => handleDeleteDetailScore(score.id)} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-red-500 bg-transparent"><Trash2 size={14}/></button></td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 15+ Analysis Graphs Dashboard */}
            {allDashboardCharts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 border-b pb-2 border-indigo-100">
                  <div className="flex items-center gap-4">
                      <h3 className="font-bold text-xl text-indigo-800 flex items-center gap-2"><Activity size={24}/> 종합 분석 대시보드 (Analysis Dashboard)</h3>
                      <div className="flex items-center gap-2 bg-white border px-2 py-1 rounded-lg shadow-sm">
                          <Filter size={14} className="text-gray-500"/>
                          <span className="text-xs font-bold text-gray-600">기간(레벨) 필터:</span>
                          <select 
                            className="text-sm font-bold text-indigo-600 outline-none bg-transparent cursor-pointer"
                            value={dashboardLevelFilter}
                            onChange={(e) => setDashboardLevelFilter(e.target.value)}
                          >
                              <option value="ALL">전체 기간 (All History)</option>
                              {availableHistoryLevels.map(c => (
                                  <option key={c} value={c}>{c} 과정 ({c} Only)</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">성적표에 추가하려면 각 그래프 상단의 체크박스를 선택하세요.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {allDashboardCharts.map((chart) => (
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