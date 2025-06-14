let stage, gridLayer, shipLayer, feedbackLayer, shipPlacementLayer, markerLayer;

const CANVAS_WIDTH = 1320;
const CANVAS_HEIGHT = 525;
const CANVAS_TOP_GAP = 25; //gap for x coord labels to go into
const GRID_SIZE = 10;
let fontLoaded = false;

const OFFSET = 4;
let currShips = [];
let TILE_SIZE

const PLACEMENT_AREA_WIDTH = 160;
const PLAYER_GRID_WIDTH = (CANVAS_WIDTH) / 2;
const GRID_X_OFFSET_P1 = PLACEMENT_AREA_WIDTH;
const GRID_X_OFFSET_P2 = PLAYER_GRID_WIDTH;

let isUserPlayer1;

window.addEventListener('load', preloadFont);

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
    markerLayer = new Konva.Layer();

    stage.add(gridLayer, shipLayer, feedbackLayer, shipPlacementLayer, markerLayer);

    TILE_SIZE = Math.round((CANVAS_HEIGHT - CANVAS_TOP_GAP) / GRID_SIZE) - OFFSET * 2;
    drawGameBoard(isPlayer1);
    handleResize();
    console.log("Konva Drawer Initialised. Grid is on the " + (isPlayer1 ? "left" : "right"));
}

async function preloadFont() {
    if (fontLoaded) return;
    
    const font = new FontFace('\"Micro 5\"', 'url(assets/fonts/Micro5-Regular.ttf)');
    try {
        await font.load();
        document.fonts.add(font);
        fontLoaded = true;
        console.log('Micro 5 font loaded');
    } catch (error) {
        console.error('Failed to load Micro 5 font:', error);
    }
}

function handleResize() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile || !stage) return;

    // Get container dimensions
    const container = document.getElementById('game-board-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerWidth / CANVAS_WIDTH;
    const scaleY = containerHeight / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    stage.scale({ x: scale, y: scale });
    
    const offsetX = (containerWidth - CANVAS_WIDTH * scale) / 2;
    stage.x(offsetX);
    
    stage.batchDraw();
}

window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100); // Small delay to allow new dimensions to settle
});
window.addEventListener('resize', handleResize);

function drawGameBoard(isPlayer1) {
    gridLayer.destroyChildren();
    drawSingleBoard(GRID_X_OFFSET_P1, isPlayer1 ? 1 : 2);
    drawSingleBoard(GRID_X_OFFSET_P2, isPlayer1 ? 2 : 1);
    gridLayer.batchDraw();
}

function drawGridLabels(startX) {
    const genericTextStuff = {
        fontSize: TILE_SIZE,
        fontFamily: 'Micro 5',
        fill: 'black',
        align: 'center',
        verticalAlign: 'middle',
        width: TILE_SIZE,
        height: TILE_SIZE,
    };
        
    // col labels (1,2,3,4,etc)
    for (let x = 0; x < GRID_SIZE; x++) {
        const xPos = startX + (TILE_SIZE / 2) + (x * (TILE_SIZE + OFFSET));
        const label = new Konva.Text({
            x: xPos,
            y: CANVAS_TOP_GAP/4, // eyeballed
            text: String.fromCharCode(48 + x),
            ...genericTextStuff
        });
        gridLayer.add(label);
    }

    // row labels (A,B,C,D,etc)
    for (let y = 0; y < GRID_SIZE; y++) {
        const yPos = (TILE_SIZE / 2) + (y * (TILE_SIZE + OFFSET)) + CANVAS_TOP_GAP;
        const label = new Konva.Text({
            x: startX - (TILE_SIZE / 2),
            y: yPos,
            text: String.fromCharCode(65 + y), //convert x to letter using unicode values //Capital letter is A = 65 to Z = 91, lowercase is a = 97 to z = 123
            ...genericTextStuff
        });
        gridLayer.add(label);
    }
}
function drawGridTiles(gridNum) {
    const tileRects = [];
    const sharedAttirbutes = {
        width: TILE_SIZE, 
        height: TILE_SIZE,
        fill: '#5F85B5', 
        stroke: '#234668', 
        strokeWidth: 1,
    };
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const pos = getCanvasPosFromGridPos(x, y, gridNum);

            const tileRect = new Konva.Rect({
                ...pos,
                ...sharedAttirbutes,
                name: `tile ${gridNum} ${x}-${y}`
            });

            gridLayer.add(tileRect);
            tileRects.push(tileRect);
            console.log(`Tile (${x}, ${y}, ${gridNum}) at position (${pos.x}, ${pos.y})`);
        }
    }
    return tileRects;
}

