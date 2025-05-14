const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;

class Minefield {
    constructor(id) {
        this.id = id;
        this.mineArray = [BOARD_HEIGHT*BOARD_WIDTH];

        this.initilizeMineField();
    }

    initilizeMineField() {
        //for(i = 0; i < BOARD_HEIGHT*BOARD_WIDTH; i++){
            //x = i % 10;
            //y = i-x;
            //this.mineArray[i] = false;
        //}
        this.mineArray.fill(false);
    }

    placeMine(x,y){
        index = (y*10)+x;
        this.mineArray[index] = true;
    }
    
    receiveMissileHit(x, y) {    
        if(this.mineArray[y*10+x] == true){
            this.mineArray[y*10+x] = false;
            return true;
        }
        return false;
    }
}

module.exports = Minefield;