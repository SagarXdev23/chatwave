// Track online users globally in memory for now
let onlineUsers = [];

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        
        // Add user to online list if not already there
        if (userId && !onlineUsers.some(user => user.socketId === socket.id)) {
            onlineUsers.push({ userId, socketId: socket.id });
        }

        // Broadcast online users count
        io.emit('getOnlineUsers', onlineUsers.map(u => u.userId));

        // Handle joining a specific conversation room
        socket.on('joinRoom', (conversationId) => {
            socket.join(conversationId);
        });

        // Handle incoming messages
        socket.on('sendMessage', (message) => {
            // Broadcast to the specific conversation room
            socket.to(message.conversationId._id).emit('receiveMessage', message);
        });

        // Handle editing messages
        socket.on('editMessage', (message) => {
            socket.to(message.conversationId._id).emit('messageEdited', message);
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            socket.to(data.conversationId).emit('userTyping', data.username);
        });

        socket.on('stopTyping', (data) => {
            socket.to(data.conversationId).emit('userStoppedTyping', data.username);
        });

        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
            io.emit('getOnlineUsers', onlineUsers.map(u => u.userId));
        });
    });
};

module.exports = setupSocket;
