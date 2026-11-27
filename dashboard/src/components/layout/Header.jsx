import { useEffect, useRef, useState } from 'react';
import Icono from '../ui/Icono';
import MiClaveModal from '../auth/MiClaveModal';
import EstadoServicios from './EstadoServicios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const iniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() || '').join('') || 'MS';
};

export default function Header({ onMenu, moduloActual }) {
  const { isDark, toggleTheme } = useTheme();
  const { usuario, esSuperusuario, logout } = useAuth();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [claveAbierta, setClaveAbierta] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const cargarEmpresa = async () => {
      try {
        const res = await api.get('empresa');
        if (res.success) setEmpresa(res.datos || null);
      } catch { /* ignore */ }
    };
    cargarEmpresa();
    const onUpdate = () => cargarEmpresa();
    window.addEventListener('mias:empresa-actualizada', onUpdate);
    return () => window.removeEventListener('mias:empresa-actualizada', onUpdate);
  }, []);

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alClicFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    const alPresionar = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alPresionar);

    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alPresionar);
    };
  }, [menuAbierto]);

  const abrirMiClave = () => {
    setMenuAbierto(false);
    setClaveAbierta(true);
  };

  const cerrarSesion = async () => {
    setMenuAbierto(false);
    await logout();
  };

  const nombreEmpresa = empresa?.nombre_comercial || empresa?.razon_social || '';

  return (
    <header className="sticky top-0 z-30 border-b-2 border-purple-300 bg-white/90 backdrop-blur dark:border-purple-800 dark:bg-gray-900/90">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Abrir menú"
          >
            <Icono nombre="menu" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {moduloActual?.titulo || 'Panel administrativo'}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {moduloActual?.grupo ? `${moduloActual.grupo} · ${nombreEmpresa || 'Empresa'}` : (nombreEmpresa || 'Empresa')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <EstadoServicios />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <Icono nombre={isDark ? 'sol' : 'luna'} className="h-4 w-4" />
            <span className="hidden sm:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAbierto((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border p-1.5 pr-2 transition ${
                menuAbierto
                  ? 'border-purple-300 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-500/10'
                  : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              title="Mi cuenta"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-[11px] font-black text-white">
                {iniciales(usuario?.full_name)}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block max-w-[9rem] truncate text-[11px] font-bold leading-tight text-gray-900 dark:text-white">
                  {usuario?.full_name}
                </span>
                <span className="block max-w-[9rem] truncate text-[9px] font-semibold leading-tight text-purple-600 dark:text-purple-300">
                  {usuario?.role_label || 'Sin rol'}
                </span>
              </span>
              <Icono
                nombre="chevronAbajo"
                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${menuAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            {menuAbierto ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-xs font-black text-white">
                      {iniciales(usuario?.full_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                        {usuario?.full_name}
                      </p>
                      <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                        {usuario?.email}
                      </p>
                    </div>
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                    <Icono nombre={esSuperusuario ? 'escudo' : 'usuario'} className="h-2.5 w-2.5" />
                    {usuario?.role_label || 'Sin rol'}
                  </span>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={abrirMiClave}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-bold text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-200 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
                  >
                    <Icono nombre="llave" className="h-4 w-4" />
                    Cambiar mi contraseña
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Icono nombre="salir" className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {claveAbierta ? <MiClaveModal onClose={() => setClaveAbierta(false)} /> : null}
    </header>
  );
}
