# PipEI · Levantamiento en Terreno

Aplicación web para levantar, en obra y con voz, las respuestas que faltan para completar la
**Especificación Funcional de PipEI**.

No es una encuesta. Cada pregunta corresponde a una decisión de diseño abierta o a un flujo que
todavía no puede diagramarse. Está pensada para usarse conversando, no para llenarla en un escritorio.

---

## Por qué existe

La especificación se construyó analizando los datos del prototipo del Proyecto 413. Ese análisis llegó
hasta donde llegan los datos. Lo que falta es conocimiento que sólo está en la cabeza de quienes ejecutan
la obra: cómo se re-spoolea, qué contiene el dossier, qué se hace cuando no hay señal.

Al abrirlo a **todos los proyectos de la unidad**, aparece además un dato que ningún proyecto por sí solo
puede entregar: si el proceso está estandarizado o si cada obra lo resuelve a su manera. Esa diferencia
es exactamente lo que la solución empresarial tiene que decidir si acomoda o si unifica.

---

## Cómo funciona

**Flujo:** identificarse → elegir proyecto → elegir departamento → conversar.

| Capacidad | Detalle |
|---|---|
| Leer la pregunta en voz alta | Síntesis de voz del navegador, en español de Chile |
| Responder por voz | Se graba el audio y se transcribe |
| Selección múltiple | Donde la respuesta admite alternativas cerradas |
| Sin conexión | Funciona completa. Sincroniza al recuperar señal |
| Consolidado | Vista que compara las respuestas de todos y marca las que no coinciden |

### Transcripción

Dos modos, según configuración:

- **Con API de IA** — el audio se envía a un endpoint propio que devuelve el texto. Mejor calidad con
  ruido de obra y acento chileno.
- **Sin API** — se usa el dictado del navegador, que funciona en Chrome y requiere conexión.

En ambos casos **el audio siempre queda guardado**, de modo que una transcripción mala nunca hace perder
la respuesta original.

---

## Estructura

```
index.html        identificación y conversación
resultados.html   consolidado: respuestas comparadas entre personas y proyectos
data.js           banco de preguntas y lista de proyectos
app.js            lógica de la aplicación
sync.js           sincronización con Supabase y transcripción por IA
styles.css        estilos
sw.js             service worker (uso sin señal)
config.js         configuración local — NO se versiona
supabase/
  schema.sql      esquema, vistas de consolidación y permisos
```

---

## Puesta en marcha

### 1 · Local

```bash
python -m http.server 8080      # o cualquier servidor estático
```

Sin `config.js` completo funciona igual: los datos quedan en el dispositivo y se exportan a mano.

### 2 · Supabase

```bash
supabase start                  # instancia local
psql "$DB_URL" -f supabase/schema.sql
```

Crea el esquema `levantamiento`, sus tres tablas, el bucket de audio y las vistas de consolidación.

Luego, en `config.js`:

```js
window.PIPEI_CONFIG = {
  proyecto:     'EIMI00413',
  supabaseUrl:  'http://localhost:54321',
  supabaseKey:  '<anon key>',
  esquema:      'levantamiento',
  bucketAudio:  'levantamiento-audio',
  transcripcionUrl: '',          // endpoint de IA, opcional
  transcripcionKey: ''
};
```

### 3 · Despliegue en Cloudflare Pages

Sitio estático, sin build.

| Parámetro | Valor |
|---|---|
| Build command | *(vacío)* |
| Output directory | `/` |
| Dominio | `levantamiento.lukeapp.cl` |

`config.js` está en `.gitignore`. Para producción, generarlo en el paso de build desde variables de
entorno, o publicarlo por separado.

---

## Cómo se reciben los datos

El consolidado no entrega un volcado. Entrega las respuestas **ya comparadas**.

`resultados.html` muestra, por pregunta, todas las respuestas recibidas con su autor y su proyecto, y
marca automáticamente aquellas en que las respuestas de selección **no coinciden entre sí**.

Del lado de la base, tres vistas:

| Vista | Qué entrega |
|---|---|
| `v_consolidado` | Cada pregunta con todas sus respuestas agrupadas |
| `v_discrepancias` | Sólo aquellas donde las respuestas difieren |
| `v_cobertura` | Avance por departamento y cuántas personas respondieron |

> Cuando dos personas describen el mismo proceso de manera distinta, esa diferencia no es un error de
> alguna de las dos: es el punto donde el sistema va a fallar si se construye sobre una sola versión.

Por eso la vista de discrepancias es la que se abre primero.

---

## Privacidad

Se registran nombres de quienes participan, con el único fin de poder volver a preguntar y de atribuir
correctamente los hallazgos. Las grabaciones son de contenido técnico sobre procesos de obra.

El acceso se abre con la clave anónima de Supabase, adecuado para un levantamiento interno y acotado en
el tiempo. Si se expone fuera de la red corporativa, reemplazar las políticas del esquema por políticas
ligadas a `auth.uid()`.

---

*LukeAPP · Echeverría Izquierdo Montajes Industriales*
