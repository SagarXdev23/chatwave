import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import ProfileModal from '../components/ProfileModal';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Save activeChat ID to localStorage whenever it changes
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('activeChatId', activeChat._id);
      localStorage.setItem('activeChatIsGlobal', activeChat.isGlobal ? 'true' : 'false');
    }
  }, [activeChat]);

  // On mount: restore the last active chat from the server (not stale localStorage)
  useEffect(() => {
    fetchConversations();

    const savedId = localStorage.getItem('activeChatId');
    const savedIsGlobal = localStorage.getItem('activeChatIsGlobal');

    if (savedId && savedIsGlobal === 'true') {
      // It was global chat — fetch the canonical global chat
      fetchGlobalAndSet();
    } else if (savedId && savedIsGlobal === 'false') {
      // It was a private chat — re-fetch it fresh from the server by ID
      const restorePrivateChat = async () => {
        try {
          const { data } = await axios.get(`/api/conversations/${savedId}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setActiveChat(data);
        } catch (error) {
          console.error("Could not restore private chat, falling back to global", error);
          fetchGlobalAndSet();
        }
      };
      restorePrivateChat();
    } else {
      // Nothing saved — default to global
      fetchGlobalAndSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await axios.get('/api/conversations', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations", error);
    }
  };

  const fetchGlobalAndSet = async () => {
    try {
      const { data } = await axios.get(`/api/conversations/global?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActiveChat(data);
    } catch (error) {
      console.error("Error fetching global room", error);
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-900 dark:text-gray-100 animate-pulse">Loading ChatWave...</div>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar 
        conversations={conversations}
        activeChat={activeChat}
        selectChat={setActiveChat}
        fetchGlobalAndSet={fetchGlobalAndSet}
        fetchConversations={fetchConversations}
        openProfileModal={() => setShowProfileModal(true)}
      />
      <ChatArea 
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        fetchConversations={fetchConversations}
      />
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default Chat;
