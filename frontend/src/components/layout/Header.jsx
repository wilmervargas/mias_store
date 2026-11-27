import { useTheme } from '../../context/ThemeContext';
import { useCarrito } from '../../context/CarritoContext';
import { useEmpresa, nombreEmpresa } from '../../hooks/useEmpresa';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { totalArticulos, totalPrecio } = useCarrito();
  const empresa = useEmpresa();
  const nombre = nombreEmpresa(empresa);
  const logo = empresa?.logo_url || null;
  const eslogan = empresa?.eslogan || 'Boutique online';

  return (
    <header className="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/80 backdrop-blur-xl transition-colors duration-300 dark:border-plum-700/70 dark:bg-plum-900/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {logo ? (
            <img src={logo} alt={nombre} className="h-11 w-11 shrink-0 rounded-2xl object-contain bg-white shadow-lg shadow-blush-500/20" />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blush-400 via-blush-500 to-peach-300 font-display text-xl font-bold text-white shadow-lg shadow-blush-500/30">
              {String(nombre).trim().charAt(0).toUpperCase() || 'M'}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold tracking-wide text-plum-800 dark:text-cream-50">
              {nombre}
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-blush-500 dark:text-blush-300">
              {eslogan}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-plum-700 shadow-sm transition-all hover:border-blush-300 hover:text-blush-600 dark:border-plum-700 dark:bg-plum-800/80 dark:text-cream-100 dark:hover:border-blush-400/60 dark:hover:text-blush-300"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>

          <div className="hidden items-center gap-3 rounded-full border border-cream-200 bg-white/70 px-4 py-2 sm:flex dark:border-plum-700 dark:bg-plum-800/70">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-plum-400 dark:text-cream-200/60">
              Total
            </span>
            <span className="text-sm font-bold text-blush-600 dark:text-blush-300">
              ${totalPrecio.toFixed(2)}
            </span>
          </div>

          <div
            className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blush-500 to-blush-400 text-white shadow-lg shadow-blush-500/25"
            title="Carrito"
          >
            <span className="text-base">🛒</span>
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-cream-50 bg-plum-800 px-1 text-[10px] font-bold text-cream-50 dark:border-plum-900">
              {totalArticulos}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
