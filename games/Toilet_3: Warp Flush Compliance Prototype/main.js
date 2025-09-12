// Toilet 3: Warp Flush - Compliance Prototype (improved)
(() => {
  // Wait for DOM ready before wiring up
  document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup with DPR awareness for crisp visuals
    const canvas = document.getElementById('scene');
    const ctx = canvas.getContext('2d');
    const W = 1024;
    const H = 640;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    function resizeCanvas(){
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      // scale drawing coordinates so we can use logical px
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Captain panel
    const captainCaption = document.getElementById('captainCaption');

    // Controls
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');

    // HUD and germs
    let germs = [];
    const GAS_SPRAY_RANGE = 90; // interaction radius for germ spray
    let sprayActive = false;

    // Player
    const player = { x: 60, y: 60, r: 8, speed: 120 };
    const keys = {};
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; // allow arrow keys and WASD
      if (e.key === ' '){ e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    // Drain / clog (simple progression)
    const drain = { x: W - 120, y: H - 100, radius: 40, clog: 60, present: true };

    // 72 compliance tasks (auto-generated)
    const tasksContainer = document.getElementById('taskList');
    const owners = ['Alex','Rin','Sam','Jordan','Priya','Kai'];
    const tasks = [];
    const sections = [
      { prefix: '1.1-1.7', count: 7, base: 'Compliance and scope' },
      { prefix: '2.1-2.12', count: 12, base: 'Game Design Document (GDD)' },
      { prefix: '3.1-3.10', count: 10, base: 'Core technology & architecture' },
      { prefix: '4.1-4.11', count: 11, base: 'Art direction & asset pipeline' },
      { prefix: '5.1-5.16', count: 16, base: 'Audio and interactive props' },
      { prefix: '6.1-6.10', count: 10, base: 'Core gameplay systems' },
      { prefix: '7.1-7.6', count: 6, base: 'Level design & production' }
    ];

    function generateTasks(){
      tasks.length = 0;
      let id = 1;
      for (const sec of sections){
        for (let i = 1; i <= sec.count; i++){
          const due = new Date(2025, 0, 1 + id).toISOString().slice(0, 10);
          tasks.push({ id: id, code: sec.prefix.split('-')[0] + '.' + i, title: sec.prefix + ' - ' + sec.base + ' Task ' + i, owner: owners[(id - 1) % owners.length], due, status: 'Open' });
          id++;
        }
      }
    }

    function renderTasks(){
      tasksContainer.innerHTML = '';
      for (const t of tasks){
        const row = document.createElement('div');
        row.className = 'task-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = t.status === 'Done';
        cb.disabled = t.status === 'Done';
        cb.addEventListener('change', () => {
          if (cb.checked){ t.status = 'Done'; cb.disabled = true; captainCaption.textContent = 'Captain Ardent: Task ' + t.id + ' completed.'; row.style.opacity = '0.6'; }
        });
        const label = document.createElement('span');
        label.textContent = t.title + ' (Owner: ' + t.owner + ', Due: ' + t.due + ')';
        const meta = document.createElement('span');
        meta.textContent = ' [' + t.status + ']';
        meta.style.marginLeft = 'auto';
        row.appendChild(cb);
        row.appendChild(label);
        row.appendChild(meta);
        tasksContainer.appendChild(row);
      }
    }

    function captainSay(text){ captainCaption.textContent = 'Captain Ardent: ' + text; }

    function spawnGerms(n = 8){ germs = []; for (let i = 0; i < n; i++){ germs.push({ x: 100 + Math.random() * (W - 200), y: 100 + Math.random() * (H - 200), r: 6 + Math.random() * 6, health: 1.0, alive: true }); } }

    function resetScene(){
      player.x = 60; player.y = 60; spawnGerms(); drain.clog = 60; drain.present = true; score = 0; captainSay('Scene reset. Engines ready.');
      // re-render tasks as open again for a new run
      for (const t of tasks){ t.status = 'Open'; }
      renderTasks();
    }

    let score = 0;

    function update(dt){
      let vx = 0, vy = 0;
      if (keys['a'] || keys['arrowleft']) vx -= 1;
      if (keys['d'] || keys['arrowright']) vx += 1;
      if (keys['w'] || keys['arrowup']) vy -= 1;
      if (keys['s'] || keys['arrowdown']) vy += 1;
      if (vx || vy){ const m = Math.hypot(vx, vy); vx /= m; vy /= m; player.x += vx * player.speed * dt; player.y += vy * player.speed * dt; }
      // clamp to stage bounds
      player.x = Math.max(20, Math.min(W - 20, player.x));
      player.y = Math.max(20, Math.min(H - 20, player.y));

      if (sprayActive){
        for (const g of germs){
          const dx = g.x - player.x; const dy = g.y - player.y; const d = Math.hypot(dx, dy);
          if (d < GAS_SPRAY_RANGE && g.alive){ g.health -= 0.8; if (g.health <= 0){ g.alive = false; score += 2; captainSay('Germ neutralized. Cleanliness improved.'); } }
        }
      }
      germs = germs.filter(g => g.alive);
      if (germs.length === 0){ captainSay('All germs cleared. Ready for warp sequence.'); }
    }

    let last = performance.now();
    let running = false;
    function loop(now){
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (running){ update(dt); render(); }
      requestAnimationFrame(loop);
    }

    function render(){
      // clear
      ctx.clearRect(0, 0, W, H);
      // sky backdrop
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#d5f0ff');
      sky.addColorStop(1, '#a6d0f0');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // cabin walls / panel backdrop
      ctx.fillStyle = '#e5f0f7'; ctx.fillRect(40, 40, W - 80, H - 120);
      // subtle grid lines
      ctx.fillStyle = 'rgba(0,0,0,0.04)'; for (let y = 60; y < H - 100; y += 14){ ctx.fillRect(60, y, W - 120, 2); }
      // drain model
      ctx.fillStyle = '#7b7b8a'; ctx.beginPath(); ctx.arc(drain.x, drain.y, drain.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa'; ctx.beginPath(); ctx.arc(drain.x, drain.y, drain.radius * 0.8, 0, Math.PI * 2); ctx.fill();
      // germs visuals
      germs.forEach(g => {
        const grad = ctx.createRadialGradient(g.x - g.r/2, g.y - g.r/2, g.r * 0.2, g.x, g.y, g.r);
        grad.addColorStop(0, '#8df0a8'); grad.addColorStop(1, '#2e8f3f');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
        // subtle shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(g.x - g.r, g.y - g.r - 6, g.r * 2, 4);
      });
      // player shipmate – capsule walker
      ctx.fillStyle = '#2b6bd9'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      // warp range indicator
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(player.x, player.y, GAS_SPRAY_RANGE, 0, Math.PI * 2); ctx.stroke();
    }

    // input listeners for interaction
    canvas.addEventListener('mousedown', () => { sprayActive = true; });
    window.addEventListener('mouseup', () => { sprayActive = false; });
    window.addEventListener('keydown', e => { if (e.code === 'Space'){ sprayActive = true; e.preventDefault(); } });
    window.addEventListener('keyup', e => { if (e.code === 'Space'){ sprayActive = false; } });

    // Init tasks and UI
    generateTasks(); renderTasks();
    let simStarted = false;

    const ensureStart = () => {
      if (!simStarted){ simStarted = true; running = true; captainSay('Warp Flush sequence engaged.'); }
    };

    // Wire controls
    startBtn.addEventListener('click', () => { ensureStart(); });
    resetBtn.addEventListener('click', () => { resetScene(); captainCaption.textContent = 'Captain Ardent: Reset complete. Systems nominal.'; });

    // Persist/resume loop and visibility handling
    function onVisibilityChange(){ if (document.hidden){ running = false; } else { if (simStarted) { running = true; captainSay('Resuming warp sequence.'); } } }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Startup
    resetScene(); captainSay('Captain Ardent reporting: systems nominal.');
    requestAnimationFrame(loop);

  }); // DOMContentLoaded
})();