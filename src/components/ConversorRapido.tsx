import { useEffect, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface Cotizaciones {
  dolarOficial: number;
  dolarBlue: number;
  euroOficial: number;
  euroBlue: number; // calculado, ver explicación abajo
}

type Direccion = 'pesosADivisas' | 'dolaresAPesos';

export default function ConversorRapido() {
  const [direccion, setDireccion] = useState<Direccion>('pesosADivisas');
  const [monto, setMonto] = useState<string>('1000');
  const [cotizaciones, setCotizaciones] = useState<Cotizaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function cargar() {
      try {
        const [dolaresRes, euroRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares'),
          fetch('https://dolarapi.com/v1/cotizaciones/eur'),
        ]);
        if (!dolaresRes.ok || !euroRes.ok) throw new Error('fetch failed');

        const dolares = await dolaresRes.json();
        const euro = await euroRes.json();

        const oficial = dolares.find((d: any) => d.casa === 'oficial');
        const blue = dolares.find((d: any) => d.casa === 'blue');

        if (!active) return;

        if (!oficial || !blue) throw new Error('missing data');

        const dolarOficial = oficial.venta;
        const dolarBlue = blue.venta;
        const euroOficial = euro.venta;

        // El Euro Blue no existe como dato público directo: lo estimamos aplicando
        // al Euro Oficial la misma proporción (brecha) que hay entre el Dólar Blue y el Oficial.
        const brecha = dolarBlue / dolarOficial;
        const euroBlue = euroOficial * brecha;

        setCotizaciones({ dolarOficial, dolarBlue, euroOficial, euroBlue });
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

  // Filas para cuando el monto que escribís es en PESOS (se muestra a cuánto equivale en divisas)
  const filasPesosADivisas = cotizaciones
    ? [
        { label: 'Dólar Oficial', valor: montoNum / cotizaciones.dolarOficial, moneda: 'US$' },
        { label: 'Dólar Blue', valor: montoNum / cotizaciones.dolarBlue, moneda: 'US$' },
        { label: 'Euro Oficial', valor: montoNum / cotizaciones.euroOficial, moneda: '€' },
        { label: 'Euro Blue (estimado)', valor: montoNum / cotizaciones.euroBlue, moneda: '€' },
      ]
    : [];

  // Filas para cuando el monto que escribís es en DÓLARES (se muestra a cuántos pesos equivale)
  const filasDolaresAPesos = cotizaciones
    ? [
        { label: 'Según Dólar Oficial', valor: montoNum * cotizaciones.dolarOficial, moneda: '$' },
        { label: 'Según Dólar Blue', valor: montoNum * cotizaciones.dolarBlue, moneda: '$' },
      ]
    : [];

  const filas = direccion === 'pesosADivisas' ? filasPesosADivisas : filasDolaresAPesos;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          Conversor Rápido
        </h3>
      </div>

      {/* Selector de dirección */}
      <div className="flex gap-1.5 mb-3 bg-slate-50 dark:bg-slate-950 p-1
