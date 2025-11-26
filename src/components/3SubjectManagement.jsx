import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, Plus, Trash2, Edit3 } from 'lucide-react';

const SubjectManagement = ({
  classes,
  classSubjects,
  handleUpdateClassSubject,
  newClassInput,
  setNewClassInput,
  handleAddClass,
  handleDeleteClass
}) => {
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  // 로컬 편집 상태 관리 (category titles 포함)
  const [editSubjects, setEditSubjects] = useState({ 
    ls: [], 
    rw: [], 
    lsTitle: 'Listening & Speaking (L&S)', 
    rwTitle: 'Reading & Writing (R&W)'
  });

  useEffect(() => {
    if (classes.length > 0 && !classes.includes(selectedClass)) {
        setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (selectedClass && classSubjects[selectedClass]) {
      const currentConfig = classSubjects[selectedClass];
      setEditSubjects({
        ls: currentConfig.ls || [],
        rw: currentConfig.rw || [],
        lsTitle: currentConfig.lsTitle || 'Listening & Speaking (L&S)',
        rwTitle: currentConfig.rwTitle || 'Reading & Writing (R&W)'
      });
    } else {
        setEditSubjects({
            ls: Array(4).fill({ name: '', max: 5 }),
            rw: Array(4).fill({ name: '', max: 5 }),
            lsTitle: 'Listening & Speaking (L&S)',
            rwTitle: 'Reading & Writing (R&W)'
        });
    }
  }, [selectedClass, classSubjects]);

  const handleChange = (area, index, field, value) => {
    const newArea = [...editSubjects[area]];
    newArea[index] = { ...newArea[index], [field]: field === 'max' ? Number(value) : value };
    setEditSubjects({ ...editSubjects, [area]: newArea });
  };

  const handleAddSubject = (area) => {
      setEditSubjects({
          ...editSubjects,
          [area]: [...editSubjects[area], { name: '', max: 5 }]
      });
  };

  const handleDeleteSubject = (area, index) => {
      if (window.confirm('정말 삭제하시겠습니까?')) {
        const newArea = editSubjects[area].filter((_, i) => i !== index);
        setEditSubjects({ ...editSubjects, [area]: newArea });
      }
  };

  const handleTitleChange = (key, value) => {
      setEditSubjects({ ...editSubjects, [key]: value });
  };

  const handleSave = () => {
    handleUpdateClassSubject(selectedClass, editSubjects);
    alert(`${selectedClass} 클래스의 과목 설정이 저장되었습니다.`);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-auto">
        
        {/* [1번 요청] 클래스 관리 UI 추가 */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Settings size={18}/> 클래스 관리 (추가/삭제)</h3>
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 flex-1 max-w-md">
                     <input 
                        type="text" 
                        placeholder="새 클래스 이름 (예: Advanced-1)" 
                        className="border p-2 rounded text-sm flex-1"
                        value={newClassInput}
                        onChange={(e) => setNewClassInput(e.target.value)}
                     />
                     <button onClick={handleAddClass} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 font-bold whitespace-nowrap">
                        + 클래스 추가
                     </button>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded border border-gray-300 shadow-sm">
                    <label className="font-bold text-sm text-gray-600">편집할 클래스:</label>
                    <select 
                        className="border-none bg-transparent font-bold text-indigo-700 text-base outline-none cursor-pointer"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button 
                        onClick={() => handleDeleteClass(selectedClass)} 
                        className="ml-2 text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="현재 선택된 클래스 삭제"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* L&S 설정 */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-100 flex flex-col">
                <div className="flex items-center gap-2 mb-4 justify-center">
                    <Edit3 size={16} className="text-blue-600"/>
                    <input 
                        type="text" 
                        className="font-bold text-blue-800 text-center bg-transparent border-b border-blue-300 focus:border-blue-600 outline-none w-64"
                        value={editSubjects.lsTitle}
                        onChange={(e) => handleTitleChange('lsTitle', e.target.value)}
                    />
                </div>
                
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex gap-2 text-xs font-bold text-gray-500 text-center">
                        <span className="w-10">No.</span>
                        <span className="flex-1">과목명 (Subject Name)</span>
                        <span className="w-20">문항 수 (Questions)</span>
                        <span className="w-8">삭제</span>
                    </div>
                    {editSubjects.ls.map((subj, idx) => (
                        <div key={`ls-${idx}`} className="flex gap-2 items-center h-10">
                            <span className="w-10 text-center font-bold text-blue-600">LS {idx+1}</span>
                            <input 
                                type="text" 
                                className="flex-1 border p-2 rounded text-sm h-full"
                                value={subj.name}
                                onChange={(e) => handleChange('ls', idx, 'name', e.target.value)}
                                placeholder={`과목명`}
                            />
                            <div className="w-20 h-full">
                                <input 
                                    type="number" 
                                    className="w-full h-full text-center text-sm bg-white border rounded outline-none text-gray-900"
                                    value={subj.max}
                                    onChange={(e) => handleChange('ls', idx, 'max', e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => handleDeleteSubject('ls', idx)}
                                className="w-8 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-200 rounded h-8 transition-colors"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => handleAddSubject('ls')}
                        className="mt-2 flex items-center justify-center gap-1 py-2 border border-dashed border-blue-300 text-blue-600 bg-white rounded hover:bg-blue-50 font-medium text-sm"
                    >
                        <Plus size={16}/> 과목 추가
                    </button>
                </div>
            </div>

            {/* R&W 설정 */}
            <div className="border rounded-lg p-4 bg-green-50 border-green-100 flex flex-col">
                 <div className="flex items-center gap-2 mb-4 justify-center">
                    <Edit3 size={16} className="text-green-600"/>
                    <input 
                        type="text" 
                        className="font-bold text-green-800 text-center bg-transparent border-b border-green-300 focus:border-green-600 outline-none w-64"
                        value={editSubjects.rwTitle}
                        onChange={(e) => handleTitleChange('rwTitle', e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                     <div className="flex gap-2 text-xs font-bold text-gray-500 text-center">
                        <span className="w-10">No.</span>
                        <span className="flex-1">과목명 (Subject Name)</span>
                        <span className="w-20">문항 수 (Questions)</span>
                         <span className="w-8">삭제</span>
                    </div>
                    {editSubjects.rw.map((subj, idx) => (
                        <div key={`rw-${idx}`} className="flex gap-2 items-center h-10">
                            <span className="w-10 text-center font-bold text-green-600">RW {idx+1}</span>
                            <input 
                                type="text" 
                                className="flex-1 border p-2 rounded text-sm h-full"
                                value={subj.name}
                                onChange={(e) => handleChange('rw', idx, 'name', e.target.value)}
                                placeholder={`과목명`}
                            />
                             <div className="w-20 h-full">
                                <input 
                                    type="number" 
                                    className="w-full h-full text-center text-sm bg-white border rounded outline-none text-gray-900"
                                    value={subj.max}
                                    onChange={(e) => handleChange('rw', idx, 'max', e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => handleDeleteSubject('rw', idx)}
                                className="w-8 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-200 rounded h-8 transition-colors"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => handleAddSubject('rw')}
                        className="mt-2 flex items-center justify-center gap-1 py-2 border border-dashed border-green-300 text-green-600 bg-white rounded hover:bg-green-50 font-medium text-sm"
                    >
                        <Plus size={16}/> 과목 추가
                    </button>
                </div>
            </div>

            {/* Class Progress 설정 섹션 삭제됨 */}
        </div>

        <div className="mt-6 flex justify-end">
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md font-bold transition-colors"
            >
                <Save size={20}/> 설정 저장하기
            </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded flex items-start gap-2">
            <AlertCircle size={16} className="mt-1 shrink-0"/>
            <div>
                <p className="font-bold">주의사항:</p>
                <p>1. 과목 설정을 변경하면 해당 클래스의 '점수 입력', '세부학생관리', '성적표' 화면에 즉시 반영됩니다.</p>
                <p>2. 배점을 변경하더라도 기존에 입력된 점수 데이터는 삭제되지 않지만, 성적표나 그래프 표시 시 새로운 배점 기준으로 비율이 계산될 수 있습니다.</p>
                <p>3. 제목(Listening & Speaking 등)을 클릭하여 카테고리명을 수정할 수 있습니다.</p>
                <p>4. Class Progress의 항목 이름도 변경하여 성적표에 반영할 수 있습니다.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectManagement;