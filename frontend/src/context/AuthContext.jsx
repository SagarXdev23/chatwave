import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved user on initial load
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/auth/login', { identifier, password }, config);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, username, email, phone, password) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/auth/register', { name, username, email, phone, password }, config);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('activeChat');
    localStorage.removeItem('activeChatId');
    localStorage.removeItem('activeChatIsGlobal');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
