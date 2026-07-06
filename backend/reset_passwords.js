const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected.');

        // Hash the new universal password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Update all users
        const result = await User.updateMany({}, { $set: { password: hashedPassword } });
        console.log(`Successfully reset passwords for ${result.modifiedCount} accounts to 'password123'`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPasswords();
