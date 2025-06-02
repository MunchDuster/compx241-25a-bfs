// Server Configuration
const PORT = process.env.PORT || 8080;

// Required dependencies
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');
const SocketHandler = require('./socketHandler');

// Initialize express and socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://bfs.so-we-must-think.space",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// check if set to test client script (while frontend isn't frontending yet)
const TEST_MODE = process.argv.length > 2 && process.argv[2] == 'test';

// -- Express Setup --
// Setup static files from client directory
const clientFolder = TEST_MODE ? '/test_client' : '/client';
app.use(express.static(join(__dirname, clientFolder)));

// -- Socket.IO Connection Handling --
io.on('connection', (socket) => {
    new SocketHandler(socket, io);
});

// -- Start Server --
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    if (TEST_MODE) {
        console.log('[test mode enabled]');
    }
});
