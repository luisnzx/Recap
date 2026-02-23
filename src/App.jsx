import React, { useState, useEffect, useRef } from 'react';
import RecordingButton from './components/RecordingButton';
import TranscriptDisplay from './components/TranscriptDisplay';
import ResultsDisplay from './components/ResultsDisplay';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import { MeetingProcessor } from './MeetingProcessor';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import { supabase } from './supabase';
import SettingsPanel from './components/SettingsPanel';
import UpgradeModal from './components/UpgradeModal';
import UploadZone from './components/UploadZone';
import { Mic, LogOut, Settings } from 'lucide-react';

const FREE_LIMIT = 3;
// Cuenta propietaria — acceso premium permanente sin límites
const OWNER_EMAIL = 'luisnugent3@gmail.com';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  // Estados para grabación
  const [isRecording,  setIsRecording]  = useState(false);
  const [transcript,   setTranscript]   = useState('');
  const [isFinal,      setIsFinal]      = useState(false);
  const [recognizing,  setRecognizing]  = useState(false);
  const [processed,    setProcessed]    = useState(null);
  const [isSaving,     setIsSaving]     = useState(false);

  // Estados para historial
  const [meetings,        setMeetings]        = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [upgradeOpen,     setUpgradeOpen]     = useState(false);
  const [activeTab,       setActiveTab]       = useState('record'); // 'record' | 'upload'

  // Contexto de ajustes
  const { themeVars, T, language } = useSettings();
  // Mantener ref del idioma para pasarlo a recognition sin re-montar el hook
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Cuenta propietaria = premium permanente
  const isPremium    = user?.email === OWNER_EMAIL;
  // Límite de plan gratuito (nunca se activa para el propietario)
  const limitReached = !isPremium && meetings.length >= FREE_LIMIT;

  // Referencias
  const recognitionRef = useRef(null);
  const interimTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const userStoppedRef = useRef(false);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta Web Speech API. Por favor usa Chrome, Edge o Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setRecognizing(true);
      userStoppedRef.current = false;
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          // Texto final
          interimTranscriptRef.current += transcriptSegment + ' ';
        } else {
          // Texto temporal
          interimTranscript += transcriptSegment;
        }
      }

      setTranscript(interimTranscriptRef.current + interimTranscript);
      setIsFinal(event.results[event.results.length - 1].isFinal);
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      // No mostrar alertas para errores comunes
      if (event.error !== 'no-speech' && event.error !== 'audio-capture' && event.error !== 'network') {
        console.warn('Error en el reconocimiento de voz:', event.error);
      }
    };

    recognition.onend = () => {
      setRecognizing(false);
      
      // AUTO-RESTART: Si el usuario no presionó stop y estamos grabando, reiniciar automáticamente
      if (isRecordingRef.current && !userStoppedRef.current) {
        console.log('Reconocimiento terminado por silencio. Reiniciando automáticamente...');
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error('Error al reiniciar grabación:', error);
            setIsRecording(false);
          }
        }, 100); // Reiniciar rápidamente sin esperar
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // Sincronizar isRecording con isRecordingRef
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Cargar reuniones del usuario desde Supabase
  useEffect(() => {
    if (!user) return;
    supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Error cargando reuniones:', error); return; }
        // Normalizar: Supabase devuelve snake_case, mapeamos a la forma que usa la app
        setMeetings((data || []).map(m => ({
          id: m.id,
          title: m.title,
          timestamp: m.created_at,
          tasks: m.tasks ?? [],
          agreements: m.agreements ?? [],
          nextMeeting: m.next_meeting ?? null,
          rawText: m.raw_text ?? '',
        })));
      });
  }, [user]);

  // --- Protección de rutas (después de todos los hooks) ---
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#5C1EA8', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px',
      }}>
        <p style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, color: '#FFDE03', letterSpacing: '0.1em' }}>CARGANDO...</p>
      </div>
    );
  }
  if (!user) return <LoginScreen />;

  // Toggle de grabación
  const toggleRecording = async () => {
    if (isRecording) {
      // El usuario presionó stop manualmente
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
      
      // Procesar texto capturado
      if (interimTranscriptRef.current.trim()) {
        const result = MeetingProcessor.processText(interimTranscriptRef.current, languageRef.current);
        setProcessed(result);

        // Verificar límite antes de guardar
        if (limitReached) {
          setIsRecording(false);
          setUpgradeOpen(true);
          return;
        }

        // Guardar reunión en Supabase
        setIsSaving(true);
        const meetingData = MeetingProcessor.formatForStorage(result);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('meetings')
          .insert({
            user_id:      currentUser.id,
            title:        meetingData.title,
            tasks:        meetingData.tasks,
            agreements:   meetingData.agreements,
            next_meeting: meetingData.nextMeeting,
            raw_text:     meetingData.rawText,
          })
          .select()
          .single();
        setIsSaving(false);
        if (error) { console.error('Error guardando reunión:', error); }
        else {
          setMeetings(prev => [{
            id:          data.id,
            title:       data.title,
            timestamp:   data.created_at,
            tasks:       data.tasks ?? [],
            agreements:  data.agreements ?? [],
            nextMeeting: data.next_meeting ?? null,
            rawText:     data.raw_text ?? '',
          }, ...prev]);
        }
        setSelectedMeeting(null);
      }
      setIsRecording(false);
    } else {
      // El usuario presionó grabar — actualizar idioma antes de empezar
      if (recognitionRef.current) {
        recognitionRef.current.lang = languageRef.current === 'en' ? 'en-US' : 'es-ES';
      }
      userStoppedRef.current = false;
      interimTranscriptRef.current = '';
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  // Manejar transcripción de archivo subido
  const handleUploadTranscribed = async (text, originalFileName, detectedLang) => {
    if (limitReached) { setUpgradeOpen(true); return; }
    // Usar el idioma detectado en el audio (no el del toggle de UI)
    const audioLang = detectedLang ?? language;
    const result = MeetingProcessor.processText(text, audioLang);
    // Sobreescribir el título con el nombre del archivo
    result.title = originalFileName.replace(/\.[^.]+$/, '');
    setProcessed(result);
    setIsSaving(true);
    const meetingData = MeetingProcessor.formatForStorage(result);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        user_id:      currentUser.id,
        title:        meetingData.title,
        tasks:        meetingData.tasks,
        agreements:   meetingData.agreements,
        next_meeting: meetingData.nextMeeting,
        raw_text:     meetingData.rawText,
      })
      .select()
      .single();
    setIsSaving(false);
    if (!error) {
      setMeetings(prev => [{
        id:          data.id,
        title:       data.title,
        timestamp:   data.created_at,
        tasks:       data.tasks ?? [],
        agreements:  data.agreements ?? [],
        nextMeeting: data.next_meeting ?? null,
        rawText:     data.raw_text ?? '',
      }, ...prev]);
    }
    setSelectedMeeting(null);
  };

  // Nueva sesión
  const startNewSession = () => {
    userStoppedRef.current = true;
    setIsRecording(false);
    setTranscript('');
    setProcessed(null);
    setSelectedMeeting(null);
    interimTranscriptRef.current = '';
    recognitionRef.current?.abort();
  };

  // Seleccionar reunión anterior
  const handleSelectMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setIsRecording(false);
    setTranscript('');
    setProcessed(meeting);
  };

  // Eliminar reunión
  const handleDeleteMeeting = async (id) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) { console.error('Error eliminando reunión:', error); return; }
    setMeetings(meetings.filter(m => m.id !== id));
    if (selectedMeeting?.id === id) {
      setSelectedMeeting(null);
      setProcessed(null);
    }
  };

  /* ─── Neo-Brutalista Comic Layout ─── */
  const btnStyle = {
    background: '#FFDE03',
    color: '#0D0D0D',
    border: '4px solid #0D0D0D',
    boxShadow: '5px 5px 0 #0D0D0D',
    padding: '8px 20px',
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'transform 0.06s ease, box-shadow 0.06s ease',
  };

  const btnPressHandlers = {
    onMouseDown: e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #0D0D0D'; },
    onMouseUp:   e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; },
    onMouseLeave:e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'; },
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        meetings={meetings}
        onSelectMeeting={handleSelectMeeting}
        onDeleteMeeting={handleDeleteMeeting}
        onNewSession={startNewSession}
        meetingsUsed={meetings.length}
        freeLimit={FREE_LIMIT}
        onUpgradeClick={() => setUpgradeOpen(true)}
      />

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── HEADER ── */}
        <header style={{
          background: '#0D0D0D',
          borderBottom: '4px solid #0D0D0D',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo mark */}
            <div style={{
              background: '#FFDE03',
              border: '4px solid #0D0D0D',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Mic style={{ width: 22, height: 22, color: '#0D0D0D' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 28,
                fontWeight: 900,
                color: '#FFDE03',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                ONE-CLICK RECAP
              </h1>
              <p style={{ fontSize: 10, color: '#FFDE0388', fontWeight: 700, letterSpacing: '0.1em' }}>
                {user?.email ?? 'TRANSFORMA TUS REUNIONES EN ACCIONES'}
              </p>
            </div>
          </div>

          {/* Controles de cabecera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Botón Ajustes */}
            <button
              onClick={() => setSettingsOpen(true)}
              title={T.settings}
              style={{
                background: themeVars.accentYellow,
                border: `3px solid ${themeVars.shadow}`,
                boxShadow: `3px 3px 0 ${themeVars.shadow}`,
                padding: '7px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 12,
                fontWeight: 900,
                color: themeVars.text,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'transform 0.06s ease, box-shadow 0.06s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #0D0D0D'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${themeVars.shadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${themeVars.shadow}`; }}
            >
              <Settings style={{ width: 14, height: 14 }} />
              {T.settings}
            </button>

            {/* Botón Salir rápido */}
            <button
              onClick={signOut}
              title="Cerrar sesión"
              style={{
                background: '#E8003D',
                border: `3px solid ${themeVars.shadow}`,
                boxShadow: `3px 3px 0 ${themeVars.shadow}`,
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#FAFAFA',
                transition: 'transform 0.06s ease, box-shadow 0.06s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #0D0D0D'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${themeVars.shadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${themeVars.shadow}`; }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </header>

        {/* ── BANNER GUARDANDO ── */}
        {isSaving && (
          <div style={{
            background: '#7B2FBE', borderBottom: '4px solid #0D0D0D',
            padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>☁️</span>
            <p className="animate-pulse-comic" style={{
              fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 15,
              fontWeight: 900, color: '#FFDE03', letterSpacing: '0.08em',
              textTransform: 'uppercase', margin: 0,
            }}>
              {T.saving}
            </p>
          </div>
        )}

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Banner: reunión seleccionada */}
            {selectedMeeting && (
              <div style={{
                background: '#FFDE03',
                border: '4px solid #0D0D0D',
                boxShadow: '6px 6px 0 #0D0D0D',
                padding: '12px 18px',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#0D0D0D' }}>
                    📂 VIENDO: {selectedMeeting.title.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    {new Date(selectedMeeting.timestamp).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <button onClick={startNewSession} style={btnStyle} {...btnPressHandlers}>
                  NUEVA SESIÓN
                </button>
              </div>
            )}

            {/* Estado: Grabando */}
            {isRecording && !processed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
                <RecordingButton
                  isRecording={isRecording}
                  onToggle={toggleRecording}
                  recognizing={recognizing}
                  limitReached={limitReached}
                  onLimitClick={() => { recognitionRef.current?.stop(); setIsRecording(false); setUpgradeOpen(true); }}
                />
                <div style={{ width: '100%' }}>
                  <TranscriptDisplay transcript={transcript} isFinal={isFinal} />
                </div>
              </div>
            ) : !processed ? (
              /* Estado: en blanco → tabs GRABAR / SUBIR */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

                {/* ─ Tab switcher ─ */}
                <div style={{ display: 'flex', border: '4px solid #0D0D0D', boxShadow: '4px 4px 0 #0D0D0D' }}>
                  {[['record', T.tabRecord, '🎙'], ['upload', T.tabUpload, '📁']].map(([id, label, icon]) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      style={{
                        padding: '14px 36px',
                        background: activeTab === id ? '#FFDE03' : '#0D0D0D',
                        border: 'none',
                        borderRight: id === 'record' ? '4px solid #0D0D0D' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{
                        display: 'inline-block',
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        fontSize: 18, fontWeight: 900,
                        color: activeTab === id ? '#0D0D0D' : '#FAFAFA',
                        letterSpacing: '0.22em',
                        wordSpacing: '0.4em',
                        textTransform: 'uppercase',
                        transform: 'scaleX(1.18)',
                        transformOrigin: 'center',
                        whiteSpace: 'nowrap',
                      }}>{icon} {label}</span>
                    </button>
                  ))}
                </div>

                {/* ─ Contenido del tab activo ─ */}
                {activeTab === 'record' ? (
                  <RecordingButton
                    isRecording={isRecording}
                    onToggle={toggleRecording}
                    recognizing={recognizing}
                    limitReached={limitReached}
                    onLimitClick={() => { recognitionRef.current?.stop(); setIsRecording(false); setUpgradeOpen(true); }}
                  />
                ) : (
                  <div style={{ width: '100%', maxWidth: 520 }}>
                    <UploadZone
                      onTranscribed={handleUploadTranscribed}
                      disabled={limitReached}
                    />
                    {limitReached && (
                      <p style={{
                        marginTop: 10, textAlign: 'center', fontSize: 12,
                        fontWeight: 700, color: '#E8003D',
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        letterSpacing: '0.06em',
                      }}>
                        ⚡ {T.limitReached ?? 'PLAN LIMIT REACHED'} —{' '}
                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => setUpgradeOpen(true)}>
                          UPGRADE
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Resultados */
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#FFDE03',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    RESULTADOS
                  </h2>
                  <button onClick={startNewSession} style={{ ...btnStyle, background: '#FF5722', color: '#FAFAFA' }} {...btnPressHandlers}>
                    GRABAR DE NUEVO
                  </button>
                </div>
                <ResultsDisplay
                  processed={processed}
                  isPremium={isPremium}
                  onUpgradeClick={() => setUpgradeOpen(true)}
                  meetingTitle={processed?.title ?? 'reunion'}
                />
              </>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{
          background: '#0D0D0D',
          borderTop: '4px solid #FFDE03',
          padding: '8px 24px',
          textAlign: 'center',
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: 11,
          color: '#FFDE0366',
          letterSpacing: '0.08em',
        }}>
          © 2026 ONE-CLICK RECAP
        </footer>
      </main>

      {/* ── PANEL DE AJUSTES ── */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* ── MODAL DE UPGRADE ── */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        meetingsUsed={meetings.length}
      />
    </div>
  );
}
