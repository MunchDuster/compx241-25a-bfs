const {Ship, SHIP_TYPES} = require('./ship.js');
const Minefield = require('./minefield.js');

const games = new Map();
const BOARD_SIZE = 10;

const TURN_TYPE = {
    Missile: 'missile',
    Recon: 'recon-missile',
    Move: 'move'
}

class Game { 
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
            ships: [],
            ready:false
        };
        this.user2 = { 
            name: user2.name, 
            socketId: user2.socketId,
            callbacks: {
                turnBegin: null,
                waitBegin: null,
            },
            ships: [],
            ready:false
        }
        
        this.isUser1sTurn = true; 
        this.gameState = "placing";
        this.winner = null;
        this.minefield = null;

        console.log(`created game ${this.id} between ${user1.name} and ${user2.name}`);
        games.set(this.id, this);
    }

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
                logError(`Ship out-of-bounds! Ship: ${ship.toString()}\nwith tiles ${JSON.stringify(ship.getTiles(ship.centreTile))}`);
                return false;
            }
        }

        return true;
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
        const user1ShipsSunk = this.user1.ships.every(ship => ship.isSunk());
        const user2ShipsSunk = this.user2.ships.every(ship => ship.isSunk());

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
    getUser1ShipsSunk() {
        return this.user1.ships.filter(ship => ship.isSunk()).length;
    }
    getUser2ShipsSunk() {
        return this.user2.ships.filter(ship => ship.isSunk()).length;
    }
    setUserBoatPlacements(user, placements) {
        const ships = placements.map(placement => new Ship(placement));
        const userX = user.socketId == this.user1.socketId ? this.user1 : this.user2;
        userX.ships = ships;
        userX.ready = true;
        //this.printShipPlacements(userX); // Uncomment to print ship placements to console for debugging
    }

    startGame(){
        //Called when a player clicks ready (Clickable after the player places all boats)
        if(this.user1.ready == true && this.user2.ready == true){
            this.minefield = new Minefield(this.user1.ships, this.user2.ships);
            this.gameState = "mainGame";
            
            this.isUser1sTurn = false;
            this.nextTurn();
        }
        return;
    }

    setTurnCallbacks(user, onTurnBegin, onWaitBegin) {
        const userInGame = (user.socketId === this.user1.socketId) ? this.user1 : this.user2;

        if (userInGame) {
            userInGame.callbacks.turnBegin = onTurnBegin;
            userInGame.callbacks.waitBegin = onWaitBegin;
            console.log(`Callbacks set for ${userInGame.name}. Has turnBegin: ${!!onTurnBegin}, Has waitBegin: ${!!onWaitBegin}`);
        } else {
            console.error(`Error: Could not find user in game to set callbacks for socketId: ${user.socketId}`);
        }
    }

    playTurn(user, turn) { // returns {success, result}
        const isUser1MakingTurn = user.socketId == this.user1.socketId;
        
        //check correct user
        if (this.isUser1sTurn != isUser1MakingTurn) {
            return {success: false, result: 'not your turn!'};
        }
        
        //make turn with users ships
        const currentUser = isUser1MakingTurn ? this.user1 : this.user2;
        const opponentUser = isUser1MakingTurn ? this.user2 : this.user1;

        switch (turn.type) {
            case TURN_TYPE.Missile:
                const x = turn.targetTile.x;
                const y = turn.targetTile.y;

                if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
                    return {
                        success: false,
                        result: 'Invalid X or Y Coordinate on Turn. X: ' + x + ' Y: ' + y
                    };
                }

                const isMineHit = this.minefield.isMissileHit(x, y);
                console.log(`${currentUser.name} hit mine at ${x}, ${y}?: ${isMineHit}`);
                let shipHit = null;
                let collateralDamage = [];

                for (const ship of opponentUser.ships) {
                    if (ship.isHit(x, y)) {
                        ship.hit(x, y);
                        shipHit = ship;
                        break;
                    }
                }

                if (isMineHit) {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const xCheck = x + dx;
                            const yCheck = y + dy;

                            if (xCheck < 0 || xCheck >= BOARD_SIZE || yCheck < 0 || yCheck >= BOARD_SIZE) {
                                continue;
                            }

                            for (const ship of currentUser.ships) {
                                if (ship.isHit(xCheck, yCheck)) {
                                    ship.hit(xCheck, yCheck);
                                    collateralDamage.push({
                                        type: ship.type,
                                        tile: {x: xCheck, y: yCheck}
                                    });
                                }
                            }
                        }
                    }
                }

                return {
                    success: true,
                    result: {
                        shipHit: shipHit != null,
                        tile: turn.targetTile,
                        ship: shipHit?.type,
                        mineHit: isMineHit,
                        collateralDamage: collateralDamage
                    },
                };
            case TURN_TYPE.Recon:
                //Check tile input is correct
                const reconX = turn.targetTile.x;
                const reconY = turn.targetTile.y;
                
                if (reconX < 0 || reconX >= BOARD_SIZE || reconY < 0 || reconY >= BOARD_SIZE) {
                    return {
                        success: false,
                        result: 'Invalid X or Y Coordinate on Turn. X: ' + x + ' Y: ' + y
                    };
                }

                const mineCount = this.minefield.receiveReconHit(reconX, reconY);

                return {
                    success: true,
                    result: {
                        mineCount: mineCount,
                    }
                };
            case TURN_TYPE.Move:
                const shipToMove = currentUser.ships.find(ship => ship.type == turn.ship);

                if (!shipToMove) {
                    return {
                        success: false,
                        result: 'Ship not found!😔'
                    };
                }
                
                if (!Number.isInteger(turn.direction)) {
                    return {
                        success: false,
                        result: 'no direction set or not integer'
                    }
                }
                const {valid, reason} = shipToMove.isValidMove(turn.direction, BOARD_SIZE);

                if (valid) {
                    shipToMove.move(turn.direction);
                    return {
                        success: true,
                        result: {
                            ship: shipToMove.type,
                            centreTile: shipToMove.centreTile
                        }
                    };
                }

                return {
                    success: false,
                    result: reason
                };
            default:
                return {success: false, result: 'unrecognised turn type!'};
        }
    }

    nextTurn() {
        this.isUser1sTurn = !this.isUser1sTurn;
        if (this.isUser1sTurn) {
            this.user1.callbacks.turnBegin();
            this.user2.callbacks.waitBegin();
        }
        else {
            this.user2.callbacks.turnBegin();
            this.user1.callbacks.waitBegin();
        }
    }

    printShipPlacements(user) {
        const ships = user.ships;
        const board = new Array(BOARD_SIZE * BOARD_SIZE).fill('·');
        
        // Fill board with ship markers
        for (const ship of ships) {
            for (const tile of ship.tiles) {
                const index = (tile.y * BOARD_SIZE) + tile.x;
                let marker;
                switch(ship.type) {
                    case SHIP_TYPES.BATTLESHIP: marker = 'B'; break;
                    case SHIP_TYPES.CARRIER: marker = 'A'; break;
                    case SHIP_TYPES.CRUISER: marker = 'U'; break;
                    case SHIP_TYPES.DESTROYER: marker = 'D'; break;
                    case SHIP_TYPES.SUBMARINE: marker = 'S'; break;
                }
                board[index] = marker;
            }
        }

        // Print board header
        console.log(`\n${user.name}'s Ship Placements:`);
        process.stdout.write('   ');
        for (let x = 0; x < BOARD_SIZE; x++) {
            process.stdout.write(` ${x} `);
        }
        process.stdout.write('\n   ');
        process.stdout.write('-'.repeat(BOARD_SIZE * 3));
        process.stdout.write('\n');

        // Print board with ships
        for (let y = 0; y < BOARD_SIZE; y++) {
            process.stdout.write(` ${String.fromCharCode(65 + y)} |`);
            for (let x = 0; x < BOARD_SIZE; x++) {
                const index = (y * BOARD_SIZE) + x;
                process.stdout.write(` ${board[index]} `);
            }
            process.stdout.write('\n');
        }
        process.stdout.write('\n');
    }
}

module.exports = Game;