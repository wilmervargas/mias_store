import { useTheme } from '../../context/ThemeContext';
import { useCarrito } from '../../context/CarritoContext';

export default function Header({ onMenu }) {
  const { isDark, toggleTheme } = useTheme();
  const { totalArticulos, totalPrecio } = useCarrito();

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white/90'}`}>
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className={`rounded-lg p-2 lg:hidden ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">M</div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mia&apos;s Store</p>
              <p className="truncate text-xs text-slate-500">Tienda online</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>

          <div className={`hidden sm:block text-right ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="text-[10px] block font-mono">Total</span>
            <span className="text-sm font-bold text-emerald-500">${totalPrecio.toFixed(2)}</span>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
            isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-700'
          }`} title="Carrito">
            <span>🛒</span>
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 font-mono text-white">{totalArticulos}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
