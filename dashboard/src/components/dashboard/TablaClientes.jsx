import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

const formatoMoneda = (valor) => `$ ${Number(valor || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatoFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-VE');
};

const TablaClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await api.get('clientes');
      if (res.success || res.exito) {
        setClientes(res.datos || []);
      } else {
        setError(res.error || res.mensaje || 'No se pudieron cargar los clientes.');
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
    if (!texto) return clientes;

    return clientes.filter((cliente) => (
      `${cliente.nombre} ${cliente.email} ${cliente.telefono} ${cliente.direccion}`
        .toLowerCase()
        .includes(texto)
    ));
  }, [clientes, busqueda]);

  const conPedidos = clientes.filter((cliente) => Number(cliente.total_pedidos) > 0).length;
  const totalGastado = clientes.reduce((total, cliente) => total + Number(cliente.total_gastado), 0);

  if (cargando) {
    return <p className="text-slate-400 text-xs">Cargando clientes...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Clientes registrados</span>
          <span className="text-2xl font-black text-cyan-400">{clientes.length}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Clientes con compras</span>
          <span className="text-2xl font-black text-emerald-400">{conPedidos}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Facturación acumulada</span>
          <span className="text-2xl font-black text-amber-400">{formatoMoneda(totalGastado)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <input
          type="text"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre, correo, teléfono o dirección..."
          className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
        />
        <button
          type="button"
          onClick={cargar}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          🔄 Actualizar clientes
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Cliente</th>
              <th className="p-3.5">Correo</th>
              <th className="p-3.5">Teléfono</th>
              <th className="p-3.5">Dirección</th>
              <th className="p-3.5 text-center">Pedidos</th>
              <th className="p-3.5 text-right">Total gastado</th>
              <th className="p-3.5">Última compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtrados.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-500">#{cliente.id}</td>
                <td className="p-3.5 font-bold text-white">{cliente.nombre}</td>
                <td className="p-3.5 text-cyan-300">{cliente.email}</td>
                <td className="p-3.5 text-slate-400">{cliente.telefono || '—'}</td>
                <td className="p-3.5 text-slate-400 max-w-[240px] truncate" title={cliente.direccion || ''}>
                  {cliente.direccion || '—'}
                </td>
                <td className="p-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    Number(cliente.total_pedidos) > 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {cliente.total_pedidos}
                  </span>
                </td>
                <td className="p-3.5 text-right font-bold text-amber-400">
                  {formatoMoneda(cliente.total_gastado)}
                </td>
                <td className="p-3.5 text-slate-400">{formatoFecha(cliente.ultima_compra)}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaClientes;
