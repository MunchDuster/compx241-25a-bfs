const Ship = require('./ship.js');

const games = new Map();
const BOARD_SIZE = 10;

class Game { 
    static getById(id) {
        return games.get(id);
    }

    static isValidPlacements(boats, logError) {
        function tileStr(tile) {
            return `(${tile.x},${tile.y})`;
        }

        // check that placements is an array
        if (!Array.isArray(boats)) {
            logError('Boats is not an array!');
            return false;
        }

        // check that there are the correct number of boats
        const expectedBoatsCount = 5;
        if (boats.length !== expectedBoatsCount) {
            logError(`There should be ${expectedBoatsCount} boats! Given ${boats.length}`);
            return false;
        }

        // check that all boats valid: sizes of 5,4,3,3,2
        const expectedSizes = [5, 4, 3, 3, 2].sort((a,b) => b-a); 
        const actualSizes = boats.map(p => p.tiles.length).sort((a,b) => b-a); // Sort in descending order

        if (JSON.stringify(expectedSizes) !== JSON.stringify(actualSizes)) {
            logError(`Boat sizes are incorrect. Expected: ${expectedSizes.join(',')}. Got: ${actualSizes.join(',')}`);
            return false;
        }

        // Check that all boat tiles are within bounds (0-9 for a 10x10 board)
        for (let i = 0; i < boats.length; i++) {
            const boatPlacement = boats[i];
            for (let t = 0; t < boatPlacement.tileArray.length; t++) {
                const tile = boatPlacement.tileArray[t];
                const isWithinBounds = tile.x < BOARD_SIZE && tile.y < BOARD_SIZE && tile.x >= 0 && tile.y >= 0;
                if (!isWithinBounds) {
                    logError(`Boat tile out-of-bounds! Boat: ${boatPlacement.name || `Boat ${i}`}, Tile: ${tileStr(tile)}`);
                    return false;
                }
            }
        }

        // Check that boat tiles are consecutive (boat is not disjoint)
        // This also implicitly checks if a boat is straight (horizontal or vertical)
        for (let i = 0; i < placements.length; i++) {
            const boatPlacement = placements[i];
            const tiles = boatPlacement.tiles;

            if (tiles.length < 2) {
                logError(`Boat is less than two tiles big! Boat: ${boatPlacement.name || `Boat ${i}`}`);
                return false;
            }

            const isHorizontal = tiles[0].y === tiles[1].y;
            const isVertical = tiles[0].x === tiles[1].x;

            for (let t = 1; t < tiles.length; t++) {
                const prevTile = tiles[t-1];
                const currentTile = tiles[t];
                let expectedX = prevTile.x;
                let expectedY = prevTile.y;

                if (isHorizontal) {
                    expectedX = prevTile.x + (currentTile.x > prevTile.x ? 1 : -1);
                } else { // isVertical
                    expectedY = prevTile.y + (currentTile.y > prevTile.y ? 1 : -1);
                }

                const diffX = Math.abs(currentTile.x - prevTile.x);
                const diffY = Math.abs(currentTile.y - prevTile.y);

                if (!((isHorizontal && diffX === 1 && diffY === 0) || (isVertical && diffX === 0 && diffY === 1))) {
                     logError(`Boat contains non-consecutive tiles! Boat: ${boatPlacement.name || `Boat ${i}`}, between ${tileStr(prevTile)} and ${tileStr(currentTile)}`);
                     return false;
                }
            }

            // Check that no boats intersect (no tile is the same position as any other tile)
            const allOccupiedTiles = new Set();
            for (let i = 0; i < placements.length; i++) {
                const boatPlacement = placements[i];
                for (let t = 0; t < boatPlacement.tiles.length; t++) {
                    const tile = boatPlacement.tiles[t];
                    const tileString = tileStr(tile);
                    if (allOccupiedTiles.has(tileString)) {
                        logError(`Boat tiles overlap! Boat: ${boatPlacement.name || `Boat ${i}`}, overlapping tile: ${tileString}`);
                        return false;
                    }
                    allOccupiedTiles.add(tileString);
                }
            }

            return true;
        }
    }   

    constructor(user1, user2) {
        // keep track of game by usernames
        // to allow for later quick-connect feature
        this.id = `game:${user1.name}-${user2.name}`;
        this.user1 = { 
            name: user1.name, 
            socketId: user1.socketId,
            board: {
                ships: [],
            }
        };
        this.user2 = { 
            name: user2.name, 
            socketId: user2.socketId,
            board: {
                ships: [],
            }
        }
        
        this.currentPlayerSocketId = user1.socketId; 
        this.gameState = "placing";
        this.winner = null;

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
}

module.exports = Game;