/* PipEI · Levantamiento en terreno — LukeAPP
   Flujo: identificarse → elegir departamento → responder.
   Offline-first: se escribe primero en el dispositivo y se sincroniza al haber señal. */

'use strict';

const KEY = 'pipei.levantamiento.v1';
let store = cargar();
let vistaActual = 'ident';
let deptActual = null;

function base() {
  return { entrevistador: '', cargo: '', proyecto: '', entrevistados: {},
           respuestas: {}, hallazgos: '', inicio: new Date().toISOString(), sincronizado: null };
}
function cargar() {
  try { return Object.assign(base(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { return base(); }
}
function guardar() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); marcarSync('pend'); }
  catch (e) { toast('No se pudo guardar. Revisa el espacio del dispositivo.'); }
}

const idPregunta = (dep, gi, pi) => `${dep}.${gi}.${pi}`;
const $ = s => document.querySelector(s);

function todasLasPreguntas() {
  const out = [];
  DEPARTAMENTOS.forEach(d => d.grupos.forEach((g, gi) => g.preguntas.forEach((p, pi) =>
    out.push({ id: idPregunta(d.id, gi, pi), dep: d, grupo: g, p }))));
  return out;
}
function respondida(id) {
  const r = store.respuestas[id];
  return !!(r && ((r.texto && r.texto.trim()) || r.opcion || (r.audios && r.audios.length)));
}
let mapaNumeros = null;
function numeroGlobal(id) {
  if (!mapaNumeros) { mapaNumeros = {}; todasLasPreguntas().forEach((x, i) => mapaNumeros[x.id] = i + 1); }
  return mapaNumeros[id];
}
function identificado() {
  return !!(store.entrevistador || '').trim();
}

/* ══════════════ audio local ══════════════ */
let db = null;
function abrirDB() {
  return new Promise(res => {
    const rq = indexedDB.open('pipei-audio', 1);
    rq.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('clips')) d.createObjectStore('clips', { keyPath: 'id' });
    };
    rq.onsuccess = e => { db = e.target.result; res(db); };
    rq.onerror = () => res(null);
  });
}
async function guardarClip(id, blob, preguntaId) {
  if (!db) await abrirDB(); if (!db) return;
  db.transaction('clips', 'readwrite').objectStore('clips')
    .put({ id, blob, preguntaId, fecha: new Date().toISOString(), subido: false });
}
async function leerClip(id) {
  if (!db) await abrirDB(); if (!db) return null;
  return new Promise(res => {
    const rq = db.transaction('clips').objectStore('clips').get(id);
    rq.onsuccess = () => res(rq.result ? rq.result.blob : null);
    rq.onerror = () => res(null);
  });
}
async function borrarClip(id) {
  if (!db) await abrirDB();
  if (db) db.transaction('clips', 'readwrite').objectStore('clips').delete(id);
}

