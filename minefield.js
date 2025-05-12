const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;

class Minefield {
    constructor(id) {
        this.id = id;
        this.mineArray = [BOARD_HEIGHT*BOARD_WIDTH];

        this.initilizeMineField();
    }

    initilizeMineField() {
        for(i = 0; i < BOARD_HEIGHT*BOARD_WIDTH; i++){
            x = i % 10;
            y = i-x;
            this.mineArray[i] = ({x: x, y: y, isMine: false});
        }
    }

    placeMine(x,y){
        index = (y*10)+x;
        this.mineArray[index] = ({x: x, y: y, isMine: true});
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

module.exports = Minefield;