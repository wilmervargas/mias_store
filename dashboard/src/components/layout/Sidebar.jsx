import { useEffect, useState } from 'react';
import Icono from '../ui/Icono';
import { useAuth } from '../../context/AuthContext';
import { ACCESO_MODULO, GRUPOS_MENU } from '../../config/navegacion';
import { api } from '../../services/api';

const iniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() || '').join('') || 'MS';
};

export default function Sidebar({ open, onClose, moduloActivo, onSelect }) {
  const { puede, puedeSeguridad, usuario, esSuperusuario, logout } = useAuth();
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('empresa');
        if (res.success) setEmpresa(res.datos || null);
      } catch { /* ignore */ }
    };
    cargar();
    window.addEventListener('mias:empresa-actualizada', cargar);
    return () => window.removeEventListener('mias:empresa-actualizada', cargar);
  }, []);

  const groups = GRUPOS_MENU
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.id === 'seguridad') return puedeSeguridad;
        const codigo = ACCESO_MODULO[item.id];
        if (Array.isArray(codigo)) return codigo.some((c) => puede(c));
        return codigo ? puede(codigo) : true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const nombreEmpresa = empresa?.nombre_comercial || empresa?.razon_social || 'Empresa';
  const logoEmpresa = empresa?.logo_url || null;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[14rem] transform flex-col bg-gray-900 text-gray-300 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3 min-w-0">
          {logoEmpresa ? (
            <img src={logoEmpresa} alt={nombreEmpresa} className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white/10" />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-500/20">
              {iniciales(nombreEmpresa)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{nombreEmpresa}</p>
            <p className="truncate text-xs text-gray-400">Panel administrativo</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] leading-relaxed text-gray-400">
            Tu cuenta aún no tiene módulos habilitados. Pide a un superusuario que asigne un rol.
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const activo = moduloActivo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.hint}
                    onClick={() => { onSelect(item.id); onClose?.(); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activo
                        ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/20 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icono nombre={item.icono} className={`h-4 w-4 ${activo ? 'text-pink-300' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-[11px] font-black text-white">
            {iniciales(usuario?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">{usuario?.full_name}</p>
            <p className="flex items-center gap-1 truncate text-[9px] font-semibold text-purple-300">
              <Icono nombre={esSuperusuario ? 'escudo' : 'usuario'} className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{usuario?.role_label || 'Sin rol'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
          >
            <Icono nombre="salir" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 truncate text-center text-[9px] text-gray-500">
          Gestión de inventario y tienda
        </p>
      </div>
    </aside>
  );
}
