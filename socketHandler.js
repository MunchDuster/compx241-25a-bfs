const Game = require('./game.js');
const User = require('./user.js');
const LobbyHandler = require('./lobbyHandler.js');

const socketHandlers = new Map();

function SocketHandler(socket, io) {
    console.log(`Connection made: ${socket.id}`);

    // Initialize new user state
    const user = new User(socket.id);
    function onJoinedLobby() {
        socket.join('finding');   // Room for users searching for games
        // Broadcast updated user list to all searching players
        io.to('finding').emit('find-results', User.getAllFinding());
    }
    function onGameRequested(requesteeSocketId) {
        socket.to(requesteeSocketId).emit('requested-game', user.name);
    }
    this.onJoinGame = (otherUser, game, isLastPlayerToJoin) => {
        socket.leave('finding'); // its time to stop
        user.isFinding = false; // user is no longer finding a game

        socket.join(game.id); // Add user to the game room
        socket.emit('joined', otherUser.name, game.id); // tell the client
        
        // Update finding list for everyone else
        if (isLastPlayerToJoin) { // prevent multiple updates for one game starting
            io.to('finding').emit('find-results', User.getAllFinding());
        }
        else {
            socketHandlers.get(otherUser.socketId).onJoinGame(user, game, true);
        }
    };

    const lobby = new LobbyHandler(user, logError, onJoinedLobby, onGameRequested, this.onJoinGame);

    // Handle user searching for a game
    socket.on('find', lobby.joinLobby);

    // Handle game request from one user to another
    socket.on('request-game', lobby.requestGame);

    // Handle game join acceptance
    socket.on('join', lobby.joinGame);

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
            console.log('error: users\'s game ended but no gameId set! user: ' + user);
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
