import React from 'react';
import { Menu, X, RotateCcw } from 'lucide-react';
import MeetingHistory from './MeetingHistory';
import { useSettings } from '../context/SettingsContext';

export default function Sidebar({
  isOpen,
  onToggle,
  meetings,
  onSelectMeeting,
  onDeleteMeeting,
  onNewSession,
  meetingsUsed = 0,
  freeLimit    = 3,
  onUpgradeClick,
}) {
  const { themeVars, T } = useSettings();
  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={onToggle}
        className="btn-brutal lg:hidden"
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 50,
          background: '#FFDE03',
          border: '4px solid #0D0D0D',
          boxShadow: '4px 4px 0 #0D0D0D',
          padding: '6px 10px',
          cursor: 'pointer',
        }}
      >
        {isOpen
          ? <X className="w-5 h-5" style={{ color: '#0D0D0D' }} />
          : <Menu className="w-5 h-5" style={{ color: '#0D0D0D' }} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 30,
          }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed lg:relative left-0 top-0 h-screen w-72 lg:w-64
          z-40 transition-transform duration-300 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: themeVars.sidebarBg,
          borderRight: `4px solid ${themeVars.sidebarShadow}`,
          boxShadow: `6px 0 0 ${themeVars.sidebarShadow}`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: `4px solid ${themeVars.sidebarShadow}`,
          background: themeVars.sidebarHeaderBg,
        }}>
          <h2 style={{
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 24,
            fontWeight: 900,
            color: themeVars.sidebarHeaderText,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            📋 {T.history}
          </h2>
          <p style={{ fontSize: 11, color: `${themeVars.sidebarHeaderText}99`, marginTop: 2, fontWeight: 600 }}>
            {T.historySub}
          </p>
        </div>

        {/* New Session Button */}
        <button
          onClick={() => { onNewSession(); onToggle(); }}
          className="btn-brutal"
          style={{
            margin: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            background: themeVars.accentOrange,
            color: '#FAFAFA',
            border: `4px solid ${themeVars.sidebarShadow}`,
            boxShadow: `5px 5px 0 ${themeVars.sidebarShadow}`,
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <RotateCcw className="w-4 h-4" />
          {T.newSession}
        </button>

        {/* ⚡ ENERGY BAR */}
        {(() => {
          const used      = Math.min(meetingsUsed, freeLimit);
          const remaining = freeLimit - used;
          const pct       = (used / freeLimit) * 100;
          const barColor  = remaining === 0 ? '#E8003D' : remaining === 1 ? '#FF8C00' : '#00C853';
          const isES      = true; // usa language del context si lo necesitas
          return (
            <div style={{
              margin: '0 16px 16px',
              border: `3px solid ${themeVars.sidebarShadow}`,
              background: themeVars.sidebarHeaderBg,
              padding: '10px 12px',
            }}>
              {/* Label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  fontSize: 10, letterSpacing: '0.1em',
                  color: themeVars.sidebarHeaderText,
                }}>⚡ MISIONES</span>
                <span style={{
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  fontSize: 13, fontWeight: 900,
                  color: remaining === 0 ? '#E8003D' : themeVars.accentYellow,
                }}>
                  {remaining}/{freeLimit}
                </span>
              </div>

              {/* Bar track */}
              <div style={{
                height: 14,
                background: '#333',
                border: `2px solid ${themeVars.sidebarShadow}`,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor,
                  transition: 'width 0.5s ease',
                  maxWidth: '100%',
                }} />
              </div>

              {/* Status text or upgrade CTA */}
              {remaining === 0 ? (
                <button
                  onClick={onUpgradeClick}
                  style={{
                    marginTop: 8, width: '100%',
                    background: 'linear-gradient(90deg, #B8860B, #FFD700, #FFA500)',
                    border: `3px solid ${themeVars.sidebarShadow}`,
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 10, letterSpacing: '0.08em',
                    color: '#0D0D0D', cursor: 'pointer', padding: '5px 0',
                    textTransform: 'uppercase',
                  }}
                  onMouseDown={e => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseUp={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  ¡CONSEGUIR PODERES!
                </button>
              ) : (
                <p style={{
                  marginTop: 5, fontSize: 10, fontWeight: 700,
                  color: `${themeVars.sidebarHeaderText}88`,
                  letterSpacing: '0.06em',
                }}>
                  {remaining === 1 ? '¡Última misión gratuita!' : `${remaining} misiones libres`}
                </p>
              )}
            </div>
          );
        })()}

        {/* Meetings list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          <MeetingHistory
            meetings={meetings}
            onSelect={(m) => { onSelectMeeting(m); onToggle(); }}
            onDelete={onDeleteMeeting}
          />
        </div>

        {/* Footer */}
        {meetings.length > 0 && (
          <div style={{
            padding: '12px 16px',
            borderTop: `4px solid ${themeVars.sidebarShadow}`,
            fontSize: 11,
            fontWeight: 700,
            color: themeVars.text,
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {meetings.length} {T.history}{meetings.length !== 1 ? '' : ''}
          </div>
        )}
      </aside>
    </>
  );
}
