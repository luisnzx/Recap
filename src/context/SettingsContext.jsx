import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Traducciones ────────────────────────────────────────────────────────────
export const translations = {
  es: {
    appSubtitle:      'TRANSFORMA TUS REUNIONES EN ACCIONES',
    newSession:       'NUEVA SESIÓN',
    history:          'REUNIONES',
    historySub:       'HISTORIAL GUARDADO',
    tasks:            'TAREAS DETECTADAS',
    agreements:       'ACUERDOS',
    nextMeeting:      'PRÓXIMA REUNIÓN',
    transcript:       'TRANSCRIPCIÓN COMPLETA',
    noTasks:          'Todo despejado, no se detectaron pendientes',
    noAgreements:     'Sin decisiones registradas en esta reunión',
    high:             'ALTA',
    confirmed:        'CONFIRMADO',
    settings:         'AJUSTES',
    signOut:          '¡ABANDONAR MISIÓN!',
    themeSetting:     'MODO VISUAL',
    dayMode:          '☀  MODO DÍA',
    nightMode:        '🌙 MODO NOCHE',
    language:         'IDIOMA',
    saving:           '¡GUARDANDO EN LA NUBE!...',
    loading:          'CARGANDO...',
    settingsTitle:    'MANUAL DE SUPERHÉROE',
    settingsSub:      'PARÁMETROS DE MISIÓN',
    closeSettings:    '✕ CERRAR',
    logoutWarning:    'Perderás acceso hasta que vuelvas a iniciar sesión.',
    tabRecord:        'GRABAR EN VIVO',
    tabUpload:        'SUBIR ARCHIVO',
    exportTitle:      'EXPORTAR INFORME',
    exportPDF:        '📄 EXPORTAR DOSSIER (PDF)',
    exportExcel:      '📊 DESCARGAR DATOS (EXCEL)',
    exportPremiumOnly:'SOLO SUPERHÉROES',
    exportPremiumHint:'Actualiza al Plan Superhéroe para desbloquear las exportaciones.',
  },
  en: {
    appSubtitle:      'TRANSFORM YOUR MEETINGS INTO ACTIONS',
    newSession:       'NEW SESSION',
    history:          'MEETINGS',
    historySub:       'SAVED HISTORY',
    tasks:            'DETECTED TASKS',
    agreements:       'AGREEMENTS',
    nextMeeting:      'NEXT MEETING',
    transcript:       'FULL TRANSCRIPT',
    noTasks:          'All clear — no pending tasks detected',
    noAgreements:     'No decisions recorded in this meeting',
    high:             'HIGH',
    confirmed:        'CONFIRMED',
    settings:         'SETTINGS',
    signOut:          'ABORT MISSION!',
    themeSetting:     'VISUAL MODE',
    dayMode:          '☀  DAY MODE',
    nightMode:        '🌙 NIGHT MODE',
    language:         'LANGUAGE',
    saving:           'SAVING TO THE CLOUD!...',
    loading:          'LOADING...',
    settingsTitle:    'HERO MANUAL',
    settingsSub:      'MISSION PARAMETERS',
    closeSettings:    '✕ CLOSE',
    logoutWarning:    'You will lose access until you sign in again.',
    tabRecord:        'RECORD LIVE',
    tabUpload:        'UPLOAD FILE',
    exportTitle:      'EXPORT REPORT',
    exportPDF:        '📄 EXPORT DOSSIER (PDF)',
    exportExcel:      '📊 DOWNLOAD DATA (EXCEL)',
    exportPremiumOnly:'SUPERHEROES ONLY',
    exportPremiumHint:'Upgrade to the Superhero Plan to unlock exports.',
  },
};

// ─── Paletas de color ─────────────────────────────────────────────────────────
export const dayTheme = {
  panelBg:          '#FAFAFA',
  panelStripe:      '#FFF9E6',
  panelBorder:      '#0D0D0D',
  headerBg:         '#0D0D0D',
  headerText:       '#FFDE03',
  accentYellow:     '#FFDE03',
  accentOrange:     '#FF5722',
  accentPurple:     '#7B2FBE',
  text:             '#0D0D0D',
  textMuted:        '#555',
  shadow:           '#0D0D0D',
  sidebarBg:        '#FFDE03',
  sidebarHeaderBg:  '#0D0D0D',
  sidebarHeaderText:'#FFDE03',
  sidebarShadow:    '#0D0D0D',
  tagBg:            '#EDE0FF',
  tagText:          '#3A0068',
  taskHigh:         '#00C853',
  taskHighText:     '#FAFAFA',
};

export const nightTheme = {
  panelBg:          '#161616',
  panelStripe:      '#1E1E1E',
  panelBorder:      '#3A3A3A',
  headerBg:         '#0A0A0A',
  headerText:       '#D4AF6A',
  accentYellow:     '#D4AF6A',
  accentOrange:     '#C0733A',
  accentPurple:     '#7A5FA0',
  text:             '#D8D8D8',
  textMuted:        '#707070',
  shadow:           '#000000',
  sidebarBg:        '#111111',
  sidebarHeaderBg:  '#0A0A0A',
  sidebarHeaderText:'#D4AF6A',
  sidebarShadow:    '#000000',
  tagBg:            '#252030',
  tagText:          '#A892C8',
  taskHigh:         '#3A8A5C',
  taskHighText:     '#EAEAEA',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('recap-theme') || 'day'
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem('recap-lang') || 'es'
  );

  // Aplicar clase al body para CSS dark-mode
  useEffect(() => {
    localStorage.setItem('recap-theme', theme);
    if (theme === 'night') {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('recap-lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(t => (t === 'day' ? 'night' : 'day'));
  const themeVars   = theme === 'day' ? dayTheme : nightTheme;
  const T           = translations[language];

  return (
    <SettingsContext.Provider
      value={{ theme, toggleTheme, language, setLanguage, themeVars, T }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
