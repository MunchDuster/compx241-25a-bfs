const SHIP_TYPES = {
    BATTLESHIP: 'battleship',
    CRUISER: 'cruiser',
    CARRIER: 'carrier',
    DESTROYER: 'destroyer',
    SUBMARINE: 'submarine'
};
const MOVEMENT_RADIUS = 3; // The maximum distance a ship can move in one turn

class Ship {
    constructor(id, type, centreTile) {
        this.id = id; // Unique Identifier
        this.type = type; // Ship type
        this.centreTile = centreTile; // Middle position {x: 0, y: 0}
        this.rotation = 0; // Tracks number of rotations
        this.length = null; // Will be set based on type
        this.hitArray = []; // Will be initialized based on length
        this.tileArray = null; // Will be set based on rotation and length
       
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
        const hitIndex = this.tileArray.findIndex(tile => tile.x === x && tile.y === y);
        
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
        const {x: centreX, y: centreY} = this.centreTile;
        
        switch(this.rotation % 4) {
            case 0: // Rightwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: centreX + (i - halfLength), y: centreY });
                }
                break;
            case 1: // Downwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: centreX, y: centreY + (i - halfLength) });
                }
                break;
            case 2: // Leftwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: centreX - (i - halfLength), y: centreY });
                }
                break;
            case 3: // Upwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: centreX, y: centreY - (i - halfLength) });
                }
                break;
        }
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
        return `${this.type}@${this.centreTile.x}, ${this.centreTile.y}`;
    }

    move(newCentreTile, gridSize = 10) {
        const moveCheck = this.isValidMove(newCentreTile, gridSize);
        if (!moveCheck.valid) {
            console.error(`Invalid move: ${moveCheck.reason}`);
            return;
        }

        this.centreTile = newCentreTile;
        this.updateTilePositions();
    }

    canMove() {
        return this.hitArray.every(hit => hit === 0);
    }

    isValidMove(newCentreTile, gridSize = 10) {
        if(!this.canMove()) {
            return { valid: false, reason: 'Ship is damaged and cannot move' };
        }

        const deltaX = Math.abs(newCentreTile.x - this.centreTile.x);
        const deltaY = Math.abs(newCentreTile.y - this.centreTile.y);
        if (deltaX > MOVEMENT_RADIUS || deltaY > MOVEMENT_RADIUS) {
            return { valid: false, reason: 'Move exceeds maximum movement radius' };
        }

        const newTiles = this.getNewTilePositions(newCentreTile);
        if (this.isOutOfBounds(newTiles, gridSize)) {
            return { valid: false, reason: 'Move is out of bounds' };
        }

        return { valid: true};
    }

    getNewTilePositions(newCentreTile) {
        const halfLength = Math.floor(this.length / 2);
        let newTiles = [];

        switch(this.rotation % 4) {
            case 0: // Rightwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: newCentreTile.x + (i - halfLength), y: newCentreTile.y });
                }
                break;
            case 1: // Downwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: newCentreTile.x, y: newCentreTile.y + (i - halfLength) });
                }
                break;
            case 2: // Leftwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: newCentreTile.x - (i - halfLength), y: newCentreTile.y });
                }
                break;
            case 3: // Upwards
                for (let i = 0; i < this.length; i++) {
                    newTiles.push({ x: newCentreTile.x, y: newCentreTile.y - (i - halfLength) });
                }
                break;
        }

        return newTiles;
    }

    isOutOfBounds(newTiles, gridSize = 10) {
        return newTiles.some(tile => tile.x < 0 || tile.x >= gridSize || tile.y < 0 || tile.y >= gridSize);
    }
}

export default Ship;