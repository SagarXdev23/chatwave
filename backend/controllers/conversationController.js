const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get or create Global Conversation
// @route   GET /api/conversations/global
const getGlobalConversation = async (req, res) => {
    try {
        let globalChat = await Conversation.findOne({ isGlobal: true });
        
        if (!globalChat) {
            globalChat = await Conversation.create({
                isGlobal: true,
                disappearingTimer: 6 // 6 days for global
            });
        }
        
        res.json(globalChat);
    } catch (error) {
        res.status(500).json({ message: 'Error getting global conversation', error: error.message });
    }
};

// @desc    Fetch all conversations for a user
// @route   GET /api/conversations
const fetchConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ 
            participants: { $elemMatch: { $eq: req.user._id } },
            isGlobal: false
        })
        .populate('participants', '-password')
        .populate('latestMessage')
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
};

// @desc    Create or fetch 1-on-1 Conversation
// @route   POST /api/conversations
const accessConversation = async (req, res) => {
    const { userId } = req.body; // The ID of the person we want to chat with

    if (!userId) {
        return res.status(400).json({ message: 'UserId param not sent with request' });
    }

    try {
        let isChat = await Conversation.find({
            isGlobal: false,
            $and: [
                { participants: { $elemMatch: { $eq: req.user._id } } },
                { participants: { $elemMatch: { $eq: userId } } },
            ],
        })
        .populate('participants', '-password')
        .populate('latestMessage');

        if (isChat.length > 0) {
            res.json(isChat[0]);
        } else {
            // Create a new one
            var chatData = {
                isGlobal: false,
                participants: [req.user._id, userId],
                disappearingTimer: 7 // default 7 days
            };

            const createdChat = await Conversation.create(chatData);
            const fullChat = await Conversation.findOne({ _id: createdChat._id }).populate('participants', '-password');
            res.status(200).json(fullChat);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error accessing conversation', error: error.message });
    }
};

// @desc    Update disappearing timer
// @route   PUT /api/conversations/:id/timer
const updateDisappearingTimer = async (req, res) => {
    const { timer } = req.body;
    
    // Only allow 7, 21, or 60 days
    if (![7, 21, 60].includes(Number(timer))) {
        return res.status(400).json({ message: 'Invalid timer value' });
    }

    try {
        const conversation = await Conversation.findById(req.params.id);
        
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        
        if (conversation.isGlobal) {
            return res.status(400).json({ message: 'Cannot change global chat timer' });
        }

        conversation.disappearingTimer = Number(timer);
        await conversation.save();

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Error updating timer', error: error.message });
    }
};

// @desc    Get a single conversation by ID
// @route   GET /api/conversations/:id
const getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', '-password')
            .populate('latestMessage');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversation', error: error.message });
    }
};

module.exports = { getGlobalConversation, fetchConversations, accessConversation, updateDisappearingTimer, getConversationById };
