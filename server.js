// Server Configuration
const PORT = process.env.PORT || 8080;

// Required dependencies
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');
const Game = require('./game.js');
const User = require('./user.js');

// Initialize express and socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// -- Express Setup --
// Setup static files from client directory
app.use(express.static(join(__dirname,'/client')));

// -- Socket.IO Connection Handling --
io.on('connection', (socket) => {
    console.log(`Connection made: ${socket.id}`);

    // Initialize new user state
    const user = new User(socket.id);

    // Handle user searching for a game
    socket.on('find', (newUsername, callback) => {
        // Check if username is valid and not already taken
        if (!User.isValidName(newUsername)) {
            socket.emit('error', 'Invalid username. Must be 3-16 letters with no spaces.');
            callback({success: false});
            return;
        }

        // Check for duplicate usernames
        if (User.getIdByName(newUsername) != null) {
            socket.emit('error', 'Username already taken. Please choose another.');
            callback({success: false});
            return;
        }

        // Update user state to indicate they are searching for a game
        user.name = newUsername;
        user.isFinding = true;
        console.log(`${newUsername} (${socket.id}) is finding.`);
        callback({success: true});

        // Add user to relevant rooms
        socket.join('finding');   // Room for users searching for games
        // Broadcast updated user list to all searching players
        io.to('finding').emit('find-results', User.getAllFinding());
    });

    // Handle game request from one user to another
    socket.on('request-game', (requesteeUsername) => {
        console.log(`${user.name} requesting game with ${requesteeUsername}`);

        let requesteeSocketId = User.getIdByName(requesteeUsername);

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
        let requesterUser = User.getByName(requesterUsername);

        // Validate both players are still available and finding
        if (!user.isFinding || !requesterUser?.isFinding) {
            socket.emit('error', `User '${requesteeUsername}' does not exist or is not finding a game.`);
            callback({success: false});
            return;
        }

        // Create game
        const game = new Game(user, requesterUser);
        user.joinGame(game.id);
        requesterUser.joinGame(game.id);

        // Set up game room and notify other player
        joinGameRoom(game.id);

        io.to(requesterUser.socketId).emit('joined', user.name, game.id);

        callback({success: true, gameRoom: game.id});
    });
    
    socket.on('joined-ping', joinGameRoom);
    
    // Handle game room setup
    function joinGameRoom(joinedGameRoom) {
        // Update game state variables
        gameRoom = joinedGameRoom;
        user.isFinding = false;
        socket.leave('finding');
        socket.join(gameRoom); // Add user to the game room
        // Update finding list for everyone else
        io.to('finding').emit('find-results', User.getAllFinding());
    }

    // Handle placements
    socket.on('placements-complete', (placements) => {
        if (!isValidPlacements(placements, logError)) {
            return;
        }
        // TODO: set player's placement in game instance to these
        // then check if other player's placements are set
        // if yes then place mines
        // then begin turns
    });

    function logError(errorMsg) {
        socket.emit('error', errorMsg);
        console.log('error occured on socket ' + socket.id + ': ' + errorMsg);
        console.trace();
    }

    // Handle game clean up when a game ends
    socket.on('game-ended-ping', () => {
        // Reset user's game state
        socket.leave(user.gameId);
        console.log(`${user.name} leaving game ${user.gameId}.`);
        user.leaveGame();
    });

    // Handle user disconnection
    socket.on('disconnect', function() {
        const user = User.getById(socket.id);
        console.log(`Disconnecting: ${user ? user.name : socket.id}`);
        if (user.name == null) return;

        const gameRoom = user.gameId;
        if (gameRoom) {
            socket.leave(gameRoom);
            socket.to(gameRoom).emit('game-ended', `${user.name} disconnected.`);

            Game.getById(gameRoom).userDisconnected(user.name, socket.id);
        }
        else if (user.isFinding) {
            socket.leave('finding');
        }

        user.delete();

        if(user.isFinding) {
            io.to('finding').emit('find-results', User.getAllFinding());
        }
    });
});


// -- Start Server --
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


