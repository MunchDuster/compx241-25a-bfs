let stage;
let layer;

const width = 1000;
const height = 500;
console.log(width + ' ' + height);
const gridSize = 10; // same as normal battleships
const offset = 4; //offset for tiles to get grid lines inbetween tiles for aesthetics.
const size = Math.round(height / gridSize) - offset * 2;

const tiles = [];
const ships = [];
const shipTypes = ["carrier", "battleship", "cruiser", "submarine", "destroyer"]; //different ship types

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
            const xPos = getGridStartXPos(x) + offsetX;
            const yPos = getGridStartYPos(y) + offset;

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

            // Log positions to check for overlaps
            console.log(`Tile (${x}, ${y}, ${gridNum}) at position (${xPos}, ${yPos})`);

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
                
                //have only one tile highlighted on the left grid
                if(parseInt(this.id().split('-')[2]) == 1) {
                    //left gird tile actions go here
                    ships.forEach(ship => { 
                        if(ship.opacity() == 0.5) { //get the ship that is selected (selected ship is the one thats has less opacity)
                            console.log(ship.id());
                            //move the ship to selected tile
                            ship.x(this.x()); 
                            ship.y(this.y());
                            //aline ship when moving to selected tile
                            ship.offsetY((ship.height() / 2) - (size / 2));

                            //unselect ship
                            ship.opacity(1);
                        }
                    });

                } else { //actions for the right grid go here
                    this.fill(this.fill() == '#5F85B5' ? '#4CAF50' : '#5F85B5'); //switch colours
                    setSelectedTile(tile.x, tile.y);
                }
                
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


function addShips() {

    for (let i = 0; i < shipTypes.length; i++) { //repeat for all ship types

         //get ship sizes for referencing img sizes
        let shipSize = 0;
        switch(shipTypes[i]) {
            case 'carrier':
                shipSize = 5;
                break;
            case 'battleship':
                shipSize = 4;
                break;
            case 'cruiser':
            case 'submarine':
                shipSize = 3;
                break;
            case 'destroyer':
                shipSize = 2;
                break;
            default:
                shipSize = 0;
        }

        const shipImg = new Image();
        shipImg.onload = function () {
            const ship = new Konva.Image({
                x: tiles[i].x(),
                y: tiles[i].y(),
                image: shipImg,
                width: size,
                height: (size + offset) * shipSize - offset, //math to get ship to fit within tiles
                id: `${shipTypes[i]}-${1}`, //id storing ship type plus rotation (1 for up and down, 2 for left and right)
            });
            console.log(`Ship (${shipTypes[i]}) placed at position (${tiles[i].id()})`);
            layer.add(ship);
            ships.push(ship);

             ship.on('click', function() {
                ships.forEach(ship => { //unselect the other ships to prevent multiple ships from being selected
                    ship.opacity(1);
                })
                this.opacity(this.opacity() === 1 ? 0.5 : 1); //set the opacity of the ship to 50% when clicked on
                console.log(`Selected ${this.id()}`);
            });

            ship.on('wheel', function() {
                if(ship.opacity() == 0.5) {
                    //check the id (makes it easier to get ship rotation)
                    if (this.id().split(' ')[1] == 1){ //rotate vertically
                        this.id(`${shipTypes[i]} ${2}`);
                        this.offsetY((this.height() / 2) - (size / 2));
                        this.offsetX(0);
                        this.rotate(90); //rotate ship 90 degrees 
                        console.log("up");

                    } else { //rotate horizontally
                        this.id(`${shipTypes[i]} ${1}`);
                        this.offsetX(size);
                        this.rotate(-90);
                        console.log("left");
                    } 
                }
            })

            document.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'r') {
                    const selectedShip = ships.find(ship => ship.opacity() === 0.5);
                    if (selectedShip) {
                        if (selectedShip.id().split(' ')[1] == 1){ //rotate vertically
                            selectedShip.id(`${shipTypes[i]} ${2}`);
                            selectedShip.offsetY((selectedShip.height() / 2) - (size / 2));
                            selectedShip.offsetX(0);
                            selectedShip.rotate(90); //rotate ship 90 degrees 
                            console.log("up");
                        } else { //rotate horizontally
                            selectedShip.id(`${shipTypes[i]} ${1}`);
                            selectedShip.offsetX(size);
                            selectedShip.rotate(-90);
                            console.log("left");
                        } 
                    }
                }
            }
        );        
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
