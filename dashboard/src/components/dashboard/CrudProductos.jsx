import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import ModalProducto from './ModalProducto';
import ModalPresentacion from './ModalPresentacion';
import Boton from '../ui/Boton';
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
  const [presentacionEditar, setPresentacionEditar] = useState(null);
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

  const abrirEditarPresentacion = (producto, fila, almacen) => {
    setPresentacionEditar({
      producto,
      fila,
      almacen,
    });
  };

  const onGuardadoPresentacion = () => {
    setPresentacionEditar(null);
    cargarProductos();
  };

  const desactivar = async (producto) => {
    const stock = Number(producto.stock_total ?? producto.stock ?? 0);
    const ok = await confirmar({
      titulo: 'Desactivar producto',
      mensaje: `¿Deseas desactivar "${producto.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: [
        `SKU: ${producto.codigo_producto || producto.sku_base}`,
        `${stock} unidad(es) en stock.`,
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

  const cambiarEstadoPresentacion = async (producto, fila, activar) => {
    const ok = await confirmar({
      titulo: activar ? 'Reactivar presentación' : 'Desactivar presentación',
      mensaje: `¿Deseas ${activar ? 'reactivar' : 'desactivar'} el SKU "${fila.sku_base || fila.codigo_detalle || fila.id}"?`,
      variante: activar ? 'exito' : 'advertencia',
      textoConfirmar: activar ? 'Sí, reactivar' : 'Sí, desactivar',
      detalle: [
        `Producto: ${producto.nombre}`,
        `Stock actual: ${Number(fila.stock || 0)} unidad(es).`,
        activar
          ? 'Volverá a estar disponible para la venta.'
          : 'Dejará de estar disponible, pero conservará su inventario.',
      ],
    });
    if (!ok) return;

    const res = await api.put('productos', fila.id, { idestatus: activar ? 1 : 2 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo actualizar la presentación');
      return;
    }
    toast.exito(activar ? 'Presentación reactivada' : 'Presentación desactivada');
    cargarProductos();
  };

  const eliminarPresentacion = async (producto, fila, almacen) => {
    const stock = Number(fila.stock || 0);
    if (stock > 0) {
      toast.error(`No se puede eliminar: la presentación tiene ${stock} unidad(es) en stock. Ajusta el stock a cero primero.`);
      return;
    }

    const almacenes = (fila.stock_por_almacen || [])
      .map((a) => `${a.codigo} · ${a.almacen}`)
      .join(', ');

    const ok = await confirmar({
      titulo: 'Eliminar presentación definitivamente',
      mensaje: `Se eliminará el SKU "${fila.sku_base || fila.codigo_detalle || fila.id}" de "${producto.nombre}".`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        almacenes ? `Almacén(es): ${almacenes}.` : `Almacén: ${almacen?.codigo || 'sin asignar'}.`,
        'Solo se permite porque no tiene stock en inventario.',
        'No se puede deshacer.',
      ],
      checkLabel: 'Entiendo que esta presentación se eliminará de forma permanente.',
    });
    if (!ok) return;

    const res = await api.delete('productos', fila.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar la presentación');
      return;
    }
    toast.exito('Presentación eliminada definitivamente');
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
    const totalFilas = Number(producto.total_filas ?? 0);
    const stock = Number(producto.stock_total ?? producto.stock ?? 0);
    const esBase = Number(producto.es_base) === 1;

    if (esBase && totalFilas > 0) {
      toast.error(`No se puede eliminar el producto principal: tiene ${totalFilas} presentación(es) vinculada(s). Elimina o desvincula primero las presentaciones.`);
      return;
    }
    if (stock > 0) {
      toast.error(`No se puede eliminar: el producto tiene ${stock} unidad(es) en inventario. Ajusta el stock a cero primero.`);
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar producto definitivamente',
      mensaje: `Esta acción eliminará "${producto.nombre}" y todo su historial relacionado de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        `SKU: ${producto.codigo_producto || producto.sku_base}`,
        'No tiene presentaciones vinculadas ni stock pendiente.',
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
        minWidth="min-w-[1280px]"
        cabecera={
          <>
            <Th>Imagen</Th>
            <Th>SKU</Th>
            <Th>Producto / Descripción</Th>
            <Th>Categoría / Marca</Th>
            <Th align="right">Stock total</Th>
            <Th align="right">Precio / Costo</Th>
            <Th className="border-l-2 border-purple-200 dark:border-purple-500/30">Almacén</Th>
            <Th>Color / Talla</Th>
            <Th align="right">Stock almacén</Th>
            <Th align="right">Acciones</Th>
          </>
        }
      >
        {productos.map((producto) => {
          const activo = Number(producto.idestatus) === 1;
          const esBase = Number(producto.es_base) === 1;
          const stockTotal = Number(producto.stock_total ?? producto.stock ?? 0);
          const totalFilas = Number(producto.total_filas ?? 0);
          const precioMin = producto.precio_min ?? producto.precio;
          const precioMax = producto.precio_max ?? producto.precio;
          const costoMin = producto.costo_min ?? producto.costo;
          const costoMax = producto.costo_max ?? producto.costo;
          const rangoPrecio = precioMin === precioMax || precioMax == null
            ? `$ ${Number(precioMin || 0).toFixed(2)}`
            : `$ ${Number(precioMin || 0).toFixed(2)} - $ ${Number(precioMax || 0).toFixed(2)}`;
          const rangoCosto = costoMin === costoMax || costoMax == null
            ? `$ ${Number(costoMin || 0).toFixed(2)}`
            : `$ ${Number(costoMin || 0).toFixed(2)} - $ ${Number(costoMax || 0).toFixed(2)}`;
          const filasDetalle = detalles[producto.id] || [];

          // Cada fila de almacén representa una presentación/SKU dentro de un almacén.
          const presentaciones = [];
          filasDetalle.forEach((fila) => {
            const almacenesFila = Array.isArray(fila.stock_por_almacen) ? fila.stock_por_almacen : [];
            if (almacenesFila.length === 0) {
              presentaciones.push({ fila, almacen: null });
            } else {
              almacenesFila.forEach((almacen) => presentaciones.push({ fila, almacen }));
            }
          });
          presentaciones.sort((a, b) => {
            const codigoA = a.almacen?.codigo || '';
            const codigoB = b.almacen?.codigo || '';
            return codigoA.localeCompare(codigoB)
              || String(a.fila.sku_base || '').localeCompare(String(b.fila.sku_base || ''));
          });

          const almacenesCodigo = [...new Set(
            presentaciones.map((p) => p.almacen?.codigo).filter(Boolean)
          )];

          const motivoNoEliminarProducto = esBase && totalFilas > 0
            ? `Tiene ${totalFilas} presentación(es) vinculada(s). Elimina o desvincula primero las presentaciones.`
            : stockTotal > 0
              ? 'Tiene inventario. Ajusta el stock a cero antes de eliminar.'
              : undefined;

          return (
            <Fragment key={producto.id}>
              <tr className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${!activo ? 'bg-rose-50/60 dark:bg-rose-500/5' : ''}`}>
                <Td>
                  <img
                    src={`http://localhost:8000/imagenes/${producto.imagen}`}
                    alt={producto.nombre}
                    className="w-11 h-11 rounded-lg object-contain bg-gray-950 border border-gray-800"
                  />
                </Td>
                <Td className="font-mono text-[10px] text-cyan-400">
                  <span className="block">{producto.codigo_producto || producto.sku_base}</span>
                  <span className="mt-0.5 block text-gray-500">
                    {esBase ? `${totalFilas} presentación(es)` : 'Producto simple'}
                  </span>
                  <span className="mt-1 block"><BadgeEstado activo={activo} /></span>
                </Td>
                <Td className="max-w-[240px]">
                  <span className="block truncate font-bold text-gray-900 dark:text-white">{producto.nombre}</span>
                  <span className="block truncate text-[10px] text-gray-500">
                    {producto.descripcion || producto.modelo || 'Sin descripción'}
                  </span>
                </Td>
                <Td className="text-[11px] text-gray-400">
                  <span className="block">{producto.categoria || 'N/A'}</span>
                  <span className="block text-blue-400">{producto.marca || 'N/A'}</span>
                </Td>
                <Td align="right">
                  <span className={`font-bold ${stockTotal < 10 ? 'text-rose-400' : 'text-gray-900 dark:text-white'}`}>{stockTotal}</span>
                  <span className="ml-1 text-[10px] text-gray-500">{producto.unidad_abreviatura || producto.unidad_medida || ''}</span>
                </Td>
                <Td align="right" className="whitespace-nowrap font-mono text-[11px]">
                  <span className="block text-gray-900 dark:text-gray-100">{rangoPrecio}</span>
                  <span className="block text-[10px] text-gray-500">Costo {rangoCosto}</span>
                </Td>
                <Td className="border-l-2 border-purple-200 text-[11px] align-top dark:border-purple-500/30">
                  {presentaciones.length === 0 ? (
                    <span className="text-gray-500">-</span>
                  ) : (
                    <div className="space-y-2">
                      {presentaciones.map(({ fila, almacen }, idx) => (
                        <div key={`${producto.id}-${fila.id}-${almacen?.almacen_id || 'sin'}-alm-${idx}`} className={`min-h-[52px] flex flex-col justify-center ${idx > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                          {almacen ? (
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                {almacen.codigo}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">{almacen.almacen}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">Sin almacen</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Td>
                <Td className="text-[11px] align-top">
                  {presentaciones.length === 0 ? (
                    <span className="text-gray-500">-</span>
                  ) : (
                    <div className="space-y-2">
                      {presentaciones.map(({ fila, almacen }, idx) => (
                        <div key={`${producto.id}-${fila.id}-${almacen?.almacen_id || 'sin'}-ct-${idx}`} className={`min-h-[52px] flex flex-wrap items-center content-center gap-1.5 ${idx > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm dark:border-gray-600" style={{ background: fila.color_hex || '#d1d5db' }} />
                            <span className="text-gray-600 dark:text-gray-300">{fila.color || '-'}</span>
                          </span>
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Talla {fila.talla || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Td>
                <Td align="right" className="align-top">
                  {presentaciones.length === 0 ? (
                    <span className="text-gray-500">-</span>
                  ) : (
                    <div className="space-y-2">
                      {presentaciones.map(({ fila, almacen }, idx) => {
                        const stockFila = Number(almacen?.stock ?? fila.stock ?? 0);
                        return (
                          <div key={`${producto.id}-${fila.id}-${almacen?.almacen_id || 'sin'}-st-${idx}`} className={`min-h-[52px] flex flex-col justify-center ${idx > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-800' : ''}`}>
                            <span className={`font-bold ${stockFila <= 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{stockFila}</span>
                            <span className="ml-1 text-[10px] text-gray-500">{producto.unidad_abreviatura || producto.unidad_medida || ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Td>
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
                    <Boton
                      tamano="sm"
                      variante="peligro"
                      icono="papelera"
                      disabled={Boolean(motivoNoEliminarProducto)}
                      title={motivoNoEliminarProducto}
                      onClick={() => eliminar(producto)}
                    >
                      Eliminar
                    </Boton>
                  </Acciones>
                </Td>
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

      {presentacionEditar && (
        <ModalPresentacion
          producto={presentacionEditar.producto}
          fila={presentacionEditar.fila}
          almacen={presentacionEditar.almacen}
          colores={colores}
          tallas={tallas}
          onClose={() => setPresentacionEditar(null)}
          onGuardado={onGuardadoPresentacion}
        />
      )}
    </div>
  );
};

export default CrudProductos;
