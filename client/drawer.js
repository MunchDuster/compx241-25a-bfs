let stage, gridLayer, shipLayer, feedbackLayer, shipPlacementLayer;

const CANVAS_WIDTH = 1320;
const CANVAS_HEIGHT = 500
const GRID_SIZE = 10;
let fontLoaded = false;

const OFFSET = 4;
let TILE_SIZE

const PLACEMENT_AREA_WIDTH = 160;
const PLAYER_GRID_WIDTH = (CANVAS_WIDTH) / 2;
const GRID_X_OFFSET_P1 = PLACEMENT_AREA_WIDTH;
const GRID_X_OFFSET_P2 = PLAYER_GRID_WIDTH;

let isUserPlayer1;

/*
 * ---- Draw Functions ----
 */

function initCanvas(isPlayer1) {
    preloadFont();
    stage = new Konva.Stage({
        container: 'game-board',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    });

    isUserPlayer1 = isPlayer1;

    gridLayer = new Konva.Layer();
    shipLayer = new Konva.Layer();
    feedbackLayer = new Konva.Layer();
    shipPlacementLayer = new Konva.Layer();

    stage.add(gridLayer, shipLayer, feedbackLayer, shipPlacementLayer);

    TILE_SIZE = Math.round(CANVAS_HEIGHT / GRID_SIZE) - OFFSET * 2;
    drawGameBoard(isPlayer1);
    console.log("Konva Drawer Initialised. Grid is on the " + (isPlayer1 ? "left" : "right"));
}

async function preloadFont() {
    if (fontLoaded) return;
    
    const font = new FontFace('Micro 5', 'url(../assets/fonts/Micro5-Regular.ttf)');
    try {
        await font.load();
        document.fonts.add(font);
        fontLoaded = true;
        console.log('Micro 5 font loaded');
    } catch (error) {
        console.error('Failed to load Micro 5 font:', error);
    }
}

function drawGameBoard(isPlayer1) {
    gridLayer.destroyChildren();
    drawSingleBoard(GRID_X_OFFSET_P1, isPlayer1 ? "1" : "2");
    drawSingleBoard(GRID_X_OFFSET_P2, isPlayer1 ? "2" : "1");
    gridLayer.batchDraw();
}

function drawSingleBoard(startX, gridNum) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const xPos = startX + (TILE_SIZE / 2) + (x * (TILE_SIZE + OFFSET));
            const yPos = (TILE_SIZE / 2) + (y * (TILE_SIZE + OFFSET));

            const tileRect = new Konva.Rect({
                x: xPos, y: yPos,
                width: TILE_SIZE, height: TILE_SIZE,
                fill: '#5F85B5', stroke: '#234668', strokeWidth: 1,
                gridnum: gridNum, gridx: x, gridy: y,
                name: `tile ${gridNum} ${x}-${y}`
            });

            const isEnemyGrid = gridNum == 2;
            if (isEnemyGrid) {
                tileRect.on('click', function() {
                    const gameState = window.getGameState();
                    if (!gameState.isReady || !gameState.isTurn) return;

                    gridLayer.find('Rect').forEach(tile => {
                        tile.fill('#5F85B5');
                    });

                    this.fill(this.fill() === '#5F85B5' ? '#4CAF50' : '#5F85B5');

                    window.setSelectedTile(x, y);

                    gridLayer.batchDraw();
                });

                tileRect.on('mouseover', function() {
                    const gameState = window.getGameState();
                    if (!gameState.isReady || !gameState.isTurn) return;

                    document.body.style.cursor = 'pointer';
                    this.stroke('#4CAF50');
                })

                tileRect.on('mouseout', function() {
                    const gameState = window.getGameState();
                    if (!gameState.isReady || !gameState.isTurn) return;

                    document.body.style.cursor = 'default';
                    this.stroke('#234668');
                })
            }

            gridLayer.add(tileRect);

            console.log(`Tile (${x}, ${y}, ${gridNum}) at position (${xPos}, ${yPos})`);
        }
    }
}

