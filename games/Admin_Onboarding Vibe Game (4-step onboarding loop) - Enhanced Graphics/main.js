(function(){
  'use strict';

  // Enhanced in-browser admin onboarding with 4-step loop and enhanced graphics
  const STORAGE_KEY = 'adminOnboarder_v2';

  const defaultState = {
    users: [], // { id, email, displayName, passwordHash, isAdmin, createdAt, updatedAt, status }
    onboarding: { step: 1, startedAt: Date.now(), completedAt: null },
    currentUserId: null,
    badges: [], // { id, userId, badgeId, name, issuedAt }
    audits: [] // { actorId, action, targetId, timestamp }
  };

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    } catch(e){ /* ignore */ }
    return JSON.parse(JSON.stringify(defaultState));
  }

  function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function hashPassword(pw){ return 'H-'+btoa(pw); }
  function verifyPassword(pw, hash){ return hash === hashPassword(pw); }

  function uid(){ return 'u_'+Math.random().toString(36).slice(2,9); }
  function findUserByEmail(state, email){ return state.users.find(u => u.email.toLowerCase() === (email||'').toLowerCase()); }
  function getAdminUsers(state){ return state.users.filter(u => u.isAdmin); }

  function badgeTemplate(){ return { id: 'onboard_complete', name: 'Onboarding Complete', description: 'Unlocked after completing the onboarding loop', color: '#2e7d32' }; }

  function addUser(state, email, name, password, isAdmin=false){
    const user = {
      id: uid(),
      email: (email||'').toLowerCase(),
      displayName: name,
      passwordHash: hashPassword(password),
      isAdmin: Boolean(isAdmin),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active'
    };
    state.users.push(user);
    return user;
  }

  function awardBadge(state, userId, template){
    const exists = state.badges.find(b => b.userId===userId && b.badgeId===template.id);
    if(exists) return exists;
    const entry = { id: 'badge_inst_'+(state.badges.length+1), userId, badgeId: template.id, name: template.name, issuedAt: Date.now() };
    state.badges.push(entry);
    return entry;
  }

  function computeSharePayload(userId, badgeId){
    const payload = { userId, badgeId, timestamp: Date.now() };
    return btoa(JSON.stringify(payload));
  }
  function decodeSharePayload(b64){ try{ return JSON.parse(atob(b64)); } catch(e){ return null; } }
  function generateShareURL(payloadB64){ return location.origin + location.pathname + '#/share?payload=' + encodeURIComponent(payloadB64); }

  function avatarSVG(name, color){
    const initials = (name||'G').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
    const c = color || '#4a90e2';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" aria-label="avatar for ${name}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c}" offset="0"/><stop stop-color="#6fa8dc" offset="1"/></linearGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)"/>
      <text x="32" y="38" text-anchor="middle" font-family="Arial" font-size="20" fill="#fff" font-weight="bold">${initials}</text>
    </svg>`; }

  function generateBadgeSVG(userName, badgeName, dateString){
    const safeName = (userName||'User').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="480" height="480" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#7c5cff" offset="0%"/>
      <stop stop-color="#22d3ee" offset="100%"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0b1020" rx="20" ry="20"/>
  <circle cx="240" cy="180" r="120" fill="url(#grad)" opacity="0.9"/>
  <text x="240" y="315" font-family="Arial" font-size="28" text-anchor="middle" fill="#e2e8f0">${badgeName}</text>
  <text x="240" y="350" font-family="Arial" font-size="20" text-anchor="middle" fill="#cbd5e1">Awarded to ${safeName}</text>
  <text x="240" y="385" font-family="Arial" font-size="16" text-anchor="middle" fill="#93c5fd">${dateString}</text>
</svg>`;
    return svg;
  }

  function render(){ const state = loadState(); renderStepper(state); renderContent(state); }

  function renderStepper(state){
    const stepper = document.getElementById('stepper'); if(!stepper) return;
    const adminCount = getAdminUsers(state).length;
    const steps = [
      {id:1,label:'Login', done: Boolean(state.currentUserId && adminCount>0)},
      {id:2,label:'Create first user', done: state.users.length>0},
      {id:3,label:'Grant admin', done: getAdminUsers(state).length>0 && state.users.length>0 && state.users.find(u=>u.isAdmin)},
      {id:4,label:'Unlock shareable badge', done: Boolean(state.badges.find(b => b.badgeId==='onboard_complete'))}
    ];
    let html = '<ul class="step-list" role="list">';
    for(const s of steps){ html += `<li class="step ${s.done?'done':''}" aria-label="${s.label}">${s.label} <span class="dot" aria-hidden="true"></span></li>`; }
    html += '</ul>';
    stepper.innerHTML = html;
  }

  function renderContent(state){
    const content = document.getElementById('content');
    if(!content) return;
    if(location.hash && location.hash.startsWith('#/share')){
      const payloadB64 = new URLSearchParams(location.hash.split('?')[1]).get('payload');
      const payload = payloadB64 ? decodeSharePayload(payloadB64) : null;
      if(payload){ renderSharePage(state, payload); return; }
    }
    const step = state.onboarding?.step ?? 1;
    let html = '';
    if(step === 1){ html = renderLoginStep(state); }
    else if(step === 2){ html = renderCreateFirstUserStep(state); }
    else if(step === 3){ html = renderGrantAdminStep(state); }
    else if(step === 4){ html = renderUnlockBadgeStep(state); }
    else { html = '<p>Onboarding complete. You may restart to try again.</p><button id="restartBtn" class="cta">Restart</button>'; }
    content.innerHTML = html;
    attachContentHandlers(state);
  }

  // Step 1: Login
  function renderLoginStep(state){
    const adminUsers = state.users.filter(u => u.isAdmin);
    const loggedIn = Boolean(state.currentUserId);
    const current = state.users.find(u => u.id === state.currentUserId);
    let html = `<section aria-labelledby="login-title" class="step-panel"><h2 id="login-title" class="step-title">Login</h2>`;
    if(adminUsers.length === 0){
      html += `<p class="hint">No admins exist yet. Create the first admin in Step 2 to begin onboarding.</p>`;
      html += `<button id="startOnboarding" class="cta" aria-label="Go to Step 2">Start onboarding</button>`;
    } else {
      if(loggedIn && current){
        html += `<div class="avatar-wrap" style="display:inline-block;vertical-align:middle;margin-right:8px;">${avatarSVG(current.displayName, '#6d28d9')}</div>`;
        html += `<p>Logged in as ${current.displayName} (${current.email})</p>`;
      }
      html += `<form id="loginForm" aria-label="Login form">
                 <label>Email: <input type="email" id="loginEmail" required></label>
                 <label>Password: <input type="password" id="loginPw" required></label>
                 <button type="submit">Login</button>
               </form>`;
    }
    html += `</section>`;
    return html;
  }

  function renderCreateFirstUserStep(state){
    const html = `<section aria-labelledby="title-create" class="step-panel">
      <h2 id="title-create" class="step-title">Create first user</h2>
      <div class="avatar-wrap" style="display:inline-block;margin-bottom:6px;">${avatarSVG('New User', '#f59e0b')}</div>
      <form id="createUserForm" aria-label="Create first user form">
        <label>Email: <input type="email" id="newUserEmail" required></label>
        <label>Name: <input type="text" id="newUserName" required></label>
        <label>Password: <input type="password" id="newUserPw" required></label>
        <label>Role:
          <select id="newUserRole" aria-label="Role select">
            <option value="USER" selected>User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label>Auto-assign first user as admin:
          <input type="checkbox" id="autoAdmin" checked>
        </label>
        <button type="submit">Create user</button>
      </form>
    </section>`;
    return html;
  }

  function renderGrantAdminStep(state){
    const nonAdmins = state.users.filter(u => !u.isAdmin);
    const options = nonAdmins.map(u => `<option value="${u.id}">${u.displayName} (${u.email})</option>`).join('');
    const html = `<section aria-labelledby="title-grant" class="step-panel">
      <h2 id="title-grant" class="step-title">Grant admin</h2>
      ${nonAdmins.length>0 ? `
        <div class="avatar-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
          ${nonAdmins.map(u => `<div class="avatar-wrap" title="${u.displayName}">${avatarSVG(u.displayName, '#93c5fd')}</div>`).join('')}
        </div>
        <label>Select user to grant admin:
          <select id="grantUserSelect" aria-label="User to grant admin">${options}</select>
        </label>
        <button id="grantBtn" class="cta" aria-label="Grant admin">Grant admin</button>`:
        `<p>No non-admin users available.</p>`}
    </section>`;
    return html;
  }

  function renderUnlockBadgeStep(state){
    const template = badgeTemplate();
    const admins = state.users.filter(u => u.isAdmin);
    const admin = admins[0];
    const isAwarded = admin && state.badges.find(b => b.userId===admin.id && b.badgeId===template.id);
    let badgePreview = '';
    if(admin && isAwarded){
      const date = new Date(state.badges.find(b => b.userId===admin.id && b.badgeId===template.id).issuedAt).toLocaleDateString();
      badgePreview = `<div class="badge-preview" aria-label="Badge preview" style="width:240px; display:inline-block; margin-right:12px; vertical-align:top;">
        ${avatarSVG(admin.displayName, '#34d399')}
        <div>${template.name} • ${date}</div>
      </div>`;
    }
    const shareSection = admin && isAwarded ? (function(){
      const payload = computeSharePayload(admin.id, template.id);
      const url = generateShareURL(payload);
      return `<div class="share-actions" aria-label="Share actions" style="margin-top:8px;">
        <p class="hint">Shareable badge</p>
        <input id="shareURL" class="input" value="${url}" readonly />
        <button id="copyShareBtn" class="cta" style="margin-top:6px;" aria-label="Copy share URL" data-url="${url}">Copy</button>
        <a href="${url}" target="_blank" rel="noopener" class="cta" style="margin-left:8px;">Open share page</a>
      </div>`;
    })() : '';
    const html = `<section aria-labelledby="title-unlock" class="step-panel">
      <h2 id="title-unlock" class="step-title">Unlock shareable badge</h2>
      ${badgePreview}
      ${shareSection}
    </section>`;
    return html;
  }

  function renderSharePage(state, payload){
    const user = state.users.find(u => u.id === payload.userId);
    const date = payload.timestamp ? new Date(payload.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
    const badgeName = 'Onboarding Complete';
    const badgeSVG = generateBadgeSVG(user?.displayName || 'User', badgeName, date);
    const contentHTML = `<section aria-labelledby="share-title" class="step-panel">
      <h2 id="share-title" class="step-title">Shareable badge</h2>
      <div class="share-preview" style="display:flex;gap:16px;align-items:flex-start;">
        <div style="width:320px;border:1px solid #ccc;padding:8px; background:#fff;">${badgeSVG}</div>
        <div>
          <p>Awarded to: ${user?.displayName ?? 'Unknown'} (${user?.email ?? ''})</p>
          <p>Date: ${date}</p>
          <p>Badge: ${badgeName}</p>
          <p>Payload timestamp: ${payload.timestamp}</p>
          <button id="backButton" class="cta" aria-label="Back to onboarding">Back to onboarding</button>
        </div>
      </div>
    </section>`;
    const content = document.getElementById('content');
    content.innerHTML = contentHTML;
    const backBtn = document.getElementById('backButton');
    if(backBtn){ backBtn.addEventListener('click', ()=>{ location.hash=''; render(); }); }
  }

  function attachContentHandlers(state){
    const loginForm = document.getElementById('loginForm');
    if(loginForm){ loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pw = document.getElementById('loginPw').value;
      const user = state.users.find(u => u.email.toLowerCase() === (email||'').toLowerCase());
      if(!user){ alert('No user found with that email.'); return; }
      if(!verifyPassword(pw, user.passwordHash)){ alert('Incorrect password.'); return; }
      if(!user.isAdmin){ alert('User is not an admin.'); return; }
      state.currentUserId = user.id; saveState(state);
      state.onboarding.step = Math.max(state.onboarding.step, 2); render();
    }); }

    const startOnboarding = document.getElementById('startOnboarding');
    if(startOnboarding){ startOnboarding.addEventListener('click', ()=>{ state.onboarding.step = 2; saveState(state); render(); }); }

    const createUserForm = document.getElementById('createUserForm');
    if(createUserForm){ createUserForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('newUserEmail').value;
      const name = document.getElementById('newUserName').value;
      const pw = document.getElementById('newUserPw').value;
      const role = document.getElementById('newUserRole').value;
      const autoAdmin = document.getElementById('autoAdmin').checked;
      if(findUserByEmail(state, email)){ alert('Email already exists.'); return; }
      if(!pw || pw.length < 6){ alert('Password must be at least 6 characters.'); return; }
      const user = addUser(state, email, name, pw, role === 'ADMIN');
      // If this is the first user and autoAdmin, grant admin
      if(state.users.length === 1 && autoAdmin){ user.isAdmin = true; }
      saveState(state);
      state.onboarding.step = 3; render();
    }); }

    const grantBtn = document.getElementById('grantBtn');
    if(grantBtn){ grantBtn.addEventListener('click', ()=>{
      const select = document.getElementById('grantUserSelect');
      const userId = select?.value; const u = state.users.find(x => x.id === userId);
      if(u){ u.isAdmin = true; saveState(state); state.onboarding.step = 4; render(); }
    }); }

    const copyShareBtn = document.getElementById('copyShareBtn');
    if(copyShareBtn){ copyShareBtn.addEventListener('click', ()=>{
      const url = copyShareBtn.getAttribute('data-url'); navigator.clipboard.writeText(url).then(()=> alert('Share URL copied!')).catch(()=> alert('Could not copy URL'));
    }); }

    const restartBtn = document.getElementById('restartBtn');
    if(restartBtn){ restartBtn.addEventListener('click', ()=>{ localStorage.removeItem(STORAGE_KEY); location.reload(); }); }

    const backBtn = document.getElementById('backButton');
    if(backBtn){ backBtn.addEventListener('click', ()=>{ location.hash=''; render(); }); }
  }

  window.addEventListener('hashchange', ()=>{ render(); });

  function renderLoginStepTab(){ /* kept for parity if needed */ }

  // Seed helpers (optional, can be used in future)
  function bootstrap(){ /* no-op for now; users seeded via UI */ }

  document.addEventListener('DOMContentLoaded', ()=>{ bootstrap(); render(); });

})();