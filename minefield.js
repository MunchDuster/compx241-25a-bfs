
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;

class Minefield {
    constructor(id, type, centreTile) {
        this.id = id;
        this.mineArray = [BOARD_HEIGHT*BOARD_WIDTH];
        this.initilizeMineField();
    }

    initilizeMineField() {
        i = 0;
        mineArray.forEach(element => {
            this.mineArray[i];
        });
    }

    placeMine(x,y){

    }
    
    receiveHit(x, y) {    
        //If it was hit for first time.
        this.mineArray[y*10+x] = { x: x, y: y, isMine: false};
        return true;
        //return false;
    }

    isOutOfBounds(newTiles, gridSize = 10) {
        return newTiles.some(tile => tile.x < 0 || tile.x >= gridSize || tile.y < 0 || tile.y >= gridSize);
    }
}

module.exports = Ship;