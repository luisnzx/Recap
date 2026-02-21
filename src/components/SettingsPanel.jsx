import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

// ─── Sección del manual ───────────────────────────────────────────────────────
function Section({ label, children, themeVars }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Etiqueta de sección al estilo expediente */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <div style={{ flex: 1, height: 3, background: themeVars.panelBorder }} />
        <span style={{
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: 11,
          fontWeight: 900,
          color: themeVars.text,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 3, background: themeVars.panelBorder }} />
      </div>
      {children}
    </div>
  );
}

// ─── Botón selector de opción ─────────────────────────────────────────────────
function OptionBtn({ label, active, onClick, accent, themeVars }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        background: active ? accent : 'transparent',
        border: `4px solid ${themeVars.panelBorder}`,
        boxShadow: active ? `4px 4px 0 ${themeVars.shadow}` : 'none',
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: 13,
        fontWeight: 900,
        color: active ? '#0D0D0D' : themeVars.text,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.1s',
        transform: active ? 'translate(-2px, -2px)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function SettingsPanel({ open, onClose }) {
  const { theme, toggleTheme, language, setLanguage, themeVars, T } = useSettings();
  const { signOut } = useAuth();

  if (!open) return null;

  const isNight = theme === 'night';

  // Fondo dot-matrix para el panel (adaptado al tema)
  const dotColor = isNight ? 'rgba(0,229,255,0.15)' : 'rgba(0,0,0,0.18)';
  const panelBg  = isNight ? '#111' : '#FAFAFA';

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: panelBg,
          backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '16px 16px',
          border: `4px solid ${themeVars.panelBorder}`,
          boxShadow: `10px 10px 0 ${themeVars.shadow}`,
          overflow: 'hidden',
        }}
      >

        {/* ── Cabecera / portada del manual ── */}
        <div style={{
          background: themeVars.headerBg,
          borderBottom: `4px solid ${themeVars.panelBorder}`,
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Pegatina de clasificación */}
            <div style={{
              display: 'inline-block',
              background: '#E8003D',
              color: '#FAFAFA',
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.2em',
              padding: '2px 8px',
              marginBottom: 4,
              border: '2px solid #FAFAFA',
            }}>
              ★ CONFIDENCIAL ★
            </div>
            <h2 style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 26,
              fontWeight: 900,
              color: themeVars.headerText,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              {T.settingsTitle}
            </h2>
            <p style={{
              fontSize: 10,
              color: isNight ? '#00E5FF88' : '#FFDE0377',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginTop: 3,
            }}>
              {T.settingsSub}
            </p>
          </div>

          {/* Botón cerrar X */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `3px solid ${themeVars.headerText}`,
              color: themeVars.headerText,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* ── Cuerpo del manual ── */}
        <div style={{ padding: '24px 22px' }}>

          {/* TEMA */}
          <Section label={T.themeSetting} themeVars={themeVars}>
            <div style={{ display: 'flex', gap: 8 }}>
              <OptionBtn
                label={T.dayMode}
                active={theme === 'day'}
                onClick={() => theme !== 'day' && toggleTheme()}
                accent="#FFDE03"
                themeVars={themeVars}
              />
              <OptionBtn
                label={T.nightMode}
                active={theme === 'night'}
                onClick={() => theme !== 'night' && toggleTheme()}
                accent="#00E5FF"
                themeVars={themeVars}
              />
            </div>
            {/* Indicador visual del tema activo */}
            <div style={{
              marginTop: 10,
              padding: '6px 12px',
              background: isNight ? '#000' : '#0D0D0D',
              border: `3px solid ${themeVars.panelBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{isNight ? '🌙' : '☀️'}</span>
              <span style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 11,
                color: isNight ? '#00E5FF' : '#FFDE03',
                letterSpacing: '0.1em',
              }}>
                {isNight ? (language === 'es' ? 'ACTIVO: MODO NOCHE' : 'ACTIVE: NIGHT MODE')
                         : (language === 'es' ? 'ACTIVO: MODO DÍA'   : 'ACTIVE: DAY MODE')}
              </span>
            </div>
          </Section>

          {/* IDIOMA */}
          <Section label={T.language} themeVars={themeVars}>
            <div style={{ display: 'flex', gap: 8 }}>
              <OptionBtn
                label="🇪🇸  ESPAÑOL"
                active={language === 'es'}
                onClick={() => setLanguage('es')}
                accent="#FFDE03"
                themeVars={themeVars}
              />
              <OptionBtn
                label="🇬🇧  ENGLISH"
                active={language === 'en'}
                onClick={() => setLanguage('en')}
                accent="#FFDE03"
                themeVars={themeVars}
              />
            </div>
          </Section>

          {/* CERRAR SESIÓN */}
          <Section label={T.signOut} themeVars={themeVars}>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: themeVars.textMuted,
              marginBottom: 12,
              fontStyle: 'italic',
            }}>
              {T.logoutWarning}
            </p>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#E8003D',
                color: '#FAFAFA',
                border: '4px solid #0D0D0D',
                boxShadow: '6px 6px 0 #0D0D0D',
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'translate(4px,4px)';
                e.currentTarget.style.boxShadow = '2px 2px 0 #0D0D0D';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '6px 6px 0 #0D0D0D';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '6px 6px 0 #0D0D0D';
              }}
            >
              🚀 {T.signOut}
            </button>
          </Section>

          {/* Pie del expediente */}
          <div style={{
            borderTop: `3px dashed ${themeVars.panelBorder}`,
            paddingTop: 12,
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 9,
              color: themeVars.textMuted,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              ONE-CLICK RECAP • v2.0 • {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
