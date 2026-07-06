const mongoose = require('mongoose');
require('dotenv').config();

const wipeDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        await mongoose.connection.dropDatabase();
        console.log("Database successfully dropped!");
        
        process.exit();
    } catch (error) {
        console.error("Error wiping database:", error);
        process.exit(1);
    }
};

wipeDB();
