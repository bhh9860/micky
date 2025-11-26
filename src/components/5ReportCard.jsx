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
  analysisCharts
}) => {

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

    const sliceData = (data) => data ? data.slice(-8) : [];

    if (!analysisCharts) return null;

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
  );
};

export default ReportCard;