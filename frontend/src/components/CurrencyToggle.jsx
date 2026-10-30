import { useCurrency } from '../context/CurrencyContext';

export { formatearPrecio as formatPrecio, useTasaDolar } from '../context/CurrencyContext';

export default function CurrencyToggle() {
  const { moneda, toggleMoneda, tasa, cargando } = useCurrency();

  return (
    <button
      type="button"
      onClick={toggleMoneda}
      className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
      title={moneda === 'USD' ? 'Cambiar precios a Bolivares' : 'Cambiar precios a Dolares'}
    >
      <span>{moneda === 'USD' ? '💵 USD' : '🇻🇪 Bs'}</span>
      <span className="text-[10px] font-mono opacity-70">
        {cargando ? '...' : `${Number(tasa).toFixed(2)}`}
      </span>
    </button>
  );
}
