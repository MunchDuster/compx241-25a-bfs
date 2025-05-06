/**
 *  this script handles all scripts/data of Ships ingame.
 *  I believe this will be bounded to one user. Meaning for each user gets one ship.js
 *  But I have no idea.
 * */ 
const userShips = new Map();

function Ship(type,centreTile) {
    this.type = type; //Is Ship a battleship,cruiser,carrier,destroyer, or submarine
    this.centreTile = centreTile; //Middle position of Ship (Anchored Mouse Position).
    this.numOfTiles = null; //Total amount of tiles it will occupy
    this.tileArray = null; //All detailed positions of Tiles it occupies

    this.numOfTiles = function() {
        switch(this.type) {
            case carrier:
                this.numOfTiles = 5
                break;
            case battleship:
                this.numOfTiles = 4
                break;
            case cruiser:
                this.numOfTiles = 3
                break;
            case submarine:
                this.numOfTiles = 3
                break;
            case destroyer:
                this.numOfTiles = 2
                break;
            default:
                console.error('Different Case found for this.numOfTiles in ship.js');
                
        }
        this.tileArray = new Array(this.numOfTiles);
    };

    this.toString = function() {
        return (this.type ?? '[no_shipType]') + '@' + this.centreTile.x + this.centreTile.y;
    };

    userShips.set(type, centreTile);
}

module.exports = Ship;