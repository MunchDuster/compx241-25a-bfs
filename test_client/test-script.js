// Initialize Socket.IO connection to server
const socket = io();

// Track current game state
let isPlayer1 = null;
let usernumber = null;
let username = null;    // Current user's username
let oppUsername = null; // Opponent's username
let gameRoom = null;    // Current game room ID

// Successfully connected to server
socket.on('connect', function() {
    console.log('connected');
});
socket.on('set-usernumber', (usernum) => {
    usernumber = usernum;
    console.log('usernumber is ' + usernumber);
    const numbers = ['One','Two','Three','Four','Five','BigNumberLol'];
    username = 'user' + numbers[usernumber];
    console.log('username is ' + username);
    find();
});


// Handle user clicking "Find Game" button
function find() {
    if (username == null) {``
        console.error('trying to find when username is null!');
    }

    //Emit find event to server with username
    socket.emit('find', username, (response) => {
        if (!response.success) {
            console.log('failed entering finding');
            return;
        }
            console.log('failed entering finding');
    });
}

// Handle error messages from server
socket.on('error', (message) => {
    console.error('received error: ' + message);
})

// Handle updated list of available players
socket.on('find-results', (usersFinding) => {
    console.log('find results are: ', usersFinding);

    // Create a new list item for each available player
    for (let findUsername of usersFinding) {
        if (findUsername == username) continue; // Skip the current player
        console.log('seeing-player: ' + findUsername);
        if (usernumber % 2 == 0) {// only make even users send request
            socket.emit('request-game', findUsername);
        }
    }
});

// Handle incoming game requests
socket.on('requested-game', (requesterUsername) => {
    console.log('requested game from ' + requesterUsername + ', joining');
    socket.emit('join', requesterUsername);
});

// Set up game state when joining a game
socket.on('joined', (otherUsername, joinedGameRoom, isPlayer1L) => {
    isPlayer1 = isPlayer1L;
    oppUsername = otherUsername;
    gameRoom = joinedGameRoom;
    console.log('joining game ' + gameRoom + ' against ' + oppUsername);
    placeShips(); //place ships to be moved by the player
});

// Handle game ending 
socket.on('game-ended', (message) => {
    console.log('game-ended: ' + message);
});

// Handle disconnection from server
socket.on('disconnect', function() {
	console.log('disconnected');
    // Reset game state
    username = null;
    oppUsername = null;
    gameRoom = null;
});

function placeShips() {
    const boats = isPlayer1 
    ? [
        // placements 1 here
    ]
    : [
        // different but valid placements here
    ];
    socket.emit('set-placements', boats);
}