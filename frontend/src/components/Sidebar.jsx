import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, Users, Search, UserCog } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ 
  conversations, 
  activeChat, 
  selectChat, 
  fetchGlobalAndSet, 
  fetchConversations,
  openProfileModal 
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { onlineUsers } = useSocket();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Search Users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      try {
        const { data } = await axios.get(`/api/users?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed", error);
      }
    };
    
    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user.token]);

  const startPrivateChat = async (userId) => {
    try {
      const { data } = await axios.post('/api/conversations', { userId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
      selectChat(data);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-indigo-600">
        <h2 className="text-xl font-bold text-white tracking-wide">ChatWave</h2>
        <div className="flex space-x-1">
          <button onClick={openProfileModal} className="p-2 rounded-full hover:bg-indigo-500 text-white transition-colors" title="My Account">
            <UserCog size={18} />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-indigo-500 text-white transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={logout} className="p-2 rounded-full hover:bg-indigo-500 text-white transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users to chat..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto absolute w-72 z-50 animate-in fade-in slide-in-from-top-2">
            {searchResults.map(u => (
              <div key={u._id} onClick={() => startPrivateChat(u._id)} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                <span className="font-medium text-gray-900 dark:text-gray-100">{u.username}</span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{u.phone}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {/* Global Room Button */}
        <div 
          onClick={fetchGlobalAndSet} 
          className={`p-3 mb-2 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 ${activeChat?.isGlobal ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 shadow-sm transform scale-[1.02]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.01]'}`}
        >
          <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Users className="text-indigo-600 dark:text-indigo-400" size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Global Chat</p>
            <p className="text-xs font-medium text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {onlineUsers.length} users online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 mt-4 px-2">
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Private Chats</p>
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
        </div>
        
        {conversations.length === 0 ? (
          <p className="text-center text-xs text-gray-500 mt-4 italic">No private chats yet.</p>
        ) : (
          conversations.map(chat => {
            const partner = chat.participants.find(p => p._id !== user._id);
            const isOnline = partner && onlineUsers.includes(partner._id);
            const isActive = activeChat?._id === chat._id;
            
            return (
              <div 
                key={chat._id} 
                onClick={() => selectChat(chat)} 
                className={`p-3 mb-1 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 ${isActive ? 'bg-gray-100 dark:bg-gray-700 shadow-sm transform scale-[1.02]' : 'hover:bg-gray-50 dark:hover:bg-gray-750 hover:scale-[1.01]'}`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase overflow-hidden shadow-sm">
                    {partner?.profilePic ? (
                      <img src={partner.profilePic} alt={partner.username} className="w-full h-full object-cover" />
                    ) : (
                      partner?.username.charAt(0) || '?'
                    )}
                  </div>
                  {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {partner?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {chat.latestMessage ? chat.latestMessage.content : <span className="italic">Start chatting!</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
