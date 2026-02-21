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
  panelBg:          '#1A1A1A',
  panelStripe:      '#222',
  panelBorder:      '#00E5FF',
  headerBg:         '#000000',
  headerText:       '#00E5FF',
  accentYellow:     '#FFFF00',
  accentOrange:     '#00E5FF',
  accentPurple:     '#BF00FF',
  text:             '#E0E0E0',
  textMuted:        '#999',
  shadow:           '#00E5FF',
  sidebarBg:        '#0D0D0D',
  sidebarHeaderBg:  '#000000',
  sidebarHeaderText:'#00E5FF',
  sidebarShadow:    '#00E5FF',
  tagBg:            '#2A0045',
  tagText:          '#BF00FF',
  taskHigh:         '#00FF88',
  taskHighText:     '#000',
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
