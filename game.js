// Game Constants
const ROAD_WIDTH = 2000;
const LANE_COUNT = 3;
const PLAYER_SPEED = 5;
const MAX_SPEED = 200;
const ACCELERATION = 0.2;
const DECELERATION = 0.3;
const TURN_SPEED = 0.05;

// Game State
let game = {
    canvas: null,
    ctx: null,
    player: {
        x: 0,
        y: 0,
        width: 50,
        height: 100,
        speed: 0,
        maxSpeed: MAX_SPEED,
        lane: 1,
        score: 0,
        distance: 0,
        fuel: 100
    },
    road: {
        segments: [],
        length: 0
    },
    traffic: [],
    keys: {},
    gameState: 'start', // start, playing, gameover
    lastTime: 0
};

// Initialize Game
function init() {
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Generate initial road
    generateRoad(500);
    
    // Start game loop
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Resize canvas to fit window
function resizeCanvas() {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
}

// Game Loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    if (game.gameState !== 'playing') return;
    
    // Update player
    updatePlayer(deltaTime);
    
    // Update road
    updateRoad(deltaTime);
    
    // Update traffic
    updateTraffic(deltaTime);
    
    // Update UI
    updateUI();
}

// Render game
function render() {
    const { ctx, canvas } = game;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    drawRoad();
    
    // Draw traffic
    drawTraffic();
    
    // Draw player
    drawPlayer();
}

// Player controls and movement
function updatePlayer(deltaTime) {
    const { player } = game;
    
    // Acceleration/Deceleration
    if (game.keys['ArrowUp'] && player.speed < player.maxSpeed) {
        player.speed += ACCELERATION;
    } else if (game.keys['ArrowDown'] && player.speed > 0) {
        player.speed -= DECELERATION;
    } else if (player.speed > 0) {
        // Natural deceleration
        player.speed -= 0.05;
        if (player.speed < 0) player.speed = 0;
    }
    
    // Steering
    if (game.keys['ArrowLeft'] && player.lane > 0) {
        player.lane -= TURN_SPEED;
    }
    if (game.keys['ArrowRight'] && player.lane < LANE_COUNT - 1) {
        player.lane += TURN_SPEED;
    }
    
    // Clamp lane position
    player.lane = Math.max(0, Math.min(LANE_COUNT - 1, player.lane));
    
    // Update distance
    player.distance += player.speed * 0.1;
    player.score = Math.floor(player.distance / 100);
    
    // Fuel consumption
    player.fuel -= player.speed * 0.001;
    if (player.fuel <= 0) {
        player.fuel = 0;
        gameOver();
    }
}

// Road generation and movement
function generateRoad(segmentCount) {
    game.road.segments = [];
    for (let i = 0; i < segmentCount; i++) {
        game.road.segments.push({
            curve: 0,
            y: i * 100
        });
    }
    game.road.length = segmentCount * 100;
}

function updateRoad(deltaTime) {
    // Move road segments
    for (let segment of game.road.segments) {
        segment.y -= game.player.speed;
    }
    
    // Recycle segments that go off screen
    if (game.road.segments[0].y < -100) {
        let segment = game.road.segments.shift();
        segment.y = game.road.segments[game.road.segments.length - 1].y + 100;
        game.road.segments.push(segment);
    }
}

// Traffic management
function updateTraffic(deltaTime) {
    // Randomly spawn traffic
    if (Math.random() < 0.01 && game.traffic.length < 5) {
        game.traffic.push({
            x: Math.floor(Math.random() * LANE_COUNT),
            y: -100,
            speed: game.player.speed * (0.8 + Math.random() * 0.4)
        });
    }
    
    // Update traffic positions
    for (let i = game.traffic.length - 1; i >= 0; i--) {
        let car = game.traffic[i];
        car.y += car.speed;
        
        // Remove cars that are off screen
        if (car.y > game.canvas.height + 100) {
            game.traffic.splice(i, 1);
        }
        
        // Check collisions
        if (checkCollision(game.player, car)) {
            gameOver();
        }
    }
}

// Collision detection
function checkCollision(player, car) {
    // Simple bounding box collision
    return Math.abs(player.lane - car.x) < 0.8 && 
           Math.abs(player.y - car.y) < 50;
}

// Drawing functions
function drawRoad() {
    const { ctx, canvas } = game;
    
    // Draw road background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw lanes
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    
    for (let i = 0; i <= LANE_COUNT; i++) {
        const x = (canvas.width / LANE_COUNT) * i;
        ctx.beginPath();
        ctx.setLineDash([50, 50]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function drawPlayer() {
    const { ctx, canvas, player } = game;
    
    const laneWidth = canvas.width / LANE_COUNT;
    const x = (player.lane + 0.5) * laneWidth - player.width / 2;
    const y = canvas.height - player.height - 20;
    
    // Draw car
    ctx.fillStyle = '#f00';
    ctx.fillRect(x, y, player.width, player.height);
    
    // Store player position for collision detection
    player.x = x;
    player.y = y;
}

function drawTraffic() {
    const { ctx, canvas } = game;
    
    for (let car of game.traffic) {
        const laneWidth = canvas.width / LANE_COUNT;
        const x = (car.x + 0.5) * laneWidth - 25;
        
        // Draw traffic car
        ctx.fillStyle = '#00f';
        ctx.fillRect(x, car.y, 50, 100);
    }
}

// UI functions
function updateUI() {
    document.querySelector('#hud .speed span').textContent = Math.floor(game.player.speed);
    document.querySelector('#hud .distance span').textContent = Math.floor(game.player.distance);
    document.querySelector('#hud .fuel span').textContent = Math.floor(game.player.fuel);
    document.querySelector('#hud .score span').textContent = game.player.score;
}

// Game state management
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    game.gameState = 'playing';
    resetGame();
}

function gameOver() {
    game.gameState = 'gameover';
    alert(`Game Over! Your score: ${game.player.score}`);
    resetGame();
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
}

function resetGame() {
    game.player = {
        x: 0,
        y: 0,
        width: 50,
        height: 100,
        speed: 0,
        maxSpeed: MAX_SPEED,
        lane: 1,
        score: 0,
        distance: 0,
        fuel: 100
    };
    game.traffic = [];
    generateRoad(500);
}

// Input handling
function handleKeyDown(e) {
    game.keys[e.key] = true;
}

function handleKeyUp(e) {
    game.keys[e.key] = false;
}

// Start the game
window.onload = init;