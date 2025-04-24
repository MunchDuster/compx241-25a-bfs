// settings
const PORT = process.env.PORT || 8080;

// all requires here
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(join(__dirname,'/client'))); // setup client files accessible

httpServer.listen(PORT, () => { // start http server listening
    console.log('httpServer running at http://localhost:' + PORT);
});

const usersFinding = [];
let gameCount = 0;
io.on('connection', (socket) => { // start socket server listening
    console.log('connection made!');
    let username = null;
    let gameRoom = null;
    let isFindingGame = false;
    let isInGame = false;

    socket.on('find', (newUsername, callback) => {
        console.log('finding for user: ' + newUsername)
        if (!isValidUsername(newUsername)) {
            socket.emit('error', 'invalid username, 3-16 letters with no whitespaces only');
            callback({success: false});
            return;
        }
        if (usersFinding.includes(newUsername)) {
            socket.emit('error', 'there is already a user called that, try another name.');
            callback({success: false});
            return;
        }
        callback({success: true});
        username = newUsername;
        usersFinding.push(username);
        isFindingGame = true;
        socket.join(username); // put the user in a room by their username
        socket.join('finding'); // join the finding room
        io.to('finding').emit('find-results', usersFinding);
    });
    socket.on('request-game', (requesteeUsername) => {
        console.log(username + ' is requesting game with ' + requesteeUsername);
        if (!usersFinding.includes(requesteeUsername)) {
            socket.emit('error', 'user \'' + requesteeUsername + '\' does not exist or is not finding a game');
            return;
        }
        // broadcast to the other user that this user is requesting a game
        socket.to(requesteeUsername).emit('requested-game', username);
    });
    
    socket.on('join', (requesterUsername,callback) => {
        if (!usersFinding.includes(requesterUsername)) {
            socket.emit('error', 'user \'' + requesteeUsername + '\' does not exist or is not finding a game');
            callback({success: false});
            return;
        }
        const gameRoomName = 'game-' + gameCount++;
        callback({success: true, gameRoom: gameRoomName});

        socket.leave('finding');
        console.log('starting game between ' + username + ' and ' + requesterUsername);

        joinGameRoom(gameRoomName)
        io.to(requesterUsername).emit('joined', username, gameRoomName);
        // TODO: create a 'Game' instance to hold game state and whose turn, etc        
    });
    socket.on('joined-ping', joinGameRoom);
    
    function joinGameRoom(joinedGameRoom) {
        gameRoom = joinedGameRoom;
        isFindingGame = false;
        isInGame = true;
        usersFinding.splice(usersFinding.indexOf(username), 1);
        socket.join(gameRoom);
    }
    socket.on('game-ended-ping', () => {
        isInGame = false;
        socket.leave(gameRoom);
        gameRoom = null;
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
        if (username == null) return;
        socket.leave(username);
        if (isFindingGame) {
            console.log(username + ' is removed from usersFinding')
            socket.leave('finding')
            usersFinding.splice(usersFinding.indexOf(username), 1);
            socket.to('finding').emit('find-results', usersFinding);
            return;
        }
        if (isInGame) {
            console.log(username + ' was in game, closing game ' + gameRoom);
            socket.leave(gameRoom);
            io.to(gameRoom).emit('game-ended', username + ' disconnected');
        }
    });
});

function isValidUsername(username) {
    return typeof(username) == 'string' && new RegExp('^[a-zA-Z]+$').test(username) && username.length > 2 && username.length < 17;
}