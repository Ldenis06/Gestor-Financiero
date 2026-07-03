import React, { useState } from 'react';
import { Trash2, Search, Filter, AlertCircle, Info, ArrowUpRight, ArrowDownRight, PiggyBank, Coins } from 'lucide-react';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
}

export default function TransactionList({ transactions, onDeleteTransaction, loading }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Format currency in Spanish AR style
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val).replace('ARS', '$');
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Ingreso':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/35',
          dot: 'bg-emerald-500',
          icon: <ArrowUpRight className="w-3 h-3" />
        };
      case 'Gasto':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/35',
          dot: 'bg-rose-500',
          icon: <ArrowDownRight className="w-3 h-3" />
        };
      case 'Inversion':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/35',
          dot: 'bg-amber-500',
          icon: <PiggyBank className="w-3 h-3" />
        };
      case 'Ef+':
        return {
          bg: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/35',
          dot: 'bg-cyan-500',
          icon: <Coins className="w-3 h-3" />
        };
      case 'Ef-':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-500',
          icon: <Coins className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: null
        };
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div id="transaction-list-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors duration-200">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            Historial del Mes
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase transition-colors duration-200">
              {filteredTransactions.length} mov.
            </span>
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 max-w-md w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans cursor-pointer appearance-none min-w-[110px] transition-colors duration-150"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Todas</option>
              <option value="Ingreso" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ingresos</option>
              <option value="Gasto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Gastos</option>
              <option value="Inversion" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Inversión</option>
              <option value="Ef+" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef (+)</option>
              <option value="Ef-" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef (-)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[11px] font-semibold">Cargando movimientos...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-850">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            No hay movimientos registrados
          </h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
            {searchTerm || categoryFilter !== 'all' 
              ? 'No hay resultados para el filtro actual. Prueba con otros términos.'
              : 'Agrega tu primer ingreso, gasto, inversión o ajuste de efectivo usando el formulario lateral.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:-mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                      Fecha
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                      Categoría
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                      Motivo / Concepto
                    </th>
                    <th scope="col" className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                      Monto
                    </th>
                    <th scope="col" className="px-4 py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  <AnimatePresence initial={false}>
                    {filteredTransactions.map((t) => {
                      const catStyle = getCategoryStyles(t.categoria);
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.1 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                            {t.fecha}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${catStyle.bg}`}>
                              {t.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium max-w-[180px] truncate font-sans" title={t.motivo}>
                            {t.motivo}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-right text-[11px] font-bold font-mono">
                            <span className={
                              t.categoria === 'Ingreso' || t.categoria === 'Ef+' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : t.categoria === 'Gasto' || t.categoria === 'Ef-' 
                                  ? 'text-rose-600 dark:text-rose-400' 
                                  : 'text-amber-600 dark:text-amber-400'
                            }>
                              {t.categoria === 'Gasto' || t.categoria === 'Inversion' || t.categoria === 'Ef-' ? '-' : '+'}
                              {formatCurrency(t.monto)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar el registro "${t.motivo}"?`)) {
                                  onDeleteTransaction(t.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 rounded transition cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export { TransactionList };