function drawSingleBoard(startX, gridNum) {
    drawGridLabels(startX);
    const isEnemyGrid = gridNum == 2;
    const tileRects = drawGridTiles(gridNum);

    if (!isEnemyGrid) {
        return;
    }

    // add event listeners
    for (let i = 0; i < tileRects.length; i++) {
        const tileRect = tileRects[i];
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);
        tileRect.on('mousedown touchstart', function() {
            const gameState = window.getGameState();
            if (!gameState.isReady || !gameState.isTurn) return;

            gridLayer.find('Rect').forEach(tile => {
                tile.fill('#5F85B5');
            });

            this.fill(this.fill() === '#5F85B5' ? '#4CAF50' : '#5F85B5');

            window.setSelectedTile(x, y);

            gridLayer.batchDraw();
        });

        tileRect.on('mouseover touchstart', function() {
            const gameState = window.getGameState();
            if (!gameState.isReady || !gameState.isTurn) return;

            document.body.style.cursor = 'pointer';
            this.stroke('#4CAF50');
        })

        tileRect.on('mouseout touchend', function() {
            const gameState = window.getGameState();
            if (!gameState.isReady || !gameState.isTurn) return;

            document.body.style.cursor = 'default';
            this.stroke('#234668');
        })
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
                        
            shipImage.on('mouseup touchstart', function() {
                const gameState = window.getGameState();
                if (!gameState.isMoveShipMode || ship.isHit) return;
                window.setSelectedShip(ship); 
                console.log("Selected Ship: ", ship.type, " at: ", ship.x, ship.y);
            });

            shipImage.shipRef = ship;
            ship.konvaImg = shipImage;
            shipPlacementLayer.add(shipImage);
            shipPlacementLayer.batchDraw();
            currShips.push(ship);
           
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
            width: TILE_SIZE,
            height: TILE_SIZE,
            fill: color,
            stroke: 'black',
            strokeWidth: 1,
            opacity: 0.5
        });
        feedbackLayer.add(rect);
    });
    feedbackLayer.batchDraw();
}

function highlightReconArea(centerPos, gridNum = 2) {
    const highlightColour = 'rgba(8, 122, 0, 0.5)';
    const highlightStroke = 'rgb(35, 94, 25)';

    for(let x = -1; x <= 1; x++) {
        for(let y = -1; y <= 1; y++) {
            const gridPos = {x: centerPos.x + x, y: centerPos.y + y};

            if (gridPos.x < 0 || gridPos.x >= GRID_SIZE || 
                gridPos.y < 0 || gridPos.y >= GRID_SIZE) {
                continue;
            }

            const pos = window.getCanvasPosFromGridPos(gridPos.x, gridPos.y, gridNum);

            const rect = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: TILE_SIZE,
                height: TILE_SIZE,
                fill: highlightColour,
                stroke: highlightStroke,
                strokeWidth: 1,
                opacity: 1
            });
            feedbackLayer.add(rect);
        }
    }
    feedbackLayer.batchDraw();

    const highlights = feedbackLayer.find('Rect');
    highlights.forEach(highlight => {
        const fadeOut = new Konva.Tween({
            node: highlight,
            duration: 2,
            opacity: 0,
            onFinish: () => {
                highlight.destroy();
                feedbackLayer.batchDraw();
            }
        });

        setTimeout(() => {
            fadeOut.play();
        }, 2000);
    });
}

function highlightMineBlastArea(centerPos, gridNum = 1) {
    const blastColor = 'rgba(255, 69, 0, 0.5)';
    const blastStroke = '#FF4500';

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            const gridPos = {x: centerPos.x + x, y: centerPos.y + y};

            if (gridPos.x < 0 || gridPos.x >= GRID_SIZE || 
                gridPos.y < 0 || gridPos.y >= GRID_SIZE) {
                continue;
            }
            
            const pos = window.getCanvasPosFromGridPos(gridPos.x, gridPos.y, gridNum);

            const rect = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: TILE_SIZE,
                height: TILE_SIZE,
                fill: blastColor,
                stroke: blastStroke,
                strokeWidth: 1,
                opacity: 1
            });
            feedbackLayer.add(rect);
        }
    }
    feedbackLayer.batchDraw();

    const highlights = feedbackLayer.find('Rect');
    highlights.forEach(highlight => {
        const fadeOut = new Konva.Tween({
            node: highlight,
            duration: 1,
            opacity: 0,
            onFinish: () => {
                highlight.destroy();
                feedbackLayer.batchDraw();
            }
        });

        setTimeout(() => {
            fadeOut.play();
        }, 500);
    });
}

