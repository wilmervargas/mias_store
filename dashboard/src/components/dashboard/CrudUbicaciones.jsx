import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const vacio = { almacen_id: '', padre_id: '', idtipo_ubicacion: '', codigo: '', nombre: '' };

const CrudUbicaciones = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [almacenes, setAlmacenes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionesPadre, setUbicacionesPadre] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', almacen: '', tipo: '', estatus: '' });
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  useEffect(() => {
    Promise.all([
      api.get('almacenes'),
      api.get('ubicaciones/tipos'),
    ]).then(([resAlmacenes, resTipos]) => {
      setAlmacenes(resAlmacenes.datos || []);
      setTipos(resTipos.datos || []);
    });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.almacen !== '') params.append('almacen', filtros.almacen);
    if (filtros.tipo !== '') params.append('tipo', filtros.tipo);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);

    const res = await api.get('ubicaciones', params.toString());
    if (res.success) {
      setUbicaciones(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar las ubicaciones');
    }
    setCargando(false);
  }, [qDebounced, filtros.almacen, filtros.tipo, filtros.estatus, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!modalAbierto || !form.almacen_id) {
      setUbicacionesPadre([]);
      return;
    }

    let activo = true;
    api.get('ubicaciones', `almacen=${form.almacen_id}`).then((res) => {
      if (activo && res.success) setUbicacionesPadre(res.datos || []);
    });

    return () => { activo = false; };
  }, [modalAbierto, form.almacen_id]);

  const abrirCrear = () => {
    const almacenInicial = filtros.almacen || almacenes[0]?.id || '';
    if (!almacenInicial) {
      toast.error('Primero debes crear un almacén');
      return;
    }
    setEditando(null);
    setForm({ ...vacio, almacen_id: String(almacenInicial) });
    setModalAbierto(true);
  };

  const abrirEditar = (ubicacion) => {
    setEditando(ubicacion);
    setForm({
      almacen_id: String(ubicacion.almacen_id),
      padre_id: ubicacion.padre_id ? String(ubicacion.padre_id) : '',
      idtipo_ubicacion: String(ubicacion.idtipo_ubicacion),
      codigo: ubicacion.codigo || '',
      nombre: ubicacion.nombre || '',
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.almacen_id || !form.idtipo_ubicacion || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Almacén, tipo, código y nombre son obligatorios');
      return;
    }

    const payload = {
      almacen_id: Number(form.almacen_id),
      padre_id: form.padre_id || null,
      idtipo_ubicacion: Number(form.idtipo_ubicacion),
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
    };

    setGuardando(true);
    const res = editando
      ? await api.put('ubicaciones', editando.id, payload)
      : await api.post('ubicaciones', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || (res.errores || []).join('. ') || 'No se pudo guardar la ubicación');
      return;
    }

    toast.exito(editando ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
    setModalAbierto(false);
    setForm(vacio);
    setEditando(null);
    cargar();
  };

  const desactivar = async (ubicacion) => {
    const ok = await confirmar({
      titulo: 'Desactivar ubicación',
      mensaje: `¿Deseas desactivar la ubicación "${ubicacion.ruta}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: [
        `${ubicacion.total_hijos} sububicación(es) vinculadas.`,
        `${ubicacion.unidades} unidad(es) registradas.`,
        'Podrás reactivarla más adelante.',
      ],
    });
    if (!ok) return;

    const res = await api.delete('ubicaciones', ubicacion.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar la ubicación');
      return;
    }
    toast.exito('Ubicación desactivada');
    cargar();
  };

  const reactivar = async (ubicacion) => {
    const ok = await confirmar({
      titulo: 'Reactivar ubicación',
      mensaje: `¿Deseas reactivar la ubicación "${ubicacion.ruta}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('ubicaciones', ubicacion.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar la ubicación');
      return;
    }
    toast.exito('Ubicación reactivada');
    cargar();
  };

  const eliminar = async (ubicacion) => {
    if (!ubicacion.puede_eliminar) {
      toast.error('No se puede eliminar: la ubicación tiene sububicaciones, inventario o referencias.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar ubicación definitivamente',
      mensaje: `Esta acción eliminará la ubicación "${ubicacion.ruta}" de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'No se puede deshacer.',
        'Solo se permite porque no tiene sububicaciones ni inventario.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('ubicaciones', ubicacion.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar la ubicación');
      return;
    }
    toast.exito('Ubicación eliminada definitivamente');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', almacen: '', tipo: '', estatus: '' });
  const hayFiltros = filtros.q !== '' || filtros.almacen !== '' || filtros.tipo !== '' || filtros.estatus !== '';

  const exportar = (tipo) => {
    const cols = [
      { header: 'Ruta', valor: (r) => r.ruta },
      { header: 'Código', valor: (r) => r.codigo },
      { header: 'Nombre', valor: (r) => r.nombre },
      { header: 'Almacén', valor: (r) => r.almacen_codigo || '' },
      { header: 'Tipo', valor: (r) => r.tipo_ubicacion || '' },
      { header: 'Padre', valor: (r) => r.padre_codigo || '' },
      { header: 'Profundidad', valor: (r) => r.profundidad ?? '' },
      { header: 'Unidades', valor: (r) => r.unidades ?? 0 },
      { header: 'Estatus', valor: (r) => Number(r.idestatus) === 1 ? 'Activa' : 'Inactiva' },
    ];
    const filtrosRep = [];
    if (filtros.q) filtrosRep.push({ label: 'Búsqueda', value: filtros.q });
    if (filtros.almacen) filtrosRep.push({ label: 'Almacén', value: almacenes.find((a) => String(a.id) === String(filtros.almacen))?.codigo || filtros.almacen });
    if (filtros.tipo) filtrosRep.push({ label: 'Tipo', value: tipos.find((t) => String(t.id) === String(filtros.tipo))?.nombre || filtros.tipo });
    if (filtros.estatus !== '') filtrosRep.push({ label: 'Estatus', value: filtros.estatus === '1' ? 'Activa' : 'Inactiva' });
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_ubicaciones', hoja: 'Ubicaciones', columnas: cols, filas: ubicaciones });
    else exportarPDF({ nombre: 'reporte_ubicaciones', titulo: 'Reporte de Ubicaciones', filtros: filtrosRep, columnas: cols, filas: ubicaciones });
  };

  const opcionesPadre = ubicacionesPadre.filter((u) => {
    if (!editando) return true;
    if (u.id === editando.id) return false;
    return !String(u.ruta || '').startsWith(`${editando.ruta}/`);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Ubicaciones</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Árbol físico dentro de cada almacén</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
          <Boton variante="primario" icono="mas" onClick={abrirCrear}>Nueva Ubicación</Boton>
        </div>
      </div>

      <BarraFiltros
        total={ubicaciones.length}
        etiqueta="ubicaciones"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar por código, nombre o ruta..."
          className="col-span-2 md:w-64"
        />
        <Select
          value={filtros.almacen}
          onChange={(e) => setFiltros({ ...filtros, almacen: e.target.value })}
          className="md:w-48"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
        </Select>
        <Select
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          className="md:w-40"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </Select>
        <Select
          value={filtros.estatus}
          onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })}
          className="md:w-40"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activas</option>
          <option value="2">Inactivas</option>
        </Select>
      </BarraFiltros>

      <Tabla
        colSpan={10}
        cargando={cargando}
        vacio={ubicaciones.length === 0}
        textoVacio="No hay ubicaciones para los filtros seleccionados."
        cabecera={
          <>
            <Th>Ruta</Th>
            <Th>Código</Th>
            <Th>Nombre</Th>
            <Th>Almacén</Th>
            <Th>Tipo</Th>
            <Th>Padre</Th>
            <Th align="right">Nivel</Th>
            <Th align="right">Unidades</Th>
            <Th>Estado</Th>
            <Th align="center">Acciones</Th>
          </>
        }
      >
        {ubicaciones.map((ubicacion) => {
          const activa = Number(ubicacion.idestatus) === 1;
          return (
            <tr key={ubicacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <Td className="font-mono text-[10px] text-cyan-400">{ubicacion.ruta}</Td>
              <Td className="font-mono text-gray-300">{ubicacion.codigo}</Td>
              <Td className="font-bold text-gray-900 dark:text-white">{ubicacion.nombre}</Td>
              <Td className="text-gray-400">{ubicacion.almacen_codigo}</Td>
              <Td className="text-gray-400">{ubicacion.tipo_ubicacion}</Td>
              <Td className="text-gray-500">{ubicacion.padre_codigo || '—'}</Td>
              <Td align="right" className="text-gray-400">{ubicacion.profundidad}</Td>
              <Td align="right" className="font-bold text-gray-900 dark:text-white">{Number(ubicacion.unidades).toLocaleString('es-VE')}</Td>
              <Td><BadgeEstado activo={activa} activoLabel="Activa" inactivoLabel="Inactiva" /></Td>
              <Td align="center"><Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(ubicacion)} title="Editar" aria-label="Editar"></Boton>
                  {activa ? (
                    <Boton tamano="sm" variante="advertencia" icono="poder" onClick={() => desactivar(ubicacion)} title="Desactivar" aria-label="Desactivar"></Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(ubicacion)} title="Reactivar" aria-label="Reactivar"></Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!ubicacion.puede_eliminar}
                    title={!ubicacion.puede_eliminar ? 'Tiene sububicaciones, inventario o referencias.' : undefined}
                    onClick={() => eliminar(ubicacion)}
                   aria-label="Eliminar"></Boton>
                </Acciones>
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar ubicación' : 'Nueva ubicación'}
          subtitulo={editando ? `Ruta actual: ${editando.ruta}` : 'La ruta se construye automáticamente según el padre'}
          icono="ubicacion"
          onClose={() => setModalAbierto(false)}
          maxW="max-w-xl"
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-ubicacion" variante="exito" icono="guardar" cargando={guardando}>
                {editando ? 'Guardar cambios' : 'Crear ubicación'}
              </Boton>
            </>
          }
        >
          <form id="form-ubicacion" onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo
                label="Almacén"
                required
                hint={editando ? 'El almacén no se puede cambiar al editar.' : undefined}
              >
                <Select
                  required
                  disabled={Boolean(editando)}
                  value={form.almacen_id}
                  onChange={(e) => setForm({ ...form, almacen_id: e.target.value, padre_id: '' })}
                >
                  <option value="">Selecciona...</option>
                  {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
                </Select>
              </Campo>
              <Campo label="Tipo de ubicación" required>
                <Select
                  required
                  value={form.idtipo_ubicacion}
                  onChange={(e) => setForm({ ...form, idtipo_ubicacion: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </Select>
              </Campo>
            </div>

            <Campo label="Ubicación padre" hint="Déjalo vacío para crear una ubicación raíz.">
              <Select
                value={form.padre_id}
                onChange={(e) => setForm({ ...form, padre_id: e.target.value })}
              >
                <option value="">Sin padre (raíz)</option>
                {opcionesPadre.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
              </Select>
            </Campo>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Código" required hint="Ej. PAS-02, EST-01">
                <Input
                  required
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  placeholder="PAS-02"
                  className="font-mono uppercase"
                />
              </Campo>
              <Campo label="Nombre" required>
                <Input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Pasillo 2"
                />
              </Campo>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CrudUbicaciones;
