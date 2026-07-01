import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';

const Chat = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Sidebar Placeholder */}
      <div className="w-1/3 max-w-sm border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">ChatWave</h2>
          <div className="flex space-x-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">Logged in as <b>{user.username}</b></p>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer border-l-4 border-indigo-500">
            <p className="font-semibold">Global Chat Room</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Join the public conversation</p>
          </div>
        </div>
      </div>

      {/* Chat Area Placeholder */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="font-bold">Global Chat</h3>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-center h-full items-center">
            <p className="text-gray-400">Socket.io connection coming in Phase 3!</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none"
              disabled
            />
            <button disabled className="bg-indigo-600 text-white px-6 py-2 rounded-full opacity-50">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
