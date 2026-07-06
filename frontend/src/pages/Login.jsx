import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(identifier, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <button 
        onClick={toggleTheme} 
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
              <MessageSquare className="text-white" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Sign in to continue to ChatWave</p>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email or Phone Number</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Email, Phone, or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
