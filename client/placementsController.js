let isCurrentPlayerP1 = null;
let gameState = null;
let unplacedShips = null;
let currentPlacedShips = null;
let draggedShip = null;
let drawerValues = null;
let stagesAndLayers = null;

const SHIP_DEFINITIONS = [
    { type: "carrier",    size: 5, imgPath: "../assets/images/ships/carrier.png"},
    { type: "battleship", size: 4, imgPath: "../assets/images/ships/battleship.png"},
    { type: "cruiser",    size: 3, imgPath: "../assets/images/ships/cruiser.png"},
    { type: "submarine",  size: 3, imgPath: "../assets/images/ships/submarine.png"},
    { type: "destroyer",  size: 2, imgPath: "../assets/images/ships/destroyer.png"}
];


function initPlacements(isPlayer1) {
    isCurrentPlayerP1 = isPlayer1;

    gameState = window.getGameState();

    unplacedShips = gameState.unplacedShips;
    currentPlacedShips = gameState.currentPlacedShips;

    drawerValues = window.getDrawerValues();
    stagesAndLayers = window.getStageAndLayers();
    console.log("Drawer values: ", drawerValues);
    
    let shipPlacementX = isPlayer1 ?
        25 + (drawerValues.TILE_SIZE / 2) :
        drawerValues.CANVAS_WIDTH - 25 - (drawerValues.TILE_SIZE / 2);
    let shipPlacementY = 25;

    SHIP_DEFINITIONS.forEach(def => {
        const shipHeight = (drawerValues.TILE_SIZE + drawerValues.OFFSET) * def.size - drawerValues.OFFSET;
        const shipWidth = drawerValues.TILE_SIZE;

        if (shipPlacementY > drawerValues.CANVAS_HEIGHT - shipHeight) {
            shipPlacementX = isPlayer1 ? shipPlacementX + shipWidth * 2: shipPlacementX - shipWidth * 2;
            shipPlacementY = 25;
        }

        const tempY = shipPlacementY + (((drawerValues.TILE_SIZE + drawerValues.OFFSET) * def.size - drawerValues.OFFSET) / 2);

        unplacedShips.push({
            type: def.type,
            size: def.size,
            imgPath: def.imgPath,
            x: shipPlacementX,
            y: tempY,
            dockX: shipPlacementX,
            dockY: tempY,
            centerTile: {
                x: -1,
                y: -1
            },
            width: shipWidth,
            height: shipHeight,
            rotation: 0,
            isPlaced: false,
            konvaImg: null,
        });

        console.log("Ship " + def.type + " placement x: ", shipPlacementX, " y: ", tempY);

        shipPlacementY = shipPlacementY + shipHeight + shipWidth;
    });

    window.renderShipsPlacementDock(unplacedShips, () => {
        console.log("All ships loaded, setting up input listeners");
        setupInputListeners();
    });
}

function setupInputListeners() {
    unplacedShips.forEach(ship => {
        if (ship.konvaImg) {
            const konvaShip = ship.konvaImg;

            konvaShip.on('dragstart', function () {
                if (ship.isPlaced) {
                    this.draggable(false);
                    return;
                }
                draggedShip = this;
                this.moveToTop();
                console.log("Dragging ship: ", ship.type);
            });

            konvaShip.on('dragmove', function () {
                let newX = this.x();
                let newY = this.y();
                const shipCurrentWidth = this.width();
                const shipCurrentHeight = this.height();

                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX + shipCurrentWidth > drawerValues.CANVAS_WIDTH) {
                    newX = drawerValues.CANVAS_WIDTH - shipCurrentWidth;
                }
                if (newY + shipCurrentHeight > drawerValues.CANVAS_HEIGHT) {
                    newY = drawerValues.CANVAS_HEIGHT - shipCurrentHeight;
                }
                
                updateSnapToTile(this);
            });

            konvaShip.on('dragend', function () {
                if (draggedShip === this) {
                    window.highlightShipSnapCells([], false);
                    placeShip(this);
                    draggedShip = null;
                }
            });
        } else {
            console.error("Ship image not found for type: ", ship.type);
        }

        const stage = stagesAndLayers.stage;
        stage.on('wheel', function(e) {
        if (draggedShip) {
            e.evt.preventDefault(); // Prevent page scrolling
            const shipData = draggedShip.shipRef;
            if (shipData && !shipData.isPlaced) {
                handleRotation(draggedShip, e.evt.deltaY < 0);
            }
        }
    });
    window.addEventListener('keydown', handlePlacementRotationKey);
    });

    console.log("Input listeners set up for unplaced ships");
    window.addEventListener('keydown', handlePlacementRotationKey);
}

