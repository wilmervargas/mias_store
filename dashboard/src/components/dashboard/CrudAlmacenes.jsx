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

const vacio = { codigo: '', nombre: '', direccion: '', telefono: '' };

const CrudAlmacenes = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estatus: '' });
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);

    const res = await api.get('almacenes', params.toString());
    if (res.success) {
      setAlmacenes(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar los almacenes');
    }
    setCargando(false);
  }, [qDebounced, filtros.estatus, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  };

  const abrirEditar = (almacen) => {
    setEditando(almacen);
    setForm({
      codigo: almacen.codigo || '',
      nombre: almacen.nombre || '',
      direccion: almacen.direccion || '',
      telefono: almacen.telefono || '',
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('El código y el nombre son obligatorios');
      return;
    }

    setGuardando(true);
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
    };
    const res = editando
      ? await api.put('almacenes', editando.id, payload)
      : await api.post('almacenes', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || (res.errores || []).join('. ') || 'No se pudo guardar el almacén');
      return;
    }

    toast.exito(editando ? 'Almacén actualizado correctamente' : 'Almacén creado correctamente');
    setModalAbierto(false);
    setForm(vacio);
    setEditando(null);
    cargar();
  };

  const desactivar = async (almacen) => {
    if (almacen.puede_desactivar === false) {
      toast.error('No se puede desactivar: el almacén tiene productos o inventario vinculado.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Desactivar almacén',
      mensaje: `¿Deseas desactivar el almacén "${almacen.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: [
        `${almacen.total_unidades} unidad(es) seguirán registradas.`,
        'Podrás reactivarlo más adelante.',
      ],
    });
    if (!ok) return;

    const res = await api.delete('almacenes', almacen.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar el almacén');
      return;
    }
    toast.exito('Almacén desactivado');
    cargar();
  };

  const reactivar = async (almacen) => {
    const ok = await confirmar({
      titulo: 'Reactivar almacén',
      mensaje: `¿Deseas reactivar el almacén "${almacen.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('almacenes', almacen.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar el almacén');
      return;
    }
    toast.exito('Almacén reactivado');
    cargar();
  };

  const eliminar = async (almacen) => {
    if (!almacen.puede_eliminar) {
      toast.error('No se puede eliminar: el almacén tiene productos o inventario vinculado.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar almacén definitivamente',
      mensaje: `Esta acción eliminará el almacén "${almacen.nombre}" y todas sus ubicaciones.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'No se puede deshacer.',
        'Solo se permite porque no tiene productos asignados ni registros de inventario.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('almacenes', almacen.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar el almacén');
      return;
    }
    toast.exito('Almacén eliminado definitivamente');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', estatus: '' });
  const hayFiltros = filtros.q !== '' || filtros.estatus !== '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Almacenes</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Depósitos físicos y su inventario</p>
        </div>
        <Boton variante="primario" icono="mas" onClick={abrirCrear}>
          Nuevo Almacén
        </Boton>
      </div>

      <BarraFiltros
        total={almacenes.length}
        etiqueta="almacenes"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar por código, nombre o dirección..."
          className="col-span-2 md:w-72"
        />
        <Select
          value={filtros.estatus}
          onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })}
          className="md:w-40"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activos</option>
          <option value="2">Inactivos</option>
        </Select>
      </BarraFiltros>

      <Tabla
        colSpan={9}
        cargando={cargando}
        vacio={almacenes.length === 0}
        textoVacio="No hay almacenes para los filtros seleccionados."
        cabecera={
          <>
            <Th>Código</Th>
            <Th>Nombre</Th>
            <Th>Dirección</Th>
            <Th>Teléfono</Th>
            <Th align="right">Ubicaciones</Th>
            <Th align="right">Productos</Th>
            <Th align="right">Unidades</Th>
            <Th>Estado</Th>
            <Th align="center">Acciones</Th>
          </>
        }
      >
        {almacenes.map((almacen) => {
          const activo = Number(almacen.idestatus) === 1;
          return (
            <tr key={almacen.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <Td className="font-mono text-cyan-400">{almacen.codigo}</Td>
              <Td className="font-bold text-gray-900 dark:text-white">{almacen.nombre}</Td>
              <Td className="text-gray-400 max-w-[200px] truncate">{almacen.direccion || '—'}</Td>
              <Td className="text-gray-400">{almacen.telefono || '—'}</Td>
              <Td align="right" className="text-gray-300">{almacen.total_ubicaciones}</Td>
              <Td align="right" className="text-gray-300">{almacen.total_productos}</Td>
              <Td align="right" className="font-bold text-gray-900 dark:text-white">{Number(almacen.total_unidades).toLocaleString('es-VE')}</Td>
              <Td><BadgeEstado activo={activo} /></Td>
              <Td align="center"><Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(almacen)} title="Editar" aria-label="Editar"></Boton>
                  {activo ? (
                    <Boton tamano="sm" variante="advertencia" icono="poder" onClick={() => desactivar(almacen)} title="Desactivar" aria-label="Desactivar"></Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(almacen)} title="Reactivar" aria-label="Reactivar"></Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!almacen.puede_eliminar}
                    title={!almacen.puede_eliminar ? 'Tiene productos o inventario vinculado.' : undefined}
                    onClick={() => eliminar(almacen)}
                   aria-label="Eliminar"></Boton>
                </Acciones>
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar almacén' : 'Nuevo almacén'}
          subtitulo={editando ? `ID #${editando.id}` : 'Al crear se genera automáticamente la ubicación General (GEN)'}
          icono="almacen"
          onClose={() => setModalAbierto(false)}
          maxW="max-w-lg"
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-almacen" variante="exito" icono="guardar" cargando={guardando}>
                {editando ? 'Guardar cambios' : 'Crear almacén'}
              </Boton>
            </>
          }
        >
          <form id="form-almacen" onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Código" required hint="Ej. ALM02">
                <Input
                  autoFocus
                  required
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  placeholder="ALM02"
                  className="font-mono uppercase"
                />
              </Campo>
              <Campo label="Nombre" required>
                <Input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Almacén Principal"
                />
              </Campo>
            </div>
            <Campo label="Dirección">
              <Input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección física del almacén"
              />
            </Campo>
            <Campo label="Teléfono">
              <Input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+58 000 000 0000"
              />
            </Campo>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CrudAlmacenes;
