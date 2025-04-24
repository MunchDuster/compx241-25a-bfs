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

io.on('connection', (socket) => { // start socket server listening
    console.log('connection made!');
    socket.on('disconnect', function() {
        console.log('disconnect');
    })
});