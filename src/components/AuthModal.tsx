import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: any;
}

export function AuthModal({ isOpen, onClose, state }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cleanLocalData, setCleanLocalData] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (cleanLocalData && state.clearAllUserDataAndLogout) {
        // Limpiar información local previa para arrancar fresco con la cuenta ingresada
        await state.clearAllUserDataAndLogout();
      }

      if (tab === 'login') {
        if (!email.trim() || !password) throw new Error('Ingresa tu correo y contraseña');
        await state.loginWithEmail(email, password);
        onClose();
      } else if (tab === 'register') {
        if (!email.trim() || !password) throw new Error('Ingresa un correo y una contraseña');
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
        await state.registerWithEmail(email, password, displayName.trim() || 'Estudiante');
        if (displayName.trim() && state.updateUserProfile) {
          state.updateUserProfile({ name: displayName.trim() });
        }
        onClose();
      } else if (tab === 'forgot') {
        if (!email.trim()) throw new Error('Ingresa tu correo para restablecer la contraseña');
        await state.resetPassword(email);
        setSuccessMsg('Se ha enviado un enlace para restablecer tu contraseña a tu correo. Revisa tu bandeja.');
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      let msg = err.message || 'Ocurrió un error al procesar la solicitud.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'El formato de correo no es válido.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (cleanLocalData && state.clearAllUserDataAndLogout) {
        await state.clearAllUserDataAndLogout();
      }
      await state.loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Error con Google Auth:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-5 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs font-black text-xl mb-2">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {tab === 'login' ? 'Bienvenido a tu Organizador' : tab === 'register' ? 'Crear Cuenta Escolar' : 'Recuperar Contraseña'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {tab === 'login' 
              ? 'Inicia sesión con tu correo o Google para sincronizar tus deberes en la nube' 
              : tab === 'register' 
                ? 'Regístrate para guardar y proteger tus horarios y boletín' 
                : 'Ingresa tu correo para recibir las instrucciones de recuperación'}
          </p>
        </div>

        {/* Pestañas de Login / Registro */}
        {tab !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Mensajes de Alerta */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Botón de Google */}
        {tab !== 'forgot' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 rounded-2xl border border-slate-200 shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-50 hover:border-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{tab === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">o con correo</span>
            </div>
          </div>
        )}

        {/* Formulario de Email / Password */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Helen Nicole Yard"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="tu_correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Contraseña</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(''); }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            </div>
          )}

          {/* Opción de Privacidad: Limpiar información local previa */}
          <label className="flex items-start gap-2 pt-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={cleanLocalData}
              onChange={(e) => setCleanLocalData(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span>Limpiar datos locales de este equipo antes de iniciar (recomendado si es una computadora compartida).</span>
          </label>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : tab === 'login' ? (
              <LogIn size={15} />
            ) : tab === 'register' ? (
              <UserPlus size={15} />
            ) : (
              <Mail size={15} />
            )}
            <span>
              {loading 
                ? 'Procesando...' 
                : tab === 'login' 
                  ? 'Iniciar Sesión' 
                  : tab === 'register' 
                    ? 'Crear Cuenta' 
                    : 'Enviar Enlace de Recuperación'}
            </span>
          </button>
        </form>

        {/* Volver a Login desde Forgot */}
        {tab === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              ← Volver a Iniciar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
