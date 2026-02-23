/**
 * Web Worker: carga Whisper tiny en el navegador via Transformers.js
 * y transcribe archivos de audio/video sin coste ni API key.
 *
 * El modelo (~75 MB) se descarga de HuggingFace la primera vez
 * y queda cacheado en el navegador indefinidamente.
 */
import { pipeline, env } from '@xenova/transformers';

// ── Apuntar los archivos WASM de ONNX Runtime al CDN de jsDelivr ─────────────
// Esto resuelve el error "Cannot read properties of undefined (reading
// 'registerBackend')" que ocurre cuando Vite no puede servir los .wasm
// desde node_modules dentro de un Web Worker.
env.backends.onnx.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

// Ya estamos en un Worker — no necesitamos otro proxy interno de ONNX
env.backends.onnx.wasm.proxy = false;

// Solo modelos remotos (HuggingFace CDN); cachear en IndexedDB del navegador
env.allowLocalModels = false;
env.useBrowserCache  = true;

let transcriber = null;

async function getTranscriber(onProgress) {
  if (transcriber) return transcriber;
  transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny',          // ~75 MB — rápido y gratis
    { progress_callback: onProgress }
  );
  return transcriber;
}

self.addEventListener('message', async ({ data }) => {
  const { audioUrl, language } = data;

  try {
    // ── 1. Cargar / usar modelo cacheado ──────────────────────────────
    const t = await getTranscriber((p) => {
      self.postMessage({ type: 'progress', data: p });
    });

    // ── 2. Transcribir ───────────────────────────────────────────────
    self.postMessage({ type: 'status', message: 'transcribing' });

    const langMap = { es: 'spanish', en: 'english' };
    const result  = await t(audioUrl, {
      language:          langMap[language] ?? 'spanish',
      task:              'transcribe',
      chunk_length_s:    30,
      stride_length_s:   5,
      return_timestamps: false,
    });

    self.postMessage({ type: 'result', text: result.text });

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
});


self.addEventListener('message', async ({ data }) => {
  const { audioUrl, language } = data;

  try {
    // ── 1. Cargar / usar modelo cacheado ──────────────────────────────
    const t = await getTranscriber((p) => {
      self.postMessage({ type: 'progress', data: p });
    });

    // ── 2. Transcribir ───────────────────────────────────────────────
    self.postMessage({ type: 'status', message: 'transcribing' });

    const langMap = { es: 'spanish', en: 'english' };
    const result  = await t(audioUrl, {
      language:          langMap[language] ?? 'spanish',
      task:              'transcribe',
      chunk_length_s:    30,
      stride_length_s:   5,
      return_timestamps: false,
    });

    self.postMessage({ type: 'result', text: result.text });

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
});