function handlePlacementRotationKey(e) {
    if (e.key.toLowerCase() === 'r' && draggedShip) {
        const shipData = draggedShip.shipRef;
        if (shipData && !shipData.isPlaced) {
            handleRotation(draggedShip, true);
        }
    }
}

function handleRotation(konvaShip, isClockwise = true) {
    const shipData = konvaShip.shipRef;
    if (!shipData || shipData.isPlaced) return;

    if (isClockwise) {
        shipData.rotation = (shipData.rotation + 1) % 4;
    } else {
        shipData.rotation = (shipData.rotation + 3) % 4;
    }

    konvaShip.rotation(shipData.rotation * 90);

    updateSnapToTile(konvaShip);
    konvaShip.getLayer().batchDraw();
}

function updateSnapToTile(konvaShip) {
    const ship = konvaShip.shipRef;
    
    const playerGridStartX = isCurrentPlayerP1 ? drawerValues.GRID_X_OFFSET_P1 : drawerValues.GRID_X_OFFSET_P2;
    const stage = stagesAndLayers.stage;
    const pointerPos = stage.getPointerPosition();
    
    const hoverGridCoords = window.getGridPosFromCanvasPos(pointerPos.x, pointerPos.y, playerGridStartX);
    console.log("Hover grid coords: ", hoverGridCoords);
    
    if (hoverGridCoords) {
        const cellsToOccupy = getShipCellsFromCentre(ship, hoverGridCoords.x, hoverGridCoords.y);
        const isValid = isPlacementValid(ship, cellsToOccupy);
        
        const snappedCanvasPos = window.getCanvasPosFromGridPos(
            hoverGridCoords.x, 
            hoverGridCoords.y,
            1
        );
    
        let verticalOffset = 0;
        let horizontalOffset = 0;
        if (ship.size % 2 === 0) {
            const offset = (drawerValues.TILE_SIZE / 2) + 1;
            switch (ship.rotation) {
                case 0: // UP
                    verticalOffset = -offset;
                    break;
                case 1: // RIGHT
                    horizontalOffset = offset;
                    break;
                case 2: // DOWN
                    verticalOffset = offset;
                    break;
                case 3: // LEFT
                    horizontalOffset = -offset;
                    break;
            }
        }
    
        konvaShip.position({
            x: snappedCanvasPos.x + drawerValues.TILE_SIZE / 2 + horizontalOffset,
            y: snappedCanvasPos.y + drawerValues.TILE_SIZE / 2 + verticalOffset
        });

        window.highlightShipSnapCells(cellsToOccupy, isValid);
    } else {
        window.highlightShipSnapCells([], false);
    }
}

function getShipCellsFromCentre(ship, centreX, centreY) {
    const cells = [];
    const length = ship.size;
    const rotation = ship.rotation;
    const halfLen = length % 2 === 0 ? (length / 2) - 1 : ((length - 1) / 2);

    for (let i = 0; i < length; i++) {
        let cellX = centreX;
        let cellY = centreY;
        const offset = i - halfLen;
        
        switch (rotation) {
            case 0: 
                cellY -= offset;  
                break;
            case 1: 
                cellX += offset;  
                break;
            case 2: 
                cellY += offset;  
                break;
            case 3: 
                cellX -= offset;  
                break;
        }
        
        cells.push({ 
            x: Math.floor(cellX), 
            y: Math.floor(cellY)
        });
    }

    console.log(`Ship ${ship.type} cells at rotation ${rotation}:`, cells);
    return cells;
}

