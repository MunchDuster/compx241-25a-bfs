let stage;
let layer;

const width = 1000;
const height = 500;
console.log(width + ' ' + height);
const gridSize = 10; // same as normal battleships
const offset = 4; //offset for tiles to get grid lines inbetween tiles for aesthetics.
const size = Math.round(height / gridSize) - offset * 2;
const tiles = [];

// class Tile {
//     constructor(x, y, id, color) {
//         this.x = x;
//         this.y = y;
//         this.width = 
//         this.height = Math.round(height / gridSize) - offset * 2;
//         this.color = color;
//         this.id = id; //id is x-row, y-row, grid e.g a square in the first row, second column in the grid on the right is 122
//     }

//     draw(ctx) {
//         ctx.fillStyle = this.color;
//         ctx.fillRect(this.x, this.y, this.width, this.height);
//     }
// }


const deltaYPos = height / (gridSize + 1); // + 1 for gap-to-edge, + 1 for side gaps
const deltaXPos = Math.min(height / (gridSize + 1), deltaYPos); 

console.log(deltaXPos + ' ' + deltaYPos);

// (x,y) is a grid point
// (xPos, yPos) is a canvas pixel
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
	layer.draw();
}


function clear() {
	tiles.length = 0;
    layer.destroyChildren();
}

function makeTiles(offsetX, gridNum) { 
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const xPos = getGridStartXPos(x) + offsetX + offset;
            const yPos = getGridStartYPos(y) + offset;
           // tiles.push(new Tile(xPos, yPos, x.toString() + y.toString() + gridNum.toString(), "#5F85B5"));
            
		   	const rect = new Konva.Rect({
                x: xPos,
                y: yPos,
                width: size,
                height: size,
                fill: '#5F85B5',
                stroke: '#234668',
                strokeWidth: 1,
                id: `${x}-${y}-${gridNum}`,
                listening: true,
                perfectDrawEnabled: false
            });

			rect.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
                this.stroke('#4CAF50');
                layer.draw();
            });

			rect.on('mouseout', function() {
                document.body.style.cursor = 'default';
                this.stroke('#234668');
                layer.draw();
            });

            rect.on('click', function(e) {
                e.cancelBubble = true;
                this.fill(this.fill() === '#5F85B5' ? '#4CAF50' : '#5F85B5');
                layer.draw();
            });

            tiles.push(rect);
            layer.add(rect);
        }     
    }
}

// rounding and add 0.51 makes lines crisper, because yes
function getGridStartXPos(x) {
    return Math.round((deltaXPos / 2.0) + x * deltaXPos);
}
function getGridStartYPos(y) {
    return Math.round((deltaYPos / 2.0) + y * deltaYPos);
}
function getGridPos({x, y}) {
    return {x: getGridStartXPos(x), y: getGridStartYPos(y)};
}

// startDrawing(); // for debugging

window.startDrawing = startDrawing;
window.clear = clear;
