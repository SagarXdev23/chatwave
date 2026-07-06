const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');

const checkMessages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msgs = await Message.find({});
        console.log("Total messages:", msgs.length);
        msgs.forEach(m => console.log(m._id, "expiresAt:", m.expiresAt));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkMessages();
