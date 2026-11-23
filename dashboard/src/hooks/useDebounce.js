import { useEffect, useState } from 'react';

/** Retrasa la actualizacion de un valor para no consultar en cada tecla. */
export const useDebounce = (valor, retraso = 350) => {
  const [valorDebounced, setValorDebounced] = useState(valor);

  useEffect(() => {
    const timer = window.setTimeout(() => setValorDebounced(valor), retraso);
    return () => window.clearTimeout(timer);
  }, [valor, retraso]);

  return valorDebounced;
};
