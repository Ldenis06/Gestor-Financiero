import React from 'react';
import { LogOut, User, Calendar, ChevronLeft, ChevronRight, TrendingUp, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';

interface HeaderProps {
  user: FirebaseUser | null;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hideBalances: boolean;
  onToggleHideBalances: () => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Header({
  user,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onLogout,
  darkMode,
  onToggleDarkMode,
  hideBalances,
  onToggleHideBalances
}: HeaderProps) {

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <header id="app-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Mi Gestor Financiero
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                Control personal de ingresos, gastos y efectivo
              </p>
            </div>
          </div>

          {/* Month / Year Selector */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-3xs dark:shadow-none"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-300 text-xs focus:outline-none cursor-pointer border-none"
              >
                {MESES.map((mes, idx) => (
                  <option key={idx} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{mes}</option>
                ))}
              </select>

              <span className="text-slate-300 dark:text-slate-700">/</span>

              <input
                type="number"
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value) || new Date().getFullYear())}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-300 text-xs w-12 text-center focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="2000"
                max="2100"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-3xs dark:shadow-none"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User profile / Logout */}
          {user && (
            <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.displayName || 'Usuario'}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">
                    {user.isAnonymous ? 'Modo Invitado' : user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Mostrar/Ocultar montos */}
                <button
                  onClick={onToggleHideBalances}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={hideBalances ? 'Mostrar montos' : 'Ocultar montos'}
                >
                  {hideBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={onToggleDarkMode}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition border border-transparent hover:border-rose-100 dark:hover:border-rose-950/60 cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
export { MESES };
