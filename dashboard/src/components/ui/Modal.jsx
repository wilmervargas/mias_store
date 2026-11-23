import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icono from './Icono';

const TONOS = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  peligro: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  advertencia: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  exito: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  info: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
};

const Modal = ({
  titulo,
  subtitulo,
  icono = 'catalogo',
  tono = 'neutral',
  onClose,
  children,
  footer,
  maxW = 'max-w-lg',
  cerrarAlClicFuera = true,
}) => {
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', alPresionar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/80"
      onMouseDown={(e) => {
        if (cerrarAlClicFuera && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${maxW} max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800`}
      >
        <header className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className={`w-10 h-10 shrink-0 rounded-2xl border flex items-center justify-center ${TONOS[tono] || TONOS.neutral}`}>
            <Icono nombre={icono} className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">{titulo}</h2>
            {subtitulo && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800"
          >
            <Icono nombre="cerrar" className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {children}
        </div>

        {footer && (
          <footer className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-end gap-2 dark:border-slate-800 dark:bg-slate-900/95">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
