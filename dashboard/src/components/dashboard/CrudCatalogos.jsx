import { useCallback, useEffect, useState } from 'react';
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

const TABS = [
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

  const [tab, setTab] = useState(tabFijo || 'modelos');
  const [items, setItems] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estatus: '', idmarca: '', tipo: '' });
  const [form, setForm] = useState(formVacio);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);
  const tabActual = TABS.find((t) => t.id === tab) || TABS[0];

  useEffect(() => {
    api.get('marcas').then((r) => setMarcas(r.datos || []));
  }, []);

  const cargar = useCallback(async () => {
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
              : 'Modelos, colores, tallas y unidades de los productos'}
          </p>
        </div>
        <Boton variante="primario" icono="mas" onClick={abrirCrear}>
          Nuevo {tabActual.singular}
        </Boton>
      </div>

      {!tabFijo && (
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
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
            <Th align="right">Acciones</Th>
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
              <Td align="right">
                <Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(item)}>
                    Editar
                  </Boton>
                  {activo ? (
                    <Boton
                      tamano="sm"
                      variante="advertencia"
                      icono="poder"
                      disabled={item.puede_desactivar === false}
                      title={item.puede_desactivar === false ? 'Tiene productos vinculados. Reasígnalos primero.' : undefined}
                      onClick={() => desactivar(item)}
                    >
                      Desactivar
                    </Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(item)}>
                      Reactivar
                    </Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!item.puede_eliminar}
                    title={!item.puede_eliminar ? 'Tiene productos vinculados.' : undefined}
                    onClick={() => eliminar(item)}
                  >
                    Eliminar
                  </Boton>
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
    </div>
  );
};

export default CrudCatalogos;
