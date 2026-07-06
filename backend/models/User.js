const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    date_created: {
        type: Date,
        default: Date.now
    },
    profilePic: {
        type: String,
        default: "", // Empty string means use initials avatar
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined to be ignored for unique index
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    privacySettings: {
        phoneVisibility: {
            type: String,
            enum: ['Public', 'My Contacts', 'Private'],
            default: 'Private'
        }
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
