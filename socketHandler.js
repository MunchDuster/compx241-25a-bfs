const Game = require('./game.js');
const User = require('./user.js');
const LobbyHandler = require('./lobbyHandler.js');

const socketHandlers = new Map();

function SocketHandler(socket, io) {
    console.log(`Connection made: ${socket.id}`);

    // Initialize new user state
    const user = new User(socket.id);
    socket.emit('set-usernumber', user.num);
    let game;
    let opponent; // (user)

    function onJoinedLobby() {
        socket.join('finding');   // Room for users searching for games
        // Broadcast updated user list to all searching players
        io.to('finding').emit('find-results', User.getAllFinding());
    }

    function onGameRequested(requesteeSocketId) {
        socket.to(requesteeSocketId).emit('requested-game', user.name);
    }
    this.onTurnBegin = () => {
        socket.emit('turn-start');
    };
    this.onWaitBegin = () => {
        socket.emit('wait-start');
    }
    this.onJoinGame = (otherUser, game, isLastPlayerToJoin) => {
        this.game = game;
        socket.leave('finding'); // its time to stop
        user.isFinding = false; // user is no longer finding a game

        socket.join(game.id); // Add user to the game room
        socket.emit('joined', otherUser.name, game.id, !isLastPlayerToJoin); // tell the client
        game.setTurnCallbacks(user, this.onTurnBegin, this.onWaitBegin);
        opponent = otherUser;

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

    socket.on('play-turn', (turn, callback) => {
        const {success, result} = game.playTurn(user, turn);
        callback({success});
        if (!success) return;
        const gameOver = game.checkGameOver();
        const seeTurn = {
            gameState: {
                isOver: gameOver,
                winner: game.winner
            },
            turn: turn,
            result: result
        }
        io.to(otherUser.socketId).emit('see-turn', seeTurn);
        if (gameOver) {
            game.delete();
            user.game = null;
            otherUser.game = null;
            return;
        }
        game.nextTurn();
    });

    // -- Game Events --
    // Handle placements
    socket.on('set-placements', (boats) => {
        if (!Game.isValidPlacements(boats, logError)) {
            return;
        }

        game.setUserBoatPlacements(user, boats);
        if (game.user1Board.setup && game.user1Board.setup) {
            game.placeMines();
            game.nextTurn(); // start turns
        }
    });

    // Handle game clean up when a game ends
    this.gameEnded = () => {
        this.game = null;

        // Reset user's game state
        if (user.gameId == null) {
            console.log('error: users\'s game ended but no gameId set! user: ' + user);
            return;
        }
        socket.leave(user.gameId);
        user.leaveGame();
    };

    // -- Other Events --
    // Handle user disconnection
    socket.on('disconnect', () => {
        socketHandlers.delete(socket.id);

        const user = User.getById(socket.id);
        console.log(`Disconnecting: ${user ? user.toString() : socket.id}`);
        if (!user || !user.name) return;

        if (user.gameId) {
            const game = Game.getById(user.gameId);
            if (!game) {
                console.log('Disconnect could not find game by id! ' + user.gameId);
                return;
            }

            const otherSocketId = game.getOtherSocketId(user.socketId);

            socket.leave(user.gameId);
            io.to(user.gameId).emit('game-ended', `${user.name} disconnected.`);

            if (otherSocketId) {
                socketHandlers.get(otherSocketId).gameEnded();
            }

            game.userDisconnected(user.name, socket.id);
        }
        else if (user.isFinding) {
            socket.leave('finding');
        }
        
        user.delete();

        if(user.isFinding) {
            io.to('finding').emit('find-results', User.getAllFinding());
        }
    });

    function logError(errorMsg) {
        socket.emit('error', errorMsg);
        console.error('error occured on socket ' + socket.id + ': ' + errorMsg);
    }

    socketHandlers.set(socket.id, this);
}

module.exports = SocketHandler;
