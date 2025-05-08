const SHIP_TYPES = {
    BATTLESHIP: 'battleship',
    CRUISER: 'cruiser',
    CARRIER: 'carrier',
    DESTROYER: 'destroyer',
    SUBMARINE: 'submarine'
};
function Ship(id, type, centreTile) {
    this.id = id; //Unique Identifier for Map(). I imagine along the lines of "username_shiptype_num".
    this.type = type; //Is Ship a battleship,cruiser,carrier,destroyer, or submarine.
    this.centreTile = centreTile; //Middle position of Ship (Anchored Mouse Position). E.g. centreTile = {x : 0, y: 0}.
    this.length = null; // The length of the ship
    this.tileArray = null; //All detailed positions of Tiles it occupies.
    this.rotation = 0; //Tracks number of rotations on ship, See rotate function for how its used.
    this.hitArray = [] // Array of 0s and 1s indicating if a segment of the ship has been hit or not.

    switch(this.type) {
        case SHIP_TYPES.CARRIER:
            this.length = 5;
            this.hitArray = new Array(5).fill(0);
            break;
        case SHIP_TYPES.BATTLESHIP:
            this.length = 4;
            this.hitArray = new Array(4).fill(0);
            break;
        case SHIP_TYPES.CRUISER:
        case SHIP_TYPES.SUBMARINE:
            this.length = 3;
            this.hitArray = new Array(3).fill(0);
            break;
        case SHIP_TYPES.DESTROYER:
            this.length = 2;
            this.hitArray = new Array(2).fill(0);
            break;
        default:
            throw new Error(`Invalid ship type: ${this.type}`);
    }
}

Ship.prototype.receiveHit = function(x, y) {
    // Find which tile position was hit
    const hitIndex = this.tileArray.findIndex(tile => tile.x === x && tile.y === y
    );
    
    if (hitIndex !== -1) {
        this.hitArray[hitIndex] = 1;
        return true;
    }
    return false;
};

Ship.prototype.isHitAt = function(index) {
    return this.hitArray[index] === 1;
};

Ship.prototype.isSunk = function() {
    return this.hitArray.every(hit => hit === 1);
};

Ship.prototype.move = function(newCentreTile) {
    this.centreTile = newCentreTile;
    this.updateTilePositions();
};

Ship.prototype.updateTilePositions = function() {
    const {x: centreX, y: centreY} = this.centreTile;
    
    switch(this.rotation % 4) {
        case 0:
            this.tileArray = Array.from({length: this.numOfTiles}, 
                (_, i) => ({x: centreX + (i - Math.floor(this.numOfTiles/2)), y: centreY}));
            break;
        case 1:
            this.tileArray = Array.from({length: this.numOfTiles}, 
                (_, i) => ({x: centreX, y: centreY + (i - Math.floor(this.numOfTiles/2))}));
            break;
        case 2:
            this.tileArray = Array.from({length: this.numOfTiles}, 
                (_, i) => ({x: centreX - (i - Math.floor(this.numOfTiles/2)), y: centreY}));
            break;
        case 3:
            this.tileArray = Array.from({length: this.numOfTiles}, 
                (_, i) => ({x: centreX, y: centreY - (i - Math.floor(this.numOfTiles/2))}));
            break;
    }
};

Ship.prototype.rotate = function() {
    this.rotation = (this.rotation + 1) % 4;
    this.updateTilePositions();
};

Ship.prototype.toString = function() {
    return this.type + '@' + this.centreTile.x + this.centreTile.y;
};

module.exports = Ship;