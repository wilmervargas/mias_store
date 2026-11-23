import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

const formatoMoneda = (valor, moneda = 'USD') => new Intl.NumberFormat(
  moneda === 'VES' ? 'es-VE' : 'en-US',
  { style: 'currency', currency: moneda, minimumFractionDigits: 2 }
).format(Number(valor || 0));

const formatoFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-VE');
};

const clasesEstado = {
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pagado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  enviado: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  entregado: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cancelado: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const TablaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await api.get('pedidos');
      if (res.success || res.exito) {
        setPedidos(res.datos || []);
      } else {
        setError(res.error || res.mensaje || 'No se pudieron cargar los pedidos.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const coincideTexto = !texto || (
        `${pedido.id} ${pedido.cliente_nombre} ${pedido.cliente_email} ${pedido.numero_referencia}`
          .toLowerCase()
          .includes(texto)
      );
      const coincideEstado = estadoFiltro === 'todos' || pedido.estado === estadoFiltro;
      return coincideTexto && coincideEstado;
    });
  }, [pedidos, busqueda, estadoFiltro]);

  const ingresos = pedidos.reduce((total, pedido) => total + Number(pedido.total), 0);
  const pagados = pedidos.filter((pedido) => pedido.estado === 'pagado').length;
  const pendientes = pedidos.filter((pedido) => pedido.estado === 'pendiente').length;

  const verDetalle = async (pedidoId) => {
    setCargandoDetalle(pedidoId);
    try {
      const res = await api.get('pedidos', `id=${pedidoId}`);
      if (res.success || res.exito) {
        setDetalle(res.datos);
      } else {
        alert(res.error || res.mensaje || 'No se pudo cargar el pedido.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCargandoDetalle(null);
    }
  };

  if (cargando) {
    return <p className="text-slate-400 text-xs">Cargando pedidos...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pedidos totales</span>
          <span className="text-2xl font-black text-cyan-400">{pedidos.length}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ingresos</span>
          <span className="text-2xl font-black text-emerald-400">{formatoMoneda(ingresos)}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pagados</span>
          <span className="text-2xl font-black text-blue-400">{pagados}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pendientes</span>
          <span className="text-2xl font-black text-amber-400">{pendientes}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <input
          type="text"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por pedido, cliente, correo o referencia..."
          className="w-full lg:max-w-md px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button
            type="button"
            onClick={cargar}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            🔄 Actualizar pedidos
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">Pedido</th>
              <th className="p-3.5">Cliente</th>
              <th className="p-3.5">Fecha</th>
              <th className="p-3.5 text-center">Items</th>
              <th className="p-3.5 text-right">Total USD</th>
              <th className="p-3.5 text-right">Total Bs</th>
              <th className="p-3.5">Pago</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtrados.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-400">#{pedido.id}</td>
                <td className="p-3.5">
                  <span className="font-bold text-white block">{pedido.cliente_nombre}</span>
                  <span className="text-[10px] text-slate-500">{pedido.cliente_email}</span>
                </td>
                <td className="p-3.5 text-slate-400">{formatoFecha(pedido.fecha_pedido)}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                    {pedido.items_count} líneas • {pedido.unidades} u.
                  </span>
                </td>
                <td className="p-3.5 text-right font-bold text-emerald-400">
                  {formatoMoneda(pedido.total)}
                </td>
                <td className="p-3.5 text-right font-bold text-amber-400">
                  {formatoMoneda(Number(pedido.total) * Number(pedido.tasa_dolar_usada), 'VES')}
                </td>
                <td className="p-3.5">
                  <span className="text-slate-300 block">{pedido.metodo_pago}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{pedido.numero_referencia}</span>
                </td>
                <td className="p-3.5">
                  <span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${
                    clasesEstado[pedido.estado] || 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {pedido.estado}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => verDetalle(pedido.id)}
                    disabled={cargandoDetalle === pedido.id}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    {cargandoDetalle === pedido.id ? 'Cargando...' : '👁️ Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  No hay pedidos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Detalle del pedido
                </span>
                <h3 className="text-xl font-black text-white">Pedido #{detalle.id}</h3>
                <p className="text-xs text-slate-500 mt-1">{formatoFecha(detalle.fecha_pedido)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Cliente</span>
                <span className="text-white font-bold block">{detalle.cliente_nombre}</span>
                <span className="text-slate-400">{detalle.cliente_email}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Entrega</span>
                <span className="text-slate-300">{detalle.direccion_envio}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Pago</span>
                <span className="text-slate-300 block">{detalle.metodo_pago}</span>
                <span className="text-slate-500 font-mono text-[10px]">{detalle.numero_referencia}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Tasa aplicada</span>
                <span className="text-amber-400 font-bold">{formatoMoneda(detalle.tasa_dolar_usada, 'VES')} / USD</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3 text-right">Precio unit.</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(detalle.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 text-white font-bold">{item.producto_nombre}</td>
                      <td className="p-3 text-center text-slate-300">{item.cantidad}</td>
                      <td className="p-3 text-right text-slate-400">{formatoMoneda(item.precio_unitario)}</td>
                      <td className="p-3 text-right text-emerald-400 font-bold">
                        {formatoMoneda(Number(item.precio_unitario) * Number(item.cantidad))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/50 border border-slate-800">
              <span className="text-xs text-slate-400">Total del pedido</span>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400 block">{formatoMoneda(detalle.total)}</span>
                <span className="text-[10px] text-amber-400">
                  {formatoMoneda(Number(detalle.total) * Number(detalle.tasa_dolar_usada), 'VES')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaPedidos;
