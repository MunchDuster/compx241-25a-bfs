let stage;
let layer;

function startPlacingShips() {
    console.log('Adding Ships...');
	stage = new Konva.Stage({
		container: 'game-board',
		width: 1000,
		height: 500
	});
	layer = new Konva.Layer();
	stage.add(layer);
    addShips();
}

const shipTypes = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];

function addShips() {

    for (let i = 0; i < shipTypes.length; i++) { //repeat for all ship types

        //get ship sizes for referencing img sizes
        const size = 0;
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

window.startPlacingShips = startPlacingShips;