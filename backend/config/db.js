const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.log('MONGO_URI not set. Starting server without MongoDB connection. Add a valid MongoDB URI to enable persistence.');
            return;
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        console.log('Continuing startup without MongoDB. Add a valid MONGO_URI to enable persistence.');
    }
};

module.exports = connectDB;
