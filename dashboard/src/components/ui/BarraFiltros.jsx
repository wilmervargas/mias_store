import Icono from './Icono';
import { inputClass } from './Campo';

export const Buscador = ({ valor, onChange, placeholder = 'Buscar...', className = '' }) => (
  <div className={`relative ${className}`}>
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
      <Icono nombre="buscar" className="w-4 h-4" />
    </span>
    <input
      type="search"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClass} pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden`}
    />
    {valor && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Limpiar búsqueda"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-colors"
      >
        <Icono nombre="cerrar" className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export const BarraFiltros = ({
  children,
  total,
  etiqueta = 'registros',
  onLimpiar,
  puedeLimpiar = false,
  className = '',
}) => (
  <div className={`p-3 bg-white border border-gray-200 rounded-2xl shadow-sm dark:bg-gray-900 dark:border-gray-800 ${className}`}>
    <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2">
      {children}
      {onLimpiar && (
        <button
          type="button"
          onClick={onLimpiar}
          disabled={!puedeLimpiar}
          className="px-3 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"
        >
          <Icono nombre="deshacer" className="w-3.5 h-3.5" />
          Limpiar
        </button>
      )}
    </div>
    {typeof total === 'number' && (
      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-500 font-mono dark:border-gray-800 dark:text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
        {total.toLocaleString('es-VE')} {etiqueta}
      </div>
    )}
  </div>
);
