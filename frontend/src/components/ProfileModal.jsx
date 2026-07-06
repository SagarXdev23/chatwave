import { useState, useEffect } from 'react';
import { UserCog, X, Image, Shield } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  
  const [editUsername, setEditUsername] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editPhoneVisibility, setEditPhoneVisibility] = useState('Private');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditProfilePic(user.profilePic || '');
      setEditPhoneVisibility(user.privacySettings?.phoneVisibility || 'Private');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { data } = await axios.put('/api/users/profile', {
        username: editUsername,
        profilePic: editProfilePic,
        phoneVisibility: editPhoneVisibility
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      updateUser(data); // update global context
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCog size={20} className="text-indigo-500" /> My Account
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          
          {/* Profile Preview */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-3xl flex items-center justify-center overflow-hidden mb-2 shadow-md">
              {editProfilePic ? (
                <img src={editProfilePic} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                editUsername.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">@{user.username}</p>
          </div>

          {/* Readonly info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email Address (Always Hidden)</p>
            <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">{user.email || 'Not provided'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Phone Number</p>
            <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">{user.phone}</p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nickname</label>
              <input 
                type="text" 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Pic URL (Optional)</label>
              <div className="relative">
                <Image size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="url" 
                  value={editProfilePic} 
                  onChange={(e) => setEditProfilePic(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Shield size={14} /> Phone Number Visibility
              </label>
              <select 
                value={editPhoneVisibility} 
                onChange={(e) => setEditPhoneVisibility(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
              >
                <option value="Public">Public (Everyone can see)</option>
                <option value="My Contacts">My Contacts (Treat as Private for now)</option>
                <option value="Private">Private (Hidden from everyone)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isUpdatingProfile}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