/* ══════════════ leer en voz alta ══════════════ */
let vozES = null;
function elegirVoz() {
  const vs = speechSynthesis.getVoices();
  vozES = vs.find(v => /es[-_]CL/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }

let leyendo = null;
function leer(texto, btn) {
  if (!('speechSynthesis' in window)) { toast('Este navegador no puede leer en voz alta'); return; }
  if (leyendo === btn) { speechSynthesis.cancel(); marcarLectura(null); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'es-CL'; u.rate = 0.95;
  if (vozES) u.voice = vozES;
  u.onend = u.onerror = () => marcarLectura(null);
  marcarLectura(btn);
  speechSynthesis.speak(u);
}
function marcarLectura(btn) {
  document.querySelectorAll('.q-speak.on, #btnReadAll.on').forEach(b => b.classList.remove('on'));
  leyendo = btn; if (btn) btn.classList.add('on');
}

/* ══════════════ dictar y grabar ══════════════ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let grabando = null;

async function alternarGrabacion(preguntaId, textarea, btn, statusEl) {
  if (grabando) { const era = grabando.id; detener(); if (era === preguntaId) return; }

  let media = null; const chunks = [];
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    media = new MediaRecorder(stream);
    media.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    media.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: media.mimeType || 'audio/webm' });
      const clipId = `${preguntaId}__${Date.now()}`;
      await guardarClip(clipId, blob, preguntaId);
      const r = store.respuestas[preguntaId] || (store.respuestas[preguntaId] = {});
      (r.audios = r.audios || []).push({ id: clipId });
      guardar(); pintarClips(preguntaId); pintarProgreso();
      // transcripción por IA cuando esté configurada y haya señal
      if (Sync.hayTranscripcionIA && navigator.onLine && textarea) {
        statusEl.textContent = 'Transcribiendo…'; statusEl.classList.add('live');
        try {
          const t = await Sync.transcribir(blob);
          if (t) {
            textarea.value = (textarea.value ? textarea.value.trim() + '\n' : '') + t.trim();
            guardarTexto(preguntaId, textarea.value);
          }
          statusEl.textContent = t ? 'Transcrito' : '';
        } catch (e) { statusEl.textContent = 'Se transcribirá después'; }
        statusEl.classList.remove('live');
        setTimeout(() => { statusEl.textContent = ''; }, 4000);
      }
    };
    media.start();
  } catch (e) { toast('Sin acceso al micrófono. Puedes escribir la respuesta.'); return; }

  // dictado del navegador como apoyo en vivo
  let rec = null; const previo = textarea ? textarea.value : '';
  if (SR && textarea && !Sync.hayTranscripcionIA) {
    rec = new SR(); rec.lang = 'es-CL'; rec.continuous = true; rec.interimResults = true;
    let firme = '';
    rec.onresult = ev => {
      let inter = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) firme += t + ' '; else inter += t;
      }
      textarea.value = (previo ? previo + '\n' : '') + firme + inter;
    };
    rec.onerror = () => {};
    rec.onend = () => { if (grabando && grabando.id === preguntaId) { try { rec.start(); } catch (e) {} } };
    try { rec.start(); } catch (e) { rec = null; }
  }

  grabando = { id: preguntaId, rec, media, txt: textarea };
  btn.classList.add('on'); btn.textContent = '⏹ Detener';
  statusEl.textContent = Sync.hayTranscripcionIA ? 'Grabando…'
                       : (SR ? 'Grabando y transcribiendo…' : 'Grabando…');
  statusEl.classList.add('live');
}

function detener() {
  if (!grabando) return;
  const g = grabando; grabando = null;
  if (g.rec) { try { g.rec.onend = null; g.rec.stop(); } catch (e) {} }
  if (g.media && g.media.state !== 'inactive') { try { g.media.stop(); } catch (e) {} }
  if (g.txt) guardarTexto(g.id, g.txt.value);
  document.querySelectorAll('.btn.rec.on').forEach(b => { b.classList.remove('on'); b.textContent = '🎤 Grabar'; });
  document.querySelectorAll('.rec-status.live').forEach(s => { s.classList.remove('live'); s.textContent = ''; });
}

function guardarTexto(id, v) {
  if (id === 'hallazgos') store.hallazgos = v;
  else (store.respuestas[id] = store.respuestas[id] || {}).texto = v;
  guardar(); pintarProgreso();
}

/* ══════════════ 1 · identificación ══════════════ */
function pintarIdent() {
  $('#entrevistador').value = store.entrevistador || '';
  $('#cargo').value = store.cargo || '';

  // selector de proyecto
  let listaProyectos = PROYECTOS;
  try {
    const cached = localStorage.getItem('pipei.proyectos_cache');
    if (cached) listaProyectos = JSON.parse(cached);
  } catch (e) {}

  if (!$('#proyecto')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label for="proyecto">Proyecto <span class="req">*</span></label>
      <select id="proyecto" style="width:100%;height:var(--tap);border:1px solid var(--line);
        border-radius:12px;padding:0 12px;font-size:16px;background:#fff;font-family:inherit">
        <option value="">Selecciona…</option>
        ${listaProyectos.map(p => `<option>${p}</option>`).join('')}
      </select>`;
    $('#cargo').closest('.form-block').appendChild(wrap);
    $('#proyecto').onchange = e => { store.proyecto = e.target.value; guardar(); revisarGate(); };
  }
  $('#proyecto').value = store.proyecto || '';

  if (typeof Sync !== 'undefined' && Sync.obtenerProyectos) {
    Sync.obtenerProyectos().then(proys => {
      if (proys && proys.length) {
        localStorage.setItem('pipei.proyectos_cache', JSON.stringify(proys));
        const select = $('#proyecto');
        if (select) {
          const valActual = select.value;
          select.innerHTML = `<option value="">Selecciona…</option>` +
            proys.map(p => `<option>${p}</option>`).join('');
          if (valActual) select.value = valActual;
        }
      }
    }).catch(() => {});
  }


  const grid = $('#deptGrid');
  grid.innerHTML = '';
  DEPARTAMENTOS.forEach(d => {
    const ids = [];
    d.grupos.forEach((g, gi) => g.preguntas.forEach((_, pi) => ids.push(idPregunta(d.id, gi, pi))));
    const hechas = ids.filter(respondida).length;
    const b = document.createElement('button');
    b.className = 'dept' + (hechas === ids.length && hechas ? ' done' : '');
    b.innerHTML = `<div class="ico">${d.icono}</div>
      <div class="info">
        <div class="nm">${d.nombre}${d.prioridad ? '<span class="prio">prioridad</span>' : ''}</div>
        <div class="dsc">${ids.length} preguntas</div>
      </div>
      <div class="cnt">${hechas}/${ids.length}</div>`;
    b.onclick = () => irDept(d.id);
    grid.appendChild(b);
  });
  revisarGate();
  pintarProgreso();
}

function revisarGate() {
  const ok = identificado() && (store.proyecto || '').trim();
  $('#deptGrid').classList.toggle('locked', !ok);
  const h = $('#identHint');
  h.classList.toggle('hidden', !!ok);
  if (!ok) h.textContent = !identificado()
    ? 'Escribe tu nombre para continuar.'
    : 'Selecciona el proyecto para continuar.';
}

function pintarProgreso() {
  const t = todasLasPreguntas();
  const n = t.filter(x => respondida(x.id)).length;
  const f = $('#pgFill'), x = $('#pgText');
  if (f) f.style.width = (t.length ? Math.round(n / t.length * 100) : 0) + '%';
  if (x) x.textContent = `${n} de ${t.length} respondidas`;
  if (vistaActual === 'ident') {
    document.querySelectorAll('.dept').forEach((el, i) => {
      const d = DEPARTAMENTOS[i]; if (!d) return;
      const ids = [];
      d.grupos.forEach((g, gi) => g.preguntas.forEach((_, pi) => ids.push(idPregunta(d.id, gi, pi))));
      const h = ids.filter(respondida).length;
      el.querySelector('.cnt').textContent = `${h}/${ids.length}`;
      el.classList.toggle('done', h === ids.length && h > 0);
    });
  }
  if (vistaActual === 'dept' && deptActual) {
    const ids = [];
    deptActual.grupos.forEach((g, gi) => g.preguntas.forEach((_, pi) => ids.push(idPregunta(deptActual.id, gi, pi))));
    const h = ids.filter(respondida).length;
    $('#deptProg').textContent = `${h} de ${ids.length}`;
  }
}

/* ══════════════ 2 · conversación ══════════════ */
function pintarDept(depId) {
  const d = DEPARTAMENTOS.find(x => x.id === depId);
  deptActual = d;
  $('#deptTitle').textContent = d.nombre;
  $('#deptGoal').textContent = d.objetivo;
  $('#ctxLabel').textContent = (store.proyecto ? store.proyecto.split('·')[0].trim() + ' · ' : '') + d.nombre;
  const ent = $('#entrevistado');
  ent.value = store.entrevistados[d.id] || '';
  ent.oninput = e => { store.entrevistados[d.id] = e.target.value; guardar(); };

  const cont = $('#qList');
  cont.innerHTML = '';
  d.grupos.forEach((g, gi) => {
    const h = document.createElement('h2');
    h.className = 'section-title'; h.textContent = g.titulo;
    cont.appendChild(h);
    if (g.nota) {
      const nb = document.createElement('p');
      nb.className = 'goal'; nb.textContent = g.nota;
      cont.appendChild(nb);
    }
    g.preguntas.forEach((p, pi) => cont.appendChild(tarjeta(d, gi, pi, p)));
  });
  pintarProgreso();
}

function tarjeta(d, gi, pi, p) {
  const id = idPregunta(d.id, gi, pi);
  const r = store.respuestas[id] || {};
  const el = document.createElement('article');
  el.className = 'q-card' + (respondida(id) ? ' answered' : '');

  const head = document.createElement('div');
  head.className = 'q-head';
  head.innerHTML = `<div class="q-num">${numeroGlobal(id)}</div><div class="q-text">${p.q}</div>`;
  const spk = document.createElement('button');
  spk.className = 'q-speak'; spk.type = 'button'; spk.textContent = '🔊';
  spk.title = 'Leer en voz alta';
  spk.onclick = () => leer(p.q, spk);
  head.appendChild(spk);
  el.appendChild(head);

  if (p.n) {
    const nn = document.createElement('div');
    nn.className = 'q-note'; nn.textContent = p.n;
    el.appendChild(nn);
  }

  const body = document.createElement('div');
  body.className = 'q-body';

  if (p.t === 'opcion') {
    const box = document.createElement('div');
    box.className = 'opts';
    p.o.forEach(op => {
      const lab = document.createElement('label');
      lab.className = 'opt' + (r.opcion === op ? ' sel' : '');
      lab.innerHTML = `<input type="radio" name="${id}" ${r.opcion === op ? 'checked' : ''}><span>${op}</span>`;
      lab.querySelector('input').onchange = () => {
        (store.respuestas[id] = store.respuestas[id] || {}).opcion = op;
        guardar();
        box.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
        lab.classList.add('sel');
        el.classList.add('answered');
        pintarProgreso();
      };
      box.appendChild(lab);
    });
    body.appendChild(box);
  }

  const ta = document.createElement('textarea');
  ta.className = 'answer';
  ta.placeholder = p.t === 'opcion' ? 'Detalle, si lo hay…' : 'Escribe o dicta la respuesta…';
  ta.value = r.texto || '';
  ta.oninput = () => { guardarTexto(id, ta.value); el.classList.toggle('answered', respondida(id)); };
  body.appendChild(ta);

  const row = document.createElement('div');
  row.className = 'rec-row';
  const rec = document.createElement('button');
  rec.className = 'btn rec'; rec.type = 'button'; rec.textContent = '🎤 Grabar';
  const st = document.createElement('span'); st.className = 'rec-status';
  rec.onclick = () => alternarGrabacion(id, ta, rec, st);
  row.appendChild(rec); row.appendChild(st);
  body.appendChild(row);

  const clips = document.createElement('div');
  clips.className = 'clips'; clips.dataset.clips = id;
  body.appendChild(clips);

  el.appendChild(body);
  setTimeout(() => pintarClips(id), 0);
  return el;
}

async function pintarClips(preguntaId) {
  const cont = document.querySelector(`[data-clips="${preguntaId}"]`);
  if (!cont) return;
  const r = store.respuestas[preguntaId] || {};
  cont.innerHTML = '';
  for (const c of (r.audios || [])) {
    const blob = await leerClip(c.id);
    if (!blob) continue;
    const div = document.createElement('div');
    div.className = 'clip';
    const au = document.createElement('audio');
    au.controls = true; au.src = URL.createObjectURL(blob);
    const del = document.createElement('button');
    del.textContent = '✕'; del.title = 'Eliminar';
    del.onclick = async () => {
      await borrarClip(c.id);
      r.audios = r.audios.filter(a => a.id !== c.id);
      guardar(); pintarClips(preguntaId); pintarProgreso();
    };
    div.appendChild(au); div.appendChild(del);
    cont.appendChild(div);
  }
}

/* ══════════════ navegación ══════════════ */
function mostrar(v) {
  vistaActual = v;
  detener();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  ['viewIdent', 'viewDept', 'viewHallazgos'].forEach(x => $('#' + x).classList.add('hidden'));
  $('#view' + v.charAt(0).toUpperCase() + v.slice(1)).classList.remove('hidden');
  $('#btnBack').classList.toggle('hidden', v === 'ident');
  if (v === 'ident') { $('#ctxLabel').textContent = 'Especificación Funcional'; pintarIdent(); }
  window.scrollTo(0, 0);
}
function irDept(id) { pintarDept(id); mostrar('dept'); }

/* ══════════════ sincronización ══════════════ */
function marcarSync(estado) {
  const d = $('#syncDot'); if (!d) return;
  d.className = 'sync-dot ' + estado;
  d.title = estado === 'ok' ? 'Sincronizado'
          : estado === 'pend' ? 'Cambios sin sincronizar' : 'Sin conexión';
}
async function sincronizar(silencioso) {
  if (!Sync.activo) { if (!silencioso) toast('Sin Supabase configurado: los datos quedan en el dispositivo'); return; }
  if (!navigator.onLine) { marcarSync('off'); if (!silencioso) toast('Sin conexión. Se enviará al recuperarla.'); return; }
  try {
    const r = await Sync.empujarRespuestas(store, DEPARTAMENTOS);
    // audios pendientes
    for (const x of todasLasPreguntas()) {
      const rr = store.respuestas[x.id] || {};
      for (const c of (rr.audios || [])) {
        if (c.subido) continue;
        const b = await leerClip(c.id);
        if (!b) continue;
        try { await Sync.subirAudio(c.id, b, x.id); c.subido = true; } catch (e) {}
      }
    }
    store.sincronizado = new Date().toISOString();
    guardar(); marcarSync('ok');
    if (!silencioso) toast(`Sincronizado · ${r.ok} respuesta(s)`);
  } catch (e) {
    marcarSync('pend');
    if (!silencioso) toast('No se pudo sincronizar: ' + e.message);
  }
}

/* ══════════════ exportar ══════════════ */
function bajar(nombre, contenido, tipo) {
  const b = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
}
function comoTexto() {
  const L = ['LEVANTAMIENTO EN TERRENO · PipEI', ''];
  L.push('Proyecto: ' + (store.proyecto || '—'));
  L.push('Levantó: ' + (store.entrevistador || '—') + (store.cargo ? ' · ' + store.cargo : ''));
  L.push('Exportado: ' + new Date().toLocaleString('es-CL'), '');
  DEPARTAMENTOS.forEach(d => {
    L.push('═'.repeat(60), d.nombre.toUpperCase());
    if (store.entrevistados[d.id]) L.push('Conversado con: ' + store.entrevistados[d.id]);
    L.push('');
    d.grupos.forEach((g, gi) => {
      L.push('— ' + g.titulo + ' —');
      g.preguntas.forEach((p, pi) => {
        const id = idPregunta(d.id, gi, pi);
        const r = store.respuestas[id] || {};
        L.push('', numeroGlobal(id) + '. ' + p.q);
        if (r.opcion) L.push('   → ' + r.opcion);
        if ((r.texto || '').trim()) L.push('   ' + r.texto.trim().replace(/\n/g, '\n   '));
        if ((r.audios || []).length) L.push('   [' + r.audios.length + ' audio(s)]');
        if (!r.opcion && !(r.texto || '').trim() && !(r.audios || []).length) L.push('   (sin responder)');
      });
      L.push('');
    });
  });
  if ((store.hallazgos || '').trim()) {
    L.push('═'.repeat(60), 'HALLAZGOS NO PREVISTOS', '', store.hallazgos.trim());
  }
  return L.join('\n');
}
async function bajarAudios() {
  let n = 0;
  for (const x of todasLasPreguntas()) {
    const r = store.respuestas[x.id] || {};
    for (const c of (r.audios || [])) {
      const b = await leerClip(c.id);
      if (b) { bajar(`P${numeroGlobal(x.id)}_${c.id.split('__')[1]}.webm`, b); n++; await new Promise(s => setTimeout(s, 250)); }
    }
  }
  toast(n ? n + ' audio(s) descargado(s)' : 'No hay audios grabados');
}

/* ══════════════ util ══════════════ */
let tToast = null;
function toast(m) {
  const t = $('#toast');
  t.textContent = m; t.classList.remove('hidden');
  clearTimeout(tToast); tToast = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* ══════════════ arranque ══════════════ */
abrirDB().then(() => {
  pintarIdent();
  const ha = $('#hallazgosText');
  ha.value = store.hallazgos || '';
  ha.oninput = () => guardarTexto('hallazgos', ha.value);
  const hb = document.querySelector('[data-rec="hallazgos"]');
  hb.onclick = () => alternarGrabacion('hallazgos', ha, hb, document.querySelector('[data-status="hallazgos"]'));
  pintarClips('hallazgos');
  marcarSync(navigator.onLine ? (store.sincronizado ? 'ok' : 'pend') : 'off');
  if (Sync.activo && navigator.onLine) setTimeout(() => sincronizar(true), 2500);
});

$('#entrevistador').oninput = e => { store.entrevistador = e.target.value; guardar(); revisarGate(); };
$('#cargo').oninput = e => { store.cargo = e.target.value; guardar(); };
$('#btnBack').onclick = () => mostrar('ident');
$('#btnHallazgos').onclick = () => mostrar('hallazgos');
$('#btnMenu').onclick = $('#btnExport').onclick = () => {
  $('#modalWho').textContent = (store.entrevistador || 'Sin identificar') +
    (store.proyecto ? ' · ' + store.proyecto : '');
  $('#modalExport').classList.remove('hidden');
};
$('#expClose').onclick = () => $('#modalExport').classList.add('hidden');
$('#modalExport').onclick = e => { if (e.target.id === 'modalExport') e.target.classList.add('hidden'); };
$('#expMd').onclick = () => bajar('levantamiento-pipei.txt', comoTexto(), 'text/plain;charset=utf-8');
$('#expJson').onclick = () => bajar('levantamiento-pipei.json', JSON.stringify(store, null, 2), 'application/json');
$('#expAudio').onclick = bajarAudios;
$('#btnSync').onclick = () => sincronizar(false);

$('#btnReadAll').onclick = () => {
  if (!deptActual) return;
  const b = $('#btnReadAll');
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); marcarLectura(null); return; }
  leer(deptActual.grupos.flatMap(g => g.preguntas.map(p => p.q)).join('. '), b);
};

window.addEventListener('online', () => sincronizar(true));
window.addEventListener('offline', () => marcarSync('off'));
window.addEventListener('beforeunload', () => { detener(); guardar(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
