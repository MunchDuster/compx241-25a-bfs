let isCurrentTurn = false;
let isCurrentPlayerP1 = null;
let unplacedShips = [];
let currentPlacedShips = [];

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

    const drawerValues = window.getDrawerValues();
    console.log("Drawer values: ", drawerValues);
    let shipPlacementX = isPlayer1 ? 15: drawerValues.CANVAS_WIDTH - drawerValues.TILE_SIZE - 15;
    let shipPlacementY = 20;

    SHIP_DEFINITIONS.forEach(def => {
        let shipWidth = drawerValues.TILE_SIZE;
        let shipHeight = (drawerValues.TILE_SIZE + drawerValues.OFFSET) * def.size - drawerValues.OFFSET;

        if (shipPlacementY > drawerValues.CANVAS_HEIGHT - shipHeight) {
            shipPlacementX = isPlayer1 ? shipPlacementX + shipWidth * 2: shipPlacementX - shipWidth * 2;
            shipPlacementY = 20;
        }

        unplacedShips.push({
            type: def.type,
            size: def.size,
            imgPath: def.imgPath,
            initialX: shipPlacementX,
            initialY: shipPlacementY,
            x: shipPlacementX,
            y: shipPlacementY,
            width: shipWidth,
            height: shipHeight,
            rotation: 0,
            isPlaced: false,
        });

        console.log("Ship " + def.type + " placement x: ", shipPlacementX, " y: ", shipPlacementY);

        shipPlacementY = shipPlacementY + shipHeight + shipWidth;
    });

    window.renderShipsPlacementDock(unplacedShips);
    setupInputListeners();
}

function setupInputListeners() {
    // TODO: Add event listeners for ship placement and rotation
}

window.initPlacements = initPlacements;