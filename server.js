// Server Configuration
const PORT = process.env.PORT || 8080;

// Required dependencies
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');
const gameLogic = require('./gameLogic.js');

// Initialize express and socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// -- Express Setup --
// Setup static files from client directory
app.use(express.static(join(__dirname,'/client')));

// Track connected users and number of game instances
const users = new Map();
const activeGames = new Map();
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
    const findingUsers = [];
    for (const user of users.values()) {
        if (user.isFinding) {
            findingUsers.push(user.name);
        }
    }
    return findingUsers;
}

// -- Socket.IO Connection Handling --
io.on('connection', (socket) => {
    console.log(`Connection made: ${socket.id}`);

    // Initialize new user state
    users.set(socket.id, { 
        name: null,
        currentGame: null, 
        isFinding: false 
    });
    const user = users.get(socket.id);

    // Handle user searching for a game
    socket.on('find', (newUsername, callback) => {
        // Check if username is valid and not already taken
        if (!isValidUsername(newUsername)) {
            socket.emit('error', 'Invalid username. Must be 3-16 letters with no spaces.');
            callback({success: false});
            return;
        }

        // Check for duplicate usernames
        for (const existingUser of users.values()) {
            if (existingUser.name == newUsername) {
                socket.emit('error', 'Username already taken. Please choose another.');
                callback({success: false});
                return;
            }
        }

        // Update user state to indicate they are searching for a game
        user.name = newUsername;
        user.isFinding = true;
        console.log(`${newUsername} (${socket.id}) is finding.`);
        callback({success: true});

        // Add user to relevant rooms
        socket.join('finding');   // Room for users searching for games
        // Broadcast updated user list to all searching players
        io.to('finding').emit('find-results', getFindingUsers());
    });

    // Handle game request from one user to another
    socket.on('request-game', (requesteeUsername) => {
        console.log(`${user.name} requesting game with ${requesteeUsername}`);

        let requesteeSocketId = null;
        for (const [id, userEntry] of users.entries()) {
            // Find the target user
            if (userEntry.name === requesteeUsername && userEntry.isFinding) {
                requesteeSocketId = id;
                break;
            }
        }

        // Check if the requestee is valid and available for a game
        if (!requesteeSocketId) {
            socket.emit('error', `User '${requesteeUsername}' not found or is not available.`);
            return;
        }
        
        socket.to(requesteeSocketId).emit('requested-game', user.name);
    });
    
    // Handle game join acceptance
    socket.on('join', (requesterUsername, callback) => {
        // Get the user who reqeusted the game
        let requesterSocketId = null;
        let requesterUser = null;
        for (const [id, userEntry] of users.entries()) {
            if (userEntry.name === requesterUsername) {
                requesterSocketId = id;
                requesterUser = userEntry;
                break;
            }
        }

        // Validate both players are still available and finding
        if (!user?.isFinding || !requesterSocketId || !requesterUser?.isFinding) {
            socket.emit('error', `User '${requesteeUsername}' does not exist or is not finding a game.`);
            callback({success: false}); 
            return;
        }

        // Create unique game room name
        const gameRoomName = `game-${gameCount++}`;

        // TODO: create a 'Game' instance to hold game state and whose turn, etc

        // TODO: check if game was successfully created and send false callback if not

        console.log(`Starting game ${gameRoomName} between ${user.name} and ${requesterUsername}`);

        // Set up game room and notify other player
        joinGameRoom(gameRoomName);
        user.currentGame = gameRoomName;

        io.to(requesterSocketId).emit('joined', user.name, gameRoomName);

        callback({success: true, gameRoom: gameRoomName});

        // Update finding list for everyone else
        io.to('finding').emit('find-results', getFindingUsers());
    });
    
    socket.on('joined-ping', joinGameRoom);
    
    // Handle game room setup
    function joinGameRoom(joinedGameRoom) {
        // Update game state variables
        gameRoom = joinedGameRoom;
        user.isFinding = false;
        user.currentGame = gameRoom;
        socket.leave('finding');
        socket.join(gameRoom); // Add user to the game room
    }

    // Handle game clean up when a game ends
    socket.on('game-ended-ping', () => {
        // Reset user's game state
        socket.leave(gameRoom);
        console.log(`${user.name} leaving game ${gameRoom}.`);
        user.currentGame = null;
        gameRoom = null;
    });

    // Handle user disconnection
    socket.on('disconnect', function() {
        const user = users.get(socket.id);
        console.log(`Disconnecting: ${user ? user.name : socket.id}`);
        if (user.name == null) return;

        const gameRoom = user.currentGame;
        if (gameRoom) {
            //const game = activeGames.get(gameRoom);
            console.log(`${user.name} disconnecting from game ${gameRoom}.`);
            socket.leave(gameRoom);
            socket.to(gameRoom).emit('game-ended', `${user.name} disconnected.`);

            // Delete game from active games
        }
        else if (user.isFinding) {
            socket.leave('finding');
        }

        // Remove user from the users map
        users.delete(socket.id);

        if(user.isFinding) {
            io.to('finding').emit('find-results', getFindingUsers());
        }
    });
});

// -- Start Server --
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
