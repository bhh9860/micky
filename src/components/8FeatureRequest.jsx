import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  CheckCircle2, 
  Circle, 
  Send, 
  Plus, 
  Trash2,
  AlertCircle,
  HelpCircle,
  User,
  Check
} from 'lucide-react';

const FeatureRequest = ({ db }) => {
  // --- State for Feature Requests ---
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState('');
  
  // --- State for Chat ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || 'User');
  const chatEndRef = useRef(null);

  // --- Effects ---

  // 1. Subscribe to Feature Requests
  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, 'feature_requests'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(loaded);
    });

    return () => unsubscribe();
  }, [db]);

  // 2. Subscribe to Chat Messages
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'feature_chat'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(loaded);
      // Scroll to bottom on new message
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [db]);

  // Save username to local storage
  useEffect(() => {
    localStorage.setItem('chat_username', username);
  }, [username]);


  // --- Handlers: Feature Requests ---

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.trim()) return;
    if (!db) return alert('데이터베이스 연결 실패');

    try {
      await addDoc(collection(db, 'feature_requests'), {
        text: newRequest,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewRequest('');
    } catch (error) {
      console.error("Error adding request:", error);
      alert("등록 실패");
    }
  };

  const toggleComplete = async (item) => {
    if (!db) return;
    try {
      const ref = doc(db, 'feature_requests', item.id);
      await updateDoc(ref, {
        completed: !item.completed
      });
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!db) return;
    if (!window.confirm('이 건의사항을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'feature_requests', id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // --- Handlers: Chat ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!db) return alert('데이터베이스 연결 실패');

    try {
      await addDoc(collection(db, 'feature_chat'), {
        text: newMessage,
        sender: username,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // --- Render ---

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
        
        {/* LEFT COLUMN: Feature Requests */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-indigo-600"/> 
              기능 건의 / 버그 제보
            </h2>
            <span className="text-xs text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-100 font-medium">
              {requests.filter(r => !r.completed).length} Open
            </span>
          </div>
          
          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
            {requests.length === 0 && (
              <div className="text-center text-gray-400 mt-10 flex flex-col items-center">
                <AlertCircle size={40} className="mb-2 opacity-50 text-gray-300"/>
                <p className="text-gray-400">등록된 건의사항이 없습니다.</p>
              </div>
            )}
            
            {requests.map((req, index) => (
              <div 
                key={req.id} 
                onClick={() => toggleComplete(req)}
                className={`group flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  req.completed 
                    ? 'bg-gray-50 border-gray-100 opacity-75' 
                    : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0 transition-colors">
                  {req.completed ? (
                    <CheckCircle2 size={22} className="text-green-500 fill-green-50" />
                  ) : (
                    <Circle size={22} className="text-gray-300 group-hover:text-indigo-500" />
                  )}
                </div>
                
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm leading-relaxed ${req.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    <span className="font-mono text-xs text-gray-400 mr-2">#{index + 1}</span>
                    {req.text}
                  </p>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(req.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 outline-none focus:outline-none hover:bg-red-50 rounded"
                  title="삭제"
                >
                  <Trash2 size={16} className="stroke-current"/>
                </button>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <form onSubmit={handleAddRequest} className="flex gap-2">
              <input 
                type="text" 
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                placeholder="건의사항이나 버그를 입력하세요..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-800 bg-white placeholder-gray-400"
              />
              <button 
                type="submit"
                disabled={!newRequest.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Plus size={18} /> 등록
              </button>
            </form>
          </div>
        </div>


        {/* RIGHT COLUMN: Chat Interface */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-yellow-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-yellow-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-yellow-600"/> 
              대화합시다
            </h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
               <User size={14} className="text-yellow-600"/>
               <span className="text-xs text-gray-500 font-medium">사용자명:</span>
               <input 
                 type="text" 
                 value={username} 
                 onChange={(e) => setUsername(e.target.value)}
                 className="text-xs border-b border-dashed border-gray-300 focus:border-yellow-600 outline-none bg-transparent w-20 text-center text-gray-800 font-bold"
               />
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
             {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-sm">대화 내용이 없습니다. 자유롭게 이야기해보세요!</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender === username;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender}</span>
                  <div 
                    className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm break-words ${
                      isMe 
                        ? 'bg-yellow-400 text-yellow-900 rounded-tr-none font-medium' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none text-sm bg-gray-50 text-gray-800 placeholder-gray-400"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* User Guide Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
          <HelpCircle size={20} className="text-green-600" />
          8번 기능 문의하기 사용 가이드
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <CheckCircle2 size={16} /> 기능 건의 / 버그 제보
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                    <li>사용 중에 발견한 버그나 추가되었으면 하는 기능을 작성해 주세요.</li>
                    <li>등록된 건의사항은 개발자가 확인 후 개발을 진행합니다.</li>
                    <li>개발이 완료되면 체크 표시(<CheckCircle2 size={12} className="inline text-green-500"/>)가 되며 취소선이 그어집니다.</li>
                    <li>본인이 등록한 건의사항이 아니더라도 자유롭게 삭제할 수 있으니 주의해 주세요.</li>
                </ul>
            </div>
            <div className="space-y-2">
                <h4 className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                    <MessageSquare size={16} /> 대화합시다 (채팅)
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                    <li>건의사항에 대해 더 자세한 설명이 필요하거나, 개발자와 소통이 필요할 때 사용합니다.</li>
                    <li>우측 상단의 <strong>'사용자명'</strong>을 클릭하여 본인의 이름으로 변경 후 대화를 시작하세요.</li>
                    <li>실시간으로 메시지가 전송되며 모든 사용자가 대화 내용을 볼 수 있습니다.</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureRequest;
