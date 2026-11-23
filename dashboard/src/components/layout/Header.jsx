import Icono from '../ui/Icono';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ onMenu, moduloActual }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Abrir menú"
          >
            <Icono nombre="menu" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {moduloActual?.titulo || "Panel administrativo"}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {moduloActual?.grupo ? `${moduloActual.grupo} · Mia's Store` : "Mia's Store"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <Icono nombre={isDark ? 'sol' : 'luna'} className="h-4 w-4" />
            <span className="hidden sm:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            MS
          </div>
        </div>
      </div>
    </header>
  );
}
