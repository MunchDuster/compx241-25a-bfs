let stage;
let layer;

const width = 1000;
const height = 500;
console.log(width + ' ' + height);
const gridSize = 10; // same as normal battleships
const offset = 4; //offset for tiles to get grid lines inbetween tiles for aesthetics.
const size = Math.round(height / gridSize) - offset * 2;
const tiles = [];

const deltaYPos = height / (gridSize + 1); // + 1 for gap-to-edge, + 1 for side gaps
const deltaXPos = Math.min(height / (gridSize + 1), deltaYPos); 

console.log(deltaXPos + ' ' + deltaYPos);

function startDrawing() {
    console.log('Starting to draw game board...');
	stage = new Konva.Stage({
		container: 'game-board',
		width: 1000,
		height: 500
	});
	layer = new Konva.Layer();
	stage.add(layer);
    draw();
}

function draw() {
    console.log('Drawing tiles...');
    clear();
    makeTiles(0, 1);
    makeTiles(width/2, 2);
    console.log(`Created ${tiles.length} tiles`);
}


function clear() {
    tiles.length = 0;
    layer.destroyChildren();
}

function makeTiles(offsetX, gridNum) { 
	// (x,y) is a tile on the grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
			// (xPos, yPos) is the position on the game board
            const xPos = getGridStartXPos(x) + offsetX + offset;
            const yPos = getGridStartYPos(y) + offset;

            // Log positions to check for overlaps
            console.log(`Tile (${x}, ${y}, ${gridNum}) at position (${xPos}, ${yPos})`);

            const tile = new Konva.Rect({
                x: xPos,
                y: yPos,
                width: size,
                height: size,
                fill: '#5F85B5',
                stroke: '#234668',
                strokeWidth: 1,
                id: `${x}-${y}-${gridNum}`,
            });

            tile.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
                this.stroke('#4CAF50');
            });

            tile.on('mouseout', function() {
                document.body.style.cursor = 'default';
                this.stroke('#234668');
            });

            tile.on('click', function(e) {
                e.cancelBubble = true;
                this.fill(this.fill() === '#5F85B5' ? '#4CAF50' : '#5F85B5');
            });

            tiles.push(tile);
            layer.add(tile);
        }     
    }
}

function startPlacingShips() {
    console.log('Adding Ships...');
	layer = new Konva.Layer();
	stage.add(layer);
    addShips();
}

const shipTypes = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];

function addShips() {

    for (let i = 0; i < shipTypes.length; i++) { //repeat for all ship types

        //get ship sizes for referencing img sizes
        let size = 0;
        switch(shipTypes[i]) {
            case 'carrier':
                size = 5;
                break;
            case 'battleship':
                size = 4;
                break;
            case 'crusier':
            case 'submarine':
                size = 3;
                break;
            case 'destroyer':
                size = 2;
                break;
            default:
                size = 0;
        }

        const shipImg = new Image();
        shipImg.onload = function () {
            const ship = new Konva.Image({
                x: 500,
                y: i * 10,
                image: shipImg,
                width: 50,
                height: 50 * size
            });

            layer.add(ship);

             ship.on('click', function(e) {
                this.opacity(0.5); //set the opacity of the ship to 50% when clicked on
            });

        };
       
        let shipPath = `../assets/${shipTypes[i]}.png`; //set ship image to correct ship
        shipImg.src = shipPath;
    }  
}    

function getGridStartXPos(x) {
    return Math.round((deltaXPos / 2.0) + x * deltaXPos);
}

function getGridStartYPos(y) {
    return Math.round((deltaYPos / 2.0) + y * deltaYPos);
}

window.startDrawing = startDrawing;
window.clear = clear;
window.startPlacingShips = startPlacingShips;