/* PipEI · Levantamiento — capa de sincronización con Supabase.
   Offline-first: todo se escribe primero en el dispositivo. Esta capa empuja los
   cambios cuando hay conexión y devuelve la transcripción cuando la IA la produce.

   Si config.js no está completo, la aplicación funciona sólo en local. */

'use strict';

const Sync = (() => {
  const cfg = window.PIPEI_CONFIG || {};
  const activo = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const ESQ = cfg.esquema || 'levantamiento';
  let sesionId = localStorage.getItem('pipei.sesion') || null;

  const H = () => ({
    'apikey': cfg.supabaseKey,
    'Authorization': 'Bearer ' + cfg.supabaseKey,
    'Content-Type': 'application/json',
    'Accept-Profile': ESQ,
    'Content-Profile': ESQ,
    'Prefer': 'resolution=merge-duplicates,return=representation'
  });

  const url = t => `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${t}`;

  async function pedir(tabla, cuerpo, metodo = 'POST') {
    const r = await fetch(url(tabla), { method: metodo, headers: H(), body: JSON.stringify(cuerpo) });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  }

  /* ── sesión ── */
  async function abrirSesion(store) {
    if (!activo) return null;
    if (sesionId) return sesionId;
    const [s] = await pedir('sesion', [{
      proyecto: cfg.proyecto || 'sin-proyecto',
      entrevistador: store.entrevistador || null,
      cargo: store.cargo || null,
      dispositivo: navigator.userAgent.slice(0, 180)
    }]);
    sesionId = s.id;
    localStorage.setItem('pipei.sesion', sesionId);
    return sesionId;
  }

  /* ── respuestas ── */
  async function empujarRespuestas(store, departamentos) {
    if (!activo) return { ok: 0, err: 0 };
    await abrirSesion(store);
    const filas = [];
    departamentos.forEach(d => d.grupos.forEach((g, gi) => g.preguntas.forEach((p, pi) => {
      const id = `${d.id}.${gi}.${pi}`;
      const r = store.respuestas[id];
      if (!r) return;
      const vacio = !(r.texto || '').trim() && !r.opcion && !(r.audios || []).length;
      if (vacio) return;
      filas.push({
        sesion_id: sesionId,
        pregunta_id: id,
        departamento: d.id,
        grupo: g.titulo,
        pregunta: p.q,
        entrevistado: store.entrevistados[d.id] || null,
        opcion: r.opcion || null,
        texto: (r.texto || '').trim() || null,
        actualizada_en: new Date().toISOString()
      });
    })));
    if ((store.hallazgos || '').trim()) {
      filas.push({
        sesion_id: sesionId, pregunta_id: '__hallazgos', departamento: 'hallazgos',
        grupo: 'Hallazgos', pregunta: 'Hallazgos no previstos',
        entrevistado: null, opcion: null,
        texto: store.hallazgos.trim(), actualizada_en: new Date().toISOString()
      });
    }
    if (!filas.length) return { ok: 0, err: 0 };
    try { await pedir('respuesta', filas); return { ok: filas.length, err: 0 }; }
    catch (e) { console.warn('sync respuestas', e); return { ok: 0, err: filas.length }; }
  }

  /* ── audio ── */
  async function subirAudio(clipId, blob, preguntaId) {
    if (!activo) return null;
    const bucket = cfg.bucketAudio || 'levantamiento-audio';
    const ruta = `${sesionId || 'local'}/${clipId}.webm`;
    const r = await fetch(
      `${cfg.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${ruta}`,
      { method: 'POST',
        headers: { 'apikey': cfg.supabaseKey, 'Authorization': 'Bearer ' + cfg.supabaseKey,
                   'Content-Type': blob.type || 'audio/webm', 'x-upsert': 'true' },
        body: blob });
    if (!r.ok) throw new Error('storage ' + r.status);
    await pedir('audio', [{
      sesion_id: sesionId, pregunta_id: preguntaId, clip_id: clipId,
      ruta, estado_transcripcion: cfg.transcripcionUrl ? 'pendiente' : 'no_aplica'
    }]);
    return ruta;
  }

  /* ── transcripción por IA ── */
  async function transcribir(blob) {
    if (!cfg.transcripcionUrl) return null;
    const fd = new FormData();
    fd.append('audio', blob, 'clip.webm');
    fd.append('idioma', 'es-CL');
    const h = {};
    if (cfg.transcripcionKey) h['Authorization'] = 'Bearer ' + cfg.transcripcionKey;
    const r = await fetch(cfg.transcripcionUrl, { method: 'POST', headers: h, body: fd });
    if (!r.ok) throw new Error('transcripcion ' + r.status);
    const j = await r.json();
    return j.texto || j.text || null;
  }

  return {
    activo,
    hayTranscripcionIA: !!cfg.transcripcionUrl,
    abrirSesion, empujarRespuestas, subirAudio, transcribir,
    get sesionId() { return sesionId; }
  };
})();
