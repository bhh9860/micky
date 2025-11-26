import React from 'react';
import { PieChart, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const Statistics = ({
  statCriteria,
  setStatCriteria,
  inputYear,
  inputMonth,
  statisticsData
}) => {
  return (
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
  );
};

export default Statistics;