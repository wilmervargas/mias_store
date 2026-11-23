import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import DropzoneImagen from './DropzoneImagen';
<<<<<<< HEAD
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { Campo, Input, Select, TextArea } from '../ui/Campo';

const ModalProducto = ({ productoEditar, onClose, onGuardado }) => {
  const editando = Boolean(productoEditar?.id);

=======

const ModalProducto = ({ productoEditar, onClose, onGuardado }) => {
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || '',
    descripcion: productoEditar?.descripcion || '',
    precio: productoEditar?.precio || '',
    preciofull: productoEditar?.preciofull || '',
<<<<<<< HEAD
    costo: productoEditar?.costo ?? '',
    sku_base: productoEditar?.sku_base || '',
    codigo_barras: productoEditar?.codigo_barras || '',
    idcategoria: productoEditar?.idcategoria || '',
    idsubcategoria: productoEditar?.idsubcategoria || 1,
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || 1,
    idcolor: productoEditar?.idcolor || 1,
    idtalla: productoEditar?.idtalla || 1,
    producto_base_id: productoEditar?.producto_base_id || '',
    unidad_medida: productoEditar?.unidad_medida || 'UND',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    idestatus: productoEditar?.idestatus ?? 1,
    stock: productoEditar?.stock ?? '',
    stock_inicial: '',
    almacen_id: productoEditar?.stock_por_almacen?.[0]?.almacen_id || '',
    ubicacion_id: '',
=======
    costo: productoEditar?.costo || '',
    stock: productoEditar?.stock ?? '',
    idcategoria: productoEditar?.idcategoria || '',
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || '',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    // Conservamos el estatus actual: editar un inactivo NO lo reactiva
    idestatus: productoEditar?.idestatus ?? 1,
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
  });

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
<<<<<<< HEAD
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
=======
  const [tallas, setTallas] = useState([]);
  const [colores, setColores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [variantes, setVariantes] = useState([]);
  const [nuevaVariante, setNuevaVariante] = useState({
    talla_id: '', color_id: '', modelo_id: '', clave_variante: '', stock_inicial: '',
  });
  const [guardandoVariante, setGuardandoVariante] = useState(false);

>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('categorias').then((res) => setCategorias(res.datos || []));
    api.get('marcas').then((res) => setMarcas(res.datos || []));
    api.get('modelos').then((res) => setModelos(res.datos || []));
<<<<<<< HEAD
    api.get('colores').then((res) => setColores(res.datos || []));
    api.get('tallas').then((res) => setTallas(res.datos || []));
    api.get('almacenes').then((res) => {
      const lista = res.datos || [];
      setAlmacenes(lista);
      if (!productoEditar?.stock_por_almacen?.length && lista.length > 0) {
        setFormData((prev) => ({ ...prev, almacen_id: prev.almacen_id || lista[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    if (!formData.almacen_id) {
      setUbicaciones([]);
      return;
    }
    api.get('ubicaciones', `almacen=${formData.almacen_id}`).then((res) => setUbicaciones(res.datos || []));
  }, [formData.almacen_id]);

  const set = (campo, valor) => setFormData((prev) => ({ ...prev, [campo]: valor }));
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

<<<<<<< HEAD
    const payload = { ...formData };
    if (!payload.producto_base_id) delete payload.producto_base_id;
    if (!payload.ubicacion_id) delete payload.ubicacion_id;
    if (editando) {
      delete payload.stock_inicial;
    } else {
      delete payload.stock;
    }

    const res = editando
      ? await api.put('productos', productoEditar.id, payload)
      : await api.post('productos', payload);
=======
    const res = productoEditar?.id
      ? await api.put('productos', productoEditar.id, formData)
      : await api.post('productos', formData);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

    if (!res.success) {
      setGuardando(false);
      alert(res.error || (res.errores || []).join('\n') || 'Ocurrió un error al guardar');
      return;
    }

<<<<<<< HEAD
=======
    // Segundo paso: subir la imagen si el usuario eligió una
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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

<<<<<<< HEAD
  return (
    <Modal
      titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={editando ? `SKU base: ${productoEditar?.sku_base}` : 'Registra un nuevo SKU/variante en el catálogo'}
      icono="producto"
      tono="neutral"
      onClose={onClose}
      maxW="max-w-4xl"
      footer={
        <>
          <Boton variante="neutral" onClick={onClose}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-producto" variante="primario" icono="guardar" cargando={guardando}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </Boton>
        </>
      }
    >
      <form id="form-producto" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Nombre del producto" required className="md:col-span-2">
            <Input
              required
              value={formData.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre comercial de la variante"
            />
          </Campo>
          <Campo label="SKU base" hint="Se genera automáticamente si se deja vacío">
            <Input
              value={formData.sku_base}
              onChange={(e) => set('sku_base', e.target.value)}
              placeholder="P-00001"
              className="font-mono"
            />
          </Campo>
        </div>

        <Campo label="Descripción">
          <TextArea
            rows={2}
            value={formData.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Descripción breve para el inventario"
          />
        </Campo>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Campo label="Costo ($)">
            <Input type="number" step="0.01" min="0" value={formData.costo} onChange={(e) => set('costo', e.target.value)} />
          </Campo>
          <Campo label="Precio ($)" required>
            <Input type="number" step="0.01" required value={formData.precio} onChange={(e) => set('precio', e.target.value)} />
          </Campo>
          <Campo label="Precio full ($)">
            <Input type="number" step="0.01" value={formData.preciofull} onChange={(e) => set('preciofull', e.target.value)} />
          </Campo>
          <Campo label="Código de barras">
            <Input value={formData.codigo_barras} onChange={(e) => set('codigo_barras', e.target.value)} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Campo label="Categoría" required>
            <Select required value={formData.idcategoria} onChange={(e) => set('idcategoria', e.target.value)}>
              <option value="">Selecciona...</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Marca" required>
            <Select required value={formData.idmarca} onChange={(e) => set('idmarca', e.target.value)}>
              <option value="">Selecciona...</option>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Modelo">
            <Select value={formData.idmodelo} onChange={(e) => set('idmodelo', e.target.value)}>
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Color">
            <Select value={formData.idcolor} onChange={(e) => set('idcolor', e.target.value)}>
              {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Talla">
            <Select value={formData.idtalla} onChange={(e) => set('idtalla', e.target.value)}>
              {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Unidad de medida">
            <Input value={formData.unidad_medida} onChange={(e) => set('unidad_medida', e.target.value)} />
          </Campo>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Agrupar con (ID producto base)" hint="Opcional: mismo artículo en otro color/talla">
            <Input type="number" min="1" value={formData.producto_base_id} onChange={(e) => set('producto_base_id', e.target.value)} placeholder="ID del producto base" />
          </Campo>
          <Campo label="Imagen del producto">
            <DropzoneImagen imagenActual={productoEditar?.imagen} onArchivo={(file) => setArchivoImagen(file)} />
          </Campo>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Icono nombre="inventario" className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Inventario</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo label="Almacén">
              <Select value={formData.almacen_id} onChange={(e) => { set('almacen_id', e.target.value); set('ubicacion_id', ''); }}>
                <option value="">Selecciona...</option>
                {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
              </Select>
            </Campo>
            <Campo label="Ubicación">
              <Select value={formData.ubicacion_id} onChange={(e) => set('ubicacion_id', e.target.value)}>
                <option value="">General del almacén</option>
                {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
              </Select>
            </Campo>
            <Campo
              label={editando ? 'Stock total (ajuste)' : 'Stock inicial'}
              hint={editando ? 'Cambiar este valor genera un movimiento de ajuste auditado.' : 'Se registrará como entrada de stock inicial.'}
            >
              <Input
                type="number"
                min="0"
                value={editando ? formData.stock : formData.stock_inicial}
                onChange={(e) => set(editando ? 'stock' : 'stock_inicial', e.target.value)}
                placeholder={editando ? String(productoEditar?.stock ?? 0) : '0'}
              />
            </Campo>
          </div>

          {editando && productoEditar?.stock_por_almacen?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/70">
              {productoEditar.stock_por_almacen.map((s) => (
                <span key={s.almacen_id} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  {s.codigo}: <strong className="text-slate-900 dark:text-white">{s.stock}</strong>
                </span>
              ))}
            </div>
          )}

          {editando && productoEditar?.sku_almacen && (
            <p className="text-[10px] text-slate-500 font-mono">SKU por almacén: {productoEditar.sku_almacen}</p>
          )}
        </div>
      </form>
    </Modal>
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
  );
};

export default ModalProducto;
