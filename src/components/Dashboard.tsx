import React, { useState } from 'react';
import { MonthSummary } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';

interface DashboardProps {
  summary: MonthSummary;
  hideBalances?: boolean;
}

export default function Dashboard({ summary, hideBalances = false }: DashboardProps) {
  const [mostrarInfoPlataInicial, setMostrarInfoPlataInicial] = useState(false);
  // Format currency in Spanish AR style
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val).replace('ARS', '$');
  };

  const cards = [
    {
      id: 'plata-inicial',
      title: 'Plata Inicial',
      value: summary.plataInicial,
      cardClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400',
      titleClass: 'text-slate-400 dark:text-slate-500',
      valueClass: 'text-slate-500 dark:text-slate-400'
    },
    {
      id: 'dinero-ingresado',
      title: 'Dinero Ingresado',
      value: summary.ingresos,
      cardClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400',
      titleClass: 'text-emerald-500 dark:text-emerald-400',
      valueClass: 'text-emerald-600 dark:text-emerald-450'
    },
    {
      id: 'dinero-gastado',
      title: 'Dinero Gastado',
      value: summary.gastos,
      cardClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400',
      titleClass: 'text-rose-500 dark:text-rose-400',
      valueClass: 'text-rose-600 dark:text-rose-450'
    },
    {
      id: 'total-inversion',
      title: 'Total Inversión',
      value: summary.inversiones,
      cardClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400',
      titleClass: 'text-amber-500 dark:text-amber-400',
      valueClass: 'text-amber-600 dark:text-amber-450'
    },
    {
      id: 'dinero-cuenta',
      title: 'Dinero en Cuenta',
      value: summary.dineroEnCuenta,
      cardClass: 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      titleClass: 'text-indigo-500 dark:text-indigo-400',
      valueClass: 'text-indigo-700 dark:text-indigo-300'
    },
    {
      id: 'dinero-efectivo',
      title: 'Efectivo',
      value: summary.efectivo,
      cardClass: 'bg-cyan-50/40 dark:bg-cyan-950/10 border-cyan-100 dark:border-cyan-900/30 text-cyan-700 dark:text-cyan-300',
      titleClass: 'text-cyan-500 dark:text-cyan-400',
      valueClass: 'text-cyan-700 dark:text-cyan-300'
    },
    {
      id: 'total-actual',
      title: 'Total (Plata Actual)',
      value: summary.totalActual,
      cardClass: 'bg-blue-600 dark:bg-blue-700 border-blue-700 dark:border-blue-800 text-white shadow-sm ring-1 ring-blue-700/10 col-span-2 md:col-span-2 lg:col-span-1',
      titleClass: 'text-blue-100 dark:text-blue-200',
      valueClass: 'text-white'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6"
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          variants={itemVariants}
          whileHover={{ y: -2, transition: { duration: 0.1 } }}
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-150 ${card.cardClass}`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${card.titleClass}`}>
                {card.title}
              </p>
              {card.id === 'plata-inicial' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarInfoPlataInicial((prev) => !prev);
                  }}
                  className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition cursor-pointer"
                  title="¿Qué es la Plata Inicial?"
                >
                  <Info className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className={`text-lg font-bold font-mono tracking-tight leading-tight select-none ${card.valueClass}`}>
              {hideBalances ? '••••••' : formatCurrency(card.value)}
            </p>
          </div>

          {card.id === 'plata-inicial' && (
            <AnimatePresence>
              {mostrarInfoPlataInicial && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 font-sans">
                    Se calcula sumando lo que tenías en cuenta y en efectivo al terminar el mes anterior. Los fondos sobrantes de cada mes pasan automáticamente al siguiente.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
