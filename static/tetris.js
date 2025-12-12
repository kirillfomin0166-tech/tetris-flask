// ----------------------
//      З В У К И
// ----------------------
let soundEnabled = true;

const sounds = {
    move:     new Audio("/static/sounds/move.wav"),
    rotate:   new Audio("/static/sounds/rotate.wav"),
    drop:     new Audio("/static/sounds/drop.wav"),
    line:     new Audio("/static/sounds/line.wav"),
    gameover: new Audio("/static/sounds/gameover.wav")
};

function playSound(s) {
    if (soundEnabled) {
        sounds[s].currentTime = 0;
        sounds[s].play();
    }
}

document.getElementById("soundToggle").onclick = () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundToggle").textContent =
        soundEnabled ? "🔊 Звук" : "🔇 Без звука";
};


// ----------------------
//  ЦВЕТА ФИГУР
// ----------------------
const colors = [
    null,
    "#FF0D72", // T
    "#0DC2FF", // I
    "#0DFF72", // S
    "#F538FF", // Z
    "#FF8E0D", // L
    "#FFE138", // O
    "#3877FF"  // J
];


// ----------------------
//  ОСНОВНОЙ CANVAS
// ----------------------
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

context.scale(20, 20);


// ----------------------
//  NEXT CANVAS
// ----------------------
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
nextCtx.scale(20, 20);


// ----------------------
//  ИГРА
// ----------------------

function arenaCreate(w, h) {
    return Array.from({ length: h }, () => Array(w).fill(0));
}

const arena = arenaCreate(12, 20);

const pieces = "TJLOSZI";

function createPiece(type) {
    if (type === "T") return [[0,1,0],[1,1,1],[0,0,0]];
    if (type === "O") return [[2,2],[2,2]];
    if (type === "L") return [[0,0,3],[3,3,3],[0,0,0]];
    if (type === "J") return [[4,0,0],[4,4,4],[0,0,0]];
    if (type === "I") return [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]];
    if (type === "S") return [[0,6,6],[6,6,0],[0,0,0]];
    if (type === "Z") return [[7,7,0],[0,7,7],[0,0,0]];
}

function collide(arena, player) {
    for (let y = 0; y < player.matrix.length; y++) {
        for (let x = 0; x < player.matrix[y].length; x++) {
            if (player.matrix[y][x] !== 0 &&
                (arena[y + player.pos.y] &&
                 arena[y + player.pos.y][x + player.pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++)
        for (let x = 0; x < y; x++)
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];

    if (dir > 0) matrix.forEach(row=>row.reverse());
    else matrix.reverse();
}

let score = 0;
let best = localStorage.getItem("best") || 0;
document.getElementById("best").textContent = best;

function updateScore() {
    document.getElementById("score").textContent = score;
    if (score > best) {
        best = score;
        localStorage.setItem("best", best);
        document.getElementById("best").textContent = best;
    }
}

function sweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; y--) {

        for (let x = 0; x < arena[y].length; x++)
            if (arena[y][x] === 0) continue outer;

        arena.splice(y, 1);
        arena.unshift(new Array(12).fill(0));
        y++;

        score += rowCount * 10;
        rowCount *= 2;

        playSound("line");
    }
    updateScore();
}

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    next: null
};

function playerReset() {
    player.matrix = player.next || createPiece(randomPiece());
    player.next = createPiece(randomPiece());
    player.pos.y = 0;
    player.pos.x = (12 / 2 | 0) - (player.matrix[0].length / 2 | 0);

    drawNext();

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        playSound("gameover");
    }
}

function randomPiece() {
    return pieces[(pieces.length * Math.random()) | 0];
}

function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, 12, 20);

    drawMatrix(arena, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawNext() {
    nextCtx.fillStyle = "#000";
    nextCtx.fillRect(0, 0, 4, 4);

    drawMatrix(player.next, {x: 0, y: 0}, nextCtx);
}

let lastTime = 0;
let dropCounter = 0;
let dropInterval = 500;

function update(time = 0) {
    const dt = time - lastTime;
    lastTime = time;

    dropCounter += dt;
    if (dropCounter > dropInterval) {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            sweep();
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}


// ----------------------
//   КЛАВИАТУРА
// ----------------------
document.addEventListener("keydown", e => {

    if (e.key === "ArrowLeft") {
        player.pos.x--;
        if (collide(arena, player)) player.pos.x++;
        else playSound("move");

    } else if (e.key === "ArrowRight") {
        player.pos.x++;
        if (collide(arena, player)) player.pos.x--;
        else playSound("move");

    } else if (e.key === "ArrowDown") {
        player.pos.y++;
        if (collide(arena, player)) player.pos.y--; // БЕЗ ЗВУКА

    } else if (e.key === "ArrowUp") {
        rotate(player.matrix, 1);
        if (collide(arena, player)) rotate(player.matrix, -1);
        else playSound("rotate");
    }
});


// ----------------------
//   МОБИЛЬНЫЕ КНОПКИ
// ----------------------
function mobileLeft() {
    player.pos.x--;
    if (collide(arena, player)) player.pos.x++;
    else playSound("move");
}

function mobileRight() {
    player.pos.x++;
    if (collide(arena, player)) player.pos.x--;
    else playSound("move");
}

function mobileDown() {
    player.pos.y++;
    if (collide(arena, player)) player.pos.y--; // БЕЗ ЗВУКА
}

function mobileRotate() {
    rotate(player.matrix, 1);
    if (collide(arena, player)) rotate(player.matrix, -1);
    else playSound("rotate");
}

playerReset();
update();
