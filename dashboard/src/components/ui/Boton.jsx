import Icono from './Icono';

const VARIANTES = {
  primario: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-sm border-0 dark:from-pink-500 dark:to-purple-600',
  exito: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600',
  neutral: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700',
  fantasma: 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white',
  advertencia: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  peligro: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600',
  info: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
};

const TAMANOS = {
  sm: 'px-2.5 py-1.5 text-[11px] gap-1',
  md: 'px-4 py-2 text-xs gap-1.5',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const Boton = ({
  children,
  variante = 'neutral',
  tamano = 'md',
  icono,
  cargando = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center rounded-[6px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${VARIANTES[variante] || VARIANTES.neutral} ${TAMANOS[tamano] || TAMANOS.md} ${className}`}
      {...props}
    >
      {cargando ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : icono ? (
        <Icono nombre={icono} className={tamano === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
};

export default Boton;
