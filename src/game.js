/* ===== Simulación tipo videojuego =====
   Rescate 2D desde arriba (canvas) + mini-juegos de técnica (DOM).
   createGame(api) → { render(root), stop() } */

function createGame(api) {
  'use strict';
  const { L, esc, UI, CASES, T, lang, flagHtml, record, progress, go } = api;
  const G = UI.game;

  /* ---------- escenarios ---------- */
  const SCEN = [
    { id: 'g-pis-ahog4', caseId: 'pis-ahog4', map: 'pool', victim: { conscious: false, breathing: false }, pa: 'pcr', drowning: true },
    { id: 'g-pla-lm', caseId: 'pla-lm-romp', map: 'beach', victim: { conscious: false, breathing: false, lm: true }, pa: 'pcr', drowning: true, cervical: true, sand: true, noDive: true },
    { id: 'g-pla-ahog2', caseId: 'pla-ahog2', map: 'beach', rip: true, victim: { conscious: true, panic: true, fatigue: 100 }, pa: 'decisions' },
    { id: 'g-pis-convuls', caseId: 'pis-convuls', map: 'pool', victim: { conscious: false, breathing: true, convulsing: 40 }, pa: 'decisions' },
    { id: 'g-agu-hipo', caseId: 'agu-hipotermia', map: 'lake', victim: { conscious: true, panic: false, fatigue: 100, cold: true }, pa: 'decisions', boya: true },
    { id: 'g-par-pcr', caseId: 'par-pcr', map: 'none', land: true, pa: 'pcr', drowning: false, wetFloor: true }
  ];
  const scenById = (id) => SCEN.find((s) => s.id === id);
  const caseOf = (sc) => CASES.find((c) => c.id === sc.caseId);

  /* ---------- estado ---------- */
  let root = null, canvas = null, ctx = null, raf = 0, last = 0, running = false;
  let W = 800, H = 500;
  let st = null;          // partida
  const keys = {};
  const joy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
  let actionHeld = false;

  function newState(sc) {
    const map = sc.map; sc.victim = sc.victim || {};
    const s = {
      sc, phase: 'play', t: 0, msg: [], flags: [], wrong: 0, crit: [], paused: false,
      signalAt: null, partnerAt: null, desaAt: null, partnerHere: false, desaHere: false,
      hasTube: false, inWater: false, entered: false, contact: false, towing: false, extracted: false,
      grabbedUntil: 0, holdUntil: 0, firstVentAt: null, o2Zero: false,
      player: { x: 70, y: 260, r: 11, speed: 150 },
      victim: { x: 600, y: 250, r: 12, faceUp: false, o2: 72, fatigue: 100, temp: 100, conscious: !!sc.victim.conscious, breathing: !!sc.victim.breathing, convulsing: sc.victim.convulsing || 0, grabbed: false },
      tube: { x: 95, y: 300, taken: false },
      cpr: null, result: null
    };
    if (map === 'pool') { s.player = { x: P.playerPool.x, y: P.playerPool.y, r: 11, speed: 150 }; s.victim.x = P.victimPool.x; s.victim.y = P.victimPool.y; s.tube = { x: P.tubePool.x, y: P.tubePool.y, taken: false }; }
    if (map === 'beach') { const vv = sc.rip ? P.victimRip : P.victimShore; s.player = { x: P.playerShore.x, y: P.playerShore.y, r: 11, speed: 150 }; s.victim.x = vv.x; s.victim.y = vv.y; s.tube = { x: P.tubeShore.x, y: P.tubeShore.y, taken: false }; }
    if (map === 'lake') { s.player = { x: P.playerShore.x, y: P.playerShore.y, r: 11, speed: 150 }; s.victim.x = P.victimLake.x; s.victim.y = P.victimLake.y; s.tube = { x: P.tubeShore.x, y: P.tubeShore.y, taken: false }; s.victim.temp = 55; }
    if (sc.victim.cold) s.victim.o2 = 95;
    if (sc.victim.conscious) s.victim.o2 = 95;
    return s;
  }

  /* ---------- utilidades ---------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = (txt, kind) => { st.msg.unshift({ t: st.t, txt, kind: kind || '' }); st.msg = st.msg.slice(0, 4); updateLog(); };
  const fmt = (sec) => { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; };
  function markWrong() { st.wrong += 1; }
  function markCrit(text) { st.crit.push(text); }

  /* ---------- geometría de mapas (apaisado / vertical) ---------- */
  let POOL, SHORE_Y, DRY_Y, RIP, P;
  function setLayout(portrait) {
    if (portrait) {
      W = 500; H = 760;
      POOL = { x: 90, y: 110, w: 330, h: 520 }; SHORE_Y = 560; DRY_Y = 640; RIP = { x: 200, w: 100 };
      P = { chair: { x: 18, y: 360 }, nurse: { x: 14, y: 30, w: 62, h: 40 }, puesto: { x: 190, y: 660 }, flag: { x: 240, y: 648 },
            playerPool: { x: 45, y: 330 }, tubePool: { x: 55, y: 410 }, victimPool: { x: 375, y: 190 },
            playerShore: { x: 250, y: 700 }, tubeShore: { x: 290, y: 705 }, victimRip: { x: 250, y: 230 }, victimShore: { x: 240, y: 330 }, victimLake: { x: 330, y: 150 },
            desaPool: { x: 50, y: 160 }, desaShore: { x: 150, y: 668 } };
    } else {
      W = 800; H = 500;
      POOL = { x: 150, y: 70, w: 560, h: 360 }; SHORE_Y = 340; DRY_Y = 400; RIP = { x: 370, w: 100 };
      P = { chair: { x: 48, y: 232 }, nurse: { x: 30, y: 60, w: 70, h: 40 }, puesto: { x: 50, y: 430 }, flag: { x: 100, y: 418 },
            playerPool: { x: 70, y: 250 }, tubePool: { x: 92, y: 300 }, victimPool: { x: 610, y: 240 },
            playerShore: { x: 90, y: 450 }, tubeShore: { x: 120, y: 455 }, victimRip: { x: 420, y: 150 }, victimShore: { x: 300, y: 250 }, victimLake: { x: 560, y: 120 },
            desaPool: { x: 110, y: 110 }, desaShore: { x: 150, y: 420 } };
    }
  }
  setLayout(false);
  function isWater(p) {
    const m = st.sc.map;
    if (m === 'pool') return p.x > POOL.x && p.x < POOL.x + POOL.w && p.y > POOL.y && p.y < POOL.y + POOL.h;
    return p.y < SHORE_Y;
  }
  function nearPoolEdge(p) {
    const dx = Math.min(Math.abs(p.x - POOL.x), Math.abs(p.x - (POOL.x + POOL.w)));
    const dy = Math.min(Math.abs(p.y - POOL.y), Math.abs(p.y - (POOL.y + POOL.h)));
    return Math.min(dx, dy) < 22;
  }
  function inRip(p) { return st.sc.rip && p.y < SHORE_Y && p.x > RIP.x && p.x < RIP.x + RIP.w; }

  /* ---------- bucle ---------- */
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (!st.paused && st.phase === 'play') { update(dt); draw(); updateHud(); }
    raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    st.t += dt;
    const s = st, p = s.player, v = s.victim, sc = s.sc;
    // llegada de compañero y DESA
    if (s.signalAt !== null) {
      if (!s.partnerHere && s.t >= s.partnerAt) { s.partnerHere = true; say(L(G.partnerHere), 'ok'); }
      if (!s.desaHere && s.t >= s.desaAt) { s.desaHere = true; say(L(G.desaHere), 'ok'); }
    }
    // movimiento
    let mx = 0, my = 0;
    if (keys.ArrowLeft || keys.a || keys.A) mx -= 1; if (keys.ArrowRight || keys.d || keys.D) mx += 1;
    if (keys.ArrowUp || keys.w || keys.W) my -= 1; if (keys.ArrowDown || keys.s || keys.S) my += 1;
    if (joy.active) { mx += joy.dx; my += joy.dy; }
    const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
    const frozen = s.t < s.grabbedUntil || s.t < s.holdUntil;
    if (!frozen && (mx || my)) {
      let spd = p.speed;
      if (s.inWater) spd = s.towing ? (s.hasTube ? 52 : 38) : (s.hasTube || sc.boya ? 78 : 70);
      let nx = p.x + mx * spd * dt, ny = p.y + my * spd * dt;
      if (inRip({ x: nx, y: ny })) ny -= 42 * dt;   // corriente de retorno empuja mar adentro
      nx = clamp(nx, 12, W - 12); ny = clamp(ny, 12, H - 12);
      // entrada al agua: en piscina pide elección al cruzar el bordillo
      const wasWater = isWater(p), willWater = isWater({ x: nx, y: ny });
      if (!wasWater && willWater && !s.entered) { askEntry(); return; }
      if (!wasWater && willWater && s.entered) { s.inWater = true; }
      if (wasWater && !willWater) {
        if (s.towing && !s.extracted) { askExtract(); return; }
        s.inWater = false;
      }
      p.x = nx; p.y = ny;
      if (s.towing) { v.x = p.x - mx * 16; v.y = p.y - my * 16; }
    }
    // coger el tubo
    if (!s.tube.taken && dist(p, s.tube) < 20) { s.tube.taken = true; s.hasTube = true; say(L(sc.boya ? G.tookBuoy : G.tookTube), 'ok'); }
    // víctima en el agua
    if (!s.contact) {
      if (v.conscious) {
        v.fatigue -= (sc.victim.cold ? 2.2 : 2.6) * dt;
        if (inRip(v)) v.y = Math.max(60, v.y - 6 * dt);
        if (v.fatigue <= 0) { v.conscious = false; v.breathing = false; v.faceUp = false; say(L(G.victimSank), 'bad'); }
      }
      if (!v.conscious) { if (v.convulsing > 0) { v.convulsing -= dt; v.o2 -= 0.5 * dt; } else if (!v.breathing) v.o2 -= 1.5 * dt; }
      v.temp -= (sc.victim.cold ? 1.4 : 0.35) * dt;
      // contacto
      if (dist(p, v) < p.r + v.r + 12) askContact();
    } else {
      if (!v.breathing && !v.faceUp) v.o2 -= 1.5 * dt;           // remolque boca abajo (error crítico)
      else if (!v.breathing) v.o2 -= 0.45 * dt;
      if (v.convulsing > 0) { v.convulsing -= dt; if (v.convulsing <= 0) { v.convulsing = 0; say(L(G.convulsionsStopped), 'ok'); } }
      v.temp -= (s.inWater ? (sc.victim.cold ? 1.4 : 0.35) : 0.25) * dt;
    }
    if (v.o2 <= 0 && !s.o2Zero) { s.o2Zero = true; v.o2 = 0; say(L(G.o2zero), 'bad'); }
    v.o2 = clamp(v.o2, 0, 100); v.temp = clamp(v.temp, 0, 100); v.fatigue = clamp(v.fatigue, 0, 100);
  }

  /* ---------- acciones ---------- */
  function signal() {
    const s = st; if (s.signalAt !== null) return;
    s.signalAt = s.t;
    const beach = s.sc.map !== 'pool';
    s.partnerAt = s.t + (beach ? 38 : 25); s.desaAt = s.t + (beach ? 70 : 50);
    say(L(G.signalDone), 'ok');
    updateHud();
  }

  function askEntry() {
    const s = st; const pool = s.sc.map === 'pool';
    const opts = pool
      ? [{ t: G.entryGiant, ok: true }, { t: G.entryDive, crit: G.critDivePool }, { t: G.entryHole, wrong: true }]
      : [{ t: G.entryRun, ok: true }, { t: G.entryDiveWave, crit: G.critDiveBeach }];
    if (!s.hasTube && !s.sc.boya) opts.push({ t: G.entryBack, back: true });
    choice(L(G.entryTitle), opts, (o) => {
      if (o.back) return;
      if (o.crit) { markCrit(L(o.crit)); s.injured = true; say(L(o.crit), 'bad'); finishGame(); return; }
      if (o.wrong) { markWrong(); say(L(G.entryHoleWhy), 'warn'); }
      s.entered = true; s.inWater = true;
      if (!s.hasTube) say(L(G.noTubeWarn), 'warn');
    });
  }

  function askContact() {
    const s = st, v = s.victim, sc = s.sc;
    s.contact = true;
    let opts;
    if (v.convulsing > 0) {
      opts = [{ t: G.cHoldConv, ok: true, hold: true }, { t: G.cExtractNow, wrong: G.cExtractNowWhy }, { t: G.cMouthObj, crit: G.critMouth }];
    } else if (v.conscious && sc.victim.panic) {
      opts = s.hasTube ? [{ t: G.cTubeFront, ok: true }, { t: G.cFrontal, crit: G.critGrab }]
                       : [{ t: G.cFrontalNoTube, crit: G.critGrab }, { t: G.cWaitTired, wrong: G.cWaitTiredWhy }];
    } else if (v.conscious) {
      opts = [{ t: G.cTubeFront, ok: true }, { t: G.cFrontal, wrong: G.critGrab }];
    } else if (sc.victim.lm) {
      opts = [{ t: G.cBicepsTriceps, ok: true }, { t: G.cHeadOneHand, crit: G.critHead }, { t: G.cTowFaceDown, crit: G.critFaceDown }];
    } else {
      opts = [{ t: G.cTurnAirway, ok: true }, { t: G.cTowFaceDown, crit: G.critFaceDown }, { t: G.cMouthHere, wrong: G.cMouthHereWhy }];
    }
    choice(L(G.contactTitle), opts, (o) => {
      if (o.crit) {
        markCrit(L(o.crit)); say(L(o.crit), 'bad');
        if (o.crit === G.critGrab) { s.grabbedUntil = s.t + 4; v.faceUp = true; s.towing = true; }
        else if (o.crit === G.critFaceDown) { v.faceUp = false; s.towing = true; }
        else if (o.crit === G.critMouth) { v.faceUp = true; s.towing = true; }
        else { v.faceUp = true; s.towing = true; }
        return;
      }
      if (o.wrong) { markWrong(); say(L(o.wrong), 'warn'); s.holdUntil = s.t + 6; v.faceUp = true; s.towing = true; return; }
      if (o.hold) { v.faceUp = true; s.holdUntil = s.t + Math.max(0, v.convulsing); s.towing = true; say(L(G.holdingConv), 'ok'); return; }
      v.faceUp = true; s.towing = true; say(L(G.controlOk), 'ok');
      if (sc.victim.lm) {
        setTimeout(() => choice(L(G.lmBreathTitle), [{ t: G.lmExtractNow, ok: true }, { t: G.lmWaitBoard, crit: G.critWaitBoard }], (o2) => {
          if (o2.crit) { markCrit(L(o2.crit)); say(L(o2.crit), 'bad'); s.holdUntil = s.t + 15; } else say(L(G.lmExtractWhy), 'ok');
        }), 50);
      }
    });
  }

  function askExtract() {
    const s = st;
    if (s.victim.convulsing > 0) { say(L(G.waitConv), 'warn'); s.player.y += 0; return; }
    const alone = !s.partnerHere;
    const opts = [{ t: alone ? G.extractAlone : G.extractWithPartner, ok: true, secs: alone ? 12 : 4 }];
    if (alone && s.signalAt !== null) opts.push({ t: G.extractWait, wait: true });
    if (!s.sc.victim.breathing && !s.victim.conscious) opts.push({ t: G.extractSit, crit: G.critSit });
    choice(L(G.extractTitle), opts, (o) => {
      if (o.wait) return;
      if (o.crit) { markCrit(L(o.crit)); say(L(o.crit), 'bad'); }
      s.extracted = true; s.inWater = false;
      progressBar(L(G.extracting), o.secs, () => { s.phase = 'pa'; startPA(); });
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

  /* ---------- dibujo ---------- */
  function draw() {
    const s = st, c = ctx; const m = s.sc.map;
    c.clearRect(0, 0, W, H);
    if (m === 'pool') drawPool(); else drawShore(m === 'lake');
    // tubo
    if (!s.tube.taken) { c.save(); c.translate(s.tube.x, s.tube.y); c.rotate(-0.6); c.fillStyle = '#D7263D'; c.fillRect(-16, -4, 32, 8); c.restore(); }
    // DESA en el borde
    if (s.desaHere) { const d = desaSpot(); c.fillStyle = '#1D8A4A'; c.fillRect(d.x - 9, d.y - 7, 18, 14); c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText('DESA', d.x, d.y + 3); }
    // compañero
    if (s.partnerHere) { const d = desaSpot(); drawPerson(d.x + 28, d.y, '#F2C94C', '#E3A857', false); }
    // víctima
    const v = s.victim;
    drawVictim(v);
    // jugador
    drawPerson(s.player.x, s.player.y, '#D7263D', '#F0B48F', s.hasTube || (s.sc.boya && s.tube.taken));
    if (s.t < s.grabbedUntil) { c.strokeStyle = '#D7263D'; c.lineWidth = 2; c.beginPath(); c.arc(s.player.x, s.player.y, 18, 0, Math.PI * 2); c.stroke(); }
  }
  function desaSpot() { return st.sc.map === 'pool' ? P.desaPool : P.desaShore; }
  function drawPool() {
    const c = ctx;
    c.fillStyle = '#E8DCC2'; c.fillRect(0, 0, W, H);                       // playa de la piscina
    c.fillStyle = '#CFE0E6'; c.fillRect(POOL.x - 8, POOL.y - 8, POOL.w + 16, POOL.h + 16);
    const grd = c.createLinearGradient(POOL.x, 0, POOL.x + POOL.w, 0); grd.addColorStop(0, '#6EC1E4'); grd.addColorStop(1, '#2B8BC2');
    c.fillStyle = grd; c.fillRect(POOL.x, POOL.y, POOL.w, POOL.h);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
    for (let i = 1; i < 6; i++) { const y = POOL.y + (POOL.h / 6) * i; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(POOL.x, y); c.lineTo(POOL.x + POOL.w, y); c.stroke(); }
    c.setLineDash([]);
    c.fillStyle = '#10232B'; c.font = 'bold 12px sans-serif'; c.textAlign = 'left';
    c.fillText('1,20 m', POOL.x + 8, POOL.y + 16); c.textAlign = 'right'; c.fillText('2,20 m', POOL.x + POOL.w - 8, POOL.y + 16);
    // silla
    c.fillStyle = '#0B4F6C'; c.fillRect(P.chair.x, P.chair.y, 26, 26); c.fillStyle = '#fff'; c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText('SOS', P.chair.x + 13, P.chair.y + 17);
    // enfermería
    const n = P.nurse; c.fillStyle = '#fff'; c.fillRect(n.x, n.y, n.w, n.h); c.strokeStyle = '#D7263D'; c.lineWidth = 3; c.strokeRect(n.x, n.y, n.w, n.h);
    c.fillStyle = '#D7263D'; c.fillRect(n.x + n.w / 2 - 5, n.y + 10, 10, 20); c.fillRect(n.x + n.w / 2 - 10, n.y + 15, 20, 10);
  }
  function drawShore(lake) {
    const c = ctx;
    const grd = c.createLinearGradient(0, 0, 0, SHORE_Y); grd.addColorStop(0, lake ? '#245C6B' : '#1F7FB8'); grd.addColorStop(1, lake ? '#3C8A96' : '#5FBBE0');
    c.fillStyle = grd; c.fillRect(0, 0, W, SHORE_Y);
    c.fillStyle = lake ? '#9DB38A' : '#EBD9A8'; c.fillRect(0, SHORE_Y, W, H - SHORE_Y);
    c.fillStyle = lake ? '#7F9A72' : '#D9C48F'; c.fillRect(0, SHORE_Y, W, DRY_Y - SHORE_Y);
    if (st.sc.rip) { c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(RIP.x, 0, RIP.w, SHORE_Y); c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('↑ ' + L(G.ripLabel) + ' ↑', RIP.x + RIP.w / 2, 20); }
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const y = SHORE_Y - 10 - i * 60 + Math.sin(st.t * 2 + i) * 3; c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin((x + st.t * 60) / 25) * 3); c.stroke(); }
    if (lake) { c.fillStyle = '#4F6F45'; for (let i = 0; i < Math.floor(W / 140); i++) { c.beginPath(); c.arc(60 + i * 140, H - 30, 12, 0, Math.PI * 2); c.fill(); } }
    // puesto
    c.fillStyle = '#0B4F6C'; c.fillRect(P.puesto.x, P.puesto.y, 34, 30); c.fillStyle = '#fff'; c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText('SOS', P.puesto.x + 17, P.puesto.y + 19);
    if (!lake) { c.fillStyle = '#E9B51C'; c.fillRect(P.flag.x, P.flag.y, 3, 30); c.fillRect(P.flag.x + 3, P.flag.y, 14, 9); }
  }
  function drawPerson(x, y, cap, skin, tube) {
    const c = ctx;
    if (tube) { c.save(); c.translate(x - 14, y); c.rotate(0.3); c.fillStyle = '#D7263D'; c.fillRect(-14, -3, 28, 6); c.restore(); }
    c.fillStyle = skin; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = cap; c.beginPath(); c.arc(x, y - 2, 8, Math.PI, 0); c.fill();
    c.fillStyle = skin; c.fillRect(x - 17, y - 3, 6, 6); c.fillRect(x + 11, y - 3, 6, 6);
  }
  function drawVictim(v) {
    const c = ctx;
    c.save(); c.translate(v.x, v.y);
    if (v.convulsing > 0) c.rotate(Math.sin(st.t * 25) * 0.25);
    c.fillStyle = v.faceUp ? '#F0B48F' : '#5A3C2E';
    c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
    if (v.faceUp) { c.fillStyle = '#10232B'; c.fillRect(-5, -3, 2, 2); c.fillRect(3, -3, 2, 2); c.fillRect(-3, 4, 6, 1.5); }
    c.fillStyle = v.faceUp ? '#F0B48F' : '#5A3C2E';
    if (v.conscious && !st.contact) { const a = Math.sin(st.t * 6) * 6; c.fillRect(-22, -4 - a, 8, 6); c.fillRect(14, -4 + a, 8, 6); }
    else { c.fillRect(-20, -2, 8, 6); c.fillRect(12, -2, 8, 6); }
    c.restore();
    if (!st.contact && v.conscious) { c.fillStyle = '#10232B'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(L(G.riaLabel), v.x, v.y - 20); }
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
    const kd = (e) => { if (!st || st.phase !== 'play') return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); keys[e.key] = true; if (e.key === ' ' || e.key === 'e' || e.key === 'E') actionKey(); if (e.key === 'x' || e.key === 'X') signal(); };
    const ku = (e) => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    st._unbind = () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    const pad = stage.querySelector('.g-joy');
    pad.onpointerdown = (e) => { e.preventDefault(); joy.active = true; joy.id = e.pointerId; const r = pad.getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; moveJoy(e); pad.setPointerCapture(e.pointerId); };
    pad.onpointermove = (e) => { if (joy.active && e.pointerId === joy.id) moveJoy(e); };
    const endJoy = (e) => { if (e.pointerId === joy.id) { joy.active = false; joy.dx = joy.dy = 0; const k = pad.querySelector('.g-knob'); k.style.transform = ''; } };
    pad.onpointerup = pad.onpointercancel = endJoy;
    function moveJoy(e) { let dx = (e.clientX - joy.cx) / 40, dy = (e.clientY - joy.cy) / 40; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.dx = dx; joy.dy = dy; pad.querySelector('.g-knob').style.transform = 'translate(' + (dx * 32) + 'px,' + (dy * 32) + 'px)'; }
    stage.querySelector('[data-action]').onpointerdown = (e) => { e.preventDefault(); actionKey(); };
    stage.querySelector('[data-signal]').onclick = () => signal();
  }
  function actionKey() {
    const s = st; if (!s || s.paused || s.phase !== 'play') return;
    const p = s.player;
    if (s.sc.map === 'pool' && !s.entered && !s.inWater && nearPoolEdge(p)) { askEntry(); return; }
    if (s.towing && !s.extracted) {
      if (s.sc.map === 'pool' ? nearPoolEdge(p) : p.y > SHORE_Y - 25) { askExtract(); return; }
      say(L(G.goToEdge), 'warn'); return;
    }
    if (!s.contact && dist(p, s.victim) < 40) { askContact(); return; }
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
    setLayout(false); st = newState(sc);
    if (sc.land) {
      root.innerHTML = '<a class="back" href="#game" data-back>← ' + esc(L(G.backToList)) + '</a><div class="g-stage"></div><div class="g-log"></div>';
      root.querySelector('[data-back]').onclick = () => { stop(); st = null; };
      st.phase = 'pa'; st.victim.o2 = 70; st.victim.temp = 90; startPA(); return;
    }
    setLayout(root.clientWidth < 600);
    st = newState(sc);
    root.innerHTML = '<a class="back" href="#game" data-back>← ' + esc(L(G.backToList)) + '</a>' +
      '<div class="g-stage' + (W < H ? ' portrait' : '') + '"><canvas class="g-canvas" width="' + W + '" height="' + H + '" aria-label="' + esc(L(G.title)) + '"></canvas>' +
      '<div class="g-hud"></div>' +
      '<button class="g-signal" data-signal>🔊 ' + esc(L(G.signalBtn)) + '</button>' +
      '<div class="g-joy"><div class="g-knob"></div></div>' +
      '<button class="g-action" data-action>' + esc(L(G.actionBtn)) + '</button>' +
      '</div><div class="g-log"></div>';
    root.querySelector('[data-back]').onclick = () => { stop(); st = null; };
    canvas = root.querySelector('canvas'); ctx = canvas.getContext('2d');
    if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window) root.querySelector('.g-stage').classList.add('touch');
    bindControls();
    say(L(G.startMsg), '');
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    updateHud();
  }

  function stop() { running = false; cancelAnimationFrame(raf); if (st && st._unbind) st._unbind(); for (const k in keys) keys[k] = false; joy.active = false; }

  function render(container, arg) {
    root = container;
    if (st && st.result && (!arg || arg === st.sc.id)) { renderResult(); return; }
    if (st && arg === st.sc.id && (running || st.phase === 'pa')) return;   // partida en curso: no re-renderizar
    if (arg && scenById(arg)) { if (st && st.sc.id !== arg) { stop(); st = null; } renderBrief(scenById(arg)); return; }
    stop(); st = null; renderList();
  }

  const api_ = { render, stop, scenario: scenById, debug: () => st, layout: () => ({ W, H, SHORE_Y, DRY_Y, POOL, P }) };
  return api_;
}
