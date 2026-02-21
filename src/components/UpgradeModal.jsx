import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const FREE_LIMIT = 3;

// ─── Aura CSS animation via style tag ──────────────────────────────────────
const AURA_STYLE = `
@keyframes hero-aura {
  0%   { box-shadow: 0 0 12px 4px #FFD700, 0 0 30px 10px #FF8C00, 8px 8px 0 #0D0D0D; }
  50%  { box-shadow: 0 0 22px 10px #FFD700, 0 0 50px 20px #FF5722, 8px 8px 0 #0D0D0D; }
  100% { box-shadow: 0 0 12px 4px #FFD700, 0 0 30px 10px #FF8C00, 8px 8px 0 #0D0D0D; }
}
@keyframes shine-text {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.hero-aura   { animation: hero-aura  2s ease-in-out infinite; }
.shine-title {
  background: linear-gradient(90deg, #FFD700 0%, #FFF 40%, #FFD700 60%, #FF8C00 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shine-text 2.4s linear infinite;
}
`;

export default function UpgradeModal({ open, onClose, meetingsUsed }) {
  const { language } = useSettings();
  const isES = language !== 'en';

  if (!open) return null;

  const remaining = Math.max(0, FREE_LIMIT - meetingsUsed);

  return (
    <>
      {/* Inject aura animation */}
      <style>{AURA_STYLE}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: '#FAFAFA',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)',
            backgroundSize: '14px 14px',
            border: '5px solid #0D0D0D',
            boxShadow: '12px 12px 0 #0D0D0D',
            overflow: 'hidden',
          }}
        >

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{
            background: '#0D0D0D',
            borderBottom: '4px solid #0D0D0D',
            padding: '16px 22px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                background: '#E8003D', color: '#FAFAFA',
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 9, letterSpacing: '0.18em', padding: '2px 8px',
                border: '2px solid #FAFAFA', marginBottom: 5,
              }}>
                ⚡ {isES ? 'ALERTA DE MISIÓN' : 'MISSION ALERT'} ⚡
              </div>
              <h2 style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 24, fontWeight: 900,
                color: '#FFDE03', letterSpacing: '0.04em',
                textTransform: 'uppercase', lineHeight: 1,
              }}>
                {isES ? '¡LÍMITE ALCANZADO!' : 'LIMIT REACHED!'}
              </h2>
              <p style={{ fontSize: 11, color: '#FFFFFF88', fontWeight: 700, marginTop: 3, letterSpacing: '0.1em' }}>
                {isES
                  ? `Has usado ${meetingsUsed}/${FREE_LIMIT} misiones gratuitas`
                  : `You've used ${meetingsUsed}/${FREE_LIMIT} free missions`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '3px solid #FFDE03',
                color: '#FFDE03', width: 34, height: 34, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* ── Plan cards ─────────────────────────────────────────────────── */}
          <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* PLAN NOVATO */}
            <div style={{
              border: '4px solid #0D0D0D',
              boxShadow: '5px 5px 0 #0D0D0D',
              background: '#F0F0F0',
              overflow: 'hidden',
            }}>
              <div style={{
                background: '#555', borderBottom: '4px solid #0D0D0D',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 24 }}>🛡️</span>
                <div>
                  <p style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 18, color: '#FAFAFA', letterSpacing: '0.05em',
                  }}>
                    {isES ? 'PLAN NOVATO' : 'ROOKIE PLAN'}
                  </p>
                  <p style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 13, color: '#FFDE03', letterSpacing: '0.04em',
                  }}>
                    {isES ? 'GRATIS' : 'FREE'}
                  </p>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    isES ? `✗  ${FREE_LIMIT} misiones/mes` : `✗  ${FREE_LIMIT} missions/month`,
                    isES ? '✗  Sin exportación a PDF' : '✗  No PDF export',
                    isES ? '✗  Soporte básico' : '✗  Basic support',
                  ].map((item, i) => (
                    <li key={i} style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{item}</li>
                  ))}
                </ul>
                {/* Remaining missions mini-bar */}
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#333', marginBottom: 5, letterSpacing: '0.06em' }}>
                    {isES ? `MISIONES RESTANTES: ${remaining}/${FREE_LIMIT}` : `REMAINING: ${remaining}/${FREE_LIMIT}`}
                  </p>
                  <div style={{ height: 12, background: '#DDD', border: '3px solid #0D0D0D', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(remaining / FREE_LIMIT) * 100}%`,
                      background: remaining === 0 ? '#E8003D' : remaining === 1 ? '#FF8C00' : '#00C853',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* PLAN SUPERHÉROE */}
            <div
              className="hero-aura"
              style={{
                border: '4px solid #0D0D0D',
                background: '#0D0D0D',
                overflow: 'hidden',
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #B8860B 0%, #FFD700 40%, #FFA500 70%, #B8860B 100%)',
                borderBottom: '4px solid #0D0D0D',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🦸</span>
                  <div>
                    <p className="shine-title" style={{
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      fontSize: 20, letterSpacing: '0.05em', margin: 0,
                    }}>
                      {isES ? 'PLAN SUPERHÉROE' : 'SUPERHERO PLAN'}
                    </p>
                    <p style={{
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      fontSize: 14, color: '#0D0D0D', letterSpacing: '0.04em', margin: 0,
                    }}>
                      $5 / {isES ? 'mes' : 'month'}
                    </p>
                  </div>
                </div>
                {/* RECOMENDADO badge */}
                <div style={{
                  background: '#E8003D', color: '#FAFAFA',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  fontSize: 9, letterSpacing: '0.12em',
                  padding: '3px 8px', border: '2px solid #0D0D0D',
                  transform: 'rotate(3deg)',
                }}>
                  ★ {isES ? 'RECOMENDADO' : 'RECOMMENDED'}
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { icon: '⚡', text: isES ? 'Misiones ILIMITADAS' : 'UNLIMITED missions' },
                    { icon: '📄', text: isES ? 'Exportación a PDF' : 'PDF export' },
                    { icon: '🔥', text: isES ? 'Soporte prioritario 24/7' : 'Priority support 24/7' },
                    { icon: '🎯', text: isES ? 'Análisis avanzado de NLP' : 'Advanced NLP analysis' },
                  ].map(({ icon, text }, i) => (
                    <li key={i} style={{
                      fontSize: 14, fontWeight: 800, color: '#FFDE03',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span>{icon}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  style={{
                    marginTop: 16, width: '100%',
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, #B8860B, #FFD700, #FFA500)',
                    border: '4px solid #0D0D0D',
                    boxShadow: '5px 5px 0 #0D0D0D',
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 18, fontWeight: 900,
                    color: '#0D0D0D', letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: 'pointer',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #0D0D0D'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
                  onClick={() => alert(isES ? '¡Próximamente! Integración de pago en desarrollo 🚀' : 'Coming soon! Payment integration in progress 🚀')}
                >
                  🚀 {isES ? '¡CONSEGUIR PODERES!' : 'GET POWERS!'}
                </button>
              </div>
            </div>

            {/* Cierre */}
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '3px solid #888',
                color: '#888', padding: '8px 0',
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 12, letterSpacing: '0.1em',
                cursor: 'pointer', textTransform: 'uppercase', width: '100%',
              }}
            >
              {isES ? 'CONTINUAR CON PLAN NOVATO' : 'CONTINUE WITH ROOKIE PLAN'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
