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
let selectedDirection = null;

let unplacedShipsArray = [];
let currentPlacedShipsArray = [];

let isMissileMode = true;
let isMoveShipMode = false;

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
    //Super clunky I know
    if(message === 'Invalid username. Must be 3-16 letters with no spaces.') {
        //'Invalid username. Must be 3-16 letters with no spaces.'
        showUsernameAlert();
    } else {
        alert(message);
    }
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
    switchMusic();
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
    //Hide the current menu/controls
    document.getElementById('ship-placement-controls').classList.add('hidden');
    document.getElementById('game-controls').classList.add('hidden');
    //Show the game end controls
    document.getElementById('game-over-message').innerHTML = message;
    document.getElementById('game-over-controls').classList.remove('hidden');
    //Reset Game and Opponent
    oppUsername = null;
    gameRoom = null;
    isReady = false;
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
    playerTurnText.innerHTML = oppUsernameDisplay.innerText + "'s Turn!";
});

socket.on('see-turn', (turnInfo) => {
    const {gameState, type, result} = turnInfo;
    console.log('see-turn', turnInfo);

    if (type === 'missile') {
        if (result.shipHit && result.ship) {
            window.playHitExplosion(result.tile, 1, false);
            playAudio('boom');
            setTimeout(() => {
                window.renderShipDamage(result.tile, 1);
            }, 800);
        }
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
        selectedDirection: selectedDirection,
        unplacedShips: unplacedShipsArray,
        currentPlacedShips: currentPlacedShipsArray,
        isMoveShipMode: isMoveShipMode,
    };
}

window.getGameState = getGameState;
// Function to show invalid username alert to client
function showUsernameAlert() {
    document.getElementById('invalid-username-alert').classList.remove('hidden');
}
// Function to hide invalid username alert from client
function closeUsernameAlert() {
    document.getElementById('invalid-username-alert').classList.add('hidden');
}

// Handle user clicking "Find Game" button
function find() {
    //Get the username from the client 
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
    document.getElementById('game-over-controls').classList.add('hidden');
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

function setSelectedShip(ship) {
    selectedShip = ship;
    window.showMoveShipButton(selectedShip, 1);
    console.log("Selected ship: ", selectedShip.type, " at: ", selectedShip.centerTile, " rotated: ", selectedShip.rotation, " size: ", selectedShip.size);
}

function setSelectedDirection(arrow) {
    selectedDirection = arrow;
    console.log(arrow);
}

window.setSelectedTile = setSelectedTile;
window.setSelectedShip = setSelectedShip;

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

    window.lockShips();

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
    if (isMoveShipMode) {
        isMoveShipMode = false;
        updateMoveShipButton();
    }
    
    isMissileMode = !isMissileMode;
    toggleMissileModeButton.innerText = isMissileMode ? 'Switch to Scan' : 'Switch to Missile';
    fireButton.innerText = isMissileMode ? 'Fire Missile' : 'Fire Recon Missile';
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
        
        if (turn.type == 'missile') {
            if (success) {
                if (response.result.mineHit) {
                    window.playHitExplosion(selectedTile, 2, true);
                    playAudio('boom');

                    // Show damge to own ships from mine blast 😔😔
                    if (response.result.collateralDamage.length > 0) {
                        window.highlightMineBlastArea(selectedTile);
                        window.highlightMineBlastArea(selectedTile, 2);

                        response.result.collateralDamage.forEach(damage => {
                            window.playHitExplosion(damage.tile, 1);
                            setTimeout(() => {
                                window.renderShipDamage(damage.tile, 1);
                            }, 800);
                        });
                    }
                } else if (!response.result.shipHit) {
                    window.playMissSplash(selectedTile, 2, true);
                    playAudio('splash');
                } else if (response.result.shipHit) {
                    window.playHitExplosion(selectedTile, 2, true);
                    playAudio('boom');
                }

                /* if (!response.playerResponse.hit){
                    window.playMissSplash(selectedTile, 2, true);
                    playAudio('splash');
                } else if (response.playerResponse.hit) {
                    window.playHitExplosion(selectedTile, 2, true);
                    playAudio('boom');
                } */
            }
        } else if (turn.type == 'recon-missile') {
            window.highlightReconArea(selectedTile, 2);
            window.showMineCount(selectedTile, 2, response.result.mineCount);
        }

        selectedTile = null;
        const tiles = stagesAndLayers.gridLayer.find('Rect');
        tiles.forEach(t => t.fill('#5F85B5'));
        stagesAndLayers.gridLayer.batchDraw();
    });
}

