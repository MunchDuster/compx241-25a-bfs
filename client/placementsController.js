let isCurrentPlayerP1 = null;
let unplacedShips = [];
let currentPlacedShips = [];
let draggedShip = null;
let drawerValues = null;
let stagesAndLayers = null;

const SHIP_DEFINITIONS = [
    { type: "carrier",    size: 5, imgPath: "../assets/carrier.png"},
    { type: "battleship", size: 4, imgPath: "../assets/battleship.png"},
    { type: "cruiser",    size: 3, imgPath: "../assets/cruiser.png"},
    { type: "submarine",  size: 3, imgPath: "../assets/submarine.png"},
    { type: "destroyer",  size: 2, imgPath: "../assets/destroyer.png"}
];


function initPlacements(isPlayer1) {
    isCurrentPlayerP1 = isPlayer1;
    unplacedShips = [];
    currentPlacedShips = [];

    drawerValues = window.getDrawerValues();
    stagesAndLayers = window.getStageAndLayers();
    console.log("Drawer values: ", drawerValues);
    let shipPlacementX = isPlayer1 ? 15: drawerValues.CANVAS_WIDTH - drawerValues.TILE_SIZE - 15;
    let shipPlacementY = 20;

    SHIP_DEFINITIONS.forEach(def => {
        const shipWidth = drawerValues.TILE_SIZE;
        const shipHeight = (drawerValues.TILE_SIZE + drawerValues.OFFSET) * def.size - drawerValues.OFFSET;

        if (shipPlacementY > drawerValues.CANVAS_HEIGHT - shipHeight) {
            shipPlacementX = isPlayer1 ? shipPlacementX + shipWidth * 2: shipPlacementX - shipWidth * 2;
            shipPlacementY = 20;
        }

        unplacedShips.push({
            type: def.type,
            size: def.size,
            imgPath: def.imgPath,
            x: shipPlacementX,
            y: shipPlacementY,
            dockX: shipPlacementX,
            dockY: shipPlacementY,
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

        console.log("Ship " + def.type + " placement x: ", shipPlacementX, " y: ", shipPlacementY);

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
    });

    console.log("Input listeners set up for unplaced ships");
    window.addEventListener('keydown', handlePlacementRotationKey);
}

function handlePlacementRotationKey(e) {
    if (e.key.toLowerCase() === 'r' && draggedShip) {
        const ship = draggedShip.shipRef;
        if (!ship || ship.isPlaced) {
            console.error("Ship not found or already placed: ", ship);
            return;
        }
        console.log("Rotating ship: ", ship.type);
    }
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
        const length = ship.size;
        const yOffset = length % 2 === 0 ? length/2 * (drawerValues.TILE_SIZE + drawerValues.OFFSET) : Math.floor(length/2) * (drawerValues.TILE_SIZE + drawerValues.OFFSET);

        const snappedCanvasPos = window.getCanvasPosFromGridPos(
            hoverGridCoords.x, 
            hoverGridCoords.y,
            isCurrentPlayerP1 ? 1 : 2
        );
        
        konvaShip.position({
            x: snappedCanvasPos.x,
            y: snappedCanvasPos.y - yOffset
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
    const halfLen = length % 2 === 0 ? (length / 2) - 1 : Math.floor((length - 1) / 2);

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
                const length = ship.size;
                const yOffset = length % 2 === 0 ? length/2 * (drawerValues.TILE_SIZE + drawerValues.OFFSET) : Math.floor(length/2) * (drawerValues.TILE_SIZE + drawerValues.OFFSET);

                ship.centerTile = hoverGridCoords;
                ship.isPlaced = true;

                const snappedPos = window.getCanvasPosFromGridPos(
                    hoverGridCoords.x, 
                    hoverGridCoords.y,
                    isCurrentPlayerP1 ? 1 : 2
                );
                konvaShip.position({x: snappedPos.x, y: snappedPos.y - yOffset});
                konvaShip.draggable(false);
                konvaShip.moveTo(stagesAndLayers.shipLayer);

                currentPlacedShips.push(ship);
                shipPlaced = true;
            }
        }
    }

    if (!shipPlaced) {
        konvaShip.position({ x: ship.dockX, y: ship.dockY });
        konvaShip.moveTo(stagesAndLayers.shipPlacementLayer);
        ship.isPlaced = false;
        ship.centerTile = { x: -1, y: -1 };
    }

    stagesAndLayers.shipPlacementLayer.batchDraw();
    stagesAndLayers.shipLayer.batchDraw();
    window.highlightShipSnapCells([], false);
}

window.initPlacements = initPlacements;