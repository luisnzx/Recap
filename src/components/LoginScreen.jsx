import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '4px solid #0D0D0D',
    boxShadow: '4px 4px 0 #0D0D0D',
    fontSize: 15,
    fontWeight: 700,
    background: '#FAFAFA',
    color: '#0D0D0D',
    outline: 'none',
    fontFamily: 'Arial, Helvetica, sans-serif',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '0.08em',
    color: '#0D0D0D',
    marginBottom: 6,
  };

  const btnPress = {
    onMouseDown: e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #0D0D0D'; },
    onMouseUp:   e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = e.currentTarget.dataset.shadow; },
    onMouseLeave:e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = e.currentTarget.dataset.shadow; },
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: authError } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setMessage('¡Revisa tu correo para confirmar tu cuenta!');
    }
  };

  const handleGoogle = async () => {
    setError('');
    const { error: authError } = await signInWithGoogle();
    if (authError) setError(authError.message);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#5C1EA8',
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 1.5px, transparent 1.5px)',
      backgroundSize: '18px 18px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Header */}
        <div style={{
          background: '#0D0D0D',
          border: '4px solid #0D0D0D',
          padding: '18px 28px',
          marginBottom: 0,
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 32,
            fontWeight: 900,
            color: '#FFDE03',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            🎙 ONE-CLICK RECAP
          </h1>
          <p style={{ fontSize: 11, color: '#FFDE0377', fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>
            {isSignUp ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FAFAFA',
          border: '4px solid #0D0D0D',
          borderTop: 'none',
          boxShadow: '8px 8px 0 #0D0D0D',
          padding: '32px 28px',
        }}>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            data-shadow="5px 5px 0 #0D0D0D"
            {...btnPress}
            style={{
              width: '100%',
              padding: '13px 16px',
              background: '#FFDE03',
              color: '#0D0D0D',
              border: '4px solid #0D0D0D',
              boxShadow: '5px 5px 0 #0D0D0D',
              fontFamily: 'Impact, Arial Black, sans-serif',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {/* Google icon SVG */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-7.9 19.6-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.2 35.7 26.7 36.5 24 36.5c-5.3 0-9.7-3.5-11.3-8.3l-6.6 5.1C9.9 39.7 16.4 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6.1l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            ENTRAR CON GOOGLE
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 3, background: '#0D0D0D' }} />
            <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, color: '#0D0D0D', letterSpacing: '0.1em' }}>O</span>
            <div style={{ flex: 1, height: 3, background: '#0D0D0D' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>CORREO ELECTRÓNICO</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>

            {/* Error: bocadillo de cómic */}
            {error && (
              <div style={{ marginBottom: 16, position: 'relative' }}>
                {/* Cuerpo del bocadillo */}
                <div style={{
                  background: '#FAFAFA',
                  border: '5px solid #E8003D',
                  boxShadow: '6px 6px 0 #E8003D',
                  padding: '14px 16px',
                }}>
                  <p style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#E8003D',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                    ⚡ ¡RAYOS! ALGO SALIÓ MAL EN LA MATRIZ
                  </p>
                  <p style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#0D0D0D',
                    marginTop: 6,
                    marginBottom: 0,
                  }}>
                    {error}
                  </p>
                </div>
                {/* Cola del bocadillo (triángulo apuntando hacia abajo-izquierda) */}
                <div style={{
                  position: 'absolute',
                  bottom: -17,
                  left: 24,
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid #E8003D',
                  borderTop: '18px solid #E8003D',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: -11,
                  left: 27,
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid #FAFAFA',
                  borderTop: '13px solid #FAFAFA',
                }} />
              </div>
            )}
            {message && (
              <div style={{
                background: '#00C853',
                border: '3px solid #0D0D0D',
                color: '#FAFAFA',
                padding: '10px 14px',
                marginBottom: 16,
                fontWeight: 700,
                fontSize: 13,
              }}>
                ✓ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-shadow="5px 5px 0 #0D0D0D"
              {...btnPress}
              style={{
                width: '100%',
                padding: '13px 16px',
                background: '#FF5722',
                color: '#FAFAFA',
                border: '4px solid #0D0D0D',
                boxShadow: '5px 5px 0 #0D0D0D',
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'CARGANDO...' : isSignUp ? 'CREAR CUENTA' : 'ENTRAR'}
            </button>
          </form>

          {/* Toggle sign up / sign in */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                color: '#5C1EA8',
                textDecoration: 'underline',
                textDecorationThickness: 2,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {isSignUp ? '¿Ya tienes cuenta? INICIA SESIÓN' : '¿Sin cuenta? REGÍSTRATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
