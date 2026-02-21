import React from 'react';
import { Mic, Square, Zap } from 'lucide-react';

const STAR = "50% 0%, 56% 18%, 73% 5%, 66% 22%, 85% 19%, 73% 32%, 94% 40%, 75% 47%, 90% 60%, 69% 59%, 74% 80%, 57% 68%, 50% 89%, 43% 68%, 26% 80%, 31% 59%, 10% 60%, 25% 47%, 6% 40%, 27% 32%, 15% 19%, 34% 22%, 27% 5%, 44% 18%";

export default function RecordingButton({ isRecording, onToggle, recognizing, limitReached, onLimitClick }) {
  // Si está grabando y llegó al límite → botón dorado de upgrade
  const isLimitStop = isRecording && limitReached;

  const fillColor  = isLimitStop ? '#FFD700' : isRecording ? '#E8003D' : '#FFDE03';
  const textColor  = '#0D0D0D';

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Starburst button */}
      <div className="relative" style={{
        width: 200, height: 200,
        filter: isLimitStop ? 'drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 22px #FFA500)' : 'none',
        transition: 'filter 0.3s ease',
      }}>
        {/* Hard drop-shadow */}
        <div className="absolute" style={{
          width: 200, height: 200,
          clipPath: `polygon(${STAR})`,
          background: '#0D0D0D',
          top: 9, left: 9,
        }} />

        {/* Black border ring */}
        <div className="absolute" style={{
          width: 200, height: 200,
          clipPath: `polygon(${STAR})`,
          background: '#0D0D0D',
          top: 0, left: 0,
        }} />

        {/* Colored fill — 94 % scale gives the border illusion */}
        <div className="absolute" style={{
          width: 200, height: 200,
          clipPath: `polygon(${STAR})`,
          background: fillColor,
          top: 0, left: 0,
          transform: 'scale(0.93)',
          transformOrigin: 'center',
        }} />

        {/* Clickable overlay */}
        <button
          onClick={isLimitStop ? onLimitClick : onToggle}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1"
          style={{ background: 'transparent', cursor: 'pointer' }}
        >
          {isLimitStop ? (
            <>
              <span style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 11, fontWeight: 900,
                color: '#0D0D0D',
                letterSpacing: '0.02em', lineHeight: 1.1,
                textAlign: 'center', padding: '0 8px',
                textShadow: '0 0 8px #FFD700',
              }}>
                ¡PODERES¡
              </span>
              <Zap className="w-8 h-8" fill="#0D0D0D" style={{ color: '#0D0D0D', filter: 'drop-shadow(0 0 4px #FFD700)' }} />
            </>
          ) : (
            <>
              <span style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: isRecording ? 20 : 28,
                fontWeight: 900,
                color: isRecording ? '#FAFAFA' : '#0D0D0D',
                textShadow: isRecording ? '2px 2px 0 #0D0D0D' : '1px 1px 0 rgba(0,0,0,0.25)',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}>
                {isRecording ? 'STOP!' : 'REC'}
              </span>
              {isRecording
                ? <Square className="w-8 h-8" fill="#FAFAFA" style={{ color: '#FAFAFA' }} />
                : <Mic  className="w-8 h-8" style={{ color: '#0D0D0D' }} />
              }
            </>
          )}
        </button>

        {/* REC badge */}
        {recognizing && isRecording && (
          <div className="absolute -top-1 -right-2 z-20 animate-pulse-comic" style={{
            background: '#FFDE03',
            border: '3px solid #0D0D0D',
            padding: '2px 7px',
            transform: 'rotate(14deg)',
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 11,
            color: '#0D0D0D',
            fontWeight: 900,
            letterSpacing: '0.05em',
          }}>● REC</div>
        )}
      </div>

      {/* Label pill */}
      <div style={{
        fontFamily: 'Impact, Arial Black, sans-serif',
        background: isLimitStop ? '#FFD700' : isRecording ? '#E8003D' : '#FFDE03',
        color: '#0D0D0D',
        border: '4px solid #0D0D0D',
        boxShadow: isLimitStop ? '5px 5px 0 #0D0D0D, 0 0 12px 4px #FFD700' : '5px 5px 0 #0D0D0D',
        padding: '8px 20px',
        fontSize: isLimitStop ? 11 : 14,
        fontWeight: 900,
        letterSpacing: isLimitStop ? '0.04em' : '0.08em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {isLimitStop ? '¡CONSIGUE PODERES ILIMITADOS!' : isRecording ? '◉ GRABANDO...' : '▶ PRESIONA PARA GRABAR'}
      </div>
    </div>
  );
}
