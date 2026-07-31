/* Copiar como config.js y completar.
   Si config.js no existe o queda vacío, la aplicación opera sólo en modo local. */
window.PIPEI_CONFIG = {
  proyecto: 'EIMI00413',

  // Supabase — persistencia compartida
  supabaseUrl:  '',            // https://xxxx.supabase.co   o  http://localhost:54321
  supabaseKey:  '',            // anon key
  esquema:      'levantamiento',
  bucketAudio:  'levantamiento-audio',

  // Transcripción por IA (opcional). Si va vacío se usa el dictado del navegador.
  transcripcionUrl: '',        // endpoint propio que recibe el audio y devuelve { texto }
  transcripcionKey: ''
};
