/* PipEI · Levantamiento en terreno
   Banco de preguntas. Cada una corresponde a una decisión de diseño abierta o a un
   flujo que todavía no puede especificarse.

   Alcance corporativo: se responde en cualquier proyecto de la unidad, no sólo en
   aquellos que hoy usan una herramienta digital. Las preguntas no suponen ningún
   sistema en particular ni ningún hecho ocurrido en una obra determinada.

   tipo:  "texto"  → respuesta abierta, con dictado y grabación
          "opcion" → selección, con campo de detalle opcional
   nota:  orientación para quien formula la pregunta                                */

const DEPARTAMENTOS = [

  /* ═══════════════════════════════════════════════════════════════════
     Sin este contexto, las demás respuestas no son comparables entre obras.
     ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'ctx',
    nombre: 'Contexto del proyecto',
    icono: '🧭',
    prioridad: true,
    objetivo: 'Situar el proyecto antes de entrar en detalle. Una misma respuesta significa cosas distintas ' +
              'según el tamaño de la obra y las herramientas con que se trabaja hoy.',
    grupos: [
      {
        titulo: 'Alcance del proyecto',
        preguntas: [
          { t: 'opcion', q: '¿Qué especialidades comprende el alcance de este proyecto?',
            o: ['Piping y Montaje', 'Estructuras y Obras Civiles', 'Multidisciplinario', 'Ingeniería / FEED'] },
          { t: 'opcion', q: '¿Este proyecto tiene alcance de piping?',
            o: ['Sí, es una parte importante', 'Sí, pero es menor', 'No tiene piping'] },
          { t: 'texto',  q: '¿Cuántas personas trabajan en piping en este proyecto y en qué roles?' },
          { t: 'texto',  q: '¿Cuál es la duración planificada del proyecto y la fecha estimada de término?' }
        ]
      },
      {
        titulo: 'Etapa de la obra',
        preguntas: [
          { t: 'opcion', q: '¿En qué etapa se encuentra hoy la obra?',
            o: ['Ingeniería / Diseño', 'Movilización y Prefabricación', 'Montaje Primario', 'Pruebas y Entrega', 'Cierre'] },
          { t: 'texto',  q: '¿Cuál es el porcentaje de avance físico real al día de hoy?' },
          { t: 'texto',  q: '¿Cuáles son los principales hitos o fechas críticas del contrato en los próximos meses?' }
        ]
      },
      {
        titulo: 'Herramientas actuales',
        preguntas: [
          { t: 'opcion', q: '¿Con qué registran hoy el avance del proyecto?',
            o: ['Aplicación digital propia', 'Planillas de cálculo', 'Papel y luego digitación',
                'Sistema del mandante', 'Combinación de varias'] },
          { t: 'texto',  q: 'Si usan planillas, ¿cuántas y quién las mantiene?',
            n: 'Interesa saber si hay una sola fuente o varias que alguien concilia a mano.' },
          { t: 'opcion', q: '¿Con qué frecuencia se actualizan los reportes de avance?',
            o: ['Diario', 'Semanal', 'Por hito o quincenal'] },
          { t: 'texto',  q: '¿Qué software o formato exige el mandante para la entrega de información de avance?' }
        ]
      },
      {
        titulo: 'Volumetría',
        preguntas: [
          { t: 'texto',  q: 'Órdenes de magnitud: ¿cuántas líneas, spools, uniones o toneladas tiene el alcance?',
            n: 'Basta una aproximación. Sirve para dimensionar la solución.' },
          { t: 'texto',  q: '¿Cuál es el volumen diario de producción o avance esperado en la etapa peak del proyecto?' },
          { t: 'texto',  q: '¿Cuántos frentes de trabajo o cuadrillas operan en paralelo en la obra?' }
        ]
      }
    ]
  },


  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'ot',
    nombre: 'Oficina Técnica',
    icono: '📐',
    prioridad: true,
    objetivo: 'Reconstruir cómo se maneja un cambio de ingeniería: es el flujo de mayor riesgo y el único ' +
              'que no puede deducirse observando los datos.',
    grupos: [
      {
        titulo: 'Cambios de ingeniería',
        nota: 'Prioridad máxima. Conviene pedir el detalle completo, paso a paso.',
        preguntas: [
          { t: 'texto',  q: 'Cuando llega una revisión nueva de un plano, ¿cómo se enteran?',
            n: 'Interesa el mecanismo real: correo, reunión, alguien que avisa, o se descubre después.' },
          { t: 'texto',  q: '¿Cómo saben qué trabajo ya ejecutado queda afectado por esa revisión?' },
          { t: 'texto',  q: '¿Quién decide qué se rehace y qué se conserva?' },
          { t: 'opcion', q: '¿Se avisa a terreno antes o después de aplicar el cambio?',
            o: ['Antes', 'Después', 'No se avisa formalmente', 'Depende del caso'] },
          { t: 'opcion', q: 'Mientras se evalúa el cambio, ¿terreno se detiene o sigue trabajando?',
            o: ['Se detiene', 'Sigue trabajando', 'Depende del componente'] },
          { t: 'texto',  q: '¿Cuánto suele demorar evaluar el impacto de una revisión?' },
          { t: 'texto',  q: '¿Con qué frecuencia ocurre y cuánto alcance suele verse afectado?' },
          { t: 'texto',  q: '¿Ha pasado que un cambio de ingeniería desordenara los registros de avance?',
            n: 'Si la respuesta es sí, pedir el relato completo: es el mejor caso de prueba que existe ' +
               'para evaluar cualquier solución.' }
        ]
      },
      {
        titulo: 'Trabajo con planos obsoletos',
        preguntas: [
          { t: 'texto',  q: '¿Ha ocurrido que se fabrique o monte con una revisión ya superada?' },
          { t: 'texto',  q: 'Cuando ocurre, ¿cómo se detecta y cuánto después?' },
          { t: 'texto',  q: '¿Qué hacen hoy para evitarlo?' },
          { t: 'texto',  q: '¿Cómo saben, mirando un registro de trabajo, bajo qué revisión se ejecutó?' }
        ]
      },
      {
        titulo: 'Desglose y preparación',
        preguntas: [
          { t: 'texto',  q: '¿Quién define los spools y con qué criterio se decide dónde se corta uno?' },
          { t: 'texto',  q: '¿Hay isométricos que no se desglosan y se montan directo en terreno? ¿Cuáles y por qué?' },
          { t: 'texto',  q: '¿Qué información necesitan tener disponible antes de poder desglosar?' },
          { t: 'texto',  q: '¿Qué estados usan para seguir un isométrico desde que llega hasta que se cierra?',
            n: 'Interesa la lista de estados tal como la nombran ellos.' }
        ]
      },
      {
        titulo: 'Consultas a ingeniería',
        preguntas: [
          { t: 'texto',  q: '¿Cómo se levanta una consulta, quién la responde y quién la cierra?' },
          { t: 'opcion', q: 'Mientras una consulta está pendiente, ¿se detiene el trabajo afectado?',
            o: ['Se detiene', 'Se sigue trabajando', 'Depende de la consulta'] },
          { t: 'texto',  q: '¿Dónde quedan registradas las consultas y sus respuestas?' }
        ]
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'qc',
    nombre: 'Calidad',
    icono: '🧪',
    prioridad: true,
    objetivo: 'Completar los flujos de liberación y conocer el dossier: es el entregable final, y todo lo ' +
              'demás existe para poder producirlo.',
    grupos: [
      {
        titulo: 'Control dimensional',
        preguntas: [
          { t: 'texto',  q: '¿Qué se verifica exactamente y contra qué documento?' },
          { t: 'texto',  q: '¿Quién firma la liberación y dónde queda ese registro?' },
          { t: 'opcion', q: 'Si el control falla, ¿qué pasa con la pieza?',
            o: ['Vuelve a fabricación', 'Se corrige en sitio', 'Depende de la desviación'] },
          { t: 'texto',  q: '¿Cuánto tiempo suele pasar entre que una pieza queda fabricada y se libera?' },
          { t: 'texto',  q: '¿Qué hace que una pieza se quede esperando liberación más de lo normal?' }
        ]
      },
      {
        titulo: 'Tratamiento superficial',
        preguntas: [
          { t: 'opcion', q: '¿En este proyecto hay tratamiento superficial de piping?',
            o: ['Pintura', 'Pintura y revestimiento interior', 'Sólo galvanizado o similar', 'No aplica'] },
          { t: 'texto',  q: '¿Quién libera el tratamiento y con qué criterio se rechaza?' },
          { t: 'opcion', q: 'Cuando hay más de un tratamiento, ¿cada uno se libera por separado?',
            o: ['Sí, por separado', 'Se libera todo junto', 'Depende del caso'] },
          { t: 'opcion', q: '¿Puede liberarse parcialmente una pieza?',
            o: ['Sí, por partes', 'No, es todo o nada'] },
          { t: 'texto',  q: '¿Qué pasa con la identificación de la pieza durante el tratamiento?',
            n: 'Interesa saber si la marca o etiqueta sobrevive al proceso.' }
        ]
      },
      {
        titulo: 'Ensayos no destructivos',
        preguntas: [
          { t: 'texto',  q: '¿Qué ensayos exige el contrato y en qué porcentaje?' },
          { t: 'texto',  q: '¿Cómo se solicita un ensayo y quién lo ejecuta?' },
          { t: 'texto',  q: '¿Cuánto demora el resultado y qué pasa con la unión mientras espera?' },
          { t: 'opcion', q: 'Si el ensayo sale mal, ¿se reensaya o se rehace la unión?',
            o: ['Se reensaya', 'Se rehace directamente', 'Depende del hallazgo'] },
          { t: 'texto',  q: '¿Dónde quedan los informes de laboratorio y cómo se vinculan a la unión?' }
        ]
      },
      {
        titulo: 'Inspección y rechazos',
        preguntas: [
          { t: 'texto',  q: '¿Qué proporción de los rechazos corresponde a un defecto real de ejecución?',
            n: 'La otra parte suele ser error de registro o de identificación. Interesa distinguirlas.' },
          { t: 'texto',  q: 'Cuando el problema es de identificación y no de ejecución, ¿cómo lo resuelven?' },
          { t: 'texto',  q: '¿Qué inspecciones se realizan hoy y no quedan registradas en ninguna parte?' }
        ]
      },
      {
        titulo: 'Dossier de calidad',
        nota: 'Solicitar un ejemplar completo de una pieza cerrada. Es la información más valiosa que puede ' +
              'obtenerse en este levantamiento.',
        preguntas: [
          { t: 'texto',  q: '¿Qué contiene exactamente el dossier? ¿Se puede ver uno cerrado?' },
          { t: 'texto',  q: '¿Cómo lo arman hoy y cuánto demora?' },
          { t: 'texto',  q: '¿Qué exige el mandante, en qué formato y con qué firmas?' },
          { t: 'texto',  q: '¿Qué parte del armado consume más tiempo?' },
          { t: 'texto',  q: '¿Qué información les cuesta más reunir a la hora de cerrarlo?' }
        ]
      },
      {
        titulo: 'Calificación del personal',
        preguntas: [
          { t: 'texto', q: '¿Cómo controlan que un soldador tenga calificación vigente al momento de soldar?' },
          { t: 'texto', q: '¿Qué pasa con el trabajo ya ejecutado si una calificación vence o la persona se desvincula?' }
        ]
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'log',
    nombre: 'Logística',
    icono: '🚚',
    objetivo: 'Levantar el flujo físico completo: desde que el material llega hasta que la pieza queda a pie ' +
              'de montaje.',
    grupos: [
      {
        titulo: 'Despacho y recepción',
        preguntas: [
          { t: 'texto',  q: 'El despacho paso a paso: ¿quién pide, quién autoriza, quién carga, quién recibe?' },
          { t: 'opcion', q: '¿Una misma pieza puede ir en dos guías distintas?',
            o: ['Sí', 'No', 'Excepcionalmente'] },
          { t: 'opcion', q: '¿Se despacha parcial?',
            o: ['Sí, es habitual', 'No', 'Sólo por excepción'] },
          { t: 'texto',  q: '¿Qué pasa cuando llega a obra algo que no estaba en la guía?' },
          { t: 'texto',  q: '¿Dónde queda registrado el despacho y quién lo consulta después?' },
          { t: 'texto',  q: '¿Cómo saben dónde está físicamente una pieza en un momento dado?' }
        ]
      },
      {
        titulo: 'Materiales',
        preguntas: [
          { t: 'texto',  q: '¿Cómo saben si hay material disponible para fabricar una pieza determinada?',
            n: 'Interesa si existe vínculo entre el despiece y la pieza, o si se resuelve por experiencia.' },
          { t: 'texto',  q: 'En bodega, ¿qué se controla y qué no?' },
          { t: 'texto',  q: '¿Qué hacen cuando falta material a mitad de una fabricación?' },
          { t: 'texto',  q: '¿Cuánto material llega que no estaba en el despiece original?' }
        ]
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'terreno',
    nombre: 'Supervisión y Terreno',
    icono: '🦺',
    prioridad: true,
    objetivo: 'Aquí no interesa el proceso sino el momento de la captura: dónde se pierde tiempo, qué no se ' +
              'alcanza a registrar y qué hace la gente cuando la herramienta no acompaña.',
    grupos: [
      {
        titulo: 'El día real',
        preguntas: [
          { t: 'texto',  q: 'Cuéntame un día completo: ¿en qué momento se registra el avance?',
            n: 'Interesa saber si se registra al terminar cada trabajo o al final de la jornada.' },
          { t: 'opcion', q: '¿Quién registra el avance?',
            o: ['El capataz en terreno', 'El supervisor', 'Una persona en oficina', 'Varios según el caso'] },
          { t: 'texto',  q: '¿Qué se registra y qué no se alcanza a registrar nunca?' },
          { t: 'texto',  q: 'Entre que el trabajo se hace y queda registrado, ¿cuánto pasa?' },
          { t: 'opcion', q: '¿Cómo es la señal en el frente de trabajo?',
            o: ['Buena en todo el sector', 'Sólo en algunos puntos', 'Prácticamente no hay'] },
          { t: 'texto',  q: '¿Qué hacen cuando no hay señal?' }
        ]
      },
      {
        titulo: 'La herramienta actual',
        preguntas: [
          { t: 'texto', q: '¿Qué es lo que más molesta de la forma en que se registra hoy?' },
          { t: 'texto', q: '¿Qué se hace dos veces que debería hacerse una sola?' },
          { t: 'texto', q: 'Cuando llega alguien nuevo, ¿cuánto demora en poder registrar solo?' },
          { t: 'texto', q: '¿Qué información buscan y no encuentran cuando están en el frente?' },
          { t: 'texto', q: '¿Qué les piden por radio que hoy no pueden responder en el momento?' }
        ]
      },
      {
        titulo: 'Identificación de piezas',
        preguntas: [
          { t: 'texto',  q: '¿Cómo identifican una pieza en terreno? ¿Marca en el acero, etiqueta, plano?' },
          { t: 'texto',  q: '¿Con qué frecuencia se pierde o se borra esa identificación?' },
          { t: 'texto',  q: 'Si alguien pide una pieza por radio, ¿cómo la nombra para que la encuentren?',
            n: 'Es la clave del diseño del identificador. Interesa la frase exacta que se usa.' }
        ]
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'cub',
    nombre: 'Cubicaciones y Control',
    icono: '📊',
    objetivo: 'Definir qué dato necesita quien mide el avance para emitir el estado de pago, y cómo lo obtiene ' +
              'hoy.',
    grupos: [
      {
        titulo: 'Medición del avance',
        preguntas: [
          { t: 'opcion', q: '¿En qué unidad se mide el avance de piping en este contrato?',
            o: ['Pulgadas diametrales', 'Metros lineales', 'Uniones ejecutadas', 'Ponderación por hitos',
                'Combinación de varias'] },
          { t: 'texto',  q: '¿Qué dato exacto necesitas de cada trabajo ejecutado para poder cubicarlo?',
            n: 'Esta respuesta define qué debe entregar el sistema.' },
          { t: 'texto',  q: '¿Cómo armas el estado de pago hoy y desde qué fuente?' },
          { t: 'texto',  q: '¿Qué revisas a mano antes de emitirlo?' },
          { t: 'texto',  q: '¿Cuánto tiempo te toma cada período?' }
        ]
      },
      {
        titulo: 'Confiabilidad del dato',
        preguntas: [
          { t: 'opcion', q: 'Para cubicar, ¿te basta con saber que el trabajo se ejecutó, o necesitas la inspección aprobada?',
            o: ['Basta la ejecución', 'Necesito la inspección', 'Depende del ítem'] },
          { t: 'texto',  q: '¿Qué pasa cuando algo ya cubicado resulta rechazado después?' },
          { t: 'texto',  q: 'Si se mide en metros, ¿de dónde salen y qué haces cuando no cuadran?' },
          { t: 'texto',  q: '¿Qué discutes habitualmente con el mandante y con qué lo respaldas?' }
        ]
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  {
    id: 'todos',
    nombre: 'Para todos',
    icono: '💬',
    objetivo: 'Formular a cada interlocutor por separado. Su valor está en el contraste entre las respuestas, ' +
              'no en cada respuesta aislada.',
    grupos: [
      {
        titulo: 'Transversales',
        nota: 'Cuando dos personas describen el mismo proceso de manera distinta, esa diferencia es el punto ' +
              'donde el sistema va a fallar si se construye sobre una sola versión.',
        preguntas: [
          { t: 'texto', q: '¿Qué información buscas y no encuentras?' },
          { t: 'texto', q: '¿Qué haces hoy en una planilla que preferirías no hacer?' },
          { t: 'texto', q: 'Si pudieras cambiar una sola cosa de cómo se trabaja hoy, ¿cuál sería?' },
          { t: 'texto', q: '¿Qué se hace bien en este proyecto que valdría la pena que hicieran los demás?',
            n: 'Pregunta de cierre. Suele entregar las mejores prácticas que nadie documentó.' }
        ]
      }
    ]
  }
];

/* Proyectos de la unidad. La misma pregunta respondida en varias obras revela si
   el proceso está estandarizado o si cada proyecto lo resuelve a su manera.       */
const PROYECTOS = [
  'EIMI00417 · Contrato CC-006 Obras Civiles y Montaje Electromecánico PG210 Área Puerto',
  'EIMI00416 · EPV1 Servicio de Ingeniería Etapa FEED',
  'EIMI00415 · PET0016-E Construcción y Montaje Condensadores Síncronos S/E Montemina',
  'EIMI00414 · Servicios de Obras Multidisciplinarias MGA Contrato 4600027683',
  'EIMI00413 · Ejecución Montaje Espesador de Cabeza PMFC-DAND',
  'EIMI00412 · Ejecución Montaje Electromecánico Proyecto Nuevas Prensas de Lodos Planta Santa Fe',
  'EIMI00410 · Apoyo EIMI Perú (Cerro Verde)',
  'EIMI00409 · Centro Operaciones Rancagua',
  'EIMI00408 · CC-030 Construcción y Montaje Área Seca Óxidos y Área Hidrometalurgia',
  'EIMI00407 · Servicio de Constructibilidad del Proyecto Santo Domingo - Capstone Copper',
  'EIMI00406 · Construcción Defensas Fluviales y Línea de Impulsión ACM Matadero',
  'EIMI00405 · Contrato Obras Uso de Recursos GPRO 2024',
  'EIMI00404 · Ejecución Obras Civiles Proyecto Nuevas Prensas de Lodos Planta Santa Fe',
  'EIMI00403 · Construcción OOCC y Montaje Electromecánico y Ampliación Botadero de Ripios Fase IX DRT',
  'EIMI00402 · Reemplazo y Cambio Tubos Caldera de Poder Línea 2 Planta Arauco',
  'EIMI00401 · CC-031 Obras Misceláneos N2',
  'EIMI00400 · Construcción y Montaje Electromecánico Paquete PG3A Proyecto Crecimiento Ujina',
  'EIMI00398 · Construcción y Montaje Etapa 1 Proyecto Prueba Piloto IP3 TCF Planta Valdivia',
  'EIMI00397 · Construcción y Montaje Condensadores Síncronos S/E Ana María',
  'EIMI00396 · C-744 Montaje Electromecánico - Proyecto de Reducción de Aguas CMPC Planta Pacífico',
  'EIMI00395 · Construcción y Montaje Civil Electromecánico Nuevo Concentrador 1D Planta Valdivia',
  'EIMI00393 · Obras de Mejoramiento Taller La Junta Contrato 4600027978',
  'EIMI00389 · K484 ENAP SWS and WSA Unit Aconcagua Refinery Chile I03 General Construction Works',
  'EIMI00388 · Montaje Civil Electromecánico Proyecto Estanque de Contacto Planta Nueva Aldea',
  'EIMI00387 · EPC Muelle Centinela',
  'EIMI00384 · Electromecánico Proyecto Upgrade Evaporadores SF2 Planta San',
  'EIMI00379 · Servicios Multidisciplinarios',
  'MIPE00103 · Reubicación Sala Eléctrica Faja 10 Colección Polvos Cuajone',
  'MIPE00102 · Talleres de Mantenimiento Concentradora Cuajone',
  'MIPE00101 · Servicios Electromecánica Sistema de Manejo - Proyecto IPCC',
  'Otro proyecto'
];
