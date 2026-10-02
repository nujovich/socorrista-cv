/* ===== Simulación 3D en primera persona · Babylon.js =====
   Cielo y agua realistas (SkyMaterial, WaterMaterial), sombras, posprocesado ACES,
   afluencia (bañistas, ruido e intromisiones), audio espacial con grabaciones propias
   y voz del dispositivo. El motor se carga bajo demanda desde jsDelivr.
   createGame(api) → { render(root, arg), stop(), scenario(id) } */

function createGame(api) {
  'use strict';
  const { L, esc, UI, CASES, flagHtml, record, progress } = api;
  const G = UI.game;
  const BJS = '9.29.0';
  const LIBS = ['https://cdn.jsdelivr.net/npm/babylonjs@' + BJS + '/babylon.js', 'https://cdn.jsdelivr.net/npm/babylonjs-materials@' + BJS + '/babylonjs.materials.min.js'];

  /* ---------- escenarios y afluencia ---------- */
  const SCEN = [
    { id: 'g-pis-ahog4', caseId: 'pis-ahog4', map: 'pool', victim: { conscious: false, breathing: false }, pa: 'pcr', drowning: true },
    { id: 'g-pis-convuls', caseId: 'pis-convuls', map: 'pool', victim: { conscious: false, breathing: true, convulsing: 40 }, pa: 'decisions', vpos: [1.6, -10] },
    { id: 'g-pla-ahog2', caseId: 'pla-ahog2', map: 'beach', rip: true, female: true, victim: { conscious: true, panic: true }, pa: 'decisions' },
    { id: 'g-pla-lm', caseId: 'pla-lm-romp', map: 'beach', victim: { conscious: false, breathing: false, lm: true }, pa: 'pcr', drowning: true, cervical: true, sand: true }
  ];
  const scenById = (id) => SCEN.find((s) => s.id === id);
  const caseOf = (sc) => CASES.find((c) => c.id === sc.caseId);
  const CROWD = {
    nula: { amb: 'empty', pool: [0, 0], beach: [0, 0], marker: 999, intr: 0, kids: 0, vol: 0.5 },
    media: { amb: 'medium', pool: [8, 6], beach: [10, 12], marker: 18, intr: 1, kids: 10, vol: 0.6 },
    alta: { amb: 'crowded', pool: [22, 14], beach: [26, 28], marker: 10, intr: 2, kids: 4, vol: 0.75 }
  };
  let selLevel = 'media';

  /* ---------- mundo (metros, sistema dextrógiro como en la versión anterior) ---------- */
  const POOL = { x0: -6.25, x1: 6.25, z0: -25, z1: 0 };
  const POOL_WY = -0.22;
  const RIP = { x0: 6, x1: 14 };
  const BOUNDS = { pool: { x0: -15, x1: 11, z0: -31, z1: 5 }, beach: { x0: -40, x1: 40, z0: -75, z1: 24 } };
  const SKIN_ME = '#D9A27C';

  /* ---------- estado ---------- */
  let root = null, canvas = null, engine = null, scene = null, camera = null, raf = 0, last = 0, running = false, wt = 0;
  let O = {}, UPV = null, MATS = {}, sg = null, wmat = null;
  const CAM = { pos: null, dir: null, right: null, up: null, target: null };
  let st = null;
  const keys = {};
  const joy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
  const look = { id: null, x: 0, y: 0 };
  let onResize = null;

  function newState(sc, level) {
    sc.victim = sc.victim || {};
    const pool = sc.map === 'pool';
    const cw = CROWD[level];
    const s = {
      sc, level, phase: 'play', t: 0, msg: [], wrong: 0, crit: [], paused: false,
      signalAt: null, partnerAt: null, desaAt: null, partnerHere: false, desaHere: false,
      hasTube: false, inWater: false, entered: false, contact: false, towing: false, extracted: false,
      grabbedUntil: 0, holdUntil: 0, firstVentAt: null, o2Zero: false, extractCooldown: 0, entryAnim: 0,
      player: pool ? { x: -9, z: -3 } : { x: 0, z: 15 }, yaw: 0, pitch: -0.06, walk: 0, swim: 0,
      victim: { x: 0, z: 0, o2: 72, fatigue: 100, temp: 100, conscious: !!sc.victim.conscious, breathing: !!sc.victim.breathing, convulsing: sc.victim.convulsing || 0, faceUp: false },
      tube: pool ? { x: -8.3, z: -4.7, taken: false } : { x: 1.3, z: 13.6, taken: false },
      cpr: null, result: null, pa: null, handT: null, npcs: [], intr: [], moving: 0
    };
    const vp = sc.vpos || (pool ? [2.4, -20] : (sc.rip ? [10, -28] : [-4, -9]));
    s.victim.x = vp[0]; s.victim.z = vp[1];
    if (sc.victim.conscious) s.victim.o2 = 95;
    s.yaw = Math.atan2(-(s.victim.x - s.player.x), -(s.victim.z - s.player.z));
    const kinds = pool ? ['ask', 'run'] : ['ask', 'ball'];
    for (let i = 0; i < cw.intr; i++) s.intr.push({ at: 4 + i * 7 + Math.random() * 4, kind: kinds[i % kinds.length] });
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
    if (isPool()) return POOL_WY + 0.012 * Math.sin(x * 1.3 + t * 1.4) * Math.cos(z * 1.1 + t * 0.9);
    const near = clamp(1 + z / 25, 0.25, 1);
    return 0.09 * Math.sin(z * 0.38 + t * 1.6) * near + 0.04 * Math.sin(x * 0.45 + t * 1.1);
  }
  const fwdVec = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
  const V = (x, y, z) => new BABYLON.Vector3(x, y, z);
  const addS = (v, w, k) => { v.x += w.x * k; v.y += w.y * k; v.z += w.z * k; return v; };
  const lerpV = (a, b, k) => { a.x += (b.x - a.x) * k; a.y += (b.y - a.y) * k; a.z += (b.z - a.z) * k; return a; };
  function guard(fn) { const ref = st; return () => { if (st === ref && engine) fn(); }; }
  function later(sec, fn) { setTimeout(guard(fn), sec * 1000); }

  /* ---------- audio: grabaciones propias + voz del dispositivo ---------- */
  const AU = { ctx: null, out: null, lp: null, buf: {}, loops: {}, next: {} };
  function audioInit() {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      AU.ctx = new C(); AU.out = AU.ctx.createGain(); AU.out.gain.value = 0.9;
      AU.lp = AU.ctx.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 20000;
      AU.lp.connect(AU.out); AU.out.connect(AU.ctx.destination);
    } catch (e) { AU.ctx = null; }
  }
  function soundUrl(name) { return (window.SCV_AUDIO && window.SCV_AUDIO[name]) || ((window.SCV_AUDIO_BASE || 'assets/audio/') + name + '.mp3'); }
  function loadSound(name) {
    if (!AU.ctx) return Promise.resolve(null);
    if (AU.buf[name] !== undefined) return Promise.resolve(AU.buf[name]);
    AU.buf[name] = null;
    return fetch(soundUrl(name)).then((r) => r.ok ? r.arrayBuffer() : null).then((ab) => ab ? AU.ctx.decodeAudioData(ab) : null)
      .then((b) => { AU.buf[name] = b; return b; }).catch(() => null);
  }
  function panner(pos) {
    const p = AU.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 2.5; p.rolloffFactor = 1.1; p.maxDistance = 120;
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z);
    return p;
  }
  function play(name, pos, vol, rate) {
    const b = AU.buf[name]; if (!AU.ctx || !b) return;
    const src = AU.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || 1;
    const g = AU.ctx.createGain(); g.gain.value = vol == null ? 0.8 : vol;
    src.connect(g); if (pos) { const p = panner(pos); g.connect(p); p.connect(AU.lp); } else g.connect(AU.lp);
    src.start();
  }
  function loopOn(key, name, vol, pos) {
    if (!AU.ctx || AU.loops[key]) return; const b = AU.buf[name]; if (!b) return;
    const src = AU.ctx.createBufferSource(); src.buffer = b; src.loop = true;
    const g = AU.ctx.createGain(); g.gain.value = 0;
    src.connect(g); if (pos) { const p = panner(pos); g.connect(p); p.connect(AU.lp); } else g.connect(AU.lp);
    src.start(0, Math.random() * Math.max(0, b.duration - 1));
    AU.loops[key] = { src, g, vol };
    g.gain.setTargetAtTime(vol, AU.ctx.currentTime, 0.8);
  }
  function loopVol(key, vol) { const l = AU.loops[key]; if (l && AU.ctx) l.g.gain.setTargetAtTime(vol, AU.ctx.currentTime, 0.25); }
  function audioStop() {
    Object.values(AU.loops).forEach((l) => { try { l.src.stop(); } catch (e) { /* ignore */ } });
    AU.loops = {}; AU.next = {};
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }
  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    try {
      const u = new SpeechSynthesisUtterance(text); const lang = (UI.__lang && UI.__lang() === 'va') ? 'ca-ES' : 'es-ES';
      u.lang = lang; const v = speechSynthesis.getVoices().find((x) => (x.lang || '').toLowerCase().startsWith(lang.slice(0, 2))); if (v) u.voice = v;
      u.rate = 1.05; speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  const FILES = { pool: ['pool_amb_empty', 'pool_amb_medium', 'pool_amb_crowded', 'pool_kids_1', 'pool_kids_2', 'pool_kids_3', 'splash_small', 'splash_big'],
    beach: ['beach_amb_empty', 'beach_amb_medium', 'beach_amb_crowded', 'wave_break', 'wind', 'seagull_1', 'seagull_2', 'pool_kids_1', 'pool_kids_2', 'splash_small'],
    common: ['whistle_long', 'swim_strokes', 'underwater', 'water_entry', 'breath_effort', 'cough_water', 'gasp', 'radio_beep'] };
  function audioPreload() {
    const list = FILES[st.sc.map].concat(FILES.common);
    return Promise.all(list.map(loadSound)).then(() => {
      if (!st || !AU.ctx) return;
      const cw = CROWD[st.level];
      loopOn('amb', st.sc.map + '_amb_' + cw.amb, cw.vol);
      if (!isPool()) loopOn('wind', 'wind', 0.22);
      loopOn('swim', 'swim_strokes', 0); loopOn('breath', 'breath_effort', 0); loopOn('under', 'underwater', 0);
    });
  }
  function audioTick(dt) {
    if (!AU.ctx || !st || !CAM.pos) return;
    const L_ = AU.ctx.listener, p = CAM.pos, f = CAM.dir, u = CAM.up;
    if (L_.positionX) { L_.positionX.value = p.x; L_.positionY.value = p.y; L_.positionZ.value = p.z; L_.forwardX.value = f.x; L_.forwardY.value = f.y; L_.forwardZ.value = f.z; L_.upX.value = u.x; L_.upY.value = u.y; L_.upZ.value = u.z; }
    else { L_.setPosition(p.x, p.y, p.z); L_.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
    const s = st, under = s.phase === 'play' && s.inWater && CAM.pos.y < waveH(s.player.x, s.player.z, wt) + 0.05;
    AU.lp.frequency.setTargetAtTime(under ? 700 : 20000, AU.ctx.currentTime, 0.08);
    loopVol('under', under ? 0.6 : 0);
    const swimming = s.phase === 'play' && s.inWater && s.moving > 0.2 && !s.towing;
    loopVol('swim', swimming ? 0.55 : (s.towing && s.moving > 0.2 ? 0.3 : 0));
    loopVol('breath', (s.phase === 'play' && s.moving > 0.2 && s.t > 3) || s.phase === 'pa' && s.pa && s.pa.pose === 'cpr' ? 0.28 : 0);
    const cw = CROWD[s.level];
    const due = (k, a, b) => { if (AU.next[k] == null) AU.next[k] = wt + a + Math.random() * (b - a); if (wt >= AU.next[k]) { AU.next[k] = wt + a + Math.random() * (b - a); return true; } return false; };
    if (cw.kids && s.npcs.length && due('kids', cw.kids * 0.6, cw.kids * 1.4)) { const n = s.npcs[Math.floor(Math.random() * s.npcs.length)]; play('pool_kids_' + (1 + Math.floor(Math.random() * (isPool() ? 3 : 2))), V(n.x, 1, n.z), 0.7, 0.9 + Math.random() * 0.25); }
    if (s.npcs.length && due('spl', isPool() ? 3 : 6, isPool() ? 9 : 14)) { const w = s.npcs.filter((n) => n.water); if (w.length) { const n = w[Math.floor(Math.random() * w.length)]; play('splash_small', V(n.x, 0, n.z), 0.6); } }
    if (!isPool()) {
      if (due('wave', 4, 8)) play('wave_break', V(p.x + (Math.random() - 0.5) * 14, 0, -1.5), 0.9);
      if (due('gull', 9, 20)) play('seagull_' + (1 + Math.floor(Math.random() * 2)), V(p.x + (Math.random() - 0.5) * 30, 12, p.z - 10 - Math.random() * 20), 0.5);
    }
    if (s.phase === 'play' && !s.contact && s.victim.conscious && due('gasp', 3.5, 6.5)) play('gasp', V(s.victim.x, 0.2, s.victim.z), 0.9 - cw.vol * 0.6);
  }

  /* ---------- carga del motor ---------- */
  let libsP = null;
  function loadLibs() {
    if (window.BABYLON && BABYLON.WaterMaterial) return Promise.resolve();
    if (libsP) return libsP;
    libsP = LIBS.reduce((p, src) => p.then(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); })), Promise.resolve());
    libsP.catch(() => { libsP = null; });
    return libsP;
  }

  /* ---------- bucle ---------- */
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; wt += dt;
    if (st.phase === 'play' && !st.paused) update(dt);
    if (st.phase === 'pa') arrivals();
    updateHud();
    animate(dt);
    audioTick(dt);
    if (running) raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    const s = st, p = s.player, v = s.victim, sc = s.sc;
    s.t += dt;
    if (s.entryAnim > 0) s.entryAnim = Math.max(0, s.entryAnim - dt);
    arrivals();
    if (!s.contact && s.intr.length && s.t >= s.intr[0].at) { intrusion(s.intr.shift().kind); return; }
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
    s.moving = lerp(s.moving, len > 0.1 ? 1 : 0, clamp(dt * 6, 0, 1));
    const frozen = s.t < s.grabbedUntil || s.t < s.holdUntil || s.entryAnim > 0;
    let speed = 4.2;
    if (s.inWater) {
      const wade = !isPool() && p.z > -4;
      speed = s.towing ? (s.hasTube ? (isPool() ? 0.85 : 1.05) : 0.6) : (wade ? 2.2 : (s.hasTube ? 1.35 : 1.25));
    }
    // los bañistas estorban
    let crowded = false;
    for (const n of s.npcs) { if (n.water === s.inWater && Math.hypot(n.x - p.x, n.z - p.z) < (s.inWater ? 0.9 : 0.6)) { crowded = true; break; } }
    if (crowded) speed *= 0.45;
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
    if (!s.partnerHere && s.t >= s.partnerAt) { s.partnerHere = true; say(L(G.partnerHere), 'ok'); play('radio_beep', null, 0.6); later(0.4, () => speak(L(G.vPartner))); }
    if (!s.desaHere && s.t >= s.desaAt) { s.desaHere = true; say(L(G.desaHere), 'ok'); play('radio_beep', null, 0.6); if (s.pa && s.pa.onDesa) s.pa.onDesa(); }
  }

  /* ---------- acciones del rescate ---------- */
  function signal() {
    const s = st; if (!s || s.signalAt !== null || s.phase !== 'play') return;
    s.signalAt = s.t;
    s.partnerAt = s.t + (isPool() ? 25 : 38); s.desaAt = s.t + (isPool() ? 50 : 70);
    play('whistle_long', null, 0.9);
    say(L(G.signalDone), 'ok'); updateHud();
  }

  function intrusion(kind) {
    const s = st;
    const T_ = kind === 'run' ? [G.intrRunTitle, G.intrRunOk, G.intrRunBad, G.intrRunBadWhy] : (kind === 'ball' ? [G.intrBallTitle, G.intrBallOk, G.intrBallBad, G.intrBallBadWhy] : [G.intrAskTitle, G.intrAskOk, G.intrAskBad, G.intrAskBadWhy]);
    if (kind === 'run') play('whistle_long', null, 0.4, 1.6);
    choice(L(T_[0]), [{ t: T_[1], ok: true }, { t: T_[2], wrong: T_[3] }], (o) => {
      if (o.wrong) { markWrong(); s.holdUntil = s.t + 6; say(L(o.wrong), 'warn'); } else say(L(G.intrKept), 'ok');
    });
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
        play('water_entry', null, 0.9); play('splash_big', null, 0.7);
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
      if (v.conscious) play('cough_water', V(v.x, 0.3, v.z), 0.8);
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
  const MB = () => BABYLON.MeshBuilder;
  function hex3(h) { return BABYLON.Color3.FromHexString(h); }
  function mat(hex, o) {
    const key = hex + (o ? JSON.stringify(o) : '');
    if (!MATS[key]) {
      const m = new BABYLON.StandardMaterial('m' + Object.keys(MATS).length, scene);
      m.diffuseColor = hex3(hex); const sp = o && o.spec != null ? o.spec : 0.1; m.specularColor = new BABYLON.Color3(sp, sp, sp); m.specularPower = (o && o.pow) || 24;
      if (o && o.alpha != null) m.alpha = o.alpha;
      if (o && o.two) m.backFaceCulling = false;
      if (o && o.emis) m.emissiveColor = hex3(o.emis);
      MATS[key] = m;
    }
    return MATS[key];
  }
  function grp(parent, x, y, z) { const t = new BABYLON.TransformNode('g', scene); if (parent) t.parent = parent; t.position.set(x || 0, y || 0, z || 0); return t; }
  function mk(mesh, hex, o, parent, x, y, z) { mesh.material = mat(hex, o); if (parent) mesh.parent = parent; mesh.position.set(x || 0, y || 0, z || 0); return mesh; }
  function box(w, h, d, hex, o, parent, x, y, z) { return mk(MB().CreateBox('b', { width: w, height: h, depth: d }, scene), hex, o, parent, x, y, z); }
  function cyl(r1, r2, h, hex, seg, o, parent, x, y, z) { return mk(MB().CreateCylinder('c', { height: h, diameterTop: r1 * 2, diameterBottom: r2 * 2, tessellation: seg || 16 }, scene), hex, o, parent, x, y, z); }
  function sph(r, hex, seg, o, parent, x, y, z) { return mk(MB().CreateSphere('s', { diameter: r * 2, segments: seg || 12 }, scene), hex, o, parent, x, y, z); }
  function capsule(r, len, hex, parent, x, y, z) { return mk(MB().CreateCapsule('k', { radius: r, height: len + 2 * r, tessellation: 12, subdivisions: 2, capSubdivisions: 5 }, scene), hex, null, parent, x, y, z); }
  function lathe(pts, hex, parent) { return mk(MB().CreateLathe('l', { shape: pts.map((p) => V(p[0], p[1], 0)), tessellation: 26, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene), hex, null, parent, 0, 0, 0); }
  const URLS = {};
  function canvasURL(key, size, draw) {
    if (URLS[key]) return URLS[key];
    const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    return (URLS[key] = c.toDataURL('image/png'));
  }
  function tex(key, size, draw, u, v) { const t = new BABYLON.Texture(canvasURL(key, size, draw), scene); t.uScale = u; t.vScale = v; t.anisotropicFilteringLevel = 4; return t; }
  function texMat(t, o) {
    const m = new BABYLON.StandardMaterial('tm', scene); m.diffuseTexture = t; const sp = o && o.spec != null ? o.spec : 0.08; m.specularColor = new BABYLON.Color3(sp, sp, sp);
    if (o && o.tint) m.diffuseColor = hex3(o.tint); if (o && o.back) { m.backFaceCulling = false; }
    return m;
  }
  const tileDraw = (base, grout, n) => (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.07) + ')'; g.fillRect(Math.random() * s, Math.random() * s, 3, 3); }
    g.strokeStyle = grout; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { const p = (s / n) * i; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, s); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(s, p); g.stroke(); }
  };
  const sandDraw = (g, s) => {
    g.fillStyle = '#E3CF9C'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 12000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(150,120,70,0.2)' : 'rgba(255,250,235,0.25)'; g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(160,130,85,0.13)'; g.beginPath(); const y = Math.random() * s; g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + 8, s * 0.6, y - 8, s, y); g.stroke(); }
  };
  const normalDraw = (g, s) => {
    const W = [[3, 1, 1, 0.0], [1, 4, 0.8, 1.3], [5, -2, 0.5, 2.1], [-3, 6, 0.35, 0.7], [7, 5, 0.25, 4.0], [11, -9, 0.15, 1.1]];
    const H = (x, y) => W.reduce((a, w) => a + w[2] * Math.sin(2 * Math.PI * (w[0] * x + w[1] * y) / s + w[3]), 0);
    const img = g.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1);
      let nx = -dx * 2.2, ny = -dy * 2.2, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * s + x) * 4; img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };
  function meshesOf(node) { return node.getChildMeshes ? node.getChildMeshes(false) : []; }
  function cast(node) { if (sg) meshesOf(node).concat(node.getClassName && node.getClassName() === 'Mesh' ? [node] : []).forEach((m) => sg.addShadowCaster(m)); }
  function recv(m) { m.receiveShadows = true; return m; }

  /* figura humana */
  function makeHand(skin, parent) {
    const h = grp(parent);
    const palm = sph(0.042, skin, 12, null, h); palm.scaling.set(1.05, 1.15, 0.42);
    for (let i = 0; i < 4; i++) capsule(0.0105, 0.052 - Math.abs(i - 1.5) * 0.008, skin, h, -0.027 + i * 0.018, 0.075, 0);
    const th = capsule(0.012, 0.04, skin, h, 0.047, 0.012, 0.008); th.rotation.z = -0.7;
    return h;
  }
  function makeHuman(o) {
    const skin = o.skin, top = o.top || skin, hairC = o.hair || '#3B2A20';
    const b = grp(null);
    const torso = lathe([[0, 0.84], [0.15, 0.85], [0.185, 0.93], [0.165, 1.03], [0.175, 1.16], [0.2, 1.32], [0.19, 1.41], [0.12, 1.47], [0.055, 1.5], [0, 1.5]], top, b); torso.scaling.z = 0.62;
    const trunks = lathe([[0, 0.78], [0.168, 0.79], [0.192, 0.88], [0.19, o.top ? 0.9 : 0.99], [0, o.top ? 0.9 : 0.99]], o.bottom, b); trunks.scaling.z = 0.66;
    const head = grp(b, 0, 1.47, 0);
    cyl(0.05, 0.058, 0.12, skin, 14, null, head, 0, 0.04, 0);
    const skull = sph(0.112, skin, 20, null, head, 0, 0.165, 0); skull.scaling.set(0.9, 1.08, 1);
    const jaw = sph(0.082, skin, 16, null, head, 0, 0.11, 0.03); jaw.scaling.set(0.92, 0.8, 0.95);
    const hair = mk(MB().CreateSphere('hair', { diameter: 0.238, segments: 16, slice: 0.55, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene), hairC, { spec: 0.04 }, head, 0, 0.17, -0.012);
    hair.rotation.x = -0.38; hair.scaling.set(0.93, 1.05, 1.04);
    if (o.female) { const pony = sph(0.055, hairC, 12, { spec: 0.04 }, head, 0, 0.13, -0.13); pony.scaling.set(0.8, 1.5, 0.8); }
    [-1, 1].forEach((sd) => {
      sph(0.016, '#F4F1EC', 10, { spec: 0.5 }, head, sd * 0.038, 0.177, 0.09); sph(0.008, '#2B1D14', 8, { spec: 0.6 }, head, sd * 0.038, 0.177, 0.104);
      box(0.032, 0.006, 0.008, hairC, null, head, sd * 0.038, 0.203, 0.099);
      const ear = sph(0.022, skin, 8, null, head, sd * 0.1, 0.165, 0); ear.scaling.set(0.4, 1, 0.7);
    });
    const nose = cyl(0.004, 0.017, 0.04, skin, 10, null, head, 0, 0.15, 0.112); nose.rotation.x = Math.PI / 2;
    box(0.034, 0.006, 0.006, '#9C4A3F', null, head, 0, 0.106, 0.1);
    const mkArm = (sd) => {
      const sh = grp(b, sd * 0.215, 1.39, 0);
      sph(0.05, top, 12, null, sh);
      capsule(0.043, 0.24, skin, sh, 0, -0.15, 0);
      const el = grp(sh, 0, -0.3, 0);
      capsule(0.036, 0.22, skin, el, 0, -0.13, 0);
      const hand = makeHand(skin, el); hand.rotation.z = Math.PI; hand.position.y = -0.29;
      sh.u = { el }; return sh;
    };
    const mkLeg = (sd) => {
      const hp = grp(b, sd * 0.095, 0.86, 0);
      capsule(0.072, 0.3, skin, hp, 0, -0.21, 0);
      const kn = grp(hp, 0, -0.43, 0);
      capsule(0.052, 0.3, skin, kn, 0, -0.2, 0);
      const foot = sph(0.05, skin, 10, null, kn, 0, -0.4, 0.05); foot.scaling.set(0.8, 0.5, 1.9);
      hp.u = { kn }; return hp;
    };
    b.u = { torso, head, armR: mkArm(-1), armL: mkArm(1), legR: mkLeg(-1), legL: mkLeg(1) };
    return b;
  }
  function makeTube(parent) {
    const g = grp(parent);
    const c = cyl(0.075, 0.075, 0.86, '#E0262F', 18, { spec: 0.25 }, g); c.rotation.z = Math.PI / 2;
    sph(0.075, '#E0262F', 14, { spec: 0.25 }, g, -0.43, 0, 0); sph(0.075, '#E0262F', 14, { spec: 0.25 }, g, 0.43, 0, 0);
    const band = cyl(0.077, 0.077, 0.06, '#F2F2F2', 18, null, g); band.rotation.z = Math.PI / 2;
    const strap = cyl(0.008, 0.008, 0.6, '#1A1A1A', 6, null, g, 0.43, 0, 0.3); strap.rotation.x = Math.PI / 2;
    box(0.03, 0.035, 0.05, '#C0C0C0', { spec: 0.9, pow: 64 }, g, -0.47, 0, 0);
    return g;
  }
  function makeFPArm(side, rig) {
    const sh = grp(rig, side * 0.2, -0.27, -0.06);
    const w = grp(sh); w.rotation.x = -Math.PI / 2;
    capsule(0.056, 0.24, '#C8102E', w, 0, 0.15, 0);
    const el = grp(w, 0, 0.3, 0);
    capsule(0.045, 0.22, SKIN_ME, el, 0, 0.13, 0);
    const hand = makeHand(SKIN_ME, el); hand.position.y = 0.29;
    sh.u = { el };
    return sh;
  }
  function makeWorldArm() {
    const up = cyl(0.056, 0.05, 1, '#C8102E', 14), fo = cyl(0.046, 0.039, 1, SKIN_ME, 14);
    const jS = sph(0.057, '#C8102E', 12), jE = sph(0.05, SKIN_ME, 12), jW = sph(0.04, SKIN_ME, 10);
    const hand = makeHand(SKIN_ME, null);
    return { up, fo, jS, jE, jW, hand, h: null, all: [up, fo, jS, jE, jW, hand] };
  }
  function setVis(arm, on) { arm.all.forEach((n) => n.setEnabled(on)); }
  function quatFromTo(a, b) {
    const d = BABYLON.Vector3.Dot(a, b);
    if (d > 0.99999) return BABYLON.Quaternion.Identity();
    if (d < -0.99999) return BABYLON.Quaternion.RotationAxis(V(1, 0, 0), Math.PI);
    return BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Cross(a, b).normalize(), Math.acos(d));
  }
  function setLimb(m, a, b) {
    const d = b.subtract(a); const len = d.length();
    m.position.copyFrom(a).addInPlace(d.scale(0.5));
    m.rotationQuaternion = quatFromTo(UPV, d.normalize());
    m.scaling.set(1, len, 1);
  }
  function makeDesa(open) {
    const g = grp(null);
    box(0.34, 0.09, 0.26, '#F2C230', { spec: 0.3 }, g, 0, 0.045, 0);
    box(0.1, 0.02, 0.07, '#10232B', { spec: 0.6 }, g, 0.06, 0.092, -0.04);
    cyl(0.022, 0.022, 0.015, '#E0262F', 14, null, g, -0.08, 0.095, 0.05); cyl(0.018, 0.018, 0.015, '#2E7D4F', 14, null, g, -0.08, 0.095, -0.05);
    const lid = box(0.34, 0.02, 0.26, '#E8B820', { spec: 0.3 }, g, 0, open ? 0.2 : 0.1, open ? -0.12 : 0); if (open) lid.rotation.x = -1.3;
    return g;
  }

  /* ---------- escenarios ---------- */
  function sky(incl) {
    const box_ = MB().CreateBox('sky', { size: 1000 }, scene);
    const m = new BABYLON.SkyMaterial('skyM', scene); m.backFaceCulling = false; m.turbidity = 4; m.rayleigh = 1.6; m.luminance = 1; m.inclination = incl; m.azimuth = 0.22; m.mieCoefficient = 0.004;
    box_.material = m; box_.infiniteDistance = true; box_.applyFog = false; return box_;
  }
  function makeWater(w, d, cx, cz, y, o, lite) {
    const g = MB().CreateGround('water', { width: w, height: d, subdivisions: lite ? 24 : 48 }, scene);
    g.position.set(cx, y, cz);
    if (o.clear) {
      const m = new BABYLON.StandardMaterial('poolWater', scene);
      m.diffuseColor = hex3(o.color); m.alpha = 0.58; m.specularColor = new BABYLON.Color3(1, 1, 1); m.specularPower = 180;
      m.emissiveColor = hex3('#0E4C66');
      m.bumpTexture = new BABYLON.Texture(canvasURL('nrm', 256, normalDraw), scene); m.bumpTexture.uScale = o.bumpScale; m.bumpTexture.vScale = o.bumpScale; m.bumpTexture.level = 0.55;
      g.material = m; O.waterBump = m.bumpTexture; wmat = null;
      return g;
    }
    const m = new BABYLON.WaterMaterial('waterM', scene, new BABYLON.Vector2(lite ? 256 : 512, lite ? 256 : 512));
    m.bumpTexture = new BABYLON.Texture(canvasURL('nrm', 256, normalDraw), scene);
    m.bumpTexture.uScale = o.bumpScale; m.bumpTexture.vScale = o.bumpScale;
    Object.assign(m, { windForce: o.wind, waveHeight: o.wave, bumpHeight: o.bump, waveLength: o.len, waveSpeed: o.speed || 40, colorBlendFactor: o.blend, colorBlendFactor2: o.blend });
    m.windDirection = new BABYLON.Vector2(1, 1); m.waterColor = hex3(o.color); m.waterColor2 = hex3(o.color);
    g.material = m; wmat = m;
    return g;
  }
  function buildPool(lite) {
    sky(0.32);
    scene.fogColor = hex3('#CFE6F1'); scene.fogStart = 40; scene.fogEnd = 140;
    const deckURL = canvasURL('deck', 256, tileDraw('#E7DCC6', '#CDBFA4', 4));
    const deck = (w, d, x, z) => { const t = new BABYLON.Texture(deckURL, scene); t.uScale = w / 1.2; t.vScale = d / 1.2; const m = box(w, 0.1, d, '#FFFFFF', null, null, x, -0.05, z); m.material = texMat(t); recv(m); };
    deck(8.75, 36, -10.625, -13); deck(4.75, 36, 8.625, -13); deck(12.5, 5, 0, 2.5); deck(12.5, 6, 0, -28);
    [[0.4, 25.8, POOL.x0 - 0.2, -12.5], [0.4, 25.8, POOL.x1 + 0.2, -12.5], [13.3, 0.4, 0, POOL.z1 + 0.2], [13.3, 0.4, 0, POOL.z0 - 0.2]].forEach(([w, d, x, z]) => recv(box(w, 0.1, d, '#F7F7F4', { spec: 0.3 }, null, x, 0.01, z)));
    const basin = MB().CreateBox('basin', { width: 12.5, height: 2.4, depth: 25, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
    basin.position.set(0, -1.2, -12.5); basin.material = texMat(tex('tile', 256, tileDraw('#8FD0EC', '#6FBADB', 8), 12, 3), { spec: 0.3 }); recv(basin);
    for (let i = 0; i < 5; i++) box(0.25, 0.012, 22.5, '#1E5A82', null, null, -5 + i * 2.5, -2.385, -12.5);
    O.water = makeWater(12.5, 25, 0, -12.5, POOL_WY, { clear: true, bumpScale: 5, color: '#4CC6E8' }, lite);
    const fr = sph(0.075, '#D7263D', 8, { spec: 0.3 }), fw = sph(0.075, '#F5F5F5', 8, { spec: 0.3 });
    fr.scaling.set(1, 0.9, 1.5); fw.scaling.set(1, 0.9, 1.5); fr.position.y = fw.position.y = -500;
    O.floats = [];
    [-3.75, -1.25, 1.25, 3.75].forEach((x) => { for (let k = 0; k < 100; k++) { const m = (Math.floor(k / 8) % 2 ? fw : fr).createInstance('f'); m.position.set(x, POOL_WY + 0.03, -0.12 - k * 0.25); O.floats.push(m); } });
    O.floatSrc = [fr, fw];
    const ch = grp(null, -8.2, 0, -6.5);
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => cyl(0.035, 0.035, 1.8, '#E8E8E8', 10, { spec: 0.8, pow: 64 }, ch, x, 0.9, z));
    box(0.8, 0.08, 0.8, '#0B4F6C', null, ch, 0, 1.8, 0); box(0.8, 0.6, 0.06, '#0B4F6C', null, ch, 0, 2.12, -0.38);
    for (let i = 0; i < 4; i++) box(0.7, 0.04, 0.08, '#F2F2F2', null, ch, 0, 0.35 + i * 0.4, 0.38);
    cast(ch);
    const inf = box(4, 3, 3, '#F4F4F2', null, null, -12.5, 1.5, -26); cast(inf); recv(inf);
    box(0.25, 1, 0.05, '#D7263D', null, null, -12.5, 2, -24.47); box(1, 0.25, 0.05, '#D7263D', null, null, -12.5, 2, -24.47);
    recv(box(36, 4, 0.5, '#DCE8EC', null, null, -2, 2, -31.2)); recv(box(0.5, 4, 36, '#DCE8EC', null, null, -15.2, 2, -13));
    [[5.6, -0.25], [-5.6, -24.75]].forEach(([x, z]) => [-0.25, 0.25].forEach((o) => { const r = MB().CreateTorus('lad', { diameter: 0.7, thickness: 0.05, tessellation: 16 }, scene); r.material = mat('#D0D0D0', { spec: 0.9, pow: 80 }); r.position.set(x + o, 0, z); r.rotation.set(Math.PI / 2, Math.PI / 2, 0); r.scaling.y = 1; }));
    // bancos y toallas en la playa de la piscina
    for (let i = 0; i < 6; i++) { const bx = box(1.8, 0.45, 0.45, '#8A6A4A', null, null, -13.5, 0.22, -4 - i * 3.6); cast(bx); }
  }
  function buildBeach(lite) {
    sky(0.27);
    scene.fogColor = hex3('#C9E4F2'); scene.fogStart = 55; scene.fogEnd = 220;
    const sand = box(160, 0.4, 50, '#FFFFFF', null, null, 0, -0.1, 25); sand.material = texMat(tex('sand', 512, sandDraw, 30, 10)); recv(sand);
    const wet = box(160, 0.402, 5, '#FFFFFF', null, null, 0, -0.11, 2.5); wet.material = texMat(tex('sand', 512, sandDraw, 30, 1), { tint: '#B39C74', spec: 0.35 }); recv(wet);
    O.water = makeWater(160, 100, 0, -50, 0, { bumpScale: 14, wind: -6, wave: 0.12, bump: 0.32, len: 0.12, blend: 0.28, color: '#11587E', speed: 30 }, lite);
    if (st.sc.rip) { const rp = MB().CreateGround('rip', { width: RIP.x1 - RIP.x0, height: 58 }, scene); rp.position.set((RIP.x0 + RIP.x1) / 2, 0.03, -31); rp.material = mat('#2B4E52', { alpha: 0.32, spec: 0 }); O.ripPlane = rp; }
    const tw = grp(null, -3, 0, 17);
    [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, z]) => cyl(0.07, 0.07, 2.2, '#F2F2F2', 10, null, tw, x, 1.1, z));
    box(2.2, 1.5, 2.2, '#C8102E', null, tw, 0, 2.9, 0); box(2.6, 0.12, 2.6, '#F2F2F2', null, tw, 0, 3.72, 0); box(1.6, 0.6, 0.02, '#9FC9DD', { spec: 0.9, pow: 90 }, tw, 0, 3.0, -1.11);
    for (let i = 0; i < 6; i++) box(0.9, 0.05, 0.25, '#F2F2F2', null, tw, 0, 0.3 + i * 0.36, 1.3 + i * 0.1);
    cast(tw);
    cyl(0.035, 0.035, 4, '#E6E6E6', 8, null, null, 2.5, 2, 15);
    const flag = MB().CreatePlane('flag', { width: 0.95, height: 0.6, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true }, scene);
    flag.material = mat('#E9B51C'); flag.position.set(3.0, 3.65, 15); O.flag = flag; O.flagBase = flag.getVerticesData(BABYLON.VertexBuffer.PositionKind).slice();
    [[-12, 9, '#1D8A4A'], [-18, 12, '#D7263D'], [14, 10, '#0B4F6C'], [20, 14, '#E9B51C'], [-25, 7, '#7FC3DC'], [9, 6, '#F28C28'], [-7, 11, '#8E44AD']].forEach(([x, z, c]) => {
      cyl(0.03, 0.03, 2.2, '#F2F2F2', 6, null, null, x, 1.1, z);
      const um = mk(MB().CreateCylinder('um', { height: 0.55, diameterTop: 0, diameterBottom: 2.6, tessellation: 18, cap: BABYLON.Mesh.NO_CAP, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene), c, null, null, x, 2.25, z); cast(um);
      recv(box(0.9, 0.02, 1.8, c === '#E9B51C' ? '#D7263D' : '#F2C230', null, null, x + 1.2, 0.11, z + 0.4));
    });
    O.breakers = [];
    for (let i = 0; i < 4; i++) { const b = box(80, 0.04, 0.7, '#FFFFFF', { alpha: 0.7, spec: 0.3, emis: '#666666' }); b.material = b.material.clone('brk' + i); b.u = { z: -1.5 - i * 3.5 }; O.breakers.push(b); }
    O.streaks = [];
    if (st.sc.rip) { const src = box(0.22, 0.03, 1.8, '#EAF4F7', { alpha: 0.55, emis: '#555555' }); src.position.y = -500; for (let i = 0; i < 18; i++) { const s = src.createInstance('rs'); s.u = { x: RIP.x0 + 0.5 + Math.random() * (RIP.x1 - RIP.x0 - 1), z: -2 - Math.random() * 50 }; O.streaks.push(s); } }
  }

  /* ---------- bañistas según la afluencia ---------- */
  const NPC_LOOKS = [
    { skin: '#E0B08A', bottom: '#1B2F4A', hair: '#3B2A20' }, { skin: '#B97E5A', bottom: '#C0392B', hair: '#1E1612' },
    { skin: '#F0C8A8', top: '#D35A8A', bottom: '#D35A8A', hair: '#A87445', female: true }, { skin: '#8D5A3B', bottom: '#F2C230', hair: '#141010' },
    { skin: '#E8BC98', top: '#2E7D4F', bottom: '#2E7D4F', hair: '#5A3B22', female: true }
  ];
  function npcTemplates() {
    return NPC_LOOKS.map((lk, i) => {
      const h = makeHuman(lk); const meshes = meshesOf(h);
      h.computeWorldMatrix(true); meshes.forEach((m) => m.computeWorldMatrix(true));
      const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
      h.dispose(); merged.name = 'npcTpl' + i; merged.position.y = -500; return merged;
    });
  }
  function spawnCrowd() {
    const s = st, cw = CROWD[s.level], n = isPool() ? cw.pool : cw.beach;
    if (!n[0] && !n[1]) return;
    const tpl = npcTemplates(); O.npcTpl = tpl;
    const far = (x, z) => Math.hypot(x - s.victim.x, z - s.victim.z) > 3.5 && Math.hypot(x - s.player.x, z - s.player.z) > 3;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const add = (o) => { const m = tpl[Math.floor(Math.random() * tpl.length)].createInstance('npc'); o.mesh = m; o.ph = Math.random() * 6; s.npcs.push(o); if (sg) sg.addShadowCaster(m); };
    for (let i = 0, tries = 0; i < n[0] && tries < 200; tries++) {
      let x, z, kind;
      if (isPool()) { kind = Math.random() < 0.55 ? 'swim' : 'wade'; x = kind === 'swim' ? -5 + Math.floor(Math.random() * 5) * 2.5 : rnd(-5.5, 5.5); z = kind === 'swim' ? rnd(-24, -1) : rnd(-7, -1); }
      else { kind = Math.random() < 0.7 ? 'wade' : 'swim'; x = rnd(-30, 30); z = kind === 'wade' ? rnd(-7, -1.5) : rnd(-18, -6); }
      if (!far(x, z)) continue;
      add({ kind, water: true, x, z, v: rnd(0.5, 1.1) * (Math.random() < 0.5 ? 1 : -1) }); i++;
    }
    for (let i = 0, tries = 0; i < n[1] && tries < 200; tries++) {
      let x, z, kind;
      if (isPool()) { kind = Math.random() < 0.6 ? 'walk' : 'sit'; x = Math.random() < 0.5 ? rnd(-12, -7) : rnd(7, 10); z = rnd(-27, 3); }
      else { kind = Math.random() < 0.5 ? 'lie' : 'walk'; x = rnd(-30, 30); z = rnd(4, 18); }
      if (!far(x, z)) continue;
      add({ kind, water: false, x, z, tx: x, tz: z, yaw: Math.random() * 6 }); i++;
    }
  }
  function npcTick(dt) {
    const s = st; if (!s.npcs.length) return;
    s.npcs.forEach((n) => {
      n.ph += dt; const m = n.mesh;
      if (n.kind === 'swim') {
        n.z += n.v * dt;
        const zmin = isPool() ? -24.3 : -20, zmax = isPool() ? -0.7 : -5;
        if (n.z < zmin || n.z > zmax) { n.v = -n.v; n.z = clamp(n.z, zmin, zmax); }
        if (s.contact && Math.hypot(n.x - s.player.x, n.z - s.player.z) < 1.2) n.v = Math.abs(n.v) * Math.sign(n.z - s.player.z || 1);
        m.position.set(n.x, waveH(n.x, n.z, wt) - 0.12, n.z);
        m.rotation.set(Math.PI / 2 * 0.86, n.v > 0 ? 0 : Math.PI, Math.sin(n.ph * 4) * 0.15);
      } else if (n.kind === 'wade') {
        m.position.set(n.x + Math.sin(n.ph * 0.4) * 0.3, waveH(n.x, n.z, wt) - (isPool() ? 1.1 : 1.0 + Math.min(0.4, -n.z * 0.05)) + Math.sin(n.ph * 1.3) * 0.04, n.z);
        m.rotation.set(0, n.ph * 0.15, 0);
      } else if (n.kind === 'walk') {
        const d = Math.hypot(n.tx - n.x, n.tz - n.z);
        if (d < 0.3) { n.tx = n.x + (Math.random() - 0.5) * 8; n.tz = n.z + (Math.random() - 0.5) * 8; if (isPool()) { n.tx = n.tx < 0 ? clamp(n.tx, -13, -7) : clamp(n.tx, 7, 10); n.tz = clamp(n.tz, -28, 3); } else n.tz = clamp(n.tz, 3, 20); }
        else { n.x += (n.tx - n.x) / d * 0.9 * dt; n.z += (n.tz - n.z) / d * 0.9 * dt; n.yaw = Math.atan2(n.tx - n.x, n.tz - n.z); }
        m.position.set(n.x, (isPool() ? 0 : 0.1) + Math.abs(Math.sin(n.ph * 5)) * 0.03, n.z); m.rotation.set(0, n.yaw, 0);
      } else if (n.kind === 'sit') {
        m.position.set(n.x, -0.35, n.z); m.rotation.set(0, n.yaw, 0);
      } else {
        m.position.set(n.x, 0.22, n.z); m.rotation.set(-Math.PI / 2, n.yaw, 0);
      }
    });
  }

  function stageSize() {
    const stage = root.querySelector('.g-stage');
    const w = Math.max(280, stage.clientWidth), portrait = w < 600;
    const h = portrait ? Math.round(Math.min(window.innerHeight * 0.7, w * 1.4)) : Math.round(Math.min(w * 0.6, window.innerHeight * 0.78));
    return { w, h, portrait };
  }

  function setup3d() {
    const stage = root.querySelector('.g-stage');
    const { w, h, portrait } = stageSize();
    canvas = document.createElement('canvas'); canvas.className = 'g-canvas'; canvas.style.width = '100%'; canvas.style.height = h + 'px'; canvas.style.touchAction = 'none';
    stage.insertBefore(canvas, stage.firstChild);
    engine = new BABYLON.Engine(canvas, !portrait, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance' }, false);
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, portrait ? 1.5 : 1.75));
    scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = new BABYLON.Color4(0.8, 0.9, 0.95, 1);
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    UPV = V(0, 1, 0); MATS = {}; O = {};
    CAM.pos = V(0, 1.6, 0); CAM.dir = V(0, 0, -1); CAM.right = V(1, 0, 0); CAM.up = V(0, 1, 0); CAM.target = V(0, 1.6, -1);
    camera = new BABYLON.UniversalCamera('cam', CAM.pos.clone(), scene);
    camera.minZ = 0.03; camera.maxZ = 1500; camera.fov = portrait ? 1.36 : 1.19; camera.lockedTarget = CAM.target;
    const hemi = new BABYLON.HemisphericLight('hemi', V(0, 1, 0), scene); hemi.intensity = 0.55; hemi.groundColor = hex3('#8C7A5C'); hemi.diffuse = hex3('#E6F2FF');
    const sun = new BABYLON.DirectionalLight('sun', V(-0.5, -1, -0.35), scene); sun.intensity = 1.7; sun.diffuse = hex3('#FFF2DE'); sun.specular = hex3('#FFF6E8');
    sun.position = V(25, 45, 20);
    sg = null;
    if (!portrait) { sg = new BABYLON.ShadowGenerator(2048, sun); sg.usePercentageCloserFiltering = true; sg.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM; sg.bias = 0.001; sg.normalBias = 0.02; sun.autoCalcShadowZBounds = true; }
    if (isPool()) buildPool(portrait); else buildBeach(portrait);
    O.tubeWorld = makeTube(null); O.tubeWorld.position.set(st.tube.x, isPool() ? 0.08 : 0.17, st.tube.z); O.tubeWorld.rotation.y = 0.7; cast(O.tubeWorld);
    const lk = st.sc.female ? { skin: '#E8BC98', top: '#2F6FB5', bottom: '#2F6FB5', hair: '#5A3B22', female: true }
      : (st.sc.id === 'g-pis-ahog4' ? { skin: '#DDB08E', bottom: '#1B2F4A', hair: '#4A4A48' } : { skin: '#C99472', bottom: '#2E7D4F', hair: '#1E1612' });
    O.vYaw = grp(null); O.vTilt = grp(O.vYaw); O.vBody = makeHuman(lk); O.vBody.parent = O.vTilt; O.vBody.position.y = -0.95; cast(O.vBody);
    O.partner = makeHuman({ skin: '#C98B63', top: '#C8102E', bottom: '#F2C230', hair: '#2B1D14' }); O.partner.setEnabled(false); cast(O.partner);
    O.desa = makeDesa(false); O.desa.setEnabled(false); cast(O.desa);
    O.rig = grp(null);
    O.armR = makeFPArm(1, O.rig); O.armL = makeFPArm(-1, O.rig); O.armR.rotation.y = -0.1; O.armL.rotation.y = 0.1;
    O.heldTube = makeTube(O.rig); O.heldTube.scaling.set(0.72, 0.72, 0.72); O.heldTube.setEnabled(false);
    O.wArmR = makeWorldArm(); O.wArmL = makeWorldArm(); setVis(O.wArmR, false); setVis(O.wArmL, false);
    O.mask = grp(null);
    mk(MB().CreateCylinder('mask', { height: 0.07, diameterTop: 0.056, diameterBottom: 0.136, tessellation: 18, cap: BABYLON.Mesh.NO_CAP, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene), '#FFFFFF', { alpha: 0.55, spec: 0.9, pow: 80 }, O.mask);
    cyl(0.012, 0.012, 0.04, '#2E7D4F', 10, null, O.mask, 0, 0.05, 0); O.mask.setEnabled(false);
    const bl = MB().CreateGround('blanket', { width: 0.72, height: 1.25, subdivisions: 10, updatable: true }, scene);
    const bpos = bl.getVerticesData(BABYLON.VertexBuffer.PositionKind); for (let i = 0; i < bpos.length; i += 3) bpos[i + 1] = -0.78 * bpos[i] * bpos[i];
    bl.updateVerticesData(BABYLON.VertexBuffer.PositionKind, bpos); const nrm = []; BABYLON.VertexData.ComputeNormals(bpos, bl.getIndices(), nrm); bl.updateVerticesData(BABYLON.VertexBuffer.NormalKind, nrm);
    bl.material = mat('#D4AF37', { spec: 1, pow: 40, two: true }); bl.parent = O.vYaw; bl.position.set(0, 0.15, 0.25); bl.setEnabled(false); O.blanket = bl;
    O.splash = []; O.pads = []; O.cables = [];
    spawnCrowd();
    // reflejos y refracción del agua
    if (wmat) { scene.meshes.forEach((m) => { if (m !== O.water && !m.isAnInstance && m.name !== 'sky' && m.name !== 'rip') wmat.addToRenderList(m); }); wmat.addToRenderList(scene.getMeshByName('sky')); }
    // posprocesado
    const dp = new BABYLON.DefaultRenderingPipeline('dp', !portrait, scene, [camera]);
    dp.fxaaEnabled = true; dp.imageProcessingEnabled = true;
    dp.imageProcessing.toneMappingEnabled = true; dp.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    dp.imageProcessing.exposure = 1.0; dp.imageProcessing.contrast = 1.1;
    dp.imageProcessing.vignetteEnabled = true; dp.imageProcessing.vignetteWeight = 1.6;
    dp.bloomEnabled = !portrait; dp.bloomThreshold = 0.85; dp.bloomWeight = 0.22; dp.bloomKernel = 48;
    dp.sharpenEnabled = !portrait; if (dp.sharpen) dp.sharpen.edgeAmount = 0.2;
    onResize = () => { if (!engine) return; const z = stageSize(); canvas.style.height = z.h + 'px'; engine.resize(); };
    window.addEventListener('resize', onResize);
    engine.resize();
  }

  function teardown3d() {
    running = false; cancelAnimationFrame(raf);
    if (onResize) { window.removeEventListener('resize', onResize); onResize = null; }
    audioStop();
    try { if (scene) scene.dispose(); if (engine) engine.dispose(); } catch (e) { /* ignore */ }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    engine = null; scene = null; camera = null; canvas = null; O = {}; MATS = {}; sg = null; wmat = null;
  }

  function splash(x, z) {
    for (let i = 0; i < 18; i++) {
      const m = sph(0.05, '#FFFFFF', 6, { emis: '#9AA9B0' }); const y = waveH(x, z, wt);
      m.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
      m.u = { vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2.2, vz: (Math.random() - 0.5) * 2, life: 1 };
      O.splash.push(m);
    }
  }

  /* ---------- puntos anatómicos de la víctima ---------- */
  const BP = { sternum: [0, 1.1, 0.13], shoulderR: [-0.19, 1.38, 0.07], shoulderL: [0.19, 1.38, 0.07], padR: [-0.1, 1.33, 0.125], padL: [0.155, 1.07, 0.05], hipR: [-0.13, 0.9, 0.1], hipL: [0.13, 0.9, 0.1] };
  const HP = { forehead: [0, 0.22, 0.095], chin: [0, 0.035, 0.088], mouth: [0, 0.08, 0.108], jawR: [-0.075, 0.06, 0.06], jawL: [0.075, 0.06, 0.06] };
  function refreshVictim() { O.vYaw.computeWorldMatrix(true); O.vTilt.computeWorldMatrix(true); O.vBody.computeWorldMatrix(true); O.vBody.u.head.computeWorldMatrix(true); }
  function bp(name) {
    const hp = HP[name], a = hp || BP[name];
    return BABYLON.Vector3.TransformCoordinates(V(a[0], a[1], a[2]), (hp ? O.vBody.u.head : O.vBody).getWorldMatrix());
  }

  /* ---------- cámara ---------- */
  function setCam(pos, dir) {
    CAM.pos.copyFrom(pos); CAM.dir.copyFrom(dir).normalize();
    BABYLON.Vector3.CrossToRef(CAM.dir, UPV, CAM.right); CAM.right.normalize();
    BABYLON.Vector3.CrossToRef(CAM.right, CAM.dir, CAM.up); CAM.up.normalize();
    camera.position.copyFrom(CAM.pos); CAM.target.copyFrom(CAM.pos).addInPlace(CAM.dir);
    O.rig.position.copyFrom(CAM.pos);
    const b = CAM.dir.scale(-1), r = CAM.right, u = CAM.up;
    O.rig.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.FromValues(r.x, r.y, r.z, 0, u.x, u.y, u.z, 0, b.x, b.y, b.z, 0, 0, 0, 0, 1));
  }
  const camLocal = (x, y, z) => CAM.pos.clone().addInPlace(CAM.right.scale(x)).addInPlace(CAM.up.scale(y)).addInPlace(CAM.dir.scale(-z));

  /* ---------- animación ---------- */
  function animate(dt) {
    if (!engine || !st) return;
    const s = st;
    if (O.floats) O.floats.forEach((m, i) => { if (i % 2 === 0) m.position.y = waveH(m.position.x, m.position.z, wt) + 0.03; });
    if (O.waterBump) { O.waterBump.uOffset += dt * 0.012; O.waterBump.vOffset += dt * 0.008; }
    if (O.breakers) O.breakers.forEach((b) => { b.u.z += 1.7 * dt; if (b.u.z > 0.6) b.u.z = -13; b.position.set(0, waveH(0, b.u.z, wt) + 0.07, b.u.z); b.material.alpha = clamp(0.1 + (b.u.z + 13) / 15, 0.1, 0.8); });
    if (O.streaks) O.streaks.forEach((k) => { k.u.z -= 0.9 * dt; if (k.u.z < -55) k.u.z = -2; k.position.set(k.u.x, waveH(k.u.x, k.u.z, wt) + 0.05, k.u.z); });
    if (O.flag) { const fp = O.flagBase.slice(); for (let i = 0; i < fp.length; i += 3) { const x = fp[i] + 0.475; fp[i + 2] = Math.sin(x * 6 - wt * 6) * 0.06 * x; } O.flag.updateVerticesData(BABYLON.VertexBuffer.PositionKind, fp); }
    O.tubeWorld.setEnabled(!s.tube.taken);
    npcTick(dt);
    if (s.phase === 'play') {
      cameraPlay(); poseArms(dt); poseVictimPlay();
      O.rig.setEnabled(true); setVis(O.wArmR, false); setVis(O.wArmL, false);
      O.partner.setEnabled(s.partnerHere); O.desa.setEnabled(s.desaHere);
      if (s.partnerHere) { if (isPool()) { O.partner.position.set(-7.1, 0, -14); O.partner.rotation.set(0, Math.PI / 2, 0); } else { O.partner.position.set(-1.2, 0.1, 2.5); O.partner.rotation.set(0, Math.PI, 0); } }
      if (isPool()) O.desa.position.set(-7, 0, -15.2); else O.desa.position.set(0, 0.1, 3);
    } else {
      O.rig.setEnabled(false);
      if (s.phase === 'extract') extractFrame(dt); else if (s.pa) paFrame(dt);
      const armsOn = !!s.handT; setVis(O.wArmR, armsOn); setVis(O.wArmL, armsOn);
      if (armsOn) aimWorldArms(dt);
    }
    for (let i = O.splash.length - 1; i >= 0; i--) { const m = O.splash[i]; const u = m.u; u.vy -= 9.8 * dt; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt; u.life -= dt; if (u.life <= 0 || m.position.y < waveH(m.position.x, m.position.z, wt) - 0.1) { m.dispose(); O.splash.splice(i, 1); } }
    if (!engine) return;
    scene.render();
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
    s.pitch = clamp(s.pitch, -1.1, 0.9);
    const pos = V(p.x, h, p.z);
    if (s.t < s.grabbedUntil) { pos.x += (Math.random() - 0.5) * 0.08; pos.y += (Math.random() - 0.5) * 0.12 - 0.15; }
    const cp = Math.cos(s.pitch);
    setCam(pos, V(-Math.sin(s.yaw) * cp, Math.sin(s.pitch), -Math.cos(s.yaw) * cp));
  }

  const armState = { aR: -0.6, aL: -0.6, eR: 0.3, eL: 0.3 };
  function poseArms(dt) {
    const s = st; let aR, aL, eR, eL, tube = null;
    if (s.entryAnim > 0) { aR = aL = 0.55; eR = eL = 0.15; }
    else if (s.towing) { aR = aL = -0.18 + Math.sin(wt * 2.2) * 0.04; eR = eL = 0.12; if (s.hasTube) tube = [0, -0.36, -0.8]; }
    else if (s.inWater) { const ph = s.swim * 2.2; aR = -0.2 + Math.sin(ph) * 0.8; aL = -0.2 + Math.sin(ph + Math.PI) * 0.8; eR = 0.35 + Math.cos(ph) * 0.3; eL = 0.35 + Math.cos(ph + Math.PI) * 0.3; }
    else if (s.hasTube) { aR = aL = -0.5 + Math.sin(s.walk) * 0.03; eR = eL = 0.4; tube = [0, -0.6, -0.86]; }
    else { aR = -0.5 + Math.sin(s.walk) * 0.2; aL = -0.5 - Math.sin(s.walk) * 0.2; eR = eL = 0.45; }
    if (s.t < s.grabbedUntil) { aR = 0.6 + Math.random() * 0.4; aL = 0.6 + Math.random() * 0.4; }
    const k = clamp(dt * 12, 0, 1);
    armState.aR = lerp(armState.aR, aR, k); armState.aL = lerp(armState.aL, aL, k); armState.eR = lerp(armState.eR, eR, k); armState.eL = lerp(armState.eL, eL, k);
    O.armR.rotation.x = armState.aR; O.armL.rotation.x = armState.aL;
    O.armR.u.el.rotation.x = armState.eR; O.armL.u.el.rotation.x = armState.eL;
    O.heldTube.setEnabled(!!tube); if (tube) O.heldTube.position.set(tube[0], tube[1], tube[2]);
  }

  function resetVictimLimbs() {
    const u = O.vBody.u;
    [u.armL, u.armR, u.legL, u.legR].forEach((g) => { g.rotation.set(0, 0, 0); if (g.u.el) g.u.el.rotation.set(0, 0, 0); if (g.u.kn) g.u.kn.rotation.set(0, 0, 0); });
    u.head.rotation.set(0, 0, 0); O.vBody.rotation.set(0, 0, 0); O.vTilt.rotation.set(0, 0, 0);
  }
  function poseVictimPlay() {
    const s = st, v = s.victim, y = waveH(v.x, v.z, wt), u = O.vBody.u;
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
      u.armL.rotation.z = 0.9; u.armR.rotation.z = -0.9; u.armL.u.el.rotation.x = -0.5; u.armR.u.el.rotation.x = -0.5; u.head.rotation.x = 0.3;
      if (v.convulsing > 0) { O.vTilt.rotation.z = Math.sin(wt * 25) * 0.18; u.armL.rotation.x = Math.sin(wt * 22) * 0.6; u.armR.rotation.x = Math.sin(wt * 22 + 1) * 0.6; u.legL.rotation.x = Math.sin(wt * 20) * 0.4; }
    }
  }

  function aimWorldArms(dt) {
    [[O.wArmR, 1, 0], [O.wArmL, -1, 1]].forEach(([u, sd, idx]) => {
      const sh = camLocal(sd * 0.19, -0.3, 0.03);
      let tgt = st.handT && st.handT[idx] ? st.handT[idx].clone() : camLocal(sd * 0.17, -0.52, -0.34);
      const d = tgt.subtract(sh); if (d.length() > 0.72) tgt = sh.add(d.normalize().scale(0.72));
      u.h = u.h ? lerpV(u.h, tgt, clamp(dt * 11, 0, 1)) : tgt;
      const elbow = sh.add(u.h).scale(0.5).addInPlace(CAM.right.scale(sd * 0.09)).addInPlace(V(0, -0.07, 0));
      setLimb(u.up, sh, elbow); setLimb(u.fo, elbow, u.h);
      u.jS.position.copyFrom(sh); u.jE.position.copyFrom(elbow); u.jW.position.copyFrom(u.h);
      const dir = u.h.subtract(elbow).normalize();
      u.hand.position.copyFrom(u.h).addInPlace(dir.scale(0.03));
      u.hand.rotationQuaternion = quatFromTo(UPV, dir);
    });
  }

  function toScreen(p) {
    const w = engine.getRenderWidth(), h = engine.getRenderHeight();
    const v = BABYLON.Vector3.Project(p, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(w, h));
    const k = canvas.clientWidth / w;
    return { x: v.x * k, y: v.y * k, front: BABYLON.Vector3.Dot(p.subtract(CAM.pos), CAM.dir) > 0 };
  }
  function placeMarker() {
    const el = root && root.querySelector('.g-marker'); if (!el || !camera) return;
    const s = st;
    const d = Math.hypot(s.victim.x - s.player.x, s.victim.z - s.player.z);
    if (s.contact || s.phase !== 'play' || d > CROWD[s.level].marker) { el.hidden = true; return; }
    const sp = toScreen(V(s.victim.x, waveH(s.victim.x, s.victim.z, wt) + 0.9, s.victim.z));
    if (!sp.front || sp.x < -20 || sp.y < -20 || sp.x > canvas.clientWidth + 20 || sp.y > canvas.clientHeight + 20) { el.hidden = true; return; }
    el.hidden = false; el.style.left = sp.x + 'px'; el.style.top = sp.y + 'px';
    el.textContent = (s.victim.conscious ? L(G.riaLabel) + ' · ' : '') + Math.round(d) + ' m';
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
    s.ex = { secs, dur: s.partnerHere ? 5 : 7.5, k: 0, n, E, alone: !s.partnerHere, v0: { x: v.x, z: v.z, y: waveH(v.x, v.z, wt) + 0.03, yaw: O.vYaw.rotation.y }, c0: CAM.pos.clone(), done: false };
    s.camLook = CAM.pos.add(CAM.dir.scale(2));
    // apartar a los bañistas del punto de extracción
    s.npcs.forEach((q) => { if (Math.hypot(q.x - F.x, q.z - F.z) < 3) { q.x += (q.x - F.x) * 1.5 + 2; q.tx = q.x; q.tz = q.z; } });
    bubble(L(isPool() ? (s.ex.alone ? G.p3ExtractAlone : G.p3ExtractPartner) : (s.sc.cervical ? G.p3ExtractBeachLm : G.p3ExtractBeach)));
  }

  function extractFrame(dt) {
    const s = st, x = s.ex, P = s.paPose, g = P.ground, u = O.vBody.u;
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
      cpos = BABYLON.Vector3.Lerp(x.c0, cDeck, kc); cpos.y += Math.sin(kc * Math.PI) * 0.3;
      look = V(vx, vy + 0.1, vz);
      O.partner.setEnabled(!x.alone);
      if (!x.alone) {
        const up2 = sm((kv - 0.6) / 0.4);
        O.partner.position.set(x.E.x + x.n.x * 0.55 - P.t.x * 0.3, g - 0.38 + 0.38 * up2, x.E.z + x.n.z * 0.55 - P.t.z * 0.3);
        O.partner.rotation.set(0.5 * (1 - up2), Math.atan2(-x.n.x, -x.n.z), 0);
        const pu = O.partner.u; pu.armL.rotation.x = pu.armR.rotation.x = -0.9 - 0.5 * (1 - kv); pu.armL.rotation.z = 0.15; pu.armR.rotation.z = -0.15; pu.legL.u.kn.rotation.x = pu.legR.u.kn.rotation.x = 1.5 * (1 - up2);
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
    O.vYaw.position.set(vx, vy, vz); O.vYaw.rotation.y = vyaw; refreshVictim();
    lerpV(s.camLook, look, clamp(dt * 5, 0, 1));
    setCam(cpos, s.camLook.subtract(cpos));
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
    s.camPos = CAM.pos.clone();
    O.partner.setEnabled(s.partnerHere);
    if (s.partnerHere) {
      O.partner.position.set(P.F.x - P.t.x * 1.6 + P.r.x * 0.2, P.ground, P.F.z - P.t.z * 1.6 + P.r.z * 0.2);
      O.partner.rotation.set(0, Math.atan2(P.t.x, P.t.z), 0);
      const pu = O.partner.u; pu.armL.rotation.set(0, 0, 0); pu.armR.rotation.set(0, 0, 0); pu.legL.u.kn.rotation.x = pu.legR.u.kn.rotation.x = 0;
    }
    O.desa.setEnabled(false);
    if (s.sc.pa === 'pcr') pcrFlow3d(); else decisionsFlow3d();
  }

  function paCam(pose) {
    const c = bp('sternum'), m = bp('mouth'), r = st.paPose.r, td = st.paPose.td;
    const P = (b, rr, uu, tt) => addS(addS(addS(b.clone(), r, rr), UPV, uu), td, tt);
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
    const up = (v, d) => addS(v, UPV, d);
    switch (pose) {
      case 'shake': { const w = Math.sin(wt * 14) * 0.025; return [addS(up(bp('shoulderR'), 0.06), r, w), addS(up(bp('shoulderL'), 0.06), r, w)]; }
      case 'tilt': case 'vos': return [up(bp('chin'), 0.03), up(bp('forehead'), 0.04)];
      case 'jaw': return [up(bp('jawR'), 0.03), up(bp('jawL'), 0.03)];
      case 'vent': return [up(bp('chin'), 0.05), up(bp('forehead'), 0.06)];
      case 'cpr': { const c = bp('sternum'); return [up(c.clone(), 0.035 - pa.comp * 0.055), up(c.clone(), 0.075 - pa.comp * 0.055)]; }
      case 'pls': return [up(bp('hipL'), 0.06), up(bp('shoulderL'), 0.06)];
      case 'clear': return [camLocal(0.32, -0.02, -0.28), camLocal(-0.32, -0.02, -0.28)];
      default: return null;
    }
  }
  function paFrame(dt) {
    const s = st, pa = s.pa, P = s.paPose, u = O.vBody.u;
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
    u.torso.scaling.z = 0.62 * (1 + 0.16 * pa.rise - 0.3 * pa.comp);
    u.armL.rotation.x = -1.3 * pa.plsK; u.armL.u.el.rotation.x = -0.6 * pa.plsK; u.armR.rotation.z = -1.2 * pa.plsK;
    u.legL.rotation.x = -1.1 * pa.plsK; u.legL.u.kn.rotation.x = 1.6 * pa.plsK;
    if (pa.jolt > 0) { u.armL.rotation.z = Math.sin(pa.jolt * 50) * 0.2 * pa.jolt; u.armR.rotation.z = -u.armL.rotation.z; }
    O.blanket.setEnabled(pa.blanket);
    refreshVictim();
    const tgt = paCam(pa.pose);
    const panelUp = root.querySelector('.g-pactl:not([hidden])') || root.querySelector('.g-sheet:not([hidden])');
    if (panelUp) addS(tgt.look, UPV, -(canvas.clientHeight > canvas.clientWidth ? 0.42 : 0.16));
    lerpV(s.camPos, tgt.pos, clamp(dt * 3.2, 0, 1)); lerpV(s.camLook, tgt.look, clamp(dt * 3.8, 0, 1));
    setCam(s.camPos, s.camLook.subtract(s.camPos));
    s.handT = paHands(pa.pose);
    O.mask.setEnabled(pa.pose === 'vent');
    if (pa.pose === 'vent') O.mask.position.copyFrom(addS(bp('mouth'), UPV, 0.04));
    if (s.desaHere && pa.desaShown) {
      O.desa.setEnabled(true);
      const dpos = addS(addS(bp('sternum'), P.r, 0.48), P.td, -0.3); dpos.y = P.ground;
      O.desa.position.copyFrom(dpos); O.desa.rotation.y = P.yawEnd;
      const port = dpos.add(V(0, 0.1, 0));
      O.cables.forEach((ln, i) => { const pw = O.pads[i].getAbsolutePosition(); const mid = V((port.x + pw.x) / 2, P.ground + 0.05, (port.z + pw.z) / 2); MB().CreateLines(null, { points: [port, mid, pw.clone()], instance: ln }); });
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
      pa.pose = 'shake'; bubble(L(G.p3Hear)); speak(L(G.p3Hear));
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
      play('cough_water', bp('mouth'), 0.8);
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
    bindHold('g-hold', () => { if (!t0) { t0 = performance.now(); requestAnimationFrame(tick); play('gasp', bp('mouth'), 0.5, 0.8); } }, stop);
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
      else if (level > 85) { fails++; st.victim.o2 -= 3; st.t += 3; pmsg(L(G.ventTooMuch)); play('cough_water', bp('mouth'), 0.6); }
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
      if (!O.desaOpen) { O.desa.dispose(); O.desa = makeDesa(true); cast(O.desa); O.desaOpen = true; }
      speak(L(G.vDesaOn));
      const sand = s.sc.sand, prep = { dry: false, chest: false, sand: !sand };
      pa.prep = prep; pa.padMode = true; pa.pads = 0;
      panel('<p class="g-ptitle">' + esc(L(G.desaTitle)) + '</p><p class="small">' + esc(L(G.desaHint)) + '</p><div class="g-prep"><button class="btn small ghost" data-prep="dry">' + esc(L(sand ? G.prepMoveSand : G.prepDryFloor)) + '</button><button class="btn small ghost" data-prep="chest">' + esc(L(G.prepDryChest)) + '</button>' + (sand ? '<button class="btn small ghost" data-prep="sand">' + esc(L(G.prepSand)) + '</button>' : '') + '</div><p class="small g-flash" id="g-pmsg"></p>');
      root.querySelectorAll('[data-prep]').forEach((b) => b.onclick = () => { prep[b.dataset.prep] = true; b.classList.add('on'); b.disabled = true; st.t += 2; });
      pa.onPadsDone = () => {
        pa.padMode = false; pa.pose = 'clear'; bubble(L(G.desaAnalysing)); speak(L(G.desaAnalysing));
        later(2.8, () => {
          bubble(L(G.desaShockAdvised)); speak(L(G.vDesaShock));
          panel('<p class="g-ptitle">' + esc(L(G.desaShockAdvised)) + '</p>' + (prep.dry ? '' : '<p class="small muted">' + esc(L(G.wetWarning)) + '</p>') + '<button class="btn g-press" id="g-shock">⚡ ' + esc(L(G.allClear)) + '</button>');
          document.getElementById('g-shock').onclick = () => {
            if (!prep.dry) markCrit(L(G.critWetShock));
            s.cpr.shocked = true; pa.jolt = 1; st.t += 8; bubble(null); panel(null);
            later(0.9, () => { speak(L(G.shockDone)); paFb(L(G.shockDone), prep.dry ? 'green' : 'red', () => { desaDone = true; cycle(); }); });
          };
        });
      };
    };
    cycle();
  }

  function tryPad(e) {
    const s = st, pa = s.pa; if (!pa || !pa.padMode) return;
    const rect = canvas.getBoundingClientRect();
    const ray = scene.createPickingRay(e.clientX - rect.left, e.clientY - rect.top, BABYLON.Matrix.Identity(), camera);
    const target = bp(pa.pads === 0 ? 'padR' : 'padL');
    const to = target.subtract(ray.origin); const along = BABYLON.Vector3.Dot(to, ray.direction);
    const rayDist = to.subtract(ray.direction.scale(along)).length();
    const hit = ray.intersectsMesh(O.vBody.u.torso);
    const near = rayDist < 0.08 || (hit && hit.hit && BABYLON.Vector3.Distance(hit.pickedPoint, target) < 0.08);
    const idx = pa.pads;
    if (!near) { pmsg(L(idx === 0 ? G.padHint1 : G.padHint2)); return; }
    if (!pa.prep.chest || !pa.prep.sand) { pmsg(L(G.padNoStick)); return; }
    const pad = box(0.1, 0.006, 0.13, '#F4F4F4', { spec: 0.4 });
    box(0.07, 0.004, 0.09, '#E8742A', null, pad, 0, 0.004, 0);
    pad.position.copyFrom(addS(target, UPV, 0.004)); pad.rotation.y = st.paPose.yawEnd;
    pad.setParent(O.vBody); O.pads.push(pad);
    const ln = MB().CreateLines('cable', { points: [target, target.add(V(0, 0.01, 0)), target.add(V(0, 0.02, 0))], updatable: true }, scene); ln.color = new BABYLON.Color3(0.12, 0.12, 0.12); O.cables.push(ln);
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
    const lv = ['nula', 'media', 'alta'];
    root.innerHTML = '<a class="back" href="#game">← ' + esc(L(G.backToList)) + '</a><article class="case-head"><div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span></div><h2>' + esc(L(c.title)) + '</h2>' +
      '<div class="scene"><h3>' + esc(L(UI.scene)) + '</h3><p>' + esc(L(c.scene)) + '</p></div>' +
      '<p class="g-ptitle">' + esc(L(G.crowdTitle)) + '</p><div class="chips" role="group">' + lv.map((k) => '<button class="chip' + (selLevel === k ? ' on' : '') + '" data-lv="' + k + '">' + esc(L(G['crowd_' + k])) + '</button>').join('') + '</div>' +
      '<p class="hint" id="g-lvhint">' + esc(L(G['crowdHint_' + selLevel])) + '</p>' +
      '<p class="hint">' + esc(L(G.briefWater)) + '</p><p class="muted small">' + esc(L(G.controls)) + '</p><p class="muted small">🔊 ' + esc(L(G.soundHint)) + '</p>' +
      '<div class="actions"><button class="btn" data-play>' + esc(L(G.play)) + '</button></div></article>';
    root.querySelectorAll('[data-lv]').forEach((b) => b.onclick = () => { selLevel = b.dataset.lv; root.querySelectorAll('[data-lv]').forEach((x) => x.classList.toggle('on', x === b)); document.getElementById('g-lvhint').textContent = L(G['crowdHint_' + selLevel]); });
    root.querySelector('[data-play]').onclick = () => start(sc.id);
  }

  function start(id) {
    const sc = scenById(id); stop();
    audioInit();
    st = newState(sc, selLevel);
    root.innerHTML = '<a class="back" href="#game" data-back>← ' + esc(L(G.backToList)) + '</a>' +
      '<div class="g-stage g3d"><div class="g-hud"></div>' +
      '<button class="g-signal" data-signal>🔊 ' + esc(L(G.signalBtn)) + '</button>' +
      '<div class="g-marker" hidden></div><div class="g-cross" aria-hidden="true"></div><div class="g-bubble" hidden></div>' +
      '<div class="g-joy"><div class="g-knob"></div></div>' +
      '<button class="g-action" data-action>' + esc(L(G.actionBtn)) + '</button>' +
      '<p class="g-hint">' + esc(L(G.lookHint)) + '</p><div class="g-pactl" hidden></div><p class="g-loading">' + esc(L(G.loading3d)) + '</p></div><div class="g-log"></div>';
    root.querySelector('[data-back]').onclick = () => { stop(); st = null; };
    const ref = st;
    loadLibs().then(() => {
      if (st !== ref) return;
      const stage = root.querySelector('.g-stage'); const ld = stage.querySelector('.g-loading'); if (ld) ld.remove();
      try { setup3d(); } catch (e) { console.error(e); teardown3d(); stage.innerHTML = '<p class="warn">' + esc(L(G.noWebgl)) + '</p>'; return; }
      if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window) stage.classList.add('touch');
      bindControls();
      say(L(G.startMsg), '');
      audioPreload();
      running = true; last = performance.now(); raf = requestAnimationFrame(loop);
      updateHud();
    }).catch(() => { if (st !== ref) return; const stage = root.querySelector('.g-stage'); if (stage) stage.innerHTML = '<p class="warn">' + esc(L(G.noThree)) + '</p>'; });
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
    const p = toScreen(bp(i === 0 ? 'padR' : 'padL')); const r = canvas.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }
  return { render, stop, scenario: scenById, debug: () => st, padScreen, setLevel: (l) => { selLevel = l; } };
}
