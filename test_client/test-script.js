// Initialize Socket.IO connection to server
const socket = io();

// Track current game state
let username = null;    // Current user's username
let oppUsername = null; // Opponent's username
let gameRoom = null;    // Current game room ID

// Successfully connected to server
socket.on('connect', function() {
    console.log('connected');
});


// Handle user clicking "Find Game" button
function find() {
    // username given from server
    // Prompt user to input username
    if (username == null) {
        console.error('trying to find when username is null!');
    }

    //Emit find event to server with username
    socket.emit('find', username, (response) => {
        if (!response.success) return;
        // Show the find menu and update username displays
        showMenu('find');
        console.log(usernameDisplays)
        usernameDisplays.forEach(div => div.innerText = username);
    });
}

// Handle error messages from server
socket.on('error', (message) => {
    alert(message);
})

// Handle updated list of available players
socket.on('find-results', (usersFinding) => {
    console.log('find results are: ', usersFinding);
    findListContainer.innerHTML = ''; // Clear exisiting list\

    // Create a new list item for each available player
    for (let findUsername of usersFinding) {
        if (findUsername == username) continue; // Skip the current player
        
        console.log('seeing-player: ' + findUsername);
    }
});

// Handle incoming game requests
socket.on('requested-game', (requesterUsername) => {
    console.log('requested game from ' + requesterUsername + ', joining');
    socket.emit('join', requesterUsername);
});

// Set up game state when joining a game
socket.on('joined', (otherUsername, joinedGameRoom) => {
    oppUsernameDisplay.innerText = otherUsername;
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