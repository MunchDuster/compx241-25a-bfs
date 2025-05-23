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
        console.log(user.toString() + ' starting turn');
        socket.emit('turn-start');
    };
    this.onWaitBegin = () => {
        console.log(user.toString() + ' waiting turn');
        socket.emit('wait-start');
    }
    this.onJoinGame = (otherUser, joinedGame, isLastPlayerToJoin) => {
        game = joinedGame;
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
        console.log(user.toString() + ' is playing a turn');
        if (turn == null) {
            console.log('turn is null');
            if (callback != null) {
                callback({success: false, result: 'turn is null'});
                return;
            }
        }
        if (callback == null) {
            socket.emit('error', 'play-turn callback is null!');
            console.log('play-turn callback is null');
            return;
        }


        const {success, result} = game.playTurn(user, turn);
        callback({success, result});
        if (!success) {
            console.log('turn ' + turn.type + ' failed, reason: ', result);
            return;
        }

        const gameOver = game.checkGameOver();

        // other player only sees missile or secret (they dont get move or recon info)
        const seeTurn = {
            gameState: {
                isOver: gameOver,
                winner: game.winner
            },
            type: turn.type == 'missile' ? 'missile' : 'secret',
            result: turn.type == 'missile' ? result : null
        }
        io.to(opponent.socketId).emit('see-turn', seeTurn);
        if (gameOver) {
            game.delete();
            user.game = null;
            opponent.game = null;
            return;
        }
        game.nextTurn();
    });

    // -- Game Events --
    // Handle placements
    socket.on('set-placements', (placements) => {
        if (!Game.isValidPlacements(placements, logError)) {
            return;
        }
        game.setUserBoatPlacements(user, placements);
        console.log('set-placements for ' + user.toString());
        if (game.user1.ready && game.user2.ready) {
            console.log('starting ' + game.id);
            game.startGame();
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
