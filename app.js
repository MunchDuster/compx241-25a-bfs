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

const usersFinding = ['test1','test2','test3'];
io.on('connection', (socket) => { // start socket server listening
    console.log('connection made!');
    let username = null;
    socket.on('find', (newUsername) => {
        console.log('finding for user: ' + newUsername)
        if (!isValidUsername(newUsername)) {
            socket.emit('error', 'invalid username, 3-16 letters with no whitespaces only');
            return;
        }
        if (usersFinding.includes(newUsername)) {
            socket.emit('error', 'there is already a user called that, try another name.');
            return;
        }
        username = newUsername;
        usersFinding.push(username);
        socket.emit('find-results', usersFinding);
    });
    socket.on('find-again', () => {
        socket.emit('find-results', usersFinding);
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
        if (username != null) {
            if (usersFinding.includes(username)) {
                console.log(username + ' is removed from usersFinding')
                usersFinding.splice(usersFinding.indexOf(username), 1);
                // TODO: update currently finding players
                // LATER: put all users finding into a room
            }
        }
    });
});

function isValidUsername(username) {
    return typeof(username) == 'string' && username.match('^[a-zA-Z]+') && 2 < username.length < 16;
}