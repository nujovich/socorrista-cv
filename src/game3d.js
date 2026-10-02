/* ===== Simulación 3D en primera persona: rescate, extracción y primeros auxilios =====
   Three.js r128. Geometría y texturas generadas en el propio código (sin assets externos).
   createGame(api) → { render(root, arg), stop(), scenario(id) } */

function createGame(api) {
  'use strict';
  const { L, esc, UI, CASES, flagHtml, record, progress } = api;
  const G = UI.game;

  /* ---------- escenarios ---------- */
  const SCEN = [
    { id: 'g-pis-ahog4', caseId: 'pis-ahog4', map: 'pool', victim: { conscious: false, breathing: false }, pa: 'pcr', drowning: true },
    { id: 'g-pis-convuls', caseId: 'pis-convuls', map: 'pool', victim: { conscious: false, breathing: true, convulsing: 40 }, pa: 'decisions', vpos: [1.6, -10] },
    { id: 'g-pla-ahog2', caseId: 'pla-ahog2', map: 'beach', rip: true, female: true, victim: { conscious: true, panic: true }, pa: 'decisions' },
    { id: 'g-pla-lm', caseId: 'pla-lm-romp', map: 'beach', victim: { conscious: false, breathing: false, lm: true }, pa: 'pcr', drowning: true, cervical: true, sand: true }
  ];
  const scenById = (id) => SCEN.find((s) => s.id === id);
  const caseOf = (sc) => CASES.find((c) => c.id === sc.caseId);

  /* ---------- mundo (metros) ---------- */
  const POOL = { x0: -6.25, x1: 6.25, z0: -25, z1: 0 };
  const POOL_WY = -0.22;
  const RIP = { x0: 6, x1: 14 };
  const BOUNDS = { pool: { x0: -15, x1: 11, z0: -31, z1: 5 }, beach: { x0: -40, x1: 40, z0: -75, z1: 24 } };
  const SKIN_ME = '#D9A27C';

  /* ---------- estado ---------- */
  let root = null, canvas = null, renderer = null, scene = null, camera = null, raf = 0, last = 0, running = false, wt = 0;
  let O = {}, UPV = null, ray = null;
  let st = null;
  const keys = {};
  const joy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
  const look = { id: null, x: 0, y: 0 };
  let onResize = null;

  function newState(sc) {
    sc.victim = sc.victim || {};
    const pool = sc.map === 'pool';
    const s = {
      sc, phase: 'play', t: 0, msg: [], wrong: 0, crit: [], paused: false,
      signalAt: null, partnerAt: null, desaAt: null, partnerHere: false, desaHere: false,
      hasTube: false, inWater: false, entered: false, contact: false, towing: false, extracted: false,
      grabbedUntil: 0, holdUntil: 0, firstVentAt: null, o2Zero: false, extractCooldown: 0, entryAnim: 0,
      player: pool ? { x: -9, z: -3 } : { x: 0, z: 15 }, yaw: 0, pitch: -0.06, walk: 0, swim: 0,
      victim: { x: 0, z: 0, o2: 72, fatigue: 100, temp: 100, conscious: !!sc.victim.conscious, breathing: !!sc.victim.breathing, convulsing: sc.victim.convulsing || 0, faceUp: false },
      tube: pool ? { x: -8.3, z: -4.7, taken: false } : { x: 1.3, z: 13.6, taken: false },
      cpr: null, result: null, pa: null, handT: null
    };
    const vp = sc.vpos || (pool ? [2.4, -20] : (sc.rip ? [10, -28] : [-4, -9]));
    s.victim.x = vp[0]; s.victim.z = vp[1];
    if (sc.victim.conscious) s.victim.o2 = 95;
    s.yaw = Math.atan2(-(s.victim.x - s.player.x), -(s.victim.z - s.player.z));
    return s;
  }

  /* ---------- utilidades ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const sm = (a) => { a = clamp(a, 0, 1); return a * a * (3 - 2 * a); };
  const lerpAngle = (a, b, k) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * k; };
  const dxz = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const say = (txt, kind) => { st.msg.unshift({ t: st.t, txt, kind: kind || '' }); st.msg = st.msg.slice(0, 4); updateLog(); };
  const fmt = (sec) => { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; };
  function markWrong() { st.wrong += 1; }
  function markCrit(text) { st.crit.push(text); }
  const isPool = () => st.sc.map === 'pool';
  function isWaterXZ(x, z) { return isPool() ? (x > POOL.x0 && x < POOL.x1 && z > POOL.z0 && z < POOL.z1) : z < 0; }
  function inRip(x, z) { return !!st.sc.rip && z < 0 && x > RIP.x0 && x < RIP.x1; }
  function edgeDist(x, z) { return Math.min(x - POOL.x0, POOL.x1 - x, z - POOL.z0, POOL.z1 - z); }
  function waveH(x, z, t) {
    if (isPool()) return POOL_WY + 0.018 * Math.sin(x * 1.3 + t * 1.4) * Math.cos(z * 1.1 + t * 0.9) + 0.006 * Math.sin(x * 4.1 + z * 3.3 + t * 3);
    const near = clamp(1 + z / 25, 0.25, 1);
    return 0.11 * Math.sin(z * 0.38 + t * 1.6) * near + 0.05 * Math.sin(x * 0.45 + t * 1.1) + 0.03 * Math.sin((x + z) * 0.9 + t * 2.3);
  }
  const fwdVec = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function guard(fn) { const ref = st; return () => { if (st === ref && renderer) fn(); }; }
  function later(sec, fn) { setTimeout(guard(fn), sec * 1000); }

  /* ---------- bucle ---------- */
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; wt += dt;
    if (st.phase === 'play' && !st.paused) update(dt);
    if (st.phase === 'pa') arrivals();
    updateHud();
    animate(dt);
    if (running) raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    const s = st, p = s.player, v = s.victim, sc = s.sc;
    s.t += dt;
    if (s.entryAnim > 0) s.entryAnim = Math.max(0, s.entryAnim - dt);
    arrivals();
    let fwd = 0, strafe = 0, turn = 0;
    if (keys.KeyW || keys.ArrowUp) fwd += 1;
    if (keys.KeyS || keys.ArrowDown) fwd -= 1;
    if (keys.KeyA) strafe -= 1;
    if (keys.KeyD) strafe += 1;
    if (keys.ArrowLeft || keys.KeyQ) turn += 1;
    if (keys.ArrowRight) turn -= 1;
    if (joy.active) { fwd += -joy.dy; strafe += joy.dx; }
    s.yaw += turn * 1.9 * dt;
    const len = Math.hypot(fwd, strafe); if (len > 1) { fwd /= len; strafe /= len; }
    const frozen = s.t < s.grabbedUntil || s.t < s.holdUntil || s.entryAnim > 0;
    let speed = 4.2;
    if (s.inWater) {
      const wade = !isPool() && p.z > -4;
      speed = s.towing ? (s.hasTube ? (isPool() ? 0.85 : 1.05) : 0.6) : (wade ? 2.2 : (s.hasTube ? 1.35 : 1.25));
    }
    if (!frozen && (fwd || strafe)) {
      const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
      let nx = p.x + (-sy * fwd + cy * strafe) * speed * dt;
      let nz = p.z + (-cy * fwd - sy * strafe) * speed * dt;
      if (!s.inWater && isWaterXZ(nx, nz) && !s.entered) { askEntry(); return; }
      if (s.inWater && isPool()) { nx = clamp(nx, POOL.x0 + 0.35, POOL.x1 - 0.35); nz = clamp(nz, POOL.z0 + 0.35, POOL.z1 - 0.35); }
      const B = BOUNDS[sc.map];
      p.x = clamp(nx, B.x0, B.x1); p.z = clamp(nz, B.z0, B.z1);
      if (s.inWater) s.swim += dt * (s.towing ? 2.4 : 4.2); else s.walk += dt * speed * 2.4;
    }
    if (!isPool()) {
      if (s.inWater && !s.towing && p.z > 0.2) s.inWater = false;
      if (!s.inWater && s.entered && p.z < 0) s.inWater = true;
    }
    if (s.inWater && inRip(p.x, p.z)) p.z = Math.max(BOUNDS.beach.z0, p.z - 0.55 * dt);
    if (!s.tube.taken && dxz(p, s.tube) < 1.1) { s.tube.taken = true; s.hasTube = true; say(L(G.tookTube), 'ok'); }
    if (!s.contact) {
      if (v.conscious) {
        v.fatigue -= 2.6 * dt;
        if (inRip(v.x, v.z)) v.z = Math.max(-60, v.z - 0.25 * dt);
        if (v.fatigue <= 0) { v.conscious = false; v.breathing = false; v.faceUp = false; say(L(G.victimSank), 'bad'); }
      }
      if (!v.conscious) { if (v.convulsing > 0) { v.convulsing -= dt; v.o2 -= 0.5 * dt; } else if (!v.breathing) v.o2 -= 1.5 * dt; }
      v.temp -= 0.35 * dt;
      if (s.inWater && dxz(p, v) < 1.4) askContact();
    } else {
      if (!v.breathing && !v.faceUp) v.o2 -= 1.5 * dt;
      else if (!v.breathing) v.o2 -= 0.45 * dt;
      if (v.convulsing > 0) { v.convulsing -= dt; if (v.convulsing <= 0) { v.convulsing = 0; say(L(G.convulsionsStopped), 'ok'); } }
      v.temp -= (s.inWater ? 0.35 : 0.25) * dt;
      if (s.towing) {
        const f = fwdVec(s.yaw);
        v.x = p.x + f.x * 1.45; v.z = p.z + f.z * 1.45;
        if (isPool()) { v.x = clamp(v.x, POOL.x0 + 0.3, POOL.x1 - 0.3); v.z = clamp(v.z, POOL.z0 + 0.3, POOL.z1 - 0.3); }
        const nearExit = isPool() ? (edgeDist(p.x, p.z) < 0.75 || edgeDist(v.x, v.z) < 0.55) : p.z > -2.5;
        if (!s.extracted && s.t > s.extractCooldown && nearExit) askExtract();
      }
    }
    if (v.o2 <= 0 && !s.o2Zero) { s.o2Zero = true; v.o2 = 0; say(L(G.o2zero), 'bad'); }
    v.o2 = clamp(v.o2, 0, 100); v.temp = clamp(v.temp, 0, 100); v.fatigue = clamp(v.fatigue, 0, 100);
  }
  function arrivals() {
    const s = st;
    if (s.signalAt === null) return;
    if (!s.partnerHere && s.t >= s.partnerAt) { s.partnerHere = true; say(L(G.partnerHere), 'ok'); }
    if (!s.desaHere && s.t >= s.desaAt) { s.desaHere = true; say(L(G.desaHere), 'ok'); if (s.pa && s.pa.onDesa) s.pa.onDesa(); }
  }

  /* ---------- acciones del rescate ---------- */
  function signal() {
    const s = st; if (!s || s.signalAt !== null || s.phase !== 'play') return;
    s.signalAt = s.t;
    s.partnerAt = s.t + (isPool() ? 25 : 38); s.desaAt = s.t + (isPool() ? 50 : 70);
    say(L(G.signalDone), 'ok'); updateHud();
  }

  function askEntry() {
    const s = st;
    const opts = isPool()
      ? [{ t: G.entryGiant, ok: true }, { t: G.entryDive, crit: G.critDivePool }, { t: G.entryHole, wrong: true }]
      : [{ t: G.entryRun, ok: true }, { t: G.entryDiveWave, crit: G.critDiveBeach }];
    if (!s.hasTube) opts.push({ t: G.entryBack, back: true });
    choice(L(G.entryTitle), opts, (o) => {
      if (o.back) { const f = fwdVec(s.yaw); s.player.x -= f.x * 1.2; s.player.z -= f.z * 1.2; return; }
      if (o.crit) { markCrit(L(o.crit)); s.injured = true; say(L(o.crit), 'bad'); teardown3d(); finishGame(); return; }
      if (o.wrong) { markWrong(); say(L(G.entryHoleWhy), 'warn'); }
      s.entered = true; s.inWater = true;
      if (isPool()) {
        const f = fwdVec(s.yaw);
        s.player.x = clamp(s.player.x + f.x * 0.9, POOL.x0 + 0.4, POOL.x1 - 0.4); s.player.z = clamp(s.player.z + f.z * 0.9, POOL.z0 + 0.4, POOL.z1 - 0.4);
        s.entryAnim = 0.7; splash(s.player.x, s.player.z);
      }
      if (!s.hasTube) say(L(G.noTubeWarn), 'warn');
    });
  }

  function askContact() {
    const s = st, v = s.victim, sc = s.sc;
    s.contact = true;
    let opts;
    if (v.convulsing > 0) opts = [{ t: G.cHoldConv, ok: true, hold: true }, { t: G.cExtractNow, wrong: G.cExtractNowWhy }, { t: G.cMouthObj, crit: G.critMouth }];
    else if (v.conscious && sc.victim.panic) opts = s.hasTube ? [{ t: G.cTubeFront, ok: true }, { t: G.cFrontal, crit: G.critGrab }] : [{ t: G.cFrontalNoTube, crit: G.critGrab }, { t: G.cWaitTired, wrong: G.cWaitTiredWhy }];
    else if (sc.victim.lm) opts = [{ t: G.cBicepsTriceps, ok: true }, { t: G.cHeadOneHand, crit: G.critHead }, { t: G.cTowFaceDown, crit: G.critFaceDown }];
    else opts = [{ t: G.cTurnAirway, ok: true }, { t: G.cTowFaceDown, crit: G.critFaceDown }, { t: G.cMouthHere, wrong: G.cMouthHereWhy }];
    choice(L(G.contactTitle), opts, (o) => {
      s.towing = true;
      if (o.crit) {
        markCrit(L(o.crit)); say(L(o.crit), 'bad');
        if (o.crit === G.critGrab) { s.grabbedUntil = s.t + 4; v.faceUp = true; }
        else if (o.crit === G.critFaceDown) v.faceUp = false;
        else v.faceUp = true;
        return;
      }
      if (o.wrong) { markWrong(); say(L(o.wrong), 'warn'); s.holdUntil = s.t + 6; v.faceUp = true; return; }
      v.faceUp = true;
      if (o.hold) { s.holdUntil = s.t + Math.max(0, v.convulsing); say(L(G.holdingConv), 'ok'); return; }
      say(L(G.controlOk), 'ok');
      if (sc.victim.lm) {
        setTimeout(() => choice(L(G.lmBreathTitle), [{ t: G.lmExtractNow, ok: true }, { t: G.lmWaitBoard, crit: G.critWaitBoard }], (o2) => {
          if (o2.crit) { markCrit(L(o2.crit)); say(L(o2.crit), 'bad'); s.holdUntil = s.t + 15; } else say(L(G.lmExtractWhy), 'ok');
        }), 50);
      }
    });
  }

  function askExtract() {
    const s = st;
    if (s.victim.convulsing > 0) { say(L(G.waitConv), 'warn'); s.extractCooldown = s.t + 3; return; }
    const alone = !s.partnerHere;
    const opts = [{ t: alone ? G.extractAlone : G.extractWithPartner, ok: true, secs: alone ? 12 : 4 }];
    if (alone && s.signalAt !== null) opts.push({ t: G.extractWait, wait: true });
    if (!s.sc.victim.breathing && !s.victim.conscious) opts.push({ t: G.extractSit, crit: G.critSit });
    choice(L(G.extractTitle), opts, (o) => {
      if (o.wait) { s.extractCooldown = s.t + 4; return; }
      if (o.crit) { markCrit(L(o.crit)); say(L(o.crit), 'bad'); }
      s.extracted = true;
      startExtraction(o.secs);
    });
  }

  /* ---------- overlays ---------- */
  function overlayBox() { let el = root.querySelector('.g-overlay'); if (!el) { el = document.createElement('div'); el.className = 'g-overlay'; root.querySelector('.g-stage').appendChild(el); } return el; }
  function closeOverlay() { const el = root.querySelector('.g-overlay'); if (el) el.remove(); st.paused = false; }
  function choice(title, opts, cb) {
    st.paused = true;
    const el = overlayBox();
    const shuffled = opts.slice().sort(() => Math.random() - 0.5);
    el.innerHTML = '<div class="g-card"><h3>' + esc(title) + '</h3><div class="options">' + shuffled.map((o, i) => '<button class="opt" data-i="' + i + '">' + esc(L(o.t)) + '</button>').join('') + '</div></div>';
    el.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { closeOverlay(); cb(shuffled[+b.dataset.i]); });
  }
  function progressBar(label, secs, done) {
    st.paused = true;
    const el = overlayBox();
    el.innerHTML = '<div class="g-card"><p class="step-text">' + esc(label) + '</p><div class="progressbar"><span id="g-pb" style="width:0%"></span></div></div>';
    const t0 = performance.now();
    const tick = () => { const k = clamp((performance.now() - t0) / (secs * 1000), 0, 1); const bar = document.getElementById('g-pb'); if (bar) bar.style.width = Math.round(k * 100) + '%'; if (k < 1) requestAnimationFrame(tick); else { st.t += secs; closeOverlay(); done(); } };
    requestAnimationFrame(tick);
  }



  /* ---------- materiales, texturas y geometría ---------- */
  const MATS = {}, TEX = [];
  function mat(color, opts) {
    const key = color + (opts ? JSON.stringify(opts) : '');
    if (!MATS[key]) MATS[key] = new THREE.MeshStandardMaterial(Object.assign({ color: lin(color), roughness: 0.62, metalness: 0 }, opts || {}));
    return MATS[key];
  }
  function lin(c) { return new THREE.Color(c).convertSRGBToLinear(); }
  function shadowy(o, cast, receive) { o.traverse((m) => { if (m.isMesh) { m.castShadow = !!cast; m.receiveShadow = !!receive; } }); return o; }
  function box(w, h, d, color, opts) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
  function cyl(r1, r2, h, color, seg, opts) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 16), mat(color, opts)); }
  function sph(r, color, seg, opts) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 18, Math.max(8, Math.round((seg || 18) * 0.66))), mat(color, opts)); }
  function at(m, x, y, z) { m.position.set(x, y, z); return m; }
  function capsule(r, len, color) {
    const g = new THREE.Group();
    g.add(cyl(r, r, len, color, 14), at(sph(r, color, 14), 0, len / 2, 0), at(sph(r, color, 14), 0, -len / 2, 0));
    return g;
  }
  function lathe(pts, color) {
    return new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 24), mat(color));
  }
  function canvasTex(size, draw, rx, ry) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; TEX.push(t);
    return t;
  }
  function texMat(tex, opts) { const o = Object.assign({ map: tex, roughness: 0.8, metalness: 0 }, opts || {}); if (typeof o.color === 'string') o.color = lin(o.color); return new THREE.MeshStandardMaterial(o); }
  const tileDraw = (base, grout, n) => (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.06) + ')'; g.fillRect(Math.random() * s, Math.random() * s, 3, 3); }
    g.strokeStyle = grout; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { const p = (s / n) * i; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, s); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(s, p); g.stroke(); }
  };
  const sandDraw = (g, s) => {
    g.fillStyle = '#E6D3A0'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(160,130,80,0.18)' : 'rgba(255,250,235,0.22)'; g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(170,140,90,0.12)'; g.beginPath(); const y = Math.random() * s; g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + 8, s * 0.6, y - 8, s, y); g.stroke(); }
  };

  /* figura humana con volumen */
  function makeHand(skin) {
    const h = new THREE.Group();
    const palm = sph(0.042, skin, 16); palm.scale.set(1.05, 1.15, 0.42); h.add(palm);
    for (let i = 0; i < 4; i++) h.add(at(capsule(0.0105, 0.052 - Math.abs(i - 1.5) * 0.008, skin), -0.027 + i * 0.018, 0.075, 0));
    const th = at(capsule(0.012, 0.04, skin), 0.047, 0.012, 0.008); th.rotation.z = -0.7; h.add(th);
    return h;
  }
  function makeHuman(o) {
    const skin = o.skin, top = o.top || skin, hairC = o.hair || '#3B2A20';
    const b = new THREE.Group();
    const torso = lathe([[0, 0.84], [0.15, 0.85], [0.185, 0.93], [0.165, 1.03], [0.175, 1.16], [0.2, 1.32], [0.19, 1.41], [0.12, 1.47], [0.055, 1.5], [0, 1.5]], top);
    torso.scale.z = 0.62; b.add(torso);
    const trunks = lathe([[0, 0.78], [0.168, 0.79], [0.192, 0.88], [0.19, o.top ? 0.9 : 0.99], [0, o.top ? 0.9 : 0.99]], o.bottom);
    trunks.scale.z = 0.66; b.add(trunks);
    const head = at(new THREE.Group(), 0, 1.47, 0);
    head.add(at(cyl(0.05, 0.058, 0.12, skin, 14), 0, 0.04, 0));
    const skull = at(sph(0.112, skin, 26), 0, 0.165, 0); skull.scale.set(0.9, 1.08, 1); head.add(skull);
    const jaw = at(sph(0.082, skin, 20), 0, 0.11, 0.03); jaw.scale.set(0.92, 0.8, 0.95); head.add(jaw);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.119, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(hairC, { roughness: 0.9 }));
    hair.position.set(0, 0.17, -0.012); hair.rotation.x = -0.38; hair.scale.set(0.93, 1.05, 1.04); head.add(hair);
    if (o.female) { const pony = at(sph(0.055, hairC, 14, { roughness: 0.9 }), 0, 0.13, -0.13); pony.scale.set(0.8, 1.5, 0.8); head.add(pony); }
    [-1, 1].forEach((sd) => {
      head.add(at(sph(0.016, '#F4F1EC', 12), sd * 0.038, 0.177, 0.09), at(sph(0.008, '#2B1D14', 10), sd * 0.038, 0.177, 0.104));
      head.add(at(box(0.032, 0.006, 0.008, hairC), sd * 0.038, 0.203, 0.099));
      const ear = at(sph(0.022, skin, 10), sd * 0.1, 0.165, 0); ear.scale.set(0.4, 1, 0.7); head.add(ear);
    });
    const nose = cyl(0.004, 0.017, 0.04, skin, 10); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.15, 0.112); head.add(nose);
    head.add(at(box(0.034, 0.006, 0.006, '#9C4A3F'), 0, 0.106, 0.1));
    b.add(head);
    const mkArm = (sd) => {
      const sh = at(new THREE.Group(), sd * 0.215, 1.39, 0);
      sh.add(at(sph(0.05, top, 14), 0, 0, 0));
      sh.add(at(capsule(0.043, 0.24, skin), 0, -0.15, 0));
      const el = at(new THREE.Group(), 0, -0.3, 0); sh.add(el);
      el.add(at(capsule(0.036, 0.22, skin), 0, -0.13, 0));
      const hand = makeHand(skin); hand.rotation.z = Math.PI; hand.position.y = -0.29; el.add(hand);
      sh.userData = { el }; return sh;
    };
    const mkLeg = (sd) => {
      const hp = at(new THREE.Group(), sd * 0.095, 0.86, 0);
      hp.add(at(capsule(0.072, 0.3, skin), 0, -0.21, 0));
      const kn = at(new THREE.Group(), 0, -0.43, 0); hp.add(kn);
      kn.add(at(capsule(0.052, 0.3, skin), 0, -0.2, 0));
      const foot = at(sph(0.05, skin, 12), 0, -0.4, 0.05); foot.scale.set(0.8, 0.5, 1.9); kn.add(foot);
      hp.userData = { kn }; return hp;
    };
    const armR = mkArm(-1), armL = mkArm(1), legR = mkLeg(-1), legL = mkLeg(1);
    b.add(armR, armL, legR, legL);
    b.userData = { torso, head, armR, armL, legR, legL };
    return shadowy(b, true, false);
  }
  function makeTube() {
    const g = new THREE.Group();
    const c = cyl(0.075, 0.075, 0.86, '#E0262F', 18, { roughness: 0.5 }); c.rotation.z = Math.PI / 2; g.add(c);
    g.add(at(sph(0.075, '#E0262F', 16, { roughness: 0.5 }), -0.43, 0, 0), at(sph(0.075, '#E0262F', 16, { roughness: 0.5 }), 0.43, 0, 0));
    const band = cyl(0.077, 0.077, 0.06, '#F2F2F2', 18); band.rotation.z = Math.PI / 2; g.add(band);
    const strap = cyl(0.008, 0.008, 0.6, '#1A1A1A', 6); strap.rotation.x = Math.PI / 2; strap.position.set(0.43, 0, 0.3); g.add(strap);
    g.add(at(box(0.03, 0.035, 0.05, '#C0C0C0', { metalness: 0.8, roughness: 0.3 }), -0.47, 0, 0));
    return shadowy(g, true, false);
  }
  function makeFPArm(side) {
    const sh = at(new THREE.Group(), side * 0.2, -0.27, -0.06);
    const w = new THREE.Group(); w.rotation.x = -Math.PI / 2; sh.add(w);
    w.add(at(capsule(0.056, 0.24, '#C8102E'), 0, 0.15, 0));
    const el = at(new THREE.Group(), 0, 0.3, 0); w.add(el);
    el.add(at(capsule(0.045, 0.22, SKIN_ME), 0, 0.13, 0));
    const hand = makeHand(SKIN_ME); hand.position.y = 0.29; if (side < 0) hand.scale.x = -1; el.add(hand);
    sh.userData = { el };
    return sh;
  }
  function makeWorldArm(side) {
    const g = new THREE.Group();
    const up = cyl(0.056, 0.05, 1, '#C8102E', 14), fo = cyl(0.046, 0.039, 1, SKIN_ME, 14);
    const jS = sph(0.057, '#C8102E', 14), jE = sph(0.05, SKIN_ME, 14), jW = sph(0.04, SKIN_ME, 12);
    const hand = makeHand(SKIN_ME); if (side < 0) hand.scale.x = -1;
    g.add(up, fo, jS, jE, jW, hand);
    g.userData = { up, fo, jS, jE, jW, hand, h: null };
    return g;
  }
  function setLimb(m, a, b) {
    const d = b.clone().sub(a); const len = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UPV, d.normalize());
    m.scale.set(1, len, 1);
  }
  function makeWater(w, d, sx, sz, cx, cz, colorFn) {
    const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { c.set(colorFn(cx + pos.getX(i), cz + pos.getZ(i))).convertSRGBToLinear(); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: isPool() ? 0.72 : 0.9, shininess: 120, specular: 0xd8eef7 }));
    m.position.set(cx, 0, cz); m.userData = { cx, cz }; m.receiveShadow = true;
    return m;
  }
  function makeSky(top, horizon) {
    const geo = new THREE.SphereGeometry(320, 24, 14); const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3);
    const a = lin(top), b = lin(horizon), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const k = clamp(pos.getY(i) / 320, 0, 1); c.copy(b).lerp(a, Math.pow(k, 0.6)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  }

  function buildPool() {
    scene.background = new THREE.Color('#CFE8F3'); scene.fog = new THREE.Fog('#CFE8F3', 35, 110);
    scene.add(makeSky('#5DA9DD', '#E3F1F7'));
    const deckTex = canvasTex(256, tileDraw('#E7DCC6', '#CDBFA4', 4), 1, 1);
    const deckPiece = (w, d, x, z) => { const t = deckTex.clone(); t.needsUpdate = true; t.repeat.set(w / 1.2, d / 1.2); TEX.push(t); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), texMat(t)); m.position.set(x, -0.05, z); m.receiveShadow = true; scene.add(m); };
    deckPiece(8.75, 36, -10.625, -13); deckPiece(4.75, 36, 8.625, -13); deckPiece(12.5, 5, 0, 2.5); deckPiece(12.5, 6, 0, -28);
    const cop = mat('#F7F7F4', { roughness: 0.4 });
    [[0.4, 25.8, POOL.x0 - 0.2, -12.5], [0.4, 25.8, POOL.x1 + 0.2, -12.5], [13.3, 0.4, 0, POOL.z1 + 0.2], [13.3, 0.4, 0, POOL.z0 - 0.2]].forEach(([w, d, x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), cop); m.position.set(x, 0.01, z); m.receiveShadow = true; scene.add(m); });
    const tileTex = canvasTex(256, tileDraw('#93D4EE', '#73C0E0', 8), 12, 3);
    const basin = new THREE.Mesh(new THREE.BoxGeometry(12.5, 2.4, 25), texMat(tileTex, { side: THREE.BackSide, roughness: 0.35 }));
    basin.position.set(0, -1.2, -12.5); basin.receiveShadow = true; scene.add(basin);
    for (let i = 0; i < 5; i++) scene.add(at(box(0.25, 0.012, 22.5, '#1E5A82', { roughness: 0.4 }), -5 + i * 2.5, -2.385, -12.5));
    O.water = makeWater(12.5, 25, 26, 52, 0, -12.5, () => '#46B3E0'); scene.add(O.water);
    O.floats = [];
    const fgeo = new THREE.SphereGeometry(0.075, 10, 8);
    [-3.75, -1.25, 1.25, 3.75].forEach((x) => {
      for (let k = 0; k < 100; k++) { const m = new THREE.Mesh(fgeo, mat(Math.floor(k / 8) % 2 ? '#F5F5F5' : '#D7263D', { roughness: 0.45 })); m.scale.set(1, 0.9, 1.5); m.position.set(x, POOL_WY + 0.03, -0.12 - k * 0.25); scene.add(m); O.floats.push(m); }
    });
    const ch = new THREE.Group(); ch.position.set(-8.2, 0, -6.5);
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => ch.add(at(cyl(0.035, 0.035, 1.8, '#F2F2F2', 10, { metalness: 0.6, roughness: 0.3 }), x, 0.9, z)));
    ch.add(at(box(0.8, 0.08, 0.8, '#0B4F6C'), 0, 1.8, 0), at(box(0.8, 0.6, 0.06, '#0B4F6C'), 0, 2.12, -0.38));
    for (let i = 0; i < 4; i++) ch.add(at(box(0.7, 0.04, 0.08, '#F2F2F2'), 0, 0.35 + i * 0.4, 0.38));
    scene.add(shadowy(ch, true, false));
    const inf = at(box(4, 3, 3, '#F7F7F7'), -12.5, 1.5, -26); inf.castShadow = true; scene.add(inf);
    scene.add(at(box(0.25, 1, 0.05, '#D7263D'), -12.5, 2, -24.47), at(box(1, 0.25, 0.05, '#D7263D'), -12.5, 2, -24.47));
    scene.add(at(box(36, 4, 0.5, '#DCE8EC'), -2, 2, -31.2), at(box(0.5, 4, 36, '#DCE8EC'), -15.2, 2, -13));
    [[5.6, -0.25], [-5.6, -24.75]].forEach(([x, z]) => { [-0.25, 0.25].forEach((o) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 8, 16, Math.PI), mat('#D0D0D0', { metalness: 0.9, roughness: 0.25 })); r.position.set(x + o, 0.0, z); r.rotation.y = Math.PI / 2; scene.add(r); }); });
  }

  function buildBeach() {
    scene.background = new THREE.Color('#BFE2F2'); scene.fog = new THREE.Fog('#BFE2F2', 45, 170);
    scene.add(makeSky('#3F8FD2', '#E6F4FA'));
    const sandTex = canvasTex(512, sandDraw, 30, 10);
    const sand = new THREE.Mesh(new THREE.BoxGeometry(160, 0.4, 50), texMat(sandTex, { roughness: 0.95 })); sand.position.set(0, -0.1, 25); sand.receiveShadow = true; scene.add(sand);
    const wet = new THREE.Mesh(new THREE.BoxGeometry(160, 0.402, 5), texMat(sandTex, { color: '#B8A27A', roughness: 0.55 })); wet.position.set(0, -0.11, 2.5); wet.receiveShadow = true; scene.add(wet);
    O.water = makeWater(160, 100, 80, 60, 0, -50, (x, z) => (z < -1 && x > RIP.x0 && x < RIP.x1 && st.sc.rip) ? '#2A6E85' : (z > -5 ? '#6CC6DA' : (z > -20 ? '#2F95C4' : '#1C6EA8')));
    scene.add(O.water);
    const tw = new THREE.Group(); tw.position.set(-3, 0, 17);
    [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, z]) => tw.add(at(cyl(0.07, 0.07, 2.2, '#F2F2F2', 10), x, 1.1, z)));
    tw.add(at(box(2.2, 1.5, 2.2, '#D7263D'), 0, 2.9, 0), at(box(2.6, 0.12, 2.6, '#F2F2F2'), 0, 3.72, 0), at(box(1.6, 0.6, 0.02, '#BFE3F2', { roughness: 0.1, metalness: 0.3 }), 0, 3.0, -1.11));
    for (let i = 0; i < 6; i++) tw.add(at(box(0.9, 0.05, 0.25, '#F2F2F2'), 0, 0.3 + i * 0.36, 1.3 + i * 0.1));
    scene.add(shadowy(tw, true, false));
    scene.add(at(cyl(0.035, 0.035, 4, '#E6E6E6', 8), 2.5, 2, 15));
    const flagGeo = new THREE.PlaneGeometry(0.95, 0.6, 8, 2); flagGeo.translate(0.475, 0, 0);
    O.flag = new THREE.Mesh(flagGeo, mat('#E9B51C', { side: THREE.DoubleSide })); O.flag.position.set(2.53, 3.65, 15); scene.add(O.flag);
    O.flagBase = Float32Array.from(flagGeo.attributes.position.array);
    [[-12, 9, '#1D8A4A'], [-18, 12, '#D7263D'], [14, 10, '#0B4F6C'], [20, 14, '#E9B51C'], [-25, 7, '#7FC3DC']].forEach(([x, z, c]) => {
      scene.add(at(cyl(0.03, 0.03, 2.2, '#F2F2F2', 6), x, 1.1, z));
      const um = at(new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.55, 16, 1, true), mat(c, { side: THREE.DoubleSide })), x, 2.25, z); um.castShadow = true; scene.add(um);
      const towel = at(box(0.9, 0.02, 1.8, c === '#E9B51C' ? '#D7263D' : '#F2C230'), x + 1.2, 0.11, z + 0.4); towel.receiveShadow = true; scene.add(towel);
    });
    O.breakers = [];
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(80, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: lin('#FFFFFF'), transparent: true, opacity: 0.75, roughness: 0.3 })); b.userData.z = -1.5 - i * 3.5; scene.add(b); O.breakers.push(b); }
    O.streaks = [];
    if (st.sc.rip) for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 1.8), new THREE.MeshStandardMaterial({ color: lin('#E8F4F8'), transparent: true, opacity: 0.55 })); s.userData = { x: RIP.x0 + 0.5 + Math.random() * (RIP.x1 - RIP.x0 - 1), z: -2 - Math.random() * 50 }; scene.add(s); O.streaks.push(s); }
  }

  function stageSize() {
    const stage = root.querySelector('.g-stage');
    const w = Math.max(280, stage.clientWidth), portrait = w < 600;
    const h = portrait ? Math.round(Math.min(window.innerHeight * 0.7, w * 1.4)) : Math.round(Math.min(w * 0.6, window.innerHeight * 0.78));
    return { w, h, portrait };
  }

  function makeDesa(open) {
    const g = new THREE.Group();
    g.add(at(box(0.34, 0.09, 0.26, '#F2C230', { roughness: 0.4 }), 0, 0.045, 0));
    g.add(at(box(0.1, 0.02, 0.07, '#10232B'), 0.06, 0.092, -0.04), at(cyl(0.022, 0.022, 0.015, '#E0262F', 14), -0.08, 0.095, 0.05), at(cyl(0.018, 0.018, 0.015, '#2E7D4F', 14), -0.08, 0.095, -0.05));
    const lid = at(box(0.34, 0.02, 0.26, '#E8B820', { roughness: 0.4 }), 0, open ? 0.2 : 0.1, open ? -0.12 : 0); if (open) lid.rotation.x = -1.3; g.add(lid);
    return shadowy(g, true, false);
  }

  function setup3d() {
    UPV = new THREE.Vector3(0, 1, 0); ray = new THREE.Raycaster();
    const stage = root.querySelector('.g-stage');
    const { w, h, portrait } = stageSize();
    renderer = new THREE.WebGLRenderer({ antialias: !portrait, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.5 : 1.75));
    renderer.setSize(w, h);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = !portrait; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas = renderer.domElement; canvas.className = 'g-canvas';
    stage.insertBefore(canvas, stage.firstChild);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(portrait ? 78 : 68, w / h, 0.03, 600);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xdff2ff, 0xa08a62, 0.75));
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.6);
    O = {};
    if (isPool()) buildPool(); else buildBeach();
    const c = isPool() ? V(-2, 0, -12) : V(0, 0, 0);
    sun.position.set(c.x + 18, 30, c.z + 14); sun.target.position.copy(c); scene.add(sun, sun.target);
    sun.castShadow = !portrait; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 }); sun.shadow.bias = -0.0008;
    O.tubeWorld = makeTube(); O.tubeWorld.position.set(st.tube.x, isPool() ? 0.08 : 0.17, st.tube.z); O.tubeWorld.rotation.y = 0.7; scene.add(O.tubeWorld);
    const lk = st.sc.female ? { skin: '#E8BC98', top: '#2F6FB5', bottom: '#2F6FB5', hair: '#5A3B22', female: true }
      : (st.sc.id === 'g-pis-ahog4' ? { skin: '#DDB08E', bottom: '#1B2F4A', hair: '#4A4A48' } : { skin: '#C99472', bottom: '#2E7D4F', hair: '#1E1612' });
    O.vYaw = new THREE.Group(); O.vTilt = new THREE.Group(); O.vBody = makeHuman(lk); O.vBody.position.y = -0.95;
    O.vTilt.add(O.vBody); O.vYaw.add(O.vTilt); scene.add(O.vYaw);
    O.partner = makeHuman({ skin: '#C98B63', top: '#C8102E', bottom: '#F2C230', hair: '#2B1D14' }); O.partner.visible = false; O.partner.rotation.order = 'YXZ'; scene.add(O.partner);
    O.desa = makeDesa(false); O.desa.visible = false; scene.add(O.desa);
    O.armR = makeFPArm(1); O.armL = makeFPArm(-1); O.armR.rotation.y = -0.1; O.armL.rotation.y = 0.1;
    O.heldTube = makeTube(); O.heldTube.scale.set(0.85, 0.85, 0.85); O.heldTube.visible = false;
    camera.add(O.armR, O.armL, O.heldTube);
    O.wArmR = makeWorldArm(1); O.wArmL = makeWorldArm(-1); O.wArmR.visible = O.wArmL.visible = false; scene.add(O.wArmR, O.wArmL);
    O.mask = new THREE.Group();
    O.mask.add(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.068, 0.07, 18, 1, true), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, shininess: 100, side: THREE.DoubleSide })));
    O.mask.add(at(cyl(0.012, 0.012, 0.04, '#2E7D4F', 10), 0, 0.05, 0)); O.mask.visible = false; scene.add(O.mask);
    const bg = new THREE.PlaneGeometry(0.72, 1.25, 10, 2); bg.rotateX(-Math.PI / 2);
    const bpos = bg.attributes.position; for (let i = 0; i < bpos.count; i++) bpos.setY(i, -0.78 * bpos.getX(i) * bpos.getX(i)); bg.computeVertexNormals();
    O.blanket = new THREE.Mesh(bg, new THREE.MeshPhongMaterial({ color: lin('#D4AF37'), specular: lin('#FFF1B8'), shininess: 70, side: THREE.DoubleSide }));
    O.blanket.position.set(0, 0.15, 0.25); O.blanket.visible = false; O.vYaw.add(O.blanket);
    O.splash = []; O.pads = []; O.cables = [];
    onResize = () => { if (!renderer) return; const z = stageSize(); renderer.setSize(z.w, z.h); camera.aspect = z.w / z.h; camera.updateProjectionMatrix(); };
    window.addEventListener('resize', onResize);
  }

  function teardown3d() {
    running = false; cancelAnimationFrame(raf);
    if (onResize) { window.removeEventListener('resize', onResize); onResize = null; }
    const shared = new Set(Object.values(MATS));
    if (scene) scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !shared.has(o.material)) o.material.dispose(); });
    Object.keys(MATS).forEach((k) => { MATS[k].dispose(); delete MATS[k]; });
    TEX.splice(0).forEach((t) => t.dispose());
    if (renderer) { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
    renderer = null; scene = null; camera = null; canvas = null; O = {};
  }

  function splash(x, z) {
    for (let i = 0; i < 18; i++) {
      const m = sph(0.05, '#FFFFFF', 8); const y = waveH(x, z, wt);
      m.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
      m.userData = { vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2.2, vz: (Math.random() - 0.5) * 2, life: 1 };
      scene.add(m); O.splash.push(m);
    }
  }

  /* ---------- puntos anatómicos de la víctima ---------- */
  const BP = { sternum: [0, 1.1, 0.13], shoulderR: [-0.19, 1.38, 0.07], shoulderL: [0.19, 1.38, 0.07], padR: [-0.1, 1.33, 0.125], padL: [0.155, 1.07, 0.05], hipR: [-0.13, 0.9, 0.1], hipL: [0.13, 0.9, 0.1] };
  const HP = { forehead: [0, 0.22, 0.095], chin: [0, 0.035, 0.088], mouth: [0, 0.08, 0.108], jawR: [-0.075, 0.06, 0.06], jawL: [0.075, 0.06, 0.06] };
  function bp(name) {
    if (HP[name]) { const a = HP[name]; return O.vBody.userData.head.localToWorld(V(a[0], a[1], a[2])); }
    const a = BP[name]; return O.vBody.localToWorld(V(a[0], a[1], a[2]));
  }

  /* ---------- animación ---------- */
  function animate(dt) {
    if (!renderer || !st) return;
    const s = st;
    const pos = O.water.geometry.attributes.position, cx = O.water.userData.cx, cz = O.water.userData.cz;
    for (let i = 0; i < pos.count; i++) pos.setY(i, waveH(cx + pos.getX(i), cz + pos.getZ(i), wt));
    pos.needsUpdate = true; O.water.geometry.computeVertexNormals();
    if (O.floats) O.floats.forEach((m) => { m.position.y = waveH(m.position.x, m.position.z, wt) + 0.03; });
    if (O.breakers) O.breakers.forEach((b) => { b.userData.z += 1.7 * dt; if (b.userData.z > 0.6) b.userData.z = -13; b.position.set(0, waveH(0, b.userData.z, wt) + 0.06, b.userData.z); b.material.opacity = clamp(0.15 + (b.userData.z + 13) / 14, 0.15, 0.85); });
    if (O.streaks) O.streaks.forEach((k) => { k.userData.z -= 0.9 * dt; if (k.userData.z < -55) k.userData.z = -2; k.position.set(k.userData.x, waveH(k.userData.x, k.userData.z, wt) + 0.04, k.userData.z); });
    if (O.flag) { const fp = O.flag.geometry.attributes.position; for (let i = 0; i < fp.count; i++) { const x = O.flagBase[i * 3]; fp.setZ(i, Math.sin(x * 6 - wt * 6) * 0.06 * x); } fp.needsUpdate = true; }
    O.tubeWorld.visible = !s.tube.taken;
    if (s.phase === 'play') {
      O.armR.visible = O.armL.visible = true; O.wArmR.visible = O.wArmL.visible = false;
      cameraPlay(); poseArms(dt); poseVictimPlay();
      O.partner.visible = s.partnerHere; O.desa.visible = s.desaHere;
      if (s.partnerHere) { if (isPool()) { O.partner.position.set(-7.1, 0, -14); O.partner.rotation.set(0, Math.PI / 2, 0); } else { O.partner.position.set(-1.2, 0.1, 2.5); O.partner.rotation.set(0, Math.PI, 0); } }
      if (isPool()) O.desa.position.set(-7, 0, -15.2); else O.desa.position.set(0, 0.1, 3);
    } else {
      O.armR.visible = O.armL.visible = false; O.heldTube.visible = false; O.wArmR.visible = O.wArmL.visible = true;
      if (s.phase === 'extract') extractFrame(dt); else if (s.pa) paFrame(dt);
      aimWorldArms(dt);
    }
    for (let i = O.splash.length - 1; i >= 0; i--) { const m = O.splash[i]; const u = m.userData; u.vy -= 9.8 * dt; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt; u.life -= dt; if (u.life <= 0 || m.position.y < waveH(m.position.x, m.position.z, wt) - 0.1) { scene.remove(m); m.geometry.dispose(); O.splash.splice(i, 1); } }
    if (!renderer) return;
    renderer.render(scene, camera);
    placeMarker();
  }

  function cameraPlay() {
    const s = st, p = s.player;
    const land = 1.65 + Math.sin(s.walk) * 0.035;
    let h;
    if (!s.inWater) h = land;
    else {
      let wh = waveH(p.x, p.z, wt) + 0.28 + Math.sin(s.swim * 2) * 0.035;
      if (!isPool() && p.z > -4 && !s.towing) wh = lerp(land, wh, clamp(-p.z / 4, 0, 1));
      h = s.entryAnim > 0 ? lerp(wh - 0.35, 1.65, s.entryAnim / 0.7) : wh;
    }
    camera.position.set(p.x, h, p.z);
    s.pitch = clamp(s.pitch, -1.1, 0.9);
    camera.rotation.set(s.pitch, s.yaw, 0);
    if (s.t < s.grabbedUntil) { camera.position.x += (Math.random() - 0.5) * 0.08; camera.position.y += (Math.random() - 0.5) * 0.12 - 0.15; camera.rotation.z = (Math.random() - 0.5) * 0.1; }
  }

  const armState = { aR: -0.6, aL: -0.6, eR: 0.3, eL: 0.3 };
  function poseArms(dt) {
    const s = st; let aR, aL, eR, eL, tube = null;
    if (s.entryAnim > 0) { aR = aL = 0.55; eR = eL = 0.15; }
    else if (s.towing) { aR = aL = -0.18 + Math.sin(wt * 2.2) * 0.04; eR = eL = 0.12; if (s.hasTube) tube = [0, -0.36, -0.8]; }
    else if (s.inWater) { const ph = s.swim * 2.2; aR = -0.2 + Math.sin(ph) * 0.8; aL = -0.2 + Math.sin(ph + Math.PI) * 0.8; eR = 0.35 + Math.cos(ph) * 0.3; eL = 0.35 + Math.cos(ph + Math.PI) * 0.3; }
    else if (s.hasTube) { aR = aL = -0.62 + Math.sin(s.walk) * 0.03; eR = eL = 0.35; tube = [0, -0.62, -0.72]; }
    else { aR = -0.5 + Math.sin(s.walk) * 0.2; aL = -0.5 - Math.sin(s.walk) * 0.2; eR = eL = 0.45; }
    if (s.t < s.grabbedUntil) { aR = 0.6 + Math.random() * 0.4; aL = 0.6 + Math.random() * 0.4; }
    const k = clamp(dt * 12, 0, 1);
    armState.aR = lerp(armState.aR, aR, k); armState.aL = lerp(armState.aL, aL, k); armState.eR = lerp(armState.eR, eR, k); armState.eL = lerp(armState.eL, eL, k);
    O.armR.rotation.x = armState.aR; O.armL.rotation.x = armState.aL;
    O.armR.userData.el.rotation.x = armState.eR; O.armL.userData.el.rotation.x = armState.eL;
    O.heldTube.visible = !!tube; if (tube) O.heldTube.position.set(tube[0], tube[1], tube[2]);
  }

  function resetVictimLimbs() {
    const u = O.vBody.userData;
    [u.armL, u.armR, u.legL, u.legR].forEach((g) => { g.rotation.set(0, 0, 0); if (g.userData.el) g.userData.el.rotation.set(0, 0, 0); if (g.userData.kn) g.userData.kn.rotation.set(0, 0, 0); });
    u.head.rotation.set(0, 0, 0); O.vBody.rotation.set(0, 0, 0); O.vTilt.rotation.set(0, 0, 0);
  }
  function poseVictimPlay() {
    const s = st, v = s.victim, y = waveH(v.x, v.z, wt), u = O.vBody.userData;
    resetVictimLimbs();
    O.vYaw.position.set(v.x, y, v.z);
    if (s.towing || (s.contact && v.faceUp)) {
      O.vYaw.rotation.y = s.yaw + Math.PI; O.vTilt.rotation.x = -Math.PI / 2; O.vYaw.position.y = y + 0.03;
      u.armL.rotation.z = 0.35; u.armR.rotation.z = -0.35; u.head.rotation.x = -0.25;
      if (v.convulsing > 0) O.vTilt.rotation.z = Math.sin(wt * 25) * 0.12;
    } else if (v.conscious && !s.contact) {
      O.vYaw.rotation.y = s.yaw + Math.PI * 0.85; O.vTilt.rotation.x = -0.25; O.vYaw.position.y = y - 0.6 + Math.sin(wt * 3) * 0.06;
      u.head.rotation.x = -0.5;
      u.armL.rotation.x = -1.3 + Math.sin(wt * 6) * 0.6; u.armR.rotation.x = -1.3 + Math.sin(wt * 6 + Math.PI) * 0.6;
      u.armL.rotation.z = 0.5; u.armR.rotation.z = -0.5;
      u.legL.rotation.x = Math.sin(wt * 4) * 0.4; u.legR.rotation.x = -Math.sin(wt * 4) * 0.4;
    } else {
      O.vYaw.rotation.y = 0.5; O.vTilt.rotation.x = Math.PI / 2; O.vYaw.position.y = y - 0.06;
      u.armL.rotation.z = 0.9; u.armR.rotation.z = -0.9; u.armL.userData.el.rotation.x = -0.5; u.armR.userData.el.rotation.x = -0.5; u.head.rotation.x = 0.3;
      if (v.convulsing > 0) { O.vTilt.rotation.z = Math.sin(wt * 25) * 0.18; u.armL.rotation.x = Math.sin(wt * 22) * 0.6; u.armR.rotation.x = Math.sin(wt * 22 + 1) * 0.6; u.legL.rotation.x = Math.sin(wt * 20) * 0.4; }
    }
  }

  function aimWorldArms(dt) {
    camera.updateMatrixWorld(true);
    const right = V(1, 0, 0).applyQuaternion(camera.quaternion);
    [[O.wArmR, 1, 0], [O.wArmL, -1, 1]].forEach(([arm, sd, idx]) => {
      const u = arm.userData;
      const sh = camera.localToWorld(V(sd * 0.19, -0.3, 0.03));
      let tgt = st.handT && st.handT[idx] ? st.handT[idx].clone() : camera.localToWorld(V(sd * 0.17, -0.52, -0.34));
      const d = tgt.clone().sub(sh); if (d.length() > 0.72) tgt = sh.clone().addScaledVector(d.normalize(), 0.72);
      u.h = u.h ? u.h.lerp(tgt, clamp(dt * 11, 0, 1)) : tgt;
      const elbow = sh.clone().add(u.h).multiplyScalar(0.5).addScaledVector(right, sd * 0.09).add(V(0, -0.07, 0));
      setLimb(u.up, sh, elbow); setLimb(u.fo, elbow, u.h);
      u.jS.position.copy(sh); u.jE.position.copy(elbow); u.jW.position.copy(u.h);
      const dir = u.h.clone().sub(elbow).normalize();
      u.hand.position.copy(u.h).addScaledVector(dir, 0.03);
      u.hand.quaternion.setFromUnitVectors(UPV, dir);
    });
  }

  function placeMarker() {
    const el = root && root.querySelector('.g-marker'); if (!el || !camera) return;
    const s = st;
    if (s.contact || s.phase !== 'play') { el.hidden = true; return; }
    const v3 = V(s.victim.x, waveH(s.victim.x, s.victim.z, wt) + 0.9, s.victim.z).project(camera);
    if (v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = ((v3.x + 1) / 2 * canvas.clientWidth) + 'px';
    el.style.top = ((1 - v3.y) / 2 * canvas.clientHeight) + 'px';
    const d = Math.round(Math.hypot(s.victim.x - s.player.x, s.victim.z - s.player.z));
    el.textContent = (s.victim.conscious ? L(G.riaLabel) + ' · ' : '') + d + ' m';
  }

  /* ---------- extracción en 3D ---------- */
  function startExtraction(secs) {
    const s = st, v = s.victim;
    s.phase = 'extract'; s.inWater = false;
    root.querySelector('.g-stage').classList.add('pa-mode');
    const ground = isPool() ? 0 : 0.1;
    let n, E, F;
    if (isPool()) {
      const d = [{ n: [-1, 0], d: v.x - POOL.x0 }, { n: [1, 0], d: POOL.x1 - v.x }, { n: [0, -1], d: v.z - POOL.z0 }, { n: [0, 1], d: POOL.z1 - v.z }].sort((a, b) => a.d - b.d)[0];
      n = { x: d.n[0], z: d.n[1] };
      E = { x: n.x ? (n.x > 0 ? POOL.x1 : POOL.x0) : clamp(v.x, POOL.x0 + 1.4, POOL.x1 - 1.4), z: n.z ? (n.z > 0 ? POOL.z1 : POOL.z0) : clamp(v.z, POOL.z0 + 1.4, POOL.z1 - 1.4) };
      F = { x: E.x + n.x * 1.25, z: E.z + n.z * 1.25 };
    } else { n = { x: 0, z: 1 }; E = { x: s.player.x, z: 0 }; F = { x: clamp(s.player.x, -20, 20), z: 7 }; }
    const t = isPool() ? { x: -n.z, z: n.x } : { x: 0, z: 1 };
    s.paPose = { F, ground, t, td: V(t.x, 0, t.z), r: V(t.z, 0, -t.x), yawEnd: Math.atan2(-t.x, -t.z) };
    s.ex = { secs, dur: s.partnerHere ? 5 : 7.5, k: 0, n, E, alone: !s.partnerHere, v0: { x: v.x, z: v.z, y: waveH(v.x, v.z, wt) + 0.03, yaw: O.vYaw.rotation.y }, c0: camera.position.clone(), done: false };
    const lk = V(0, 0, -1).applyQuaternion(camera.quaternion);
    s.camLook = camera.position.clone().addScaledVector(lk, 2);
    bubble(L(isPool() ? (s.ex.alone ? G.p3ExtractAlone : G.p3ExtractPartner) : (s.sc.cervical ? G.p3ExtractBeachLm : G.p3ExtractBeach)));
  }

  function extractFrame(dt) {
    const s = st, x = s.ex, P = s.paPose, g = P.ground, u = O.vBody.userData;
    if (x.k < 1) { x.k = Math.min(1, x.k + dt / x.dur); s.t += dt * (x.secs / x.dur); }
    const k = x.k;
    let vx, vy, vz, vyaw, cpos, look, kc = 0;
    resetVictimLimbs(); O.vTilt.rotation.x = -Math.PI / 2;
    if (isPool()) {
      const kv = x.alone ? sm((k - 0.35) / 0.6) : sm(k / 0.7);
      kc = x.alone ? sm(k / 0.35) : sm((k - 0.62) / 0.38);
      const Eup = { x: x.E.x + x.n.x * 0.15, z: x.E.z + x.n.z * 0.15 };
      if (kv < 0.5) { const a = kv / 0.5; vx = lerp(x.v0.x, Eup.x, a); vz = lerp(x.v0.z, Eup.z, a); vy = lerp(x.v0.y, g + 0.3, sm(a)); }
      else { const a = (kv - 0.5) / 0.5; vx = lerp(Eup.x, P.F.x, a); vz = lerp(Eup.z, P.F.z, a); vy = lerp(g + 0.3, g + 0.12, a); }
      vyaw = lerpAngle(x.v0.yaw, P.yawEnd, kv);
      const raise = x.alone ? 0.35 : lerp(2.6, 0.35, sm((kv - 0.5) / 0.5));
      u.armL.rotation.z = raise; u.armR.rotation.z = -raise;
      const off = x.alone ? 0 : 0.9;
      const cDeck = V(x.E.x + x.n.x * 0.55 + P.t.x * off, g + 1.05, x.E.z + x.n.z * 0.55 + P.t.z * off);
      cpos = x.c0.clone().lerp(cDeck, kc); cpos.y += Math.sin(kc * Math.PI) * 0.3;
      look = V(vx, vy + 0.1, vz);
      O.partner.visible = !x.alone;
      if (!x.alone) {
        const up2 = sm((kv - 0.6) / 0.4);
        O.partner.position.set(x.E.x + x.n.x * 0.55 - P.t.x * 0.3, g - 0.38 + 0.38 * up2, x.E.z + x.n.z * 0.55 - P.t.z * 0.3);
        O.partner.rotation.set(0.5 * (1 - up2), Math.atan2(-x.n.x, -x.n.z), 0);
        const pu = O.partner.userData; pu.armL.rotation.x = pu.armR.rotation.x = -0.9 - 0.5 * (1 - kv); pu.armL.rotation.z = 0.15; pu.armR.rotation.z = -0.15; pu.legL.userData.kn.rotation.x = pu.legR.userData.kn.rotation.x = 1.5 * (1 - up2);
      }
    } else {
      const kk = sm(k);
      const cz = lerp(x.c0.z, P.F.z + 0.95, kk);
      cpos = V(lerp(x.c0.x, P.F.x, sm(k * 3)), lerp(x.c0.y, g + 1.5, sm(k * 2.5)), cz);
      const a = sm(k / 0.25);
      vx = lerp(x.v0.x, P.F.x, a); vz = lerp(x.v0.z, cz - 0.95, a);
      vy = lerp(x.v0.y, g + 0.12 + 0.2 * Math.sin(Math.min(1, k / 0.92) * Math.PI), a);
      vyaw = lerpAngle(x.v0.yaw, P.yawEnd, a);
      look = V(vx, vy - 0.1, vz - 0.5);
      u.armL.rotation.z = 0.25; u.armR.rotation.z = -0.25;
    }
    O.vYaw.position.set(vx, vy, vz); O.vYaw.rotation.y = vyaw; O.vYaw.updateMatrixWorld(true);
    camera.position.copy(cpos); s.camLook.lerp(look, clamp(dt * 5, 0, 1)); camera.lookAt(s.camLook);
    if (isPool()) s.handT = (!x.alone && kc < 0.3) ? [bp('hipR'), bp('hipL')] : ((x.alone && kc > 0.95) ? [bp('shoulderR'), bp('shoulderL')] : null);
    else s.handT = [bp('shoulderR'), bp('shoulderL')];
    if (k >= 1 && !x.done) { x.done = true; bubble(null); startPA3d(); }
  }

  /* ---------- HUD ---------- */
  function updateHud() {
    const s = st, v = s.victim; if (!root) return;
    const hud = root.querySelector('.g-hud'); if (!hud) return;
    const bar = (label, val, cls) => '<div class="g-bar ' + cls + '"><span>' + esc(label) + '</span><i><b style="width:' + Math.round(val) + '%"></b></i></div>';
    hud.innerHTML = '<div class="g-time">' + fmt(s.t) + '</div>' +
      bar(L(G.o2), v.o2, v.o2 < 30 ? 'red' : (v.o2 < 60 ? 'yellow' : 'green')) +
      (v.conscious && !s.contact ? bar(L(G.fatigue), v.fatigue, v.fatigue < 30 ? 'red' : 'yellow') : '') +
      bar(L(G.temp), v.temp, v.temp < 40 ? 'red' : (v.temp < 70 ? 'yellow' : 'green')) +
      '<div class="g-status">' + (s.signalAt === null ? '<em>' + esc(L(G.noSignal)) + '</em>' : (s.partnerHere ? '✔ ' : '⏳ ') + esc(L(G.partner)) + ' · ' + (s.desaHere ? '✔ ' : '⏳ ') + 'DESA') + '</div>';
    const sb = root.querySelector('[data-signal]'); if (sb) sb.disabled = s.signalAt !== null;
  }
  function updateLog() {
    const el = root && root.querySelector('.g-log'); if (!el) return;
    el.innerHTML = st.msg.map((m) => '<p class="' + m.kind + '"><span>' + fmt(m.t) + '</span> ' + esc(m.txt) + '</p>').join('');
  }



  /* ---------- primeros auxilios en 3D ---------- */
  function startPA3d() {
    const s = st, P = s.paPose;
    s.phase = 'pa'; s.paStart = s.t;
    s.pa = { pose: 'side', pls: false, plsK: 0, rise: 0, riseT: 0, comp: 0, compT: 0, tilt: 0, tiltT: 0, jolt: 0, blanket: false, space: null, padMode: false, pads: 0, prep: null, venting: false };
    if (s.sc.pa === 'pcr') s.victim.breathing = false;
    s.camPos = camera.position.clone();
    O.partner.visible = s.partnerHere;
    if (s.partnerHere) {
      O.partner.position.set(P.F.x - P.t.x * 1.6 + P.r.x * 0.2, P.ground, P.F.z - P.t.z * 1.6 + P.r.z * 0.2);
      O.partner.rotation.set(0, Math.atan2(P.t.x, P.t.z), 0);
      const pu = O.partner.userData; pu.armL.rotation.x = pu.armR.rotation.x = 0; pu.legL.userData.kn.rotation.x = pu.legR.userData.kn.rotation.x = 0;
    }
    O.desa.visible = false;
    if (s.sc.pa === 'pcr') pcrFlow3d(); else decisionsFlow3d();
  }

  function paCam(pose) {
    const c = bp('sternum'), m = bp('mouth'), r = st.paPose.r, td = st.paPose.td;
    const P = (b, rr, uu, tt) => b.clone().addScaledVector(r, rr).addScaledVector(UPV, uu).addScaledVector(td, tt);
    switch (pose) {
      case 'cpr': return { pos: P(c, 0.32, 1.0, -0.06), look: P(c, 0, 0, 0.02) };
      case 'jaw': return { pos: P(m, 0.12, 0.62, 0.5), look: P(m, 0, -0.04, -0.08) };
      case 'vent': case 'tilt': return { pos: P(m, 0.38, 0.58, 0.32), look: P(m, 0, -0.04, -0.08) };
      case 'vos': return { pos: P(m, 0.13, 0.16, 0.02), look: P(c, 0, 0.02, 0) };
      case 'clear': return { pos: P(c, 1.05, 1.2, -0.1), look: P(c, 0, 0, -0.15) };
      case 'shake': return { pos: P(c, 0.55, 0.85, 0.12), look: P(c, 0, 0.05, 0.12) };
      case 'desa': return { pos: P(c, 0.42, 1.0, -0.12), look: P(c, -0.05, 0, 0.0) };
      default: return { pos: P(c, 0.75, 0.95, -0.05), look: P(c, 0, -0.02, -0.22) };
    }
  }
  function paHands(pose) {
    const pa = st.pa, r = st.paPose.r;
    const up = (v, d) => v.addScaledVector(UPV, d);
    switch (pose) {
      case 'shake': { const w = Math.sin(wt * 14) * 0.025; return [up(bp('shoulderR'), 0.06).addScaledVector(r, w), up(bp('shoulderL'), 0.06).addScaledVector(r, w)]; }
      case 'tilt': case 'vos': return [up(bp('chin'), 0.03), up(bp('forehead'), 0.04)];
      case 'jaw': return [up(bp('jawR'), 0.03), up(bp('jawL'), 0.03)];
      case 'vent': return [up(bp('chin'), 0.05), up(bp('forehead'), 0.06)];
      case 'cpr': { const c = bp('sternum'); return [up(c.clone(), 0.035 - pa.comp * 0.055), up(c.clone(), 0.075 - pa.comp * 0.055)]; }
      case 'pls': return [up(bp('hipL'), 0.06), up(bp('shoulderL'), 0.06)];
      case 'clear': return [camera.localToWorld(V(0.32, -0.02, -0.28)), camera.localToWorld(V(-0.32, -0.02, -0.28))];
      default: return null;
    }
  }
  function paFrame(dt) {
    const s = st, pa = s.pa, P = s.paPose, u = O.vBody.userData;
    if (s.victim.breathing && !pa.venting) pa.riseT = 0.3 * (0.5 + 0.5 * Math.sin(wt * 1.7));
    pa.plsK = lerp(pa.plsK, pa.pls ? 1 : 0, clamp(dt * 1.8, 0, 1));
    pa.rise = lerp(pa.rise, pa.riseT, clamp(dt * 10, 0, 1));
    pa.comp = lerp(pa.comp, pa.compT, clamp(dt * 30, 0, 1)); pa.compT = Math.max(0, pa.compT - dt * 7);
    pa.tilt = lerp(pa.tilt, pa.tiltT, clamp(dt * 4, 0, 1));
    pa.jolt = Math.max(0, pa.jolt - dt * 2.5);
    resetVictimLimbs();
    O.vYaw.position.set(P.F.x, P.ground + 0.12 + pa.plsK * 0.07 + Math.abs(Math.sin(pa.jolt * 40)) * pa.jolt * 0.07, P.F.z);
    O.vYaw.rotation.y = P.yawEnd; O.vTilt.rotation.x = -Math.PI / 2;
    O.vBody.rotation.y = -Math.PI / 2 * pa.plsK;
    u.head.rotation.x = -pa.tilt;
    u.torso.scale.z = 0.62 * (1 + 0.16 * pa.rise - 0.3 * pa.comp);
    u.armL.rotation.x = -1.3 * pa.plsK; u.armL.userData.el.rotation.x = -0.6 * pa.plsK; u.armR.rotation.z = -1.2 * pa.plsK;
    u.legL.rotation.x = -1.1 * pa.plsK; u.legL.userData.kn.rotation.x = 1.6 * pa.plsK;
    if (pa.jolt > 0) { u.armL.rotation.z = Math.sin(pa.jolt * 50) * 0.2 * pa.jolt; u.armR.rotation.z = -u.armL.rotation.z; }
    O.blanket.visible = pa.blanket;
    O.vYaw.updateMatrixWorld(true);
    const tgt = paCam(pa.pose);
    const panelUp = root.querySelector('.g-pactl:not([hidden])') || root.querySelector('.g-sheet:not([hidden])');
    if (panelUp) tgt.look.addScaledVector(UPV, -(canvas.clientHeight > canvas.clientWidth ? 0.42 : 0.16));
    s.camPos.lerp(tgt.pos, clamp(dt * 3.2, 0, 1)); s.camLook.lerp(tgt.look, clamp(dt * 3.8, 0, 1));
    camera.position.copy(s.camPos); camera.lookAt(s.camLook);
    s.handT = paHands(pa.pose);
    O.mask.visible = pa.pose === 'vent';
    if (O.mask.visible) { O.mask.position.copy(bp('mouth')).addScaledVector(UPV, 0.04); O.mask.quaternion.identity(); }
    if (s.desaHere && pa.desaShown) {
      O.desa.visible = true;
      O.desa.position.copy(bp('sternum')).addScaledVector(P.r, 0.48).addScaledVector(P.td, -0.3); O.desa.position.y = P.ground;
      O.desa.rotation.y = P.yawEnd;
      const port = O.desa.position.clone().add(V(0, 0.1, 0));
      O.cables.forEach((ln, i) => { const a = ln.geometry.attributes.position; const pw = O.pads[i].getWorldPosition(V(0, 0, 0)); a.setXYZ(0, port.x, port.y, port.z); a.setXYZ(1, (port.x + pw.x) / 2, P.ground + 0.05, (port.z + pw.z) / 2); a.setXYZ(2, pw.x, pw.y, pw.z); a.needsUpdate = true; });
    }
  }
  function bubble(text) {
    const el = root && root.querySelector('.g-bubble'); if (!el) return;
    if (!text) { el.hidden = true; return; }
    el.hidden = false; el.textContent = text;
  }
  function panel(html) { const el = root.querySelector('.g-pactl'); if (!el) return null; el.hidden = !html; el.innerHTML = html || ''; return el; }
  function pmsg(text) { const el = document.getElementById('g-pmsg'); if (el) el.textContent = text || ''; }
  function sheet(html) {
    const stage = root.querySelector('.g-stage'); let el = stage.querySelector('.g-sheet');
    if (!el) { el = document.createElement('div'); el.className = 'g-sheet'; stage.appendChild(el); }
    el.innerHTML = '<div class="g-card">' + html + '</div>'; el.hidden = false; return el;
  }
  function closeSheet() { const el = root.querySelector('.g-sheet'); if (el) el.hidden = true; }
  function paAsk(title, opts, cb, secs) {
    const shuffled = opts.slice().sort(() => Math.random() - 0.5);
    const el = sheet('<h3>' + esc(title) + '</h3>' + (secs ? '<div class="progressbar"><span id="g-timer" style="width:100%"></span></div>' : '') + '<div class="options">' + shuffled.map((o, i) => '<button class="opt" data-i="' + i + '">' + esc(L(o.t)) + '</button>').join('') + '</div>');
    let done = false;
    if (secs) {
      const t0 = performance.now();
      const tick = () => { if (done || !st || !st.pa) return; const k = clamp(1 - (performance.now() - t0) / (secs * 1000), 0, 1); const b = document.getElementById('g-timer'); if (b) b.style.width = Math.round(k * 100) + '%'; if (k > 0) requestAnimationFrame(tick); else { done = true; st.victim.o2 -= 6; st.t += secs; markWrong(); paFb(L(G.timeout), 'yellow', () => cb({ timeout: true })); } };
      requestAnimationFrame(tick);
    }
    el.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { if (done) return; done = true; st.t += 3; closeSheet(); cb(shuffled[+b.dataset.i]); });
  }
  function paFb(text, cls, next) {
    const el = sheet('<div class="feedback ' + cls + '"><p>' + esc(text) + '</p></div><button class="btn" id="g-next">' + esc(L(UI.continue)) + '</button>');
    el.querySelector('#g-next').onclick = () => { closeSheet(); next(); };
  }
  function handle(o, okText, next) {
    if (o.crit) { markCrit(L(o.crit)); st.victim.o2 -= 10; paFb(L(UI.critical) + ': ' + L(o.crit), 'red', next); }
    else if (o.wrong) { markWrong(); st.victim.o2 -= 4; st.t += 6; paFb(L(o.wrong), 'yellow', next); }
    else paFb(okText, 'green', next);
  }
  function bindHold(id, down, up) {
    const b = document.getElementById(id); if (!b) return;
    b.onpointerdown = (e) => { e.preventDefault(); b.classList.add('listening'); down(); };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => { if (b.classList.contains('listening')) { b.classList.remove('listening'); up(); } };
    st.pa.space = (isDown) => { if (isDown) { b.classList.add('listening'); down(); } else if (b.classList.contains('listening')) { b.classList.remove('listening'); up(); } };
  }
  function endPA() { if (!st) return; st.pa.space = null; st.phase = 'done'; teardown3d(); finishGame(); }

  function pcrFlow3d() {
    const s = st, sc = s.sc, pa = s.pa;
    const q = [];
    q.push((next) => paAsk(L(G.pcrConscTitle), [
      { t: G.pcrConscOk, ok: true }, { t: G.pcrConscCompress, wrong: G.pcrConscCompressWhy }, { t: G.pcrConscHeimlich, crit: G.critHeimlich }, { t: G.pcrConscPLS, crit: G.critPLS }
    ], (o) => {
      if (!o.ok) { handle(o, '', next); return; }
      pa.pose = 'shake'; bubble(L(G.p3Hear));
      later(1.8, () => { bubble(L(G.p3NoResp)); pa.pose = 'side'; later(1.1, () => { bubble(null); handle(o, L(G.pcrConscOkWhy), next); }); });
    }));
    q.push((next) => paAsk(L(G.pcrAirwayTitle), sc.cervical
      ? [{ t: G.airJaw, ok: true }, { t: G.airHeadTilt, wrong: G.airHeadTiltLmWhy }, { t: G.airGuedelFirst, wrong: G.airGuedelWhy }]
      : [{ t: G.airHeadTiltCerv, ok: true }, { t: G.airHyper, wrong: G.airHyperWhy }, { t: G.airGuedelFirst, wrong: G.airGuedelWhy }],
    (o) => {
      pa.pose = sc.cervical ? 'jaw' : 'tilt'; pa.tiltT = sc.cervical ? 0 : (o.wrong === G.airHyperWhy ? 0.7 : 0.35);
      if (o.wrong === G.airHeadTiltLmWhy) { pa.pose = 'tilt'; pa.tiltT = 0.35; }
      later(1.2, () => handle(o, L(sc.cervical ? G.airJawWhy : G.airHeadTiltCervWhy), next));
    }));
    q.push((next) => vos3d(next));
    q.push((next) => paAsk(L(G.pcrStartTitle), sc.drowning
      ? [{ t: G.startFive, ok: true }, { t: G.startCompress, wrong: G.startCompressWhy }, { t: G.startTwo, wrong: G.startTwoWhy }, { t: G.startDrain, crit: G.critDrain }]
      : [{ t: G.startCompress, ok: true }, { t: G.startFive, wrong: G.startFiveLandWhy }, { t: G.startPLS, crit: G.critPLS }],
    (o) => { s.startChoice = o; handle(o, L(sc.drowning ? G.startFiveWhy : G.startCompressWhy2), next); }));
    q.push((next) => { if (sc.drowning && !(s.startChoice && s.startChoice.crit)) vent3d(5, () => paFb(L(G.ventDone), 'green', next)); else next(); });
    q.push((next) => cpr3d(next));
    q.push(() => paAsk(L(G.afterTitle), sc.cervical
      ? [{ t: G.afterSupineCerv, ok: true }, { t: G.afterPLS, crit: G.critPLSLm }, { t: G.afterDrink, crit: G.critDrink }]
      : [{ t: G.afterPLS, ok: true }, { t: G.afterDrink, crit: G.critDrink }, { t: G.afterLeave, wrong: G.afterLeaveWhy }],
    (o) => {
      s.victim.breathing = true; pa.pose = 'side'; pa.tiltT = 0;
      if (o.ok) { s.victim.temp = Math.min(100, s.victim.temp + 25); if (sc.cervical) pa.blanket = true; else { pa.pose = 'pls'; pa.pls = true; later(1.6, () => { pa.pose = 'side'; pa.blanket = true; }); } }
      else if (o.crit === G.critPLSLm) { pa.pose = 'pls'; pa.pls = true; later(1.6, () => { pa.pose = 'side'; }); }
      later(o.ok && !sc.cervical ? 2.2 : 0.6, () => handle(o, L(sc.cervical ? G.afterSupineCervWhy : G.afterPLSWhy), endPA));
    }));
    let i = 0; const run = () => { if (i < q.length) q[i++](run); }; run();
  }

  function vos3d(next) {
    const pa = st.pa; const prevPose = pa.pose; pa.pose = 'vos';
    panel('<p class="g-ptitle">' + esc(L(G.vosTitle)) + '</p><p class="small">' + esc(L(G.vosHint)) + '</p><div class="progressbar"><span id="g-vosbar" style="width:0%"></span></div><button class="btn g-hold" id="g-hold">' + esc(L(G.vosBtn)) + '</button><p class="small" id="g-pmsg">0,0 s</p>');
    let t0 = 0, done = false;
    const tick = () => { if (!t0 || done) return; const e = (performance.now() - t0) / 1000; const b = document.getElementById('g-vosbar'); if (b) b.style.width = Math.min(100, e * 10) + '%'; pmsg(e.toFixed(1).replace('.', ',') + ' s'); if (e >= 10) { stop(); return; } requestAnimationFrame(tick); };
    const stop = () => { if (done || !t0) return; done = true; const e = (performance.now() - t0) / 1000; st.t += e; panel(null); st.pa.space = null; pa.pose = prevPose;
      if (e > 10) { markWrong(); st.victim.o2 -= 4; paFb(L(G.vosTooLong), 'yellow', next); } else if (e < 2) { markWrong(); paFb(L(G.vosTooShort), 'yellow', next); } else paFb(L(G.vosResult), 'green', next); };
    bindHold('g-hold', () => { if (!t0) { t0 = performance.now(); requestAnimationFrame(tick); } }, stop);
  }

  function vent3d(count, done) {
    const s = st, pa = s.pa; pa.pose = 'vent'; pa.venting = true;
    panel('<p class="g-ptitle">' + esc(count === 5 ? L(G.ventTitle5) : L(G.ventTitle2)) + '</p><p class="small">' + esc(L(G.ventHint)) + '</p><div class="g-gauge"><i style="left:38%;width:34%"></i><b id="g-gbar" style="width:0%"></b></div><button class="btn g-hold" id="g-hold">' + esc(L(G.ventBtn)) + '</button><p class="small"><strong id="g-cnt">0 / ' + count + '</strong> <span class="g-flash" id="g-pmsg"></span></p>');
    let holding = false, level = 0, good = 0, fails = 0, fin = false, lastT = performance.now();
    const tick = () => { if (fin || !st || st.pa !== pa) return; const now = performance.now(), d = (now - lastT) / 1000; lastT = now; level = holding ? Math.min(100, level + 55 * d) : Math.max(0, level - 90 * d); const b = document.getElementById('g-gbar'); if (b) b.style.width = level + '%'; pa.riseT = level / 100; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    bindHold('g-hold', () => { if (!fin) holding = true; }, () => {
      if (!holding || fin) return; holding = false; st.t += 1.5;
      if (level >= 38 && level <= 72) { good++; st.victim.o2 = Math.min(100, st.victim.o2 + 4); if (st.firstVentAt === null) st.firstVentAt = st.t; pmsg(''); }
      else if (level > 85) { fails++; st.victim.o2 -= 3; st.t += 3; pmsg(L(G.ventTooMuch)); }
      else pmsg(L(G.ventTooLittle));
      level = 0;
      const c = document.getElementById('g-cnt'); if (c) c.textContent = good + ' / ' + count;
      if (good >= count) { fin = true; pa.riseT = 0; pa.venting = false; s.ventFails = (s.ventFails || 0) + fails; st.pa.space = null; panel(null); done(); }
    });
  }

  function cpr3d(next) {
    const s = st, pa = s.pa; s.cpr = { taps: 0, good: 0, cycles: 0, shocked: false };
    let desaDone = false;
    const cycle = () => {
      pa.pose = 'cpr';
      const desaBtn = () => (s.desaHere && !desaDone) ? '<button class="btn ghost small" id="g-desa">' + esc(L(G.useDesa)) + '</button>' : (s.signalAt !== null && !desaDone ? '<span class="small muted">' + esc(L(G.desaComing)) + '</span>' : '');
      panel('<p class="g-ptitle">' + esc(L(G.cprTitle)) + ' · ' + esc(L(G.cycle)) + ' ' + (s.cpr.cycles + 1) + '</p><p class="small">' + esc(L(G.cprHint)) + '</p><div class="g-metro"><div class="g-zone"></div><div class="g-needle" id="g-needle"></div></div><button class="btn g-press" id="g-press">' + esc(L(G.cprBtn)) + ' <small id="g-cnt">0 / 30</small></button><p class="small"><span id="g-bpm">—</span> <span id="g-desaslot">' + desaBtn() + '</span></p>');
      let n = 0, good = 0, lastTap = 0, fin = false; const t0 = performance.now();
      const bindDesa = () => { const b = document.getElementById('g-desa'); if (b) b.onclick = () => { fin = true; s.pa.space = null; desa3d(); }; };
      bindDesa();
      pa.onDesa = () => { const slot = document.getElementById('g-desaslot'); if (slot && !fin) { slot.innerHTML = desaBtn(); bindDesa(); } };
      const needle = () => { if (fin || !st || st.pa !== pa) return; const nd = document.getElementById('g-needle'); if (nd) nd.style.left = (((performance.now() - t0) % 545) / 545 * 100) + '%'; requestAnimationFrame(needle); };
      requestAnimationFrame(needle);
      const press = () => {
        if (fin) return; const now = performance.now();
        if (lastTap) { const bpm = 60000 / (now - lastTap); const b = document.getElementById('g-bpm'); if (b) b.textContent = Math.round(bpm) + ' /min'; if (bpm >= 100 && bpm <= 120) good++; else if (bpm > 140) st.victim.o2 -= 0.3; }
        lastTap = now; n++; pa.compT = 1; st.victim.o2 -= 0.15;
        const c = document.getElementById('g-cnt'); if (c) c.textContent = n + ' / 30';
        if (n >= 30) {
          fin = true; s.pa.space = null; s.cpr.taps += n - 1; s.cpr.good += good; s.cpr.cycles++; st.t += 18;
          vent3d(2, () => { st.t += 3; if (s.cpr.cycles >= 5 && !desaDone && s.signalAt === null) next(); else if (s.cpr.cycles >= 2 && (desaDone || s.cpr.cycles >= 6)) { panel(null); next(); } else cycle(); });
        }
      };
      const pb = document.getElementById('g-press');
      pb.onpointerdown = (e) => { e.preventDefault(); pb.classList.add('pressed'); press(); setTimeout(() => pb.classList.remove('pressed'), 90); };
      s.pa.space = (isDown) => { if (isDown) press(); };
    };
    const desa3d = () => {
      pa.pose = 'desa'; pa.desaShown = true;
      if (!O.desaOpen) { scene.remove(O.desa); O.desa = makeDesa(true); scene.add(O.desa); O.desaOpen = true; }
      const sand = s.sc.sand, prep = { dry: false, chest: false, sand: !sand };
      pa.prep = prep; pa.padMode = true; pa.pads = 0;
      panel('<p class="g-ptitle">' + esc(L(G.desaTitle)) + '</p><p class="small">' + esc(L(G.desaHint)) + '</p><div class="g-prep"><button class="btn small ghost" data-prep="dry">' + esc(L(sand ? G.prepMoveSand : G.prepDryFloor)) + '</button><button class="btn small ghost" data-prep="chest">' + esc(L(G.prepDryChest)) + '</button>' + (sand ? '<button class="btn small ghost" data-prep="sand">' + esc(L(G.prepSand)) + '</button>' : '') + '</div><p class="small g-flash" id="g-pmsg"></p>');
      root.querySelectorAll('[data-prep]').forEach((b) => b.onclick = () => { prep[b.dataset.prep] = true; b.classList.add('on'); b.disabled = true; st.t += 2; });
      pa.onPadsDone = () => {
        pa.padMode = false; pa.pose = 'clear'; bubble(L(G.desaAnalysing));
        later(2.5, () => {
          bubble(L(G.desaShockAdvised));
          panel('<p class="g-ptitle">' + esc(L(G.desaShockAdvised)) + '</p>' + (prep.dry ? '' : '<p class="small muted">' + esc(L(G.wetWarning)) + '</p>') + '<button class="btn g-press" id="g-shock">⚡ ' + esc(L(G.allClear)) + '</button>');
          document.getElementById('g-shock').onclick = () => {
            if (!prep.dry) markCrit(L(G.critWetShock));
            s.cpr.shocked = true; pa.jolt = 1; st.t += 8; bubble(null); panel(null);
            later(0.9, () => paFb(L(G.shockDone), prep.dry ? 'green' : 'red', () => { desaDone = true; cycle(); }));
          };
        });
      };
    };
    cycle();
  }

  function tryPad(e) {
    const s = st, pa = s.pa; if (!pa || !pa.padMode) return;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(O.vBody.userData.torso, false);
    const idx = pa.pads;
    const target = bp(idx === 0 ? 'padR' : 'padL');
    const near = ray.ray.distanceToPoint(target) < 0.08 || (hits.length && hits[0].point.distanceTo(target) < 0.08);
    if (!near) { pmsg(L(idx === 0 ? G.padHint1 : G.padHint2)); return; }
    if (!pa.prep.chest || !pa.prep.sand) { pmsg(L(G.padNoStick)); return; }
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.13), mat('#F4F4F4', { roughness: 0.5 }));
    pad.add(at(box(0.07, 0.004, 0.09, '#E8742A'), 0, 0.004, 0));
    pad.position.copy(target).addScaledVector(UPV, 0.004); pad.rotation.y = st.paPose.yawEnd;
    scene.add(pad); O.vBody.attach(pad); O.pads.push(pad);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x222222 })); scene.add(ln); O.cables.push(ln);
    pa.pads++; pmsg(''); st.t += 2;
    if (pa.pads >= 2 && pa.onPadsDone) pa.onPadsDone();
  }

  function decisionsFlow3d() {
    const c = caseOf(st.sc); const steps = c.pa; const pa = st.pa; let i = 0;
    const step = () => {
      if (i >= steps.length) { endPA(); return; }
      const stp = steps[i];
      const opts = [{ t: stp.t, ok: true }].concat((stp.alts || []).map((a) => a.crit ? { t: a.t, crit: a.why } : { t: a.t, wrong: a.why }));
      paAsk(L(UI.whatNow) + ' (' + (i + 1) + '/' + steps.length + ')', opts, (o) => {
        if (o.timeout) { i++; step(); return; }
        const tx = L(o.t); const plsMove = o.ok && /PLS|lateral/i.test(tx);
        if (plsMove) { pa.pose = 'pls'; pa.pls = true; later(1.6, () => { pa.pose = 'side'; }); }
        if (o.ok && /manta|abrig/i.test(tx)) { pa.blanket = true; st.victim.temp = Math.min(100, st.victim.temp + 25); }
        later(plsMove ? 1.8 : 0.2, () => handle(o, L(stp.why), () => { i++; step(); }));
      }, 25);
    };
    step();
  }

  /* ---------- resultado ---------- */
  function finishGame() {
    const s = st; running = false; cancelAnimationFrame(raf);
    const sc = s.sc, v = s.victim;
    let score = 10; const notes = [];
    if (s.injured) { score = 0; notes.push(L(G.resInjured)); }
    score -= s.crit.length * 3; score -= s.wrong * 1;
    if (s.o2Zero) { score -= 2; notes.push(L(G.resO2zero)); }
    if (sc.pa === 'pcr' && s.cpr) {
      const q = s.cpr.taps ? s.cpr.good / s.cpr.taps : 0; s.cprQuality = q;
      if (q < 0.4) { score -= 2; notes.push(L(G.resCprBad)); } else if (q < 0.65) { score -= 1; notes.push(L(G.resCprMeh)); } else notes.push(L(G.resCprGood));
      if (!s.cpr.shocked) { if (s.signalAt === null) { score -= 2; notes.push(L(G.resNoDesaNoSignal)); } else notes.push(L(G.resNoDesa)); }
      if (s.ventFails) { score -= Math.min(2, s.ventFails * 0.5); notes.push(L(G.resVentFails) + ' ' + s.ventFails); }
      if (s.firstVentAt !== null) notes.push(L(G.resFirstVent) + ' ' + fmt(s.firstVentAt));
    }
    if (sc.pa === 'decisions') { if (v.temp < 40) { score -= 1; notes.push(L(G.resCold)); } }
    if (!s.sc.land && s.signalAt === null) { score -= 1; notes.push(L(G.resNoSignal)); }
    score = Math.round(clamp(score, 0, 10) * 10) / 10;
    const flag = s.crit.length ? 'red' : (score >= 6 ? 'green' : 'yellow');
    const outcome = s.injured ? L(G.outInjured) : (sc.pa === 'pcr' ? (flag === 'green' && score >= 7 ? L(G.outRosc) : L(G.outRelay)) : (flag === 'red' ? L(G.outHarm) : L(G.outStable)));
    s.result = { score, flag, outcome, notes, time: s.t };
    record(sc.id, score, flag, s.crit.slice());
    renderResult();
  }
  function renderResult() {
    const s = st, r = s.result, c = caseOf(s.sc);
    root.innerHTML = '<a class="back" href="#game" data-back>← ' + esc(L(G.backToList)) + '</a>' +
      '<article class="result ' + r.flag + '"><h2>' + esc(L(G.resultTitle)) + '</h2>' +
      '<div class="score-row">' + flagHtml(r.flag, 'big') + '<div><p class="score">' + esc(L(UI.grade)) + ' <strong>' + String(r.score).replace('.', ',') + '</strong>' + (r.flag === 'red' ? ' <span class="crit">(' + esc(L(UI.invalidTag)) + ')</span>' : '') + '</p><p>' + esc(L(G.totalTime)) + ' ' + fmt(r.time) + ' · ' + s.wrong + ' ' + esc(L(G.wrongCount)) + ' · ' + s.crit.length + ' ' + esc(L(UI.critCount)) + '</p></div></div>' +
      '<p class="verdict">' + esc(r.outcome) + '</p>' +
      (s.crit.length ? '<ul class="weak">' + s.crit.map((t) => '<li>' + flagHtml('red') + '<span>' + esc(t) + '</span></li>').join('') + '</ul>' : '') +
      '<ul class="g-notes">' + r.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>' +
      '<div class="actions"><button class="btn" data-again>' + esc(L(UI.retry)) + '</button><a class="btn ghost" href="#case/' + c.id + '">' + esc(L(G.reviewProtocol)) + '</a></div></article>';
    root.querySelector('[data-again]').onclick = () => start(s.sc.id);
    root.querySelector('[data-back]').onclick = () => { st = null; };
  }



  /* ---------- controles ---------- */
  function bindControls() {
    const stage = root.querySelector('.g-stage');
    const kd = (e) => {
      if (!st || !running) return;
      if (st.phase === 'pa') { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && st.pa && st.pa.space) st.pa.space(true); } return; }
      if (st.phase !== 'play') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE') actionKey();
      if (e.code === 'KeyX') signal();
    };
    const ku = (e) => { keys[e.code] = false; if (st && st.phase === 'pa' && e.code === 'Space' && st.pa && st.pa.space) st.pa.space(false); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    st._unbind = () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    canvas.addEventListener('pointerdown', (e) => {
      if (st && st.phase === 'pa') { tryPad(e); return; }
      if (look.id !== null) return; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', (e) => { if (e.pointerId !== look.id || !st || st.paused || st.phase !== 'play') return; st.yaw -= (e.clientX - look.x) * 0.0055; st.pitch -= (e.clientY - look.y) * 0.0045; look.x = e.clientX; look.y = e.clientY; });
    const endLook = (e) => { if (e.pointerId === look.id) look.id = null; };
    canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
    const pad = stage.querySelector('.g-joy');
    const moveJoy = (e) => { let dx = (e.clientX - joy.cx) / 40, dy = (e.clientY - joy.cy) / 40; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.dx = dx; joy.dy = dy; pad.querySelector('.g-knob').style.transform = 'translate(' + (dx * 32) + 'px,' + (dy * 32) + 'px)'; };
    pad.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); joy.active = true; joy.id = e.pointerId; const r = pad.getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; moveJoy(e); pad.setPointerCapture(e.pointerId); };
    pad.onpointermove = (e) => { if (joy.active && e.pointerId === joy.id) moveJoy(e); };
    pad.onpointerup = pad.onpointercancel = (e) => { if (e.pointerId === joy.id) { joy.active = false; joy.dx = joy.dy = 0; pad.querySelector('.g-knob').style.transform = ''; } };
    stage.querySelector('[data-action]').onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); actionKey(); };
    stage.querySelector('[data-signal]').onclick = () => signal();
  }

  function actionKey() {
    const s = st; if (!s || s.paused || s.phase !== 'play') return;
    const p = s.player;
    if (!s.entered && !s.inWater) { const f = fwdVec(s.yaw); if (isWaterXZ(p.x + f.x * 1.2, p.z + f.z * 1.2)) { askEntry(); return; } }
    if (s.towing && !s.extracted) {
      const near = isPool() ? edgeDist(p.x, p.z) < 1.4 || edgeDist(s.victim.x, s.victim.z) < 1.2 : p.z > -4;
      if (near) { s.extractCooldown = 0; askExtract(); return; }
      say(L(G.goToEdge), 'warn'); return;
    }
    if (!s.contact && s.inWater && dxz(p, s.victim) < 2.2) { askContact(); return; }
    say(L(G.nothingHere), '');
  }

  /* ---------- vistas ---------- */
  function renderList() {
    const cards = SCEN.map((sc) => {
      const c = caseOf(sc); const pr = (progress().games || {})[sc.id];
      return '<a class="case-card" href="#game/' + sc.id + '"><div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span><span class="pill">' + esc(L(sc.pa === 'pcr' ? G.modePcr : G.modeDecisions)) + '</span></div><h3>' + esc(L(c.title)) + '</h3><p>' + esc(L(c.victim)) + '</p><div class="status">' + (pr ? flagHtml(pr.lastFlag || 'green') + '<span>' + esc(L(UI.best)) + ' ' + String(pr.best).replace('.', ',') + ' · ' + pr.attempts + ' ' + esc(L(UI.attempts)) + '</span>' : '<span class="muted">' + esc(L(UI.notDone)) + '</span>') + '</div></a>';
    }).join('');
    root.innerHTML = '<article class="intro"><h2>' + esc(L(G.title)) + '</h2><p>' + esc(L(G.intro)) + '</p><p class="muted small">' + esc(L(G.controls)) + '</p></article><section class="case-grid">' + cards + '</section>';
  }

  function renderBrief(sc) {
    const c = caseOf(sc);
    root.innerHTML = '<a class="back" href="#game">← ' + esc(L(G.backToList)) + '</a><article class="case-head"><div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span></div><h2>' + esc(L(c.title)) + '</h2><div class="scene"><h3>' + esc(L(UI.scene)) + '</h3><p>' + esc(L(sc.land && c.scenePA ? c.scenePA : c.scene)) + '</p></div><p class="hint">' + esc(L(sc.land ? G.briefLand : G.briefWater)) + '</p><p class="muted small">' + esc(L(G.controls)) + '</p><div class="actions"><button class="btn" data-play>' + esc(L(G.play)) + '</button></div></article>';
    root.querySelector('[data-play]').onclick = () => start(sc.id);
  }



  function start(id) {
    const sc = scenById(id); stop();
    st = newState(sc);
    root.innerHTML = '<a class="back" href="#game" data-back>← ' + esc(L(G.backToList)) + '</a>' +
      '<div class="g-stage g3d"><div class="g-hud"></div>' +
      '<button class="g-signal" data-signal>🔊 ' + esc(L(G.signalBtn)) + '</button>' +
      '<div class="g-marker" hidden></div><div class="g-cross" aria-hidden="true"></div><div class="g-bubble" hidden></div>' +
      '<div class="g-joy"><div class="g-knob"></div></div>' +
      '<button class="g-action" data-action>' + esc(L(G.actionBtn)) + '</button>' +
      '<p class="g-hint">' + esc(L(G.lookHint)) + '</p><div class="g-pactl" hidden></div></div><div class="g-log"></div>';
    root.querySelector('[data-back]').onclick = () => { stop(); st = null; };
    const stage = root.querySelector('.g-stage');
    if (!window.THREE) { stage.innerHTML = '<p class="warn">' + esc(L(G.noThree)) + '</p>'; return; }
    try { setup3d(); } catch (e) { teardown3d(); stage.innerHTML = '<p class="warn">' + esc(L(G.noWebgl)) + '</p>'; return; }
    if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window) stage.classList.add('touch');
    bindControls();
    say(L(G.startMsg), '');
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    updateHud();
  }

  function stop() {
    running = false; cancelAnimationFrame(raf);
    if (st && st._unbind) st._unbind();
    teardown3d();
    for (const k in keys) keys[k] = false;
    joy.active = false; look.id = null;
  }

  function render(container, arg) {
    root = container;
    if (st && st.result && (!arg || arg === st.sc.id)) { renderResult(); return; }
    if (st && arg === st.sc.id && (running || st.phase === 'pa' || st.phase === 'extract')) return;
    if (arg && scenById(arg)) { if (st && st.sc.id !== arg) { stop(); st = null; } renderBrief(scenById(arg)); return; }
    stop(); st = null; renderList();
  }

  function padScreen(i) {
    if (!camera || !O.vBody) return null;
    const p = bp(i === 0 ? 'padR' : 'padL').project(camera); const r = canvas.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }
  return { render, stop, scenario: scenById, debug: () => st, padScreen };
}
