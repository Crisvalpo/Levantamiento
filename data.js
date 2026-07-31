/* PipEI · Levantamiento en terreno
   Banco de preguntas. Cada pregunta corresponde a una decisión de diseño abierta
   o a un flujo que no puede diagramarse sin esa información.

   tipo:  "texto"  → respuesta abierta, con dictado y grabación
          "opcion" → selección, con campo de detalle opcional
   nota:  aparece bajo la pregunta, para quien la formula                          */

const DEPARTAMENTOS = [
  {
    id: 'ot',
    nombre: 'Oficina Técnica',
    icono: '📐',
    prioridad: true,
    objetivo: 'Reconstruir el re-spooleo y la evaluación de impacto: los dos flujos de mayor riesgo del ' +
              'proyecto y los únicos que no pueden derivarse de los datos.',
    grupos: [
      {
        titulo: 'Re-spooleo',
        nota: 'Prioridad máxima. Es el flujo que rompió las automatizaciones del prototipo y el mejor caso ' +
              'de prueba para evaluar la solución del proveedor.',
        preguntas: [
          { t: 'texto',  q: 'Cuando llega una revisión nueva de ingeniería, ¿cómo se enteran hoy?',
            n: 'Interesa el mecanismo real: correo, reunión, alguien que avisa.' },
          { t: 'texto',  q: '¿Qué los hace decidir entre re-spoolear o corregir el spool existente?' },
          { t: 'texto',  q: 'Paso a paso: ¿qué hacen primero y qué después? ¿Se borra, se crea, se renombra?',
            n: 'Es la pregunta que permite diagramar el flujo. Conviene pedir el detalle completo.' },
          { t: 'texto',  q: '¿Qué pasa con las uniones que ya estaban soldadas en el spool que desaparece?' },
          { t: 'opcion', q: '¿Se avisa a terreno antes o después de re-spoolear?',
            o: ['Antes', 'Después', 'No se avisa formalmente', 'Depende del caso'] },
          { t: 'texto',  q: '¿Quién autoriza el re-spooleo?' },
          { t: 'texto',  q: 'Del re-spooleo que rompió las automatizaciones: ¿qué se rompió exactamente y cómo lo repararon?',
            n: 'Pedir el máximo detalle. Es el caso de prueba central de la solución.' },
          { t: 'texto',  q: '¿Con qué frecuencia ocurre y cuántos spools se ven afectados en promedio?' }
        ]
      },
      {
        titulo: 'Evaluación de impacto',
        preguntas: [
          { t: 'texto',  q: '¿Cuánto demoran en evaluar los spools afectados por una revisión?' },
          { t: 'opcion', q: '¿Evalúan spool por spool o miran el isométrico completo y deciden en bloque?',
            o: ['Spool por spool', 'En bloque por isométrico', 'Depende del alcance del cambio'] },
          { t: 'texto',  q: '¿Qué miran para decidir si lo ya ejecutado sigue sirviendo?' },
          { t: 'texto',  q: '¿Cuántas veces la evaluación terminó en retrabajo real, y de qué magnitud?' },
          { t: 'opcion', q: 'Mientras evalúan, ¿terreno queda detenido o sigue trabajando?',
            o: ['Queda detenido', 'Sigue trabajando', 'Depende del componente'] }
        ]
      },
      {
        titulo: 'Desglose en spools',
        preguntas: [
          { t: 'texto', q: '¿Quién decide dónde se corta un spool y con qué criterio?' },
          { t: 'texto', q: '¿Por qué algunos isométricos no se spoolean y van directo a terreno?' },
          { t: 'texto', q: 'Los estados "Dibujado" y "Terminado" del isométrico: ¿qué significan para ustedes?',
            n: 'El análisis sugiere que clasifican si el isométrico se desglosa o va directo a terreno. Conviene confirmarlo.' },
          { t: 'texto', q: '¿Qué información necesitan tener antes de poder spoolear?' }
        ]
      },
      {
        titulo: 'Consultas técnicas',
        preguntas: [
          { t: 'texto',  q: '¿Cómo llega una consulta, quién la responde y quién la cierra?' },
          { t: 'opcion', q: 'Mientras una consulta está pendiente, ¿se detiene el trabajo sobre los isométricos afectados?',
            o: ['Se detiene', 'Se sigue trabajando', 'Depende de la consulta'] },
          { t: 'texto',  q: '¿Dónde viven hoy las consultas y sus respuestas?' }
        ]
      }
    ]
  },

  {
    id: 'qc',
    nombre: 'Calidad',
    icono: '🧪',
    prioridad: true,
    objetivo: 'Completar los flujos de liberación y, sobre todo, conocer el dossier: es el entregable final ' +
              'del sistema y todo lo demás existe para producirlo.',
    grupos: [
      {
        titulo: 'Control dimensional',
        preguntas: [
          { t: 'texto',  q: '¿Qué se mide exactamente y contra qué documento?' },
          { t: 'texto',  q: '¿Quién firma la liberación? ¿Queda registro en papel además del sistema?' },
          { t: 'opcion', q: 'Si el control falla, ¿qué pasa con el spool?',
            o: ['Vuelve a fabricación', 'Se corrige en sitio', 'Depende de la desviación'] },
          { t: 'texto',  q: '¿Cuánto tiempo pasa en promedio entre que un spool queda fabricado y se libera?' },
          { t: 'texto',  q: '¿Por qué no se está registrando en la aplicación?',
            n: 'La tabla tiene cero registros y su automatización está deshabilitada.' }
        ]
      },
      {
        titulo: 'Tratamiento superficial',
        preguntas: [
          { t: 'texto',  q: '¿Quién libera la pintura y con qué criterio se rechaza?' },
          { t: 'opcion', q: 'El engomado, ¿tiene liberación propia o se libera junto con la pintura?',
            o: ['Liberación propia', 'Junto con la pintura', 'Depende del revestimiento'] },
          { t: 'opcion', q: '¿Puede liberarse parcialmente un spool?',
            o: ['Sí, por partes', 'No, es todo o nada'] },
          { t: 'texto',  q: '¿Qué pasa con la etiqueta del spool durante el tratamiento?' }
        ]
      },
      {
        titulo: 'Ensayos no destructivos',
        preguntas: [
          { t: 'texto',  q: '¿Cómo se solicita un ensayo y quién lo ejecuta?' },
          { t: 'texto',  q: '¿Cuánto demora el resultado y qué pasa con la unión mientras espera?' },
          { t: 'opcion', q: 'Si el ensayo sale mal, ¿se reensaya o se rehace la unión?',
            o: ['Se reensaya', 'Se rehace directamente', 'Depende del hallazgo'] },
          { t: 'texto',  q: '¿Se está cumpliendo el porcentaje de ensayo que exige el catálogo?',
            n: 'Sólo 17 de 486 inspecciones registran tipo de ensayo.' },
          { t: 'texto',  q: '¿Dónde quedan hoy los informes de laboratorio?' }
        ]
      },
      {
        titulo: 'Inspección visual y rechazos',
        preguntas: [
          { t: 'texto', q: 'Cuando rechazan una unión, ¿cómo distinguen que la soldadura está mala de que el dato está mal registrado?',
            n: 'Los 6 rechazos registrados fueron todos errores de identificación, ninguno de ejecución.' },
          { t: 'texto', q: 'Si el problema es de identificación, ¿quién corrige el registro y cómo?' },
          { t: 'texto', q: '¿Qué inspecciones hacen hoy que no quedan registradas en ninguna parte?' }
        ]
      },
      {
        titulo: 'Dossier de calidad',
        nota: 'Solicitar un ejemplar completo de un spool cerrado. Es la información más valiosa que puede ' +
              'obtenerse en este levantamiento.',
        preguntas: [
          { t: 'texto', q: '¿Qué contiene exactamente el dossier? ¿Se puede ver uno cerrado?' },
          { t: 'texto', q: '¿Cómo lo arman hoy y cuánto demora?' },
          { t: 'texto', q: '¿Qué exige el mandante, en qué formato y con qué firmas?' },
          { t: 'texto', q: '¿Qué parte del armado es la que más tiempo consume?' }
        ]
      },
      {
        titulo: 'Estampas y personal',
        preguntas: [
          { t: 'texto', q: '¿Cómo controlan que un soldador tenga estampa vigente al momento de soldar?' },
          { t: 'texto', q: '¿Qué pasa con lo que ya soldó si su calificación vence o se desvincula?' }
        ]
      }
    ]
  },

  {
    id: 'log',
    nombre: 'Logística',
    icono: '🚚',
    objetivo: 'Levantar el flujo físico completo, que hoy no está registrado en el sistema y que constituye ' +
              'alcance de la segunda versión.',
    grupos: [
      {
        titulo: 'Despacho y recepción',
        preguntas: [
          { t: 'texto',  q: 'El despacho de hoy, paso a paso: ¿quién pide, quién autoriza, quién carga, quién recibe?' },
          { t: 'opcion', q: '¿Un spool puede ir en dos guías distintas?',
            o: ['Sí', 'No', 'Excepcionalmente'] },
          { t: 'opcion', q: '¿Se despacha parcial?',
            o: ['Sí, es habitual', 'No', 'Sólo por excepción'] },
          { t: 'texto',  q: '¿Qué pasa cuando llega a obra algo que no estaba en la guía?' },
          { t: 'texto',  q: '¿Por qué las guías no se están registrando en la aplicación?',
            n: 'La bitácora tiene cero registros y el rol Logística no tiene permisos de escritura.' }
        ]
      },
      {
        titulo: 'Materiales',
        preguntas: [
          { t: 'texto',  q: '¿Cómo saben hoy si hay material disponible para fabricar un spool determinado?',
            n: 'Sólo 9 de 3.091 ítems de despiece tienen vínculo con un spool.' },
          { t: 'texto',  q: 'En bodega, ¿qué se controla y qué no?' },
          { t: 'texto',  q: '¿Qué hacen cuando falta material a mitad de una fabricación?' },
          { t: 'texto',  q: '¿Cuánto material se recibe que no estaba en el despiece original?' }
        ]
      }
    ]
  },

  {
    id: 'terreno',
    nombre: 'Supervisión y Terreno',
    icono: '🦺',
    prioridad: true,
    objetivo: 'El objetivo no es el proceso sino la interacción: dónde se pierde tiempo, qué no se alcanza a ' +
              'reportar y qué hace la gente cuando la herramienta no acompaña.',
    grupos: [
      {
        titulo: 'El día real',
        preguntas: [
          { t: 'texto',  q: 'Cuéntame un día completo: ¿en qué momento reportan?',
            n: 'Interesa saber si reportan al terminar cada unión o al final de la jornada.' },
          { t: 'texto',  q: '¿Qué reportan y qué no alcanzan a reportar nunca?' },
          { t: 'texto',  q: '¿Qué te piden por radio que la aplicación no resuelve?' },
          { t: 'texto',  q: 'El emplantillado: ¿en qué casos pasan días entre emplantillar y soldar?',
            n: 'La mediana es cero días, pero hay una cola de 51 uniones con separación real.' },
          { t: 'opcion', q: '¿Qué hacen cuando no hay señal?',
            o: ['Anotan en papel y transcriben', 'La app funciona igual', 'Esperan a tener señal', 'Otra'] }
        ]
      },
      {
        titulo: 'La herramienta',
        preguntas: [
          { t: 'texto', q: '¿Qué es lo que más molesta de la aplicación hoy?' },
          { t: 'texto', q: '¿Qué hacen dos veces que debería hacerse una sola?' },
          { t: 'texto', q: 'Cuando llega alguien nuevo, ¿cuánto demora en poder reportar solo?' },
          { t: 'texto', q: '¿Qué información buscan en la app y no encuentran?' }
        ]
      }
    ]
  },

  {
    id: 'cub',
    nombre: 'Cubicaciones',
    icono: '📊',
    objetivo: 'Definir el contrato de datos entre PipEI y la aplicación de cubicaciones, que es el único ' +
              'requerimiento de interfaz que quedó abierto.',
    grupos: [
      {
        titulo: 'Contrato de datos',
        preguntas: [
          { t: 'texto',  q: '¿Qué dato exacto necesitas de cada unión ejecutada para poder cubicarla?',
            n: 'Esta respuesta define la interfaz entre las dos aplicaciones.' },
          { t: 'texto',  q: '¿Cómo armas el estado de pago hoy y desde qué fuente?' },
          { t: 'texto',  q: '¿Qué revisas a mano antes de emitirlo?' },
          { t: 'opcion', q: 'Si recibes el dato al reportarse la ejecución, sin esperar la inspección, ¿te sirve?',
            o: ['Sí, me sirve', 'Me complica', 'Sirve con reparos'],
            n: 'La tasa de observación es cercana al 2%.' },
          { t: 'texto',  q: '¿Qué pasa cuando una unión ya cubicada resulta rechazada después?' }
        ]
      },
      {
        titulo: 'Medición',
        preguntas: [
          { t: 'texto',  q: 'Los metros: ¿de dónde los obtienes y qué haces cuando no cuadran con la línea?',
            n: 'El campo de metros por unión es un prorrateo del largo de línea, no una medición.' },
          { t: 'texto',  q: '¿Con qué frecuencia necesitas la medición en metros montados en vez de pulgadas diametrales?' },
          { t: 'texto',  q: '¿Qué discutes habitualmente con el mandante y con qué lo respaldas?' }
        ]
      }
    ]
  },

  {
    id: 'todos',
    nombre: 'Para todos',
    icono: '💬',
    objetivo: 'Formular estas tres a cada interlocutor por separado. Su valor está en el contraste entre las ' +
              'respuestas, no en cada respuesta aislada.',
    grupos: [
      {
        titulo: 'Transversales',
        nota: 'Cuando dos personas describen el mismo proceso de manera distinta, esa diferencia es el punto ' +
              'donde el sistema va a fallar si se construye sobre una sola versión.',
        preguntas: [
          { t: 'texto', q: '¿Qué información buscas y no encuentras?' },
          { t: 'texto', q: '¿Qué haces hoy en una planilla que preferirías no hacer?' },
          { t: 'texto', q: 'Si pudieras cambiar una sola cosa de cómo se trabaja hoy, ¿cuál sería?' }
        ]
      }
    ]
  }
];

/* Proyectos de la unidad. El levantamiento es corporativo: la misma pregunta
   respondida en varias obras revela si el proceso está estandarizado o no. */
const PROYECTOS = [
  'EIMI00413 · Andina · Espesador Concentrado Colectivo',
  'PRY-389',
  'PRY-403',
  'Concón',
  'Otro proyecto'
];
