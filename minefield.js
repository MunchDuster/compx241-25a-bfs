const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;
const NUM_OF_MINES = 20;

class Minefield {
    constructor(user1Ships, user2Ships) {
        this.NUM_OF_MINES= NUM_OF_MINES;
        this.mineArray = [BOARD_HEIGHT * BOARD_WIDTH];
        this.mineArray.fill(false);
        this.initializeMines(user1Ships, user2Ships);
        console.log('Initial Minefield Layout:');
        this.printMineField();
        // this.debugShowMines();
    }

    initializeMines(user1Ships, user2Ships) {
        let availableTiles = this.getInitialAvailableTiles();
        availableTiles = this.removeShipTiles(availableTiles, user1Ships);
        availableTiles = this.removeShipTiles(availableTiles, user2Ships);
        this.placeMinesRandomly(availableTiles);
    }

    // For Debug purposes, remove later in final game
    printMineField() {
        process.stdout.write('   ');
        for (let x = 0; x < BOARD_WIDTH; x++) {
            process.stdout.write(` ${x} `);
        }
        process.stdout.write('\n');

        // Print separator line
        process.stdout.write('   '); 
        process.stdout.write('-'.repeat(BOARD_WIDTH * 3));
        process.stdout.write('\n');

        // Print rows with labels
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            process.stdout.write(` ${String.fromCharCode(65 + y)} |`);
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const index = (y * 10) + x;
                process.stdout.write(this.mineArray[index] ? ' M ' : ' · ');
            }
            process.stdout.write('\n');
        }
        process.stdout.write('\n');
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
        if (availableTiles == null) {
            console.error('available tiles array null!');
            return;
        }
        for (let ship of userShips) {
            for (let tile of ship.tiles) {
                for (let i = 0; i < availableTiles.length; i++) {
                    const availableTile = availableTiles[i];
                    if (availableTile.x != tile.x || availableTile.y != tile.y) {
                        continue;
                    }
                    availableTiles.splice(i, 1);
                    break;
                }
            }
        }
        return availableTiles;
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
    debugShowMines() {
        const GRID_SIZE = 10;
        let str = 'MINEFIELD: \n';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                str += this.mineArray[x + y * 10] === true ? '#' : '~';
            }
            str += '\n';
        }
        console.log(str);
    }

    placeMine({x, y}){
        const index = (y * 10) + x;
        this.mineArray[index] = true;
    }
    
    isMissileHit(x, y) {
        const mineIndex = (y * 10) + x;
        const wasHit = this.mineArray[mineIndex] === true;
        if (wasHit) {
            this.mineArray[mineIndex] = false;
        }
        return wasHit;
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

module.exports = Minefield;