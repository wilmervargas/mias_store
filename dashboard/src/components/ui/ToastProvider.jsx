import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icono from './Icono';

const ToastContext = createContext(null);

const ESTILOS = {
  exito: {
    icono: 'check',
    borde: 'border-emerald-200 dark:border-emerald-500/30',
    fondo: 'bg-emerald-50 dark:bg-emerald-500/10',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  error: {
    icono: 'alerta',
    borde: 'border-rose-200 dark:border-rose-500/30',
    fondo: 'bg-rose-50 dark:bg-rose-500/10',
    texto: 'text-rose-700 dark:text-rose-300',
  },
  info: {
    icono: 'alerta',
    borde: 'border-sky-200 dark:border-cyan-500/30',
    fondo: 'bg-sky-50 dark:bg-cyan-500/10',
    texto: 'text-sky-700 dark:text-cyan-300',
  },
};

let contador = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const agregar = useCallback((tipo, mensaje) => {
    const id = ++contador;
    setToasts((prev) => [...prev.slice(-3), { id, tipo, mensaje }]);
    window.setTimeout(() => quitar(id), 4200);
  }, [quitar]);

  const valor = useMemo(() => ({
    exito: (mensaje) => agregar('exito', mensaje),
    error: (mensaje) => agregar('error', mensaje),
    info: (mensaje) => agregar('info', mensaje),
  }), [agregar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}

      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const estilo = ESTILOS[t.tipo] || ESTILOS.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 rounded-2xl border ${estilo.borde} ${estilo.fondo} bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3 shadow-2xl`}
            >
              <span className={`mt-0.5 ${estilo.texto}`}>
                <Icono nombre={estilo.icono} className="w-4 h-4" />
              </span>
              <p className="flex-1 text-[11px] leading-relaxed text-gray-700 dark:text-gray-200">{t.mensaje}</p>
              <button
                type="button"
                onClick={() => quitar(t.id)}
                aria-label="Cerrar aviso"
                className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-colors"
              >
                <Icono nombre="cerrar" className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
};
