let isCurrentPlayerP1 = null;
let unplacedShips = [];
let currentPlacedShips = [];
let draggedShip = null;
let drawerValues = null;

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
    const stageRef = window.getStageAndLayers().stage;

    unplacedShips.forEach(ship => {
        if (ship.konvaImg) {
            ship.konvaImg.on('dragstart', function () {
                if (ship.isPlaced) {
                    this.draggable(false);
                    return;
                }
                draggedShip = this;
                this.moveToTop();
                console.log("Dragging ship: ", ship.type);
            });

            ship.konvaImg.on('dragmove', function () {
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
                this.position({ x: newX, y: newY });
                
                this.getLayer().batchDraw();
            });

            ship.konvaImg.on('dragend', function () {
                if (draggedShip === this) {
                    this.position({x: ship.dockX, y: ship.dockY});
                    this.getLayer().batchDraw();
                    draggedShip = null;
                    console.log("Dropped ship: ", ship.type);
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

window.initPlacements = initPlacements;