function playMissSplash(pos, gridNum = 2, showPermanentImage = false) {
    console.log("Miss Splash");
    const {x, y} = getCanvasPosFromGridPos(pos.x, pos.y, gridNum);

    const existingMarkers = markerLayer.find('Image').filter(marker => 
        marker.x() === x && marker.y() === y
    );
    existingMarkers.forEach(marker => {
        marker.destroy();
    });
    markerLayer.batchDraw();

    animateGif(x, y, 9, 100, 'splash', 'gif', () => {
        if (showPermanentImage) {
            addHitMissMarker(x, y, false);
        }
    });
}

function playHitExplosion(pos, gridNum = 2, showPermanentImage = false) {
    console.log("Hit Explosion");
    const {x, y} = getCanvasPosFromGridPos(pos.x, pos.y, gridNum);

    const existingMarkers = markerLayer.find('Image').filter(marker => 
        marker.x() === x && marker.y() === y
    );
    existingMarkers.forEach(marker => {
        marker.destroy();
    });
    markerLayer.batchDraw();

    animateGif(x, y, 8, 100, 'boom', 'gif', () => {
        if (showPermanentImage) {
            addHitMissMarker(x, y, true);
        }
    });
}

function animateGif(x, y, totalFrames, frameDuration, gifname, filetype = png, onComplete) {
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
                    if (onComplete) onComplete();
                }, frameDuration);
            }
        };
        
        frameImg.src = `../assets/animations/${gifname}/${currentFrame}.${filetype}`;
    }

    showNextFrame();
}

function addHitMissMarker(x, y, isHit) {
    const markerImg = new Image();
    markerImg.onload = function() {
        const marker = new Konva.Image({
            x: x,
            y: y,
            image: markerImg,
            width: TILE_SIZE,
            height: TILE_SIZE,
            listening: false,
        });
        markerLayer.add(marker);
        markerLayer.batchDraw();

        const fadeOut = new Konva.Tween({
            node: marker,
            duration: 2,
            opacity: 0,
            onFinish: () => {
                marker.destroy();
                markerLayer.batchDraw();
            }
        });

        setTimeout(() => {
            fadeOut.play();
        }, 69420);
    };
    markerImg.src = isHit ? '../assets/images/perma-hit.png' : '../assets/images/perma-miss.png';
}

function renderShipDamage(pos, gridNum = 2) {
    const {x, y} = getCanvasPosFromGridPos(pos.x, pos.y, gridNum);

    currShips.forEach(ship => {
        const CELLS = window.getShipCellsFromCentre(ship, ship.centerTile.x, ship.centerTile.y);
        CELLS.forEach(cell => {
            if(cell.x == pos.x && cell.y == pos.y) {
                ship.isHit = true;
           }
        });
    });
    
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
    damageImg.src = `../assets/images/damage/damage_${randDamageSprite}.png`;
}

function showMineCount(pos, gridNum = 2, count) {
    const {x, y} = getCanvasPosFromGridPos(pos.x, pos.y, gridNum);
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
        verticalAlign: 'middle',
        stroke: 'rgb(35, 94, 25)',
    });

    feedbackLayer.add(text);
    feedbackLayer.batchDraw();

    const fadeOut = new Konva.Tween({
        node: text,
        duration: 4,
        opacity: 0,
        onFinish: () => {
            text.destroy();
            feedbackLayer.batchDraw();
        }
    });

    setTimeout(() => {
        fadeOut.play();
    }, 10420);
}

