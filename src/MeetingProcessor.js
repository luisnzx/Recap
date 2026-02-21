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
  static processText(text) {
    if (!text || typeof text !== 'string') {
      return {
        tasks: [],
        agreements: [],
        nextMeeting: null,
        rawText: text,
      };
    }

    // Dividir en frases más pequeñas para mejor análisis
    const phrases = this.splitIntoPhrases(text);
    
    const tasks = this.extractTasks(phrases, text);
    const agreements = this.extractAgreements(phrases, text);
    const nextMeeting = this.extractNextMeeting(text);

    return {
      tasks, // Array de objetos con action, responsible, deadline
      agreements,
      nextMeeting,
      rawText: text,
    };
  }

  /**
   * Divide el texto en frases más pequeñas para mejor análisis
   */
  static splitIntoPhrases(text) {
    const raw = text
      .split(/[.!?]+/)
      .flatMap(s => s.split(','))
      .flatMap(s => s.split(/\s+y\s+/))
      .flatMap(s => s.split(';'))
      // Separadores de listas orales: "otro", "otra", "también", numerales ordinales
      .flatMap(s => s.split(/\s+otro\s+|\s+otra\s+/i))
      .flatMap(s => s.split(/\s+también\s+/i))
      .flatMap(s => s.split(/\s+(?:primero|segundo|tercero|cuarto|quinto|además)\s+/i))
      .map(s => s.trim())
      .filter(s => s.length > 3);

    // Quitar ruido de saludo al inicio de frases largas
    // "hola hola hola van a haber..." → "van a haber..."
    const chatNoise = /^(?:hola\s+|buenos\s+días\s+|buenas\s+(?:tardes|noches)\s+|oye\s+|eh\s+|mmm+\s+)+/i;
    return raw.map(s => s.replace(chatNoise, '').trim()).filter(s => s.length > 3);
  }

  /**
   * Extrae tareas del texto usando patrones lingüísticos mejorados
   * Retorna array de objetos: { action, responsible, deadline, confidence }
   * Compatible con OpenAI API para procesamiento futuro
   */
  static extractTasks(phrases, fullText) {
    const tasks = [];

    // Palabras clave de acciones/verbos (para respaldo)
    const actionVerbs = [
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

    // Palabras de límite temporal
    const timeframes = {
      'hoy': 'Hoy',
      'mañana': 'Mañana',
      'esta semana': 'Esta semana',
      'próxima semana': 'Próxima semana',
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miércoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'antes del': 'Antes del',
      'para': 'Para',
    };

    // Patrones de muy alta confianza
    const highConfidencePatterns = [
      /^(?:(?:Luis|Juan|María|Pedro|Ana|Carlos|Rosa|Miguel|Diego|Sofia|Pablo|Jennifer|Roberto|Laura|Antonio|Cristina|yo|tú|él|ella|nosotros|ustedes)\s+)?(?:tiene que|necesita|debe|va a|hará|puede|podría)\s+(.+?)(?:\s+(?:mañana|hoy|esta semana|próximo|el|antes|para|por))?$/i,
      /^(?:me|te|le|nos|os|les)\s+(?:encargó|encargaron|pidió|pidieron|dio|dieron|encargamos)\s+(?:que\s+)?(.+?)(?:\s+(?:mañana|hoy|esta semana))?$/i,
      // Enumeración oral: "una va a ser X", "uno va a ser X", "una es X"
      /^(?:una|uno|un)\s+(?:va a ser|es|será|sería)\s+(.+)$/i,
      // Lista con "tarea": "la tarea es X", "tarea: X"
      /^(?:la\s+)?tarea\s+(?:es|será|consiste en)\s+(.+)$/i,
    ];

    // Patrones de alta confianza
    const mediumConfidencePatterns = [
      /^(?:van a|vamos a|voy a|va a)\s+(.+?)(?:\s+(?:mañana|hoy|esta semana|próximo|el))?$/i,
      /^(?:necesito|debo|hay que|tengo que|debes|debe|necesitas)\s+(.+?)(?:\s+(?:mañana|hoy|esta semana|próximo))?$/i,
      // "crearlos los métodos" / "crear las funciones" — infinitivo al inicio
      /^((?:crear|hacer|revisar|implementar|desarrollar|diseñar|configurar|instalar|definir|completar|terminar|entregar|construir|integrar|lanzar|saltar|agregar|añadir|modificar|actualizar|documentar|validar|generar|planificar|coordinar|presentar|preparar|enviar|analizar|gestionar|evaluar|subir|corregir|mejorar|redactar)[a-záéíóúüñ]*\s+.{3,})$/i,
    ];

    // Procesamiento con patrones de alta confianza
    for (let phrase of phrases) {
      if (this.isJustChat(phrase)) continue;

      for (let pattern of highConfidencePatterns) {
        const match = phrase.match(pattern);
        if (match) {
          const action = this.cleanAction(match[1].trim());
          if (!action) break;
          
          let deadline = 'Sin fecha';
          const lowerPhrase = phrase.toLowerCase();
          for (let [key, value] of Object.entries(timeframes)) {
            if (lowerPhrase.includes(key)) {
              deadline = value;
              break;
            }
          }

          tasks.push({
            action: action,
            responsible: 'A definir',
            deadline: deadline,
            rawText: phrase,
            confidence: 'high',
          });
          break;
        }
      }
    }

    // Patrones de confianza media
    if (tasks.length < 3) {
      for (let phrase of phrases) {
        if (this.isJustChat(phrase)) continue;

        for (let pattern of mediumConfidencePatterns) {
          const match = phrase.match(pattern);
          if (match) {
            const action = this.cleanAction(match[1].trim());
            if (!action) break;

            let deadline = 'Sin fecha';
            const lowerPhrase = phrase.toLowerCase();
            for (let [key, value] of Object.entries(timeframes)) {
              if (lowerPhrase.includes(key)) {
                deadline = value;
                break;
              }
            }

            tasks.push({
              action: action,
              responsible: 'A definir',
              deadline: deadline,
              rawText: phrase,
              confidence: 'medium',
            });
            break;
          }
        }
      }
    }

    // Respaldo: buscar por verbos de acción
    if (tasks.length < 5) {
      for (let phrase of phrases) {
        if (this.isJustChat(phrase)) continue;

        const lowerPhrase = phrase.toLowerCase();
        for (let verb of actionVerbs) {
          if (lowerPhrase.includes(verb) && !tasks.some(t => t.action === phrase)) {
            const verbIndex = lowerPhrase.indexOf(verb);
            const action = this.cleanAction(phrase.substring(verbIndex).trim());

            if (action.length > 8) {
              let deadline = 'Sin fecha';
              for (let [key, value] of Object.entries(timeframes)) {
                if (lowerPhrase.includes(key)) {
                  deadline = value;
                  break;
                }
              }

              tasks.push({
                action: action,
                responsible: 'A definir',
                deadline: deadline,
                rawText: phrase,
                confidence: 'low',
              });
              break;
            }
          }
        }
      }
    }

    // Eliminar duplicados por similitud
    return this.deduplicateTasks(tasks).slice(0, 8);
  }

  /**
   * Extrae acuerdos del texto usando patrones lingüísticos
   * Retorna array de objetos: { agreement, parties, confidence }
   */
  static extractAgreements(phrases, fullText) {
    const agreements = [];

    // Patrones de decisión/consenso (muy confiables)
    const decisionPatterns = [
      /^(?:acordamos|acordaron|hemos acordado|se acordó|quedamos en)\s+(?:que\s+)?(.+?)$/i,
      /^(?:decidimos|decidieron|hemos decidido)\s+(?:que\s+)?(.+?)$/i,
      /^(?:consenso|definimos|establecemos|aprobamos)\s+(?:que|de)\s+(.+?)$/i,
      /^(?:estamos de acuerdo|estamos) (?:en que|en)\s+(.+?)$/i,
      /^(?:quedamos en|nos comprometemos a)\s+(.+?)$/i,
    ];

    // Palabras clave de acuerdos
    const agreementKeywords = [
      'acordamos', 'acuerdo', 'decidimos', 'se acordó', 'consenso',
      'quedamos', 'confirmamos', 'establecemos', 'aprobamos', 'comprometemos'
    ];

    // Procesar frases con patrones firmes
    for (let phrase of phrases) {
      if (this.isJustChat(phrase)) continue;

      for (let pattern of decisionPatterns) {
        const match = phrase.match(pattern);
        if (match) {
          const agreement = match[1].trim();
          if (agreement.length > 5) {
            agreements.push({
              agreement: agreement,
              parties: 'Equipo',
              rawText: phrase,
              confidence: 'high',
            });
          }
          break;
        }
      }
    }

    // Respaldo: palabras clave
    if (agreements.length < 4) {
      for (let phrase of phrases) {
        if (this.isJustChat(phrase)) continue;

        const lowerPhrase = phrase.toLowerCase();
        for (let keyword of agreementKeywords) {
          if (lowerPhrase.includes(keyword) && !agreements.some(a => a.agreement === phrase)) {
            agreements.push({
              agreement: phrase,
              parties: 'Equipo',
              rawText: phrase,
              confidence: 'medium',
            });
            break;
          }
        }
      }
    }

    // Eliminar duplicados
    return this.deduplicateAgreements(agreements).slice(0, 6);
  }

  /**
   * Extrae la próxima reunión del texto
   * Busca palabras clave como: "próxima reunión", "siguiente reunión", "próximo"
   */
  static extractNextMeeting(text) {
    const meetingKeywords = ['próxima reunión', 'siguiente reunión', 'próximo', 'next meeting', 'reunión', 'junta', 'mitin'];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    // Buscar menciones de fechas o tiempos
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,      // DD/MM/YYYY
      /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,  // Días
      /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,  // Meses
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
  static cleanAction(text) {
    let s = text.trim();

    // Quitar muletillas y ruido al inicio (puede haber varias seguidas)
    const noise = /^(?:mmm+|eh+|ah+|este|pues|bueno|o sea|osea|es decir|entonces|bien|venga|mira|oye|haber|a ver|ser|que\s+|lo que hay que|lo que se va a|van a haber|va a haber|hay que|lo de|de\s+|la de|el de)\s*/i;
    let prev = '';
    while (prev !== s) {
      prev = s;
      s = s.replace(noise, '');
    }

    // «crearlos» → «crear» (pronombre clítico pegado al infinitivo)
    s = s.replace(/^([a-záéíóúüñ]+)(lo|la|los|las|les)\s+/i, '$1 ');

    s = s.trim();
    if (s.length < 4) return '';

    // Capitalizar primera letra
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Determina si una oración es solo charla casual
   * Solo filtra frases cortas que sean únicamente chat
   */
  static isJustChat(sentence) {
    const s = sentence.toLowerCase().trim();

    // Nunca filtrar frases largas (pueden contener tareas aunque empiecen con saludo)
    if (s.split(/\s+/).length > 6) return false;

    const chatPatterns = [
      /^(?:sí|no|bueno|ok|vale|está bien|claro|entendido|exacto|perfecto|correcto)$/i,
      /^(?:jaja|jjj|je|jeje|risas|gracias|de nada|bienvenida|bienvenido|gracias|de acuerdo)$/i,
      /^(?:hola\s*)+$/i,  // Solo "hola hola hola" sin nada más
      /^(?:buenos días|buenas noches|buenas tardes)$/i,
      /^mmm+$/i,
      /^(?:cómo|qué|cuándo|dónde|quién|por qué|para qué)\s/i,
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
