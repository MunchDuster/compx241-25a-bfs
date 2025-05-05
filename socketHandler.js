const { Socket } = require("socket.io");
const Game = require('./game.js');
const User = require('./user.js');

const socketHandlers = new Map();

function SocketHandler(socket, io) {
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
    socket.on('join', (requesterUsername) => {
        // Get the user who reqeusted the game
        let requesterUser = User.getByName(requesterUsername);

        // Validate both players are still available and finding
        if (!user.isFinding || !requesterUser?.isFinding) {
            socket.emit('error', `User '${requesteeUsername}' does not exist or is not finding a game.`);
            return;
        }

        // Create game
        const game = new Game(user, requesterUser);

        // Set up game room and notify other player
        this.joinGameRoom(game);
        socketHandlers.get(requesterUser.socketId).joinGameRoom(game);

        socket.emit('joined', requesterUser.name, game.id);
        io.to(requesterUser.socketId).emit('joined', user.name, game.id);
    });

    // Handle game room setup
    this.joinGameRoom = function(game) {
        user.joinGame(game.id);

        // Update game state variables
        socket.leave('finding');
        socket.join(game.id); // Add user to the game room
        // Update finding list for everyone else
        io.to('finding').emit('find-results', User.getAllFinding());
    }

    // Handle placements
    socket.on('placements-complete', (placements) => {
        if (!Game.isValidPlacements(placements, logError)) {
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
    this.gameEnded = () => {
        // Reset user's game state
        if (user.gameId == null) {
            console.log('error: users\'s game ended but no gameId set! user: ' + user.name);
            return;
        }
        socket.leave(user.gameId);
        user.leaveGame();
    };

    // Handle user disconnection
    socket.on('disconnect', () => {
        socketHandlers.delete(socket.id);

        const user = User.getById(socket.id);
        console.log(`Disconnecting: ${user ? user.name : socket.id}`);
        if (user.name == null) return;

        console.log('user game id is ', user.gameId);
        if (user.gameId != null) {
            socket.leave(user.gameId);
            io.to(user.gameId).emit('game-ended', `${user.name} disconnected.`);

            const game = Game.getById(user.gameId);
            if (game == null) {
                console.log('disconnect could not find game by id! ' + user.gameId);
                return;
            }
            game.userDisconnected(user.name, socket.id);
            const otherSocketId = game.getOtherSocketId(user);
            if (otherSocketId == null) {
                console.error('other socket id in  game is null! id is ' + user.socketId + ' game is ' + user.gameId);
                return;
            }
            socketHandlers.get(otherSocketId).gameEnded();
        }
        else if (user.isFinding) {
            socket.leave('finding');
        }

        user.delete();

        if(user.isFinding) {
            io.to('finding').emit('find-results', User.getAllFinding());
        }
    });

    socketHandlers.set(socket.id, this);
}

module.exports = SocketHandler;
