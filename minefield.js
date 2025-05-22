const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;
const NUM_OF_MINES = 10;

class Minefield {
    constructor(user1Ships, user2Ships) {
        this.NUM_OF_MINES= NUM_OF_MINES;
        this.mineArray = [BOARD_HEIGHT*BOARD_WIDTH];
        this.mineArray.fill(false);

        const availableTiles = []; // const pointer to array
        const gridSize = 10;
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                availableTiles.push({x: x, y: y});
            }
        }

        function removeAvailableTiles(userShips) {
            for (let ship of userShips) {
                for (let tile of ship.tiles) {
                    const index = availableTiles.indexOf(tile);
                    if(index != -1) {
                        availableTiles.splice(index, 1);
                    }
                }
            }
        }
        function randomInt(min, max) {
            return Math.floor((max - min) * Math.random() + min);
        }

        removeAvailableTiles(user1Ships);
        removeAvailableTiles(user2Ships);

        for(let i = 0; i < this.NUM_OF_MINES; i++) {
            const index = randomInt(0, availableTiles.length);
            const tile = availableTiles[index];
            this.placeMine(tile);
            availableTiles.splice(index, 1);
        }
    }

    placeMine({x, y}){
        const index = (y * 10) + x;
        this.mineArray[index] = true;
    }
    
    isMissileHit(x, y) {
        if(this.mineArray[y*10+x] == true){
            this.mineArray[y*10+x] = false;
            return true;
        }
        return false;
    }

    receiveReconHit(x, y) { 
        minecount = 0;   

        //Turn x and y into the top left corner of 3x3 grid
        x--;
        y--;

        for(i = 0; i < 3; i++){
            if(y >= 0 && y<10){
                for(j = 0; j < 3; j++){
                    if(x >= 0 && x<10){
                        if(this.mineArray[y*10+x] == true){
                            minecount++;
                        }
                    }
                    x++;
                }
            }
            y++;
        }
        return minecount;
    }
}

module.exports = Minefield;