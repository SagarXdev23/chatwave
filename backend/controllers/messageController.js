const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Fetch all messages for a specific conversation
// @route   GET /api/messages/:conversationId
const getMessages = async (req, res) => {
    try {
        console.log(`\n\n--- GET MESSAGES ---`);
        console.log(`conversationId param: ${req.params.conversationId}`);
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate('sender', 'username')
            .populate('conversationId')
            .sort({ createdAt: 1 }); // Oldest first
            
        console.log(`Found ${messages.length} messages.`);
        res.json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
};

// @desc    Send a new message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
    const { content, conversationId } = req.body;

    if (!content || !conversationId) {
        return res.status(400).json({ message: 'Message content and conversationId are required' });
    }

    try {
        const ConversationModel = require('../models/Conversation');
        const conversation = await ConversationModel.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Calculate TTL date
        let expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + conversation.disappearingTimer);

        let newMessage = await Message.create({
            sender: req.user._id,
            content,
            conversationId,
            expiresAt
        });

        // Populate sender info
        newMessage = await newMessage.populate('sender', 'username');
        newMessage = await newMessage.populate('conversationId');

        // Update latest message in conversation
        await ConversationModel.findByIdAndUpdate(conversationId, {
            latestMessage: newMessage._id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};

// @desc    Send an image message
// @route   POST /api/messages/image
const sendImageMessage = async (req, res) => {
    const { conversationId } = req.body;

    if (!req.file || !conversationId) {
        return res.status(400).json({ message: 'Image and conversationId are required' });
    }

    try {
        const ConversationModel = require('../models/Conversation');
        const conversation = await ConversationModel.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Calculate TTL date
        let expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + conversation.disappearingTimer);

        // Path to save in DB
        const imageUrl = `/uploads/${req.file.filename}`;

        let newMessage = await Message.create({
            sender: req.user._id,
            content: imageUrl,
            messageType: 'image',
            conversationId,
            expiresAt
        });

        // Populate sender info
        newMessage = await newMessage.populate('sender', 'username');
        newMessage = await newMessage.populate('conversationId');

        // Update latest message in conversation
        await ConversationModel.findByIdAndUpdate(conversationId, {
            latestMessage: newMessage._id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send image message', error: error.message });
    }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
const editMessage = async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Verify the sender is the one requesting the edit
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this message' });
        }

        // Only allow editing text messages
        if (message.messageType !== 'text') {
            return res.status(400).json({ message: 'Only text messages can be edited' });
        }

        // 5-minute time window check
        const timeDiff = new Date() - new Date(message.createdAt);
        if (timeDiff > 5 * 60 * 1000) {
            return res.status(403).json({ message: 'Message can only be edited within 5 minutes of sending' });
        }

        message.content = content;
        message.isEdited = true;

        let updatedMessage = await message.save();

        // Populate sender info again to return the full object
        updatedMessage = await updatedMessage.populate('sender', 'username');
        updatedMessage = await updatedMessage.populate('conversationId');

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to edit message', error: error.message });
    }
};

module.exports = { getMessages, sendMessage, sendImageMessage, editMessage };
