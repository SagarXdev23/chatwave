const mongoose = require('mongoose');
require('dotenv').config();
const Conversation = require('./models/Conversation');
const User = require('./models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const convs = await Conversation.find({}).populate('participants');
        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);
        console.log(`Total Conversations: ${convs.length}`);
        convs.forEach(c => {
            console.log(`Chat (Global: ${c.isGlobal}) - Participants:`, c.participants.map(p => p.username).join(', '));
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
