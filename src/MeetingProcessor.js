/**
 * Procesa el texto capturado de la reunión y lo divide en:
 * - Tareas (To-Dos) - Array de acciones específicas extraídas
 * - Acuerdos - Decisiones tomadas conjuntamente
 * - Próxima Reunión - Seguimiento programado
 * 
 * Estructura preparada para integración con OpenAI API
 * Cada tarea es un objeto con: { action, responsible, deadline, confidence }
 */

export class MeetingProcessor {
  /**
   * Analiza el texto y extrae tareas, acuerdos y próxima reunión
   * @param {string} text - Texto capturado de la reunión
   * @returns {Object} Objeto con propiedades: tasks (array), agreements (array), nextMeeting
   */
  static processText(text, language = 'es') {
    if (!text || typeof text !== 'string') {
      return {
        tasks: [],
        agreements: [],
        nextMeeting: null,
        rawText: text,
      };
    }

    const phrases = this.splitIntoPhrases(text, language);
    const tasks = this.extractTasks(phrases, text, language);
    const agreements = this.extractAgreements(phrases, text, language);
    const nextMeeting = this.extractNextMeeting(text, language);

    return {
      tasks,
      agreements,
      nextMeeting,
      rawText: text,
    };
  }

  /**
   * Divide el texto en frases para análisis.
   * EN: conserva oraciones completas para no perder contexto.
   * ES: divide más agresivamente (habla más informal).
   */
  static splitIntoPhrases(text, language = 'es') {
    const isEN = language === 'en';

    if (isEN) {
      // Paso 1: dividir en puntuación fuerte
      let chunks = text.split(/(?<=[.!?])\s+|[;]/);

      // Paso 2: para bloques grandes (>200 chars) sin puntuación,
      // dividir en transiciones naturales del habla
      chunks = chunks.flatMap(s => {
        if (s.length > 200) {
          const parts = s.split(/\s+(?=(?:so\s|and\s+then\s|also\s|but\s|however\s|anyway\s|now\s|ok\s|okay\s|alright\s|moving on\s|next\s|another\s+thing|on\s+(?:the\s+)?other\s+hand|by\s+the\s+way|for\s+number|I think\s|I'm going\s|I believe\s|I guess\s|I mean\s|which\s+(?:raised|means|is)))/i);
          const filtered = parts.filter(p => p.trim().length > 10);
          return filtered.length > 1 ? filtered : [s];
        }
        return [s];
      });

      // Paso 3: si aún quedan bloques >300 chars, dividir en comas
      chunks = chunks.flatMap(s => {
        if (s.length > 300) {
          const parts = s.split(/,\s+/);
          return parts.filter(p => p.trim().length > 10);
        }
        return [s];
      });

      return chunks
        .map(s => s.trim())
        .filter(s => s.length > 8);
    }

    // Español: mantener oraciones completas (Whisper genera texto con puntos)
    // Solo dividir en puntuación fuerte — NO en comas ni "y"
    let chunks = text.split(/(?<=[.!?])\s+/);
    // Para oraciones muy largas (>200 chars), dividir en conectores fuertes
    chunks = chunks.flatMap(s => {
      if (s.length > 200) {
        const parts = s.split(/[,;]\s*(?=(?:entonces|por eso|por otro lado|pero|sin embargo|asimismo|además|para ello|en ese sentido|por esa razón)\s)/i);
        const filtered = parts.filter(p => p.trim().length > 15);
        return filtered.length > 1 ? filtered : [s];
      }
      return [s];
    });
    return chunks
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  /**
   * Extrae tareas del texto usando patrones lingüísticos mejorados
   * Retorna array de objetos: { action, responsible, deadline, confidence }
   * Compatible con OpenAI API para procesamiento futuro
   */
  static extractTasks(phrases, fullText, language = 'es') {
    const tasks = [];
    const isEN = language === 'en';

    // ── Vocabulario según idioma ───────────────────────────────────────────────
    const actionVerbs = isEN ? [
      'review', 'complete', 'prepare', 'send', 'contact', 'implement', 'develop',
      'test', 'fix', 'update', 'create', 'manage', 'analyze', 'write', 'coordinate',
      'organize', 'evaluate', 'present', 'investigate', 'validate', 'confirm',
      'document', 'design', 'build', 'define', 'configure', 'integrate', 'launch',
      'add', 'modify', 'adjust', 'finish', 'deliver', 'generate', 'plan', 'install',
      'check', 'schedule', 'finalize', 'draft', 'share', 'discuss', 'clarify',
      'follow up', 'set up', 'reach out', 'deploy', 'migrate', 'refactor',
      'upload', 'download', 'invite', 'assign', 'notify', 'record', 'track',
      'monitor', 'prioritize', 'allocate', 'resolve', 'approve', 'submit',
    ] : [
      'hacer', 'revisar', 'completar', 'preparar', 'enviar', 'contactar',
      'llamar', 'seguimiento', 'implementar', 'desarrollar', 'probar',
      'corregir', 'mejorar', 'actualizar', 'crear', 'gestionar', 'analizar',
      'redactar', 'coordinar', 'dirigir', 'organizar', 'proponer', 'evaluar',
      'presentar', 'investigar', 'validar', 'confirmar', 'documentar',
      'diseñar', 'construir', 'definir', 'configurar', 'integrar', 'lanzar',
      'migrar', 'refactorizar', 'deployar', 'subir', 'bajar', 'eliminar',
      'agregar', 'añadir', 'modificar', 'ajustar', 'terminar', 'entregar',
      'generar', 'calcular', 'estimar', 'planificar', 'instalar', 'saltar',
    ];

    const timeframes = isEN ? {
      'today':        'Today',
      'tomorrow':     'Tomorrow',
      'this week':    'This week',
      'next week':    'Next week',
      'monday':       'Monday',
      'tuesday':      'Tuesday',
      'wednesday':    'Wednesday',
      'thursday':     'Thursday',
      'friday':       'Friday',
      'by end of':    'By end of',
      'by eod':       'By EOD',
      'before':       'Before',
      'by next':      'By next',
    } : {
      'hoy':            'Hoy',
      'mañana':         'Mañana',
      'esta semana':    'Esta semana',
      'próxima semana': 'Próxima semana',
      'lunes':          'Lunes',
      'martes':         'Martes',
      'miércoles':      'Miércoles',
      'jueves':         'Jueves',
      'viernes':        'Viernes',
      'antes del':      'Antes del',
      'para':           'Para',
    };

    const noDate = isEN ? 'No date' : 'Sin fecha';

    // ── Frases sociales vacías en inglés que NO son tareas ────────────────────
    // Este set se usa para descartar resultados del fallback de verbos
    const socialPhrases = isEN ? new Set([
      'ping me', 'feel free', 'let me know', 'keep me posted', 'heads up',
      'just checking', 'just wanted', 'by the way', 'no worries', 'sounds good',
      'makes sense', 'take care', 'good luck', 'have a great', 'stay tuned',
      'bear with me', 'bear in mind', 'touch base', 'wrap up', 'kick off',
      'give a shout', 'give a shout out', 'shout out', 'drop a line',
      'get started', 'get going', 'move on', 'move along', 'carry on',
    ]) : new Set();

    // ── Patrones de alta confianza ──────────────────────────────────────────
    // EN: NO anclados — buscan DENTRO de la frase (Whisper a veces no pone puntos)
    const highConfidencePatterns = isEN ? [
      // "I/we/you + will/should/must/need to/have to/going to + verbo"
      /(?:I|we|you|he|she|they)(?:'ll|\s+(?:will|should|must|need\s+to|have\s+to|(?:am|are|is)\s+going\s+to))\s+(?!just\s+)(.{10,})/i,
      // "I/we want to / plan to / intend to + verbo"
      /(?:I|we)\s+(?:want\s+to|plan\s+to|intend\s+to|'d\s+like\s+to|would\s+like\s+to)\s+(.{8,})/i,
      // "make sure (to) + verbo"
      /make\s+sure\s+(?:to\s+|you\s+|we\s+)?(.{8,})/i,
      // "don't forget to / remember to + verbo"
      /(?:don't\s+forget\s+to|remember\s+to)\s+(.{8,})/i,
      // "let's / let us + verbo"
      /(?:let's|let\s+us)\s+(.{8,})/i,
      // "[Name] + will/should/needs to/can you..."
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|should|must|needs?\s+to|has\s+to|is\s+going\s+to|can\s+you)\s+([a-z].{6,})/i,
      // "[Name], + imperativo" (Name COMMA verb)
      /([A-Z][a-z]+)[,]\s*(?:please\s+)?(?:can you\s+)?((?:start|create|review|send|check|prepare|update|fix|build|design|set\s+up|follow\s+up|reach\s+out|write|finish|complete|submit|schedule|share|discuss|handle|take\s+care|look\s+into|work\s+on|figure\s+out|clean|organize|order|buy|pick\s+up|call|email|text|book|arrange|cook|wash|mow|paint|install|repair)\w*\s+.{3,})/i,
      // "please (do)? + verbo" (no social)
      /please\s+(?:do\s+)?((?:review|update|send|prepare|create|schedule|follow\s+up|reach\s+out|set\s+up|check|finalize|submit|document|validate|implement|develop|test|fix|build|design|analyze|write|share|confirm|notify|assign|track|resolve|approve|deploy|monitor|handle|finish|complete|start|clean|organize|order|buy|pick\s+up|call|email|book|arrange|cook|wash|mow|paint|install|repair|invest|read|fill|attend|go\s+(?:in|ahead)|vote|ensure|prioritize)\w*\s*.{3,})/i,
      // "action item / task / to-do: ..."
      /(?:action\s+item|task|to-?do)\s*[:\u2013\-]\s*(.{5,})/i,
      // "someone/one of us needs to ..."
      /(?:someone|one\s+of\s+us|the\s+team)\s+(?:needs?\s+to|should|will|must|has\s+to)\s+(.{8,})/i,
      // "we can / we could + verbo de acción" (SOLO si hay verbo concreto)
      /(?:I|we)\s+(?:can|could)\s+((?:start|create|review|send|check|prepare|update|fix|build|design|set\s+up|follow\s+up|write|finish|complete|submit|schedule|share|handle|look\s+into|work\s+on|figure\s+out|clean|organize|order|buy|pick\s+up|call|email|book|arrange)\w*\s+.{3,})/i,
      // "the idea is to / the plan is to + verbo"
      /(?:the\s+(?:idea|plan|goal)\s+is\s+to)\s+(.{8,})/i,
      // "try to / try and + verbo"
      /(?:we|I|you)\s+(?:should\s+)?try\s+(?:to|and)\s+(.{8,})/i,
      // "I'm going to / we're going to + verbo" (contractiones)
      /(?:I'm|we're|you're|he's|she's|they're)\s+(?:going\s+to|gonna)\s+(.{8,})/i,
    ] : [
      // [Nombre] + modal (va a/tiene que/necesita/debe) + verbo de acción
      // PRIMERO: captura el nombre del responsable
      /([A-ZÁÉÍÓÚÑ][a-záéíóúüñ]{2,15})\s+(?:va\s+a|tiene\s+que|necesita|debe)\s+((?:empezar|iniciar|crear|revisar|hacer|preparar|implementar|trabajar|armar|convocar|atender|canalizar|establecer|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|actualizar|construir|integrar|lanzar|mejorar|corregir|gestionar|coordinar|organizar|presentar|analizar|documentar|evaluar|contactar|llamar|enviar|buscar|comprar|reservar|publicar|supervisar|negociar|seleccionar|calcular|planificar|generar|solicitar|redactar|validar)\w*\s+.{3,})/i,

      // [Nombre], (tú)? (ve y)? imperativo + objeto (REQUIERE coma después del nombre)
      /([A-ZÁÉÍÓÚÑ][a-záéíóúüñ]{2,15})[,]\s*(?:tú\s+)?(?:ve\s+y\s+|anda\s+y\s+)?((?:empieza|inicia|crea|revisa|haz|prepara|envía|contacta|llama|termina|entrega|completa|actualiza|instala|configura|diseña|desarrolla|implementa|coordina|presenta|analiza|documenta|evalúa|planifica|genera|organiza|define|construye|integra|lanza|mejora|corrige|gestiona|sube|valida|redacta)\w*\s+.{3,})/i,

      // vamos a / voy a / va a / van a + infinitivo de acción concreto
      /(?:así\s+que\s+)?(?:vamos|voy|va|van)\s+a\s+((?:empezar|iniciar|crear|revisar|hacer|preparar|implementar|trabajar|armar|convocar|atender|canalizar|establecer|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|actualizar|construir|integrar|lanzar|mejorar|corregir|gestionar|coordinar|organizar|presentar|analizar|documentar|evaluar|planificar|generar|solicitar|manejar|redactar|validar|proponer|investigar|producir|migrar|subir|agregar|añadir|modificar|ajustar|escuchar|conversar|verificar|contactar|llamar|enviar|buscar|comprar|reservar|publicar|supervisar|negociar|seleccionar|monitorear|calcular|estimar)\w*\s+.{5,})/i,

      // estoy/estamos + gerundio de acción concreto
      /(?:ya\s+)?(?:estoy|estamos)\s+((?:armando|creando|preparando|implementando|desarrollando|trabajando|convocando|analizando|canalizando|coordinando|construyendo|diseñando|haciendo|configurando|evaluando|organizando|presentando|planificando|gestionando|documentando|mejorando|integrando|instalando|solicitando|revisando|completando|terminando|entregando|actualizando|estableciendo|generando|produciendo|resolviendo|verificando|contactando|llamando|enviando|buscando|comprando|supervisando|negociando|calculando)\w*\s+.{5,})/i,

      // hay que + infinitivo de acción
      /hay\s+que\s+((?:empezar|iniciar|crear|revisar|hacer|preparar|implementar|trabajar|armar|convocar|atender|canalizar|establecer|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|actualizar|construir|integrar|lanzar|mejorar|corregir|gestionar|coordinar|organizar|presentar|analizar|documentar|evaluar|planificar|generar|solicitar|manejar|redactar|validar|proponer|contactar|llamar|enviar|buscar|comprar|reservar|supervisar|negociar|calcular|estimar)\w*\s+.{3,})/i,

      // tiene(n) que / necesita(n) / debe(n) + infinitivo (sin nombre)
      /(?:tiene[sn]?\s+que|necesita[sn]?|debe[sn]?|debo)\s+((?:empezar|iniciar|crear|revisar|hacer|preparar|implementar|trabajar|armar|convocar|atender|canalizar|establecer|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|actualizar|construir|integrar|lanzar|mejorar|corregir|gestionar|coordinar|organizar|presentar|analizar|documentar|evaluar|planificar|generar|solicitar|redactar|validar|proponer|contactar|llamar|enviar|buscar|comprar|reservar|supervisar|negociar|calcular|estimar)\w*\s+.{5,})/i,

      // me/te/le encargó/pidió que + acción
      /(?:me|te|le|nos|les)\s+(?:encargó|encargaron|pidió|pidieron|dieron)\s+(?:que\s+)?(.{10,})/i,
    ];

    // ── Patrones de confianza media ────────────────────────────────────────────
    const mediumConfidencePatterns = isEN ? [
      // "we need to / I need to + VERB + object"
      /^(?:we|I)\s+need to\s+((?:review|update|send|prepare|create|schedule|follow up|reach out|set up|check|finalize|submit|document|validate|implement|develop|test|fix|build|design|analyze|write|share|confirm|notify|assign|track|resolve|approve|deploy|monitor)[\s\S]{5,})$/i,
      // "going to / planning to + VERB + object"
      /^(?:(?:I'm|we're|I am|we are)\s+)?(?:going to|planning to)\s+((?:review|update|send|prepare|create|schedule|follow up|reach out|set up|check|finalize|submit|document|validate|implement|develop|test|fix|build|design|analyze|write|share|confirm|notify|assign|track|resolve|approve|deploy|monitor)[\s\S]{5,})$/i,
      // "let's + VERB + object"
      /^(?:let's|let us)\s+((?:review|update|send|prepare|create|schedule|set up|check|finalize|implement|develop|test|fix|build|design|analyze|write|share|confirm|deploy|monitor)[\s\S]{5,})$/i,
    ] : [
      // Imperativo directo al inicio de frase: "empieza/crea/revisa/haz + objeto"
      /^((?:empieza|inicia|crea|revisa|haz|diseña|desarrolla|construye|implementa|termina|entrega|analiza|coordina|organiza|define|configura|actualiza|verifica|contacta|llama|envía|sube|genera|evalúa|planifica|prepara|completa|redacta|documenta|establece|gestiona|presenta|propone|migra|instala|arregla|soluciona|mejora|integra|lanza)\w*\s+.{5,})$/i,
      // Infinitivo de acción al inicio de frase: "crear la página..."
      /^((?:crear|hacer|revisar|implementar|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|construir|integrar|lanzar|agregar|añadir|modificar|actualizar|documentar|validar|generar|planificar|coordinar|presentar|preparar|enviar|analizar|gestionar|evaluar|subir|corregir|mejorar|redactar)\w*\s+.{5,})$/i,
      // necesito/debo/tengo que + acción
      /^(?:necesito|debo|tengo\s+que)\s+(.{10,})$/i,
    ];

    const responsible = isEN ? 'TBD' : 'A definir';

    // ── Helper EN: extraer nombre del sujeto ────────────────────────────────
    const extractResponsible = (phrase) => {
      if (!isEN) return responsible;
      // Patrón "[Name] will/should/..."
      const m = phrase.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|should|must|needs?\s+to|has\s+to|is\s+going\s+to|can\s+you)\s/);
      if (m) {
        const skip = /^(?:The|This|That|It|So|But|And|Also|Then|Now|Here|There|Well|Just|Maybe|Please|Ok|Okay|Right|Sure|Hey|Hi)$/;
        if (!skip.test(m[1])) return m[1];
      }
      // Patrón "[Name], verb"
      const m2 = phrase.match(/([A-Z][a-z]+)[,]\s*(?:please\s+)?(?:can\s+you\s+)?(?:start|create|review|send|check|prepare|update|fix|build|design|write|finish|complete|submit|schedule|share|handle|clean|organize|order|buy|pick|call|email|book|arrange|cook|wash|mow|paint|install|repair)/i);
      if (m2) return m2[1];
      return responsible;
    };

    // ── Helper ES: extraer nombre del responsable ────────────────────────────
    // Solo asigna nombre cuando el patrón explícitamente lo capturó (2 grupos de captura)
    const extractResponsibleES = (phrase, patternMatch) => {
      if (isEN) return extractResponsible(phrase);
      // Solo usar nombre si el patrón tiene 2 capture groups → match[1]=nombre, match[2]=acción
      if (patternMatch && patternMatch[2] !== undefined) {
        const candidate = patternMatch[1];
        const notAName = /^(?:hay|los|las|una|uno|por|con|sin|del|que|nos|van|voy|haz|ten|pon|sal|ven|ver|dar|ser|me|te|le|otro|otra|esto|eso|ella|ellos|usted|ustedes|yo|tú|tal|así|más|muy|todo|ya|para|como|pero|estoy|estamos|somos|tenemos|nuestra|nuestro|esta|este)$/i;
        if (candidate && candidate.length > 2 && !notAName.test(candidate)) {
          return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
        }
      }
      return responsible;
    };

    // ── Helper: validar que la acción tiene sustancia real ────────────────────
    const hasSubstance = (action) => {
      if (!action || action.length < 8) return false;
      if (isEN) {
        const lower = action.toLowerCase().trim();
        const words = lower.split(/\s+/).filter(w => w.length > 0);

        // Descartar frases sociales
        for (const phrase of socialPhrases) {
          if (lower.startsWith(phrase)) return false;
        }
        // Descartar opiniones / sentimientos (no son tareas)
        if (/^(?:feel|think|believe|agree|disagree|hope|wish|guess|suppose|wonder|doubt|imagine)/i.test(lower)) return false;
        // Descartar negativos
        if (/^(?:not|n't|never|stop|avoid|quit|skip)\s/i.test(lower)) return false;
        // Descartar "be" no-accionable: "be at a point", "be able to find"
        if (/^be\s+(?!sure|prepared|ready|careful|responsible)/i.test(lower)) return false;

        // Pronombres vagos (referencias sin objeto concreto)
        const vaguePronouns = new Set(['it','that','this','them','those','these','him','her','one','its']);

        // Para frases cortas (≤6 palabras): exigir al menos 1 palabra concreta
        // (>3 chars, no pronombre, no verbo ultra-común, no función)
        if (words.length <= 6) {
          const trivial = new Set([
            'it','that','this','them','those','these','him','her','one','its',
            'you','your','they','their','our','his','she','we','he','my','me','us',
            'get','got','gets','getting','be','been','being','was','were','is','are','am',
            'do','did','does','done','doing','go','went','goes','gone','going',
            'have','had','has','having','take','took','taken','takes','taking',
            'make','made','makes','making','come','came','comes','coming',
            'see','saw','seen','seeing','know','knew','known','knowing',
            'put','puts','say','said','says','give','gave','given','gives',
            'find','found','finds','tell','told','tells','lead','led','leads',
            'keep','kept','let','lets','try','tried','set','sets','run','ran',
            'sort','sorted','able','just','also','still','even','well','back',
            'down','over','like','here','there','then','when','where','what',
            'which','about','after','before','with','from','into','some','each',
            'only','very','much','more','good','right','sure','fine','ready',
            'the','a','an','to','of','in','on','at','for','and','or','but',
            'if','so','up','out','not','no','by','all','own','off','now',
            // Verbos de acción comunes que necesitan objeto concreto
            'send','sent','sends','sending','call','calls','called','calling',
            'check','checks','checked','checking',
            'look','looks','looked','looking','work','works','worked','working',
            'help','helps','helped','helping','move','moves','moved','moving',
            'follow','follows','followed','following',
            'hold','holds','held','holding','read','reads','reading',
            'fill','fills','filled','filling','talk','talks','talked','talking',
            'need','needs','needed','want','wants','wanted',
            'used','uses','using','handle','handles','handled',
            'bring','brings','brought','open','opens','opened','opening',
            'close','closes','closed','closing','pick','picks','picked','picking',
            'ask','asks','asked','asking','fix','fixed','fixes','fixing',
            'sign','signed','signing','wait','waits','waited','waiting',
            'drop','drops','dropped','catch','caught','catches',
            'write','wrote','written','writes','post','posted','posts',
            'mark','marks','marked','note','notes','noted',
            'save','saves','saved','join','joins','joined',
            'test','tests','tested','turn','turns','turned',
            'push','pushed','pull','pulled','watch','watched','watches',
          ]);
          const concrete = words.filter(w => w.length > 3 && !trivial.has(w));
          if (concrete.length < 1) return false;
        }

        // Densidad de pronombres: >25% en frases < 12 palabras → rechazar
        const pronounCount = words.filter(w => vaguePronouns.has(w)).length;
        if (pronounCount >= 2 && words.length < 12 && pronounCount / words.length > 0.25) return false;

        // Mínimo 2 palabras significativas (>2 chars, no stop-words básicas)
        const stop = new Set(['the','a','an','to','of','in','on','at','for','and','or','it','is','are','was','be','do','so','but','if','my','we','i','you','our','by','up']);
        const sig = words.filter(w => w.length > 2 && !stop.has(w));
        return sig.length >= 2;
      }
      // ES: requiere un verbo/gerundio/imperativo de acción real + objeto concreto
      if (action.length < 10) return false;
      const lower = action.toLowerCase();
      // Verbos de acción: infinitivos, gerundios E imperativos
      const esActionVerb = /(?:empezar|empezando|empieza|iniciar|iniciando|inicia|crear|creando|crea|revisar|revisando|revisa|hacer|haciendo|haz|preparar|preparando|prepara|implementar|implementando|implementa|trabajar|trabajando|trabaja|armar|armando|convocar|convocando|atender|atendiendo|canalizar|canalizando|establecer|estableciendo|establece|desarrollar|desarrollando|desarrolla|diseñar|diseñando|diseña|configurar|configurando|configura|instalar|instalando|instala|definir|definiendo|define|completar|completando|completa|terminar|terminando|termina|entregar|entregando|entrega|actualizar|actualizando|actualiza|construir|construyendo|construye|integrar|integrando|integra|lanzar|lanzando|lanza|mejorar|mejorando|mejora|corregir|corrigiendo|corrige|gestionar|gestionando|gestiona|coordinar|coordinando|coordina|organizar|organizando|organiza|presentar|presentando|presenta|analizar|analizando|analiza|documentar|documentando|documenta|evaluar|evaluando|evalúa|planificar|planificando|planifica|generar|generando|genera|solicitar|solicitando|solicita|manejar|manejando|redactar|redactando|redacta|validar|validando|valida|proponer|proponiendo|investigar|investigando|producir|produciendo|migrar|migrando|subir|subiendo|sube|agregar|agregando|agrega|modificar|modificando|modifica|ajustar|ajustando|verificar|verificando|verifica|resolver|resolviendo|contactar|contactando|contacta|llamar|llamando|llama|enviar|enviando|envía|buscar|buscando|busca|comprar|comprando|compra|reservar|reservando|reserva|publicar|publicando|publica|supervisar|supervisando|supervisa|negociar|negociando|negocia|seleccionar|seleccionando|selecciona|monitorear|monitoreando|monitorea|calcular|calculando|calcula|estimar|estimando|estima)/i;
      if (!esActionVerb.test(lower)) return false;
      // Debe tener al menos 2 palabras significativas después del verbo
      const words = lower.split(/\s+/).filter(w => w.length > 2 && !/^(?:el|la|los|las|un|una|de|del|en|al|a|y|o|con|por|para|que|se|no|es|son|su|sus|lo|le|les|muy|más|ya)$/i.test(w));
      return words.length >= 2;
    };

    // ── Alta confianza ────────────────────────────────────────────────────────
    for (const phrase of phrases) {
      if (this.isJustChat(phrase, language)) continue;

      for (const pattern of highConfidencePatterns) {
        const match = phrase.match(pattern);
        if (match) {
          // Para patrón de nombre: match[2] es la acción, match[1] es el nombre
          const rawAction = match[2] ?? match[1];
          const action = this.cleanAction(rawAction.trim(), language);
          if (!hasSubstance(action)) continue;

          let deadline = noDate;
          const lowerPhrase = phrase.toLowerCase();
          for (const [key, value] of Object.entries(timeframes)) {
            if (lowerPhrase.includes(key)) { deadline = value; break; }
          }
          const who = isEN ? extractResponsible(phrase) : extractResponsibleES(phrase, match);
          tasks.push({ action, responsible: who, deadline, rawText: phrase, confidence: 'high' });
          break;
        }
      }
    }

    // ── Confianza media ───────────────────────────────────────────────────────
    if (tasks.length < 8) {
      for (const phrase of phrases) {
        if (this.isJustChat(phrase, language)) continue;
        if (tasks.some(t => t.rawText === phrase)) continue;

        for (const pattern of mediumConfidencePatterns) {
          const match = phrase.match(pattern);
          if (match) {
            const action = this.cleanAction(match[1].trim(), language);
            if (!hasSubstance(action)) continue;

            let deadline = noDate;
            const lowerPhrase = phrase.toLowerCase();
            for (const [key, value] of Object.entries(timeframes)) {
              if (lowerPhrase.includes(key)) { deadline = value; break; }
            }
            tasks.push({ action, responsible, deadline, rawText: phrase, confidence: 'medium' });
            break;
          }
        }
      }
    }

    // ── Respaldo por verbos deshabilitado ──────────────────────────────────────
    // Con oraciones completas, el escaneo por verbo suelto es demasiado ruidoso
    // tanto para ES como para EN. Los patrones de alta/media confianza son suficientes.

    return this.deduplicateTasks(tasks).slice(0, 8);
  }

  /**
   * Extrae acuerdos del texto usando patrones lingüísticos
   * Retorna array de objetos: { agreement, parties, confidence }
   */
  static extractAgreements(phrases, fullText, language = 'es') {
    const agreements = [];
    const isEN = language === 'en';

    const decisionPatterns = isEN ? [
      /(?:we agreed|we've agreed|it was agreed|agreed)\s+(?:that\s+)?(.{10,})/i,
      /(?:we decided|it was decided|the decision is|we have decided)\s+(?:that\s+)?(.{10,})/i,
      /(?:consensus|we all agree|everyone agrees)\s+(?:is|that|on)?\s+(.{10,})/i,
      /(?:we committed to|we're committed to)\s+(.{10,})/i,
      /(?:approved|confirmed|resolved|settled)\s*[:\-]?\s*(.{10,})/i,
      // "the plan is to / the goal is to + acción"
      /(?:the\s+(?:plan|goal|strategy|approach)\s+is\s+to)\s+(.{10,})/i,
      // "we're going with / we'll go with + plan"
      /(?:we're\s+going\s+with|we'll\s+go\s+with)\s+(.{10,})/i,
    ] : [
      // Patrones directos de acuerdo
      /(?:acordamos|acordaron|hemos acordado|se acordó|quedamos en)\s+(?:que\s+)?(.{10,})/i,
      /(?:decidimos|decidieron|hemos decidido)\s+(?:que\s+)?(.{10,})/i,
      /(?:consenso|definimos|establecemos|aprobamos)\s+(?:que|de)\s+(.{10,})/i,
      /(?:estamos de acuerdo|estamos todos de acuerdo)\s+(?:en que|en|con que)\s+(.{10,})/i,
      /(?:quedamos en|nos comprometemos a)\s+(.{10,})/i,
      // "de acuerdo" seguido de plan concreto
      /(?:de acuerdo)\s*(?:a ello|con eso|entonces)?[,.]?\s+(?:vamos a|se va a|hay que)\s+(.{10,})/i,
      // "nuestro objetivo (principal)? es + acción concreta" (decisión implícita)
      /(?:nuestro objetivo(?:\s+principal)?)\s+es\s+(.{15,})/i,
      // "la propuesta es/consiste en + detalle"
      /(?:la propuesta(?:\s+que tenemos)?)\s+(?:es|será|consiste en)\s+(.{15,})/i,
    ];

    const agreementKeywords = isEN
      ? ['agreed', 'agreement', 'decided', 'decision', 'consensus', 'committed', 'approved', 'confirmed', 'resolved']
      : ['acordamos', 'decidimos', 'se acordó', 'consenso', 'quedamos en', 'confirmamos', 'establecemos', 'aprobamos', 'comprometemos', 'definimos', 'resolvimos', 'nuestro objetivo'];

    const parties = isEN ? 'Team' : 'Equipo';

    // Filtra frases vacías o de relleno que parecen acuerdos pero no lo son
    const isVagueAgreement = (text) => {
      const t = text.trim().toLowerCase();
      if (t.length < 12) return true;
      const vague = [
        /^de acuerdo a (?:ello|esto|eso|eso mismo)/,
        /^de acuerdo$/,
        /^estamos de acuerdo$/,
        /^en(?:\s+total)? acuerdo$/,
        /^(?:sí|no)[,.]?\s+de acuerdo/,
        /^todo (?:bien|correcto|ok)$/,
        /^(?:claro|perfecto|listo|bien|vale|ok)$/,
        /^(?:eso es todo|nada más|así es|correcto)[.!]?$/,
      ];
      return vague.some(p => p.test(t));
    };

    for (let phrase of phrases) {
      if (this.isJustChat(phrase, language)) continue;
      for (let pattern of decisionPatterns) {
        const match = phrase.match(pattern);
        if (match) {
          const agreement = match[1].trim().replace(/[.!?]+$/, '');
          if (agreement.length > 10 && !isVagueAgreement(agreement)) {
            if (!agreements.some(a => a.rawText === phrase)) {
              agreements.push({ agreement, parties, rawText: phrase, confidence: 'high' });
            }
          }
          break;
        }
      }
    }

    if (agreements.length < 4) {
      for (let phrase of phrases) {
        if (this.isJustChat(phrase, language)) continue;
        if (isVagueAgreement(phrase)) continue;
        const lowerPhrase = phrase.toLowerCase();
        for (let keyword of agreementKeywords) {
          if (lowerPhrase.includes(keyword) && !agreements.some(a => a.rawText === phrase)) {
            if (phrase.trim().length > 15) {
              agreements.push({ agreement: phrase, parties, rawText: phrase, confidence: 'medium' });
            }
            break;
          }
        }
      }
    }

    return this.deduplicateAgreements(agreements).slice(0, 6);
  }

  /**
   * Extrae la próxima reunión del texto
   * Busca palabras clave como: "próxima reunión", "siguiente reunión", "próximo"
   */
  static extractNextMeeting(text, language = 'es') {
    const isEN = language === 'en';
    const meetingKeywords = isEN
      ? ['next meeting', 'next session', 'following meeting', 'next call', 'next sync', 'schedule a meeting', 'set up a meeting']
      : ['próxima reunión', 'siguiente reunión', 'nos vemos el', 'próximo encuentro', 'siguiente junta', 'la próxima vez'];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    const datePatterns = isEN ? [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    ] : [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,
      /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
    ];

    for (let sentence of sentences) {
      if (meetingKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        // Buscar fechas en la frase
        for (let pattern of datePatterns) {
          const dateMatch = sentence.match(pattern);
          if (dateMatch) {
            return {
              text: sentence.trim(),
              date: dateMatch[0],
            };
          }
        }
        // Si no hay fecha, retornar la frase completa
        if (sentence.trim().length > 5) {
          return {
            text: sentence.trim(),
            date: null,
          };
        }
      }
    }

    return null;
  }

  /**
   * Limpia muletillas, conectores vacíos y capitaliza la primera letra.
   * Garantiza que la tarea empiece directamente con el verbo de acción.
   */
  static cleanAction(text, language = 'es') {
    let s = text.trim();

    if (language === 'en') {
      // Ruido al inicio (más agresivo)
      const noiseStart = /^(?:um+|uh+|like|so|well|you know|basically|actually|I mean|and\s+|also\s+|then\s+|right\s+|just\s+|maybe\s+|perhaps\s+|really\s+|kind of\s+|sort of\s+|i guess\s+|literally\s+|I think\s+|yeah\s+|ok\s+|okay\s+|alright\s+)\s*/i;
      let prev = '';
      while (prev !== s) { prev = s; s = s.replace(noiseStart, ''); }

      // Quitar sujeto redundante al inicio: "I will review" → "review"
      s = s.replace(/^(?:I|we|you|he|she|they)\s+(?:will|should|must|need\s+to|have\s+to|can|could|want\s+to|plan\s+to|'d\s+like\s+to|would\s+like\s+to)\s+/i, '');
      s = s.replace(/^(?:I'm|we're|you're)\s+(?:going\s+to|gonna|planning\s+to)\s+/i, '');
      // Quitar contracciones: "I'll review" → "review"
      s = s.replace(/^(?:I'll|we'll|you'll|he'll|she'll|they'll)\s+/i, '');
      // Quitar "do is" / "do is to" remanente de frases como "what we need to do is update..."
      s = s.replace(/^do\s+is\s+(?:to\s+)?/i, '');

      // Quitar muletillas de cortesía al final
      s = s.replace(/\s+(?:if needed|if possible|as soon as possible|asap|when possible|when you can|at your earliest convenience|if you don't mind|if you would|if that's okay|if that works)\s*$/i, '');
      // Quitar preposiciones/conjunciones colgantes al final
      s = s.replace(/\s+(?:by|to|for|with|from|in|on|at|of|and|or|but|the|a|an)\s*$/i, '');

      // Truncar en cláusulas secundarias si es muy largo
      if (s.length > 90) {
        const cut = s.search(/\s+(?:so that|in order to|because|since|although|but first|however|which means|which will|just because|as an example|over lengthening|and that way|and so|and then|given all|if you haven't|if you don't|if you haven)\s/i);
        if (cut > 15) s = s.substring(0, cut);
      }
      // Si aún largo (>120), cortar en la primera coma después de 40 chars
      if (s.length > 120) {
        const commaPos = s.indexOf(',', 40);
        if (commaPos > 40) s = s.substring(0, commaPos);
      }
    } else {
      // Verbos direccionales de movimiento al inicio: "ve y X", "anda y X"
      s = s.replace(/^(?:ve|anda|sal|vete|pasa|ven|baja|sube)\s+(?:[ay]\s+)?/i, '');
      // Tratamiento al inicio: "tú X" → quitar el "tú"
      s = s.replace(/^tú\s+/i, '');
      // Ruido de relleno al inicio
      const noise = /^(?:mmm+|eh+|ah+|este|pues|bueno|o sea|osea|es decir|entonces|bien|venga|mira|oye|haber|a ver|ser|que\s+|lo que hay que|lo que se va a|van a haber|va a haber|hay que|lo de|de\s+|la de|el de)\s*/i;
      let prev = '';
      while (prev !== s) { prev = s; s = s.replace(noise, ''); }
      s = s.replace(/^([a-záéíóúüñ]+)(lo|la|los|las|les)\s+/i, '$1 ');

      // Truncar acciones muy largas (>100 chars) en el primer conector secundario
      if (s.length > 100) {
        const cut = s.search(/\s+(?:para que|para poder|porque|ya que|aunque|sin embargo|pero|donde|cuando|como|quienes|dentro de sus|bueno|teniendo|siempre apuntando)\s/i);
        if (cut > 15) s = s.substring(0, cut);
      }
      // Si aún es largo (>120), cortar en la primera coma después de posición 40
      if (s.length > 120) {
        const commaPos = s.indexOf(',', 40);
        if (commaPos > 40) s = s.substring(0, commaPos);
      }
    }

    s = s.trim();
    s = s.replace(/[.!?]+$/, '');
    if (s.length < 4) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Determina si una oración es solo charla casual
   * Solo filtra frases cortas que sean únicamente chat
   */
  static isJustChat(sentence, language = 'es') {
    const s = sentence.toLowerCase().trim();

    // Para ES: filtrar introducciones, descripciones, saludos incluso si son largos
    if (language !== 'en') {
      // Introducciones personales
      if (/(?:mi nombre es|me llamo|soy (?:el|la|un|una)\s+(?:gerente|supervisor|director|coordinador|jefe|encargad))/i.test(s)) return true;
      // Saludos extendidos (sin verbo de acción)
      if (/^(?:muy\s+)?(?:buenas?\s+(?:noches?|tardes?|días?)|hola)/i.test(s) && !/(?:vamos a|voy a|estoy|estamos|hay que|tiene que|necesita|debe)/i.test(s)) return true;
      // Descripciones de empresa/equipo
      if (/^(?:nosotros\s+)?somos\s+(?:una|un|la|el)/i.test(s) && !/(?:vamos a|voy a|hay que|tiene que)/i.test(s)) return true;
      if (/^tenemos\s+(?:nuestra|nuestro|un|una|la|el)/i.test(s) && !/(?:vamos a|voy a|hay que|tiene que)/i.test(s)) return true;
      // Bienvenidas, transiciones, cortesías
      if (/(?:te escuchamos|le escuchamos|muchas gracias|bienvenido|bienvenida|es un honor|es un gusto|es un placer|es grato dirigir)/i.test(s) && !/(?:vamos a|voy a|hay que|tiene que)/i.test(s)) return true;
      // Convocatorias/anuncios (no son tareas)
      if (/(?:han sido convocados|han sido presentados|serán presentados|fueron convocados)/i.test(s)) return true;
      // Contexto puro sin acción
      if (/^(?:para los que|los que recién|en este caso)/i.test(s) && !/(?:vamos a|voy a|hay que|tiene que|estoy|estamos)/i.test(s)) return true;
      // Sabemos que / queremos ejecutivos / etc. (declaraciones)
      if (/^(?:pero\s+)?(?:sabemos|queremos|creemos|pensamos|esperamos)\s+que\s/i.test(s) && !/(?:vamos a|voy a|hay que|tiene que)/i.test(s)) return true;
      // Frases de cierre de turno
      if (/^(?:muchas gracias|muchísimas gracias|gracias por|es todo por mi parte)/i.test(s)) return true;
    }

    // Para EN: filtrar opiniones, sentimientos, comentarios (largo o corto)
    if (language === 'en') {
      // Opiniones puras / sentimientos
      if (/(?:I feel|I think|I believe|I agree|I disagree|in my opinion|my feeling is|my thought is|I hope|I wish)\b/i.test(s) && !/(?:we should|we need|let's|make sure|don't forget|please|will |I'll |'m going|going to|need to|have to)\b/i.test(s)) return true;
      // Comentarios: "the general meaning is...", "it's largely the same..."
      if (/^(?:the\s+)?(?:general|overall|main|basic)\s+(?:meaning|idea|point|concept|theme|takeaway)/i.test(s) && !/(?:we should|we need|let's|make sure)\b/i.test(s)) return true;
      // "we shouldn't / we can't / don't" sin acción positiva (prohibiciones, no tareas)
      if (/(?:we shouldn't|we can't|we won't|we don't|shouldn't be|can't be|won't be)\b/i.test(s) && !/(?:instead|but we should|but we can|make sure)\b/i.test(s)) return true;
      // "just be aware" / "feel free" / "just a heads up" / "it's a reminder"
      if (/(?:just be aware|feel free|just a heads up|it's a reminder|this is just|FYI|for your information|just to note|just wanted to say|just sharing)\b/i.test(s)) return true;
      // Introducciones: "hi everyone", "my name is", "I'm the manager of"
      if (/(?:my name is|I'm\s+(?:the|a)\s+(?:manager|director|lead|coordinator|head)|hi\s+everyone|hello\s+everyone|welcome\s+everyone|good\s+(?:morning|afternoon|evening)\s+everyone)/i.test(s) && !/(?:we should|we need|let's|make sure)\b/i.test(s)) return true;
      // Thank you / appreciation without action
      if (/^(?:thank you|thanks|great job|well done|appreciate|kudos|props|shout out)/i.test(s) && !/(?:please|make sure|need to|should)\b/i.test(s)) return true;
    }

    if (language === 'en' && s.split(/\s+/).length > 15) return false;

    const chatPatterns = language === 'en' ? [
      // Afirmaciones / negaciones simples
      /^(?:yes|no|yep|nope|ok|okay|sure|got it|understood|right|correct|exactly|perfect|good|great|alright|absolutely|definitely|of course|for sure|sounds good|makes sense)[\.!]?$/i,
      // Sociales/cortesía
      /^(?:haha|lol|thanks|thank you|you're welcome|welcome|cheers|congrats|congratulations|appreciate it|awesome|cool|nice|wow|great job|well done)[\.!]?$/i,
      // Saludos
      /^(?:hi+|hello+|hey+|howdy)[\.!,]?(?:\s+\w+)?$/i,
      /^(?:good\s+(?:morning|afternoon|evening|night))[\.!]?(?:\s+\w+)?$/i,
      // Fillers solos
      /^(?:um+|uh+|hmm+|er+)[\.!]?$/i,
      // Preguntas abiertas cortas sin contexto de acción
      /^(?:how|what|when|where|who|why|which|do you|did you|are you|is this|can you|could you)\s+(?:\w+\s?){0,2}[?]?$/i,
      // Frases de cierre comunes
      /^(?:bye|goodbye|see you|talk soon|take care|have a good|have a great|nice talking|catch you later)[\.!]?(?:\s+\w+)?$/i,
      // Frases de contexto puro ("as I mentioned", "like I said", etc.)
      /^(?:as I (?:mentioned|said|noted)|like I said|you know what I mean|if that makes sense|does that make sense|just to clarify|just to confirm|just wanted to say)[\.!,]?$/i,
      // Social openers sin tarea
      /^(?:I just wanted to|just wanted to mention|just a heads up|by the way|anyway|moving on)\s*$/i,
    ] : [
      /^(?:sí|no|bueno|ok|vale|está bien|claro|entendido|exacto|perfecto|correcto|listo|dale)[\.!]?$/i,
      /^(?:jaja|jjj|je|jeje|risas|gracias|de nada|bienvenida|bienvenido|de acuerdo)[\.!]?$/i,
      /^(?:hola\s*)+[\.!]?$/i,
      /^(?:buenos días|buenas noches|buenas tardes)[\.!]?(?:\s+\w+)?$/i,
      /^mmm+[\.!]?$/i,
      /^(?:cómo|qué|cuándo|dónde|quién|por qué|para qué)\s+(?:\w+\s?){0,2}[?]?$/i,
      // Frases de cortesía y transición
      /^(?:ahora sí|ahora queremos|ahora vamos|por eso que|por eso es que)[\.!,]?$/i,
      // "Es un honor/gusto" cortas
      /^(?:es un (?:honor|gusto|placer))[\.!]?$/i,
    ];

    return chatPatterns.some(pattern => pattern.test(s));
  }

  /**
   * Elimina tareas duplicadas
   */
  static deduplicateTasks(tasks) {
    const unique = [];
    const seen = new Set();

    for (let task of tasks) {
      const normalized = task.action
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      const key = normalized.substring(0, 25);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(task);
      }
    }

    return unique;
  }

  /**
   * Elimina acuerdos duplicados
   */
  static deduplicateAgreements(agreements) {
    const unique = [];
    const seen = new Set();

    for (let agreement of agreements) {
      const normalized = agreement.agreement
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      const key = normalized.substring(0, 30);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(agreement);
      }
    }

    return unique;
  }

  /**
   * Prepara datos para usar con API de OpenAI (estructura futura)
   */
  static prepareForOpenAIAPI(processed) {
    return {
      text: processed.rawText,
      tasks: processed.tasks.map(t => ({
        type: 'task',
        content: t.action,
        responsible: t.responsible,
        deadline: t.deadline,
        confidence: t.confidence,
      })),
      agreements: processed.agreements.map(a => ({
        type: 'agreement',
        content: a.agreement,
        confidence: a.confidence,
      })),
      nextMeeting: processed.nextMeeting,
    };
  }

  /**
   * Formatea un objeto de reunión procesada para guardar en localStorage
   */
  static formatForStorage(processed, title = '') {
    return {
      id: Date.now(),
      title: title || `Reunión ${new Date().toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
      ...processed,
    };
  }
}

export default MeetingProcessor;
