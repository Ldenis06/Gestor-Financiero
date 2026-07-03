import React from 'react';
import { MonthSummary } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  summary: MonthSummary;
}

export default function Dashboard({ summary }: DashboardProps) {
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
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
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
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${card.titleClass}`}>
              {card.title}
            </p>
            <p className={`text-lg font-bold font-mono tracking-tight leading-tight ${card.valueClass}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
