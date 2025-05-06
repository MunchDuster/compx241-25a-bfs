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
const offset = 4; //offset for squares to get grid lines inbetween squares for aesthetics
const squares = [];

class Rectangle {
    constructor(x, y, id, color) {
        this.x = x;
        this.y = y;
        this.width = Math.round(height / gridSize) - offset * 2;
        this.height = Math.round(height / gridSize) - offset * 2;
        this.color = color;
        this.id = id; //id is x-row, y-row, grid e.g a square in the first row, second column in the grid on the right is 122
    }

    draw(ctx) {
         ctx.fillStyle = this.color;
         ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


const deltaYPos = height / (gridSize + 1); // + 1 for gap-to-edge, + 1 for side gaps
const deltaXPos = Math.min(height / (gridSize + 1), deltaYPos); 

console.log(deltaXPos + ' ' + deltaYPos);

let isDrawing = false;
ctx.imageSmoothingEnabled = false;


// (x,y) is a grid point
// (xPos, yPos) is a canvas pixel
function startDrawing() {
    draw();
}

function draw() {
    clear();
    makeSquares(0, 1);
    makeSquares(width/2, 2);
    squares.forEach(Rectangle => Rectangle.draw(ctx));
}


function clear() {
    ctx.clearRect(0, 0, width, height);
}

function makeSquares(offsetX, gridNum) { 
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const xPos = getGridStartYPos(x) + offsetX + offset;
            const yPos = getGridStartYPos(y) + offset;
            squares.push(new Rectangle(xPos, yPos, x.toString() + y.toString() + gridNum.toString(), "#5F85B5"));
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
    return {x: getGridStartXPos(x), y: getGridStartYPos(y)}
}

// startDrawing(); // for debugging

function isIntersect(p, r) {
    return (p.x >= r.x && p.x < (r.x + r.width) && p.y >= r.y && p.y < (r.y + r.height));
  }

canvas.addEventListener('click', (e) => {
    var rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    squares.forEach(Rectangle => {
      if (isIntersect(pos, Rectangle)) {
        Rectangle.color = "green";
        Rectangle.draw(ctx);
      }
    });
  });