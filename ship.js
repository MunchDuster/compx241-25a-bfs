const SHIP_TYPES = {
    BATTLESHIP: 'battleship',
    CRUISER: 'cruiser',
    CARRIER: 'carrier',
    DESTROYER: 'destroyer',
    SUBMARINE: 'submarine'
};

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

    move(newCentreTile) {
        this.centreTile = newCentreTile;
        this.updateTilePositions();
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
        this.rotation = (this.rotation + 1) % 4;
        this.updateTilePositions();
    }

    toString() {
        return `${this.type}@${this.centreTile.x}${this.centreTile.y}`;
    }
}

export default Ship;