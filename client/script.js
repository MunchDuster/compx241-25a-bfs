// const { isTypedArray } = require("util/types");

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
const fireButton = document.getElementById('fire-button');
const scanButton = document.getElementById('scan-button');

/*
 *  ---- Game State Variables ----
 */
let username = null;    // Current user's username
let oppUsername = null; // Opponent's username
let gameRoom = null;    // Current game room ID
let isPlayer1 = null;

let isTurn = false;
let isReady = false;
let selectedShip = null;
let selectedTile = null;

let unplacedShipsArray = [];
let currentPlacedShipsArray = [];

/*
 *  ---- Sockets ----
 */

// Successfully connected to server
socket.on('connect', function() {
    console.log('connected');
});

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
    joinButton.addEventListener('click', () => socket.emit('join', requesterUsername));
    listItem.appendChild(joinButton);
});

// Set up game state when joining a game
socket.on('joined', (otherUsername, joinedGameRoom, isFirstPlayer) => {
    showMenu('game'); // Switch to game menu
    isPlayer1 = isFirstPlayer;
    oppUsernameDisplay.innerText = otherUsername;
    oppUsername = otherUsername;
    gameRoom = joinedGameRoom;
    console.log('joining game ' + gameRoom + ' against ' + oppUsername);
    initCanvas(isPlayer1); // Initialize drawing state
    currentPlacedShipsArray = [];
    unplacedShipsArray = [];
    initPlacements(isPlayer1); //place ships to be moved by the player
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

 // Handle turn start 
socket.on('turn-start', () => {
    console.log('turn started');
    isTurn = true;
    playerTurn();
});

// Handle turn wait? 
socket.on('wait-start', () => {
    console.log('wait started');
    isTurn = false;
});

socket.on('see-turn', (turnInfo) => {
    const {gameState, turn, result} = turnInfo;

    switch(turn.type) {
        case TURN_TYPE.Missile:
            
            break;
        case TURN_TYPE.Recon:

            break;
        case TURN_TYPE.Move:

            break;
    }

    if (gameState.isOver) {

    }
});

/*
 *  ---- Functions ----
 */

function getGameState() {
    return {
        isPlayer1: isPlayer1,
        username: username,
        oppUsername: oppUsername,
        gameRoom: gameRoom,
        isTurn: isTurn,
        isReady: isReady,
        selectedShip: selectedShip,
        selectedTile: selectedTile,
        unplacedShips: unplacedShipsArray,
        currentPlacedShips: currentPlacedShipsArray
    };
}

window.getGameState = getGameState;

// Handle user clicking "Find Game" button
function find() {
    // Prompt user to input username
    // username = prompt('enter user name: ');
    username = document.getElementById("uname").value;

    //Emit find event to server with username
    socket.emit('find', username, (response) => {
        if (!response.success) return;
        // Show the find menu and update username displays
        showMenu('find');
        console.log(usernameDisplays)
        usernameDisplays.forEach(div => div.innerText = username);
    });
}

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

function updateGameButtons() {
    fireButton.disabled = !isTurn;
    scanButton.disabled = !isTurn;
}

function setSelectedTile(x, y) {
    selectedTile = (x,y);
    console.log("setting selected tile ");
}

// Sound must player after an interaction like a click, browser will not play it otherwise
function playAudio() {
    console.log('playing audio')
    
    // hide the tip
    const tip = document.querySelector('.whyCantIHearTheSong');
    tip.parentElement.removeChild(tip);

    const sound = document.getElementById('songer');

    const audioContext = new AudioContext();
    const track = audioContext.createMediaElementSource(sound);

    const gainNode = audioContext.createGain();

    const volumeSlider = document.getElementById('volumeSlider');
    const setGain = () => {
        const volume = volumeSlider.value;
        console.log('setting volume ' + volume);
        gainNode.gain.value = volume;
    }
    volumeSlider.addEventListener('mousemove', setGain);
    setGain();

    track.connect(gainNode).connect(audioContext.destination);
    sound.play();

    window.removeEventListener('click', playAudio);
}
window.addEventListener('click', playAudio);

/*
 *  ---- In Game Functions ----
 */

function playerTurn() {
    let action = null;
    while(action = null) {
    }
    socket.emit('player-move', action, xpos, ypos);
}

function fireMissile() {
    if (!isTurn || !selectedTile) return; // return for now

    const turn = {
        type: 'TURN_TYPE.Missile',
        targetTile: {
            x: selectedTile.x,
            y: selectedTile.y
        }
    };
    console.log("Firing");
    socket.emit('play-turn', turn, (response) => {
        const success = response.success;
        const result = response.result;
        // Pizza 🍕
    });
}

function scanForMine() {
    if (!isTurn || !selectedTile) return; // return for now

    const turn = {
        type: 'TURN_TYPE.Recon',
        targetTile: {
            x: selectedTile.x,
            y: selectedTile.y
        }
    };

    socket.emit('play-turn', turn, (response) => {
        const success = response.success;
        const result = response.result;
        // 😎😎
    });
}