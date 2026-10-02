/* ===== Simulación 3D en primera persona =====
   Rescate en piscina y playa con Three.js r128 (geometría propia, sin assets externos).
   Los primeros auxilios reutilizan los mini-juegos DOM.
   createGame(api) → { render(root, arg), stop(), scenario(id) } */

function createGame(api) {
  'use strict';
  const { L, esc, UI, CASES, flagHtml, record, progress } = api;
  const G = UI.game;

  /* ---------- escenarios ---------- */
  const SCEN = [
    { id: 'g-pis-ahog4', caseId: 'pis-ahog4', map: 'pool', victim: { conscious: false, breathing: false }, pa: 'pcr', drowning: true },
    { id: 'g-pis-convuls', caseId: 'pis-convuls', map: 'pool', victim: { conscious: false, breathing: true, convulsing: 40 }, pa: 'decisions', vpos: [1.6, -10] },
    { id: 'g-pla-ahog2', caseId: 'pla-ahog2', map: 'beach', rip: true, victim: { conscious: true, panic: true }, pa: 'decisions' },
    { id: 'g-pla-lm', caseId: 'pla-lm-romp', map: 'beach', victim: { conscious: false, breathing: false, lm: true }, pa: 'pcr', drowning: true, cervical: true, sand: true }
  ];
  const scenById = (id) => SCEN.find((s) => s.id === id);
  const caseOf = (sc) => CASES.find((c) => c.id === sc.caseId);

  /* ---------- mundo (metros) ---------- */
  const POOL = { x0: -6.25, x1: 6.25, z0: -25, z1: 0 };
  const POOL_WY = -0.22;
  const RIP = { x0: 6, x1: 14 };
  const BOUNDS = { pool: { x0: -15, x1: 11, z0: -31, z1: 5 }, beach: { x0: -40, x1: 40, z0: -75, z1: 24 } };

  /* ---------- estado ---------- */
  let root = null, canvas = null, renderer = null, scene = null, camera = null, raf = 0, last = 0, running = false, wt = 0;
  let O = {};
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
      cpr: null, result: null
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
    if (isPool()) return POOL_WY + 0.02 * Math.sin(x * 1.3 + t * 1.4) * Math.cos(z * 1.1 + t * 0.9);
    const near = clamp(1 + z / 25, 0.25, 1);
    return 0.11 * Math.sin(z * 0.38 + t * 1.6) * near + 0.05 * Math.sin(x * 0.45 + t * 1.1) + 0.04 * Math.sin((x + z) * 0.9 + t * 2.3);
  }
  const fwdVec = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });

  /* ---------- bucle ---------- */
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; wt += dt;
    if (!st.paused && st.phase === 'play') { update(dt); updateHud(); }
    animate(dt);
    if (running) raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    const s = st, p = s.player, v = s.victim, sc = s.sc;
    s.t += dt;
    if (s.entryAnim > 0) s.entryAnim = Math.max(0, s.entryAnim - dt);
    if (s.signalAt !== null) {
      if (!s.partnerHere && s.t >= s.partnerAt) { s.partnerHere = true; say(L(G.partnerHere), 'ok'); }
      if (!s.desaHere && s.t >= s.desaAt) { s.desaHere = true; say(L(G.desaHere), 'ok'); }
    }
    // entrada de movimiento
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
    // coger el material
    if (!s.tube.taken && dxz(p, s.tube) < 1.1) { s.tube.taken = true; s.hasTube = true; say(L(G.tookTube), 'ok'); }
    // víctima
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

  /* ---------- acciones ---------- */
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
      progressBar(L(G.extracting), o.secs, () => { s.phase = 'pa'; s.inWater = false; teardown3d(); startPA(); });
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



  /* ---------- escena 3D ---------- */
  const MATS = {};
  function mat(color) { if (!MATS[color]) MATS[color] = new THREE.MeshLambertMaterial({ color }); return MATS[color]; }
  function box(w, h, d, color) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); }
  function cyl(r1, r2, h, color, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), mat(color)); }
  function sph(r, color) { return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(color)); }
  function at(m, x, y, z) { m.position.set(x, y, z); return m; }

  function makeHuman(shirt, skin, trunks) {
    const b = new THREE.Group();
    b.add(at(box(0.42, 0.62, 0.24, shirt), 0, 1.15, 0));
    b.add(at(sph(0.13, skin), 0, 1.6, 0));
    const hair = at(sph(0.135, '#3B2A20'), 0, 1.66, -0.02); hair.scale.set(1, 0.6, 1); b.add(hair);
    b.add(at(box(0.03, 0.02, 0.01, '#10232B'), -0.045, 1.62, 0.127), at(box(0.03, 0.02, 0.01, '#10232B'), 0.045, 1.62, 0.127));
    b.add(at(box(0.4, 0.2, 0.25, trunks), 0, 0.78, 0));
    b.add(at(box(0.15, 0.72, 0.16, skin), -0.11, 0.36, 0), at(box(0.15, 0.72, 0.16, skin), 0.11, 0.36, 0));
    const armL = at(new THREE.Group(), -0.29, 1.42, 0), armR = at(new THREE.Group(), 0.29, 1.42, 0);
    armL.add(at(box(0.1, 0.62, 0.1, skin), 0, -0.31, 0)); armR.add(at(box(0.1, 0.62, 0.1, skin), 0, -0.31, 0));
    b.add(armL, armR);
    b.userData = { armL, armR };
    return b;
  }
  function makeTube() {
    const g = new THREE.Group();
    const c = cyl(0.075, 0.075, 0.9, '#D7263D'); c.rotation.z = Math.PI / 2; g.add(c);
    g.add(at(sph(0.075, '#D7263D'), -0.45, 0, 0), at(sph(0.075, '#D7263D'), 0.45, 0, 0));
    g.add(at(box(0.02, 0.02, 0.5, '#10232B'), 0.45, 0, 0.25));
    return g;
  }
  function makeFPArm(side) {
    const sh = at(new THREE.Group(), side * 0.2, -0.26, -0.08);
    const up = cyl(0.058, 0.052, 0.3, '#D7263D'); up.rotation.x = Math.PI / 2; up.position.z = -0.15; sh.add(up);
    const el = at(new THREE.Group(), 0, 0, -0.3); sh.add(el);
    const fo = cyl(0.05, 0.042, 0.3, '#E3A57E'); fo.rotation.x = Math.PI / 2; fo.position.z = -0.15; el.add(fo);
    el.add(at(box(0.085, 0.04, 0.12, '#E3A57E'), 0, 0, -0.34));
    sh.userData = { el };
    return sh;
  }
  function makeWater(w, d, sx, sz, cx, cz, colorFn) {
    const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { c.set(colorFn(cx + pos.getX(i), cz + pos.getZ(i))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: isPool() ? 0.78 : 0.92, shininess: 80, specular: 0x99ccdd }));
    m.position.set(cx, 0, cz); m.userData = { cx, cz };
    return m;
  }

  function buildPool() {
    scene.background = new THREE.Color('#BFE3F2'); scene.fog = new THREE.Fog('#BFE3F2', 30, 90);
    const deck = '#E8DCC2';
    scene.add(at(box(8.75, 0.1, 36, deck), -10.625, -0.05, -13), at(box(4.75, 0.1, 36, deck), 8.625, -0.05, -13));
    scene.add(at(box(12.5, 0.1, 5, deck), 0, -0.05, 2.5), at(box(12.5, 0.1, 6, deck), 0, -0.05, -28));
    const cop = '#FFFFFF';
    scene.add(at(box(0.35, 0.08, 25.7, cop), POOL.x0 - 0.17, 0.0, -12.5), at(box(0.35, 0.08, 25.7, cop), POOL.x1 + 0.17, 0.0, -12.5));
    scene.add(at(box(13.2, 0.08, 0.35, cop), 0, 0.0, POOL.z1 + 0.17), at(box(13.2, 0.08, 0.35, cop), 0, 0.0, POOL.z0 - 0.17));
    const basin = new THREE.Mesh(new THREE.BoxGeometry(12.5, 2.4, 25), new THREE.MeshLambertMaterial({ color: '#7FC8E8', side: THREE.BackSide }));
    basin.position.set(0, -1.2, -12.5); scene.add(basin);
    for (let i = 0; i < 6; i++) scene.add(at(box(0.25, 0.01, 23, '#1E5A82'), -5 + i * 2.5 - 0.0, -2.38, -12.5));
    O.water = makeWater(12.5, 25, 20, 40, 0, -12.5, () => '#3AA6D8'); scene.add(O.water);
    [-3.75, -1.25, 1.25, 3.75].forEach((x) => { for (let k = 0; k < 10; k++) { const seg = cyl(0.07, 0.07, 2.5, k % 2 ? '#FFFFFF' : '#D7263D', 8); seg.rotation.x = Math.PI / 2; seg.position.set(x, POOL_WY + 0.03, -1.25 - k * 2.5); scene.add(seg); } });
    // silla de vigilancia
    const ch = new THREE.Group(); ch.position.set(-8.2, 0, -6.5);
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => ch.add(at(box(0.07, 1.8, 0.07, '#F2F2F2'), x, 0.9, z)));
    ch.add(at(box(0.8, 0.08, 0.8, '#0B4F6C'), 0, 1.8, 0), at(box(0.8, 0.6, 0.08, '#0B4F6C'), 0, 2.1, -0.38));
    scene.add(ch);
    // enfermería
    scene.add(at(box(4, 3, 3, '#F7F7F7'), -12.5, 1.5, -26));
    scene.add(at(box(0.25, 1, 0.05, '#D7263D'), -12.5, 2, -24.47), at(box(1, 0.25, 0.05, '#D7263D'), -12.5, 2, -24.47));
    // gradas / pared de fondo
    scene.add(at(box(36, 4, 0.5, '#D9E7EC'), -2, 2, -31.2), at(box(0.5, 4, 36, '#D9E7EC'), -15.2, 2, -13));
    // escaleras
    [[5.6, -0.3], [-5.6, -24.7]].forEach(([x, z]) => { scene.add(at(box(0.05, 1.1, 0.05, '#C0C0C0'), x - 0.25, 0.45, z), at(box(0.05, 1.1, 0.05, '#C0C0C0'), x + 0.25, 0.45, z)); });
  }

  function buildBeach() {
    scene.background = new THREE.Color('#9FD3EC'); scene.fog = new THREE.Fog('#9FD3EC', 40, 150);
    scene.add(at(box(160, 0.4, 50, '#EBD9A8'), 0, -0.1, 25));
    scene.add(at(box(160, 0.42, 5, '#D7C08A'), 0, -0.11, 2.5));
    O.water = makeWater(160, 100, 64, 50, 0, -50, (x, z) => (z < -1 && x > RIP.x0 && x < RIP.x1 && st.sc.rip) ? '#2C6F86' : (z > -6 ? '#5FBBD6' : '#1F7FB8'));
    scene.add(O.water);
    // puesto de socorro
    const tw = new THREE.Group(); tw.position.set(-3, 0, 17);
    [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, z]) => tw.add(at(box(0.12, 2.2, 0.12, '#F2F2F2'), x, 1.1, z)));
    tw.add(at(box(2.2, 1.5, 2.2, '#D7263D'), 0, 2.9, 0), at(box(2.6, 0.12, 2.6, '#F2F2F2'), 0, 3.7, 0));
    scene.add(tw);
    // bandera amarilla
    scene.add(at(cyl(0.04, 0.04, 4, '#E6E6E6', 6), 2.5, 2, 15));
    const flag = at(box(0.9, 0.55, 0.02, '#E9B51C'), 2.98, 3.6, 15); scene.add(flag); O.flag = flag;
    // sombrillas
    [[-12, 9, '#1D8A4A'], [-18, 12, '#D7263D'], [14, 10, '#0B4F6C'], [20, 14, '#E9B51C'], [-25, 7, '#7FC3DC']].forEach(([x, z, c]) => {
      scene.add(at(cyl(0.03, 0.03, 2.2, '#F2F2F2', 6), x, 1.1, z));
      scene.add(at(new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 10), mat(c)), x, 2.3, z));
    });
    // rompientes
    O.breakers = [];
    for (let i = 0; i < 3; i++) { const b = box(70, 0.05, 0.5, '#FFFFFF'); b.material = new THREE.MeshLambertMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.75 }); b.userData.z = -2 - i * 4; scene.add(b); O.breakers.push(b); }
    // corriente de retorno: espuma que sale mar adentro
    O.streaks = [];
    if (st.sc.rip) for (let i = 0; i < 16; i++) { const s = box(0.22, 0.03, 1.6, '#FFFFFF'); s.material = new THREE.MeshLambertMaterial({ color: '#E8F4F8', transparent: true, opacity: 0.55 }); s.userData = { x: RIP.x0 + 0.5 + Math.random() * (RIP.x1 - RIP.x0 - 1), z: -2 - Math.random() * 50 }; scene.add(s); O.streaks.push(s); }
  }

  function setup3d() {
    const stage = root.querySelector('.g-stage');
    const wpx = Math.max(280, stage.clientWidth);
    const portrait = wpx < 600;
    const hpx = portrait ? Math.round(Math.min(window.innerHeight * 0.68, wpx * 1.4)) : Math.round(Math.min(wpx * 0.6, window.innerHeight * 0.78));
    renderer = new THREE.WebGLRenderer({ antialias: !portrait, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.5 : 1.75));
    renderer.setSize(wpx, hpx);
    canvas = renderer.domElement; canvas.className = 'g-canvas';
    stage.insertBefore(canvas, stage.firstChild);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(portrait ? 80 : 70, wpx / hpx, 0.05, 400);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb59a6a, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(20, 40, 15); scene.add(sun);
    O = {};
    if (isPool()) buildPool(); else buildBeach();
    // material en el suelo
    O.tubeWorld = makeTube(); O.tubeWorld.position.set(st.tube.x, isPool() ? 0.08 : 0.17, st.tube.z); O.tubeWorld.rotation.y = 0.7; scene.add(O.tubeWorld);
    // víctima
    O.vYaw = new THREE.Group(); O.vTilt = new THREE.Group(); O.vBody = makeHuman('#2F6FB5', '#E8B48F', '#1B2F4A'); O.vBody.position.y = -0.95;
    O.vTilt.add(O.vBody); O.vYaw.add(O.vTilt); scene.add(O.vYaw);
    // compañero y DESA
    O.partner = makeHuman('#F2C94C', '#D9A07A', '#C0392B'); O.partner.visible = false; scene.add(O.partner);
    O.desa = new THREE.Group(); O.desa.add(at(box(0.36, 0.26, 0.14, '#1D8A4A'), 0, 0.13, 0), at(box(0.12, 0.12, 0.01, '#FFFFFF'), 0, 0.15, 0.075)); O.desa.visible = false; scene.add(O.desa);
    if (isPool()) { O.partner.position.set(-7.1, 0, -14); O.partner.rotation.y = Math.PI / 2; O.desa.position.set(-7, 0, -15.2); }
    else { O.partner.position.set(-1.2, 0.1, 2.5); O.partner.rotation.y = Math.PI; O.desa.position.set(0, 0.1, 3); }
    // brazos en primera persona
    O.armR = makeFPArm(1); O.armL = makeFPArm(-1); O.armR.rotation.y = -0.1; O.armL.rotation.y = 0.1;
    O.heldTube = makeTube(); O.heldTube.scale.set(0.85, 0.85, 0.85); O.heldTube.visible = false;
    camera.add(O.armR, O.armL, O.heldTube);
    O.splash = [];
    onResize = () => {
      if (!renderer) return;
      const w = Math.max(280, stage.clientWidth), pr = w < 600;
      const h = pr ? Math.round(Math.min(window.innerHeight * 0.68, w * 1.4)) : Math.round(Math.min(w * 0.6, window.innerHeight * 0.78));
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
  }

  function teardown3d() {
    running = false; cancelAnimationFrame(raf);
    if (onResize) { window.removeEventListener('resize', onResize); onResize = null; }
    if (scene) scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !Object.values(MATS).includes(o.material)) o.material.dispose(); });
    Object.keys(MATS).forEach((k) => { MATS[k].dispose(); delete MATS[k]; });
    if (renderer) { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
    renderer = null; scene = null; camera = null; canvas = null; O = {};
  }

  function splash(x, z) {
    for (let i = 0; i < 16; i++) {
      const m = sph(0.06, '#FFFFFF'); const y = waveH(x, z, wt);
      m.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
      m.userData = { vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2.2, vz: (Math.random() - 0.5) * 2, life: 1 };
      scene.add(m); O.splash.push(m);
    }
  }

  /* ---------- animación y render ---------- */
  function animate(dt) {
    if (!renderer || !st) return;
    const s = st, p = s.player, v = s.victim;
    // olas
    const pos = O.water.geometry.attributes.position, cx = O.water.userData.cx, cz = O.water.userData.cz;
    for (let i = 0; i < pos.count; i++) pos.setY(i, waveH(cx + pos.getX(i), cz + pos.getZ(i), wt));
    pos.needsUpdate = true;
    if (O.breakers) O.breakers.forEach((b) => { b.userData.z += 1.8 * dt; if (b.userData.z > 0.5) b.userData.z = -12; b.position.set(0, waveH(0, b.userData.z, wt) + 0.06, b.userData.z); b.material.opacity = clamp(0.2 + (b.userData.z + 12) / 14, 0.2, 0.85); });
    if (O.streaks) O.streaks.forEach((k) => { k.userData.z -= 0.9 * dt; if (k.userData.z < -55) k.userData.z = -2; k.position.set(k.userData.x, waveH(k.userData.x, k.userData.z, wt) + 0.04, k.userData.z); });
    if (O.flag) O.flag.rotation.y = Math.sin(wt * 3) * 0.25;
    // cámara
    let h;
    const land = 1.65 + Math.sin(s.walk) * 0.035;
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
    poseArms(dt);
    // material
    O.tubeWorld.visible = !s.tube.taken;
    O.partner.visible = s.partnerHere; O.desa.visible = s.desaHere;
    // víctima
    poseVictim();
    // salpicaduras
    for (let i = O.splash.length - 1; i >= 0; i--) { const m = O.splash[i]; const u = m.userData; u.vy -= 9.8 * dt; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt; u.life -= dt; if (u.life <= 0 || m.position.y < waveH(m.position.x, m.position.z, wt) - 0.1) { scene.remove(m); m.geometry.dispose(); O.splash.splice(i, 1); } }
    renderer.render(scene, camera);
    placeMarker();
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

  function poseVictim() {
    const s = st, v = s.victim, y = waveH(v.x, v.z, wt);
    O.vYaw.position.set(v.x, y, v.z);
    const armL = O.vBody.userData.armL, armR = O.vBody.userData.armR;
    O.vTilt.rotation.z = 0; armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0);
    if (s.towing || (s.contact && v.faceUp)) {
      O.vYaw.rotation.y = s.yaw + Math.PI; O.vTilt.rotation.x = -Math.PI / 2; O.vYaw.position.y = y + 0.03;
      armL.rotation.z = -0.4; armR.rotation.z = 0.4;
      if (v.convulsing > 0) O.vTilt.rotation.z = Math.sin(wt * 25) * 0.12;
    } else if (v.conscious && !s.contact) {
      O.vYaw.rotation.y = s.yaw + Math.PI * 0.85; O.vTilt.rotation.x = -0.28; O.vYaw.position.y = y - 0.62 + Math.sin(wt * 3) * 0.06;
      armL.rotation.x = -1.3 + Math.sin(wt * 6) * 0.6; armR.rotation.x = -1.3 + Math.sin(wt * 6 + Math.PI) * 0.6;
      armL.rotation.z = -0.5; armR.rotation.z = 0.5;
    } else {
      O.vYaw.rotation.y = 0.5; O.vTilt.rotation.x = Math.PI / 2; O.vYaw.position.y = y - 0.06;
      armL.rotation.z = -0.9; armR.rotation.z = 0.9;
      if (v.convulsing > 0) { O.vTilt.rotation.z = Math.sin(wt * 25) * 0.18; armL.rotation.x = Math.sin(wt * 22) * 0.6; armR.rotation.x = Math.sin(wt * 22 + 1) * 0.6; }
    }
  }

  const tmpV = { x: 0, y: 0, z: 0 };
  function placeMarker() {
    const el = root && root.querySelector('.g-marker'); if (!el || !camera) return;
    const s = st;
    if (s.contact) { el.hidden = true; return; }
    const v3 = new THREE.Vector3(s.victim.x, waveH(s.victim.x, s.victim.z, wt) + 0.9, s.victim.z).project(camera);
    if (v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = ((v3.x + 1) / 2 * canvas.clientWidth) + 'px';
    el.style.top = ((1 - v3.y) / 2 * canvas.clientHeight) + 'px';
    const d = Math.round(Math.hypot(s.victim.x - s.player.x, s.victim.z - s.player.z));
    el.textContent = (s.victim.conscious ? L(G.riaLabel) + ' · ' : '') + d + ' m';
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



  /* ---------- fase PA ---------- */
  function startPA() {
    const s = st; running = false; cancelAnimationFrame(raf);
    s.paStart = s.t;
    if (s.sc.pa === 'pcr') pcrFlow(); else decisionsFlow();
  }

  function paShell(inner) {
    const stage = root.querySelector('.g-stage');
    stage.innerHTML = '<div class="g-pa">' + inner + '</div>';
    return stage.querySelector('.g-pa');
  }
  function paHud() {
    const v = st.victim;
    const bar = (label, val, cls) => '<div class="g-bar ' + cls + '"><span>' + esc(label) + '</span><i><b style="width:' + Math.round(val) + '%"></b></i></div>';
    return '<div class="g-pahud"><div class="g-time">' + fmt(st.t) + '</div>' + bar(L(G.o2), v.o2, v.o2 < 30 ? 'red' : (v.o2 < 60 ? 'yellow' : 'green')) + bar(L(G.temp), v.temp, v.temp < 40 ? 'red' : (v.temp < 70 ? 'yellow' : 'green')) + '</div>';
  }
  function paChoice(title, opts, cb, secs) {
    const shuffled = opts.slice().sort(() => Math.random() - 0.5);
    const el = paShell(paHud() + '<div class="g-card wide"><h3>' + esc(title) + '</h3>' + (secs ? '<div class="progressbar"><span id="g-timer" style="width:100%"></span></div>' : '') + '<div class="options">' + shuffled.map((o, i) => '<button class="opt" data-i="' + i + '">' + esc(L(o.t)) + '</button>').join('') + '</div><div class="g-fb" id="g-fb"></div></div>');
    let timer = null;
    if (secs) {
      const t0 = performance.now();
      const tick = () => { const k = clamp(1 - (performance.now() - t0) / (secs * 1000), 0, 1); const b = document.getElementById('g-timer'); if (!b) return; b.style.width = Math.round(k * 100) + '%'; st.victim.o2 -= 0.4 * (1 / 60); if (k > 0) timer = requestAnimationFrame(tick); else { st.victim.o2 -= 6; st.t += secs; markWrong(); showFb(L(G.timeout), 'yellow', () => cb({ timeout: true })); } };
      timer = requestAnimationFrame(tick);
    }
    el.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { if (timer) cancelAnimationFrame(timer); st.t += 3; cb(shuffled[+b.dataset.i]); });
  }
  function showFb(text, cls, next) {
    const fb = document.getElementById('g-fb');
    if (!fb) { next(); return; }
    fb.innerHTML = '<div class="feedback ' + cls + '"><p>' + esc(text) + '</p><button class="btn" id="g-next">' + esc(L(UI.continue)) + '</button></div>';
    document.getElementById('g-next').onclick = next;
    root.querySelectorAll('.g-pa .opt').forEach((b) => b.disabled = true);
  }
  function handle(o, okText, next) {
    if (o.crit) { markCrit(L(o.crit)); st.victim.o2 -= 10; showFb(L(UI.critical) + ': ' + L(o.crit), 'red', next); }
    else if (o.wrong) { markWrong(); st.victim.o2 -= 4; st.t += 6; showFb(L(o.wrong), 'yellow', next); }
    else showFb(okText, 'green', next);
  }

  /* ---- decisiones cronometradas (reutiliza los pasos del caso) ---- */
  function decisionsFlow() {
    const c = caseOf(st.sc); const steps = c.pa.slice(); let i = 0;
    const step = () => {
      if (i >= steps.length) { finishGame(); return; }
      const stp = steps[i];
      const opts = [{ t: stp.t, ok: true, why: stp.why }].concat((stp.alts || []).map((a) => a.crit ? { t: a.t, crit: a.why } : { t: a.t, wrong: a.why }));
      paChoice(L(UI.whatNow) + ' (' + (i + 1) + '/' + steps.length + ')', opts, (o) => {
        if (o.timeout) { i++; step(); return; }
        if (o.ok && /manta|abr[ií]g|abriga/i.test(L(stp.t))) st.victim.temp = Math.min(100, st.victim.temp + 25);
        handle(o, L(stp.why), () => { i++; step(); });
      }, 25);
    };
    step();
  }

  /* ---- vía PCR: mini-juegos ---- */
  function pcrFlow() {
    const sc = st.sc, v = st.victim;
    v.breathing = false;
    const q = [];
    // 1. consciencia (+ en tierra: pedir ayuda)
    q.push((next) => paChoice(L(G.pcrConscTitle), [
      { t: G.pcrConscOk, ok: true }, { t: G.pcrConscCompress, wrong: G.pcrConscCompressWhy }, { t: G.pcrConscHeimlich, crit: G.critHeimlich }, { t: G.pcrConscPLS, crit: G.critPLS }
    ], (o) => handle(o, L(G.pcrConscOkWhy), next)));
    if (sc.land) q.push((next) => paChoice(L(G.pcrHelpTitle), [
      { t: G.pcrHelpOk, ok: true }, { t: G.pcrHelpNone, wrong: G.pcrHelpNoneWhy }, { t: G.pcrHelpGo, wrong: G.pcrHelpGoWhy }
    ], (o) => { if (o.ok || o.wrong) { st.signalAt = st.t; st.desaAt = st.t + (o.ok ? 45 : 70); st.desaHere = false; } handle(o, L(G.pcrHelpOkWhy), next); }));
    // 2. vía aérea
    q.push((next) => paChoice(L(G.pcrAirwayTitle), sc.cervical
      ? [{ t: G.airJaw, ok: true }, { t: G.airHeadTilt, wrong: G.airHeadTiltLmWhy }, { t: G.airGuedelFirst, wrong: G.airGuedelWhy }]
      : [{ t: G.airHeadTiltCerv, ok: true }, { t: G.airHyper, wrong: G.airHyperWhy }, { t: G.airGuedelFirst, wrong: G.airGuedelWhy }],
      (o) => handle(o, L(sc.cervical ? G.airJawWhy : G.airHeadTiltCervWhy), next)));
    // 3. VOS (mantener pulsado ≤10 s)
    q.push((next) => vosGame(next));
    // 4. 5 insuflaciones o 30:2 directo
    q.push((next) => paChoice(L(G.pcrStartTitle), sc.drowning
      ? [{ t: G.startFive, ok: true }, { t: G.startCompress, wrong: G.startCompressWhy }, { t: G.startTwo, wrong: G.startTwoWhy }, { t: G.startDrain, crit: G.critDrain }]
      : [{ t: G.startCompress, ok: true }, { t: G.startFive, wrong: G.startFiveLandWhy }, { t: G.startPLS, crit: G.critPLS }],
      (o) => { st.startChoice = o; handle(o, L(sc.drowning ? G.startFiveWhy : G.startCompressWhy2), next); }));
    q.push((next) => { if (sc.drowning && !(st.startChoice && st.startChoice.crit)) ventGame(5, next); else next(); });
    // 5. RCP + DESA
    q.push((next) => cprGame(next));
    // 6. tras recuperar
    q.push((next) => paChoice(L(G.afterTitle), sc.cervical
      ? [{ t: G.afterSupineCerv, ok: true }, { t: G.afterPLS, crit: G.critPLSLm }, { t: G.afterDrink, crit: G.critDrink }]
      : [{ t: G.afterPLS, ok: true }, { t: G.afterDrink, crit: G.critDrink }, { t: G.afterLeave, wrong: G.afterLeaveWhy }],
      (o) => { if (o.ok) v.temp = Math.min(100, v.temp + 25); handle(o, L(sc.cervical ? G.afterSupineCervWhy : G.afterPLSWhy), () => { finishGame(); }); }));
    let i = 0; const run = () => { if (i < q.length) q[i++](run); }; run();
  }

  function vosGame(next) {
    const el = paShell(paHud() + '<div class="g-card wide"><h3>' + esc(L(G.vosTitle)) + '</h3><p>' + esc(L(G.vosHint)) + '</p><button class="btn g-hold" id="g-vos">' + esc(L(G.vosBtn)) + '</button><div class="progressbar"><span id="g-vosbar" style="width:0%"></span></div><p class="muted small" id="g-vossec">0,0 s</p><div class="g-fb" id="g-fb"></div></div>');
    const btn = el.querySelector('#g-vos'); let t0 = 0, rafId = 0, done = false;
    const tick = () => { if (!t0 || done) return; const e = (performance.now() - t0) / 1000; const b = document.getElementById('g-vosbar'); if (b) b.style.width = Math.round(Math.min(100, e * 10)) + '%'; const sec = document.getElementById('g-vossec'); if (sec) sec.textContent = e.toFixed(1).replace('.', ',') + ' s'; if (e >= 10) { stop(); return; } rafId = requestAnimationFrame(tick); };
    const stop = () => { if (done || !t0) return; done = true; cancelAnimationFrame(rafId); const e = (performance.now() - t0) / 1000; st.t += e; btn.disabled = true;
      if (e > 10) { markWrong(); st.victim.o2 -= 4; showFb(L(G.vosTooLong), 'yellow', next); } else if (e < 2) { markWrong(); showFb(L(G.vosTooShort), 'yellow', next); } else showFb(L(G.vosResult), 'green', next); };
    btn.onpointerdown = (e) => { e.preventDefault(); if (t0) return; t0 = performance.now(); btn.classList.add('listening'); rafId = requestAnimationFrame(tick); };
    btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { if (t0 && !done) { btn.classList.remove('listening'); stop(); } };
  }

  function ventGame(count, next, after) {
    const el = paShell(paHud() + '<div class="g-card wide"><h3>' + esc(count === 5 ? L(G.ventTitle5) : L(G.ventTitle2)) + '</h3><p>' + esc(L(G.ventHint)) + '</p>' +
      '<div class="g-chest"><svg viewBox="0 0 200 120" width="100%" aria-hidden="true"><ellipse id="g-lung" cx="100" cy="75" rx="70" ry="30" fill="#F0B48F"/><circle cx="100" cy="22" r="16" fill="#F0B48F"/><rect x="40" y="72" width="120" height="6" fill="rgba(0,0,0,0.08)"/></svg><div class="g-gauge"><i style="left:38%;width:34%"></i><b id="g-gbar" style="width:0%"></b></div></div>' +
      '<button class="btn g-hold" id="g-vent">' + esc(L(G.ventBtn)) + '</button><p class="muted small" id="g-ventcount">0 / ' + count + '</p><div class="g-fb" id="g-fb"></div></div>');
    const btn = el.querySelector('#g-vent'); let holding = false, level = 0, good = 0, fails = 0, rafId = 0, lastT = 0, finished = false;
    const render = () => { const b = document.getElementById('g-gbar'); if (b) b.style.width = Math.round(level) + '%'; const lung = document.getElementById('g-lung'); if (lung) lung.setAttribute('ry', 30 + level * 0.25); };
    const tick = (ts) => { if (finished) return; const dt = lastT ? (ts - lastT) / 1000 : 0; lastT = ts; if (holding) level = Math.min(100, level + 55 * dt); else level = Math.max(0, level - 90 * dt); render(); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    const release = () => {
      if (!holding || finished) return; holding = false; btn.classList.remove('listening'); st.t += 1.5;
      if (level >= 38 && level <= 72) { good++; st.victim.o2 = Math.min(100, st.victim.o2 + 4); if (st.firstVentAt === null) st.firstVentAt = st.t; }
      else if (level > 85) { fails++; st.victim.o2 -= 3; st.t += 3; flash(L(G.ventTooMuch)); }
      else if (level < 38) { flash(L(G.ventTooLittle)); }
      level = 0; render();
      const cnt = document.getElementById('g-ventcount'); if (cnt) cnt.textContent = good + ' / ' + count;
      if (good >= count) { finished = true; cancelAnimationFrame(rafId); btn.disabled = true; st.ventFails = (st.ventFails || 0) + fails; if (after) after(); else showFb(L(G.ventDone), 'green', next); }
    };
    btn.onpointerdown = (e) => { e.preventDefault(); if (finished) return; holding = true; btn.classList.add('listening'); };
    btn.onpointerup = btn.onpointerleave = btn.onpointercancel = release;
  }
  function flash(text) { const fb = document.getElementById('g-fb'); if (!fb) return; fb.innerHTML = '<p class="g-flash">' + esc(text) + '</p>'; setTimeout(() => { if (fb.firstChild && fb.firstChild.className === 'g-flash') fb.innerHTML = ''; }, 1400); }

  function cprGame(next) {
    const s = st; s.cpr = { taps: 0, good: 0, cycles: 0, lastTap: 0, shocked: false };
    let desaDone = false;
    const cycle = () => {
      const el = paShell(paHud() + '<div class="g-card wide"><h3>' + esc(L(G.cprTitle)) + ' · ' + esc(L(G.cycle)) + ' ' + (s.cpr.cycles + 1) + '</h3><p>' + esc(L(G.cprHint)) + '</p>' +
        '<div class="g-metro"><div class="g-needle" id="g-needle"></div><div class="g-zone"></div></div>' +
        '<button class="btn g-press" id="g-press">' + esc(L(G.cprBtn)) + '<br><small id="g-cnt">0 / 30</small></button><p class="muted small" id="g-bpm">—</p>' +
        (s.desaHere && !desaDone ? '<button class="btn ghost" id="g-desa">' + esc(L(G.useDesa)) + '</button>' : (s.signalAt !== null && !desaDone ? '<p class="muted small">' + esc(L(G.desaComing)) + '</p>' : '')) + '<div class="g-fb" id="g-fb"></div></div>');
      let n = 0, good = 0, last = 0, rafId = 0; const t0 = performance.now();
      const needle = () => { const ph = ((performance.now() - t0) % 545) / 545; const nd = document.getElementById('g-needle'); if (nd) nd.style.left = (ph * 100) + '%'; const wait = (performance.now() - t0) / 1000; if (s.signalAt !== null && !s.desaHere && s.t + wait >= s.desaAt) { s.desaHere = true; const b = document.getElementById('g-desa'); if (!b && !desaDone) { const fbEl = document.getElementById('g-fb'); if (fbEl && !document.getElementById('g-desa')) { const bb = document.createElement('button'); bb.className = 'btn ghost'; bb.id = 'g-desa'; bb.textContent = L(G.useDesa); fbEl.parentNode.insertBefore(bb, fbEl); bb.onclick = () => desaGame(); } } } rafId = requestAnimationFrame(needle); };
      rafId = requestAnimationFrame(needle);
      const press = el.querySelector('#g-press');
      press.onpointerdown = (e) => { e.preventDefault(); const now = performance.now(); if (last) { const iv = now - last; const bpm = 60000 / iv; const b = document.getElementById('g-bpm'); if (b) b.textContent = Math.round(bpm) + ' /min'; if (bpm >= 100 && bpm <= 120) good++; else if (bpm > 140) { st.victim.o2 -= 0.3; } } last = now; n++; st.victim.o2 -= 0.15; const c = document.getElementById('g-cnt'); if (c) c.textContent = n + ' / 30'; press.classList.add('pressed'); setTimeout(() => press.classList.remove('pressed'), 80);
        if (n >= 30) { cancelAnimationFrame(rafId); s.cpr.taps += n - 1; s.cpr.good += good; s.cpr.cycles++; s.t += 18;
          ventGame(2, null, () => { s.t += 3; if (s.cpr.cycles >= 5 && !desaDone && s.signalAt === null) { finishCpr(); } else if (s.cpr.cycles >= 2 && (desaDone || s.cpr.cycles >= 6)) finishCpr(); else cycle(); }); } };
      const db = el.querySelector('#g-desa'); if (db) db.onclick = () => { cancelAnimationFrame(rafId); desaGame(); };
    };
    const desaGame = () => {
      const sand = s.sc.sand, wet = s.sc.wetFloor || s.sc.map !== 'none';
      const el = paShell(paHud() + '<div class="g-card wide"><h3>' + esc(L(G.desaTitle)) + '</h3><p>' + esc(L(G.desaHint)) + '</p>' +
        '<div class="g-prep">' + (wet ? '<button class="btn small ghost" data-prep="dry">' + esc(L(sand ? G.prepMoveSand : G.prepDryFloor)) + '</button>' : '') + '<button class="btn small ghost" data-prep="chest">' + esc(L(G.prepDryChest)) + '</button>' + (sand ? '<button class="btn small ghost" data-prep="sand">' + esc(L(G.prepSand)) + '</button>' : '') + '</div>' +
        '<div class="g-torso" id="g-torso"><svg viewBox="0 0 240 260" width="100%" aria-hidden="true"><circle cx="120" cy="32" r="26" fill="#F0B48F"/><path d="M60 70 Q120 50 180 70 L200 200 Q120 230 40 200 Z" fill="#F0B48F"/><rect x="118" y="80" width="4" height="110" fill="rgba(0,0,0,0.08)"/><text x="30" y="60" font-size="11" fill="#10232B">' + esc(L(G.rightSide)) + '</text><text x="178" y="60" font-size="11" fill="#10232B">' + esc(L(G.leftSide)) + '</text></svg>' +
        '<div class="g-target" style="left:22%;top:30%"></div><div class="g-target" style="left:70%;top:62%"></div>' +
        '<div class="g-pad" data-pad="1" style="left:5%;top:88%">1</div><div class="g-pad" data-pad="2" style="left:75%;top:88%">2</div></div>' +
        '<p class="muted small" id="g-desamsg"></p><div class="g-fb" id="g-fb"></div></div>');
      const prep = { dry: !wet, chest: false, sand: !sand }; let placed = 0;
      el.querySelectorAll('[data-prep]').forEach((b) => b.onclick = () => { prep[b.dataset.prep] = true; b.classList.add('on'); b.disabled = true; st.t += 2; });
      const torso = el.querySelector('#g-torso'); const targets = Array.from(torso.querySelectorAll('.g-target'));
      torso.querySelectorAll('.g-pad').forEach((pad) => {
        let drag = false;
        pad.onpointerdown = (e) => { e.preventDefault(); if (pad.classList.contains('ok')) return; drag = true; pad.setPointerCapture(e.pointerId); };
        pad.onpointermove = (e) => { if (!drag) return; const r = torso.getBoundingClientRect(); pad.style.left = clamp((e.clientX - r.left) / r.width * 100 - 7, 0, 86) + '%'; pad.style.top = clamp((e.clientY - r.top) / r.height * 100 - 7, 0, 86) + '%'; };
        pad.onpointerup = (e) => { if (!drag) return; drag = false; const idx = +pad.dataset.pad - 1; const tg = targets[idx]; const pr = pad.getBoundingClientRect(), tr = tg.getBoundingClientRect();
          const d = Math.hypot(pr.left + pr.width / 2 - (tr.left + tr.width / 2), pr.top + pr.height / 2 - (tr.top + tr.height / 2));
          const msg = document.getElementById('g-desamsg');
          if (d < 34) { if (!prep.chest || !prep.sand) { msg.textContent = L(G.padNoStick); return; } pad.style.left = tg.style.left; pad.style.top = tg.style.top; pad.classList.add('ok'); placed++; msg.textContent = ''; if (placed === 2) analyse(); }
          else msg.textContent = L(idx === 0 ? G.padHint1 : G.padHint2); };
      });
      const analyse = () => {
        const fb = document.getElementById('g-fb');
        fb.innerHTML = '<p class="g-flash">' + esc(L(G.desaAnalysing)) + '</p>';
        setTimeout(() => { fb.innerHTML = '<p><strong>' + esc(L(G.desaShockAdvised)) + '</strong></p><button class="btn" id="g-shock">' + esc(L(G.allClear)) + '</button>' + (prep.dry ? '' : '<p class="small muted">' + esc(L(G.wetWarning)) + '</p>');
          document.getElementById('g-shock').onclick = () => { if (!prep.dry) { markCrit(L(G.critWetShock)); } s.cpr.shocked = true; desaDone = true; st.t += 8; showFb(L(G.shockDone), prep.dry ? 'green' : 'red', () => cycle()); }; }, 2500);
      };
    };
    const finishCpr = () => { next(); };
    cycle();
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
      if (!st || st.phase !== 'play' || !running) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE') actionKey();
      if (e.code === 'KeyX') signal();
    };
    const ku = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    st._unbind = () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    // mirar arrastrando
    canvas.addEventListener('pointerdown', (e) => { if (look.id !== null) return; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } });
    canvas.addEventListener('pointermove', (e) => { if (e.pointerId !== look.id || !st || st.paused) return; st.yaw -= (e.clientX - look.x) * 0.0055; st.pitch -= (e.clientY - look.y) * 0.0045; look.x = e.clientX; look.y = e.clientY; });
    const endLook = (e) => { if (e.pointerId === look.id) look.id = null; };
    canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
    // joystick
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
    if (!s.entered && !s.inWater) {
      const f = fwdVec(s.yaw);
      if (isWaterXZ(p.x + f.x * 1.2, p.z + f.z * 1.2)) { askEntry(); return; }
    }
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
      '<div class="g-marker" hidden></div><div class="g-cross" aria-hidden="true"></div>' +
      '<div class="g-joy"><div class="g-knob"></div></div>' +
      '<button class="g-action" data-action>' + esc(L(G.actionBtn)) + '</button>' +
      '<p class="g-hint">' + esc(L(G.lookHint)) + '</p></div><div class="g-log"></div>';
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
    if (st && arg === st.sc.id && (running || st.phase === 'pa')) return;
    if (arg && scenById(arg)) { if (st && st.sc.id !== arg) { stop(); st = null; } renderBrief(scenById(arg)); return; }
    stop(); st = null; renderList();
  }

  return { render, stop, scenario: scenById, debug: () => st };
}