function renderShipsPlacementDock(ships, onShipsLoaded) {
    shipPlacementLayer.destroyChildren();
    let loadedShips = 0;

    ships.forEach(ship => {
        if (ship.isPlaced) return;

        const shipImg = new Image();
        shipImg.onload = function () {
            const shipImage = new Konva.Image({
                x: ship.x,
                y: ship.y,
                image: shipImg,
                width: ship.width,
                height: ship.height,
                rotation: ship.rotation,
                draggable: true,
                shipType: ship.type,
                offsetX: ship.width / 2,
                offsetY: ship.height / 2,
                shipRef: ship,
            });
            shipImage.shipRef = ship;
            ship.konvaImg = shipImage;
            shipPlacementLayer.add(shipImage);
            shipPlacementLayer.batchDraw();

            loadedShips++;
            if (loadedShips === ships.length && onShipsLoaded) {
                onShipsLoaded();
            }
        }
        shipImg.src = ship.imgPath;

        shipImg.onerror = function() {
            console.error(`Failed to load ship image: ${ship.imgPath}`);
        };
    });
    console.log("Ships Placement Dock Rendered");
}

function highlightShipSnapCells(cells, isValid) {
    
    feedbackLayer.destroyChildren();

    if (!cells || cells.length === 0) {
        feedbackLayer.batchDraw();
        return;
    }

    const color = isValid ? 'rgba(0,255,0,0.4)' : 'rgba(255,0,0,0.4)';
    cells.forEach(cell => {
        const gridNum = 1;
        const pos = window.getCanvasPosFromGridPos(cell.x, cell.y, gridNum);

        const rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: drawerValues.TILE_SIZE,
            height: drawerValues.TILE_SIZE,
            fill: color,
            stroke: 'black',
            strokeWidth: 1,
            opacity: 0.5
        });
        feedbackLayer.add(rect);
    });
    feedbackLayer.batchDraw();
}

function playMissSplash(x, y) {
    console.log("Miss Splash");
    animateGif(x, y, 9, 100, 'splash', 'gif');
}

function playHitExplosion(x, y) {
    console.log("Hit Explosion");
    animateGif(x, y, 8, 100, 'boom', 'gif');
}

function animateGif(x, y, totalFrames, frameDuration, gifname, filetype = png) {
    let currentFrame = 0;
    let frame = null;

    function showNextFrame() {
        const frameImg = new Image();
        frameImg.onload = function() {
            // Clear previous frame
            if (frame) {
                frame.destroy();
            }

            // Create new frame and show it
            frame = new Konva.Image({
                x: x,
                y: y,
                image: frameImg,
                width: TILE_SIZE,
                height: TILE_SIZE,
            });
            feedbackLayer.add(frame);
            feedbackLayer.batchDraw();
            
            // Check if there are more frames
            if (currentFrame < totalFrames - 1) {
                currentFrame++;
                // Set timeout works by after a certain amount of time it calls a function
                // Here it calls the showNextFrame function "recursively" though not true recursion
                // As it only calls itself total frames times
                setTimeout(showNextFrame, frameDuration);
            } else {
                // Last frame so destroy it and stop animating
                setTimeout(() => {
                    frame.destroy();
                    feedbackLayer.batchDraw();
                }, frameDuration);
            }
        };
        
        frameImg.src = `../assets/${gifname}/${currentFrame}.${filetype}`;
    }

    showNextFrame();
}

function renderShipDamage(x, y) {
    // Generate a random number from 0 to 3 for the damage sprite
    const randDamageSprite = Math.floor(Math.random() * 4);
    const damageImg = new Image();
    damageImg.onload = function() {
        const damageImage = new Konva.Image({
            x: x,
            y: y,
            image: damageImg,
            width: TILE_SIZE,
            height: TILE_SIZE,
        });
        // Draw on ship layer as it is like part of the ship or smth 
        shipLayer.add(damageImage);
        shipLayer.batchDraw();
    };
    damageImg.src = `../assets/damage_${randDamageSprite}.png`;
}

function showMineCount(x, y, count) {
    const text = new Konva.Text({
        x: x,
        y: y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        text: count.toString(),
        fontSize: TILE_SIZE,
        fontFamily: 'Micro 5',
        fill: getMineCountColor(count),
        align: 'center',
        verticalAlign: 'middle'
    });

    feedbackLayer.add(text);
    feedbackLayer.batchDraw();

    // Fade out animation
    const fadeOut = new Konva.Tween({
        node: text,
        duration: 2, // 2 seconds
        opacity: 0,
        onFinish: () => {
            text.destroy();
            feedbackLayer.batchDraw();
        }
    });

    // Start fade after 3 seconds
    setTimeout(() => {
        fadeOut.play();
    }, 2000);
}


