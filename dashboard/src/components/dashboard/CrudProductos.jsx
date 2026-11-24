import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import ModalProducto from './ModalProducto';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Input, Select } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';

const filtrosIniciales = {
  q: '',
  idcategoria: '',
  idmarca: '',
  idcolor: '',
  idtalla: '',
  almacen: '',
  precioMin: '',
  precioMax: '',
  stockMin: '',
  solo_agotados: '',
  estatus: '',
};

const CrudProductos = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [detalles, setDetalles] = useState({});

  const qDebounced = useDebounce(filtros.q);

  useEffect(() => {
    api.get('categorias').then((r) => setCategorias(r.datos || []));
    api.get('marcas').then((r) => setMarcas(r.datos || []));
    api.get('colores').then((r) => setColores(r.datos || []));
    api.get('tallas').then((r) => setTallas(r.datos || []));
    api.get('almacenes').then((r) => setAlmacenes(r.datos || []));
  }, []);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1', agrupado: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.idcategoria) params.append('idcategoria', filtros.idcategoria);
    if (filtros.idmarca) params.append('idmarca', filtros.idmarca);
    if (filtros.idcolor) params.append('idcolor', filtros.idcolor);
    if (filtros.idtalla) params.append('idtalla', filtros.idtalla);
    if (filtros.almacen) params.append('almacen', filtros.almacen);
    if (filtros.precioMin) params.append('precioMin', filtros.precioMin);
    if (filtros.precioMax) params.append('precioMax', filtros.precioMax);
    if (filtros.stockMin) params.append('stockMin', filtros.stockMin);
    if (filtros.solo_agotados) params.append('solo_agotados', filtros.solo_agotados);
    if (filtros.estatus) params.append('estatus', filtros.estatus);

    const res = await api.get('productos', params.toString());
    if (res.success) {
      const lista = res.datos || [];
      setProductos(lista);
      // Cargar detalles por producto para mostrar en la misma vista
      const entradas = await Promise.all(lista.map(async (p) => {
        const det = await api.get(`productos/${p.id}`);
        return [p.id, det.success ? (det.datos?.filas || []) : []];
      }));
      setDetalles(Object.fromEntries(entradas));
    } else {
      toast.error(res.error || 'No se pudieron cargar los productos');
    }
    setCargando(false);
  }, [
    qDebounced,
    filtros.idcategoria,
    filtros.idmarca,
    filtros.idcolor,
    filtros.idtalla,
    filtros.almacen,
    filtros.precioMin,
    filtros.precioMax,
    filtros.stockMin,
    filtros.solo_agotados,
    filtros.estatus,
    toast,
  ]);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const abrirEditar = async (producto) => {
    const res = await api.get(`productos/${producto.id}`);
    setProductoEditar(res.success ? res.datos : producto);
    setModalAbierto(true);
  };

  const onGuardadoProducto = async () => {
    setModalAbierto(false);
    cargarProductos();
  };

  const desactivar = async (producto) => {
    const ok = await confirmar({
      titulo: 'Desactivar producto',
      mensaje: `¿Deseas desactivar "${producto.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: [
        `SKU: ${producto.sku_base}`,
        `${producto.stock} unidad(es) en stock.`,
        'Dejará de mostrarse en la tienda y podrás reactivarlo.',
      ],
    });
    if (!ok) return;

    const res = await api.delete('productos', producto.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar el producto');
      return;
    }
    toast.exito('Producto desactivado');
    cargarProductos();
  };

  const reactivar = async (producto) => {
    const ok = await confirmar({
      titulo: 'Reactivar producto',
      mensaje: `¿Deseas reactivar "${producto.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('productos', producto.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar el producto');
      return;
    }
    toast.exito('Producto reactivado');
    cargarProductos();
  };

  const eliminar = async (producto) => {
    const ok = await confirmar({
      titulo: 'Eliminar producto definitivamente',
      mensaje: `Esta acción eliminará "${producto.nombre}" y todo su historial relacionado de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        `SKU: ${producto.sku_base}`,
        `${producto.stock} unidad(es) en stock serán eliminadas.`,
        'También se eliminarán su inventario, movimientos e ítems de pedidos/carritos.',
        'No se puede deshacer.',
      ],
      checkLabel: 'Entiendo que se eliminará el producto y todo su historial. Esta acción es permanente.',
    });
    if (!ok) return;

    const res = await api.delete('productos', producto.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar el producto');
      return;
    }
    toast.exito('Producto eliminado definitivamente');
    cargarProductos();
  };

  const limpiar = () => setFiltros(filtrosIniciales);
  const hayFiltros = Object.values(filtros).some((v) => v !== '');

  const totalUnidades = productos.reduce((acc, p) => acc + Number(p.stock_total ?? p.stock ?? 0), 0);
  const totalPresentaciones = productos.reduce((acc, p) => acc + Number(p.total_filas ?? 1), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Productos</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {productos.length} productos · {totalPresentaciones.toLocaleString('es-VE')} presentaciones · {totalUnidades.toLocaleString('es-VE')} unidades
          </p>
        </div>
        <Boton
          variante="primario"
          icono="mas"
          onClick={() => { setProductoEditar(null); setModalAbierto(true); }}
        >
          Nuevo Producto
        </Boton>
      </div>

      <BarraFiltros
        total={productos.length}
        etiqueta="productos"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar nombre, SKU, modelo..."
          className="col-span-2 md:w-64"
        />
        <Select
          value={filtros.idcategoria}
          onChange={(e) => setFiltros({ ...filtros, idcategoria: e.target.value })}
          className="md:w-40"
        >
          <option value="">Categoría</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
        <Select
          value={filtros.idmarca}
          onChange={(e) => setFiltros({ ...filtros, idmarca: e.target.value })}
          className="md:w-36"
        >
          <option value="">Marca</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </Select>
        <div className="flex items-center gap-1.5 md:w-36">
          <span className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" style={{ background: (colores.find((c) => String(c.id) === String(filtros.idcolor))?.codigo_hex) || '#d1d5db' }} />
          <Select
            value={filtros.idcolor}
            onChange={(e) => setFiltros({ ...filtros, idcolor: e.target.value })}
            className="w-full"
          >
            <option value="">Color</option>
            {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </div>
        <Select
          value={filtros.idtalla}
          onChange={(e) => setFiltros({ ...filtros, idtalla: e.target.value })}
          className="md:w-28"
        >
          <option value="">Talla</option>
          {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </Select>
        <Select
          value={filtros.almacen}
          onChange={(e) => setFiltros({ ...filtros, almacen: e.target.value })}
          className="md:w-32"
        >
          <option value="">Almacén</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo}</option>)}
        </Select>
        <Input
          type="number"
          placeholder="Precio mín."
          value={filtros.precioMin}
          onChange={(e) => setFiltros({ ...filtros, precioMin: e.target.value })}
          className="md:w-28"
        />
        <Input
          type="number"
          placeholder="Precio máx."
          value={filtros.precioMax}
          onChange={(e) => setFiltros({ ...filtros, precioMax: e.target.value })}
          className="md:w-28"
        />
        <Input
          type="number"
          placeholder="Stock mín."
          value={filtros.stockMin}
          onChange={(e) => setFiltros({ ...filtros, stockMin: e.target.value })}
          className="md:w-28"
        />
        <Select
          value={filtros.estatus}
          onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })}
          className="md:w-36"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activos</option>
          <option value="2">Inactivos</option>
        </Select>
        <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-[11px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.solo_agotados === '1'}
            onChange={(e) => setFiltros({ ...filtros, solo_agotados: e.target.checked ? '1' : '' })}
            className="accent-rose-500"
          />
          Solo agotados
        </label>
      </BarraFiltros>

      <Tabla
        colSpan={10}
        cargando={cargando}
        vacio={productos.length === 0}
        textoVacio="No hay productos para los filtros seleccionados."
        cabecera={
          <>
            <Th>Img</Th>
            <Th>SKU</Th>
            <Th>Producto</Th>
            <Th>Categoría / Marca</Th>
            <Th>Presentaciones</Th>
            <Th align="right">Stock total</Th>
            <Th align="right">Rango precio</Th>
            <Th>Almacenes</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </>
        }
      >
        {productos.map((producto) => {
          const activo = Number(producto.idestatus) === 1;
          const stockTotal = Number(producto.stock_total ?? producto.stock ?? 0);
          const totalFilas = Number(producto.total_filas ?? 1);
          const precioMin = producto.precio_min ?? producto.precio;
          const precioMax = producto.precio_max ?? producto.precio;
          const rangoPrecio = precioMin === precioMax || precioMax == null
            ? `$ ${Number(precioMin || 0).toFixed(2)}`
            : `$ ${Number(precioMin || 0).toFixed(2)} - $ ${Number(precioMax || 0).toFixed(2)}`;
          const filasDetalle = detalles[producto.id] || [];

          // Agrupar por almacén
          const grupos = filasDetalle.reduce((acc, f) => {
            const alm = (f.stock_por_almacen || [])[0];
            const key = alm ? `${alm.codigo}||${alm.almacen}` : `SIN||Sin almacén`;
            if (!acc[key]) acc[key] = { codigo: alm?.codigo || '—', nombre: alm?.almacen || 'Sin almacén', filas: [] };
            acc[key].filas.push(f);
            return acc;
          }, {});
          const gruposArr = Object.values(grupos);

          return (
            <Fragment key={producto.id}>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <Td>
                  <img
                    src={`http://localhost:8000/imagenes/${producto.imagen}`}
                    alt={producto.nombre}
                    className="w-10 h-10 rounded-lg object-contain bg-gray-950 border border-gray-800"
                  />
                </Td>
                <Td className="font-mono text-[10px] text-cyan-400">
                  {producto.codigo_producto || producto.sku_base}
                  <span className="block text-gray-500">{totalFilas} presentación(es)</span>
                </Td>
                <Td className="font-bold text-gray-900 dark:text-white max-w-xs">
                  <span className="block truncate">{producto.nombre}</span>
                  <span className="block text-[10px] text-gray-500 truncate">{producto.modelo || 'Sin modelo'}</span>
                </Td>
                <Td className="text-[11px] text-gray-400">
                  <span className="block">{producto.categoria || 'N/A'}</span>
                  <span className="block text-blue-400">{producto.marca || 'N/A'}</span>
                </Td>
                <Td className="text-[10px] text-gray-400 max-w-[260px]">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {(producto.colores_detalle || producto.colores || '').split('||').filter(Boolean).map((c, i) => {
                      const [nombre, hex] = c.includes('~') ? c.split('~') : [c, ''];
                      return (
                        <span key={`${nombre}-${i}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600" style={{ background: hex || '#d1d5db' }} />
                          <span>{nombre}</span>
                        </span>
                      );
                    })}
                    {!producto.colores_detalle && !producto.colores && <span>—</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(producto.tallas || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px]">{t}</span>
                    ))}
                    {!producto.tallas && <span>Tallas: —</span>}
                  </div>
                </Td>
                <Td align="right">
                  <span className={`font-bold ${stockTotal < 10 ? 'text-rose-400' : 'text-gray-200'}`}>{stockTotal}</span>
                  <span className="ml-1 text-[10px] text-gray-500">{producto.unidad_abreviatura || producto.unidad_medida || ''}</span>
                </Td>
                <Td align="right" className="font-mono text-[11px] text-gray-200">{rangoPrecio}</Td>
                <Td className="text-[10px] text-gray-400">{producto.almacenes_codigo || '—'}</Td>
                <Td><BadgeEstado activo={activo} /></Td>
                <Td align="right">
                  <Acciones>
                    <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(producto)}>
                      Editar
                    </Boton>
                    {activo ? (
                      <Boton tamano="sm" variante="advertencia" icono="poder" onClick={() => desactivar(producto)}>
                        Desactivar
                      </Boton>
                    ) : (
                      <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(producto)}>
                        Reactivar
                      </Boton>
                    )}
                    <Boton tamano="sm" variante="peligro" icono="papelera" onClick={() => eliminar(producto)}>
                      Eliminar
                    </Boton>
                  </Acciones>
                </Td>
              </tr>

              <tr className="bg-gray-50/60 dark:bg-gray-900/30">
                <td colSpan={10} className="px-4 py-3">
                  {filasDetalle.length === 0 ? (
                    <div className="text-[11px] text-gray-500">Cargando presentaciones...</div>
                  ) : (
                    <div className="space-y-3">
                      {gruposArr.map((g) => (
                        <div key={`${producto.id}-${g.codigo}`} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-gray-100/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-200">
                            Almacén: {g.codigo} · {g.nombre}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left px-3 py-1.5">Ubicación</th>
                                  <th className="text-left px-3 py-1.5">Color</th>
                                  <th className="text-left px-3 py-1.5">Talla</th>
                                  <th className="text-right px-3 py-1.5">Costo</th>
                                  <th className="text-right px-3 py-1.5">Precio</th>
                                  <th className="text-right px-3 py-1.5">Stock</th>
                                  <th className="text-left px-3 py-1.5">Barcode</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.filas.map((f) => {
                                  const ubi = (f.ubicaciones || [])[0];
                                  return (
                                    <tr key={f.id} className="border-t border-gray-100 dark:border-gray-800/60">
                                      <td className="px-3 py-1.5">{ubi?.ruta || ubi?.ubicacion_codigo || 'General'}</td>
                                      <td className="px-3 py-1.5">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600" style={{ background: f.color_hex || '#d1d5db' }} />
                                          {f.color || '—'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-1.5">{f.talla || '—'}</td>
                                      <td className="px-3 py-1.5 text-right font-mono">$ {Number(f.costo || 0).toFixed(2)}</td>
                                      <td className="px-3 py-1.5 text-right font-mono">$ {Number(f.precio || 0).toFixed(2)}</td>
                                      <td className="px-3 py-1.5 text-right font-bold">{Number(f.stock || 0)}</td>
                                      <td className="px-3 py-1.5 font-mono text-gray-500">{f.codigo_barras || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            </Fragment>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <ModalProducto
          productoEditar={productoEditar}
          onClose={() => setModalAbierto(false)}
          onGuardado={onGuardadoProducto}
        />
      )}
    </div>
  );
};

export default CrudProductos;
