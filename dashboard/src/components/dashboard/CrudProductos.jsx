import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ModalProducto from './ModalProducto';

const CrudProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const [filtros, setFiltros] = useState({
    q: '', idcategoria: '', idmarca: '', precioMin: '', precioMax: '', stockMin: '',
  });

  // Construye el query string solo con los filtros con valor
  const buildParams = () => {
    const p = new URLSearchParams({ todos: '1' });
    Object.entries(filtros).forEach(([k, v]) => { if (v !== '') p.append(k, v); });
    return p.toString();
  };

  const cargarProductos = async () => {
    setCargando(true);
    const res = await api.get('productos', buildParams());
    setProductos(res.datos || []);
    setCargando(false);
  };

  useEffect(() => { cargarProductos(); }, [filtros]);

  useEffect(() => {
    api.get('categorias').then((r) => setCategorias(r.datos || []));
    api.get('marcas').then((r) => setMarcas(r.datos || []));
  }, []);

  const handleEliminar = async (id) => {
    if (confirm(`¿Desactivar el producto #${id}?`)) {
      await api.delete('productos', id);
      cargarProductos();
    }
  };

  const handleReactivar = async (id) => {
    const res = await api.put('productos', id, { idestatus: 1 });
    if (!res.success) alert(res.error || 'No se pudo reactivar el producto');
    cargarProductos();
  };

  const limpiarFiltros = () =>
    setFiltros({ q: '', idcategoria: '', idmarca: '', precioMin: '', precioMax: '', stockMin: '' });

  return (
    <div className="space-y-4">
      {/* Barra de filtros avanzados */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <input
          placeholder="Buscar por nombre..."
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
          className="col-span-2 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        />
        <select
          value={filtros.idcategoria}
          onChange={(e) => setFiltros({ ...filtros, idcategoria: e.target.value })}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        >
          <option value="">Categoría</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          value={filtros.idmarca}
          onChange={(e) => setFiltros({ ...filtros, idmarca: e.target.value })}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        >
          <option value="">Marca</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input
          type="number"
          placeholder="Precio min"
          value={filtros.precioMin}
          onChange={(e) => setFiltros({ ...filtros, precioMin: e.target.value })}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        />
        <input
          type="number"
          placeholder="Stock min"
          value={filtros.stockMin}
          onChange={(e) => setFiltros({ ...filtros, stockMin: e.target.value })}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={limpiarFiltros}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => { setProductoEditar(null); setModalAbierto(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <span>➕</span> Nuevo Producto
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">Img</th>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Nombre</th>
              <th className="p-3.5">Categoría</th>
              <th className="p-3.5">Marca</th>
              <th className="p-3.5">Costo</th>
              <th className="p-3.5">Precio</th>
              <th className="p-3.5">Margen</th>
              <th className="p-3.5">Stock</th>
              <th className="p-3.5">Variantes / SKU</th>
              <th className="p-3.5">Estatus</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cargando && (
              <tr><td colSpan={12} className="p-6 text-center text-slate-500">Cargando...</td></tr>
            )}
            {!cargando && productos.length === 0 && (
              <tr><td colSpan={12} className="p-6 text-center text-slate-500">Sin resultados.</td></tr>
            )}
            {productos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="p-2">
                  <img
                    src={`http://localhost:8000/imagenes/${p.imagen}`}
                    alt={p.nombre}
                    className="w-10 h-10 rounded-lg object-contain bg-slate-950 border border-slate-800"
                  />
                </td>
                <td className="p-3.5 font-mono text-slate-500">#{p.id}</td>
                <td className="p-3.5 font-bold text-white max-w-xs truncate">{p.nombre}</td>
                <td className="p-3.5 text-slate-400">{p.categoria || 'N/A'}</td>
                <td className="p-3.5 text-blue-400">{p.marca || 'N/A'}</td>
                <td className="p-3.5 font-mono text-slate-300">$ {Number(p.costo || 0).toFixed(2)}</td>
                <td className="p-3.5 font-bold text-white">$ {Number(p.precio || 0).toFixed(2)}</td>
                <td className="p-3.5">
                  {(() => {
                    const precio = Number(p.precio || 0);
                    const costo = Number(p.costo || 0);
                    if (precio <= 0) return <span className="text-slate-500">—</span>;
                    const margen = ((precio - costo) / precio) * 100;
                    return (
                      <span className={`font-bold ${margen < 0 ? 'text-rose-400' : margen < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {margen.toFixed(1)}%
                      </span>
                    );
                  })()}
                </td>
                <td className="p-3.5">
                  <span className={`font-bold ${Number(p.stock) < 10 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {p.stock}
                  </span>
                  {Number(p.stock) < 10 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400">
                      ⚠️ Bajo
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-300">
                    {p.variantes || 0} {Number(p.variantes) === 1 ? 'variante' : 'variantes'}
                  </span>
                  <span className="block font-mono text-[10px] text-slate-500 mt-1 max-w-[190px] truncate" title={p.skus || ''}>
                    {p.skus ? String(p.skus).split(',').join(' · ') : 'Sin SKU'}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    Number(p.idestatus) === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {Number(p.idestatus) === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => { setProductoEditar(p); setModalAbierto(true); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                  >
                    ✏️ Editar
                  </button>
                  {Number(p.idestatus) === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleEliminar(p.id)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🗑️ Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivar(p.id)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🔄 Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalProducto
          productoEditar={productoEditar}
          onClose={() => setModalAbierto(false)}
          onGuardado={() => { cargarProductos(); setModalAbierto(false); }}
        />
      )}
    </div>
  );
};

export default CrudProductos;
