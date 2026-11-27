import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Icono from '../ui/Icono';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';
import CrudMarcas from './CrudMarcas';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const TABS = [
  { id: 'marcas', label: 'Marcas', singular: 'Marca', icono: 'marca' },
  { id: 'modelos', label: 'Modelos', singular: 'Modelo', icono: 'modelo' },
  { id: 'colores', label: 'Colores', singular: 'Color', icono: 'color' },
  { id: 'tallas', label: 'Tallas', singular: 'Talla', icono: 'talla' },
  { id: 'unidades', label: 'Unidades', singular: 'Unidad', icono: 'inventario' },
];

const formVacio = {
  nombre: '',
  idmarca: '',
  codigo_hex: '#000000',
  tipo: 'letra',
  orden: 0,
  abreviatura: '',
};

const CrudCatalogos = ({ tabFijo = null }) => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [tab, setTab] = useState(tabFijo || 'marcas');
  const [items, setItems] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estatus: '', idmarca: '', tipo: '' });
  const [form, setForm] = useState(formVacio);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const marcasRef = useRef(null);

  const qDebounced = useDebounce(filtros.q);
  const tabActual = TABS.find((t) => t.id === tab) || TABS[0];
  // "Unidades" es un modulo principal del menu; no se muestra como pestaña aqui.
  const tabsVisibles = TABS.filter((t) => t.id !== 'unidades');

  const cargarMarcas = useCallback(async () => {
    const res = await api.get('marcas');
    if (res.success) setMarcas(res.datos || []);
  }, []);

  useEffect(() => { cargarMarcas(); }, [cargarMarcas]);
  useEffect(() => { if (tab === 'modelos') cargarMarcas(); }, [tab, cargarMarcas]);

  const cargar = useCallback(async () => {
    if (tab === 'marcas') { setCargando(false); return; }
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);
    if (tab === 'modelos' && filtros.idmarca !== '') params.append('idmarca', filtros.idmarca);
    if (tab === 'tallas' && filtros.tipo !== '') params.append('tipo', filtros.tipo);

    const res = await api.get(tab, params.toString());
    if (res.success) {
      setItems(res.datos || []);
    } else {
      toast.error(res.error || `No se pudieron cargar los ${tabActual.label.toLowerCase()}`);
    }
    setCargando(false);
  }, [tab, qDebounced, filtros.estatus, filtros.idmarca, filtros.tipo, tabActual.label, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setEditando(item);
    setForm({
      nombre: item.nombre || '',
      idmarca: item.idmarca || '',
      codigo_hex: item.codigo_hex || '#000000',
      tipo: item.tipo || 'letra',
      orden: item.orden ?? 0,
      abreviatura: item.abreviatura || '',
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const payload = { nombre: form.nombre.trim() };
    if (tab === 'modelos') payload.idmarca = form.idmarca ? Number(form.idmarca) : null;
    if (tab === 'colores') payload.codigo_hex = form.codigo_hex || null;
    if (tab === 'tallas') {
      payload.tipo = form.tipo;
      payload.orden = Number(form.orden) || 0;
    }
    if (tab === 'unidades') {
      if (!form.abreviatura.trim()) {
        toast.error('La abreviatura es obligatoria');
        return;
      }
      payload.abreviatura = form.abreviatura.trim().toUpperCase();
    }

    setGuardando(true);
    const res = editando
      ? await api.put(tab, editando.id, payload)
      : await api.post(tab, payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || (res.errores || []).join('. ') || 'No se pudo guardar el registro');
      return;
    }

    toast.exito(editando ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
    setModalAbierto(false);
    setEditando(null);
    setForm(formVacio);
    cargar();
  };

  const desactivar = async (item) => {
    if (item.puede_desactivar === false) {
      toast.error('No se puede desactivar: el registro tiene productos vinculados.');
      return;
    }

    const ok = await confirmar({
      titulo: `Desactivar ${tabActual.singular.toLowerCase()}`,
      mensaje: `¿Deseas desactivar "${item.nombre}" del catálogo de ${tabActual.label.toLowerCase()}?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: ['Dejará de aparecer en los formularios de producto.', 'Podrás reactivarlo más adelante.'],
    });
    if (!ok) return;

    const res = await api.delete(tab, item.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar el registro');
      return;
    }
    toast.exito('Registro desactivado');
    cargar();
  };

  const reactivar = async (item) => {
    const ok = await confirmar({
      titulo: `Reactivar ${tabActual.singular.toLowerCase()}`,
      mensaje: `¿Deseas reactivar "${item.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put(tab, item.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar el registro');
      return;
    }
    toast.exito('Registro reactivado');
    cargar();
  };

  const eliminar = async (item) => {
    if (!item.puede_eliminar) {
      toast.error('No se puede eliminar: el registro tiene productos vinculados.');
      return;
    }

    const ok = await confirmar({
      titulo: `Eliminar ${tabActual.singular.toLowerCase()} definitivamente`,
      mensaje: `Esta acción eliminará "${item.nombre}" de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: ['No se puede deshacer.', 'Solo se permite porque no tiene productos vinculados.'],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete(tab, item.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar el registro');
      return;
    }
    toast.exito('Registro eliminado definitivamente');
    cargar();
  };

  const cambiarTab = (nuevoTab) => {
    setTab(nuevoTab);
    setEditando(null);
    setForm(formVacio);
    setModalAbierto(false);
    setFiltros((prev) => ({ ...prev, idmarca: '', tipo: '' }));
  };

  const limpiar = () => setFiltros({ q: '', estatus: '', idmarca: '', tipo: '' });
  const hayFiltros = filtros.q !== '' || filtros.estatus !== '' || filtros.idmarca !== '' || filtros.tipo !== '';

  const exportar = (tipo) => {
    const cols = [
      { header: 'ID', valor: (r) => r.id },
      { header: 'Nombre', valor: (r) => r.nombre },
      ...(tab === 'modelos' ? [{ header: 'Marca', valor: (r) => r.marca_nombre || '' }] : []),
      ...(tab === 'colores' ? [{ header: 'Hex', valor: (r) => r.codigo_hex || '' }] : []),
      ...(tab === 'tallas' ? [{ header: 'Tipo', valor: (r) => r.tipo || '' }, { header: 'Orden', valor: (r) => r.orden ?? '' }] : []),
      ...(tab === 'unidades' ? [{ header: 'Abreviatura', valor: (r) => r.abreviatura || '' }] : []),
      { header: 'Estatus', valor: (r) => Number(r.idestatus) === 1 ? 'Activo' : 'Inactivo' },
    ];
    const filtrosRep = [];
    if (filtros.q) filtrosRep.push({ label: 'Búsqueda', value: filtros.q });
    if (filtros.estatus !== '') filtrosRep.push({ label: 'Estatus', value: filtros.estatus === '1' ? 'Activo' : 'Inactivo' });
    if (filtros.idmarca && tab === 'modelos') filtrosRep.push({ label: 'Marca', value: marcas.find((m) => String(m.id) === String(filtros.idmarca))?.nombre || filtros.idmarca });
    if (filtros.tipo && tab === 'tallas') filtrosRep.push({ label: 'Tipo', value: filtros.tipo });
    const nombre = `reporte_${tab}`;
    if (tipo === 'excel') exportarExcel({ nombre, hoja: tabActual.label, columnas: cols, filas: items });
    else exportarPDF({ nombre, titulo: `Reporte de ${tabActual.label}`, filtros: filtrosRep, columnas: cols, filas: items });
  };

  const colSpan = tab === 'tallas' ? 7 : 6;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">
            {tabFijo ? tabActual.label : 'Catálogos'}
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {tabFijo
              ? `Gestiona las ${tabActual.label.toLowerCase()} disponibles para los productos`
              : 'Marcas, modelos, colores y tallas de los productos'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => tab === 'marcas' ? marcasRef.current?.exportar('excel') : exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => tab === 'marcas' ? marcasRef.current?.exportar('pdf') : exportar('pdf')}>PDF</Boton>
          <Boton variante="primario" icono="mas" onClick={() => tab === 'marcas' ? marcasRef.current?.abrirCrear() : abrirCrear()}>
            {tab === 'marcas' ? 'Nueva Marca' : `Nuevo ${tabActual.singular}`}
          </Boton>
        </div>
      </div>

      {!tabFijo && (
        <div className="flex flex-wrap gap-2">
          {tabsVisibles.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => cambiarTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                tab === t.id
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Icono nombre={t.icono} className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'marcas' ? (
        <CrudMarcas ref={marcasRef} embebido />
      ) : (
        <>
      <BarraFiltros
        total={items.length}
        etiqueta={tabActual.label.toLowerCase()}
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder={`Buscar ${tabActual.singular.toLowerCase()} por nombre...`}
          className="col-span-2 md:w-64"
        />

        {tab === 'modelos' && (
          <Select
            value={filtros.idmarca}
            onChange={(e) => setFiltros({ ...filtros, idmarca: e.target.value })}
            className="md:w-48"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
        )}

        {tab === 'tallas' && (
          <Select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="md:w-40"
          >
            <option value="">Todos los tipos</option>
            <option value="letra">Letra</option>
            <option value="numero">Número</option>
            <option value="libre">Libre</option>
          </Select>
        )}

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
        colSpan={colSpan}
        cargando={cargando}
        vacio={items.length === 0}
        textoVacio={`No hay ${tabActual.label.toLowerCase()} para los filtros seleccionados.`}
        cabecera={
          <>
            <Th>ID</Th>
            <Th>Nombre</Th>
            {tab === 'modelos' && <Th>Marca</Th>}
            {tab === 'colores' && <Th>Muestra</Th>}
            {tab === 'tallas' && <Th>Tipo</Th>}
            {tab === 'tallas' && <Th align="right">Orden</Th>}
            {tab === 'unidades' && <Th>Abreviatura</Th>}
            <Th align="right">Productos</Th>
            <Th>Estado</Th>
            <Th align="center">Acciones</Th>
          </>
        }
      >
        {items.map((item) => {
          const activo = Number(item.idestatus) === 1;
          return (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <Td className="font-mono text-gray-500">#{item.id}</Td>
              <Td className="font-bold text-gray-900 dark:text-white">{item.nombre}</Td>
              {tab === 'modelos' && <Td className="text-blue-400">{item.marca || '—'}</Td>}
              {tab === 'colores' && (
                <Td>
                  <span className="inline-flex items-center gap-2 text-gray-400 font-mono text-[10px]">
                    <span className="w-4 h-4 rounded-full border border-gray-700" style={{ background: item.codigo_hex || 'transparent' }} />
                    {item.codigo_hex || '—'}
                  </span>
                </Td>
              )}
              {tab === 'tallas' && <Td className="text-gray-400">{item.tipo}</Td>}
              {tab === 'tallas' && <Td align="right" className="text-gray-400">{item.orden}</Td>}
              {tab === 'unidades' && <Td className="font-mono text-cyan-400">{item.abreviatura || '—'}</Td>}
              <Td align="right" className="text-gray-300">{item.total_productos}</Td>
              <Td><BadgeEstado activo={activo} /></Td>
              <Td align="center"><Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(item)} title="Editar" aria-label="Editar"></Boton>
                  {activo ? (
                    <Boton
                      tamano="sm"
                      variante="advertencia"
                      icono="poder"
                      disabled={item.puede_desactivar === false}
                      title={item.puede_desactivar === false ? 'Tiene productos vinculados. Reasígnalos primero.' : undefined}
                      onClick={() => desactivar(item)}
                     aria-label="Desactivar"></Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(item)} title="Reactivar" aria-label="Reactivar"></Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!item.puede_eliminar}
                    title={!item.puede_eliminar ? 'Tiene productos vinculados.' : undefined}
                    onClick={() => eliminar(item)}
                   aria-label="Eliminar"></Boton>
                </Acciones>
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={editando ? `Editar ${tabActual.singular.toLowerCase()}` : `Nuevo ${tabActual.singular.toLowerCase()}`}
          subtitulo={editando ? `ID #${editando.id}` : `Registra un ${tabActual.singular.toLowerCase()} en el catálogo`}
          icono={tabActual.icono}
          onClose={() => setModalAbierto(false)}
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-catalogo" variante="exito" icono="guardar" cargando={guardando}>
                {editando ? 'Guardar cambios' : `Crear ${tabActual.singular.toLowerCase()}`}
              </Boton>
            </>
          }
        >
          <form id="form-catalogo" onSubmit={guardar} className="space-y-4">
            <Campo label="Nombre" required>
              <Input
                autoFocus
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder={`Nombre del ${tabActual.singular.toLowerCase()}`}
              />
            </Campo>

            {tab === 'modelos' && (
              <Campo label="Marca" hint="Opcional. Puedes dejarlo sin marca.">
                <Select
                  value={form.idmarca}
                  onChange={(e) => setForm({ ...form, idmarca: e.target.value })}
                >
                  <option value="">Sin marca</option>
                  {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </Select>
              </Campo>
            )}

            {tab === 'colores' && (
              <Campo label="Código de color" required>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.codigo_hex || '#000000'}
                    onChange={(e) => setForm({ ...form, codigo_hex: e.target.value })}
                    className="h-10 w-14 bg-gray-950 border border-gray-800 rounded-xl cursor-pointer"
                  />
                  <Input
                    value={form.codigo_hex || ''}
                    onChange={(e) => setForm({ ...form, codigo_hex: e.target.value })}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </Campo>
            )}

            {tab === 'tallas' && (
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo" required>
                  <Select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="letra">Letra</option>
                    <option value="numero">Número</option>
                    <option value="libre">Libre</option>
                  </Select>
                </Campo>
                <Campo label="Orden" hint="Menor número aparece primero.">
                  <Input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  />
                </Campo>
              </div>
            )}

            {tab === 'unidades' && (
              <Campo label="Abreviatura" required hint="Ej: UND, PZA, DOC, KG. Se usa en listados y stock.">
                <Input
                  required
                  value={form.abreviatura}
                  onChange={(e) => setForm({ ...form, abreviatura: e.target.value.toUpperCase() })}
                  placeholder="UND"
                  className="font-mono uppercase"
                  maxLength={20}
                />
              </Campo>
            )}
          </form>
        </Modal>
      )}
        </>
      )}
    </div>
  );
};

export default CrudCatalogos;
