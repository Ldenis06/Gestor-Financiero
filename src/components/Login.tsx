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
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.39 3.68 1.48 7.59l3.75 2.91C6.18 7.32 8.87 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.5z" />
                      <path fill="#FBBC05" d="M5.23 10.5c-.23-.68-.36-1.41-.36-2.17s.13-1.49.36-2.17L1.48 3.25C.53 5.16 0 7.29 0 9.53s.53 4.37 1.48 6.28l3.75-2.91z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.13
