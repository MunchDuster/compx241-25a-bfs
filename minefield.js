const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;
const NUM_OF_MINES = 20;

class Minefield {
    constructor(user1Ships, user2Ships) {
        this.NUM_OF_MINES= NUM_OF_MINES;
        this.mineArray = [BOARD_HEIGHT * BOARD_WIDTH];
        this.mineArray.fill(false);
        this.initializeMines(user1Ships, user2Ships);
    }

    initializeMines(user1Ships, user2Ships) {
        const availableTiles = this.getInitialAvailableTiles();
        this.removeShipTiles(availableTiles, user1Ships);
        this.removeShipTiles(availableTiles, user2Ships);
        this.placeMinesRandomly(availableTiles);
    }

    getInitialAvailableTiles() {
        const availableTiles = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                availableTiles.push({x: x, y: y});
            }
        }
        return availableTiles;
    }

    removeShipTiles(availableTiles, userShips) {
        for (let ship of userShips) {
            for (let tile of ship.tiles) {
                const index = availableTiles.indexOf(tile);
                if(index != -1) {
                    availableTiles.splice(index, 1);
                }
            }
        }
    }

    randomInt(min, max) {
        return Math.floor((max - min) * Math.random() + min);
    }

    placeMinesRandomly(availableTiles) {
        for(let i = 0; i < this.NUM_OF_MINES; i++) {
            const index = this.randomInt(0, availableTiles.length);
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
        return this.mineArray[y*10+x] === true;
    }

    receiveReconHit(xCentre, yCentre) {
        //return count of 3x3 grid
        let minecount = 0;

        for(let x = xCentre - 1; x <= xCentre + 1; x++) {
            for(let y = yCentre - 1; y <= yCentre + 1; y++) {
                if(x < 0 || x >= BOARD_WIDTH 
                    || y < 0 || y >= BOARD_HEIGHT
                    || this.mineArray[y*10+x] !== true) {
                    continue;
                }
                minecount++
            }
        }
        return minecount;
    }
}

export default Minefield;