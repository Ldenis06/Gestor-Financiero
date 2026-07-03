import React, { useState } from 'react';
import { Calendar, Tag, DollarSign, PenTool, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionFormProps {
  onAddTransaction: (data: {
    fecha: string;
    categoria: 'Ingreso' | 'Gasto' | 'Inversion' | 'Ef+' | 'Ef-';
    monto: number;
    motivo: string;
  }) => Promise<void>;
  selectedMonth: number;
  selectedYear: number;
}

export default function TransactionForm({ onAddTransaction, selectedMonth, selectedYear }: TransactionFormProps) {
  // Set default date as current date formatted in selected month/year to prevent out of bounds
  const getInitialDateString = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    if (todayYear === selectedYear && todayMonth === selectedMonth) {
      return today.toISOString().split('T')[0];
    }
    
    // Default to the first day of the selected month/year
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${formattedMonth}-01`;
  };

  const [fecha, setFecha] = useState<string>(getInitialDateString());
  const [categoria, setCategoria] = useState<'Ingreso' | 'Gasto' | 'Inversion' | 'Ef+' | 'Ef-'>('Ingreso');
  const [monto, setMonto] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sync date input if user shifts selected month/year and current date is no longer in range
  React.useEffect(() => {
    setFecha(getInitialDateString());
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valMonto = parseFloat(monto);
    if (!fecha || !categoria || isNaN(valMonto) || valMonto <= 0 || !motivo.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onAddTransaction({
        fecha,
        categoria,
        monto: valMonto,
        motivo: motivo.trim()
      });
      // Reset form but keep date and category for user convenience
      setMonto('');
      setMotivo('');
    } catch (error) {
      console.error("Error al guardar la transacción:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-transaction-form-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors duration-200">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-500" />
        Nuevo Movimiento
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row for Fecha & Categoría */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans cursor-pointer transition-colors duration-150"
            >
              <option value="Ingreso" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ingreso</option>
              <option value="Gasto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Gasto</option>
              <option value="Inversion" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Inversión</option>
              <option value="Ef+" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef+ (Efectivo)</option>
              <option value="Ef-" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef- (Efectivo)</option>
            </select>
          </div>
        </div>

        {/* Monto */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs">$</span>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full text-xs pl-6 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono transition-colors duration-150"
              required
            />
          </div>
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Motivo / Detalle
          </label>
          <input
            type="text"
            placeholder="Ej: Compra supermercado mensual..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
            maxLength={100}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>AGREGAR REGISTRO</span>
          )}
        </button>
      </form>
    </div>
  );
}
export { TransactionForm };
