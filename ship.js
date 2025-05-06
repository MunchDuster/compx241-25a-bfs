/**
 *  this script handles all scripts/data of Ships ingame.
 *  I believe this will be bounded to one user. Meaning for each user gets one ship.js
 *  But I have no idea.
 * */ 
const userShips = new Map();

function Ship(type,centreTile) {
    this.type = type; //Is Ship a battleship,cruiser,carrier,destroyer, or submarine
    this.centreTile = centreTile; //Middle position of Ship (Anchored Mouse Position). centreTile = {x : 0, y: 0}
    this.numOfTiles = null; //Total amount of tiles it will occupy
    this.tileArray = null; //All detailed positions of Tiles it occupies

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

    this.toString = function() {
        return (this.type ?? '[no_shipType]') + '@' + this.centreTile.x + this.centreTile.y;
    };

    userShips.set(this.tileArray, this.type);
}

Ship.getTilePositions = function() {
    for([tileArray, type] of userShips) {
        if(tileArray == this.tileArray) {
            return this.tileArray;
        }
    }
    return null; //Not found.
}

Ship.getCentreTile = function() {
    for([tileArray, type] of userShips) {
        if(tileArray == this.tileArray && type == this.type) {
            switch(this.numOfTiles){
                case 5:
                    return tileArray[2];
                case 4:
                case 3:
                    return tileArray[1]
                case 2:
                    return tileArray[0]
            }
        }
    }
    return null; //Not found.
}

module.exports = Ship;