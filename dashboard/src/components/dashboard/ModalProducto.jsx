import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import DropzoneImagen from './DropzoneImagen';

const ModalProducto = ({ productoEditar, onClose, onGuardado }) => {
  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || '',
    descripcion: productoEditar?.descripcion || '',
    precio: productoEditar?.precio || '',
    preciofull: productoEditar?.preciofull || '',
    costo: productoEditar?.costo || '',
    stock: productoEditar?.stock ?? '',
    idcategoria: productoEditar?.idcategoria || '',
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || '',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    // Conservamos el estatus actual: editar un inactivo NO lo reactiva
    idestatus: productoEditar?.idestatus ?? 1,
  });

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [colores, setColores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [variantes, setVariantes] = useState([]);
  const [nuevaVariante, setNuevaVariante] = useState({
    talla_id: '', color_id: '', modelo_id: '', clave_variante: '', stock_inicial: '',
  });
  const [guardandoVariante, setGuardandoVariante] = useState(false);

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('categorias').then((res) => setCategorias(res.datos || []));
    api.get('marcas').then((res) => setMarcas(res.datos || []));
    api.get('modelos').then((res) => setModelos(res.datos || []));
    api.get('tallas').then((res) => setTallas((res.datos || []).filter((t) => Number(t.idestatus) === 1)));
    api.get('colores').then((res) => setColores((res.datos || []).filter((c) => Number(c.idestatus) === 1)));
    api.get('almacenes').then((res) => setAlmacenes((res.datos || []).filter((a) => Number(a.idestatus) === 1)));
  }, []);

  useEffect(() => {
    if (!formData.idmarca) {
      setUbicaciones([]);
      return;
    }
  }, [formData.idmarca]);

  const cargarVariantes = () => {
    if (!productoEditar?.id) return;
    api.get(`productos/${productoEditar.id}`).then((res) => {
      setVariantes(res.datos?.variantes || []);
    });
  };

  useEffect(() => {
    cargarVariantes();
  }, [productoEditar?.id]);

  const cargarUbicaciones = async (almacenId) => {
    if (!almacenId) {
      setUbicaciones([]);
      return;
    }
    const res = await api.get('ubicaciones', `almacen_id=${almacenId}`);
    setUbicaciones((res.datos || []).filter((u) => Number(u.idestatus) === 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const res = productoEditar?.id
      ? await api.put('productos', productoEditar.id, formData)
      : await api.post('productos', formData);

    if (!res.success) {
      setGuardando(false);
      alert(res.error || (res.errores || []).join('\n') || 'Ocurrió un error al guardar');
      return;
    }

    // Segundo paso: subir la imagen si el usuario eligió una
    const idFinal = productoEditar?.id || res.datos?.id;
    if (archivoImagen && idFinal) {
      const subida = await api.subirImagen('productos', idFinal, archivoImagen);
      if (!subida.success) {
        alert(subida.error || 'El producto se guardó, pero la imagen no se pudo subir');
      }
    }

    setGuardando(false);
    onGuardado();
  };

  const handleAgregarVariante = async () => {
    if (!productoEditar?.id) {
      alert('Guarda el producto primero para poder agregar variantes.');
      return;
    }
    if (!nuevaVariante.talla_id && !nuevaVariante.color_id && !nuevaVariante.modelo_id && !nuevaVariante.clave_variante) {
      alert('Indica al menos talla, color, modelo o clave para diferenciar la variante.');
      return;
    }

    setGuardandoVariante(true);

    const res = await api.post(`productos/${productoEditar.id}/variantes`, {
      talla_id: nuevaVariante.talla_id || null,
      color_id: nuevaVariante.color_id || null,
      modelo_id: nuevaVariante.modelo_id || null,
      clave_variante: nuevaVariante.clave_variante || '',
      stock_minimo: 5,
    });

    if (!res.success) {
      setGuardandoVariante(false);
      alert(res.error || 'No se pudo crear la variante');
      return;
    }

    const varianteId = res.datos?.id;
    const stockInicial = Number(nuevaVariante.stock_inicial || 0);

    if (varianteId && stockInicial > 0) {
      const inv = await api.get('inventario', `variante_id=${varianteId}`);
      const ubicacionId = inv.datos?.[0]?.ubicacion_id;

      if (ubicacionId) {
        const mov = await api.post('inventario/movimientos', {
          variante_id: varianteId,
          ubicacion_id: ubicacionId,
          tipo: 'entrada',
          cantidad: stockInicial,
          motivo: 'Stock inicial de la variante',
        });
        if (!mov.success) {
          alert(mov.error || 'La variante se creó, pero no se pudo cargar el stock inicial');
        }
      }
    }

    setNuevaVariante({ talla_id: '', color_id: '', modelo_id: '', clave_variante: '', stock_inicial: '' });
    setGuardandoVariante(false);
    cargarVariantes();
  };

  const modelosFiltrados = modelos.filter(
    (m) => !formData.idmarca || !m.idmarca || Number(m.idmarca) === Number(formData.idmarca)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-black text-white mb-4">
          {productoEditar ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Descripción</label>
            <textarea
              rows={2}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Costo ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Precio lista ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preciofull}
                onChange={(e) => setFormData({ ...formData, preciofull: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                {productoEditar ? 'Stock (ajuste)' : 'Stock inicial'}
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Categoría</label>
              <select
                required
                value={formData.idcategoria}
                onChange={(e) => setFormData({ ...formData, idcategoria: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="">Selecciona...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Marca</label>
              <select
                required
                value={formData.idmarca}
                onChange={(e) => setFormData({ ...formData, idmarca: e.target.value, idmodelo: '' })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="">Selecciona...</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Modelo</label>
              <select
                value={formData.idmodelo}
                onChange={(e) => setFormData({ ...formData, idmodelo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="">Sin modelo</option>
                {modelosFiltrados.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            {!productoEditar && (
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Almacén inicial</label>
                <select
                  value={formData.almacen_id || ''}
                  onChange={(e) => {
                    const almacenId = e.target.value;
                    setFormData({ ...formData, almacen_id: almacenId, ubicacion_id: '' });
                    cargarUbicaciones(almacenId);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="">Almacén principal (por defecto)</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!productoEditar && ubicaciones.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Ubicación inicial</label>
              <select
                value={formData.ubicacion_id || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="">Primera ubicación del almacén</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo}{u.pasillo ? ` · Pasillo ${u.pasillo}` : ''}{u.estante ? ` · Estante ${u.estante}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Imagen del producto</label>
            <DropzoneImagen
              imagenActual={productoEditar?.imagen}
              onArchivo={(file) => setArchivoImagen(file)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md"
            >
              {guardando ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>

        {/* Variantes existentes */}
        {productoEditar?.id && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <h4 className="text-sm font-black text-white mb-3">Variantes (talla / color / modelo)</h4>

            <div className="space-y-2 mb-4">
              {variantes.length === 0 && (
                <p className="text-[11px] text-slate-500">Sin variantes registradas.</p>
              )}
              {variantes.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <div>
                    <span className="font-mono text-[11px] text-rose-400">{v.sku}</span>
                    <span className="text-[11px] text-slate-300 ml-2">
                      {[v.talla, v.color, v.modelo, v.clave_variante].filter(Boolean).join(' · ') || 'Base'}
                    </span>
                    {Number(v.es_base) === 1 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[9px] font-bold">
                        BASE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className={Number(v.stock_disponible) < 5 ? 'text-rose-400' : 'text-emerald-400'}>
                      Stock: {v.stock_disponible}
                    </span>
                    <span className={Number(v.idestatus) === 1 ? 'text-emerald-400' : 'text-slate-500'}>
                      {Number(v.idestatus) === 1 ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-slate-400 block">Agregar variante</span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={nuevaVariante.talla_id}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, talla_id: e.target.value })}
                  className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white"
                >
                  <option value="">Talla</option>
                  {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>

                <select
                  value={nuevaVariante.color_id}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, color_id: e.target.value })}
                  className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white"
                >
                  <option value="">Color</option>
                  {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>

                <select
                  value={nuevaVariante.modelo_id}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, modelo_id: e.target.value })}
                  className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white"
                >
                  <option value="">Modelo</option>
                  {modelosFiltrados.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="Stock inicial"
                  value={nuevaVariante.stock_inicial}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, stock_inicial: e.target.value })}
                  className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Clave / referencia de la variante (opcional)"
                  value={nuevaVariante.clave_variante}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, clave_variante: e.target.value })}
                  className="flex-1 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white"
                />
                <button
                  type="button"
                  onClick={handleAgregarVariante}
                  disabled={guardandoVariante}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-[11px] font-bold whitespace-nowrap"
                >
                  {guardandoVariante ? 'Agregando...' : '➕ Variante'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalProducto;
