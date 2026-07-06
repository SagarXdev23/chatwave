const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    isGlobal: {
        type: Boolean,
        default: false,
    },
    disappearingTimer: {
        type: Number,
        // Number of days: 6 (global), 7, 21, or 60. Default for personal is 7.
        default: 7, 
    },
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
