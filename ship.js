/**
 *  this script handles all scripts/data of Ships ingame.
 *  I believe this will be bounded to one user. Meaning for each user gets one ship.js
 *  But I have no idea.
 * */ 
const userShips = new Map();
const shipTypesArray = ['battleship','cruiser','carrier','destroyer','submarine'];

function Ship(id,type,centreTile) {
    this.id = id; //Unique Identifier for Map(). I imagine along the lines of "username_shiptype_num".
    this.type = type; //Is Ship a battleship,cruiser,carrier,destroyer, or submarine.

    this.centreTile = centreTile; //Middle position of Ship (Anchored Mouse Position). E.g. centreTile = {x : 0, y: 0}.
    this.numOfTiles = null; //Total amount of tiles it will occupy.
    this.tileArray = null; //All detailed positions of Tiles it occupies.
    this.rotation = 0; //Tracks number of rotations on ship, See rotate function for how its used.

    this.toString = function() {
        return (this.type ?? '[no_shipType]') + '@' + this.centreTile.x + this.centreTile.y;
    };

    for([this.id, Ship] of userShips) {
        if(id == this.id) {
            console.error('A Ship ID matches another Ships ID: \"' + this + '\" and \"' + Ship + '\"')
            return;
        }
    }    

    this.numOfTiles = function() {
        switch(this.type) {
            case carrier:
                this.numOfTiles = 5;
                break;
            case battleship:
                this.numOfTiles = 4;
                break;
            case cruiser:
                this.numOfTiles = 3;
                break;
            case submarine:
                this.numOfTiles = 3;
                break;
            case destroyer:
                this.numOfTiles = 2;
                break;
            default:
                console.error('Different Case found for this.numOfTiles in ship.js');
                
        }
        this.tileArray = new Array(this.numOfTiles);
    };

    this.tileArray = function() {
        centreX = centreTile.x;
        centreY = centreTile.y;
        switch(this.numOfTiles) {
            case 5:
                this.tileArray = 
                [{x : centreX-2, y : centreY},{x : centreX-1, y : centreY},
                {x : centreX, y : centreY},
                {x : centreX+1, y : centreY},{x : centreX+2, y : centreY}];
                break;
            case 4:
                this.tileArray = 
                [{x : centreX-1, y : centreY},
                {x : centreX, y : centreY},
                {x : centreX+1, y : centreY},{x : centreX+2, y : centreY}];
                break;
            case 3:
                this.tileArray = 
                [{x : centreX-1, y : centreY},
                {x : centreX, y : centreY},
                {x : centreX+1, y : centreY}];
            case 2:
                this.tileArray = 
                [{x : centreX, y : centreY},{x : centreX+1, y : centreY}];
                break;
            default:
                console.error('Different Case found for this.tileArray in ship.js');
        }
    }

    userShips.set(this.id, this);
}

Ship.getTilePositions = function(id) {
    for(const [id, shipEntry] of userShips) {
        if(id == this.id) {
            return this.tileArray;
        }
    }
    return null; //Not found.
}

Ship.getCentreTile = function(id) {
    for(const [id, shipEntry] of userShips) {
        if(id == this.id) {
            switch(this.numOfTiles){
                case 5:
                    return tileArray[2];
                case 4:
                case 3:
                    return tileArray[1]
                case 2:
                    return tileArray[0]
                default:
                    console.error('Different Case found for Ship.getCentreTile in ship.js');
            }
        }
    }
    return null; //Not found.
}

Ship.rotate = function(id) {
    for(const [id, shipEntry] of userShips) {
        if(id == this.id) {
            this.rotate++;
            centreX = this.centreTile.x;
            centreY = this.centreTile.y;
            
            switch(this.rotate % 4) {
                case 0:
                    switch(this.numOfTiles) {
                        case 5:
                            this.tileArray = 
                            [{x : centreX-2, y : centreY},{x : centreX-1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX+1, y : centreY},{x : centreX+2, y : centreY}];
                            break;
                        case 4:
                            this.tileArray = 
                            [{x : centreX-1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX+1, y : centreY},{x : centreX+2, y : centreY}];
                            break;
                        case 3:
                            this.tileArray = 
                            [{x : centreX-1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX+1, y : centreY}];
                        case 2:
                            this.tileArray = 
                            [{x : centreX, y : centreY},{x : centreX+1, y : centreY}];
                            break;
                        default:
                            console.error('Different Case found for Ship.rotate in ship.js');
                    }
                case 1:
                    switch(this.numOfTiles) {
                        case 5:
                            this.tileArray = 
                            [{x : centreX, y : centreY+2},{x : centreX, y : centreY+1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY-1},{x : centreX, y : centreY-2}];
                            break;
                        case 4:
                            this.tileArray = 
                            [{x : centreX, y : centreY+1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY-1},{x : centreX, y : centreY-2}];
                            break;
                        case 3:
                            this.tileArray = 
                            [{x : centreX, y : centreY+1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY-1}];
                        case 2:
                            this.tileArray = 
                            [{x : centreX, y : centreY},{x : centreX, y : centreY+1}];
                            break;
                        default:
                            console.error('Different Case found for Ship.rotate in ship.js');
                    }
                case 2:
                    switch(this.numOfTiles) {
                        case 5:
                            this.tileArray = 
                            [{x : centreX+2, y : centreY},{x : centreX+1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX-1, y : centreY},{x : centreX-2, y : centreY}];
                            break;
                        case 4:
                            this.tileArray = 
                            [{x : centreX+1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX-1, y : centreY},{x : centreX-2, y : centreY}];
                            break;
                        case 3:
                            this.tileArray = 
                            [{x : centreX+1, y : centreY},
                            {x : centreX, y : centreY},
                            {x : centreX-1, y : centreY}];
                        case 2:
                            this.tileArray = 
                            [{x : centreX, y : centreY},{x : centreX-1, y : centreY}];
                            break;
                        default:
                            console.error('Different Case found for Ship.rotate in ship.js');
                    }
                case 3:
                    switch(this.numOfTiles) {
                        case 5:
                            this.tileArray = 
                            [{x : centreX, y : centreY-2},{x : centreX, y : centreY-1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY+1},{x : centreX, y : centreY+2}];
                            break;
                        case 4:
                            this.tileArray = 
                            [{x : centreX, y : centreY-1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY+1},{x : centreX, y : centreY+2}];
                            break;
                        case 3:
                            this.tileArray = 
                            [{x : centreX, y : centreY-1},
                            {x : centreX, y : centreY},
                            {x : centreX, y : centreY+1}];
                        case 2:
                            this.tileArray = 
                            [{x : centreX, y : centreY},{x : centreX, y : centreY+1}];
                            break;
                        default:
                            console.error('Different Case found for Ship.rotate in ship.js');
                    }
            }
        }
    }
    return null; //Ship not found.
}

module.exports = Ship;