function canMoveShip() {
    isMoveShipMode = !isMoveShipMode;
    updateMoveShipButton();
}

function updateMoveShipButton() {
    if (isMoveShipMode) {
        moveShipButton.style.background = '#45a049'; // green 👾👽
        moveShipButton.style.color = 'white';
        moveShipButton.style.fontWeight = 'bold';
        moveShipButton.style.cursor = 'pointer';
        moveShipButton.innerText = 'Moving Ship';
    } else {
        moveShipButton.style.background = '#d9d9d9';
        moveShipButton.style.color = 'black';
        moveShipButton.style.fontWeight = 'bold';
        moveShipButton.style.cursor = 'pointer';
        moveShipButton.innerText = 'Move Ship';
    }

    // handle disabled ♿ state
    if (!isTurn || moveShipButton.disabled) {
        moveShipButton.style.opacity = '0.6';
        moveShipButton.style.cursor = 'not-allowed';
        moveShipButton.style.background = '#cccccc';
        moveShipButton.style.color = '#666666';
    }

    if (!isMoveShipMode) {
        feedbackLayer.destroyChildren();
        feedbackLayer.batchDraw();
    }
}

function moveShip() {
    let {x, y} = {x: {pos: 0, grid: 0}, y: {pos: 0, grid: 0}};
    const GRIDSPACING =  getCanvasPosFromGridPos(1, 1, 1).y - getCanvasPosFromGridPos(1, 0, 1).y; //get the spacing between the positions of two adjacent squares

    switch (selectedDirection) {
        case 0: //up
            y = {pos: -GRIDSPACING, grid: -1}; 
            console.log("up");
            break;
        case 90: //right
            x = {pos: GRIDSPACING, grid: 1};
            console.log("right");
            break;
        case 180: //down
            y = {pos: GRIDSPACING, grid: 1}; 
            console.log("down");
            break;
        case 270: //left
            x = {pos: -GRIDSPACING, grid: -1}; 
            console.log("left");
            break;
    }

    console.log("Old Position: Image: ", selectedShip.konvaImg.x(), selectedShip.konvaImg.y());

    //change backend stuff for ship
    selectedShip.x += x.pos;
    selectedShip.y += y.pos;
    selectedShip.centerTile.x += x.grid;
    selectedShip.centerTile.y += y.grid;
    
    //change ship image pos for frontEnd
    let tempX = selectedShip.konvaImg.x() + x.pos;
    let tempY = selectedShip.konvaImg.y() + y.pos;
    selectedShip.konvaImg.x(tempX);
    selectedShip.konvaImg.y(tempY);

    console.log("New Position: Image: ", selectedShip.konvaImg.x(), selectedShip.konvaImg.y());
    const turn = {
        type: 'move',
        ship: selectedShip.type,
        direction: selectedDirection/90,
    };
    socket.emit('play-turn', turn, (response) => {
        if (!response.success) {
            // Revert movement if server rejected it
            selectedShip.x -= x.pos;
            selectedShip.y -= y.pos;
            selectedShip.centerTile.x -= x.grid;
            selectedShip.centerTile.y -= y.grid;
            
            selectedShip.konvaImg.x(selectedShip.x);
            selectedShip.konvaImg.y(selectedShip.y);
            
            console.log("Move failed:", response.result);
        } else {
            console.log("Move successful");
        }
        canMoveShip();
    });

    moveShipButton.disabled = true;
}

window.moveShip = moveShip;