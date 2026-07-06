const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User'); // Important!

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const globalChat = await Conversation.findOne({ isGlobal: true });
        const msgs = await Message.find({ conversationId: globalChat._id }).populate('sender', 'username');
        let hasNullSender = false;
        msgs.forEach((m, i) => {
            if (!m.sender) {
                console.log(`Message ${i} has null sender! Content: ${m.content}`);
                hasNullSender = true;
            }
        });
        if (!hasNullSender) console.log("All messages have valid senders.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
