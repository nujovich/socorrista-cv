const fs = require('fs');
const src = ['content-shared.js','content-cases.js','content-exam.js'].map(f=>fs.readFileSync(require('path').join(__dirname,'..','src',f),'utf8')).join('\n');
const sandbox = {};
const fn = new Function(src + '\nreturn {T, UI, STEP, CASES, EXAM};');
const {UI, STEP, CASES, EXAM} = fn();
let errors = [];
function checkT(o, path){
  if (!o || typeof o !== 'object' || !('es' in o)) { errors.push('not T at '+path); return; }
  if (!o.es || !o.va) errors.push('missing es/va at '+path);
  if (o.es === o.va) errors.push('es===va at '+path+': '+o.es.slice(0,40));
}
function walkUI(o, path){ for (const k in o){ const v=o[k]; if (v && typeof v==='object' && 'es' in v) checkT(v, path+'.'+k); else if (v && typeof v==='object') walkUI(v, path+'.'+k);} }
walkUI(UI,'UI');
const ids = new Set();
let nSteps=0, nAlts=0, nCrit=0;
for (const c of CASES){
  if (ids.has(c.id)) errors.push('dup id '+c.id); ids.add(c.id);
  checkT(c.title, c.id+'.title'); checkT(c.victim, c.id+'.victim'); checkT(c.scene, c.id+'.scene');
  if (c.scenePA) checkT(c.scenePA, c.id+'.scenePA');
  if (c.rescue && !c.scenePA) errors.push(c.id+' has rescue but no scenePA');
  (c.notes||[]).forEach((n,i)=>checkT(n, c.id+'.notes'+i));
  for (const phase of ['rescue','paPrefix','pa']){
    (c[phase]||[]).forEach((s,i)=>{
      nSteps++;
      checkT(s.t, c.id+'.'+phase+i+'.t'); checkT(s.why, c.id+'.'+phase+i+'.why');
      if (!s.ref) errors.push('no ref '+c.id+'.'+phase+i);
      if (!s.alts || !s.alts.length) errors.push('no alts '+c.id+'.'+phase+i);
      (s.alts||[]).forEach((a,j)=>{ nAlts++; if (a.crit) nCrit++; checkT(a.t, c.id+'.'+phase+i+'.alt'+j+'.t'); checkT(a.why, c.id+'.'+phase+i+'.alt'+j+'.why'); });
    });
  }
  if (!c.pa || !c.pa.length) errors.push('no pa '+c.id);
}
let nDanger=0;
EXAM.forEach((q,i)=>{
  checkT(q.q,'Q'+i+'.q'); checkT(q.expl,'Q'+i+'.expl');
  if (q.opts.length!==4) errors.push('Q'+i+' has '+q.opts.length+' opts');
  const ok = q.opts.filter(o=>o.ok).length; if (ok!==1) errors.push('Q'+i+' ok count '+ok);
  q.opts.forEach((o,j)=>{ checkT(o.t,'Q'+i+'.opt'+j); if (o.ok && o.d) errors.push('Q'+i+' ok&d'); if (o.d) nDanger++; });
});
console.log('cases', CASES.length, 'steps', nSteps, 'alts', nAlts, 'crit alts', nCrit, 'questions', EXAM.length, 'danger opts', nDanger);
console.log(errors.length ? errors : 'NO ERRORS');
