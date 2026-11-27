import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import { generarClaveSegura } from '../../utils/claves';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Switch from '../ui/Switch';
import CampoPassword from '../ui/CampoPassword';
import Icono from '../ui/Icono';
import { Campo, Input, Select } from '../ui/Campo';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const VACIO = {
  full_name: '',
  email: '',
  password: '',
  is_active: true,
  is_superuser: false,
  roles: [],
};

const textoError = (error, respaldo) => {
  if (Array.isArray(error)) return error.join(' ');
  return error || respaldo;
};

const iniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() || '').join('') || 'US';
};

const formatearFecha = (valor) => {
  if (!valor) return 'Nunca';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
};

const TabUsuarios = () => {
  const { puede, esSuperusuario, usuario: sesion } = useAuth();
  const confirmar = useConfirm();
  const toast = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estado: '' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState(null);

  const qDebounced = useDebounce(filtros.q);

  const puedeCrear = puede('usuarios.crear');
  const puedeEditar = puede('usuarios.editar');
  const puedeEliminar = puede('usuarios.eliminar');

  const puedeEditarUsuario = useCallback((usuario) => (
    puedeEditar && (esSuperusuario || Number(usuario.is_superuser) !== 1)
  ), [puedeEditar, esSuperusuario]);

  const puedeEliminarUsuario = useCallback((usuario) => (
    puedeEliminar
    && usuario.id !== sesion?.id
    && (esSuperusuario || Number(usuario.is_superuser) !== 1)
  ), [puedeEliminar, sesion?.id, esSuperusuario]);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (qDebounced) params.set('q', qDebounced);
    if (filtros.estado !== '') params.set('estado', filtros.estado);

    const res = await api.get('usuarios', params.toString());
    if (res.success) {
      setUsuarios(res.datos || []);
    } else {
      toast.error(textoError(res.error, 'No se pudieron cargar los usuarios.'));
    }
    setCargando(false);
  }, [qDebounced, filtros.estado, toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    let activo = true;

    api.get('roles').then((res) => {
      if (!activo) return;
      if (res.success) setRoles(res.datos || []);
    });

    return () => {
      activo = false;
    };
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm(VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setForm({
      full_name: usuario.full_name || '',
      email: usuario.email || '',
      password: '',
      is_active: Number(usuario.is_active) === 1,
      is_superuser: Number(usuario.is_superuser) === 1,
      roles: (usuario.roles || []).map((rol) => rol.id),
    });
    setModalAbierto(true);
  };

  const alternarRol = (rolId, activo) => {
    setForm((prev) => ({
      ...prev,
      roles: activo
        ? [...new Set([...prev.roles, rolId])]
        : prev.roles.filter((id) => id !== rolId),
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    if (!editando && !form.password) {
      toast.error('Debes asignar una contraseña inicial al usuario.');
      return;
    }

    if (form.password && form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      is_active: form.is_active ? 1 : 0,
      roles: form.roles,
    };

    if (form.password) payload.password = form.password;
    if (esSuperusuario) payload.is_superuser = form.is_superuser ? 1 : 0;

    setGuardando(true);
    const res = editando
      ? await api.put('usuarios', editando.id, payload)
      : await api.post('usuarios', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo guardar el usuario.'));
      return;
    }

    toast.exito(editando ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.');
    setModalAbierto(false);
    setForm(VACIO);
    setEditando(null);
    cargar();
  };

  const cambiarEstado = async (usuario) => {
    const activo = Number(usuario.is_active) === 1;

    if (!puedeEditarUsuario(usuario)) return;

    if (usuario.id === sesion?.id && activo) {
      toast.error('No puedes desactivar tu propia cuenta.');
      return;
    }

    if (activo) {
      const ok = await confirmar({
        titulo: 'Desactivar cuenta',
        mensaje: `¿Deseas desactivar la cuenta de "${usuario.full_name}"?`,
        variante: 'advertencia',
        textoConfirmar: 'Sí, desactivar',
        detalle: [
          'La persona no podrá iniciar sesión mientras la cuenta esté inactiva.',
          'Podrás reactivarla más adelante.',
        ],
      });
      if (!ok) return;
    }

    setCambiando(usuario.id);
    const res = await api.put('usuarios', usuario.id, { is_active: activo ? 0 : 1 });
    setCambiando(null);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo cambiar el estado de la cuenta.'));
      return;
    }

    toast.exito(activo ? 'Cuenta desactivada.' : 'Cuenta reactivada.');
    cargar();
  };

  const eliminar = async (usuario) => {
    if (usuario.id === sesion?.id) {
      toast.error('No puedes eliminar tu propia cuenta.');
      return;
    }

    if (Number(usuario.is_superuser) === 1 && !esSuperusuario) {
      toast.error('Solo un superusuario puede eliminar a otro superusuario.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar cuenta definitivamente',
      mensaje: `Se eliminará la cuenta de "${usuario.full_name}" (${usuario.email}).`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'Se eliminarán sus roles y permisos asignados.',
        'Esta acción no se puede deshacer.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('usuarios', usuario.id);
    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo eliminar la cuenta.'));
      return;
    }

    toast.exito('Cuenta eliminada correctamente.');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', estado: '' });
  const hayFiltros = filtros.q !== '' || filtros.estado !== '';
  const esMiCuenta = Boolean(editando && editando.id === sesion?.id);

  const exportar = (tipo) => {
    const cols = [
      { header: 'Nombre', valor: (r) => r.full_name || '' },
      { header: 'Email', valor: (r) => r.email || '' },
      { header: 'Roles', valor: (r) => (r.roles || []).map((rol) => rol.name).join(', ') },
      { header: 'Superusuario', valor: (r) => r.is_superuser ? 'Sí' : 'No' },
      { header: 'Estado', valor: (r) => r.is_active ? 'Activo' : 'Inactivo' },
      { header: 'Último acceso', valor: (r) => formatearFecha(r.last_login) },
    ];
    const filtrosRep = [];
    if (filtros.q) filtrosRep.push({ label: 'Búsqueda', value: filtros.q });
    if (filtros.estado) filtrosRep.push({ label: 'Estado', value: filtros.estado === 'activos' ? 'Activos' : 'Inactivos' });
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_usuarios', hoja: 'Usuarios', titulo: 'Reporte de Usuarios', filtros: filtrosRep, columnas: cols, filas: usuarios });
    else exportarPDF({ nombre: 'reporte_usuarios', titulo: 'Reporte de Usuarios', filtros: filtrosRep, columnas: cols, filas: usuarios });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Usuarios y cuentas</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">Altas, roles y estado de acceso</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
          {puedeCrear ? (
            <Boton variante="primario" icono="mas" onClick={abrirCrear}>Nuevo usuario</Boton>
          ) : null}
        </div>
      </div>

      <BarraFiltros
        total={usuarios.length}
        etiqueta="usuarios"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros((prev) => ({ ...prev, q }))}
          placeholder="Buscar por nombre o correo..."
          className="col-span-2 md:w-72"
        />
        <Select
          value={filtros.estado}
          onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
          className="md:w-44"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </Select>
      </BarraFiltros>

      <Tabla
        colSpan={5}
        cargando={cargando}
        vacio={usuarios.length === 0}
        textoVacio="No hay usuarios para los filtros seleccionados."
        cabecera={
          <>
            <Th>Usuario</Th>
            <Th>Roles</Th>
            <Th>Estado</Th>
            <Th>Último acceso</Th>
            <Th align="right">Acciones</Th>
          </>
        }
      >
        {usuarios.map((usuario) => {
          const activo = Number(usuario.is_active) === 1;
          const superusuario = Number(usuario.is_superuser) === 1;
          const rolesUsuario = usuario.roles || [];
          const puedeCambiar = puedeEditarUsuario(usuario) && usuario.id !== sesion?.id;

          return (
            <tr key={usuario.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-[11px] font-black text-white">
                    {iniciales(usuario.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900 dark:text-white">{usuario.full_name}</p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">{usuario.email}</p>
                  </div>
                </div>
              </Td>

              <Td>
                <div className="flex flex-wrap gap-1">
                  {superusuario ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                      <Icono nombre="escudo" className="h-3 w-3" />
                      Superusuario
                    </span>
                  ) : null}
                  {rolesUsuario.map((rol) => (
                    <span
                      key={rol.id}
                      className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {rol.name}
                    </span>
                  ))}
                  {!superusuario && rolesUsuario.length === 0 ? (
                    <span className="text-[10px] text-gray-400">Sin rol</span>
                  ) : null}
                </div>
              </Td>

              <Td>
                {puedeCambiar ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={activo}
                      disabled={cambiando === usuario.id}
                      onChange={() => cambiarEstado(usuario)}
                    />
                    <span className={`text-[10px] font-bold ${activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ) : (
                  <BadgeEstado activo={activo} />
                )}
              </Td>

              <Td className="whitespace-nowrap text-gray-500">{formatearFecha(usuario.last_login)}</Td>

              <Td align="right">
                {!puedeEditarUsuario(usuario) && !puedeEliminarUsuario(usuario) ? (
                  <span className="text-[10px] text-gray-400">—</span>
                ) : (
                  <Acciones>
                    {puedeEditarUsuario(usuario) ? (
                      <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(usuario)}>
                        Editar
                      </Boton>
                    ) : null}
                    {puedeEliminarUsuario(usuario) ? (
                      <Boton tamano="sm" variante="peligro" icono="papelera" onClick={() => eliminar(usuario)}>
                        Eliminar
                      </Boton>
                    ) : null}
                  </Acciones>
                )}
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto ? (
        <Modal
          titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
          subtitulo={editando ? editando.email : 'Crea una cuenta y asígnale roles'}
          icono="usuario"
          tono="info"
          onClose={() => setModalAbierto(false)}
          maxW="max-w-2xl"
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
              <Boton
                type="submit"
                form="form-usuario"
                variante="exito"
                icono="guardar"
                cargando={guardando}
              >
                {editando ? 'Guardar cambios' : 'Crear usuario'}
              </Boton>
            </>
          }
        >
          <form id="form-usuario" onSubmit={guardar} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Nombre completo" required>
                <Input
                  autoFocus
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nombre y apellido"
                />
              </Campo>
              <Campo label="Correo electrónico" required>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="persona@correo.com"
                />
              </Campo>
            </div>

            <Campo
              label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              required={!editando}
              hint={editando ? 'Déjala vacía para conservar la clave actual.' : 'Mínimo 8 caracteres.'}
            >
              <CampoPassword
                value={form.password}
                onChange={(password) => setForm((prev) => ({ ...prev, password }))}
                onGenerar={() => setForm((prev) => ({ ...prev, password: generarClaveSegura() }))}
                autoComplete="new-password"
                placeholder="Contraseña de acceso"
              />
            </Campo>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-800/40">
                <Switch
                  checked={form.is_active}
                  onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
                  disabled={esMiCuenta && Number(editando?.is_active) === 1}
                  label="Cuenta activa"
                  description={esMiCuenta
                    ? 'No puedes desactivar tu propia cuenta.'
                    : 'Puede iniciar sesión en el panel.'}
                />
              </div>

              {esSuperusuario ? (
                <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-500/30 dark:bg-purple-500/10">
                  <Switch
                    checked={form.is_superuser}
                    onChange={(is_superuser) => setForm((prev) => ({ ...prev, is_superuser }))}
                    disabled={esMiCuenta && Number(editando?.is_superuser) === 1}
                    label="Superusuario"
                    description={esMiCuenta && Number(editando?.is_superuser) === 1
                      ? 'No puedes quitarte tu propio estado de superusuario.'
                      : 'Acceso total sin depender de roles.'}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400">Roles asignados</p>
                <span className="text-[10px] text-gray-500">{form.roles.length} seleccionado(s)</span>
              </div>

              {roles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No hay roles disponibles. Crea roles desde la pestaña &quot;Roles y Permisos&quot;.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((rol) => {
                    const esAdmin = rol.name === 'ADMIN';
                    const bloqueado = esAdmin && !esSuperusuario;
                    const activo = form.roles.includes(rol.id);

                    return (
                      <label
                        key={rol.id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                          activo
                            ? 'border-purple-300 bg-purple-50/70 dark:border-purple-500/40 dark:bg-purple-500/10'
                            : 'border-gray-200 bg-white hover:border-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-500/30'
                        } ${bloqueado ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={activo}
                          disabled={bloqueado}
                          onChange={(e) => alternarRol(rol.id, e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-purple-600"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-gray-900 dark:text-white">{rol.name}</span>
                          <span className="mt-0.5 block text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                            {rol.description || 'Sin descripción'}
                          </span>
                          {bloqueado ? (
                            <span className="mt-1 block text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              Solo un superusuario puede asignar este rol.
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default TabUsuarios;
