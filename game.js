const {Ship, SHIP_TYPES} = require('./ship.js');
const Minefield = require('./minefield.js');

const games = new Map();
const BOARD_SIZE = 10;
const NUM_OF_MINES = 10;

class Game { 
    static getById(id) {
        return games.get(id);
    }

    static isValidPlacements(placements, logError) {
        // -- format -- 
        // {
        //     centerTile: {x, y}, // starting at (0,0) ending at (9,9) where (0,0) is top-left corner
        //     rotation: ROTATION,
        //     type: SHIP_TYPES // length is inferred from this
        // }

        // check that placements is an array
        if (!Array.isArray(placements)) {
            logError('Boats is not an array!');
            return false;
        }

        // check that there are the correct number of boats
        const expectedBoatsCount = 5;
        if (placements.length !== expectedBoatsCount) {
            logError(`There should be ${expectedBoatsCount} boats! Given ${placements.length}`);
            return false;
        }

        // check there is one of each type of boat
        const containsAllTypes = ( // crude but works
            placements.some(placement => placement.type == SHIP_TYPES.BATTLESHIP) &&
            placements.some(placement => placement.type == SHIP_TYPES.CARRIER) &&
            placements.some(placement => placement.type == SHIP_TYPES.CRUISER) &&
            placements.some(placement => placement.type == SHIP_TYPES.DESTROYER) &&
            placements.some(placement => placement.type == SHIP_TYPES.SUBMARINE)
        );
        if (!containsAllTypes) {
            const types = placements.map(placement => placement.type);
            logError(`There should be one of each type of boat! Given ${types.join(', ')}`)
            return false;
        }

        const ships = placements.map(placement => new Ship(placement));

        // Check that all boat tiles are within bounds (0-9 for a 10x10 board)
        for(let ship of ships) {
            if (ship.isOutOfBounds()) {
                logError(`Ship out-of-bounds! Ship: ${ship.toString()}`);
                return false;
            }
        }

        return true;
    }   

    constructor(user1, user2) {
        // keep track of game by usernames
        // to allow for later quick-connect feature
        this.id = `game:${user1.name}-${user2.name}`;
        this.user1 = { 
            name: user1.name, 
            socketId: user1.socketId,
            callbacks: {
                turnBegin: null,
                waitBegin: null,
            },
            board: {
                ships: [],
            },
            ready:false
        };
        this.user2 = { 
            name: user2.name, 
            socketId: user2.socketId,
            callbacks: {
                turnBegin: null,
                waitBegin: null,
            },
            board: {
                ships: [],
            },
            ready:false
        }
        
        this.currentPlayerSocketId = user1.socketId; 
        this.gameState = "placing";
        this.winner = null;
        this.minefield = new Minefield(NUM_OF_MINES);

        console.log(`Starting game ${this.id} between ${user1.name} and ${user2.name}`);
        games.set(this.id, this);

    }

    delete() {
        console.log(`Deleting game ${this.id}`);
        games.delete(this.id);
    }

    userDisconnected(username, socketId) {
        console.log(`${username} disconnecting from ${this.id}.`);

        // LATER: give 5-30s for user to reconnect incase accidental disconnect
        this.delete();
    }

    getOtherSocketId(currentUserSocketId) {
        if (currentUserSocketId === this.user1.socketId) return this.user2.socketId;
        if (currentUserSocketId === this.user2.socketId) return this.user1.socketId;

        console.error(`Error: Socket ID ${currentUserSocketId} not in game ${this.id}!`);
        console.trace();
        return null;
    }

    checkGameOver() {
        const user1ShipsSunk = this.user1.board.ships.every(ship => ship.isSunk());
        const user2ShipsSunk = this.user2.board.ships.every(ship => ship.isSunk());

        if (user1ShipsSunk && user2ShipsSunk) { // Shouldnt be possible
            this.gameState = "gameDraw";
            this.winner = null;
        } else if (user1ShipsSunk) {
            this.gameState = "gameOver";
            this.winner = this.user2.name;
        } else if (user2ShipsSunk) {
            this.gameState = "gameOver";
            this.winner = this.user1.name;
        }

        return user1ShipsSunk || user2ShipsSunk;
    }

    setupPhase(){
        //Called when a player clicks ready (Clickable after the player places all boats)
        if(this.user1.ready == true && this.user2.ready == true){
            this.minefield.initilizeMines(this.user1.board.ships, this.user2.board.ships);
            this.gameState = "gameLoop";
        }
        return;
    }

    setTurnCallbacks(user, onTurnBegin, onWaitBegin) {
        
    }

    playTurn(user, turn) {

    }

    nextTurn() {

    }
}

module.exports = Game;