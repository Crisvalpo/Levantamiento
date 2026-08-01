/* Copiar como config.js y completar.
   Si config.js no existe o queda vacío, la aplicación opera sólo en modo local. */
window.PIPEI_CONFIG = {
  proyecto: 'EIMI00413',

  // Supabase — persistencia compartida (Self-Hosted Oracle VM)
  supabaseUrl:  'https://api-oracle.lukeapp.me',

  supabaseKey:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImlhdCI6MTczOTcyOTI3MiwiZXhwIjoyMDU1MDg5MjcyfQ.4wqBiO7twFOgiLPbHQi9pmTWrM1N6FjlI93mWsuyOiE',
  esquema:      'levantamiento',
  bucketAudio:  'levantamiento-audio',

  // Transcripción por IA (opcional). Si va vacío se usa el dictado del navegador.
  transcripcionUrl: '',        // endpoint propio que recibe el audio y devuelve { texto }
  transcripcionKey: ''
};

