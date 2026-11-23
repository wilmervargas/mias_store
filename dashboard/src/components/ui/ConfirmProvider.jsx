import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';
import Boton from './Boton';
import Icono from './Icono';

const ConfirmContext = createContext(null);

const VARIANTES = {
  advertencia: { tono: 'advertencia', icono: 'alerta', boton: 'advertencia', defecto: 'Sí, desactivar' },
  peligro: { tono: 'peligro', icono: 'papelera', boton: 'peligro', defecto: 'Sí, eliminar' },
  exito: { tono: 'exito', icono: 'refrescar', boton: 'exito', defecto: 'Sí, reactivar' },
};

export const ConfirmProvider = ({ children }) => {
  const [opciones, setOpciones] = useState(null);
  const [marcado, setMarcado] = useState(false);
  const resolverRef = useRef(null);

  const confirmar = useCallback((config) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setMarcado(false);
      setOpciones(config);
    });
  }, []);

  const cerrar = (valor) => {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setOpciones(null);
    setMarcado(false);
  };

  const variante = VARIANTES[opciones?.variante] || VARIANTES.advertencia;
  const requiereCheck = Boolean(opciones?.checkLabel);

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}

      {opciones && (
        <Modal
          titulo={opciones.titulo || 'Confirmar acción'}
          subtitulo={opciones.subtitulo}
          icono={opciones.icono || variante.icono}
          tono={opciones.tono || variante.tono}
          onClose={() => cerrar(false)}
          maxW={opciones.maxW || 'max-w-md'}
          footer={
            <>
              <Boton variante="neutral" onClick={() => cerrar(false)}>
                Cancelar
              </Boton>
              <Boton
                variante={variante.boton}
                icono={variante.icono}
                disabled={requiereCheck && !marcado}
                onClick={() => cerrar(true)}
              >
                {opciones.textoConfirmar || variante.defecto}
              </Boton>
            </>
          }
        >
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {opciones.mensaje}
          </p>

          {Array.isArray(opciones.detalle) && opciones.detalle.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-950/60">
              {opciones.detalle.map((linea, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                  <span>{linea}</span>
                </div>
              ))}
            </div>
          )}

          {requiereCheck && (
            <label className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 cursor-pointer dark:border-rose-500/20 dark:bg-rose-500/5">
              <input
                type="checkbox"
                checked={marcado}
                onChange={(e) => setMarcado(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-rose-500"
              />
              <span className="text-[11px] text-rose-700 dark:text-rose-200 leading-relaxed">{opciones.checkLabel}</span>
            </label>
          )}

          {opciones.nota && (
            <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500">
              <Icono nombre="alerta" className="w-4 h-4 shrink-0 text-amber-500/70" />
              <span>{opciones.nota}</span>
            </div>
          )}
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return contexto;
};
