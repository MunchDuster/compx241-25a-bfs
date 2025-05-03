// Initialize Socket.IO connection to server
const socket = io();

// Define menu states and their corresponding DOM elements
const menus = [
    {
        name: 'start',  // Initial menu shown on page load
        element: document.getElementById('start-menu'),
        shown: true,
    }, {
        name: 'find',   // Menu for finding other players
        element: document.getElementById('find-menu'),
        shown: false,
    }, {
        name: 'game',   // Active game view
        element: document.getElementById('game-menu'),
        shown: false,
    },
];

// Get references to DOM elements
const findListContainer = document.getElementById('find-list');
const usernameDisplays = document.querySelectorAll('.username-display:not([id="opp"])');
const oppUsernameDisplay = document.getElementById('opp');

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
    // Prompt user to input username
    username = prompt('enter user name:');

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
        
        // Create container for player entry
        const div = document.createElement('div');
        div.innerText = findUsername;
        div.id = findUsername + '-list-item';
        div.classList.add('find-result');
        findListContainer.appendChild(div);

        // Add request game button
        const requestButton = document.createElement('button');
        requestButton.classList.add('request-game-button');
        requestButton.innerText = 'Request';
        requestButton.addEventListener('click', () => {
            console.log('requesting game with ' + findUsername);
            socket.emit('request-game', findUsername);
        });
        div.appendChild(requestButton);
    }
});

// Handle incoming game requests
socket.on('requested-game', (requesterUsername) => {
    const listItem = document.getElementById(requesterUsername + '-list-item');
    if (!listItem) {
        alert('requested game from ' + requesterUsername + ', user is not in requester list, try refreshing?');
        return;
    }

    // Prevent duplicate join buttons
    const alreadyAskedJoin = listItem.getAttribute('has-requested-join');
    if (alreadyAskedJoin) {
        // TODO: play some ping sound/animation to show re-asking join
        return;
    }

    listItem.setAttribute('has-requested-join', true);

    // Add join button to accept request
    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join';
    joinButton.classList.add('join-button');
    joinButton.addEventListener('click', () => {
        socket.emit('join', requesterUsername, (response) => {
            if (!response.success) return;
            onJoined(requesterUsername, response.gameRoom);
        });
    });
    listItem.appendChild(joinButton);
});

// Handle successful game join from other player
socket.on('joined', (otherUsername, gameRoom) => {
    socket.emit('joined-ping', gameRoom);
    onJoined(otherUsername, gameRoom);
})

// Set up game state when joining a game
function onJoined(otherUsername, joinedGameRoom) {
    showMenu('game'); // Switch to game menu
    oppUsernameDisplay.innerText = otherUsername;
    oppUsername = otherUsername;
    gameRoom = joinedGameRoom;
    console.log('joining game ' + gameRoom + ' against ' + oppUsername);
    startDrawing(); // Initialize drawing state
}

// Handle game ending 
socket.on('game-ended', (message) => {
    alert(message);
    // Reset game state and show start menu
    oppUsername = null;
    gameRoom = null;
    socket.emit('game-ended-ping');
    showMenu('start');
    stopDrawing();
});

// Handle disconnection from server
socket.on('disconnect', function() {
	console.log('disconnected');
    // Reset game state
    username = null;
    oppUsername = null;
    gameRoom = null;
});

// Function to handle menu visibility
function showMenu(name) {
    for(let menu of menus) {
        if (menu.name == name) {
            // Show requested menu if not already shown
            if (menu.shown) continue;
            menu.shown = true;
            menu.element.classList.remove('hidden');
            continue;
        }

        // Hide other menus
        if (!menu.shown) continue;
        menu.shown = false;
        menu.element.classList.add('hidden');
    }
}
