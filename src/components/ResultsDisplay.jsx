import React from 'react';
import { CheckCircle, Users, Calendar, Clipboard, Zap, Clock, User, Lock, Star } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function ResultsDisplay({ processed, isPremium = false, onUpgradeClick, meetingTitle = 'reunion' }) {
  const { themeVars, T } = useSettings();
  if (!processed) return null;

  // ── Export handlers (dynamic import keeps initial bundle light) ──────────────
  const handleExportPDF = async () => {
    if (!isPremium) { onUpgradeClick?.(); return; }
    const { exportToPDF } = await import('../exportUtils.js');
    exportToPDF(processed, meetingTitle);
  };

  const handleExportExcel = async () => {
    if (!isPremium) { onUpgradeClick?.(); return; }
    const { exportToExcel } = await import('../exportUtils.js');
    exportToExcel(processed, meetingTitle);
  };

  const panel = {
    border: `4px solid ${themeVars.panelBorder}`,
    boxShadow: `8px 8px 0 ${themeVars.shadow}`,
    background: themeVars.panelBg,
    marginBottom: 24,
    overflow: 'hidden',
  };

  const panelHeader = (bg, color) => ({
    background: bg,
    borderBottom: `4px solid ${themeVars.panelBorder}`,
    padding: '10px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontSize: 18,
    fontWeight: 900,
    color,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  });

  const renderTaskItem = (task, i) => (
    <li key={i} className="animate-fade-in" style={{
      padding: '12px 16px',
      borderBottom: i < processed.tasks.length - 1 ? `3px solid ${themeVars.panelBorder}` : 'none',
      background: i % 2 === 0 ? themeVars.panelBg : themeVars.panelStripe,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <CheckCircle style={{ width: 18, height: 18, marginTop: 2, color: themeVars.accentOrange, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: themeVars.text, lineHeight: 1.4 }}>{task.action}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, color: themeVars.tagText,
              background: themeVars.tagBg, border: `2px solid ${themeVars.panelBorder}`, padding: '1px 7px',
            }}>
              <User style={{ width: 11, height: 11 }} /> {task.responsible}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, color: themeVars.text,
              background: themeVars.accentYellow, border: `2px solid ${themeVars.panelBorder}`, padding: '1px 7px',
            }}>
              <Clock style={{ width: 11, height: 11 }} /> {task.deadline}
            </span>
            {task.confidence === 'high' && (
              <span style={{
                fontSize: 11, fontWeight: 900, color: themeVars.taskHighText,
                background: themeVars.taskHigh, border: `2px solid ${themeVars.panelBorder}`, padding: '1px 7px',
                fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.04em',
              }}>✓ {T.high}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );

  const renderAgreementItem = (agr, i) => (
    <li key={i} className="animate-fade-in" style={{
      padding: '12px 16px',
      borderBottom: i < processed.agreements.length - 1 ? `3px solid ${themeVars.panelBorder}` : 'none',
      background: i % 2 === 0 ? themeVars.panelBg : themeVars.panelStripe,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Users style={{ width: 18, height: 18, marginTop: 2, color: themeVars.accentPurple, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: themeVars.text, lineHeight: 1.4 }}>{agr.agreement}</p>
          {agr.confidence === 'high' && (
            <span style={{
              display: 'inline-block', marginTop: 6,
              fontSize: 11, fontWeight: 900, color: '#FAFAFA',
              background: themeVars.accentPurple, border: `2px solid ${themeVars.panelBorder}`, padding: '1px 7px',
              fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.04em',
            }}>✓ {T.confirmed}</span>
          )}
        </div>
      </div>
    </li>
  );

  const hasTasks = processed.tasks?.length > 0;
  const hasAgreements = processed.agreements?.length > 0;

  return (
    <div className="w-full animate-fade-in">
      {/* Tasks card */}
      <div style={panel}>
        <div style={panelHeader(themeVars.accentYellow, themeVars.text)}>
          <Clipboard style={{ width: 20, height: 20 }} />
          {T.tasks}
          {hasTasks && (
            <span style={{
              marginLeft: 'auto', background: themeVars.text, color: themeVars.accentYellow,
              fontSize: 13, padding: '1px 10px', fontWeight: 900,
            }}>{processed.tasks.length}</span>
          )}
        </div>
        {hasTasks ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {processed.tasks.map(renderTaskItem)}
          </ul>
        ) : (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <Zap style={{ width: 28, height: 28, color: themeVars.textMuted, margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: themeVars.textMuted, fontStyle: 'italic' }}>{T.noTasks}</p>
          </div>
        )}
      </div>

      {/* Agreements card */}
      <div style={panel}>
        <div style={panelHeader(themeVars.accentOrange, themeVars.panelBg)}>
          <Users style={{ width: 20, height: 20 }} />
          {T.agreements}
          {hasAgreements && (
            <span style={{
              marginLeft: 'auto', background: themeVars.panelBg, color: themeVars.accentOrange,
              fontSize: 13, padding: '1px 10px', fontWeight: 900,
            }}>{processed.agreements.length}</span>
          )}
        </div>
        {hasAgreements ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {processed.agreements.map(renderAgreementItem)}
          </ul>
        ) : (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <Zap style={{ width: 28, height: 28, color: themeVars.textMuted, margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: themeVars.textMuted, fontStyle: 'italic' }}>{T.noAgreements}</p>
          </div>
        )}
      </div>

      {/* Next meeting */}
      {processed.nextMeeting && (
        <div style={panel} className="animate-slide-in">
          <div style={panelHeader(themeVars.accentPurple, '#FAFAFA')}>
            <Calendar style={{ width: 20, height: 20 }} />
            {T.nextMeeting}
          </div>
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: themeVars.text }}>{processed.nextMeeting.text}</p>
            {processed.nextMeeting.date && (
              <p style={{
                marginTop: 8, fontSize: 13, fontWeight: 900, color: themeVars.accentOrange,
                fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.04em',
              }}>📅 {processed.nextMeeting.date}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Export panel ── */}
      <div style={{ ...panel }}>
        <div style={panelHeader('#0D0D0D', '#FFDE03')}>
          <Star style={{ width: 18, height: 18 }} />
          {T.exportTitle}
          {!isPremium && (
            <span style={{
              marginLeft: 'auto',
              background: '#FFD700',
              color: '#0D0D0D',
              fontSize: 11,
              padding: '2px 10px',
              border: '2px solid #0D0D0D',
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: '0.06em',
            }}>
              ⭐ {T.exportPremiumOnly}
            </span>
          )}
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* PDF button */}
          <button
            onClick={handleExportPDF}
            title={!isPremium ? T.exportPremiumHint : T.exportPDF}
            style={{
              flex: '1 1 calc(50% - 6px)',
              minWidth: 180,
              background: '#E8003D',
              color: '#FAFAFA',
              border: '3px solid #0D0D0D',
              boxShadow: '5px 5px 0 #0D0D0D',
              padding: '12px 14px',
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isPremium ? 1 : 0.82,
              transition: 'transform 0.08s, box-shadow 0.08s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #0D0D0D'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
          >
            {!isPremium && <Lock style={{ width: 15, height: 15, color: '#FFD700', flexShrink: 0 }} />}
            {T.exportPDF}
          </button>

          {/* Excel button */}
          <button
            onClick={handleExportExcel}
            title={!isPremium ? T.exportPremiumHint : T.exportExcel}
            style={{
              flex: '1 1 calc(50% - 6px)',
              minWidth: 180,
              background: '#00C853',
              color: '#0D0D0D',
              border: '3px solid #0D0D0D',
              boxShadow: '5px 5px 0 #0D0D0D',
              padding: '12px 14px',
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isPremium ? 1 : 0.82,
              transition: 'transform 0.08s, box-shadow 0.08s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #0D0D0D'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; }}
          >
            {!isPremium && <Lock style={{ width: 15, height: 15, color: '#FFD700', flexShrink: 0 }} />}
            {T.exportExcel}
          </button>
        </div>

        {!isPremium && (
          <p style={{
            margin: 0,
            padding: '0 18px 14px',
            fontSize: 11,
            color: themeVars.textMuted,
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            🔒 {T.exportPremiumHint}
          </p>
        )}
      </div>

      {/* Full transcript */}
      <div style={{ ...panel, boxShadow: `6px 6px 0 ${themeVars.shadow}` }}>
        <div style={panelHeader(themeVars.headerBg, themeVars.headerText)}>
          {T.transcript}
        </div>
        <div style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 13, color: themeVars.text, lineHeight: 1.7, fontWeight: 500 }}>
            {processed.rawText}
          </p>
        </div>
      </div>
    </div>
  );
}