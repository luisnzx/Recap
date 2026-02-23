/**
 * Transcribe audio/video usando Groq — GRATIS y ultrarrápido.
 *
 * Groq corre Whisper large-v3-turbo en hardware LPU propio.
 * • 14 400 peticiones/día gratis (sin tarjeta de crédito)
 * • Transcribe archivos de minutos en SEGUNDOS
 * • API key gratuita en https://console.groq.com
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// ─── Detección de idioma por heurística de palabras clave ───────────────────────
/**
 * Detecta si el texto transcrito es mayoritariamente inglés o español.
 * @param {string} text
 * @returns {'en' | 'es'}
 */
export function detectLanguage(text) {
  if (!text) return 'es';
  const lower = text.toLowerCase();

  // Contar ocurrencias (no solo presencia) para ser más robusto
  const countOccurrences = (str, words) => {
    let total = 0;
    for (const w of words) {
      let idx = 0;
      while ((idx = str.indexOf(w, idx)) !== -1) { total++; idx += w.length; }
    }
    return total;
  };

  const enWords = [
    ' the ', ' a ', ' an ', ' is ', ' are ', ' was ', ' were ', ' will ', ' have ', ' has ',
    ' to ', ' of ', ' in ', ' that ', ' this ', ' it ', ' we ', ' they ', ' you ',
    ' and ', ' for ', ' with ', ' on ', ' at ', ' from ', ' our ', ' your ', ' their ',
    ' don\'t ', ' can ', ' would ', ' should ', ' going ', ' want ', ' need ',
    ' make ', ' sure ', ' think ', ' know ', ' like ', ' just ', ' about ',
    ' but ', ' not ', ' so ', ' because ', ' if ', ' when ', ' what ',
  ];

  const esWords = [
    ' el ', ' la ', ' los ', ' las ', ' un ', ' una ', ' es ', ' son ', ' fue ',
    ' que ', ' de ', ' en ', ' por ', ' con ', ' para ', ' del ', ' al ',
    ' nos ', ' les ', ' sus ', ' esto ', ' este ', ' esta ',
    ' hay ', ' vamos ', ' hacer ', ' tenemos ', ' también ',
    ' todo ', ' pero ', ' como ', ' muy ', ' más ',
    ' no ', ' se ', ' lo ', ' su ', ' ya ',
  ];

  const enScore = countOccurrences(' ' + lower + ' ', enWords);
  let esScore = countOccurrences(' ' + lower + ' ', esWords);

  // Caracteres españoles típicos refuerzan ES
  const spanishChars = (text.match(/[áéíóúüñ¿¡]/gi) || []).length;
  esScore += Math.min(spanishChars * 0.5, 10);

  return enScore > esScore ? 'en' : 'es';
}

// ─── Error especial para rate-limit (429) ────────────────────────────────────
export class RateLimitError extends Error {
  /**
   * @param {string} message  - Mensaje original de Groq
   * @param {number} retrySec - Segundos hasta que el límite se resetee
   */
  constructor(message, retrySec) {
    super(message);
    this.name = 'RateLimitError';
    this.retrySec = retrySec;
  }
}

/** Extrae los segundos de espera de un mensaje tipo "Please try again in 12m47.5s" */
function parseRetrySeconds(msg) {
  const m = msg.match(/(\d+)m([\d.]+)s/);
  if (m) return Math.ceil(Number(m[1]) * 60 + Number(m[2]));
  const sOnly = msg.match(/(\d+\.?\d*)s/);
  if (sOnly) return Math.ceil(Number(sOnly[1]));
  return 60; // fallback 1 min
}

/**
 * @param {File}     file       - Archivo de audio o video
 * @param {string}   language   - 'es' | 'en'
 * @param {Function} onProgress - Callback de estado
 * @returns {Promise<string>}   - Texto transcrito
 */
export async function transcribeFile(file, language = 'es', onProgress) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Falta VITE_GROQ_API_KEY en tu archivo .env. ' +
      'Obtén una clave GRATIS en https://console.groq.com'
    );
  }

  // Groq acepta hasta 25 MB
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('El archivo supera el límite de 25 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-large-v3-turbo');
  // NO pasar language: dejar que Whisper auto-detecte el idioma del audio
  // Esto evita que fuerce español en audio inglés (produciendo Spanglish)
  formData.append('response_format', 'text');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progreso real de subida: 0 → 55 %
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 55);
        onProgress?.({ status: 'uploading', pct });
      }
    });

    // Subida completa → empieza transcripción en Groq: 60 %
    xhr.upload.addEventListener('load', () => {
      onProgress?.({ status: 'transcribing', pct: 60 });
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText.trim());
      } else if (xhr.status === 429) {
        // ── Rate limit: extraer tiempo de espera ──────────────
        let msg = `Error de Groq API (429)`;
        let retrySec = 60;
        try {
          const body = JSON.parse(xhr.responseText);
          msg = body?.error?.message ?? msg;
          retrySec = parseRetrySeconds(msg);
        } catch { /* keep defaults */ }
        reject(new RateLimitError(msg, retrySec));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message ?? `Error de Groq API (${xhr.status})`));
        } catch {
          reject(new Error(`Error de Groq API (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Error de red al contactar Groq API'))
    );
    xhr.addEventListener('abort', () =>
      reject(new Error('Petición cancelada'))
    );

    xhr.open('POST', GROQ_URL);
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
    onProgress?.({ status: 'uploading', pct: 0 });
    xhr.send(formData);
  });
}
