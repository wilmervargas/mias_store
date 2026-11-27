import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Icono from '../ui/Icono';
import { exportarExcel, exportarPDF } from '../../utils/reportes';
import { Campo, Input, TextArea } from '../ui/Campo';

const VACIO = { name: '', description: '' };

const textoError = (error, respaldo) => {
  if (Array.isArray(error)) return error.join(' ');
  return error || respaldo;
};

const TabRolesPermisos = () => {
  const { puede, esSuperusuario } = useAuth();
  const confirmar = useConfirm();
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [catalogo, setCatalogo] = useState({ modulos: [], acciones: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [editorAbierto, setEditorAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formRol, setFormRol] = useState(VACIO);
  const [guardandoRol, setGuardandoRol] = useState(false);

  const puedeGestionar = esSuperusuario || puede('roles.gestionar');
  const puedeCrear = esSuperusuario || puede('roles.crear') || puede('roles.gestionar');
  const puedeEditarRol = esSuperusuario || puede('roles.editar') || puede('roles.gestionar');
  const puedeEliminarRol = esSuperusuario || puede('roles.eliminar');

  const rolActual = useMemo(
    () => roles.find((rol) => rol.id === seleccionado) || null,
    [roles, seleccionado]
  );

  const idsOriginales = useMemo(
    () => new Set(rolActual?.permiso_ids || []),
    [rolActual]
  );

  const hayCambios = useMemo(() => {
    if (!rolActual) return false;
    if (seleccion.length !== idsOriginales.size) return true;
    return seleccion.some((id) => !idsOriginales.has(id));
  }, [rolActual, seleccion, idsOriginales]);

  const cargar = useCallback(async () => {
    setCargando(true);

    const [resRoles, resPermisos] = await Promise.all([
      api.get('roles'),
      api.get('permisos'),
    ]);

    if (resRoles.success) {
      const lista = resRoles.datos || [];
      setRoles(lista);
      setSeleccionado((prev) => {
        if (prev && lista.some((rol) => rol.id === prev)) return prev;
        return lista[0]?.id ?? null;
      });
    } else {
      toast.error(textoError(resRoles.error, 'No se pudieron cargar los roles.'));
    }

    if (resPermisos.success) {
      setCatalogo({
        modulos: resPermisos.datos?.modulos || [],
        acciones: resPermisos.datos?.acciones || [],
        total: resPermisos.datos?.total || 0,
      });
    } else {
      toast.error(textoError(resPermisos.error, 'No se pudo cargar el catálogo de permisos.'));
    }

    setCargando(false);
  }, [toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Sincroniza la matriz cada vez que cambia el rol seleccionado o se recarga.
  useEffect(() => {
    setSeleccion(rolActual?.permiso_ids || []);
  }, [rolActual]);

  const cambiarRol = async (id) => {
    if (id === seleccionado) return;

    if (hayCambios) {
      const ok = await confirmar({
        titulo: 'Descartar cambios',
        mensaje: `Tienes cambios sin guardar en el rol "${rolActual?.name}".`,
        variante: 'advertencia',
        textoConfirmar: 'Sí, descartar',
        detalle: [
          'La matriz de permisos volverá a su última versión guardada.',
          'Puedes cancelar y guardar los cambios antes de cambiar de rol.',
        ],
      });
      if (!ok) return;
    }

    setSeleccionado(id);
  };

  const alternarPermiso = (id) => {
    if (!puedeGestionar) return;
    setSeleccion((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const alternarModulo = (modulo) => {
    if (!puedeGestionar) return;
    const ids = modulo.permisos.map((permiso) => permiso.id);
    const todos = ids.every((id) => seleccion.includes(id));

    setSeleccion((prev) => (
      todos
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    ));
  };

  const marcarTodo = () => {
    if (!puedeGestionar) return;
    const ids = catalogo.modulos.flatMap((modulo) => modulo.permisos.map((permiso) => permiso.id));
    setSeleccion(ids);
  };

  const limpiarTodo = () => {
    if (!puedeGestionar) return;
    setSeleccion([]);
  };

  const descartar = () => {
    setSeleccion(rolActual?.permiso_ids || []);
  };

  const guardarMatriz = async () => {
    if (!rolActual || !puedeGestionar) return;

    setGuardando(true);
    const res = await api.put('roles', rolActual.id, { permisos: seleccion });
    setGuardando(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo guardar la matriz de permisos.'));
      return;
    }

    toast.exito(`Permisos de ${rolActual.name} actualizados correctamente.`);
    cargar();
  };

  const abrirCrear = () => {
    setEditando(null);
    setFormRol(VACIO);
    setEditorAbierto(true);
  };

  const abrirEditar = () => {
    if (!rolActual) return;
    setEditando(rolActual);
    setFormRol({
      name: rolActual.name || '',
      description: rolActual.description || '',
    });
    setEditorAbierto(true);
  };

  const guardarRol = async (e) => {
    e.preventDefault();

    const nombre = formRol.name.trim().toUpperCase();
    const descripcion = formRol.description.trim();

    if (nombre.length < 2) {
      toast.error('El nombre del rol debe tener al menos 2 caracteres.');
      return;
    }

    const payload = { name: nombre, description: descripcion };

    setGuardandoRol(true);
    let res;

    if (editando) {
      res = await api.put('roles', editando.id, payload);
    } else {
      res = await api.post(
        'roles',
        puedeGestionar ? { ...payload, permisos: [] } : payload
      );
    }

    setGuardandoRol(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo guardar el rol.'));
      return;
    }

    toast.exito(editando ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');

    if (!editando && res.datos?.rol?.id) {
      setSeleccionado(Number(res.datos.rol.id));
    }

    setEditorAbierto(false);
    setEditando(null);
    setFormRol(VACIO);
    cargar();
  };

  const eliminarRol = async () => {
    if (!rolActual) return;

    const ok = await confirmar({
      titulo: 'Eliminar rol',
      mensaje: `Se eliminará el rol "${rolActual.name}".`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'La matriz de permisos de este rol se eliminará.',
        `Actualmente tiene ${rolActual.total_usuarios} usuario(s) asignado(s).`,
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('roles', rolActual.id);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo eliminar el rol.'));
      return;
    }

    toast.exito('Rol eliminado correctamente.');
    setSeleccionado(null);
    cargar();
  };

  const esAdmin = rolActual?.name === 'ADMIN';
  const eliminarBloqueado = !puedeEliminarRol || esAdmin || (rolActual?.total_usuarios || 0) > 0;

  const exportar = (tipo) => {
    const cols = [
      { header: 'Rol', valor: (r) => r.name || '' },
      { header: 'Etiqueta', valor: (r) => r.label || '' },
      { header: 'Descripción', valor: (r) => r.description || '' },
      { header: 'Usuarios', valor: (r) => r.total_usuarios ?? 0 },
      { header: 'Permisos', valor: (r) => Array.isArray(r.permissions) ? r.permissions.length : (r.total_permisos ?? '') },
    ];
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_roles', hoja: 'Roles', titulo: 'Reporte de Roles y Permisos', columnas: cols, filas: roles });
    else exportarPDF({ nombre: 'reporte_roles', titulo: 'Reporte de Roles y Permisos', columnas: cols, filas: roles });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Roles y permisos</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Define qué puede hacer cada rol dentro del panel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
          {puedeCrear ? (
            <Boton variante="primario" icono="mas" onClick={abrirCrear}>Nuevo rol</Boton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Roles del sistema
              </p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {roles.length}
              </span>
            </div>

            <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1 xl:max-h-[calc(100vh-18rem)]">
              {cargando ? (
                <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-gray-500">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500 dark:border-gray-600 dark:border-t-purple-400" />
                  Cargando roles...
                </div>
              ) : roles.length === 0 ? (
                <p className="px-3 py-8 text-center text-[11px] text-gray-500">
                  No hay roles creados.
                </p>
              ) : (
                roles.map((rol) => {
                  const activo = rol.id === seleccionado;
                  const admin = rol.name === 'ADMIN';

                  return (
                    <button
                      key={rol.id}
                      type="button"
                      onClick={() => cambiarRol(rol.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        activo
                          ? 'border-purple-300 bg-purple-50/80 shadow-sm dark:border-purple-500/40 dark:bg-purple-500/10'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                          {rol.name}
                        </p>
                        {admin ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                            <Icono nombre="escudo" className="h-2.5 w-2.5" />
                            Esencial
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                        {rol.description || 'Sin descripción'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                          {rol.total_permisos} permisos
                        </span>
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                          {rol.total_usuarios} usuarios
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          {!rolActual ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
                <Icono nombre="escudo" className="h-6 w-6" />
              </span>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Selecciona un rol
              </p>
              <p className="max-w-sm text-[11px] text-gray-500">
                Elige un rol de la lista para revisar y ajustar su matriz de permisos por módulo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-gray-900 dark:text-white">
                        {rolActual.name}
                      </h3>
                      {hayCambios ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Cambios sin guardar
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {rolActual.description || 'Sin descripción'}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {seleccion.length} de {catalogo.total} permisos
                      </span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {rolActual.total_usuarios} usuario(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {puedeEditarRol ? (
                      <Boton tamano="sm" variante="neutral" icono="editar" onClick={abrirEditar}>
                        Editar
                      </Boton>
                    ) : null}
                    {puedeEliminarRol ? (
                      <Boton
                        tamano="sm"
                        variante="peligro"
                        icono="papelera"
                        disabled={eliminarBloqueado}
                        onClick={eliminarRol}
                        title={
                          esAdmin
                            ? 'El rol ADMIN no se puede eliminar.'
                            : (rolActual.total_usuarios || 0) > 0
                              ? 'El rol tiene usuarios asignados.'
                              : 'Eliminar rol'
                        }
                      >
                        Eliminar
                      </Boton>
                    ) : null}
                  </div>
                </div>
              </div>

              {!puedeGestionar ? (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <Icono nombre="candado" className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Puedes consultar la matriz, pero para modificarla necesitas el permiso{' '}
                    <span className="font-bold">roles.gestionar</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Boton tamano="sm" variante="info" icono="check" onClick={marcarTodo}>
                      Marcar todo
                    </Boton>
                    <Boton tamano="sm" variante="neutral" icono="cerrar" onClick={limpiarTodo}>
                      Limpiar
                    </Boton>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Boton
                      tamano="sm"
                      variante="neutral"
                      icono="deshacer"
                      onClick={descartar}
                      disabled={!hayCambios || guardando}
                    >
                      Descartar
                    </Boton>
                    <Boton
                      tamano="sm"
                      variante="exito"
                      icono="guardar"
                      onClick={guardarMatriz}
                      disabled={!hayCambios}
                      cargando={guardando}
                    >
                      Guardar permisos
                    </Boton>
                  </div>
                </div>
              )}

              <div className="grid gap-2.5 md:grid-cols-2">
                {catalogo.modulos.map((modulo) => {
                  const ids = modulo.permisos.map((permiso) => permiso.id);
                  const activos = ids.filter((id) => seleccion.includes(id)).length;
                  const todos = ids.length > 0 && activos === ids.length;

                  return (
                    <div
                      key={modulo.module}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/40">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black text-gray-800 dark:text-gray-200">
                            {modulo.label}
                          </p>
                          <p className="text-[9px] text-gray-500 dark:text-gray-500">
                            {activos} de {ids.length} permisos
                          </p>
                        </div>
                        {puedeGestionar ? (
                          <button
                            type="button"
                            onClick={() => alternarModulo(modulo)}
                            className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold transition ${
                              todos
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:hover:bg-purple-500/25'
                                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                          >
                            {todos ? 'Quitar todos' : 'Marcar todos'}
                          </button>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-1.5 p-3">
                        {modulo.permisos.map((permiso) => {
                          const activo = seleccion.includes(permiso.id);

                          return (
                            <button
                              key={permiso.id}
                              type="button"
                              title={permiso.description || permiso.code}
                              disabled={!puedeGestionar}
                              onClick={() => alternarPermiso(permiso.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition disabled:cursor-default ${
                                activo
                                  ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                              } ${!puedeGestionar ? 'opacity-80' : ''}`}
                            >
                              <span
                                className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border ${
                                  activo
                                    ? 'border-purple-500 bg-purple-600 text-white'
                                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                                }`}
                              >
                                {activo ? <Icono nombre="check" className="h-2.5 w-2.5" /> : null}
                              </span>
                              {permiso.action_label || permiso.action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {editorAbierto ? (
        <Modal
          titulo={editando ? 'Editar rol' : 'Nuevo rol'}
          subtitulo={
            editando
              ? 'Actualiza el nombre o la descripción del rol'
              : 'Crea un rol y luego define su matriz de permisos'
          }
          icono="escudo"
          tono="info"
          onClose={() => setEditorAbierto(false)}
          maxW="max-w-md"
          footer={
            <>
              <Boton variante="neutral" onClick={() => setEditorAbierto(false)}>
                Cancelar
              </Boton>
              <Boton
                type="submit"
                form="form-rol"
                variante="exito"
                icono="guardar"
                cargando={guardandoRol}
              >
                {editando ? 'Guardar cambios' : 'Crear rol'}
              </Boton>
            </>
          }
        >
          <form id="form-rol" onSubmit={guardarRol} className="space-y-4">
            <Campo
              label="Nombre del rol"
              required
              hint="Se guarda en mayúsculas. Ejemplo: SUPERVISOR, VENTAS, LECTOR."
            >
              <Input
                autoFocus
                required
                value={formRol.name}
                disabled={Boolean(editando && editando.name === 'ADMIN')}
                onChange={(e) => setFormRol((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                placeholder="NOMBRE_DEL_ROL"
                maxLength={60}
              />
            </Campo>

            {editando?.name === 'ADMIN' ? (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <Icono nombre="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                El nombre del rol ADMIN no se puede modificar.
              </p>
            ) : null}

            <Campo label="Descripción" hint="Máximo 255 caracteres.">
              <TextArea
                rows={3}
                value={formRol.description}
                onChange={(e) => setFormRol((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="¿Para qué sirve este rol?"
                maxLength={255}
              />
            </Campo>

            {!puedeGestionar && !editando ? (
              <p className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-[10px] text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                <Icono nombre="llave" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                El rol se creará sin permisos. Un usuario con roles.gestionar podrá configurar la
                matriz después.
              </p>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default TabRolesPermisos;
