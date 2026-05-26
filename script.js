// Simple Canvas Graphics Pipeline Demo
// ---------------------------------------------------------------
// This script implements a minimal 2‑D game that showcases the three
// classic stages of the graphics pipeline:
//   1️⃣ Application – overall game flow, UI, user interaction
//   2️⃣ Geometry    – updates to object positions, rotations, collisions
//   3️⃣ Rasterization – drawing the objects on an HTML5 canvas
// ---------------------------------------------------------------

// ----- Canvas & UI references -----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startButton');

// ----- Game state variables -----
let score = 0,
    level = 1,
    lives = 3;
let player = { x: 0, y: 0, w: 80, h: 20, speed: 7, dx: 0 };
let items = [];                     // active stars & asteroids
let gameRunning = false;
let paused = false;
let animId = null;                 // requestAnimationFrame handle

// ----- Input handling (keyboard) -----
const keys = { left: false, right: false };

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'p') togglePause();               // "p" toggles pause
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// ----- Audio helper (Web Audio API) -----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function play(type) {
  // Resume context on first interaction (required by browsers)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'catch') {               // sound for collecting a star
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  } else {                             // generic hit / miss sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
  }
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// ----- Game lifecycle helpers -----
function resetGame() {
  score = 0; level = 1; lives = 3; items = [];
  // centre the player at the bottom of the canvas
  player.x = canvas.width / 2 - player.w / 2;
  player.y = canvas.height - player.h - 10;
  updateHUD();
  gameRunning = true; paused = false;
  if (animId) cancelAnimationFrame(animId);
  loop();                              // start the animation loop
}

function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = lives;
}

function togglePause() {
  if (!gameRunning) return;          // cannot pause if the game hasn't started
  paused = !paused;
  if (!paused) loop();                // resume the loop when un‑pausing
}

// ----- Item spawning (stars & irregular asteroids) -----
function spawnItem() {
  const isAst = Math.random() < 0.3;   // 30 % chance for an asteroid
  if (isAst) {
    const r = Math.random() * 8 + 12;          // base radius
    const verts = Math.floor(Math.random() * 3) + 6; // 6‑9 vertices
    const offsets = [];
    for (let i = 0; i < verts; i++) offsets.push(0.6 + Math.random() * 0.4);
    items.push({
      type: 'asteroid',
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: -r,
      r,
      verts,
      offsets,
      speed: 2 + level * 0.3,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: '#a44'
    });
  } else {
    const r = Math.random() * 5 + 10;
    items.push({
      type: 'star',
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: -r,
      r,
      speed: 2.5 + level * 0.2,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.07,
      color: '#fd0'
    });
  }
}

// ----- Geometry stage: update positions, handle collisions -----
function update() {
  if (!gameRunning || paused) return;

  // ----- Player movement -----
  if (keys.left) player.dx = -player.speed;
  else if (keys.right) player.dx = player.speed;
  else player.dx = 0;
  player.x += player.dx;
  // keep player inside canvas bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // ----- Items update -----
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += it.speed;          // move downwards
    it.rot += it.rotSpeed;     // apply rotation

    // ----- Simple circle‑rectangle collision detection -----
    const cx = Math.max(player.x, Math.min(it.x, player.x + player.w));
    const cy = Math.max(player.y, Math.min(it.y, player.y + player.h));
    const dx = it.x - cx, dy = it.y - cy;
    if (dx * dx + dy * dy < it.r * it.r) { // collision!
      if (it.type === 'star') {
        score += 10; play('catch');
        if (score % 50 === 0) level++; // level up every 50 points
      } else { // asteroid hit
        lives--; play('hit');
        if (lives <= 0) { gameOver(); return; }
      }
      updateHUD();
      items.splice(i, 1);      // remove collided item
      continue;
    }
    // Remove items that have fallen off‑screen
    if (it.y - it.r > canvas.height) items.splice(i, 1);
  }

  // ----- Randomly spawn new items -----
  if (Math.random() < 0.015 + level * 0.003) spawnItem();
}

// ----- Rasterization stage: draw everything -----
function draw() {
  // clear previous frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background gradient (dark space -> black)
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#020828');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw each active item (star or asteroid)
  items.forEach(it => {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    ctx.fillStyle = it.color;
    if (it.type === 'star') {
      // ----- Simple 5‑point star (Rasterization) -----
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = Math.cos((i * 72 - 90) * Math.PI / 180) * it.r;
        const inner = Math.cos(((i + 0.5) * 72 - 90) * Math.PI / 180) * it.r * 0.5;
        ctx.lineTo(outer, Math.sin((i * 72 - 90) * Math.PI / 180) * it.r);
        ctx.lineTo(inner, Math.sin(((i + 0.5) * 72 - 90) * Math.PI / 180) * it.r * 0.5);
      }
      ctx.closePath();
    } else {
      // ----- Irregular polygon for an asteroid -----
      ctx.beginPath();
      for (let i = 0; i < it.verts; i++) {
        const angle = (i / it.verts) * Math.PI * 2; // polar angle for vertex i
        const r = it.r * it.offsets[i];            // radius with per‑vertex jitter
        const vx = Math.cos(angle) * r;            // x‑coord of vertex
        const vy = Math.sin(angle) * r;            // y‑coord of vertex
        if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    }
    ctx.fill();           // rasterize the shape with the chosen colour
    ctx.restore();
  });

  // ----- Player ship (simple rectangle) -----
  ctx.save();
  ctx.fillStyle = '#0af';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.restore();
}

// ----- Application logic: game over handling -----
function gameOver() {
  gameRunning = false;
  alert('Game Over! Score: ' + score);
}

// ----- Main animation loop (glue) -----
function loop() {
  if (!gameRunning || paused) return;
  update();          // Geometry stage
  draw();            // Rasterization stage
  animId = requestAnimationFrame(loop);
}

// ----- UI wiring -----
startBtn.addEventListener('click', resetGame);

// Initial draw so the canvas isn’t blank before the first click
draw();
