import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileAudio, Film, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { RateLimitError, detectLanguage } from '../whisper.js';

const ACCEPTED      = ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.webm', '.mpeg', '.mpga'];
const ACCEPTED_MIME = ['audio/', 'video/'];

function isValidFile(file) {
  if (!file) return false;
  const ext  = '.' + file.name.split('.').pop().toLowerCase();
  const mime = file.type;
  return (
    ACCEPTED.includes(ext) ||
    ACCEPTED_MIME.some(m => mime.startsWith(m))
  );
}

// ─── Estados visuales ────────────────────────────────────────────────────────
const IDLE       = 'idle';
const DRAG_OVER  = 'dragover';
const PROCESSING = 'processing';
const WAITING    = 'waiting';   // countdown antes de auto-retry
const ERROR_ST   = 'error';

export default function UploadZone({ onTranscribed, disabled }) {
  const { themeVars, language } = useSettings();
  const isES       = language !== 'en';
  const inputRef   = useRef(null);

  const [uiState,      setUiState]      = useState(IDLE);
  const [fileName,     setFileName]     = useState('');
  const [progress,     setProgress]     = useState('');
  const [progressPct,  setProgressPct]  = useState(0);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [countdown,    setCountdown]    = useState(0);   // segundos restantes
  const pctIntervalRef  = useRef(null);
  const countdownRef    = useRef(null);
  const pendingFileRef  = useRef(null);   // archivo pendiente de retry

  // Limpiar intervalos si el componente se desmonta
  useEffect(() => () => {
    clearInterval(pctIntervalRef.current);
    clearInterval(countdownRef.current);
  }, []);

  // ─── Handlers de drag & drop ───────────────────────────────────────────────
  const onDragOver = e => {
    e.preventDefault();
    if (!disabled) setUiState(DRAG_OVER);
  };
  const onDragLeave = e => {
    e.preventDefault();
    setUiState(IDLE);
  };
  const onDrop = e => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };
  const onInputChange = e => {
    handleFile(e.target.files[0]);
    e.target.value = '';           // allow re-select same file
  };

  // ─── Iniciar countdown de rate-limit ───────────────────────────────────────
  const startCountdown = useCallback((seconds, file) => {
    pendingFileRef.current = file;
    setCountdown(seconds);
    setUiState(WAITING);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          // Auto-retry
          const pending = pendingFileRef.current;
          if (pending) {
            pendingFileRef.current = null;
            // pequeño delay para que el estado se actualice
            setTimeout(() => processFile(pending), 200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── Procesar archivo (core) ───────────────────────────────────────────────
  const processFile = async (file) => {
    setFileName(file.name);
    setProgressPct(0);
    setUiState(PROCESSING);
    setProgress(isES ? 'Enviando a Groq...' : 'Sending to Groq...');

    try {
      const { transcribeFile } = await import('../whisper.js');
      const lang = language === 'en' ? 'en' : 'es';

      const text = await transcribeFile(file, lang, (p) => {
        if (p.status === 'uploading') {
          setProgress(isES ? 'Subiendo archivo...' : 'Uploading file...');
          setProgressPct(p.pct ?? 0);
        } else if (p.status === 'transcribing') {
          setProgress(isES ? '⚡ Transcribiendo con Groq IA...' : '⚡ Transcribing with Groq AI...');
          setProgressPct(60);
          clearInterval(pctIntervalRef.current);
          pctIntervalRef.current = setInterval(() => {
            setProgressPct(prev => {
              if (prev >= 95) { clearInterval(pctIntervalRef.current); return 95; }
              return prev + 1;
            });
          }, 400);
        }
      });

      // Respuesta recibida: 100 %
      clearInterval(pctIntervalRef.current);
      setProgressPct(100);
      setProgress(isES ? '✅ Listo, analizando...' : '✅ Done, analysing...');
      await new Promise(r => setTimeout(r, 400));

      // Detectar idioma real del audio para que el NLP sea correcto
      const detectedLang = detectLanguage(text);
      onTranscribed(text, file.name, detectedLang);
      setUiState(IDLE);
      setFileName('');
      setProgressPct(0);
    } catch (err) {
      clearInterval(pctIntervalRef.current);
      setProgressPct(0);

      if (err instanceof RateLimitError) {
        // Rate-limit → countdown + auto-retry
        startCountdown(err.retrySec, file);
      } else {
        setErrorMsg(err.message);
        setUiState(ERROR_ST);
      }
    }
  };

  // ─── Lógica principal ──────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setUiState(IDLE);

    if (!isValidFile(file)) {
      setErrorMsg(
        isES
          ? `Formato no soportado. Usa: ${ACCEPTED.join(', ')}`
          : `Unsupported format. Use: ${ACCEPTED.join(', ')}`
      );
      setUiState(ERROR_ST);
      return;
    }

    processFile(file);
  };

  // ─── Estilos dinámicos por estado ─────────────────────────────────────────
  const borderColor =
    uiState === DRAG_OVER  ? '#00E5FF' :
    uiState === ERROR_ST   ? '#E8003D' :
    uiState === WAITING    ? '#FF9800' :
    uiState === PROCESSING ? '#FFD700' :
    themeVars.panelBorder;

  const shadowColor =
    uiState === DRAG_OVER  ? '#00E5FF' :
    uiState === ERROR_ST   ? '#E8003D' :
    uiState === WAITING    ? '#FF9800' :
    uiState === PROCESSING ? '#FFD700' :
    themeVars.shadow;

  const bgColor =
    uiState === DRAG_OVER  ? 'rgba(0,229,255,0.07)' :
    uiState === ERROR_ST   ? 'rgba(232,0,61,0.05)'  :
    uiState === WAITING    ? 'rgba(255,152,0,0.06)'  :
    uiState === PROCESSING ? 'rgba(255,215,0,0.06)' :
    'transparent';

  const neonFilter =
    uiState === DRAG_OVER  ? 'drop-shadow(0 0 8px #00E5FF)' :
    uiState === WAITING    ? 'drop-shadow(0 0 8px #FF9800)' :
    uiState === PROCESSING ? 'drop-shadow(0 0 8px #FFD700)' :
    'none';

  return (
    <div style={{ width: '100%' }}>
      {/* ── Zona principal ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && uiState !== PROCESSING && uiState !== WAITING && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && !disabled && uiState !== WAITING && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `4px solid ${borderColor}`,
          boxShadow: `6px 6px 0 ${shadowColor}`,
          background: bgColor,
          backgroundImage: `radial-gradient(circle, ${
            uiState === DRAG_OVER ? 'rgba(0,229,255,0.25)' : 'rgba(0,0,0,0.12)'
          } 1.5px, transparent 1.5px)`,
          backgroundSize: '14px 14px',
          padding: '40px 28px',
          cursor: (uiState === PROCESSING || uiState === WAITING || disabled) ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        {/* ── CLASIFICADO stamp (decorativo, esquina) ── */}
        <div style={{
          alignSelf: 'flex-end',
          marginBottom: -8,
          background: '#E8003D', color: '#FAFAFA',
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: 8, letterSpacing: '0.2em', padding: '2px 7px',
          border: '2px solid #0D0D0D',
          transform: 'rotate(3deg)',
          opacity: uiState === DRAG_OVER ? 0 : 0.7,
          transition: 'opacity 0.15s',
        }}>
          {isES ? '★ ARCHIVOS SECRETOS ★' : '★ SECRET FILES ★'}
        </div>

        {/* ── Icono central ── */}
        {uiState === WAITING ? (
          <div style={{ filter: neonFilter }}>
            <div className="animate-pulse-comic">
              <Clock style={{ width: 56, height: 56, color: '#FF9800' }} />
            </div>
          </div>
        ) : uiState === PROCESSING ? (
          <div style={{ filter: neonFilter }}>
            <div className="animate-pulse-comic">
              <FileAudio style={{ width: 56, height: 56, color: '#FFD700' }} />
            </div>
          </div>
        ) : uiState === ERROR_ST ? (
          <AlertTriangle style={{ width: 52, height: 52, color: '#E8003D' }} />
        ) : uiState === DRAG_OVER ? (
          <div style={{ filter: neonFilter, animation: 'none' }}>
            <Film style={{ width: 60, height: 60, color: '#00E5FF', transform: 'rotate(-6deg)' }} />
          </div>
        ) : (
          <Upload style={{ width: 52, height: 52, color: themeVars.textMuted, opacity: 0.7 }} />
        )}

        {/* ── Texto principal ── */}
        <p style={{
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: uiState === DRAG_OVER ? 22 : 18,
          fontWeight: 900,
          color:
            uiState === DRAG_OVER  ? '#00E5FF' :
            uiState === ERROR_ST   ? '#E8003D' :
            uiState === PROCESSING ? '#FFD700' :
            themeVars.text,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.2,
          filter: neonFilter,
          transition: 'all 0.15s',
        }}>
          {uiState === DRAG_OVER  ? (isES ? '¡SUELTA LA GRABACIÓN AQUÍ!' : '¡DROP THE RECORDING HERE!') :
           uiState === WAITING    ? (isES ? '⏳ ESPERANDO PARA REINTENTAR...' : '⏳ WAITING TO RETRY...') :
           uiState === PROCESSING ? (isES ? '⚡ ANALIZANDO CON IA...' : '⚡ AI ANALYSING...') :
           uiState === ERROR_ST   ? (isES ? '¡ARCHIVO RECHAZADO!' : 'FILE REJECTED!') :
           (isES ? '📁 SUBIR ARCHIVO DE MISIÓN' : '📁 UPLOAD MISSION FILE')}
        </p>

        {/* ── Sub-texto / progreso / countdown ── */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          {uiState === WAITING ? (
            /* ── Countdown de rate-limit con auto-retry ── */
            <div style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 36,
                  fontWeight: 900,
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  color: '#FF9800',
                  letterSpacing: '-0.02em',
                  filter: 'drop-shadow(0 0 8px #FF9800)',
                  lineHeight: 1,
                }}>
                  {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#FF9800',
                fontFamily: 'Impact, Arial Black, sans-serif',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.4,
                marginBottom: 8,
              }}>
                {isES
                  ? 'LÍMITE DE GROQ ALCANZADO — SE REINTENTARÁ AUTOMÁTICAMENTE'
                  : 'GROQ LIMIT REACHED — WILL AUTO-RETRY'}
              </p>
              {/* Barra countdown */}
              <div style={{
                width: '100%',
                height: 10,
                border: '2px solid #0D0D0D',
                background: 'rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0, bottom: 0,
                  width: `${countdown > 0 ? ((countdown / (countdown + 1)) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #FF9800, #FFB74D)',
                  boxShadow: '0 0 8px #FF9800',
                  transition: 'width 1s linear',
                }} />
              </div>
              {/* Nombre del archivo pendiente */}
              {fileName && (
                <div style={{
                  marginTop: 10,
                  background: '#0D0D0D',
                  color: '#FF9800',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  padding: '3px 10px',
                  border: '2px solid #FF9800',
                  display: 'inline-block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  🔄 {fileName}
                </div>
              )}
            </div>
          ) : uiState === PROCESSING ? (
            <div style={{ width: '100%' }}>
              {/* Etiqueta + porcentaje */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFD700',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {progress}
                </span>
                <span style={{
                  fontSize: 20,
                  fontWeight: 900,
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  color: progressPct === 100 ? '#00E676' : '#FFD700',
                  letterSpacing: '-0.02em',
                  filter: `drop-shadow(0 0 6px ${progressPct === 100 ? '#00E676' : '#FFD700'})`,
                  transition: 'color 0.3s',
                }}>
                  {progressPct}%
                </span>
              </div>

              {/* Barra de progreso Neo-Brutalist */}
              <div style={{
                width: '100%',
                height: 18,
                border: '3px solid #0D0D0D',
                background: 'rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #00C853, #00E676)'
                    : 'linear-gradient(90deg, #FF9800, #FFD700)',
                  boxShadow: `0 0 10px ${progressPct === 100 ? '#00E676' : '#FFD700'}`,
                  transition: 'width 0.35s ease-out, background 0.3s',
                }} />
                {/* Rayas animadas */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 12px)',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          ) : (
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              color: uiState === ERROR_ST ? '#E8003D' : themeVars.textMuted,
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              {uiState === ERROR_ST
                ? errorMsg
                : isES
                ? `Arrastra un .mp3, .wav, .mp4, .m4a u otro formato de audio\no haz clic para seleccionar`
                : `Drag a .mp3, .wav, .mp4, .m4a or other audio format\nor click to select`}
            </p>
          )}
        </div>

        {/* ── Nombre del archivo mientras procesa ── */}
        {uiState === PROCESSING && fileName && (
          <div style={{
            background: '#0D0D0D',
            color: '#FFD700',
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 11,
            letterSpacing: '0.08em',
            padding: '4px 12px',
            border: '2px solid #FFD700',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            🎙 {fileName}
          </div>
        )}

        {/* ── Retry si hay error ── */}
        {uiState === ERROR_ST && (
          <button
            onClick={e => { e.stopPropagation(); setUiState(IDLE); setErrorMsg(''); }}
            style={{
              background: '#E8003D', color: '#FAFAFA',
              border: '3px solid #0D0D0D',
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 12, letterSpacing: '0.08em',
              padding: '5px 16px', cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {isES ? 'REINTENTAR' : 'RETRY'}
          </button>
        )}
      </div>

      {/* ── Formatos aceptados ── */}
      {uiState === IDLE && (
        <div style={{
          marginTop: 6,
          display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {ACCEPTED.map(ext => (
            <span key={ext} style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 9, letterSpacing: '0.1em',
              background: themeVars.panelBg,
              border: `2px solid ${themeVars.panelBorder}`,
              color: themeVars.textMuted,
              padding: '1px 6px',
            }}>
              {ext.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