/*
 * ---- Helper Functions ----
 */

function getGridPosFromCanvasPos(canvasX, canvasY, gridStartX) {
    const relativeX = canvasX - gridStartX;
    const relativeY = canvasY;

    const gridX = Math.floor((relativeX - TILE_SIZE/2) / (TILE_SIZE + OFFSET));
    const gridY = Math.floor((relativeY - TILE_SIZE/2) / (TILE_SIZE + OFFSET));

    if (gridX >= 0 && gridX < GRID_SIZE && 
        gridY >= 0 && gridY < GRID_SIZE) {
        return { x: gridX, y: gridY };
    }
    return null;
}

function getCanvasPosFromGridPos(gridX, gridY, gridNum) {
    let gridXOffset;
    if (isUserPlayer1) {
        gridXOffset = gridNum == 1 ? GRID_X_OFFSET_P1 : GRID_X_OFFSET_P2;
    } else {
        gridXOffset = gridNum == 1 ? GRID_X_OFFSET_P2 : GRID_X_OFFSET_P1;
    }
    
    return {
        x: gridXOffset + (TILE_SIZE / 2) + (gridX * (TILE_SIZE + OFFSET)),
        y: (TILE_SIZE / 2) + (gridY * (TILE_SIZE + OFFSET))
    };
}

function getDrawerValues() {
    return {
        GRID_SIZE,
        TILE_SIZE,
        GRID_X_OFFSET_P1,
        GRID_X_OFFSET_P2,
        PLACEMENT_AREA_WIDTH,
        PLAYER_GRID_WIDTH,
        OFFSET,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    };
}

function getStageAndLayers() {
    return {
        stage,
        gridLayer,
        shipLayer,
        feedbackLayer,
        shipPlacementLayer
    };
}

function getMineCountColor(count) {
    switch(count) {
        // i love mine sweeper 💥🧹
        case 0: return '#808080'; // Gray
        case 1: return '#0000FF'; // Blue
        case 2: return '#008000'; // Green
        case 3: return '#FF0000'; // Red
        case 4: return '#000080'; // Dark Blue
        case 5: return '#800000'; // Maroon
        case 6: return '#008080'; // Teal
        case 7: return '#000000'; // Black
        case 8: return '#808080'; // Gray
        default: return '#000000';
    }
}

/*
 * ---- Exports ----
 */

// Draw Functions
window.initCanvas = initCanvas;
window.renderShipsPlacementDock = renderShipsPlacementDock;
window.highlightShipSnapCells = highlightShipSnapCells;
window.playMissSplash = playMissSplash;
window.playHitExplosion = playHitExplosion;
window.renderShipDamage = renderShipDamage;
window.showMineCount = showMineCount;

// Helper Functions
window.getDrawerValues = getDrawerValues;
window.getStageAndLayers = getStageAndLayers;
window.getCanvasPosFromGridPos = getCanvasPosFromGridPos;
window.getGridPosFromCanvasPos = getGridPosFromCanvasPos;


