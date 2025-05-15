const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;


class Minefield {
    constructor(NUM_OF_MINES) {
        const NUM_OF_MINES= NUM_OF_MINES;
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

    initilizeMines(user1Ships, user2Ships) {
        occupiedTiles = [];

        forEach(user1Ships, ship => {
            forEach(ship.tileArray, tile => {
                if(!occupiedTiles.includes(`${tile.x},${tile.y}`)){
                    occupiedTiles.push(`${tile.x},${tile.y}`);
                }
            })
        })

        forEach(user2Ships, ship => {
            forEach(ship.tileArray, tile => {
                if(!occupiedTiles.includes(`${tile.x},${tile.y}`)){
                    occupiedTiles.push(`${tile.x},${tile.y}`);
                }
            })
        })

        mineplaced = 0;
        
        while(mineplaced != NUM_OF_MINES){
            const x = Math.floor(Math.random() * BOARD_SIZE);
            const y = Math.floor(Math.random() * BOARD_SIZE);
            const tileKey = `${x},${y}`;
            if(!occupiedTiles.includes(tileKey)){
                this.placeMine(tile.x, tile.y);
                mineplaced++;
            }
        }
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