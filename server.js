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

const users = [];
let gameCount = 0;
io.on('connection', (socket) => { // start socket server listening
    console.log('connection made!');
    const user = {
        name: null,
        game: null,
        isFinding: false,
        isGaming: false,
    }

    socket.on('find', (newUsername, callback) => {
        if (!isValidUsername(newUsername)) {
            socket.emit('error', 'invalid user.name, 3-16 letters with no whitespaces only');
            callback({success: false});
            return;
        }
        if (users.includes(newUsername)) {
            socket.emit('error', 'there is already a user called that, try another name.');
            callback({success: false});
            return;
        }
        console.log(newUsername + ' is finding');
        callback({success: true});
        user.name = newUsername;
        user.isFinding = true;
        users.push(user);
        socket.join(newUsername); // put the user in a room by their user.name
        socket.join('finding'); // join the finding room
        io.to('finding').emit('find-results', getFindingUsers());
    });
    function getFindingUsers() {
        return users.filter(user => user.isFinding).map(user => user.name);
    }
    socket.on('request-game', (requesteeUsername) => {
        console.log(user.name + ' is requesting game with ' + requesteeUsername);
        const requestee = users.find(user => user.name == requesteeUsername);
        if (requestee === undefined || !requestee.isFinding) {
            socket.emit('error', 'user \'' + requesteeUsername + '\' does not exist or is not finding a game');
            return;
        }
        // broadcast to the other user that this user is requesting a game
        socket.to(requesteeUsername).emit('requested-game', user.name);
    });
    
    socket.on('join', (requesterUsername,callback) => {
        if (users.every(user => user.name != requesterUsername)) {
            socket.emit('error', 'user \'' + requesteeUsername + '\' does not exist or is not finding a game');
            callback({success: false});
            return;
        }
        const gameRoomName = 'game-' + gameCount++;
        callback({success: true, gameRoom: gameRoomName});

        socket.leave('finding');
        console.log('starting game between ' + user.name + ' and ' + requesterUsername);

        joinGameRoom(gameRoomName);
        io.to(requesterUsername).emit('joined', user.name, gameRoomName);
        // TODO: create a 'Game' instance to hold game state and whose turn, etc        
    });
    socket.on('joined-ping', joinGameRoom);
    
    function joinGameRoom(joinedGameRoom) {
        gameRoom = joinedGameRoom;
        user.isFinding = false;
        user.isGaming = true;
        socket.join(gameRoom);
    }
    socket.on('game-ended-ping', () => {
        user.isGaming = false;
        socket.leave(gameRoom);
        gameRoom = null;
    });

    socket.on('disconnect', function() {
        if (user.name == null) {
            console.log('disconnect');
            return;
        }
        console.log('disconnecting ' + user.name);

        users.splice(users.indexOf(user.name), 1);
        socket.leave(user.name);
        if (user.isFinding) {
            socket.leave('finding');
            socket.to('finding').emit('find-results', getFindingUsers());
            return;
        }
        if (user.isGaming) {
            console.log(user.name + ' was in ' + gameRoom +', closing game');
            socket.leave(gameRoom);
            io.to(gameRoom).emit('game-ended', user.name + ' disconnected');
        }
    });
});

function isValidUsername(username) {
    return typeof(username) == 'string' && new RegExp('^[a-zA-Z]+$').test(username) && username.length > 2 && username.length < 17;
}