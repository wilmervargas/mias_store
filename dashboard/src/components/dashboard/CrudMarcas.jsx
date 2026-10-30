import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CrudMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [marcaEditar, setMarcaEditar] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = async () => {
    const res = await api.get('marcas', 'todos=1');
    setMarcas(res.datos || []);
  };

  useEffect(() => { cargar(); }, []);

  const handleEliminar = async (id) => {
    if (confirm(`¿Desactivar la marca #${id}?`)) {
      await api.delete('marcas', id);
      cargar();
    }
  };

  const handleReactivar = async (id) => {
    const res = await api.put('marcas', id, { idestatus: 1 });
    if (!res.success) alert(res.error || 'No se pudo reactivar la marca');
    cargar();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = marcaEditar
      ? await api.put('marcas', marcaEditar.id, { nombre })
      : await api.post('marcas', { nombre });
    if (!res.success) {
      alert(res.error || 'No se pudo guardar la marca');
      return;
    }
    setModalAbierto(false);
    setNombre('');
    cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setMarcaEditar(null); setNombre(''); setModalAbierto(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
        >
          ➕ Nueva Marca
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Nombre Comercial</th>
              <th className="p-3.5">Modelos Asociados</th>
              <th className="p-3.5">Estatus</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {marcas.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-500">#{m.id}</td>
                <td className="p-3.5 font-bold text-white text-sm">{m.nombre}</td>
                <td className="p-3.5 text-blue-400 font-bold">{m.total_productos || 0} modelos</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    Number(m.idestatus) === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {Number(m.idestatus) === 1 ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => { setMarcaEditar(m); setNombre(m.nombre); setModalAbierto(true); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                  >
                    ✏️ Editar
                  </button>
                  {Number(m.idestatus) === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleEliminar(m.id)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🗑️ Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivar(m.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">{marcaEditar ? 'Editar Marca' : 'Nueva Marca'}</h3>
            <input
              type="text"
              required
              placeholder="Nombre de la Marca"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-3 py-1.5 bg-slate-800 text-xs rounded-xl text-slate-300">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CrudMarcas;