/* let stage;
let layer;

const width = 1000;
const height = 500;
console.log(width + ' ' + height);
const gridSize = 10; // same as normal battleships
const offset = 4; //offset for tiles to get grid lines inbetween tiles for aesthetics.
const size = Math.round(height / gridSize) - offset * 2;

let isPlacementMode = false;
let checkPlacement = false;
const PLACEMENT_AREA_WIDTH = 150;

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
                x: tiles[i + 20].x(),
                y: tiles[i + 20].y(),
                image: shipImg,
                width: size,
                height: (size + offset) * shipSize - offset, //math to get ship to fit within tiles
                id: `${shipTypes[i]} Up`, //id storing ship type plus rotation (1 for up and down, 2 for left and right)
                offsetY: (((size + offset) * shipSize - offset)/2) - (size / 2), //set initial offset
            });
            console.log(`Ship (${shipTypes[i]}) placed at position (${tiles[i].id()})`);
            layer.add(ship);
            ships.push(ship);

             ship.on('click', function() {
                ships.forEach(ship => { //unselect the other ships to prevent multiple ships from being selected
                    ship.opacity(1);
                })
                this.opacity(0.5); //set the opacity of the ship to 50% when clicked on
                console.log(`Selected ${this.id()}`);
            });

            ship.on('wheel', function() {
                if(this.opacity() == 0.5) {
                    //check the id (makes it easier to get ship rotation)
                    switch (this.id().split(' ')[1]) {
                        case 'Up':
                            //rotate the ship right
                            this.id(`${shipTypes[i]} Right`);
                            this.rotate(90);
                            if(shipTypes[i] == "destroyer" || shipTypes[i] == "battleship") {
                                this.offsetY((this.height() / 2) + size);
                            } else { this.offsetY((this.height() / 2) + (size / 2)); }
                            this.offsetX(0);
                            break;

                        case 'Right':
                            //rotate the ship downwards
                            this.id(`${shipTypes[i]} Down`);
                            this.rotate(90);
                            this.offsetX(size);
                            if(shipTypes[i] == "destroyer" || shipTypes[i] == "battleship") {
                                this.offsetY((this.height() / 2) + size);
                            } else { this.offsetY((this.height() / 2) + (size / 2)); }
                            break;

                        case 'Down':
                            //rotate the ship left
                            this.id(`${shipTypes[i]} Left`);
                            this.rotate(90);
                            this.offsetX(size);
                            if(shipTypes[i] == "destroyer" || shipTypes[i] == "battleship") {
                                this.offsetY((this.height() / 2));
                            } else { this.offsetY((this.height() / 2) - (size / 2)); }
                            break;

                        case 'Left':
                            //rotate the ship upwards
                            this.id(`${shipTypes[i]} Up`);
                            this.rotate(90);
                            this.offsetX(0);
                            if(shipTypes[i] == "destroyer" || shipTypes[i] == "battleship")  { 
                                this.offsetY((this.height() / 2));
                            } else { this.offsetY((this.height() / 2) - (size / 2)); }
                            break;
                    }
                }
            })

            document.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'r') {

                    ships.forEach(ship => {
                        if(ship.opacity() == 0.5) {
                            console.log("selected" );
                        } else { console.log("not selected " + ship.id()); }
                        });
                            // //get selected ship and id info
                            // const shipOrient = ship.id().split(' ')[1];
                            // const shipType = !(ship.id().split(' ')[0] != "destroyer" && ship.id().split(' ')[0] != "battleship");

                            // switch (shipOrient) {
                            //     case 'Up':
                            //         //rotate the ship right
                            //         ship.id(`${shipTypes[i]} Right`);
                            //         ship.rotate(90);
                            //         ship.offsetX(0);
                            //         if(shipType) {
                            //             ship.offsetY((ship.height() / 2) + size);
                            //             console.log("even");
                            //         } else { 
                            //             ship.offsetY((ship.height() / 2) + (size / 2));
                            //             console.log("odd");
                            //         }
                            //     break;

                            //     case 'Right':
                            //         //rotate the ship downwards
                            //         ship.id(`${shipTypes[i]} Down`);
                            //         ship.rotate(90);
                            //         ship.offsetX(size);
                            //         if(shipType) {
                            //             ship.offsetY((ship.height() / 2) + size);
                            //             console.log("even");
                            //         } else { 
                            //             ship.offsetY((ship.height() / 2) + (size / 2)); 
                            //             console.log("odd");
                            //         }
                            //     break;

                            //     case 'Down':
                            //         //rotate the ship left
                            //         ship.id(`${shipTypes[i]} Left`);
                            //         ship.rotate(90);
                            //         ship.offsetX(size);
                            //         if(shipType) {
                            //             ship.offsetY((ship.height() / 2));
                            //             console.log("even");
                            //         } else { 
                            //             ship.offsetY((ship.height() / 2) - (size / 2)); 
                            //             console.log("odd");
                            //         }
                            //     break;

                            //     case 'Left':
                            //         //rotate the ship upwards
                            //         ship.id(`${shipTypes[i]} Up`);
                            //         ship.rotate(90);
                            //         ship.offsetX(0);
                            //         if(shipType)  { 
                            //             ship.offsetY((ship.height() / 2));
                            //             console.log("even");
                            //         } else { 
                            //             ship.offsetY((ship.height() / 2) - (size / 2)); 
                            //             console.log("odd");
                            //         }
                            //     break;
                            // }
                    
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
 */