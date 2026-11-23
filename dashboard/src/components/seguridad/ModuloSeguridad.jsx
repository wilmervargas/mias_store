import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../ui/PageHeader';
import Tabs from '../ui/Tabs';
import Icono from '../ui/Icono';
import TabUsuarios from './TabUsuarios';
import TabRolesPermisos from './TabRolesPermisos';
import TabCentroClaves from './TabCentroClaves';

const ModuloSeguridad = () => {
  const { puede, puedeSeguridad, esSuperusuario, usuario } = useAuth();

  const puedeUsuarios = esSuperusuario
    || puede('usuarios.ver')
    || puede('usuarios.crear')
    || puede('usuarios.editar')
    || puede('usuarios.eliminar')
    || puede('seguridad.claves');

  const puedeRoles = esSuperusuario
    || puede('roles.ver')
    || puede('roles.crear')
    || puede('roles.editar')
    || puede('roles.eliminar')
    || puede('roles.gestionar');

  const tabs = useMemo(() => {
    const lista = [];

    if (puedeUsuarios) {
      lista.push({
        id: 'usuarios',
        label: 'Usuarios y Cuentas',
        labelCorto: 'Usuarios',
        icono: 'usuario',
      });
    }
    if (puedeRoles) {
      lista.push({
        id: 'roles',
        label: 'Roles y Permisos',
        labelCorto: 'Roles',
        icono: 'escudo',
      });
    }
    lista.push({
      id: 'claves',
      label: 'Centro de Claves y Seguridad',
      labelCorto: 'Claves',
      icono: 'llave',
    });

    return lista;
  }, [puedeUsuarios, puedeRoles]);

  const [activa, setActiva] = useState(() => tabs[0]?.id || 'claves');

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activa)) {
      setActiva(tabs[0]?.id || 'claves');
    }
  }, [tabs, activa]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon="escudo"
        title="Seguridad y Accesos"
        description="Administra quién entra al panel, qué puede hacer y cómo se protegen las claves del equipo."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-[10px] font-bold text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
            <Icono nombre={esSuperusuario ? 'escudo' : 'usuario'} className="h-3.5 w-3.5" />
            {esSuperusuario ? 'Acceso de superusuario' : (usuario?.role_label || 'Acceso restringido')}
          </span>
        }
      />

      {!puedeSeguridad ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <Icono nombre="candado" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No tienes permisos para acceder a la sección de seguridad.</p>
        </div>
      ) : (
        <>
          <Tabs tabs={tabs} activa={activa} onChange={setActiva} />

          <div className="min-w-0">
            {activa === 'usuarios' && puedeUsuarios ? <TabUsuarios /> : null}
            {activa === 'roles' && puedeRoles ? <TabRolesPermisos /> : null}
            {activa === 'claves' ? <TabCentroClaves /> : null}
          </div>
        </>
      )}
    </div>
  );
};

export default ModuloSeguridad;
