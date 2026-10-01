/* ===== Simulador Socorrista CV — app ===== */
(function () {
  'use strict';

  const ENV_ORDER = ['piscina', 'playa', 'parque', 'aguas'];
  const SIT_ORDER = ['ahogamiento', 'rcp', 'medular', 'convulsion', 'hipotermia', 'calor', 'medusa', 'herida', 'ovace'];

  /* ---------- state ---------- */
  const S = {
    lang: 'es', theme: null,
    sample: null, db: null, uid: null, dbReady: false, storageMode: 'local', accountName: '', avatarUrl: '',
    progress: null,
    filterEnv: 'all', filterSit: 'all',
    session: null,   // checklist session
    exam: null,      // exam session
    dlg: null,       // dialogue session
    voice: { auto: false, listening: false, rec: null, speaking: -1 },
    apiMode: false, sampleChecked: false
  };
  const HAS_RUNTIME = !!(window.claude && typeof window.claude.use === 'function');
  const API_DEFAULT_MODEL = 'claude-sonnet-4-6';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;

  const $app = document.getElementById('app');
  const $top = document.getElementById('top');

  /* ---------- helpers ---------- */
  const L = (o) => (o && typeof o === 'object') ? (o[S.lang] || o.es || '') : (o || '');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage may be unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString(S.lang === 'va' ? 'ca-ES' : 'es-ES', { day: '2-digit', month: 'short' }); } catch (e) { return ''; } };
  const fmtNum = (n) => (Math.round(n * 10) / 10).toLocaleString(S.lang === 'va' ? 'ca-ES' : 'es-ES');
  const caseById = (id) => CASES.find((c) => c.id === id);
  const userName = () => (S.progress && S.progress.name) || S.accountName || '';

  function md(text) {
    const lines = esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').split('\n');
    let html = '', list = null, para = [];
    const flushPara = () => { if (para.length) { html += '<p>' + para.join(' ') + '</p>'; para = []; } };
    const closeList = () => { if (list) { html += '</' + list + '>'; list = null; } };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushPara(); closeList(); continue; }
      let m;
      if ((m = line.match(/^#{1,6}\s+(.*)$/))) { flushPara(); closeList(); html += '<h4>' + m[1] + '</h4>'; continue; }
      if ((m = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/))) {
        flushPara();
        const kind = /^\d/.test(line) ? 'ol' : 'ul';
        if (list !== kind) { closeList(); list = kind; html += '<' + kind + '>'; }
        html += '<li>' + m[1] + '</li>'; continue;
      }
      closeList(); para.push(line);
    }
    flushPara(); closeList();
    return html;
  }

  /* ---------- progress ---------- */
  const emptyProgress = () => ({ v: 1, name: '', cases: {}, exams: [], dialogs: {}, games: {}, updatedAt: 0 });

  function loadLocal() {
    try { const raw = ls.get('scv-progress'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  async function initProgress() {
    S.progress = loadLocal() || emptyProgress();
    if (!HAS_RUNTIME) return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (db && user) {
        const me = await user.me();
        S.accountName = me.name || ''; S.avatarUrl = me.avatarUrl || '';
        const uid = me.id;
        if (uid) {
          S.db = db; S.uid = uid;
          const ref = db.doc('data/users/' + uid + '/progress');
          const snap = await ref.get();
          const remote = snap.exists ? snap.data() : null;
          if (remote && (remote.updatedAt || 0) >= (S.progress.updatedAt || 0)) {
            S.progress = Object.assign(emptyProgress(), remote);
            ls.set('scv-progress', JSON.stringify(S.progress));
          } else if (S.progress.updatedAt) {
            await ref.set(S.progress);
          }
          S.dbReady = true; S.storageMode = 'cloud';
        }
      }
    } catch (e) { /* stay local */ }
    const v = route().view;
    if (v === 'progress' || v === 'cases') render(); else renderTop();
  }

  let saving = Promise.resolve();
  function saveProgress() {
    S.progress.updatedAt = Date.now();
    const snapshot = JSON.parse(JSON.stringify(S.progress));
    ls.set('scv-progress', JSON.stringify(snapshot));
    if (S.dbReady) {
      saving = saving.then(() => S.db.doc('data/users/' + S.uid + '/progress').set(snapshot)).catch(() => { S.storageMode = 'local-error'; });
    }
  }

  function recordCase(caseId, score, flag, critSteps) {
    const p = S.progress;
    const c = p.cases[caseId] || { attempts: 0, best: 0, lastFlag: null, lastAt: 0, critical: [] };
    c.attempts += 1; c.best = Math.max(c.best, score); c.lastFlag = flag; c.lastAt = Date.now();
    const seen = new Set(c.critical);
    critSteps.forEach((t) => { if (!seen.has(t)) { seen.add(t); c.critical.push(t); } });
    c.critical = c.critical.slice(-12);
    p.cases[caseId] = c;
    saveProgress();
  }
  function recordGame(id, score, flag, critSteps) {
    const p = S.progress; p.games = p.games || {};
    const g = p.games[id] || { attempts: 0, best: 0, lastFlag: null, lastAt: 0, critical: [] };
    g.attempts += 1; g.best = Math.max(g.best, score); g.lastFlag = flag; g.lastAt = Date.now();
    const seen = new Set(g.critical); critSteps.forEach((t) => { if (!seen.has(t)) { seen.add(t); g.critical.push(t); } }); g.critical = g.critical.slice(-12);
    p.games[id] = g; saveProgress();
  }
  function recordExam(n, score, invalid) {
    S.progress.exams.push({ at: Date.now(), n, score, invalid });
    S.progress.exams = S.progress.exams.slice(-30);
    saveProgress();
  }
  function recordDialog(caseId, score) {
    S.progress.dialogs[caseId] = (S.progress.dialogs[caseId] || 0) + 1;
    if (typeof score === 'number') {
      S.progress.dialogScores = S.progress.dialogScores || {};
      S.progress.dialogScores[caseId] = Math.max(S.progress.dialogScores[caseId] || 0, score);
    }
    saveProgress();
  }

  /* ---------- flag ---------- */
  const flagOf = (score, crit) => crit > 0 ? 'red' : (score >= 6 ? 'green' : 'yellow');
  const flagHtml = (flag, cls) => '<span class="flag ' + flag + ' ' + (cls || '') + '" aria-hidden="true"></span>';

  /* ---------- router ---------- */
  function route() {
    const h = location.hash.replace('#', '') || 'cases';
    const [view, arg] = h.split('/');
    return { view, arg };
  }
  window.addEventListener('hashchange', render);

  function go(hash) { if (location.hash !== '#' + hash) location.hash = hash; else render(); }

  /* ---------- header ---------- */
  function renderTop() {
    const { view } = route();
    const tabs = [['cases', UI.nav.cases], ['game', UI.nav.game], ['exam', UI.nav.exam], ['dialog', UI.nav.dialog], ['progress', UI.nav.progress]];
    const active = view === 'case' ? 'cases' : view;
    $top.innerHTML =
      '<div class="brand"><h1>' + esc(L(UI.appName)) + '</h1><p>' + esc(L(UI.tagline)) + (userName() ? ' · ' + esc(L(UI.hello)) + ', ' + esc(userName()) : '') + '</p></div>' +
      '<div class="controls">' +
        '<div class="lang" role="group" aria-label="Idioma">' +
          '<button data-lang="es" class="' + (S.lang === 'es' ? 'on' : '') + '">ES</button>' +
          '<button data-lang="va" class="' + (S.lang === 'va' ? 'on' : '') + '">VA</button>' +
        '</div>' +
        '<button class="theme" data-theme-toggle aria-label="' + esc(L(UI.theme)) + '" title="' + esc(L(UI.theme)) + '">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" fill="currentColor"/></svg>' +
        '</button>' +
      '</div>' +
      '<nav class="tabs" aria-label="Secciones">' + tabs.map(([k, t]) => '<a href="#' + k + '" class="' + (active === k ? 'on' : '') + '">' + esc(L(t)) + '</a>').join('') + '</nav>';
  }

  $top.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]');
    if (lb) { S.lang = lb.dataset.lang; ls.set('scv-lang', S.lang); document.documentElement.lang = S.lang === 'va' ? 'ca' : 'es'; render(); return; }
    if (e.target.closest('[data-theme-toggle]')) {
      const cur = document.documentElement.getAttribute('data-theme');
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = cur ? cur === 'dark' : sysDark;
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next); ls.set('scv-theme', next);
    }
  });

  /* ---------- render ---------- */
  function render() {
    renderTop();
    const { view, arg } = route();
    window.scrollTo(0, 0);
    if (view !== 'game') GAME.stop();
    if (view === 'case' && arg) return renderCase(arg);
    if (view === 'game') return GAME.render($app, arg);
    if (view === 'exam') return renderExam();
    if (view === 'dialog') return renderDialog(arg);
    if (view === 'progress') return renderProgress();
    return renderCases();
  }

  /* ========== CASES LIST ========== */
  function renderCases() {
    const chips = (items, cur, key) => items.map(([k, lab]) => '<button class="chip ' + (cur === k ? 'on' : '') + '" data-' + key + '="' + k + '">' + esc(lab) + '</button>').join('');
    const envChips = chips([['all', L(UI.allEnv)]].concat(ENV_ORDER.map((k) => [k, L(UI.env[k])])), S.filterEnv, 'env');
    const sitChips = chips([['all', L(UI.allSit)]].concat(SIT_ORDER.map((k) => [k, L(UI.sit[k])])), S.filterSit, 'sit');
    const list = CASES.filter((c) => (S.filterEnv === 'all' || c.env === S.filterEnv) && (S.filterSit === 'all' || c.sit === S.filterSit || (c.tags || []).includes(S.filterSit)));
    const cards = list.map((c) => {
      const pr = S.progress.cases[c.id];
      const status = pr ? flagHtml(pr.lastFlag || flagOf(pr.best, 0)) + '<span>' + esc(L(UI.best)) + ' ' + fmtNum(pr.best) + ' · ' + pr.attempts + ' ' + esc(L(UI.attempts)) + '</span>'
                        : '<span class="muted">' + esc(L(UI.notDone)) + '</span>';
      return '<a class="case-card" href="#case/' + c.id + '">' +
        '<div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span>' + (c.rescue ? '<span class="pill">' + esc(L(UI.rescuePhase)) + ' + PA</span>' : '<span class="pill">PA</span>') + '</div>' +
        '<h3>' + esc(L(c.title)) + '</h3>' +
        '<p>' + esc(L(c.victim)) + '</p>' +
        '<div class="status">' + status + '</div>' +
      '</a>';
    }).join('');
    $app.innerHTML =
      '<section class="filters"><div class="chips">' + envChips + '</div><div class="chips">' + sitChips + '</div></section>' +
      '<div class="toolbar"><button class="btn ghost" data-random>' + esc(L(UI.randomCase)) + '</button></div>' +
      '<section class="case-grid">' + (cards || '<p class="muted">—</p>') + '</section>';
    $app.querySelector('[data-random]').onclick = () => { const pick = list.length ? list : CASES; go('case/' + pick[Math.floor(Math.random() * pick.length)].id); };
    $app.querySelectorAll('[data-env]').forEach((b) => b.onclick = () => { S.filterEnv = b.dataset.env; renderCases(); });
    $app.querySelectorAll('[data-sit]').forEach((b) => b.onclick = () => { S.filterSit = b.dataset.sit; renderCases(); });
  }

  /* ========== CHECKLIST CASE ========== */
  function buildSteps(c, scope) {
    let steps = [];
    if (scope === 'full' && c.rescue) steps = steps.concat(c.rescue.map((s) => Object.assign({ phase: 'rescue' }, s)));
    else if (c.paPrefix) steps = steps.concat(c.paPrefix.map((s) => Object.assign({ phase: 'pa' }, s)));
    steps = steps.concat(c.pa.map((s) => Object.assign({ phase: 'pa' }, s)));
    return steps;
  }

  function startSession(c, scope) {
    const steps = buildSteps(c, scope);
    S.session = { caseId: c.id, scope, steps, idx: 0, results: [], options: null, picked: null, done: false };
    prepareOptions();
    renderCase(c.id);
  }

  function prepareOptions() {
    const s = S.session; const step = s.steps[s.idx];
    let opts = [{ kind: 'ok', t: step.t, why: step.why }];
    (step.alts || []).forEach((a) => opts.push({ kind: a.crit ? 'crit' : 'wrong', t: a.t, why: a.why }));
    if (opts.length < 3) {
      const future = s.steps[s.idx + 1] || s.steps[s.idx + 2];
      if (future) opts.push({ kind: 'later', t: future.t, why: null });
    }
    s.options = shuffle(opts); s.picked = null;
  }

  function renderCase(id) {
    const c = caseById(id);
    if (!c) return go('cases');
    const s = S.session && S.session.caseId === id ? S.session : null;
    if (!s) return renderCaseIntro(c);
    if (s.done) return renderCaseResult(c, s);
    renderCasePlay(c, s);
  }

  function renderCaseIntro(c) {
    const hasRescue = !!c.rescue;
    const scopes = hasRescue
      ? '<div class="scope" role="group"><button class="btn" data-scope="full">' + esc(L(UI.scope.full)) + '</button><button class="btn ghost" data-scope="pa">' + esc(L(UI.scope.pa)) + '</button></div>'
      : '<div class="scope"><button class="btn" data-scope="pa">' + esc(L(UI.start)) + '</button></div>';
    const pr = S.progress.cases[c.id];
    $app.innerHTML =
      '<a class="back" href="#cases">← ' + esc(L(UI.backToCases)) + '</a>' +
      '<article class="case-head">' +
        '<div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span></div>' +
        '<h2>' + esc(L(c.title)) + '</h2>' +
        '<p class="victim">' + esc(L(UI.victim)) + ': ' + esc(L(c.victim)) + '</p>' +
        '<div class="scene"><h3>' + esc(L(UI.scene)) + '</h3><p>' + esc(L(c.scene)) + '</p></div>' +
        (pr ? '<p class="muted small">' + flagHtml(pr.lastFlag || 'green', 'inline') + esc(L(UI.best)) + ' ' + fmtNum(pr.best) + ' · ' + pr.attempts + ' ' + esc(L(UI.attempts)) + '</p>' : '') +
        (hasRescue ? '<p class="hint">' + esc(L(UI.scope.pa)) + ': ' + esc(L(UI.scopeHint)) + '</p>' : '') +
        scopes +
      '</article>';
    $app.querySelectorAll('[data-scope]').forEach((b) => b.onclick = () => startSession(c, b.dataset.scope));
  }

  function stepLine(st, r, n) {
    const flag = r ? (r.status === 'ok' ? 'green' : (r.status === 'crit' ? 'red' : 'yellow')) : 'none';
    return '<li class="step done ' + flag + '">' +
      '<div class="marker">' + flagHtml(flag) + '<span class="num">' + n + '</span></div>' +
      '<div class="body"><p class="step-text">' + esc(L(st.t)) + '</p>' +
      (r && r.status !== 'ok' ? '<p class="picked"><strong>' + esc(L(UI.yourAnswer)) + ':</strong> ' + esc(L(r.pickedText)) + '</p>' : '') +
      '<p class="why">' + esc(L(st.why)) + (st.ref ? ' <span class="ref">' + esc(L(UI.source)) + ': ' + esc(st.ref) + '</span>' : '') + '</p></div></li>';
  }

  function renderCasePlay(c, s) {
    const step = s.steps[s.idx];
    const sceneText = (s.scope === 'pa' && c.scenePA) ? L(c.scenePA) : L(c.scene);
    const doneHtml = s.steps.slice(0, s.idx).map((st, i) => stepLine(st, s.results[i], i + 1)).join('');
    const phaseLabel = (i) => {
      const st = s.steps[i]; const prev = s.steps[i - 1];
      if (!prev || prev.phase !== st.phase) return '<li class="phase">' + esc(L(st.phase === 'rescue' ? UI.rescuePhase : UI.paPhase)) + '</li>';
      return '';
    };
    // phase labels interleaved
    let timeline = '';
    for (let i = 0; i < s.idx; i++) timeline += phaseLabel(i) + stepLine(s.steps[i], s.results[i], i + 1);
    timeline += phaseLabel(s.idx);

    let current;
    if (s.picked === null) {
      current = '<li class="step current"><div class="marker">' + flagHtml('none') + '<span class="num">' + (s.idx + 1) + '</span></div>' +
        '<div class="body"><p class="ask">' + esc(L(UI.whatNow)) + '</p><div class="options">' +
        s.options.map((o, i) => '<button class="opt" data-opt="' + i + '">' + esc(L(o.t)) + '</button>').join('') +
        '</div></div></li>';
    } else {
      const o = s.options[s.picked];
      const r = s.results[s.idx];
      const flag = r.status === 'ok' ? 'green' : (r.status === 'crit' ? 'red' : 'yellow');
      const head = r.status === 'ok' ? L(UI.correct) : (r.status === 'crit' ? L(UI.critical) : (r.status === 'later' ? L(UI.notYet) : L(UI.wrong)));
      current = '<li class="step current ' + flag + '"><div class="marker">' + flagHtml(flag) + '<span class="num">' + (s.idx + 1) + '</span></div>' +
        '<div class="body"><div class="feedback ' + flag + '"><p class="fb-head">' + esc(head) + '</p>' +
        (r.status !== 'ok' ? '<p class="picked"><strong>' + esc(L(UI.yourAnswer)) + ':</strong> ' + esc(L(o.t)) + '</p>' + (o.why ? '<p>' + esc(L(o.why)) + '</p>' : '') + '<p class="right"><strong>' + esc(L(UI.theRightOne)) + '</strong> ' + esc(L(step.t)) + '</p>' : '<p class="step-text">' + esc(L(step.t)) + '</p>') +
        '<p class="why">' + esc(L(step.why)) + (step.ref ? ' <span class="ref">' + esc(L(UI.source)) + ': ' + esc(step.ref) + '</span>' : '') + '</p></div>' +
        '<button class="btn" data-next>' + esc(s.idx + 1 >= s.steps.length ? L(UI.finish) : L(UI.continue)) + '</button></div></li>';
    }
    const nCrit = s.results.filter((r) => r && r.status === 'crit').length;
    $app.innerHTML =
      '<a class="back" href="#cases">← ' + esc(L(UI.backToCases)) + '</a>' +
      '<article class="play">' +
        '<div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(UI.sit[c.sit])) + '</span><span class="pill">' + esc(L(s.scope === 'full' ? UI.scope.full : UI.scope.pa)) + '</span></div>' +
        '<h2>' + esc(L(c.title)) + '</h2>' +
        '<details class="scene" open><summary>' + esc(L(UI.scene)) + '</summary><p>' + esc(sceneText) + '</p></details>' +
        '<div class="progressbar" aria-label="' + esc(L(UI.stepOf)) + ' ' + (s.idx + 1) + '/' + s.steps.length + '"><span style="width:' + Math.round(100 * s.idx / s.steps.length) + '%"></span></div>' +
        '<p class="counter">' + esc(L(UI.stepOf)) + ' ' + (s.idx + 1) + ' / ' + s.steps.length + (nCrit ? ' · <span class="crit">' + nCrit + ' ' + esc(L(UI.critCount)) + '</span>' : '') + '</p>' +
        '<ol class="timeline">' + timeline + current + '</ol>' +
      '</article>';
    $app.querySelectorAll('[data-opt]').forEach((b) => b.onclick = () => pick(+b.dataset.opt));
    const nextBtn = $app.querySelector('[data-next]');
    if (nextBtn) nextBtn.onclick = next;
    const cur = $app.querySelector('.step.current');
    if (cur && s.idx > 0) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function pick(i) {
    const s = S.session; const o = s.options[i];
    s.picked = i;
    s.results[s.idx] = { status: o.kind === 'ok' ? 'ok' : (o.kind === 'crit' ? 'crit' : (o.kind === 'later' ? 'later' : 'wrong')), pickedText: o.t };
    renderCase(s.caseId);
  }

  function next() {
    const s = S.session;
    if (s.idx + 1 >= s.steps.length) { finishSession(); return; }
    s.idx += 1; prepareOptions(); renderCase(s.caseId);
  }

  function finishSession() {
    const s = S.session; s.done = true;
    const ok = s.results.filter((r) => r.status === 'ok').length;
    const crit = s.results.filter((r) => r.status === 'crit').length;
    s.score = Math.round(100 * ok / s.steps.length) / 10;
    s.flag = flagOf(s.score, crit);
    s.ok = ok; s.crit = crit;
    recordCase(s.caseId, s.score, s.flag, s.results.map((r, i) => r.status === 'crit' ? L(s.steps[i].t) : null).filter(Boolean));
    renderCase(s.caseId);
  }

  function renderCaseResult(c, s) {
    const msg = s.flag === 'green' ? UI.flagGreen : (s.flag === 'red' ? UI.flagRed : UI.flagYellow);
    const lines = s.steps.map((st, i) => stepLine(st, s.results[i], i + 1)).join('');
    $app.innerHTML =
      '<a class="back" href="#cases">← ' + esc(L(UI.backToCases)) + '</a>' +
      '<article class="result ' + s.flag + '">' +
        '<h2>' + esc(L(UI.result)) + '</h2>' +
        '<div class="score-row">' + flagHtml(s.flag, 'big') +
          '<div><p class="score">' + esc(L(UI.grade)) + ' <strong>' + fmtNum(s.score) + '</strong>' + (s.flag === 'red' ? ' <span class="crit">(' + esc(L(UI.invalidTag)) + ')</span>' : '') + '</p>' +
          '<p>' + s.ok + '/' + s.steps.length + ' ' + esc(L(UI.firstTry)) + ' · ' + s.crit + ' ' + esc(L(UI.critCount)) + '</p></div></div>' +
        '<p class="verdict">' + esc(L(msg)) + '</p>' +
        '<div class="actions"><button class="btn" data-retry>' + esc(L(UI.retry)) + '</button><a class="btn ghost" href="#dialog/' + c.id + '">' + esc(L(UI.nav.dialog)) + '</a></div>' +
        (c.notes ? c.notes.map((n) => '<aside class="note"><strong>' + esc(L(UI.info)) + ':</strong> ' + esc(L(n)) + '</aside>').join('') : '') +
        '<h3>' + esc(L(UI.reviewSteps)) + '</h3><ol class="timeline review">' + lines + '</ol>' +
      '</article>';
    $app.querySelector('[data-retry]').onclick = () => { S.session = null; renderCaseIntro(c); };
  }

  /* ========== EXAM ========== */
  function renderExam() {
    const ex = S.exam;
    if (!ex) return renderExamIntro();
    if (ex.done) return renderExamResult();
    renderExamForm();
  }

  function renderExamIntro() {
    $app.innerHTML =
      '<article class="intro"><h2>' + esc(L(UI.nav.exam)) + '</h2><p>' + esc(L(UI.examIntro)) + '</p>' +
      '<p class="muted small">' + esc(L(UI.examMin)) + '</p>' +
      '<div class="actions"><button class="btn" data-n="10">' + esc(L(UI.examShort)) + '</button><button class="btn ghost" data-n="20">' + esc(L(UI.examLong)) + '</button></div></article>';
    $app.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => startExam(+b.dataset.n));
  }

  function startExam(n) {
    const qs = shuffle(EXAM).slice(0, Math.min(n, EXAM.length)).map((q) => ({ q, opts: shuffle(q.opts), chosen: null }));
    S.exam = { n: qs.length, qs, done: false };
    renderExamForm();
  }

  function renderExamForm() {
    const ex = S.exam;
    $app.innerHTML =
      '<article class="exam">' +
        '<h2>' + esc(L(UI.nav.exam)) + ' · ' + ex.n + '</h2>' +
        ex.qs.map((it, qi) => '<fieldset class="q" id="q' + qi + '"><legend><span class="qn">' + (qi + 1) + '</span>' + esc(L(it.q.q)) + '</legend>' +
          it.opts.map((o, oi) => '<button class="opt ' + (it.chosen === oi ? 'on' : '') + '" data-q="' + qi + '" data-o="' + oi + '" aria-pressed="' + (it.chosen === oi) + '">' + esc(L(o.t)) + '</button>').join('') +
        '</fieldset>').join('') +
        '<p class="warn" id="exam-warn" hidden></p>' +
        '<div class="actions"><button class="btn" data-submit>' + esc(L(UI.examSubmit)) + '</button></div>' +
      '</article>';
    $app.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => {
      const it = ex.qs[+b.dataset.q]; it.chosen = +b.dataset.o;
      const fs = b.closest('fieldset');
      fs.querySelectorAll('.opt').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    });
    $app.querySelector('[data-submit]').onclick = () => {
      const missing = ex.qs.map((it, i) => it.chosen === null ? i : -1).filter((i) => i >= 0);
      if (missing.length) {
        const w = document.getElementById('exam-warn');
        w.hidden = false; w.textContent = L(UI.examUnanswered) + ': ' + missing.map((i) => i + 1).join(', ');
        document.getElementById('q' + missing[0]).scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      let ok = 0, invalid = false;
      ex.qs.forEach((it) => { const o = it.opts[it.chosen]; if (o.ok) ok++; if (o.d) invalid = true; });
      ex.score = Math.round(100 * ok / ex.n) / 10; ex.ok = ok; ex.invalid = invalid; ex.done = true;
      recordExam(ex.n, ex.score, invalid);
      renderExamResult();
    };
  }

  function renderExamResult() {
    const ex = S.exam;
    const flag = ex.invalid ? 'red' : (ex.score >= 6 ? 'green' : 'yellow');
    const verdict = ex.invalid ? L(UI.examInvalid) : (ex.score >= 6 ? L(UI.examPass) : L(UI.examFail));
    $app.innerHTML =
      '<article class="result ' + flag + '">' +
        '<h2>' + esc(L(UI.nav.exam)) + '</h2>' +
        '<div class="score-row">' + flagHtml(flag, 'big') + '<div><p class="score">' + esc(L(UI.grade)) + ' <strong>' + fmtNum(ex.score) + '</strong> · ' + esc(verdict) + '</p><p>' + ex.ok + '/' + ex.n + '</p></div></div>' +
        (ex.invalid ? '<p class="verdict">' + esc(L(UI.examInvalidWhy)) + '</p>' : '<p class="muted small">' + esc(L(UI.examMin)) + '</p>') +
        '<div class="actions"><button class="btn" data-again>' + esc(L(UI.examAgain)) + '</button></div>' +
        ex.qs.map((it, qi) => {
          const chosen = it.opts[it.chosen]; const st = chosen.ok ? 'green' : (chosen.d ? 'red' : 'yellow');
          return '<div class="q-res ' + st + '"><p class="q-text"><span class="qn">' + (qi + 1) + '</span>' + esc(L(it.q.q)) + '</p>' +
            it.opts.map((o) => '<p class="q-opt ' + (o.ok ? 'ok' : '') + ' ' + (o === chosen ? 'chosen' : '') + '">' + (o.ok ? '✔ ' : (o === chosen ? '✘ ' : '')) + esc(L(o.t)) + (o.d && o === chosen ? ' <span class="crit">· ' + esc(L(UI.critical)) + '</span>' : '') + '</p>').join('') +
            '<p class="why">' + esc(L(it.q.expl)) + '</p></div>';
        }).join('') +
      '</article>';
    $app.querySelector('[data-again]').onclick = () => { S.exam = null; renderExamIntro(); };
  }

  /* ---------- voice (Web Speech API) ---------- */
  const voiceLang = () => (S.lang === 'va' ? 'ca-ES' : 'es-ES');
  function plainText(t) {
    return String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '').replace(/[«»"]/g, '').replace(/\n+/g, '. ');
  }
  function pickVoice(lang) {
    if (!synth) return null;
    const vs = synth.getVoices() || [];
    const norm = (v) => String(v.lang || '').replace('_', '-').toLowerCase();
    return vs.find((v) => norm(v) === lang.toLowerCase()) || vs.find((v) => norm(v).startsWith(lang.slice(0, 2).toLowerCase())) || null;
  }
  function stopSpeaking() { if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } } S.voice.speaking = -1; }
  function speak(text, idx) {
    if (!synth) { if (S.dlg) { S.dlg.error = L(UI.ttsUnavailable); renderDialogChat(); } return; }
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(plainText(text));
    u.lang = voiceLang(); const v = pickVoice(u.lang); if (v) u.voice = v;
    u.rate = 1; u.pitch = 1;
    u.onstart = () => { S.voice.speaking = idx; markSpeaking(); };
    u.onend = u.onerror = () => { if (S.voice.speaking === idx) S.voice.speaking = -1; markSpeaking(); };
    synth.speak(u);
  }
  function markSpeaking() {
    document.querySelectorAll('[data-speak]').forEach((b) => {
      const on = +b.dataset.speak === S.voice.speaking;
      b.classList.toggle('on', on);
      b.textContent = on ? '■ ' + L(UI.stopListen) : '▶ ' + L(UI.listen);
    });
  }
  function unlockSynth() { if (synth) { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ } } }
  function toggleMic() {
    const d = S.dlg; if (!d) return;
    if (S.voice.listening) { try { S.voice.rec.stop(); } catch (e) { /* ignore */ } return; }
    if (!SR) { d.error = L(UI.micUnavailable); renderDialogChat(); return; }
    stopSpeaking();
    const rec = new SR();
    rec.lang = voiceLang(); rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    const base = (d.draft || '').trim();
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      d.draft = (base ? base + ' ' : '') + t.trim();
      const inp = document.getElementById('inp'); if (inp) inp.value = d.draft;
    };
    rec.onerror = (e) => {
      S.voice.listening = false;
      const code = e && e.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') d.error = L(UI.micDenied);
      else if (code !== 'no-speech' && code !== 'aborted') d.error = L(UI.micUnavailable);
      renderDialogChat();
    };
    rec.onend = () => { S.voice.listening = false; S.voice.rec = null; renderDialogChat(); };
    S.voice.rec = rec; S.voice.listening = true; d.error = null;
    try { rec.start(); renderDialogChat(); } catch (e) { S.voice.listening = false; S.voice.rec = null; d.error = L(UI.micUnavailable); renderDialogChat(); }
  }

  /* ---------- direct API fallback (GitHub Pages / fuera del visor) ---------- */
  function apiSampleShim(key, model) {
    return async (input, opts) => {
      opts = opts || {};
      const turns = Array.isArray(input) ? input : [{ role: 'user', content: String(input) }];
      const system = turns.length > 1 ? turns[0].content : undefined;
      const messages = (turns.length > 1 ? turns.slice(1) : turns).map((t) => ({ role: t.role, content: t.content }));
      let res;
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: opts.signal,
          headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify(Object.assign({ model, max_tokens: 1500, messages }, system ? { system } : {}))
        });
      } catch (e) {
        if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'cancelled' };
        throw { code: 'upstream_error', message: String(e) };
      }
      if (!res.ok) {
        let msg = ''; try { msg = (await res.json()).error.message; } catch (e) { /* ignore */ }
        throw { code: res.status === 401 || res.status === 403 ? 'not_granted' : (res.status === 429 ? 'rate_limited' : 'upstream_error'), message: msg || String(res.status) };
      }
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      if (!text) throw { code: 'empty_completion', message: 'empty' };
      if (opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: data.stop_reason === 'max_tokens', modelTierApplied: 'default' };
    };
  }
  function applyApiKey() {
    const key = ls.get('scv-api-key'); const model = ls.get('scv-api-model') || API_DEFAULT_MODEL;
    if (key) { S.sample = apiSampleShim(key, model); S.apiMode = true; } else if (S.apiMode) { S.sample = null; S.apiMode = false; }
  }

  /* ========== DIALOGUE ========== */
  function dialogRules(c, scope) {
    const steps = buildSteps(c, scope);
    const crit = [];
    steps.forEach((st) => (st.alts || []).forEach((a) => { if (a.crit) crit.push(L(a.t)); }));
    const sceneText = (scope === 'pa' && c.scenePA) ? L(c.scenePA) : L(c.scene);
    const protocol = steps.map((st, i) => (i + 1) + '. ' + L(st.t)).join('\n');
    const nm = userName();
    if (S.lang === 'va') {
      return 'Eres el director d\'un simulacre de formació per a socorristes aquàtics (Comunitat Valenciana). Interpretes alhora la víctima, els testimonis, els companys de servei i l\'entorn. L\'alumne és el socorrista i escriu en primera persona el que fa i diu.' + (nm ? ' L\'alumne es diu ' + nm + '.' : '') + '\n\n' +
        'CAS: ' + L(c.title) + '\nVÍCTIMA: ' + L(c.victim) + '\nESCENA: ' + sceneText + '\nABAST: ' + L(scope === 'full' ? UI.scope.full : UI.scope.pa) + '\n\n' +
        'PROTOCOL DE REFERÈNCIA (temari FSSCV/RFESS; només per a tu, no el reveles):\n' + protocol + '\n\n' +
        (crit.length ? 'ACCIONS QUE CAUSEN DANY (errors crítics):\n- ' + crit.join('\n- ') + '\n\n' : '') +
        'REGLES:\n' +
        '1. Respon sempre en valencià.\n' +
        '2. Sigues realista i concret: descriu només el que el socorrista podria percebre (el que veu, sent, toca, el que diuen els testimonis, el que respon la víctima). No dones dades que no haja explorat: si pregunta si respira, descriu el que observa en mirar, escoltar i sentir.\n' +
        '3. L\'estat de la víctima evoluciona segons les accions: si omet passos clau o tarda, empitjora; si actua bé, millora o s\'estabilitza. Indica el temps transcorregut aproximat quan siga rellevant.\n' +
        '4. Si el socorrista fa alguna cosa perillosa o incorrecta, mostra la conseqüència de forma realista sense dir que és incorrecte ni corregir.\n' +
        '5. No reveles el protocol, no dones pistes, no faces llistes d\'opcions i no avalues fins que et demanen l\'AVALUACIÓ FINAL.\n' +
        '6. Respostes de 2 a 5 frases, i acaba sempre amb la pregunta «Què fas?».\n' +
        '7. Si l\'alumne escriu alguna cosa ambigua, demana concreció en una frase.\n' +
        '8. Quan reben el missatge «AVALUACIÓ FINAL», deixa el personatge i avalua com a instructor de la FSSCV: (a) accions correctes, (b) omissions, (c) errors, marcant amb «CRÍTIC» els que causarien dany a la víctima (en l\'examen invaliden la prova), (d) la seqüència de referència numerada, i (e) una nota de 0 a 10 en una última línia amb el format exacte «NOTA: X» sense text després. Si hi ha hagut errors crítics, la nota màxima és 4.';
    }
    return 'Eres el director de un simulacro de formación para socorristas acuáticos (Comunitat Valenciana). Interpretas a la vez a la víctima, a los testigos, a los compañeros de servicio y al entorno. El alumno es el socorrista y escribe en primera persona lo que hace y dice.' + (nm ? ' El alumno se llama ' + nm + '.' : '') + '\n\n' +
      'CASO: ' + L(c.title) + '\nVÍCTIMA: ' + L(c.victim) + '\nESCENA: ' + sceneText + '\nALCANCE: ' + L(scope === 'full' ? UI.scope.full : UI.scope.pa) + '\n\n' +
      'PROTOCOLO DE REFERENCIA (temario FSSCV/RFESS; solo para ti, no lo reveles):\n' + protocol + '\n\n' +
      (crit.length ? 'ACCIONES QUE CAUSAN DAÑO (errores críticos):\n- ' + crit.join('\n- ') + '\n\n' : '') +
      'REGLAS:\n' +
      '1. Responde siempre en castellano.\n' +
      '2. Sé realista y concreto: describe solo lo que el socorrista podría percibir (lo que ve, oye, toca, lo que dicen los testigos, lo que responde la víctima). No des datos que no haya explorado: si pregunta si respira, describe lo que observa al mirar, oír y sentir.\n' +
      '3. El estado de la víctima evoluciona según las acciones: si omite pasos clave o tarda, empeora; si actúa bien, mejora o se estabiliza. Indica el tiempo transcurrido aproximado cuando sea relevante.\n' +
      '4. Si el socorrista hace algo peligroso o incorrecto, muestra la consecuencia de forma realista sin decir que es incorrecto ni corregir.\n' +
      '5. No reveles el protocolo, no des pistas, no hagas listas de opciones y no evalúes hasta que te pidan la EVALUACIÓN FINAL.\n' +
      '6. Respuestas de 2 a 5 frases, y termina siempre con la pregunta «¿Qué haces?».\n' +
      '7. Si el alumno escribe algo ambiguo, pide concreción en una frase.\n' +
      '8. Cuando recibas el mensaje «EVALUACIÓN FINAL», deja el personaje y evalúa como instructor de la FSSCV: (a) acciones correctas, (b) omisiones, (c) errores, marcando con «CRÍTICO» los que causarían daño a la víctima (en el examen invalidan la prueba), (d) la secuencia de referencia numerada, y (e) una nota de 0 a 10 en una última línea con el formato exacto «NOTA: X» sin texto después. Si hubo errores críticos, la nota máxima es 4.';
  }

  function renderDialog(arg) {
    const d = S.dlg;
    if (d && (!arg || d.caseId === arg)) return renderDialogChat();
    renderDialogIntro(arg);
  }

  function renderDialogIntro(preselect) {
    const unavailable = S.sample === null && S.sampleChecked;
    const showKey = S.sampleChecked && (S.apiMode || S.sample === null);
    const keyPanel = showKey ? '<section class="api-panel"><h3>' + esc(L(UI.apiTitle)) + '</h3><p class="small">' + esc(L(UI.apiIntro)) + '</p>' +
      (S.apiMode ? '<p class="small"><strong>' + esc(L(UI.apiActive)) + '</strong> · ' + esc(ls.get('scv-api-model') || API_DEFAULT_MODEL) + '</p>' : '') +
      '<form id="api-form"><label class="field"><span>' + esc(L(UI.apiKeyLabel)) + '</span><input id="api-key" type="password" autocomplete="off" placeholder="sk-ant-…"></label>' +
      '<label class="field"><span>' + esc(L(UI.apiModelLabel)) + '</span><input id="api-model" type="text" value="' + esc(ls.get('scv-api-model') || API_DEFAULT_MODEL) + '"></label>' +
      '<div class="actions"><button type="submit" class="btn small">' + esc(L(UI.apiSave)) + '</button>' + (S.apiMode ? '<button type="button" class="btn small ghost danger" data-api-clear>' + esc(L(UI.apiClear)) + '</button>' : '') + '</div></form>' +
      '<p class="small muted">' + esc(L(UI.apiWarn)) + '</p></section>' : '';
    const options = CASES.map((c) => '<option value="' + c.id + '" ' + (preselect === c.id ? 'selected' : '') + '>' + esc(L(UI.env[c.env])) + ' · ' + esc(L(c.title)) + '</option>').join('');
    $app.innerHTML =
      '<article class="intro"><h2>' + esc(L(UI.nav.dialog)) + '</h2><p>' + esc(L(UI.dialogIntro)) + '</p>' +
      (unavailable && !HAS_RUNTIME ? '' : (unavailable ? '<p class="warn">' + esc(L(UI.dialogUnavailable)) + '</p>' : '')) +
      keyPanel +
      '<label class="field"><span>' + esc(L(UI.nav.cases)) + '</span><select id="dlg-case">' + options + '</select></label>' +
      '<div class="scope" id="dlg-scope"></div>' +
      (S.apiMode || !HAS_RUNTIME ? '' : '<p class="muted small">' + esc(L(UI.dialogConsent)) + '</p>') +
      '<div class="actions"><button class="btn" data-start ' + (unavailable ? 'disabled' : '') + '>' + esc(L(UI.dialogStart)) + '</button></div></article>';
    const af = document.getElementById('api-form');
    if (af) {
      af.onsubmit = (e) => { e.preventDefault(); const k = document.getElementById('api-key').value.trim(); const m = document.getElementById('api-model').value.trim() || API_DEFAULT_MODEL; if (k) ls.set('scv-api-key', k); ls.set('scv-api-model', m); applyApiKey(); renderDialogIntro(preselect); };
      const cl = af.querySelector('[data-api-clear]'); if (cl) cl.onclick = () => { ls.del('scv-api-key'); applyApiKey(); renderDialogIntro(preselect); };
    }
    const sel = document.getElementById('dlg-case');
    const scopeBox = document.getElementById('dlg-scope');
    let scope = 'pa';
    const drawScope = () => {
      const c = caseById(sel.value);
      if (c.rescue) {
        scope = 'full';
        scopeBox.innerHTML = '<button class="btn small on" data-s="full">' + esc(L(UI.scope.full)) + '</button><button class="btn small ghost" data-s="pa">' + esc(L(UI.scope.pa)) + '</button>';
        scopeBox.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { scope = b.dataset.s; scopeBox.querySelectorAll('[data-s]').forEach((x) => { x.classList.toggle('ghost', x !== b); x.classList.toggle('on', x === b); }); });
      } else { scope = 'pa'; scopeBox.innerHTML = ''; }
    };
    sel.onchange = drawScope; drawScope();
    $app.querySelector('[data-start]').onclick = () => startDialog(sel.value, scope);
  }

  function startDialog(caseId, scope) {
    const c = caseById(caseId);
    const sceneText = (scope === 'pa' && c.scenePA) ? L(c.scenePA) : L(c.scene);
    S.dlg = { caseId, scope, lang: S.lang, rules: dialogRules(c, scope), turns: [], messages: [{ role: 'director', text: sceneText + '\n\n' + (S.lang === 'va' ? 'Què fas?' : '¿Qué haces?') }], busy: false, ctl: null, evaluated: false, error: null, draft: '' };
    go('dialog/' + caseId);
  }

  function renderDialogChat() {
    const d = S.dlg; const c = caseById(d.caseId);
    const speakBtn = (i) => synth ? '<button type="button" class="speak ' + (S.voice.speaking === i ? 'on' : '') + '" data-speak="' + i + '">' + (S.voice.speaking === i ? '■ ' + esc(L(UI.stopListen)) : '▶ ' + esc(L(UI.listen))) + '</button>' : '';
    const msgs = d.messages.map((m, i) => '<div class="msg ' + m.role + '">' + (m.role === 'director' ? '<span class="who">' + (S.lang === 'va' ? 'Simulacre' : 'Simulacro') + '</span>' : (m.role === 'eval' ? '<span class="who">' + (S.lang === 'va' ? 'Avaluació' : 'Evaluación') + '</span>' : '')) + '<div class="bubble">' + md(m.text) + (m.role !== 'user' ? speakBtn(i) : '') + '</div></div>').join('');
    const voiceToggle = synth ? '<label class="switch"><input type="checkbox" data-voice-auto ' + (S.voice.auto ? 'checked' : '') + '><span>' + esc(L(UI.voiceAuto)) + '</span></label>' : '';
    $app.innerHTML =
      '<a class="back" href="#dialog" data-exit>← ' + esc(L(UI.nav.dialog)) + '</a>' +
      '<article class="chat">' +
        '<div class="meta"><span>' + esc(L(UI.env[c.env])) + '</span><span>' + esc(L(c.title)) + '</span><span class="pill">' + esc(L(d.scope === 'full' ? UI.scope.full : UI.scope.pa)) + '</span></div>' +
        voiceToggle +
        '<div class="messages" id="msgs">' + msgs + (d.busy ? '<div class="msg director streaming"><span class="who">' + (S.lang === 'va' ? 'Simulacre' : 'Simulacro') + '</span><div class="bubble" id="stream">' + esc(L(UI.dialogThinking)) + '</div></div>' : '') + '</div>' +
        (d.error ? '<p class="warn">' + esc(d.error) + '</p>' : '') +
        (d.evaluated ? '<div class="actions"><button class="btn" data-new>' + esc(L(UI.dialogNew)) + '</button><a class="btn ghost" href="#case/' + c.id + '">' + esc(L(UI.nav.cases)) + '</a></div>' :
          '<form class="composer" id="composer"><textarea id="inp" rows="2" placeholder="' + esc(L(UI.dialogPlaceholder)) + '" ' + (d.busy ? 'disabled' : '') + '>' + esc(d.draft || '') + '</textarea>' +
          '<div class="composer-actions">' +
            (d.busy ? '<button type="button" class="btn ghost" data-stop>' + esc(L(UI.dialogStop)) + '</button>' :
              '<button type="button" class="btn mic ' + (S.voice.listening ? 'listening' : '') + '" data-mic aria-pressed="' + S.voice.listening + '">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4zm6-4a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-3.1A8 8 0 0 0 20 11h-2z" fill="currentColor"/></svg> ' +
                esc(S.voice.listening ? L(UI.micListening) : L(UI.mic)) + '</button>' +
              '<button type="submit" class="btn">' + esc(L(UI.dialogSend)) + '</button><button type="button" class="btn ghost" data-eval ' + (d.turns.length ? '' : 'disabled') + '>' + esc(L(UI.dialogEval)) + '</button>') +
          '</div></form>') +
      '</article>';
    const box = document.getElementById('msgs'); box.scrollTop = box.scrollHeight;
    const form = document.getElementById('composer');
    if (form) {
      const inp = document.getElementById('inp');
      inp.oninput = () => { d.draft = inp.value; };
      form.onsubmit = (e) => { e.preventDefault(); const v = inp.value.trim(); if (v) { d.draft = ''; send(v); } };
      inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } };
      const mic = form.querySelector('[data-mic]'); if (mic) mic.onclick = toggleMic;
      const ev = form.querySelector('[data-eval]'); if (ev) ev.onclick = () => evaluate();
      const st = form.querySelector('[data-stop]'); if (st) st.onclick = () => { if (d.ctl) d.ctl.abort(); };
      if (!d.busy) inp.focus();
    }
    $app.querySelectorAll('[data-speak]').forEach((b) => b.onclick = () => { const i = +b.dataset.speak; if (S.voice.speaking === i) stopSpeaking(), markSpeaking(); else speak(d.messages[i].text, i); });
    const vt = $app.querySelector('[data-voice-auto]'); if (vt) vt.onchange = () => { S.voice.auto = vt.checked; ls.set('scv-voice', vt.checked ? '1' : '0'); if (vt.checked) unlockSynth(); else stopSpeaking(); };
    const nb = $app.querySelector('[data-new]'); if (nb) nb.onclick = () => { stopSpeaking(); S.dlg = null; go('dialog'); };
    const ex = $app.querySelector('[data-exit]'); if (ex) ex.onclick = () => { stopSpeaking(); if (S.voice.rec) { try { S.voice.rec.abort(); } catch (e) { /* ignore */ } } if (d.ctl) d.ctl.abort(); S.dlg = null; };
  }

  function errCopy(e) {
    const code = e && e.code;
    if (code === 'rate_limited') return L(UI.errRate);
    if (code === 'not_granted' && S.apiMode) return L(UI.errApiKey);
    if (code === 'not_granted' || code === 'sampling_disabled' || code === 'capability_disabled' || code === 'not_declared') return L(UI.errDenied);
    return L(UI.errGeneric);
  }

  async function callSample(userText, modelTier) {
    const d = S.dlg;
    const input = [{ role: 'user', content: d.rules }].concat(d.turns.slice(-40), [{ role: 'user', content: userText }]);
    d.ctl = new AbortController(); d.busy = true; d.error = null;
    renderDialogChat();
    let text = '';
    try {
      const res = await S.sample(input, {
        cache: false, modelTier: modelTier || 'default', signal: d.ctl.signal,
        onText: ({ text: t }) => { text = t; const el = document.getElementById('stream'); if (el) { el.innerHTML = md(t); const box = document.getElementById('msgs'); box.scrollTop = box.scrollHeight; } }
      });
      text = res.text;
      return text;
    } catch (e) {
      if (e && e.code === 'cancelled') { return e.text || null; }
      d.error = errCopy(e);
      return e && e.text ? e.text : null;
    } finally { d.busy = false; d.ctl = null; }
  }

  async function send(text) {
    const d = S.dlg;
    stopSpeaking();
    d.messages.push({ role: 'user', text });
    d.turns.push({ role: 'user', content: text });
    const reply = await callSample(text, 'default');
    if (reply) { d.messages.push({ role: 'director', text: reply }); d.turns.push({ role: 'assistant', content: reply }); }
    else { d.turns.pop(); d.messages.pop(); }
    renderDialogChat();
    if (reply && S.voice.auto) speak(reply, d.messages.length - 1);
  }

  async function evaluate() {
    const d = S.dlg;
    const ask = S.lang === 'va' ? 'AVALUACIÓ FINAL' : 'EVALUACIÓN FINAL';
    d.messages.push({ role: 'user', text: ask });
    const reply = await callSample(ask, 'default');
    if (reply) {
      d.messages.push({ role: 'eval', text: reply }); d.evaluated = true;
      const m = reply.match(/NOTA:\s*(\d+(?:[.,]\d+)?)/i);
      recordDialog(d.caseId, m ? parseFloat(m[1].replace(',', '.')) : undefined);
    } else { d.messages.pop(); }
    renderDialogChat();
    if (reply && S.voice.auto) speak(reply, d.messages.length - 1);
  }

  /* ========== PROGRESS ========== */
  function renderProgress() {
    const p = S.progress;
    const caseIds = Object.keys(p.cases);
    const done = caseIds.filter((id) => caseById(id));
    const avg = done.length ? done.reduce((a, id) => a + (p.cases[id].best || 0), 0) / done.length : 0;
    const nDialogs = Object.values(p.dialogs).reduce((a, b) => a + b, 0);
    const crits = [];
    done.forEach((id) => (p.cases[id].critical || []).forEach((t) => crits.push({ id, t })));
    const byEnv = ENV_ORDER.map((env) => {
      const cs = CASES.filter((c) => c.env === env);
      return '<div class="env-row"><h3>' + esc(L(UI.env[env])) + '</h3>' + cs.map((c) => {
        const pr = p.cases[c.id];
        return '<a class="mini" href="#case/' + c.id + '">' + flagHtml(pr ? (pr.lastFlag || 'green') : 'none') + '<span>' + esc(L(c.title)) + '</span><strong>' + (pr ? fmtNum(pr.best) : '—') + '</strong></a>';
      }).join('') + '</div>';
    }).join('');
    const games = Object.keys(p.games || {}).map((id) => ({ id, g: p.games[id] })).filter((x) => x.g);
    const gamesHtml = games.length ? '<h3>' + esc(L(UI.nav.game)) + '</h3>' + games.map((x) => { const sc = GAME.scenario(x.id); const c = sc ? caseById(sc.caseId) : null; return c ? '<a class="mini" href="#game/' + x.id + '">' + flagHtml(x.g.lastFlag || 'green') + '<span>' + esc(L(c.title)) + '</span><strong>' + fmtNum(x.g.best) + '</strong></a>' : ''; }).join('') : '';
    games.forEach((x) => (x.g.critical || []).forEach((t) => crits.push({ id: null, gid: x.id, t })));
    const exams = p.exams.slice().reverse().slice(0, 10).map((e) => '<li>' + flagHtml(e.invalid ? 'red' : (e.score >= 6 ? 'green' : 'yellow')) + '<span>' + fmtDate(e.at) + ' · ' + e.n + ' ' + (S.lang === 'va' ? 'preguntes' : 'preguntas') + '</span><strong>' + fmtNum(e.score) + (e.invalid ? ' · ' + esc(L(UI.invalidTag)) : '') + '</strong></li>').join('');
    const empty = !done.length && !p.exams.length && !nDialogs;
    $app.innerHTML =
      '<article class="progress">' +
        '<div class="who-row">' + (S.avatarUrl ? '<img class="avatar" src="' + esc(S.avatarUrl) + '" alt="">' : '') + '<h2>' + esc(userName() ? L(UI.progressOf) + ' ' + userName() : L(UI.nav.progress)) + '</h2></div>' +
        '<p class="muted small">' + esc(L(S.storageMode === 'cloud' ? UI.progressIntro : UI.progressLocal)) + '</p>' +
        '<form class="name-form" id="name-form"><label><span>' + esc(L(UI.nameLabel)) + '</span><input id="name-inp" type="text" maxlength="40" value="' + esc(S.progress.name || '') + '" placeholder="' + esc(S.accountName || L(UI.namePlaceholder)) + '"></label><button type="submit" class="btn small">' + esc(L(UI.nameSave)) + '</button></form>' +
        (empty ? '<p class="empty">' + esc(L(UI.empty)) + '</p>' : '') +
        '<div class="stats"><div><strong>' + done.length + '/' + CASES.length + '</strong><span>' + esc(L(UI.casesDone)) + '</span></div><div><strong>' + fmtNum(avg) + '</strong><span>' + esc(L(UI.avg)) + '</span></div><div><strong>' + p.exams.length + '</strong><span>' + esc(L(UI.examsDone)) + '</span></div><div><strong>' + nDialogs + '</strong><span>' + esc(L(UI.dialogsDone)) + '</span></div></div>' +
        byEnv +
        gamesHtml +
        (exams ? '<h3>' + esc(L(UI.lastExams)) + '</h3><ul class="exam-list">' + exams + '</ul>' : '') +
        '<h3>' + esc(L(UI.weak)) + '</h3>' + (crits.length ? '<ul class="weak">' + crits.map((x) => { const c = x.id ? caseById(x.id) : caseById(GAME.scenario(x.gid).caseId); return '<li>' + flagHtml('red') + '<span><em>' + esc(L(c.title)) + (x.gid ? ' · ' + esc(L(UI.nav.game)) : '') + '</em><br>' + esc(x.t) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">' + esc(L(UI.noWeak)) + '</p>') +
        '<div class="actions"><button class="btn ghost" data-export>' + esc(L(UI.exportProgress)) + '</button><label class="btn ghost file-btn">' + esc(L(UI.importProgress)) + '<input type="file" accept="application/json,.json" data-import hidden></label><button class="btn ghost danger" data-reset>' + esc(L(UI.reset)) + '</button></div>' +
        '<p class="warn" id="import-warn" hidden></p>' +
      '</article>';
    $app.querySelector('[data-export]').onclick = () => {
      const blob = new Blob([JSON.stringify(S.progress, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'socorrista-progreso.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    $app.querySelector('[data-import]').onchange = (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(r.result);
          if (!obj || typeof obj !== 'object' || !obj.cases) throw new Error('bad');
          S.progress = Object.assign(emptyProgress(), obj); saveProgress(); renderTop(); renderProgress();
        } catch (err) { const w = document.getElementById('import-warn'); w.hidden = false; w.textContent = L(UI.importBad); }
      };
      r.readAsText(f);
    };
    $app.querySelector('[data-reset]').onclick = () => { if (confirm(L(UI.resetConfirm))) { S.progress = emptyProgress(); saveProgress(); renderProgress(); } };
    document.getElementById('name-form').onsubmit = (e) => { e.preventDefault(); const v = document.getElementById('name-inp').value.trim(); S.progress.name = v; saveProgress(); renderTop(); renderProgress(); };
  }

  /* ---------- game ---------- */
  const GAME = createGame({
    L, esc, UI, CASES, T, lang: () => S.lang, go,
    flagHtml: (f, c) => flagHtml(f, c),
    record: recordGame,
    progress: () => S.progress
  });

  window.__scvGame = GAME;

  /* ---------- boot ---------- */
  function boot() {
    S.lang = (ls.get('scv-lang') === 'va') ? 'va' : 'es';
    document.documentElement.lang = S.lang === 'va' ? 'ca' : 'es';
    const th = ls.get('scv-theme'); if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th);
    S.progress = loadLocal() || emptyProgress();
    S.voice.auto = ls.get('scv-voice') === '1';
    if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = () => {};
    render();
    initProgress();
    if (HAS_RUNTIME) {
      window.claude.use('sample').then((fn) => { S.sample = fn; S.sampleChecked = true; if (!fn) applyApiKey(); if (route().view === 'dialog' && !S.dlg) render(); }).catch(() => { S.sampleChecked = true; applyApiKey(); });
    } else { S.sampleChecked = true; applyApiKey(); if (route().view === 'dialog') render(); }
  }
  boot();
})();
