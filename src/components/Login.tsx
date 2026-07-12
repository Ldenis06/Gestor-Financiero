import React, { useState } from 'react';
import { signInWithPopup, signInAnonymously, GoogleAuthProvider } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { LogIn, ShieldAlert, Sparkles, User, Wallet, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (accessToken?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || undefined;
      onLoginSuccess(token);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setError('El acceso como Invitado no está habilitado. Contactá al administrador.');
      } else {
        setError('Error al iniciar sesión como Invitado.');
      }
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-250">
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Mi Gestor Financiero
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
          Administra tus finanzas personales mes a mes de forma segura
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 py-6 px-4 shadow-sm rounded-2xl sm:px-8 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          
          <div className="space-y-4">
            <div>
              <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 font-sans">
                Selecciona un método de acceso
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/45 rounded-xl flex gap-2 items-start text-xs text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-2.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
                      <path d="M18.5 12c0-1.38-.46-2.65-1.23-3.68H12v2.78h3.47c-.29.77-.74 1.43-1.3 1.9v1.93h2.11c1.23-1.13 1.94-2.78 1.94-4.63z" fill="#4285F4"/>
                      <path d="M12 18.5c1.27 0 2.42-.42 3.23-1.12l-2.11-1.93c-.61.41-1.38.65-2.12.65-1.62 0-2.99-1.37-2.99-3s1.37-3 2.99-3c.74 0 1.51.24 2.12.65l2.11-1.93C14.42 7.92 13.27 7.5 12 7.5c-3.32 0-6 2.68-6 6s2.68 6 6 6z" fill="#34A853"/>
                      <path d="M12 5.5c.73 0 1.41.23 2 .63V4.18C13.41 3.45 12.76 3 12 3c-3.32 0-6 2.68-6 6v1.45h1.92C7.5 7.87 9.37 5.5 12 5.5z" fill="#FBBC05"/>
                      <path d="M18.5 12c0-.4-.03-.79-.1-1.18H12v2.38h3.47c-.1.28-.23.56-.38.82l2.11 1.63c1.23-1.13 1.94-2.78 1.94-4.63z" fill="#EA4335"/>
                    </svg>
                    <span>Iniciar con Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">O TAMBIÉN</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGuestLogin}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Entrar como Invitado</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Los datos se guardarán de forma segura en Firestore.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export { Login };
