const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const setupSocket = require('./socket/socketHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*', // We will restrict this to frontend URL later
        methods: ['GET', 'POST']
    }
});

// Initialize socket handlers
setupSocket(io);

// Routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

// Middleware
app.use(express.json());

// Prevent aggressive browser caching for all API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cors());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('ChatWave API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
