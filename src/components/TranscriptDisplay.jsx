import React from 'react';

export default function TranscriptDisplay({ transcript, isFinal }) {
  return (
    <div className="w-full px-6 py-4 mb-6">
      {/* Header tag */}
      <div style={{
        display: 'inline-block',
        background: '#FFDE03',
        color: '#0D0D0D',
        border: '4px solid #0D0D0D',
        borderBottom: 'none',
        padding: '4px 14px',
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: '0.08em',
      }}>
        TRANSCRIPCIÓN EN VIVO
      </div>

      {/* Main card */}
      <div style={{
        background: '#FAFAFA',
        border: '4px solid #0D0D0D',
        boxShadow: '6px 6px 0 #0D0D0D',
        padding: '20px 24px',
        minHeight: '120px',
        position: 'relative',
      }}>
        <p style={{
          fontSize: 16,
          lineHeight: 1.65,
          color: transcript ? '#0D0D0D' : '#9B9B9B',
          fontWeight: transcript ? 600 : 400,
        }}>
          {transcript || 'El texto aparecerá aquí cuando empieces a hablar…'}
        </p>
        {!isFinal && transcript && (
          <span style={{
            display: 'inline-block',
            width: 3,
            height: 22,
            background: '#FF5722',
            marginLeft: 6,
            verticalAlign: 'bottom',
            animation: 'pulse-comic 0.9s steps(2,end) infinite',
          }} />
        )}
      </div>

      {transcript && (
        <p style={{
          fontSize: 11,
          color: '#FFDE03',
          marginTop: 6,
          fontWeight: 700,
          letterSpacing: '0.05em',
          fontFamily: 'Impact, Arial Black, sans-serif',
        }}>
          {isFinal ? '✓ CAPTURA FINALIZADA' : '● ESCUCHANDO…'}
        </p>
      )}
    </div>
  );
}
