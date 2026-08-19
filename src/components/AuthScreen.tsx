import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User as UserIcon,
  Mail,
  ArrowRight,
  Cloud,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { loginWithPassword, registerWithPassword, loginWithGoogle, enableGuestMode } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestCreateAccount, setSuggestCreateAccount] = useState(false);

  const handleQuickCreateAccount = async () => {
    const userToCreate = username.trim() || identifier.trim();
    if (!userToCreate) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await registerWithPassword(userToCreate, email.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    setMode('register');
    setErrorMessage(null);
    setSuggestCreateAccount(false);
    if (!username && identifier) {
      setUsername(identifier);
    }
    if (password && !confirmPassword) {
      setConfirmPassword(password);
    }
  };

  const handleSwitchToLogin = () => {
    setMode('login');
    setErrorMessage(null);
    setSuggestCreateAccount(false);
    if (!identifier && username) {
      setIdentifier(username);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuggestCreateAccount(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!identifier.trim() || !password) {
          throw new Error('Por favor ingresa tu usuario/correo y contraseña');
        }
        await loginWithPassword(identifier, password);
      } else {
        const targetUser = username.trim() || identifier.trim();
        if (!targetUser) {
          throw new Error('Por favor ingresa tu nombre o usuario');
        }
        if (!password || password.length < 3) {
          throw new Error('Por favor ingresa una contraseña válida (mínimo 3 caracteres)');
        }
        if (confirmPassword && password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        await registerWithPassword(targetUser, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let userFriendlyMsg = 'Ocurrió un error al procesar la autenticación.';
      const code = err.code || err.message || '';
      
      if (code.includes('no encontrado') || code.includes('user-not-found') || code.includes('invalid-credential')) {
        userFriendlyMsg = 'Usuario o correo no encontrado. Puedes crearlo ahora mismo con un solo clic.';
        setSuggestCreateAccount(true);
      } else if (code.includes('auth/email-already-in-use') || code.includes('ya está registrado')) {
        userFriendlyMsg = 'Este usuario ya está registrado. Por favor inicia sesión con tu contraseña.';
      } else if (code.includes('auth/weak-password')) {
        userFriendlyMsg = 'La contraseña es muy corta. Usa al menos 3 caracteres.';
      } else if (code.includes('auth/popup-closed-by-user')) {
        userFriendlyMsg = 'La ventana de Google se cerró antes de completar el inicio de sesión.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }
      setErrorMessage(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (!err.message?.includes('popup-closed')) {
        setErrorMessage('No se pudo iniciar sesión con Google. Intenta con usuario y contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand / Logo header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 border border-blue-400/20 mb-2">
            <Cloud className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>D'RAYO PRO</span>
            <span className="text-xs uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-400/30">
              Cloud
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Base de datos sincronizada en tiempo real para todos tus dispositivos
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error Message with Quick Action */}
          {errorMessage && (
            <div className="bg-red-950/60 border border-red-800/80 p-3.5 rounded-2xl text-xs text-red-200 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>

              {suggestCreateAccount && (
                <button
                  type="button"
                  onClick={handleQuickCreateAccount}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Crear cuenta "{identifier || username}" ahora</span>
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nombre o Usuario</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. carlos_ventas"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Correo Electrónico (opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Usuario o Correo Electrónico</span>
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Tu usuario o correo..."
                  className="w-full bg-slate-950/80 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contraseña</span>
                </span>
                <span className="text-[11px] text-slate-500">Mínimo 3 caracteres</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Confirmar Contraseña</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Ingresar a mi Base de Datos' : 'Registrar y Sincronizar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold absolute">
              o
            </span>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Iniciar con Google</span>
          </button>

          {/* Offline / Guest Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={enableGuestMode}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Continuar en Modo Local / Demostración
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
