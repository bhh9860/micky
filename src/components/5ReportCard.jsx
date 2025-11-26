import React, { useMemo } from 'react';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';

const ReportCard = ({
  students,
  selectedStudentId,
  setSelectedStudentId,
  selectedStudentInfo,
  latestScore,
  isGeneratingAI,
  generateAIComment,
  handleEditScore,
  studentHistory,
  graphMode,
  setGraphMode,
  graphData,
  getLineColor,
  page2Charts,
  extraPages,
  analysisCharts,
  classSubjects 
}) => {

  const currentClassConfig = useMemo(() => {
    const sClass = latestScore?.classInfo || selectedStudentInfo.classInfo;
    const config = (classSubjects && sClass && classSubjects[sClass]) ? classSubjects[sClass] : { ls: [], rw: [] };
    
    const lsMax = (config.ls || []).reduce((a, b) => a + b.max, 0) || 30;
    const rwMax = (config.rw || []).reduce((a, b) => a + b.max, 0) || 30;
    
    return { config, lsMax, rwMax, totalMax: lsMax + rwMax };
  }, [latestScore, selectedStudentInfo, classSubjects]);

  const renderReportGraph = (graphId) => {
    const chartMargin = { top: 25, right: 10, left: 10, bottom: 0 };
    
    const sliceData = (data) => data ? data.slice(-8) : [];

    // [동적 그래프 처리] ID 100~199 (L&S), 200~299 (R&W)
    if (graphId >= 100) {
        let subjectIdx = 0;
        let subjectType = 'ls';
        let subjectName = '';
        let maxScore = 5;

        if (graphId >= 200) {
            subjectType = 'rw';
            subjectIdx = graphId - 200;
            const subj = currentClassConfig.config.rw[subjectIdx];
            if (subj) {
                subjectName = subj.name;
                maxScore = subj.max;
            }
        } else {
            subjectType = 'ls';
            subjectIdx = graphId - 100;
            const subj = currentClassConfig.config.ls[subjectIdx];
            if (subj) {
                subjectName = subj.name;
                maxScore = subj.max;
            }
        }

        const historyData = [...studentHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        const chartData = sliceData(historyData.map(s => ({
            date: s.date,
            Score: s[`${subjectType}${subjectIdx + 1}`] || 0
        })));
        
        const lineColor = subjectType === 'ls' ? '#ff7300' : '#387908';

        return (
            <ResponsiveContainer>
              <LineChart data={chartData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="date" tick={{fontSize:10}}/>
                <YAxis domain={[0, maxScore]}/>
                <RechartsTooltip formatter={(value) => Number(value).toFixed(1)}/>
                <Line type="monotone" dataKey="Score" stroke={lineColor} strokeWidth={2} label={(props) => <text x={props.x} y={props.y - 5} fill="#000" textAnchor="middle" fontSize={10} fontWeight="bold">{Math.round(props.value)}</text>}/>
              </LineChart>
            </ResponsiveContainer>
        );
    }

    if (!analysisCharts) return null;

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

    switch(graphId) {
      case 1: return ( 
        <ResponsiveContainer>
          <LineChart data={sliceData(analysisCharts.trendData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0,100]}/>
            <RechartsTooltip formatter={(value) => value}/>
            <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} label={renderCustomLabel}/>
            <Line type="monotone" dataKey="Average" stroke="#9ca3af" strokeDasharray="3 3"/>
          </LineChart>
        </ResponsiveContainer>
      );
      case 2: return ( 
        <ResponsiveContainer>
          <AreaChart data={sliceData(analysisCharts.areaData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0, currentClassConfig.totalMax]}/>
            <RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/>
            <Area type="monotone" dataKey="LS" stackId="1" stroke="#8884d8" fill="#8884d8" label={renderStackLabel}/>
            <Area type="monotone" dataKey="RW" stackId="1" stroke="#82ca9d" fill="#82ca9d" label={renderStackLabel}/>
          </AreaChart>
        </ResponsiveContainer>
      );
      case 3: return ( 
        <ResponsiveContainer>
          <BarChart data={sliceData(analysisCharts.lsStackData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0, currentClassConfig.lsMax]}/>
            <RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/>
            <Legend verticalAlign="top" align="right" height={36} iconSize={10}/>
            {/* [수정] 라벨 제거: 수치 중복 표시 방지 */}
            <Bar dataKey="Recog" stackId="a" fill="#8884d8" />
            <Bar dataKey="Resp" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Retell" stackId="a" fill="#ffc658" />
            <Bar dataKey="Speak" stackId="a" fill="#ff8042" />
          </BarChart>
        </ResponsiveContainer>
      );
      case 4: return ( 
        <ResponsiveContainer>
          <BarChart data={sliceData(analysisCharts.rwStackData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0, currentClassConfig.rwMax]}/>
            <RechartsTooltip formatter={(value) => Number(value).toFixed(2)}/>
            <Legend verticalAlign="top" align="right" height={36} iconSize={10}/>
            {/* [수정] 라벨 제거: 수치 중복 표시 방지 */}
            <Bar dataKey="Gram" stackId="a" fill="#8884d8" />
            <Bar dataKey="Writ" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Prac" stackId="a" fill="#ffc658" />
            <Bar dataKey="Read" stackId="a" fill="#ff8042" />
          </BarChart>
        </ResponsiveContainer>
      );
      case 5: return ( 
        <ResponsiveContainer>
          <LineChart data={sliceData(analysisCharts.subjectScoreAnalysisData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={['auto', 'auto']}/>
            <RechartsTooltip formatter={(value) => value}/>
            <Legend/>
            <Line type="monotone" dataKey="MyScore" stroke="#D97706" strokeWidth={2} label={renderCustomLabel}/>
            <Line type="monotone" dataKey="ClassAvg" stroke="#F59E0B" strokeWidth={2} label={renderCustomLabel}/>
            <Line type="monotone" dataKey="TotalAvg" stroke="#10B981" strokeWidth={2} label={renderCustomLabel}/>
          </LineChart>
        </ResponsiveContainer>
      );
      case 7: return ( 
        <ResponsiveContainer>
          <ComposedChart data={sliceData(analysisCharts.compareData)} margin={chartMargin}>
            <CartesianGrid stroke="#f5f5f5"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0, 100]}/>
            <RechartsTooltip formatter={(value) => value}/>
            <Bar dataKey="ClassAvg" barSize={20} fill="#ff7300" label={renderCustomLabel}/>
            {/* [수정] Line 라벨 추가: MyScore 수치 표시 */}
            <Line type="monotone" dataKey="MyScore" stroke="#413ea0" strokeWidth={3} label={renderCustomLabel} />
          </ComposedChart>
        </ResponsiveContainer>
      );
      case 8: return (
        <ResponsiveContainer>
          <LineChart data={sliceData(analysisCharts.attitudeData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0,12]} ticks={[3, 7, 10]} tickFormatter={(val) => val === 10 ? 'Ex' : val === 7 ? 'Gd' : 'NI'} />
            <RechartsTooltip formatter={(val) => val === 10 ? 'Excellent' : val === 7 ? 'Good' : val === 3 ? 'NI' : val}/>
            <Line type="step" dataKey="Attendance" stroke="#82ca9d" label={(props) => <text x={props.x} y={props.y - 5} fill="#000" textAnchor="middle" fontSize={10} fontWeight="bold">{props.value === 10 ? 'Ex' : props.value === 7 ? 'Gd' : 'NI'}</text>}/>
            <Line type="step" dataKey="Homework" stroke="#8884d8"/>
          </LineChart>
        </ResponsiveContainer>
      );
      case 9: return (
        <ResponsiveContainer>
          <BarChart data={sliceData(analysisCharts.deviationData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[-30, 30]}/>
            <RechartsTooltip formatter={(value) => `${value}%p`}/>
            <Bar dataKey="Deviation" fill="#8884d8" label={renderCustomLabel}/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 10: return (
        <ResponsiveContainer>
          <BarChart data={sliceData(analysisCharts.quarterlyData)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="name" tick={{fontSize:10}}/>
            <YAxis width={24} domain={[0,60]}/>
            <RechartsTooltip formatter={(value) => `${value}%`}/>
            <Bar dataKey="Avg" fill="#82ca9d" label={renderCustomLabel}/>
          </BarChart>
        </ResponsiveContainer>
      );
      default: return null;
    }
  };

  const getGraphTitle = (id) => {
    // 동적 그래프 제목 (11번부터 시작)
    if (id >= 100) {
        if (id >= 200) {
            const idx = id - 200;
            const subj = currentClassConfig.config.rw[idx];
            // 11 + L&S 개수 + RW 인덱스
            const startNum = 11 + currentClassConfig.config.ls.length + idx;
            return subj ? `${startNum}. ${subj.name} 성장세` : '';
        } else {
            const idx = id - 100;
            const subj = currentClassConfig.config.ls[idx];
            // 11 + LS 인덱스
            const startNum = 11 + idx;
            return subj ? `${startNum}. ${subj.name} 성장세` : '';
        }
    }

    // 정적 그래프 제목 (9, 10번 변경됨)
    switch(id) {
      case 1: return "1. 종합 점수 추이";
      case 2: return "2. L&S vs R&W 비중 변화";
      case 3: return "3. L&S 세부 영역 누적";
      case 4: return "4. R&W 세부 영역 누적";
      case 5: return "5. 회차별 종합 성적 비교"; 
      case 7: return "7. 전체 평균 대비 위치";
      case 8: return "8. 월별 태도 변화";
      case 9: return "9. 평균 대비 편차";
      case 10: return "10. 분기별 평균 점수";
      default: return "";
    }
  };

  return (
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
            <div className="w-24 h-24 flex items-center justify-center">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {latestScore?.id ? (
            <>
              {/* Monthly Evaluation */}
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Monthly Evaluation</h3>
                <table className="w-full border-2 border-gray-800 text-sm">
                  <thead><tr className="bg-gray-200 border-b-2 border-gray-800"><th className="p-2 border-r border-gray-400 w-1/4">영역</th><th className="p-2 border-r border-gray-400 w-1/2">세부 항목</th><th className="p-2 border-r border-gray-400">배점</th><th className="p-2">득점</th></tr></thead>
                  <tbody>
                      {(() => {
                          const lsItems = currentClassConfig.config.ls || [];
                          const rwItems = currentClassConfig.config.rw || [];

                          return (
                              <>
                                  {lsItems.map((item, idx) => (
                                      <tr key={`ls-${idx}`} className="border-b border-gray-300">
                                          {idx === 0 && <td rowSpan={lsItems.length} className="p-2 border-r text-center bg-blue-50 font-bold whitespace-pre-line">{currentClassConfig.config.lsTitle || 'Listening\n& Speaking'}</td>}
                                          <td className="p-2 border-r">{item.name}</td>
                                          <td className="p-2 border-r text-center">{item.max}</td>
                                          <td className="p-2 text-center font-bold">{latestScore[`ls${idx+1}`]}</td>
                                      </tr>
                                  ))}
                                  {lsItems.length === 0 && <tr><td colSpan="4" className="p-2 text-center text-gray-400">No L&S Subjects</td></tr>}

                                  {rwItems.map((item, idx) => (
                                      <tr key={`rw-${idx}`} className="border-b border-gray-300">
                                          {idx === 0 && <td rowSpan={rwItems.length} className="p-2 border-r text-center bg-green-50 font-bold whitespace-pre-line">{currentClassConfig.config.rwTitle || 'Reading\n& Writing'}</td>}
                                          <td className="p-2 border-r">{item.name}</td>
                                          <td className="p-2 border-r text-center">{item.max}</td>
                                          <td className="p-2 text-center font-bold">{latestScore[`rw${idx+1}`]}</td>
                                      </tr>
                                  ))}
                                  {rwItems.length === 0 && <tr><td colSpan="4" className="p-2 text-center text-gray-400">No R&W Subjects</td></tr>}

                                  <tr className="bg-gray-100 font-bold">
                                      <td colSpan="2" className="p-2 border-r text-center">TOTAL SCORE</td>
                                      <td className="p-2 border-r text-center">{currentClassConfig.totalMax}</td>
                                      <td className="p-2 text-center text-indigo-700 text-lg">{latestScore.total}</td>
                                  </tr>
                              </>
                          );
                      })()}
                  </tbody>
                </table>
              </div>
              {/* Class Progress */}
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText size={18}/> Class Progress</h3>
                <table className="w-full border-2 border-gray-800 text-sm text-center">
                  <thead className="bg-gray-200 border-b-2 border-gray-800"><tr><th className="p-2">Overall Progress Grade (Based on Total Score %)</th></tr></thead>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className={`p-4 font-bold text-2xl ${latestScore.classProgress === 'EX' ? 'text-indigo-700' : latestScore.classProgress === 'GD' ? 'text-green-600' : 'text-red-600'}`}>
                        {latestScore.classProgress || 'NI'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Detail & Comment */}
              <div className="flex flex-col md:flex-row gap-6 flex-1">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-56 border-2 border-gray-800 p-2 relative rounded-sm">
                    <h4 className="absolute top-2 left-2 font-bold text-sm bg-white px-1 z-10">* Detail Analysis</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                          const radarData = [];
                          (currentClassConfig.config.ls || []).forEach((item, idx) => {
                              radarData.push({ 
                                  subject: item.name.split('(')[0].substring(0, 10) + (item.name.length > 10 ? '..' : ''), 
                                  A: item.max > 0 ? ((latestScore[`ls${idx+1}`] || 0) / item.max) * 100 : 0, 
                                  full: item.max 
                              });
                          });
                          (currentClassConfig.config.rw || []).forEach((item, idx) => {
                              radarData.push({ 
                                  subject: item.name.split('(')[0].substring(0, 10) + (item.name.length > 10 ? '..' : ''), 
                                  A: item.max > 0 ? ((latestScore[`rw${idx+1}`] || 0) / item.max) * 100 : 0, 
                                  full: item.max 
                              });
                          });
                          
                          return (
                              <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
                                <PolarGrid gridType="polygon" />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                                <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
                              </RadarChart>
                          );
                      })()}
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
              <p className="text-gray-600 mt-2">{selectedStudentInfo.displayName} 학생의 성적 변화 추이</p>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-l-4 border-indigo-600 pl-2">1. Score History (Recent 5 Months)</h3>
              <table className="w-full border-2 border-gray-800 text-sm text-center">
                <thead className="bg-gray-100 border-b-2 border-gray-800 font-bold"><tr><th className="p-3 border-r border-gray-300">Date</th><th className="p-3 border-r border-gray-300">L&S Score</th><th className="p-3 border-r border-gray-300">R&W Score</th><th className="p-3 bg-yellow-50">Total Score</th></tr></thead>
                <tbody>
                  {studentHistory.slice(0, 5).map((score) => {
                    const sClass = score.classInfo;
                    const config = (classSubjects && classSubjects[sClass]) ? classSubjects[sClass] : { ls: [], rw: [] };
                    const lsMax = (config.ls || []).reduce((a, b) => a + b.max, 0);
                    const rwMax = (config.rw || []).reduce((a, b) => a + b.max, 0);

                    return (
                        <tr key={score.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border-r border-gray-200">{score.date}</td><td className="p-3 border-r border-gray-200 text-blue-600">{score.lsTotal} / {lsMax}</td><td className="p-3 border-r border-gray-200 text-green-600">{score.rwTotal} / {rwMax}</td><td className="p-3 font-bold text-lg bg-yellow-50 border-l-2 border-l-gray-200">{score.total}</td>
                        </tr>
                    );
                  })}
                  {studentHistory.length === 0 && <tr><td colSpan="4" className="p-4">기록이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 border-l-4 border-indigo-600 pl-2">2. Growth Trend (Recent 12 Months)</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg text-xs gap-1">
                  <button onClick={() => setGraphMode('monthly')} className={`px-3 py-1 rounded transition-colors ${graphMode === 'monthly' ? 'bg-white shadow text-indigo-600 font-bold' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>월별</button>
                  <button onClick={() => setGraphMode('quarterly')} className={`px-3 py-1 rounded transition-colors ${graphMode === 'quarterly' ? 'bg-white shadow text-indigo-600 font-bold' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>분기별</button>
                  <button onClick={() => setGraphMode('yearly')} className={`px-3 py-1 rounded transition-colors ${graphMode === 'yearly' ? 'bg-white shadow text-indigo-600 font-bold' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>년도별</button>
                </div>
              </div>
              <div className="border rounded-lg p-4 h-80 bg-white mb-6">
                  {graphData && graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData.slice(-12)} margin={{ top: 30, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="name" padding={{ left: 30, right: 30 }} tick={{fontSize: 12}} />
                        <YAxis domain={[0, 100]} hide/>
                        <RechartsTooltip formatter={(value) => `${Math.round(value)}`}/>
                        <Legend />
                        {graphData[0] && Object.keys(graphData[0]).filter(key => key !== 'name').map((key, index) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={getLineColor(index)} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls label={{position: 'top', dy: -5, fontSize: 10, fill: getLineColor(index), formatter: (val) => `${Math.round(val)}`}} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-gray-400">데이터가 부족합니다.</div>}
              </div>

              {/* Page 2 Bottom: Up to 2 selected charts */}
              {analysisCharts && page2Charts.length > 0 && (
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
        {analysisCharts && Array.isArray(extraPages) && extraPages.map((pageCharts, idx) => (
          <div key={idx} style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} className="bg-white p-12 rounded-lg shadow-lg border border-gray-400 flex flex-col gap-4 mx-auto mt-8 print:break-before-page print:mt-0">
              <div className="border-b-4 border-gray-800 pb-2 mb-2">
                <h1 className="text-2xl font-serif font-bold tracking-wider text-gray-900">DETAILED ANALYSIS ({idx + 2})</h1>
                <p className="text-gray-600 mt-1">{selectedStudentInfo.displayName || selectedStudentInfo.nameE || ''} - 추가 분석 차트</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                {Array.isArray(pageCharts) && pageCharts.map(graphId => (
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
  );
};

export default ReportCard;