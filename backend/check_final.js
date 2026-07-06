const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);
        
        const globals = await Conversation.find({ isGlobal: true });
        console.log(`Global Chats: ${globals.length}`);
        
        let totalMsgs = 0;
        if (globals.length > 0) {
            const msgs = await Message.find({ conversationId: globals[0]._id });
            totalMsgs = msgs.length;
            console.log(`Messages in Global: ${msgs.length}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
