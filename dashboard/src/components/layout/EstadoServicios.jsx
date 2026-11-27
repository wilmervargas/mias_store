import { useCallback, useEffect, useRef, useState } from 'react';
import Icono from '../ui/Icono';
import { api } from '../../services/api';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const FRONTEND_URL = `http://${host}:5173`;

const SERVICIOS = [
  { id: 'backend', short: 'BK', label: 'Backend', icono: 'servidor' },
  { id: 'dashboard', short: 'DH', label: 'Dashboard', icono: 'panel' },
  { id: 'frontend', short: 'FR', label: 'Frontend', icono: 'tienda' },
  { id: 'whatsapp', short: 'WS', label: 'WhatsApp', icono: 'whatsapp' },
];

async function ping(url, opciones = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opciones.timeout || 4000);
  try {
    const res = await fetch(url, {
      method: opciones.method || 'GET',
      mode: opciones.mode || 'cors',
      credentials: opciones.credentials || 'omit',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return opciones.acceptOpaque ? true : res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export default function EstadoServicios() {
  const [estado, setEstado] = useState(() =>
    Object.fromEntries(SERVICIOS.map((s) => [s.id, 'checking']))
  );
  const [abierto, setAbierto] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto]);

  const comprobar = useCallback(async () => {
    setComprobando(true);
    setEstado(Object.fromEntries(SERVICIOS.map((s) => [s.id, 'checking'])));

    const detectarFrontend = async () => {
      for (const puerto of [5173, 5174, 4173]) {
        const url = `http://${host}:${puerto}`;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3500);
          const res = await fetch(url, { mode: 'cors', cache: 'no-store', signal: ctrl.signal });
          clearTimeout(timer);
          if (!res.ok) continue;
          const html = await res.text();
          const esDashboard = /Admin Dashboard|dashboard/i.test(html) && /Mia's Store|mias/i.test(html);
          const esFrontend = !esDashboard && (/Mia's Store|Tienda|Vite/i.test(html));
          if (esFrontend) return true;
          if (esDashboard) continue;
          return true;
        } catch {
          // Si no se puede leer (CORS/red), no asumir que es el frontend de la tienda.
        }
      }
      return false;
    };

    const [backend, frontend, whatsapp] = await Promise.all([
      api.get('empresa').then((r) => r.success === true || r.error !== 'No se pudo conectar con el servidor. Verifica que el backend PHP este activo.').catch(() => false),
      detectarFrontend(),
      api.get('whatsapp/estado').then((r) => Boolean(r?.success && r?.datos?.connected)).catch(() => false),
    ]);

    setEstado({
      backend: backend ? 'up' : 'down',
      dashboard: 'up',
      frontend: frontend ? 'up' : 'down',
      whatsapp: whatsapp ? 'up' : 'down',
    });
    setComprobando(false);
  }, []);

  useEffect(() => {
    comprobar();
    const t = setInterval(comprobar, 30000);
    return () => clearInterval(t);
  }, [comprobar]);

  const color = (s) => {
    if (s === 'up') return 'bg-emerald-500';
    if (s === 'down') return 'bg-rose-500';
    return 'bg-amber-400 animate-pulse';
  };

  const texto = (s) => {
    if (s === 'up') return 'Activo';
    if (s === 'down') return 'Caído';
    return '...';
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        {SERVICIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setAbierto((v) => !v); comprobar(); }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-black tracking-wide transition ${
              estado[s.id] === 'up'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : estado[s.id] === 'down'
                  ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
            }`}
            title={`${s.label}: ${texto(estado[s.id])}`}
            aria-label={`${s.label}: ${texto(estado[s.id])}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${color(estado[s.id])}`} />
            {s.short}
          </button>
        ))}
      </div>

      {abierto ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-[11px] font-black text-gray-900 dark:text-white">Servicios (BK/ DH/ FR/ WS)</p>
            <button
              type="button"
              onClick={comprobar}
              disabled={comprobando}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              title="Volver a verificar"
            >
              <Icono nombre="refrescar" className={`h-3.5 w-3.5 ${comprobando ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-1">
            {SERVICIOS.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-100 text-[10px] font-black text-gray-700 dark:bg-gray-800 dark:text-gray-200">{s.short}</span>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{s.label}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  estado[s.id] === 'up'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : estado[s.id] === 'down'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${color(estado[s.id])}`} />
                  {texto(estado[s.id])}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
