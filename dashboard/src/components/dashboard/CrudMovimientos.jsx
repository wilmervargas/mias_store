import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Select } from '../ui/Campo';
import { Tabla, Td, Th } from '../ui/Tabla';

const COLOR_TIPO = {
  entrada: 'bg-emerald-500/10 text-emerald-400',
  compra: 'bg-emerald-500/10 text-emerald-400',
  devolucion: 'bg-cyan-500/10 text-cyan-400',
  salida: 'bg-rose-500/10 text-rose-400',
  venta: 'bg-rose-500/10 text-rose-400',
  ajuste: 'bg-amber-500/10 text-amber-400',
  transferencia: 'bg-blue-500/10 text-blue-400',
  migracion: 'bg-purple-500/10 text-purple-400',
};

const FILTROS_VACIOS = {
  q: '',
  producto: '',
  tipo: '',
  almacen: '',
  desde: '',
  hasta: '',
};

const CrudMovimientos = () => {
  const toast = useToast();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const qDebounced = useDebounce(filtros.q);

  useEffect(() => {
    api.get('productos', 'todos=1').then((r) => setProductos(r.datos || []));
    api.get('almacenes').then((r) => setAlmacenes(r.datos || []));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ limite: '300' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.producto) params.append('producto', filtros.producto);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.almacen) params.append('almacen', filtros.almacen);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);

    const res = await api.get('inventario/movimientos', params.toString());
    if (res.success) {
      setMovimientos(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar los movimientos');
    }
    setCargando(false);
  }, [qDebounced, filtros.producto, filtros.tipo, filtros.almacen, filtros.desde, filtros.hasta, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const limpiar = () => setFiltros(FILTROS_VACIOS);
  const hayFiltros = Object.values(filtros).some((v) => v !== '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Movimientos de inventario</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Auditoría completa de entradas, salidas y ajustes</p>
        </div>
        <Boton variante="info" icono="refrescar" onClick={cargar} cargando={cargando}>
          Actualizar
        </Boton>
      </div>

      <BarraFiltros
        total={movimientos.length}
        etiqueta="movimientos"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar producto, SKU, referencia o motivo..."
          className="col-span-2 md:w-64"
        />
        <Select
          value={filtros.producto}
          onChange={(e) => setFiltros({ ...filtros, producto: e.target.value })}
          className="md:w-56"
        >
          <option value="">Todos los productos</option>
          {productos.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.sku_base} · {p.nombre}</option>)}
        </Select>
        <Select
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          className="md:w-40"
        >
          <option value="">Todos los tipos</option>
          {['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion', 'venta', 'compra', 'migracion'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select
          value={filtros.almacen}
          onChange={(e) => setFiltros({ ...filtros, almacen: e.target.value })}
          className="md:w-44"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
        </Select>
        <input
          type="date"
          value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          aria-label="Desde"
          className="px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/60"
        />
        <input
          type="date"
          value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          aria-label="Hasta"
          className="px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/60"
        />
      </BarraFiltros>

      <Tabla
        colSpan={9}
        cargando={cargando}
        vacio={movimientos.length === 0}
        textoVacio="Sin movimientos para los filtros seleccionados."
        cabecera={
          <>
            <Th>ID</Th>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th>Producto</Th>
            <Th>Origen</Th>
            <Th>Destino</Th>
            <Th align="right">Cantidad</Th>
            <Th align="right">Costo u.</Th>
            <Th>Referencia</Th>
          </>
        }
      >
        {movimientos.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            <Td className="font-mono text-gray-500">#{m.id}</Td>
            <Td className="text-gray-400 text-[10px] whitespace-nowrap">{m.created_at}</Td>
            <Td>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COLOR_TIPO[m.tipo] || 'bg-gray-700 text-gray-300'}`}>
                {m.tipo}
              </span>
            </Td>
            <Td className="max-w-xs">
              <span className="block font-bold text-gray-900 dark:text-white truncate">{m.producto}</span>
              <span className="block font-mono text-[10px] text-cyan-400">{m.sku_base}</span>
            </Td>
            <Td className="text-[10px] text-gray-400">
              {m.almacen_origen ? `${m.almacen_origen}${m.ubicacion_origen ? ' / ' + m.ubicacion_origen : ''}` : '—'}
            </Td>
            <Td className="text-[10px] text-gray-400">
              {m.almacen_destino ? `${m.almacen_destino}${m.ubicacion_destino ? ' / ' + m.ubicacion_destino : ''}` : '—'}
            </Td>
            <Td align="right" className="font-bold text-gray-900 dark:text-white">{m.cantidad}</Td>
            <Td align="right" className="text-amber-400 font-mono">
              {m.costo_unitario !== null ? '$ ' + Number(m.costo_unitario).toFixed(2) : '—'}
            </Td>
            <Td className="text-gray-400 text-[10px]">
              {m.referencia || '—'}
              {m.motivo && <span className="block text-gray-600">{m.motivo}</span>}
            </Td>
          </tr>
        ))}
      </Tabla>
    </div>
  );
};

export default CrudMovimientos;
