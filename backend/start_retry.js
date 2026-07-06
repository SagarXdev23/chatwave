const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');

dotenv.config();

const connectWithRetry = () => {
    console.log('MongoDB connection with retry');
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB is connected! Starting server...');
            // Start the actual server
            const serverProcess = exec('node server.js');
            serverProcess.stdout.pipe(process.stdout);
            serverProcess.stderr.pipe(process.stderr);
        })
        .catch(err => {
            console.log('MongoDB connection unsuccessful, retry after 5 seconds.');
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
