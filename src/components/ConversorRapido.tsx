import { useEffect, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface Cotizaciones {
  dolarOficial: number;
  dolarBlue: number;
}

type Direccion = 'dolarAPesos' | 'pesosADolar';

export default function ConversorRapido() {
  const [direccion, setDireccion] = useState<Direccion>('dolarAPesos');
  const [monto, setMonto] = useState<string>('1');
  const [cotizaciones, setCotizaciones] = useState<Cotizaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function cargar() {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares');
        if (!res.ok) throw new Error('fetch failed');

        const dolares = await res.json();
        const oficial = dolares.find((d: any) => d.casa === 'oficial');
        const blue = dolares.find((d: any) => d.casa === 'blue');

        if (!active) return;
        if (!oficial || !blue) throw new Error('missing data');

        setCotizaciones({
          dolarOficial: oficial.venta,
          dolarBlue: blue.venta
        });
        setLoading(false);
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    }

    cargar();
    const interval = setInterval(cargar, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const montoNum = parseFloat(monto.replace(',', '.')) || 0;

  const filas = cotizaciones
    ? direccion === 'dolarAPesos'
      ? [
          { label: 'Dólar Oficial', valor: montoNum * cotizaciones.dolarOficial, moneda: '$' },
          { label: 'Dólar Blue', valor: montoNum * cotizaciones.dolarBlue, moneda: '$' }
        ]
      : [
          { label: 'Dólar Oficial', valor: montoNum / cotizaciones.dolarOficial, moneda: 'US$' },
          { label: 'Dólar Blue', valor: montoNum / cotizaciones.dolarBlue, moneda: 'US$' }
        ]
    : [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          Conversor Dólar ↔ Peso
        </h3>
      </div>

      {/* Selector de dirección */}
      <div className="flex gap-1.5 mb-3 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setDireccion('dolarAPesos')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition ${
            direccion === 'dolarAPesos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          Dólar → Peso
        </button>
        <button
          onClick={() => setDireccion('pesosADolar')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition ${
            direccion === 'pesosADolar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          Peso → Dólar
        </button>
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
          {direccion === 'dolarAPesos' ? 'Monto en dólares (USD)' : 'Monto en pesos (ARS)'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">
            {direccion === 'dolarAPesos' ? 'US$' : '$'}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-2">Cargando cotización...</p>
      ) : error ? (
        <p className="text-[11px] text-rose-500 text-center py-2">No se pudo cargar el dólar. Probá de nuevo más tarde.</p>
      ) : (
        <div className="space-y-1.5">
          {filas.map((fila) => (
            <div
              key={fila.label}
              className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2"
            >
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{fila.label}</span>
              <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                {fila.moneda} {fila.valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
