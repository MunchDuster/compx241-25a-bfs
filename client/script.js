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
const toggleMissileModeButton = document.getElementById('toggle-missile-mode-button');
const moveShipButton = document.getElementById('move-ship-button');
const playerTurnText = document.getElementById('player-turn-text');

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

let isMissileMode = true;

let sfx = null;

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
    isReady = false;
   
    document.getElementById('ship-placement-controls').classList.remove('hidden');
    document.getElementById('ready-button').disabled = true;
    document.getElementById('placement-feedback').innerText = '👽';
});

// Handle game ending 
socket.on('game-ended', (message) => {
    alert(message);
    // Reset game state and show start menu
    oppUsername = null;
    gameRoom = null;
    // showMenu('start');
    rejoin();
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
    document.getElementById('ship-placement-controls').classList.add('hidden');
    document.getElementById('game-controls').classList.remove('hidden');
    fireButton.disabled = false;
    toggleMissileModeButton.disabled = false;
    moveShipButton.disabled = false;
    playerTurnText.innerHTML = "Your Turn!";
});

// Handle turn wait? 
socket.on('wait-start', () => {
    console.log('wait started');
    isTurn = false;
    document.getElementById('ship-placement-controls').classList.add('hidden');
    document.getElementById('game-controls').classList.remove('hidden');
    fireButton.disabled = true;
    toggleMissileModeButton.disabled = true;
    moveShipButton.disabled = true;
    playerTurnText.innerHTML = "Opponents Turn!";
});

socket.on('see-turn', (turnInfo) => {
    const {gameState, type, result} = turnInfo;
    console.log('see-turn', turnInfo);
    if (type === 'missile') {
        if (result.hit && result.ship) {
            // const canvasTilepos = getCanvasPosFromGridPos(result.tile.x, result.tile.y, 1);
            // window.playHitExplosion(canvasTilepos.x, canvasTilepos.y, canvasTilepos.gridNumber);
            
            window.playHitExplosion(result.tile, 1, false);
            playsfx('boom');
            setTimeout(() => {
                // window.renderShipDamage(canvasTilepos.x, canvasTilepos.y, canvasTilepos.gridNumber,);
                
                window.renderShipDamage(result.tile, 1);
            }, 800);
        }
    }

    // if (!gameState.isOver) {
    //     alert("Game Over");
    //     alert("Hey, another alert.")
    //     rejoin();
    // }
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

// Handle user rejoining lobby after game end
function rejoin() {
    socket.emit('rejoin-lobby', username, (response) => {
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

function updateReadyButton() {
    document.getElementById('ready-button').disabled = currentPlacedShipsArray.length == 5 ? false : true;
}

window.updateReadyButton = updateReadyButton;

function setSelectedTile(x, y) {
    selectedTile = {x: x, y: y};
    console.log("Selected tile:", selectedTile);
}
window.setSelectedTile = setSelectedTile;

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

function playsfx(sfxName) {
    if (!sfx) {
        sfx = new AudioContext();
    }

    const audio = new Audio(`../assets/${sfxName}.mp3`);
    const track = sfx.createMediaElementSource(audio);

    const gainNode = sfx.createGain();
    const volumeSlider = document.getElementById('volumeSlider');
    gainNode.gain.value = volumeSlider ? volumeSlider.value : 0.2;

    track.connect(gainNode).connect(sfx.destination);
    audio.play();
}

/*
 *  ---- In Game Functions ----
 */

function confirmPlacements () {
    if (currentPlacedShipsArray.length != 5) return;

    const placements = currentPlacedShipsArray.map(ship => ({
        type: ship.type,
        centreTile: {x: ship.centerTile.x, y: ship.centerTile.y},
        rotation: ship.rotation
    }));

    socket.emit('set-placements', placements);
    isReady = true;

    document.getElementById('ready-button').disabled = true;
    document.getElementById('placement-feedback').innerText = 'Wating for opponent...'; 
}

function playerTurn() {
    let action = null;
    while(action = null) {
    }
    socket.emit('player-move', action, xpos, ypos);
}

function toggleMissileMode() {
    isMissileMode = !isMissileMode;
    toggleMissileModeButton.innerText = isMissileMode ? 'Switch to Scan' : 'Switch to Missile';
    fireButton.innerText = isMissileMode ? 'Fire Missile' : 'Fire Recon Missile';
    console.log('Switching to ' + (isMissileMode ? 'Missile' : 'Scan'));
}

function fireMissile() {
    if (!isTurn || !selectedTile) return; // return for now

    const turn = {
        type: isMissileMode ? 'missile' : 'recon-missile',
        targetTile: {
            x: selectedTile.x,
            y: selectedTile.y
        }
    };
    console.log("Firing");
    socket.emit('play-turn', turn, (response) => {
        const success = response.success;
        console.log(response);
        const gameOver = response.gameOver;
        if (turn.type == 'missile') {
            if (success) {
                const canvasTilepos = getCanvasPosFromGridPos(selectedTile.x, selectedTile.y, 2);
                if (!response.playerResponse.hit){
                    // window.playMissSplash(canvasTilepos.x, canvasTilepos.y, true);
                    
                    window.playMissSplash(selectedTile, 2, true);
                    playsfx('splash');
                } else if (response.playerResponse.hit) {
                    // window.playHitExplosion(canvasTilepos.x, canvasTilepos.y, true);

                    window.playHitExplosion(selectedTile, 2, true);
                    playsfx('boom');
                }
            }
        } else if (turn.type == 'recon-missile') {
            // const canvasTilepos = getCanvasPosFromGridPos(selectedTile.x, selectedTile.y, 2);
            // window.showMineCount(canvasTilepos.x, canvasTilepos.y, response.playerResponse.mineCount);
            
            window.showMineCount(selectedTile, 2, response.playerResponse.mineCount);
        }

        selectedTile = null;
        const tiles = stagesAndLayers.gridLayer.find('Rect');
        tiles.forEach(t => t.fill('#5F85B5'));
        stagesAndLayers.gridLayer.batchDraw();
        // if(!gameOver) {
        //     alert("Game Over");
        //     alert("Hey, another alert.")
        //     rejoin();
        // }
    });
}