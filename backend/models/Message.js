const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        default: null, // If null, the message does not disappear
    }
}, { timestamps: true });

// Create a TTL index on expiresAt. MongoDB will automatically delete documents when expiresAt is reached.
// If expiresAt is null, the document is kept.
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
