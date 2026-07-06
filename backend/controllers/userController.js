const User = require('../models/User');

// @desc    Search users by username or phone
// @route   GET /api/users?search=...
const searchUsers = async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { username: { $regex: req.query.search, $options: 'i' } },
                  { phone: { $regex: req.query.search, $options: 'i' } },
              ],
          }
        : {};

    try {
        // Find users matching search (excluding current user)
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password');
        
        // Privacy logic: only show phone if explicitly set to Public
        const filteredUsers = users.map(user => {
            const userObj = user.toObject();
            const visibility = userObj.privacySettings?.phoneVisibility || 'Private';
            if (visibility !== 'Public') {
                userObj.phone = 'Hidden';
            }
            return userObj;
        });

        res.json(filteredUsers);
    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = req.body.username || user.username;
            user.profilePic = req.body.profilePic !== undefined ? req.body.profilePic : user.profilePic;
            
            if (req.body.phoneVisibility) {
                if (!user.privacySettings) {
                    user.privacySettings = {};
                }
                user.privacySettings.phoneVisibility = req.body.phoneVisibility;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePic: updatedUser.profilePic,
                privacySettings: updatedUser.privacySettings,
                token: req.headers.authorization.split(' ')[1], // Return existing token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

module.exports = { searchUsers, updateProfile };
