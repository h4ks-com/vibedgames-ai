"use strict";

// Neon City Heist - Expanded (camera follow + background music after opening the game)

// Utility
class Vec2 { constructor(x=0,y=0){ this.x=x; this.y=y; } add(v){ this.x+=v.x; this.y+=v.y; return this; } sub(v){ this.x-=v.x; this.y-=v.y; return this; } mul(s){ this.x*=s; this.y*=s; return this; } len(){ return Math.hypot(this.x,this.y);} norm(){ const l=this.len()||1; this.x/=l; this.y/=l; return this; } clone(){ return new Vec2(this.x,this.y); } }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t)=> a+(b-a)*t;
const rand = (a,b)=> Math.random()*(b-a)+a;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let VIEW_W = 0, VIEW_H = 0;
function resize(){
  VIEW_W = window.innerWidth;
  VIEW_H = window.innerHeight;
  canvas.width = VIEW_W; canvas.height = VIEW_H;
}
window.addEventListener('resize', resize);
resize();

// World
const WORLD_W = 4000;
const WORLD_H = 4000;

// Music (Web Audio API)
let audioCtx = null;
let musicStarted = false;
let bassOsc = null, leadOsc = null, musicGain = null;
let melodyTimer = null;
function startMusic(){
  if(musicStarted) return;
  musicStarted = true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.0; // start muted, fade in
    musicGain.connect(audioCtx.destination);

    bassOsc = audioCtx.createOscillator();
    leadOsc = audioCtx.createOscillator();
    bassOsc.type = 'sine';
    leadOsc.type = 'triangle';
    bassOsc.frequency.value = 110;
    leadOsc.frequency.value = 220;
    bassOsc.connect(musicGain);
    leadOsc.connect(musicGain);
    bassOsc.start();
    leadOsc.start();
    // fade in
    musicGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2.0);

    // simple melody loop
    const notes = [110, 146.83, 174.61, 196, 246.94, 261.63, 293.66, 329.63];
    let i = 0;
    melodyTimer = setInterval(() => {
      const t = audioCtx.currentTime;
      bassOsc.frequency.setValueAtTime(notes[i % notes.length], t);
      leadOsc.frequency.setValueAtTime(notes[(i+4) % notes.length], t);
      i++;
    }, 450);
  } catch(e){ console.warn('WebAudio not supported', e); }
}

// Canvas/world state
let camera = { x: 0, y: 0 };
let player = {
  pos: new Vec2(WORLD_W/2, WORLD_H/2),
  vel: new Vec2(0,0),
  angle: 0,
  color: '#00e6ff',
  width: 20,
  length: 40
};
let keys = {};
window.addEventListener('keydown', (e)=> {
  keys[e.key.toLowerCase()] = true;
  // start music on first interaction
  if(!musicStarted) {
    if(['w','a','s','d',' '].includes(e.key.toLowerCase()) ) startMusic();
  }
});
window.addEventListener('keyup', (e)=> { keys[e.key.toLowerCase()] = false; });

// UI: Start overlay
const overlay = document.getElementById('overlayStart');
const btnStart = document.getElementById('btnStart');
btnStart.addEventListener('click', ()=>{
  overlay.style.display = 'none';
  // user gesture may trigger music
  if(!musicStarted) startMusic();
});

// World helpers
function clampCamera(){
  const targetX = player.pos.x - VIEW_W/2;
  const targetY = player.pos.y - VIEW_H/2;
  camera.x = lerp(camera.x, clamp(targetX, 0, WORLD_W - VIEW_W), 0.08);
  camera.y = lerp(camera.y, clamp(targetY, 0, WORLD_H - VIEW_H), 0.08);
}

function update(dt){
  // car physics
  const accel = 0.25;
  const maxSpeed = 6;
  let accelInput = 0;
  if(keys['w']) accelInput += accel;
  if(keys['s']) accelInput -= accel*0.6;
  player.vel.x += Math.cos(player.angle) * accelInput;
  player.vel.y += Math.sin(player.angle) * accelInput;
  // friction
  player.vel.x *= 0.98;
  player.vel.y *= 0.98;
  // rotation (steering)
  if(keys['a']) player.angle -= 0.05;
  if(keys['d']) player.angle += 0.05;
  // limit speed
  const sp = Math.hypot(player.vel.x, player.vel.y);
  if(sp > maxSpeed){ player.vel.x = (player.vel.x / sp) * maxSpeed; player.vel.y = (player.vel.y / sp) * maxSpeed; }
  // update position (world bounds)
  player.pos.x = clamp(player.pos.x + player.vel.x, 0, WORLD_W);
  player.pos.y = clamp(player.pos.y + player.vel.y, 0, WORLD_H);

  // camera follows player and centers car
  clampCamera();
}

function drawBackground(){
  // simple parallax grid and buildings
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for(let x=0; x<=WORLD_W; x+=200){
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for(let y=0; y<=WORLD_H; y+=200){
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  // buildings blocks
  for(let i=0;i<20;i++){
    for(let j=0;j<20;j++){
      const x = i*200 + 50; const y = j*200 + 50;
      ctx.fillStyle = '#1a1a1f';
      ctx.fillRect(x, y, 180, 120);
      // windows
      ctx.fillStyle = 'rgba(255,230,180,0.15)';
      for(let wy=16; wy<100; wy+=20){
        for(let wx=12; wx<160; wx+=20){
          if(((i*7 + j*11 + wx + wy) % 3) === 0) ctx.fillRect(x+wx, y+wy, 6,6);
        }
      }
    }
  }
  ctx.restore();
}

function drawCar(){
  // draw car at world position, centered on screen via camera
  ctx.save();
  ctx.translate(player.pos.x, player.pos.y);
  ctx.rotate(player.angle);
  // body
  ctx.fillStyle = player.color;
  ctx.fillRect(-player.length/2, -player.width/2, player.length, player.width);
  // front highlight
  ctx.fillStyle = '#ffd966';
  ctx.fillRect(player.length/2 - 8, -4, 6, 8);
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,VIEW_W, VIEW_H);
  // sky backdrop
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#050515');
  g.addColorStop(1, '#0a0720');
  ctx.fillStyle = g; ctx.fillRect(0,0, VIEW_W, VIEW_H);

  // world content (centered by camera)
  drawBackground();
  // positioned at center of view thanks to translate in drawBackground
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  // draw player car (centered on screen via camera)
  drawCar();
  ctx.restore();
}

let lastTime = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  if(overlay.style.display !== 'none'){
    // paused until start
  } else {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Expose overlay so CSS can control visibility if needed
const overlayEl = document.getElementById('overlayStart');
overlayEl.style.display = 'flex';
