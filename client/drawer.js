const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const colors = {
    bg: '#4279aa',
    line: 'black'
}

const width = canvas.width;
const height = canvas.height;
console.log(width + ' ' + height);
const gridSize = 10; // same as normal battleships

const deltaXPos = width / (gridSize + 1); // + 1 for gap-to-edge, + 1 for side gaps
const deltaYPos = Math.min(height / (gridSize + 1), deltaXPos);

console.log(deltaXPos + ' ' + deltaYPos);

let isDrawing = false;
ctx.imageSmoothingEnabled = false;


// (x,y) is a grid point
// (xPos, yPos) is a canvas pixel
function startDrawing() {
    isDrawing = true;
    draw();
}
function stopDrawing() {
    isDrawing = false;
}
function draw() {
    clear();
    drawLines(0);
    drawLines(height/2);

    if (isDrawing) {
        requestAnimationFrame(draw);
    }
}
function clear() {
    ctx.clearRect(0, 0, width, height);
}
function drawLines(offsetY) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.line;
    
    ctx.beginPath();
    { // draw vertical lines
        const yStart = getGridStartYPos(0) + offsetY;
        const yEnd = getGridStartYPos(gridSize) + offsetY;
        for (let x = 0; x < gridSize + 1; x++) {
            const xPos = getGridStartXPos(x);
            ctx.moveTo(xPos, yStart);
            ctx.lineTo(xPos, yEnd);
        }
    }
    { // draw horizontal lines
        const xStart = getGridStartYPos(0);
        const xEnd = getGridStartYPos(gridSize);
        for (let y = 0; y < gridSize + 1; y++) {
            const yPos = getGridStartYPos(y) + offsetY;
            ctx.moveTo(xStart, yPos);
            ctx.lineTo(xEnd, yPos);
        }
    }
    ctx.closePath();
    ctx.stroke();
}


// rounding and add 0.51 makes lines crisper, because yes
function getGridStartXPos(x) {
    return Math.round((deltaXPos / 2.0) + x * deltaXPos) + 0.51;
}
function getGridStartYPos(y) {
    return Math.round((deltaYPos / 2.0) + y * deltaYPos) + 0.51;
}
function getGridPos({x, y}) {
    return {x: getGridStartXPos(x), y: getGridStartYPos(y)}
}

// startDrawing(); // for debugging