// TODO: move to gameLogic later
// for quick and easy test
// const TEST_PLACEMENTS = [
//     {
//         name: 'carrier', // size 5
//         tiles: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}, {x: 0, y: 4}]
//     }, {
//         name: 'battleship', // size 4
//         tiles: [{x: 3, y: 6}, {x: 4, y: 6}, {x: 5, y: 6}, {x: 6, y: 6}]
//     }, {
//         name: 'cruiser', //size 3
//         tiles: [{x: 9, y: 7}, {x: 9, y: 8}, {x: 9, y: 9}] // bottom-right corner
//     }, {
//         name: 'submarine', //size 3
//         tiles: [{x: 5, y: 7}, {x: 5, y: 8}, {x: 5, y: 9}] // bottom-center corner
//     }, {
//         name: 'destroyer', //size 2
//         tiles: [{x: 8, y: 2}, {x: 8, y: 3}] // bottom-center corner
//     }
// ]
// console.log(isValidPlacements(TEST_PLACEMENTS, console.error));
function isValidPlacements(placements, logError) {
    function tileStr(tile) {
        return '(' + tile.x + ',' + tile.y + ')';
    }
    // check that placements is an array
    if (typeof (placements) != 'object' || typeof (placements.length) != 'number') {
        logError('placements is not an array!');
        return false;
    }

    // check that there are the correct number of boats
    const expectedBoatsCount = 5;
    const boatsCount = placements.length;
    if (boatsCount != expectedBoatsCount) {
        logError('there should be ' + expectedBoatsCount + ' boats! given ' + boatsCount);
        return false;
    }

    // check that all boats valid: sizes of 5,4,3,3,2
    const expectedSizes = [5, 4, 3, 3, 2]; // MAKE SURE THAT LENGTH MATCHES expectedBoatsCount
    for (let i = 0; i < expectedSizes.length; i++) {
        const expectedSize = expectedSizes[i];
        const size = placements[i].tiles.length
        if (size != expectedSize) {
            logError('a boat size is unexpected! boat index ' + i + ', expected ' + expectedSize + ', given ' + size);
            return false;
        }
    }

    // check that all boat tiles are within bounds
    for (let i = 0; i < placements.length; i++) {
        const tiles = placements[i].tiles;
        for (let t = 1; t < tiles.length; t++) {
            const tile = placements[i].tiles[t];
            const isWithinBounds = tile.x < 10 && tile.y < 10 && tile.x >= 0 && tile.y >= 0;
            if (!isWithinBounds) {
                logError('boat tile is out-of-bounds! boat index ' + i + ', tile index ' + t + ', from ' + tileStr(lastTile) + ' to ' + tileStr(tile));
                return false;
            }
        }
    }

    // check that boat tiles are consecutive (boat is not disjoint)
    for (let i = 0; i < placements.length; i++) {
        const tiles = placements[i].tiles;

        // check that there are at least two tiles used -- REMOVE CHECK IF ONE TILE BOATS EXIST
        if (tiles.length < 2) {
            logError('boat is less than two tiles big! boat index ' + i);
            return false;
        }

        let lastTile = tiles[0];
        for (let t = 1; t < tiles.length; t++) {
            const tile = tiles[t];
            const isAdjacentToLast =
                tile.x == lastTile.x && tile.y == (lastTile.y + 1) || // up
            tile.x == lastTile.x && tile.y == (lastTile.y - 1) || // down
            tile.x == (lastTile.x + 1) && tile.y == lastTile.y || // right
            tile.x == (lastTile.x - 1) && tile.y == lastTile.y    // left
            if (!isAdjacentToLast) {
                logError('boat contains non-adjacent tiles! boat index ' + i + ', tile index ' + t + ', between ' + tileStr(tile) + ' and ' + tileStr(lastTile));
                return false;
            }
            lastTile = tile;
        }
    }

    // check that no boats intersect
    // AKA that no tile is the same position as any other tile
    // probably unnecessarily inefficient, but hey thats life ¯\_(ツ)_/¯
    for (let i = 0; i < placements.length; i++) {
        const tiles = placements[i].tiles;
        for (let t = 1; t < tiles.length; t++) {
            const tile = placements[i].tiles[t];
            for (let i2 = 0; i2 < placements.length; i2++) {
                const tiles2 = placements[i2].tiles;
                for (let t2 = 1; t2 < tiles2.length; t2++) {
                    const tile2 = placements[i2].tiles[t2];
                    if (i == i2 && t == t2) // comparing self
                        continue;
                    if (tile.x == tile2.x && tile.y == tile2.y) {
                        logError('boat tiles overlap! boat1 index ' + i + ', tile1 index ' + t + ',boat2 index ' + i2 + ',tile2 index ' + t2 + ' at ' + tileStr(tile));
                        return false;
                    }
                }
            }
        }
    }

    return true;
}