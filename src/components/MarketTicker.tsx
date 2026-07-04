import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Cada item de la cinta: una etiqueta, un valor formateado, y si subió o bajó
interface TickerItem {
  id: string;
  label: string;
  value: string;
  changePercent: number; // positivo = subió, negativo = bajó
}

// Formatea un número como precio en pesos argentinos
function formatARS(n: number): string {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

// Formatea un número como precio en dólares
function formatUSD(n: number): string {
  return `US$${n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 4 : 2 })}`;
}

async function fetchDolares(): Promise<TickerItem[]> {
  try {
    const res = await fetch('https://dolarapi.com/v1/ambito/dolares');
    if (!res.ok) return [];
    const data = await res.json();
    const nombres: Record<string, string> = {
      oficial: 'Dólar Oficial',
      blue: 'Dólar Blue',
      bolsa: 'Dólar MEP',
      contadoconliqui: 'Dólar CCL',
    };
    return data
      .filter((d: any) => nombres[d.casa])
      .map((d: any) => ({
        id: `dolar-${d.casa}`,
        label: nombres[d.casa],
        value: formatARS(d.venta),
        changePercent: typeof d.variacion === 'number' ? d.variacion : 0,
      }));
  } catch {
    return [];
  }
}

async function fetchCriptos(): Promise<TickerItem[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
    );
    if (!res.ok) return [];
    const data = await res.json();
    const nombres: Record<string, string> = { bitcoin: 'Bitcoin', ethereum: 'Ethereum' };
    return Object.keys(nombres).map((key) => ({
      id: `cripto-${key}`,
      label: nombres[key],
      value: formatUSD(data[key]?.usd ?? 0),
      changePercent: data[key]?.usd_24h_change ?? 0,
    }));
  } catch {
    return [];
  }
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAll() {
      const [dolares, criptos] = await Promise.all([fetchDolares(), fetchCriptos()]);
      if (active) {
        setItems([...dolares, ...criptos]);
        setLoading(false);
      }
    }

    loadAll();
    // Actualiza los valores cada 5 minutos
    const interval = setInterval(loadAll, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || items.length === 0) {
    return null;
  }

  // Duplicamos la lista para que el scroll sea infinito y no se note el "salto"
  const loopItems = [...items, ...items];

  return (
    <div className="w-full bg-slate-900 dark:bg-black overflow-hidden border-b border-slate-800 select-none">
      <div className="flex w-max animate-market-ticker">
        {loopItems.map((item, index) => {
          const isUp = item.changePercent >= 0;
          return (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-2 px-5 py-2 whitespace-nowrap text-xs font-semibold"
            >
              <span className="text-slate-300">{item.label}</span>
              <span className="text-white">{item.value}</span>
              <span
                className={`flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
