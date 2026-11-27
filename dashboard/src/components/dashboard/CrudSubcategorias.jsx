import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
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

const formVacio = { nombre: '', idcategoria: '' };

const CrudSubcategorias = forwardRef(({ embebido = false }, ref) => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', idcategoria: '', estatus: '' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  const cargarCategorias = useCallback(async () => {
    const res = await api.get('categorias', 'todos=1');
    if (res.success) setCategorias(res.datos || []);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);

    const res = await api.get('subcategorias', params.toString());
    if (res.success) {
      setSubcategorias(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar las subcategorías');
    }
    setCargando(false);
  }, [qDebounced, filtros.idcategoria, filtros.estatus, toast]);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...formVacio, idcategoria: filtros.idcategoria || '' });
    setModalAbierto(true);
  };

  const abrirEditar = (sub) => {
    setEditando(sub);
    setForm({
      nombre: sub.nombre || '',
      idcategoria: sub.idcategoria ? String(sub.idcategoria) : '',
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre de la subcategoría es obligatorio');
      return;
    }
    if (!form.idcategoria) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(),
      idcategoria: Number(form.idcategoria),
    };
    const res = editando
      ? await api.put('subcategorias', editando.id, payload)
      : await api.post('subcategorias', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || 'No se pudo guardar la subcategoría');
      return;
    }

    toast.exito(editando ? 'Subcategoría actualizada correctamente' : 'Subcategoría creada correctamente');
    setModalAbierto(false);
    setForm(formVacio);
    setEditando(null);
    cargar();
  };

  const desactivar = async (sub) => {
    const ok = await confirmar({
      titulo: 'Desactivar subcategoría',
      mensaje: `¿Deseas desactivar la subcategoría "${sub.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: ['Dejará de mostrarse como opción activa.', 'Podrás reactivarla más adelante.'],
    });
    if (!ok) return;

    const res = await api.delete('subcategorias', sub.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar la subcategoría');
      return;
    }
    toast.exito('Subcategoría desactivada');
    cargar();
  };

  const reactivar = async (sub) => {
    const ok = await confirmar({
      titulo: 'Reactivar subcategoría',
      mensaje: `¿Deseas reactivar la subcategoría "${sub.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('subcategorias', sub.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar la subcategoría');
      return;
    }
    toast.exito('Subcategoría reactivada');
    cargar();
  };

  const eliminar = async (sub) => {
    const ok = await confirmar({
      titulo: 'Eliminar subcategoría definitivamente',
      mensaje: `Esta acción eliminará la subcategoría "${sub.nombre}" de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'No se puede deshacer.',
        'Solo se permite si no tiene productos vinculados.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('subcategorias', sub.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar la subcategoría');
      return;
    }
    toast.exito('Subcategoría eliminada definitivamente');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', idcategoria: '', estatus: '' });
  const hayFiltros = filtros.q !== '' || filtros.idcategoria !== '' || filtros.estatus !== '';

  const exportar = (tipo) => {
    const cols = [
      { header: 'ID', valor: (r) => r.id },
      { header: 'Nombre', valor: (r) => r.nombre },
      { header: 'Categoría', valor: (r) => r.categoria_nombre || r.categoria || '' },
      { header: 'Productos', valor: (r) => r.total_productos ?? '' },
      { header: 'Estatus', valor: (r) => Number(r.idestatus) === 1 ? 'Activo' : 'Inactivo' },
    ];
    const filtrosRep = [];
    if (filtros.q) filtrosRep.push({ label: 'Búsqueda', value: filtros.q });
    if (filtros.idcategoria) filtrosRep.push({ label: 'Categoría', value: categorias.find((c) => String(c.id) === String(filtros.idcategoria))?.nombre || filtros.idcategoria });
    if (filtros.estatus !== '') filtrosRep.push({ label: 'Estatus', value: filtros.estatus === '1' ? 'Activo' : 'Inactivo' });
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_subcategorias', hoja: 'Subcategorías', columnas: cols, filas: subcategorias });
    else exportarPDF({ nombre: 'reporte_subcategorias', titulo: 'Reporte de Subcategorías', filtros: filtrosRep, columnas: cols, filas: subcategorias });
  };

  useImperativeHandle(ref, () => ({ exportar, abrirCrear }), [exportar, abrirCrear]);

  return (
    <div className="space-y-4">
      {!embebido ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Subcategorías</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Clasificación secundaria de productos dentro de cada categoría</p>
          </div>
          <div className="flex items-center gap-2">
            <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
            <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
            <Boton variante="primario" icono="mas" onClick={abrirCrear}>Nueva Subcategoría</Boton>
          </div>
        </div>
      ) : null}

      <BarraFiltros total={subcategorias.length} etiqueta="subcategorías" onLimpiar={limpiar} puedeLimpiar={hayFiltros}>
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar por nombre o categoría..."
          className="col-span-2 md:w-72"
        />
        <Select
          value={filtros.idcategoria}
          onChange={(e) => setFiltros({ ...filtros, idcategoria: e.target.value })}
          className="md:w-48"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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
        colSpan={5}
        cargando={cargando}
        vacio={subcategorias.length === 0}
        textoVacio="No hay subcategorías para los filtros seleccionados."
        cabecera={
          <>
            <Th>ID</Th>
            <Th>Nombre</Th>
            <Th>Categoría</Th>
            <Th>Estado</Th>
            <Th align="center">Acciones</Th>
          </>
        }
      >
        {subcategorias.map((sub) => {
          const activa = Number(sub.idestatus) === 1;
          return (
            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <Td className="font-mono text-gray-500">#{sub.id}</Td>
              <Td className="font-bold text-gray-900 dark:text-white">{sub.nombre}</Td>
              <Td className="text-gray-400">{sub.categoria_nombre || '—'}</Td>
              <Td><BadgeEstado activo={activa} activoLabel="Activa" inactivoLabel="Inactiva" /></Td>
              <Td align="center"><Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(sub)} title="Editar" aria-label="Editar"></Boton>
                  {activa ? (
                    <Boton tamano="sm" variante="advertencia" icono="poder" onClick={() => desactivar(sub)} title="Desactivar" aria-label="Desactivar"></Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(sub)} title="Reactivar" aria-label="Reactivar"></Boton>
                  )}
                  <Boton tamano="sm" variante="peligro" icono="papelera" onClick={() => eliminar(sub)} title="Eliminar" aria-label="Eliminar"></Boton>
                </Acciones>
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar subcategoría' : 'Nueva subcategoría'}
          subtitulo={editando ? `ID #${editando.id}` : 'Registra una subcategoría dentro de una categoría'}
          icono="categoria"
          onClose={() => setModalAbierto(false)}
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
              <Boton type="submit" form="form-subcategoria" variante="exito" icono="guardar" cargando={guardando}>
                {editando ? 'Guardar cambios' : 'Crear subcategoría'}
              </Boton>
            </>
          }
        >
          <form id="form-subcategoria" onSubmit={guardar} className="space-y-4">
            <Campo label="Categoría" required>
              <Select
                required
                value={form.idcategoria}
                onChange={(e) => setForm({ ...form, idcategoria: e.target.value })}
              >
                <option value="">Selecciona una categoría...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>
            <Campo label="Nombre" required>
              <Input
                autoFocus
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Camisas formales, Zapatillas deportivas..."
              />
            </Campo>
          </form>
        </Modal>
      )}
    </div>
  );
});

export default CrudSubcategorias;
