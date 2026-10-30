import { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config';

const CurrencyContext = createContext();

export const formatearPrecio = (precioUSD, tasa, moneda = 'USD') => {
  const valor = Number(precioUSD) || 0;

  if (moneda === 'VES') {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(valor * tasa);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(valor);
};

export const useTasaDolar = () => {
  const [tasa, setTasa] = useState(639.0);
  const [fecha, setFecha] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}?url=dolar`)
      .then((res) => res.json())
      .then((res) => {
        const tasaBD = res?.datos?.tasa;
        if (tasaBD) {
          setTasa(Number(tasaBD));
          setFecha(res?.datos?.fecha || null);
        }
      })
      .catch(() => console.warn('API sin conexion. Usando tasa fallback de damasco.sql.'))
      .finally(() => setCargando(false));
  }, []);

  return { tasa, fecha, cargando };
};

export const CurrencyProvider = ({ children }) => {
  const { tasa, fecha, cargando } = useTasaDolar();
  const [moneda, setMoneda] = useState(() => localStorage.getItem('damasco_moneda') || 'USD');

  useEffect(() => {
    localStorage.setItem('damasco_moneda', moneda);
  }, [moneda]);

  const toggleMoneda = () => setMoneda((actual) => (actual === 'USD' ? 'VES' : 'USD'));

  const valorFormateado = (precioUSD, monedaDestino = moneda) => (
    formatearPrecio(precioUSD, tasa, monedaDestino)
  );

  return (
    <CurrencyContext.Provider
      value={{
        tasa,
        fecha,
        cargando,
        moneda,
        setMoneda,
        toggleMoneda,
        formatearPrecio: valorFormateado,
        formatPrecio: valorFormateado,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe usarse dentro de un CurrencyProvider');
  }
  return context;
};
