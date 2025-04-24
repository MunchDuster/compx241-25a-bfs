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
        socket.leave('finding');
        console.log('starting game between ' + username + ' and ' + requesterUsername);

        gameRoom = 'game-' + gameCount++;
        socket.join(gameRoom);
        callback({success: true, gameRoom: gameRoom});

        io.to(requesterUsername).emit('joined', username, gameRoom);
        // TODO: create a 'Game' instance to hold game state and whose turn, etc        
    });
    socket.on('joined-ping', (joinedGameRoom) => { // for other player to join the game room
        gameRoom = joinedGameRoom;
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
        if (username != null) {
            socket.leave(username);
            if (usersFinding.includes(username)) {
                console.log(username + ' is removed from usersFinding')
                usersFinding.splice(usersFinding.indexOf(username), 1);
                socket.leave('finding')
                socket.to('finding').emit('find-results', usersFinding);
            }
        }
    });
});

function isValidUsername(username) {
    return typeof(username) == 'string' && new RegExp('^[a-zA-Z]+$').test(username) && username.length > 2 && username.length < 17;
}