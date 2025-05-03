// Server Configuration
const PORT = process.env.PORT || 8080;

// Required dependencies
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');

// Initialize express and socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// -- Express Setup --
// Setup static files from client directory
app.use(express.static(join(__dirname,'/client')));

// Track connected users and number of game instances
const users = [];
let gameCount = 0;

// -- Utility Functions --
// Username validation function
function isValidUsername(username) {
    return typeof(username) == 'string' &&              // Ensure input is string type
           new RegExp('^[a-zA-Z]+$').test(username) &&  // Only letters allowed
           username.length > 2 &&                       // Minimum 3 characters
           username.length < 17;                        // Maximum 16 characters
}

// Function to get list of users searching for games
function getFindingUsers() {
    // Filter users array for those with isFinding flag and map to names only
    return users.filter(user => user.isFinding).map(user => user.name);
}

// -- Socket.IO Connection Handling --
io.on('connection', (socket) => {
    console.log(`Connection made: ${socket.id}`);

    // Initialize user state
    const user = {
        name: null,
        game: null,
        isFinding: false,
        isGaming: false,
    }

    // Handle user searching for a game
    socket.on('find', (newUsername, callback) => {
        // Check if username is valid and not already taken
        if (!isValidUsername(newUsername)) {
            socket.emit('error', 'Invalid username. Must be 3-16 letters with no spaces.');
            callback({success: false});
            return;
        }

        // Check for duplicate usernames
        if (users.some(user => user.name == newUsername)) {
            socket.emit('error', 'there is already a user called that, try another name.');
            callback({success: false});
            return;
        }

        console.log(`${newUsername} is searching for a game`);
        callback({success: true});

        // Update user state to indicate they are searching for a game
        user.name = newUsername;
        user.isFinding = true;
        users.push(user);

        // Add user to relevant rooms
        socket.join(newUsername); // Individual room for the user
        socket.join('finding');   // Room for users searching for games

        // Broadcast updated user list to all searching players
        io.to('finding').emit('find-results', getFindingUsers());
    });

    // Handle game request from one user to another
    socket.on('request-game', (requesteeUsername) => {
        console.log(`${user.name} requesting game with ${requesteeUsername}`);

        // Find the target user fro.m users array
        const requestee = users.find(user => user.name === requesteeUsername);
        
        // Check if the requestee is valid and available for a game
        if (!requestee?.isFinding) {
            socket.emit('error', `User '${requesteeUsername}' is not available for a game`);
            return;
        }
        
        socket.to(requesteeUsername).emit('requested-game', user.name);
    });
    
    // Handle game join acceptance
    socket.on('join', (requesterUsername,callback) => {
        // Check if the requester is still valid and available for a game
        if (users.every(user => user.name != requesterUsername)) {
            socket.emit('error', 'user \'' + requesteeUsername + '\' does not exist or is not finding a game');
            callback({success: false});
            return;
        }

        // Create unique game room name
        const gameRoomName = 'game-' + gameCount++;
        callback({success: true, gameRoom: gameRoomName});

        // Remove user from searching pool
        socket.leave('finding');
        console.log(`Starting game between ${user.name} and ${requesterUsername}`);

        // Set up game room and notify other player
        joinGameRoom(gameRoomName);
        io.to(requesterUsername).emit('joined', user.name, gameRoomName);
        // TODO: create a 'Game' instance to hold game state and whose turn, etc        
    });
    
    socket.on('joined-ping', joinGameRoom);
    
    // Handle game room setup
    function joinGameRoom(joinedGameRoom) {
        // Update game state variables
        gameRoom = joinedGameRoom;
        user.isFinding = false;
        user.isGaming = true;
        socket.join(gameRoom); // Add user to the game room
    }

    // Handle game clean up when a game ends
    socket.on('game-ended-ping', () => {
        // Reset user's game state
        user.isGaming = false;
        socket.leave(gameRoom);
        gameRoom = null;
    });

    // Handle user disconnection
    socket.on('disconnect', function() {
        if (user.name == null) {
            console.log('Disconnect');
            return;
        }

        console.log(`User ${user.name} disconnecting`);

        // Remove user from the users array
        users.splice(users.indexOf(user.name), 1);
        socket.leave(user.name);
        
        // Clean up based on user state
        if (user.isFinding) {
            // Remove from seraching pool and notify others
            socket.leave('finding');
            socket.to('finding').emit('find-results', getFindingUsers());
            return;
        }
        if (user.isGaming) {
            // Notify other player of game end due to disconnection
            console.log(user.name + ' was in ' + gameRoom +', closing game');
            socket.leave(gameRoom);
            io.to(gameRoom).emit('game-ended', user.name + ' disconnected');
        }
    });
});

// -- Start Server --
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
