const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const globalChat = await Conversation.findOne({ isGlobal: true });
        const msgs = await Message.find({ conversationId: globalChat._id })
            .populate('sender', 'username')
            .populate('conversationId')
            .sort({ createdAt: 1 });
            
        console.log(JSON.stringify(msgs.slice(-2), null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
