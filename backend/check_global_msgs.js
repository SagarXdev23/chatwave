const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const globalChat = await Conversation.findOne({ isGlobal: true });
        if (globalChat) {
            console.log("Global Chat ID:", globalChat._id);
            const msgs = await Message.find({ conversationId: globalChat._id });
            console.log("Messages in Global Chat:", msgs.length);
            msgs.forEach(m => console.log(m.content));
        } else {
            console.log("Global chat not found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
