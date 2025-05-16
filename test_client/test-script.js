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
    joinButton.addEventListener('click', () => socket.emit('join', requesterUsername));
    listItem.appendChild(joinButton);
});

// Set up game state when joining a game
socket.on('joined', (otherUsername, joinedGameRoom) => {
    showMenu('game'); // Switch to game menu
    oppUsernameDisplay.innerText = otherUsername;
    oppUsername = otherUsername;
    gameRoom = joinedGameRoom;
    console.log('joining game ' + gameRoom + ' against ' + oppUsername);
    startPlacingShips(); //place ships to be moved by the player
});

// Handle game ending 
socket.on('game-ended', (message) => {
    alert(message);
    // Reset game state and show start menu
    oppUsername = null;
    gameRoom = null;
    showMenu('start');
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

// TEST-SCRIPT ONLY SOCKET STUFF //
socket.on('test-set-username', (testname) => {
    username = testname;
    find();
});