function showMoveShipButton(ship, gridnum = 1) {
    feedbackLayer.destroyChildren();
    const isVertical = ship.rotation % 2 == 0;
    const length = ship.size;
    const isEven = length % 2 === 0;
    
    function getArrowOffset(length, isEven, shipRotation) {
        if (!isEven) {
            if (shipRotation % 2 == 0) {
                return { up: Math.ceil(length / 2), down: Math.ceil(length / 2)};
            } else {
                return { left: Math.ceil(length / 2), right: Math.ceil(length / 2)};
            }
        }
        const halfLength = length / 2;
        switch (shipRotation) {
            case 0:
                return { up: halfLength + 1, down: halfLength};
            case 1:
                return { left: halfLength, right: halfLength + 1};
            case 2:
                return { up: halfLength, down: halfLength + 1};
            case 3:
                return { left: halfLength + 1, right: halfLength};
        }
    }

    const offset = getArrowOffset(length, isEven, ship.rotation);
    const arrows = isVertical ? [
        { x: 0, y: -offset.up, rotation: 0, offsetX: 0, offsetY: 0,},     
        { x: 0, y: offset.down, rotation: 180, offsetX: TILE_SIZE, offsetY: TILE_SIZE,}   
    ] : [
        { x: -offset.left, y: 0, rotation: 270, offsetX: TILE_SIZE, offsetY: 0,}, 
        { x: offset.right, y: 0, rotation: 90, offsetX: 0, offsetY: TILE_SIZE,}   
    ];

    arrows.forEach(arrowData => {

        const targetX = ship.centerTile.x + arrowData.x;
        const targetY = ship.centerTile.y + arrowData.y;
        let shipCollision = false;

        currShips.forEach(ship => {
            const CELLS = window.getShipCellsFromCentre(ship, ship.centerTile.x, ship.centerTile.y);
            CELLS.forEach(cell => {
                if (targetX == cell.x && targetY == cell.y) {
                    shipCollision = true;
                    console.log("Ship Collision!");
                }
            });
        });

        if (targetX < 0 || targetX >= GRID_SIZE || 
            targetY < 0 || targetY >= GRID_SIZE ||
            shipCollision) {
            return;
        }

        const pos = getCanvasPosFromGridPos(targetX, targetY, gridnum);
        const arrowImg = new Image();
        arrowImg.onload = function() {
            const arrowShape = new Konva.Image({
                x: pos.x,
                y: pos.y,
                image: arrowImg,
                width: TILE_SIZE,
                height: TILE_SIZE,
                opacity: 0.8,
                offsetX: arrowData.offsetX,
                offsetY: arrowData.offsetY,
                rotation: arrowData.rotation
            });

            arrowShape.on('mousedown touchstart', function() {
                document.body.style.cursor = 'pointer';
                this.opacity(1);
                feedbackLayer.batchDraw();
            });

            arrowShape.on('mouseout', function() {
                document.body.style.cursor = 'default';
                this.opacity(0.8);
                feedbackLayer.batchDraw();
            });

            arrowShape.on('mouseup touchend', function() {
                console.log('arrow clicked 🍕🍕🍕 on ', ship.type);
                window.setSelectedDirection(this.rotation());
                window.moveShip();

                feedbackLayer.destroyChildren();
                feedbackLayer.batchDraw();
            });

            feedbackLayer.add(arrowShape);
            feedbackLayer.batchDraw();
        };
        arrowImg.src = '../assets/images/arrow2.png';
    });
}

/*
 * ---- Helper Functions ----
 */

function getGridPosFromCanvasPos(canvasX, canvasY, gridStartX) {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    if (isMobile) {
        // Adjust for stage scaling and position
        const scale = stage.scaleX();
        const stageX = stage.x();
        canvasX = (canvasX - stageX) / scale;
        canvasY = canvasY / scale;
    }

    const gridStartY = CANVAS_TOP_GAP;
    const relativeX = canvasX - gridStartX;
    const relativeY = canvasY - gridStartY;

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
    const gridYOffset = CANVAS_TOP_GAP;
    return {
        x: gridXOffset + (TILE_SIZE / 2) + (gridX * (TILE_SIZE + OFFSET)),
        y: gridYOffset + (TILE_SIZE / 2) + (gridY * (TILE_SIZE + OFFSET))
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

function destroyStageAndLayers() {
    if (!stage) return;
    
    gridLayer.destroyChildren();
    shipLayer.destroyChildren();
    feedbackLayer.destroyChildren();
    shipPlacementLayer.destroyChildren();
        
    gridLayer.batchDraw();
    shipLayer.batchDraw();
    feedbackLayer.batchDraw();
    shipPlacementLayer.batchDraw();

    stage.clear();
    stage.destroy();

    stage = null;
    gridLayer = null;
    shipLayer = null;
    feedbackLayer = null;
    shipPlacementLayer = null;
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
window.renderShipDamage = renderShipDamage;
window.highlightShipSnapCells = highlightShipSnapCells;
window.highlightReconArea = highlightReconArea;
window.highlightMineBlastArea = highlightMineBlastArea;
window.playMissSplash = playMissSplash;
window.playHitExplosion = playHitExplosion;
window.showMineCount = showMineCount;
window.showMoveShipButton = showMoveShipButton;

// Helper Functions
window.getDrawerValues = getDrawerValues;
window.getStageAndLayers = getStageAndLayers;
window.destroyStageAndLayers = destroyStageAndLayers;
window.getCanvasPosFromGridPos = getCanvasPosFromGridPos;
window.getGridPosFromCanvasPos = getGridPosFromCanvasPos;
