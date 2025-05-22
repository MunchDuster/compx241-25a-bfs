const SHIP_TYPES = {
    BATTLESHIP: 'battleship',
    CRUISER: 'cruiser',
    CARRIER: 'carrier',
    DESTROYER: 'destroyer',
    SUBMARINE: 'submarine'
};
// const MOVEMENT_RADIUS = 3; // The maximum distance a ship can move in one turn

let nextId = 0;

class Ship {
    constructor({type, centreTile, rotation}) {
        this.id = nextId++; // Unique Identifier
        this.type = type; // Ship type
        this.centreTile = centreTile; // Middle position {x: 0, y: 0}
        this.rotation = rotation; // Tracks number of rotations
        this.length = null; // Will be set based on type
        this.hitArray = []; // Will be initialized based on length
        this.tiles = null; // Will be set based on rotation and length
       
        switch(this.type) {
            case SHIP_TYPES.CARRIER:
                this.length = 5;
                break;
            case SHIP_TYPES.BATTLESHIP:
                this.length = 4;
                break;
            case SHIP_TYPES.CRUISER:
            case SHIP_TYPES.SUBMARINE:
                this.length = 3;
                break;
            case SHIP_TYPES.DESTROYER:
                this.length = 2;
                break;
            default:
                console.error(`Invalid ship type: ${this.type}`);
        }

        this.hitArray = new Array(this.length).fill(0);
        this.updateTilePositions();
    }
    
    receiveHit(x, y) {
        // Find which tile position was hit
        const hitIndex = this.tiles.findIndex(tile => tile.x === x && tile.y === y);
        
        if (hitIndex !== -1) {
            this.hitArray[hitIndex] = 1;
            return true;
        }
        return false;
    }

    isHitAt(index) {
        return this.hitArray[index] === 1;
    }

    isSunk() {
        return this.hitArray.every(hit => hit === 1);
    }

    updateTilePositions() {
        this.tiles = this.getTiles(this.centreTile);
    }

    rotate() {
        const oldRotation = this.rotation;
        if (this.isValidMove(this.centreTile)) {
            this.rotation = (this.rotation + 1) % 4;
            this.updateTilePositions();
        }
        else {
            console.error(`Invalid rotation: Rotation moves out of bounds, ${this.rotation} -> ${oldRotation}`);
        }
    }

    toString() {
        return `${this.id}|${this.type} @ (${this.centreTile.x}, ${this.centreTile.y}) rot ${this.rotation}`;
    }

    move(direction) {
        this.centreTile = this.getMovedCenter(direction);
        this.updateTilePositions();
    }

    canMove() {
        return this.hitArray.every(hit => hit === 0);
    }

    isValidMove(direction, gridSize = 10) {
        if(!this.canMove()) {
            return { valid: false, reason: 'Ship is damaged and cannot move' };
        }

        // does direction exist?
        if (direction < 0 || direction > 3) {
            return {valid: false, reason: 'invalid direction'};
        }

        // checks moving along correct axis
        const isVertical = this.rotation % 2 == 0;
        const movingVertical = direction % 2 == 0;
        if (isVertical ^ movingVertical) {
            return {valid: false, reason: 'cant move ' + this.toString() + ' in direction ' + direction};
        }
            
        // const deltaX = Math.abs(newCentreTile.x - this.centreTile.x);
        // const deltaY = Math.abs(newCentreTile.y - this.centreTile.y);
        // if (deltaX > MOVEMENT_RADIUS || deltaY > MOVEMENT_RADIUS) {
        //     return { valid: false, reason: 'Move exceeds maximum movement radius' };
        // }

        const centre = this.getMovedCenter(direction);
        const newTiles = this.getTiles(centre);
        if (this.wouldBeOutOfBounds(newTiles, gridSize)) {
            return { valid: false, reason: 'Move is out of bounds' };
        }

        return { valid: true };
    }
    getMovedCenter(direction) {
        switch (direction) {
            case 0: 
            return {x: this.centreTile, y: this.centreTile + 1};
            case 1: 
            return {x: this.centreTile + 1, y: this.centreTile};
            case 2: 
            return {x: this.centreTile, y: this.centreTile - 1};
            case 3: 
            return {x: this.centreTile - 1, y: this.centreTile};
        }
    }
    getTiles(newCentreTile) {
        const halfLength = this.length % 2 == 0 ? this.length / 2 - 1: (this.length - 1) / 2;
        let tiles = [];

        switch(this.rotation % 4) {
            case 0: // Upwards
                for (let i = 0; i < this.length; i++) {
                    tiles.push({ x: newCentreTile.x, y: newCentreTile.y - (i - halfLength) });
                }
                break;
            case 1: // Rightwards
                for (let i = 0; i < this.length; i++) {
                    tiles.push({ x: newCentreTile.x + (i - halfLength), y: newCentreTile.y });
                }
                break;
            case 2: // Downwards
                for (let i = 0; i < this.length; i++) {
                    tiles.push({ x: newCentreTile.x, y: newCentreTile.y + (i - halfLength) });
                }
                break;
            case 3: // Leftwards
                for (let i = 0; i < this.length; i++) {
                    tiles.push({ x: newCentreTile.x - (i - halfLength), y: newCentreTile.y });
                }
                break;
        }

        return tiles;
    }
    isHit(x, y) {
        return this.tiles.some(tile => tile.x == x & tile.y == y);
    }

    isOutOfBounds() {
        return this.wouldBeOutOfBounds(this.tiles);
    }
    wouldBeOutOfBounds(tiles, gridSize = 10) {
        return tiles.some(tile => tile.x < 0 || tile.x >= gridSize || tile.y < 0 || tile.y >= gridSize);
    }
}

module.exports = {Ship, SHIP_TYPES};