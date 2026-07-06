const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, username, email, phone, password } = req.body;

    try {
        if (!name || !username || !phone || !password) {
            return res.status(400).json({ message: 'Name, Username, phone, and password are required' });
        }

        const userExists = await User.findOne({ $or: [{ username }, { phone }] });
        if (userExists) {
            return res.status(400).json({ message: 'Username or phone already exists' });
        }

        const user = await User.create({
            name,
            username,
            email: email || undefined,
            phone,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                date_created: user.date_created,
                profilePic: user.profilePic,
                privacySettings: user.privacySettings,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Login user (Email or Phone)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or phone

    try {
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide email/phone and password' });
        }

        const user = await User.findOne({ 
            $or: [{ email: identifier }, { phone: identifier }, { username: identifier }] 
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                date_created: user.date_created,
                profilePic: user.profilePic,
                privacySettings: user.privacySettings,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { registerUser, loginUser };
