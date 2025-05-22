const SHIP_TYPES = {
    CARRIER: 'carrier', // length 5
    BATTLESHIP: 'battleship', // length 4
    CRUISER: 'cruiser', // length 3
    SUBMARINE: 'submarine', // length 3
    DESTROYER: 'destroyer' // length 2
};
const ROTATION = { // (0,1,2 or 3) starting at up turning clockwise
    UP: 0,
    LEFT: 1,
    DOWN: 2,
    RIGHT: 3,
}
const TURN_TYPE = {
    Missile: 'missile',
    Recon: 'recon-missile',
    Move: 'move'
}

// Initialize Socket.IO connection to server
const socket = io();

// Track current game state
let isPlayer1 = null;
let usernumber = null;
let username = null;    // Current user's username
let oppUsername = null; // Opponent's username
let gameRoom = null;    // Current game room ID
let placements = null;
let otherBoard = null; // 100 length array filled with null or true or false

// TESTING ONLY VARS
let turnNo = 0;

// Successfully connected to server
socket.on('connect', function() {
    console.log('connected');
    turnNo = 0;
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
    if (username == null) {
        console.error('trying to find when username is null!');
    }

    //Emit find event to server with username
    socket.emit('find', username, (response) => {
        if (!response.success) {
            console.error('failed entering finding');
            return;
        }
        console.log('succeeded entering finding');
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
            return;
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
    otherBoard = [100];
    otherBoard.fill(null);
});

socket.on('turn-start', function() {
    console.log('turn-started');
    
    const turns = [
        { // p1
            type: TURN_TYPE.Missile,
            targetTile: {x: 5, y: 5}
        }, {// p2
            type: TURN_TYPE.Missile,
            targetTile: {x: 3, y: 3}
        }, {// p1
            type: TURN_TYPE.Recon,
            targetTile: {x: 8, y: 8}
        }, {// p2
            type: TURN_TYPE.Recon,
            targetTile: {x: 8, y: 2}
        }, {// p1
            type: TURN_TYPE.Move,
            ship: SHIP_TYPES.BATTLESHIP,
            direction: ROTATION.DOWN
        }, {// p2
            type: TURN_TYPE.Move,
            ship: SHIP_TYPES.SUBMARINE,
            direction: ROTATION.UP
        }, {// p2
            type: TURN_TYPE.Missile,
            targetTile: {x: 3, y: 3}
        }
    ]

    if (turnNo >= turns.length) {
        console.log('RUN OUT OF SET TURNS');
        return;
    }
    const turn = turns[turnNo++];
    console.log('playing turn: ', turn);
    socket.emit('play-turn', turn, ({success}) => {
        console.log('play-turn-success: ' + success);
    });
});
socket.on('wait-start', function() {
    console.log('wait-started');
    turnNo++;
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
    placements = isPlayer1 
    ? [
        // This should show how I've setup the test data -- Malachai
        // (S)ubmarine, (B)attleship, (D)estroyer, c(A)rrier, cr(U)iser
        // square brackets [] indicate ship center
        //   X 0 1 2 3 4 5 6 7 8 9
        // Y 
        // 0   A ~ ~ ~ ~ ~ B[B]B B
        // 1   A ~ ~ ~ ~ ~ ~ ~ ~ ~ 
        // 2  [A]~ ~ ~ ~ ~ ~ ~ ~ ~
        // 3   A ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 4   A ~ ~ ~ ~ S ~ ~ ~ ~
        // 5   ~ ~ ~ ~ ~[S]~ ~ ~ ~
        // 6   ~ ~ ~ ~ ~ S ~ ~ ~ ~
        // 7   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 8   D ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 9  [D]~ ~ ~ ~ ~ ~ U[U]U
        //
        // -- format -- 
        // {
        //     centreTile: {x, y}, // starting at (0,0) ending at (9,9) where (0,0) is top-left corner
        //     rotation: ROTATION,
        //     type: SHIP_TYPES // length is inferred from this
        // }
           { // top-left corner
            centreTile: {x: 0,y : 2},
            rotation: ROTATION.UP,
            type: SHIP_TYPES.CARRIER
        }, { // top-right corner
            centreTile: {x: 7,y : 0},
            rotation: ROTATION.RIGHT,
            type: SHIP_TYPES.BATTLESHIP
        }, { // centerish
            centreTile: {x: 5,y : 5},
            rotation: ROTATION.DOWN,
            type: SHIP_TYPES.SUBMARINE
        }, { // bottom-left corner
            centreTile: {x: 0,y : 9},
            rotation: ROTATION.UP,
            type: SHIP_TYPES.DESTROYER
        }, { // bottom-right corner
            centreTile: {x: 8,y : 9},
            rotation: ROTATION.LEFT,
            type: SHIP_TYPES.CRUISER
        }
    ]
    : [
        // different but valid placements
        // note the [X[Y] is just because there is only one character gaps, same as [X][Y]
        // (S)ubmarine, (B)attleship, (D)estroyer, c(A)rrier, cr(U)iser
        //   X 0 1 2 3 4 5 6 7 8 9
        // Y 
        // 0   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 1   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 
        // 2   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 3   ~ ~ ~ ~ ~ A A[A]A A
        // 4   ~ ~ ~ ~ ~ ~ ~ B U S
        // 5   ~ ~ ~ ~ ~ ~ ~[B[U[S]
        // 6   ~ ~ ~ ~ ~ ~ ~ B U S
        // 7   ~ ~ ~ ~ ~ ~ ~ B[D]D
        // 8   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
        // 9   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
        //
           {
            centreTile: {x: 7,y : 3},
            rotation: ROTATION.RIGHT,
            type: SHIP_TYPES.CARRIER
        }, {
            centreTile: {x: 7,y : 5},
            rotation: ROTATION.DOWN,
            type: SHIP_TYPES.BATTLESHIP
        }, {
            centreTile: {x: 9,y : 5},
            rotation: ROTATION.UP,
            type: SHIP_TYPES.SUBMARINE
        }, {
            centreTile: {x: 8,y : 7},
            rotation: ROTATION.RIGHT,
            type: SHIP_TYPES.DESTROYER
        }, {
            centreTile: {x: 8,y : 5},
            rotation: ROTATION.DOWN,
            type: SHIP_TYPES.CRUISER
        }
    ];
    console.log('setting-placements: ', placements);
    
    socket.emit('set-placements', placements);
}

socket.on('see-turn', (turnInfo) => {
    console.log('seeing-turn!!!!!!!!')
    drawBoard();
})

// "quick" and dirty game state debugging
function drawBoard() {
    //NEEDS TO BE MONOSPACE FONT
    
    // draw header rows
    let str = '';
    str += '        my board               enemy board\n';
    str += '  0 1 2 3 4 5 6 7 8 9  |   0 1 2 3 4 5 6 7 8 9\n';

    // draw main board
    for(let row = 0; row < 10; row++) {
        str += row;
        
        // my row
        for (let col = 0; col < 10; col++) {
            str += ' ';
            // quadruple nested for-loop lol
            // performance, whats that?
            str += getShipLetterAtPoint(col, row);
        }
        str += '  | ';

        // other row
        str += row;
        for (let col = 0; col < 10; col++) {
            str += ' ';
            str += getEnemyMarker(col, row);
        }
        str += '\n';
    }
    console.log(str);

}
function getEnemyMarker(x, y) {
    const marker = otherBoard[x + y * 10];
    if (marker === null) return '~';
    if (marker === true) return 'H';
    if (marker === false) return 'M';
    return '?';
}
function getShipLetterAtPoint(x, y) {
    for (let ship of placements) { 
        // console.log('ship', ship, 'tiles ', getTilesOfShip(ship))

        for (let tile of getTilesOfShip(ship)) {
            
            if (tile.x != x || tile.y != y) {
                continue;
            }
            switch(ship.type) {
                case SHIP_TYPES.BATTLESHIP: return 'B';
                case SHIP_TYPES.CARRIER: return 'A';
                case SHIP_TYPES.CRUISER: return 'U';
                case SHIP_TYPES.DESTROYER: return 'D';
                case SHIP_TYPES.SUBMARINE: return 'S';
            }
        }
    }
    return '~'
}
function getTilesOfShip(ship) {
    const newCentreTile = ship.centreTile;
    const length = getLengthOfShip(ship);
    const halfLength = length % 2 == 0 ? length / 2 - 1: (length - 1) / 2;
    let tiles = [];

    switch(ship.rotation % 4) {
        case 0: // Upwards
            for (let i = 0; i < length; i++) {
                tiles.push({ x: newCentreTile.x, y: newCentreTile.y - (i - halfLength) });
            }
            break;
        case 1: // Rightwards
            for (let i = 0; i < length; i++) {
                tiles.push({ x: newCentreTile.x + (i - halfLength), y: newCentreTile.y });
            }
            break;
        case 2: // Downwards
            for (let i = 0; i < length; i++) {
                tiles.push({ x: newCentreTile.x, y: newCentreTile.y + (i - halfLength) });
            }
            break;
        case 3: // Leftwards
            for (let i = 0; i < length; i++) {
                tiles.push({ x: newCentreTile.x - (i - halfLength), y: newCentreTile.y });
            }
            break;
    }
    return tiles;
}
function getLengthOfShip(ship) {
    switch(ship.type) {
        case SHIP_TYPES.BATTLESHIP: return 4;
        case SHIP_TYPES.CARRIER: return 5;
        case SHIP_TYPES.CRUISER: return 3;
        case SHIP_TYPES.DESTROYER: return 2;
        case SHIP_TYPES.SUBMARINE: return 2;
    }
}