function isPlacementValid(ship, cellsItWouldOccupy) {
    if (!cellsItWouldOccupy || cellsItWouldOccupy.length === 0) return false;

    for (const cell of cellsItWouldOccupy) {
        if (cell.x < 0 || cell.x >= drawerValues.GRID_SIZE ||
            cell.y < 0 || cell.y >= drawerValues.GRID_SIZE) {
            console.log("Validation fail: Out of bounds", cell);
            return false;
        }
    }
    
    for (const placedShip of currentPlacedShips) {
        if (placedShip.type === ship.type) continue;

        const placedCells = getShipCellsFromCentre(
            placedShip, 
            placedShip.centerTile.x, 
            placedShip.centerTile.y
        );

        for (const newCell of cellsItWouldOccupy) {
            if (placedCells.some(pc => pc.x === newCell.x && pc.y === newCell.y)) {
                console.log("Validation fail: Overlaps with", placedShip.type);
                return false;
            }
        }
    }

    return true;
}

function placeShip(konvaShip) {
    const ship = konvaShip.shipRef;
    const playerGridStartX = isCurrentPlayerP1 ? drawerValues.GRID_X_OFFSET_P1 : drawerValues.GRID_X_OFFSET_P2;
    const stage = stagesAndLayers.stage;
    const pointerPos = stage.getPointerPosition();

    let shipPlaced = false;

    if (pointerPos) {
        const hoverGridCoords = window.getGridPosFromCanvasPos(pointerPos.x, pointerPos.y, playerGridStartX);
        if (hoverGridCoords) {
            const cellsToOccupy = getShipCellsFromCentre(ship, hoverGridCoords.x, hoverGridCoords.y);

            if (isPlacementValid(ship, cellsToOccupy)) {
                ship.centerTile = hoverGridCoords;
                ship.isPlaced = true;

                const snappedCanvasPos = window.getCanvasPosFromGridPos(
                    hoverGridCoords.x, 
                    hoverGridCoords.y,
                    1
                );

                unplacedShips.splice(unplacedShips.indexOf(ship), 1);
                console.log(`Placed ships ${unplacedShips}`);

                let verticalOffset = 0;
                let horizontalOffset = 0;
                if (ship.size % 2 === 0) {
                    const offset = (drawerValues.TILE_SIZE / 2) + 1;
                    switch (ship.rotation) {
                        case 0: // UP
                            verticalOffset = -offset;
                            break;
                        case 1: // RIGHT
                            horizontalOffset = offset;
                            break;
                        case 2: // DOWN
                            verticalOffset = offset;
                            break;
                        case 3: // LEFT
                            horizontalOffset = -offset;
                            break;
                    }
                }
            
                konvaShip.position({
                    x: snappedCanvasPos.x + drawerValues.TILE_SIZE / 2 + horizontalOffset,
                    y: snappedCanvasPos.y + drawerValues.TILE_SIZE / 2 + verticalOffset
                });

                //konvaShip.draggable(false);
                konvaShip.moveTo(stagesAndLayers.shipLayer);
                currentPlacedShips.push(ship);
                shipPlaced = true;
            }
        }
    }

    if (!shipPlaced) {
        konvaShip.rotation(0);
        ship.rotation = 0;
        konvaShip.position({ x: ship.dockX, y: ship.dockY });
        konvaShip.moveTo(stagesAndLayers.shipPlacementLayer);
        ship.isPlaced = false;
        ship.centerTile = { x: -1, y: -1 };

        if (unplacedShips.indexOf(ship) === -1) {
            unplacedShips.push(ship);
            currentPlacedShips.splice(currentPlacedShips.indexOf(ship), 1);
        }
    }

    stagesAndLayers.shipPlacementLayer.batchDraw();
    stagesAndLayers.shipLayer.batchDraw();
    window.highlightShipSnapCells([], false);
    window.updateReadyButton();
}

function lockShips() {
    currentPlacedShips.forEach(ship => {
        ship.isPlaced = true;
        ship.konvaImg.draggable(false);
    });
    stagesAndLayers.shipLayer.batchDraw();
}

window.initPlacements = initPlacements;