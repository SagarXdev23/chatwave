const mongoose = require('mongoose');
require('dotenv').config();
const Conversation = require('./models/Conversation');
const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const globals = await Conversation.find({ isGlobal: true });
        console.log(`Found ${globals.length} global chats.`);
        globals.forEach(g => console.log(g._id));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
