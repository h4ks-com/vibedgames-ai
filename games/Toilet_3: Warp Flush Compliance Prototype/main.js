// Toilet 3: Warp Flush Compliance Prototype
// Minimal playable teaser entry point
(() => {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  ctx.fillStyle = '#111'; ctx.fillRect(0,0, canvas.width, canvas.height);
})();