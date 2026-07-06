import { useState, useEffect, useRef } from 'react';
import { Send, Users, Settings, Clock, Image as ImageIcon, X, Pencil, Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Helper to format time (e.g. 10:30 AM)
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper to format date labels (Today, Yesterday, etc.)
const formatDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

const ChatArea = ({ activeChat, setActiveChat, fetchConversations }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Edit State
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  // Fullscreen Image State
  const [viewingImage, setViewingImage] = useState(null);

  const downloadImage = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'chatwave-image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, previewUrl]);

  // Join socket room when activeChat or socket changes
  useEffect(() => {
    if (!activeChat || !socket) return;
    socket.emit('joinRoom', activeChat._id);
  }, [activeChat, socket]);

  // Fetch messages when activeChat changes (NOT dependent on socket)
  useEffect(() => {
    if (!activeChat) return;

    setShowSettings(false);
    clearImageSelection(); 
    cancelEdit();

    const controller = new AbortController();
    
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/${activeChat._id}?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${user.token}` },
          signal: controller.signal
        });
        setMessages(data);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error("Error fetching messages", error);
        }
      }
    };
    
    fetchMessages();
    
    return () => {
      controller.abort();
    };
  }, [activeChat?._id, user.token]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !activeChat) return;

    const handleReceiveMessage = (message) => {
      if (message.conversationId._id === activeChat._id || message.conversationId === activeChat._id) {
        setMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    };

    const handleMessageEdited = (updatedMessage) => {
      if (updatedMessage.conversationId._id === activeChat._id || updatedMessage.conversationId === activeChat._id) {
        setMessages((prev) => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
      }
    };

    const handleUserTyping = (username) => {
      setTypingUsers((prev) => !prev.includes(username) ? [...prev, username] : prev);
    };

    const handleUserStoppedTyping = (username) => {
      setTypingUsers((prev) => prev.filter(u => u !== username));
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket, activeChat, fetchConversations]);

  // Update Disappearing Timer
  const updateTimer = async (days) => {
    if (!activeChat || activeChat.isGlobal) return;
    try {
      const { data } = await axios.put(`/api/conversations/${activeChat._id}/timer`, { timer: days }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActiveChat(data);
      setShowSettings(false);
      fetchConversations();
    } catch (error) {
      console.error("Failed to update timer", error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!typing && socket && activeChat) {
      setTyping(true);
      socket.emit('typing', { conversationId: activeChat._id, username: user.username });
    }
    
    let lastTypingTime = new Date().getTime();
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= 2000 && typing) {
        socket.emit('stopTyping', { conversationId: activeChat._id, username: user.username });
        setTyping(false);
      }
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20000000) {
        alert("Image must be smaller than 20MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      cancelEdit(); // Cannot edit and upload image at the same time
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (msg) => {
    setEditingMessageId(msg._id);
    setNewMessage(msg.content);
    clearImageSelection();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !socket || !activeChat) return;

    socket.emit('stopTyping', { conversationId: activeChat._id, username: user.username });
    setTyping(false);

    try {
      setIsUploading(true);
      let data;

      if (editingMessageId) {
        // Edit existing text message
        const res = await axios.put(`/api/messages/${editingMessageId}`, 
          { content: newMessage },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        data = res.data;
        socket.emit('editMessage', data);
        setMessages((prev) => prev.map(msg => msg._id === data._id ? data : msg));
        cancelEdit();
      } else if (selectedImage) {
        // Send image message
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('conversationId', activeChat._id);
        
        const res = await axios.post('/api/messages/image', formData, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        data = res.data;
        clearImageSelection();
        socket.emit('sendMessage', data);
        setMessages((prev) => [...prev, data]);
      } else {
        // Send new text message
        const res = await axios.post('/api/messages', 
          { content: newMessage, conversationId: activeChat._id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        data = res.data;
        socket.emit('sendMessage', data);
        setMessages((prev) => [...prev, data]);
      }
      
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      console.error("Failed to send/edit message", error);
      alert(error.response?.data?.message || "Failed to process message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.isGlobal) return "Global Chat";
    const partner = chat.participants.find(p => p._id !== user._id);
    return partner ? partner.username : "Unknown User";
  };

  // Group messages by date for rendering
  const renderMessages = () => {
    const grouped = [];
    let lastDateLabel = null;

    messages.forEach((msg) => {
      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== lastDateLabel) {
        grouped.push({ type: 'date', id: `date-${dateLabel}`, label: dateLabel });
        lastDateLabel = dateLabel;
      }
      grouped.push({ type: 'message', id: msg._id, data: msg });
    });

    return grouped.map((item, index) => {
      if (item.type === 'date') {
        return (
          <div key={item.id} className="flex justify-center my-4 animate-in fade-in">
            <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
              {item.label}
            </span>
          </div>
        );
      }

      const msg = item.data;
      const isMe = msg.sender._id === user._id;
      const timeDiff = new Date() - new Date(msg.createdAt);
      const isEditable = isMe && msg.messageType === 'text' && timeDiff <= 5 * 60 * 1000; // 5 mins

      return (
        <div key={item.id} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          {(activeChat.isGlobal && !isMe) && (
            <span className="text-[10px] font-semibold text-gray-400 mb-1 mx-2">{msg.sender.username}</span>
          )}
          
          <div className="flex items-center gap-2 group">
            {/* Edit Button for sender */}
            {isEditable && (
              <button 
                onClick={() => startEdit(msg)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit Message"
              >
                <Pencil size={14} />
              </button>
            )}

            <div className={`px-3 py-2 rounded-2xl shadow-sm relative text-sm md:text-base flex flex-col ${
              isMe 
                ? (msg.messageType === 'image' ? 'bg-transparent shadow-none p-0' : 'bg-indigo-600 text-white rounded-br-sm') 
                : (msg.messageType === 'image' ? 'bg-transparent shadow-none p-0' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700')
            }`}>
              
              {/* Content */}
              {msg.messageType === 'image' ? (
                <img 
                  src={msg.content} 
                  alt="Shared Image" 
                  onClick={() => setViewingImage(msg.content)}
                  className={`max-w-full sm:max-w-xs rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`} 
                />
              ) : (
                <span className="break-words mr-10">{msg.content}</span>
              )}

              {/* Timestamp & Edited Label */}
              <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'} ${msg.messageType === 'image' ? 'absolute bottom-2 right-2 bg-black/50 px-1.5 py-0.5 rounded text-white' : 'self-end'}`}>
                {msg.isEdited && <span className="italic">(edited)</span>}
                <span>{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative">
        <div className="text-center text-gray-400 flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Users size={48} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to ChatWave</h3>
          <p className="text-sm">Select a chat from the sidebar or search for a user to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-10 flex justify-between items-center sticky top-0">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            {getChatName(activeChat)}
            {activeChat.isGlobal && <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">Public</span>}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock size={12} />
            {activeChat.isGlobal ? 'Messages disappear in 6 days' : `Messages disappear in ${activeChat.disappearingTimer} days`}
          </p>
        </div>
        
        {/* Settings Dropdown */}
        {!activeChat.isGlobal && (
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              <Settings size={20} className={showSettings ? "animate-spin-slow" : ""} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Clock size={12}/> Disappearing Messages</p>
                </div>
                <div className="p-1">
                  {[7, 21, 60].map(days => (
                    <button 
                      key={days}
                      onClick={() => updateTimer(days)}
                      className={`w-full text-left px-4 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors ${activeChat.disappearingTimer === days ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {days} Days
                      {activeChat.disappearingTimer === days && <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm"></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-sm">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-indigo-600 dark:text-indigo-400" size={32} />
              </div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Disappearing Messages are ON</h4>
              <p className="text-sm text-gray-500">
                All messages in this chat will automatically delete from the database and everyone's devices after {activeChat.isGlobal ? '6' : activeChat.disappearingTimer} days.
              </p>
            </div>
          </div>
        )}
        
        {renderMessages()}
        
        {typingUsers.length > 0 && (
          <div className="self-start px-4 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-full rounded-bl-sm text-xs italic flex items-center gap-3 w-fit animate-in fade-in">
            <span className="flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </span>
            {typingUsers.join(', ')} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 flex flex-col">
        {/* Edit Context Bar */}
        {editingMessageId && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 text-sm font-medium">
              <Pencil size={14} /> Editing message...
            </div>
            <button onClick={cancelEdit} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Image Preview */}
        {previewUrl && !editingMessageId && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="h-32 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600" />
              <button 
                onClick={clearImageSelection}
                className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full hover:bg-red-500 transition-colors shadow-lg"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4">
          <div className={`flex space-x-2 items-center rounded-full px-2 py-1.5 border transition-all shadow-inner ${
            editingMessageId 
              ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-700/50 focus-within:border-indigo-400' 
              : 'bg-gray-100 dark:bg-gray-700 border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-600'
          }`}>
            {!editingMessageId && (
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Send Image"
              >
                <ImageIcon size={20} />
              </button>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <input 
              type="text" 
              placeholder={previewUrl ? "Image selected..." : editingMessageId ? "Edit your message..." : "Type a disappearing message..."}
              disabled={!!previewUrl}
              className="flex-1 px-2 py-2 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white disabled:opacity-50"
              value={newMessage}
              onChange={handleTyping}
            />
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !selectedImage) || isUploading} 
              className={`text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 shadow-sm disabled:shadow-none transform active:scale-95 disabled:active:scale-100 ${
                editingMessageId 
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600'
              }`}
              title={editingMessageId ? "Update Message" : "Send Message"}
            >
              {isUploading ? <Settings size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        </form>
      </div>

      {/* Fullscreen Image Lightbox */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="absolute top-4 right-4 flex gap-4">
            <button 
              onClick={() => downloadImage(viewingImage)} 
              className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Download Image"
            >
              <Download size={24} />
            </button>
            <button 
              onClick={() => setViewingImage(null)} 
              className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
          <img 
            src={viewingImage} 
            alt="Fullscreen View" 
            className="max-w-full max-h-full object-contain select-none" 
          />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
