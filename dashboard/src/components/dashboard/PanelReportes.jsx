import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const PanelReportes = () => {
  const [resumen, setResumen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [criticos, setCriticos] = useState([]);
  const [umbral, setUmbral] = useState(10);

  const cargar = async (u = umbral) => {
    const r1 = await api.get('reportes/resumen');
    if (r1.success) {
      setResumen(r1.datos.resumen);
      setCategorias(r1.datos.categorias || []);
    }
    const r2 = await api.get('reportes/stock-critico', `umbral=${u}`);
    if (r2.success) setCriticos(r2.datos || []);
  };

  useEffect(() => { cargar(); }, []);

  if (!resumen) return <p className="text-slate-400 text-xs">Cargando reportes...</p>;

  const kpis = [
    { label: 'Productos activos', valor: resumen.total_productos, color: 'text-cyan-400' },
    { label: 'Unidades en stock', valor: Number(resumen.total_unidades || 0).toLocaleString('es-VE'), color: 'text-emerald-400' },
    { label: 'Valor a costo', valor: '$ ' + Number(resumen.valor_costo || 0).toLocaleString('es-VE'), color: 'text-sky-400' },
    { label: 'Valor a venta', valor: '$ ' + Number(resumen.valor_inventario || 0).toLocaleString('es-VE'), color: 'text-amber-400' },
    { label: 'Stock crítico (<10)', valor: resumen.criticos, color: 'text-rose-400' },
    { label: 'Agotados', valor: resumen.agotados, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{k.label}</span>
            <span className={`text-2xl font-black ${k.color}`}>{k.valor}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-300">Umbral de stock crítico:</span>
        <input
          type="number"
          value={umbral}
          onChange={(e) => setUmbral(Number(e.target.value))}
          className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        />
        <button
          type="button"
          onClick={() => cargar(umbral)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
        >
          📊 Regenerar reporte
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <h3 className="p-4 text-sm font-bold text-white border-b border-slate-800">⚠️ Reposición urgente (stock &lt; {umbral})</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Producto</th>
              <th className="p-3.5">Categoría</th>
              <th className="p-3.5">Marca</th>
              <th className="p-3.5 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {criticos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-500">#{p.id}</td>
                <td className="p-3.5 font-bold text-white">{p.nombre}</td>
                <td className="p-3.5 text-slate-400">{p.categoria}</td>
                <td className="p-3.5 text-slate-400">{p.marca}</td>
                <td className="p-3.5 text-right font-bold text-rose-400">{p.stock} u.</td>
              </tr>
            ))}
            {criticos.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No hay productos críticos con este umbral.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <h3 className="p-4 text-sm font-bold text-white border-b border-slate-800">💵 Valor del inventario por categoría</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Categoría</th>
              <th className="p-3.5">Productos</th>
              <th className="p-3.5 text-right">Unidades</th>
              <th className="p-3.5 text-right">Costo</th>
              <th className="p-3.5 text-right">Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {categorias.map((c) => (
              <tr key={c.categoria} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-white">{c.categoria}</td>
                <td className="p-3.5 text-slate-400">{c.productos}</td>
                <td className="p-3.5 text-right text-slate-300">{Number(c.unidades || 0).toLocaleString('es-VE')}</td>
                <td className="p-3.5 text-right text-sky-400">$ {Number(c.valor_costo || 0).toLocaleString('es-VE')}</td>
                <td className="p-3.5 text-right font-bold text-amber-400">$ {Number(c.valor || 0).toLocaleString('es-VE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PanelReportes;
