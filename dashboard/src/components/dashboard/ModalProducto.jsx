import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import DropzoneImagen from './DropzoneImagen';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { Campo, Input, Select, TextArea } from '../ui/Campo';

const filaVacia = (defaults = {}) => ({
  _key: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  id: null,
  almacen_id: defaults.almacen_id || '',
  ubicacion_id: '',
  idcolor: defaults.idcolor || 1,
  idtalla: defaults.idtalla || 1,
  codigo_detalle: '',
  codigo_barras: '',
  costo: '',
  precio: '',
  preciofull: '',
  stock: '',
});

const normalizarFila = (f = {}, defaults = {}) => ({
  _key: `e-${f.id || f.producto_id || Math.random().toString(36).slice(2, 8)}`,
  id: f.id || f.producto_id || null,
  almacen_id: f.almacen_id || defaults.almacen_id || '',
  ubicacion_id: f.ubicacion_id || '',
  idcolor: f.idcolor || 1,
  idtalla: f.idtalla || 1,
  codigo_detalle: f.codigo_detalle || '',
  codigo_barras: f.codigo_barras || '',
  costo: f.costo ?? '',
  precio: f.precio ?? '',
  preciofull: f.preciofull ?? '',
  stock: f.stock ?? '',
});

const ModalProducto = ({ productoEditar, onClose, onGuardado }) => {
  const editando = Boolean(productoEditar?.id);
  const filasIniciales = useMemo(() => {
    const filas = productoEditar?.filas;
    if (Array.isArray(filas) && filas.length > 0) return filas.map((f) => normalizarFila(f));
    if (editando) return [normalizarFila(productoEditar)];
    return [filaVacia()];
  }, [productoEditar, editando]);

  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || '',
    descripcion: productoEditar?.descripcion || '',
    sku_base: productoEditar?.codigo_producto || productoEditar?.sku_base || '',
    idcategoria: productoEditar?.idcategoria || '',
    idsubcategoria: productoEditar?.idsubcategoria || 1,
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || 1,
    idunidad: productoEditar?.idunidad || 1,
    unidad_medida: productoEditar?.unidad_medida || 'UND',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    idestatus: productoEditar?.idestatus ?? 1,
  });

  const [filas, setFilas] = useState(filasIniciales);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicacionesPorAlmacen, setUbicacionesPorAlmacen] = useState({});
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('categorias').then((res) => setCategorias(res.datos || []));
    api.get('marcas').then((res) => setMarcas(res.datos || []));
    api.get('modelos').then((res) => setModelos(res.datos || []));
    api.get('colores').then((res) => setColores(res.datos || []));
    api.get('tallas').then((res) => setTallas(res.datos || []));
    api.get('unidades').then((res) => setUnidades(res.datos || []));
    api.get('almacenes').then((res) => {
      const lista = res.datos || [];
      setAlmacenes(lista);
      if (!editando && lista.length > 0) {
        setFilas((prev) => prev.map((f, i) => (i === 0 && !f.almacen_id ? { ...f, almacen_id: String(lista[0].id) } : f)));
      }
    });
  }, [editando]);

  const cargarUbicaciones = async (almacenId) => {
    if (!almacenId) return;
    if (ubicacionesPorAlmacen[almacenId]) return;
    const res = await api.get('ubicaciones', `almacen=${almacenId}`);
    setUbicacionesPorAlmacen((prev) => ({ ...prev, [almacenId]: res.datos || [] }));
  };

  useEffect(() => {
    const ids = [...new Set(filas.map((f) => f.almacen_id).filter(Boolean))];
    ids.forEach((id) => cargarUbicaciones(id));
  }, [filas]);

  const set = (campo, valor) => setFormData((prev) => ({ ...prev, [campo]: valor }));

  const setFila = (key, campo, valor) => {
    setFilas((prev) => prev.map((f) => (f._key === key ? { ...f, [campo]: valor } : f)));
  };

  const agregarFila = () => {
    const ultima = filas[filas.length - 1];
    setFilas((prev) => [
      ...prev,
      filaVacia({
        almacen_id: ultima?.almacen_id || almacenes[0]?.id || '',
        idcolor: ultima?.idcolor || 1,
        idtalla: ultima?.idtalla || 1,
      }),
    ]);
  };

  const quitarFila = (key) => {
    setFilas((prev) => (prev.length === 1 ? prev : prev.filter((f) => f._key !== key)));
  };

  const unidadSeleccionada = unidades.find((u) => Number(u.id) === Number(formData.idunidad));
  const abreviaturaUnidad = unidadSeleccionada?.abreviatura || formData.unidad_medida || 'UND';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (filas.length === 0) {
      alert('Debes agregar al menos una fila de almacén/variante.');
      return;
    }

    setGuardando(true);
    const payload = {
      ...formData,
      unidad_medida: abreviaturaUnidad,
      filas: filas.map((f) => ({
        id: f.id || undefined,
        almacen_id: f.almacen_id ? Number(f.almacen_id) : null,
        ubicacion_id: f.ubicacion_id ? Number(f.ubicacion_id) : null,
        idcolor: Number(f.idcolor || 1),
        idtalla: Number(f.idtalla || 1),
        codigo_detalle: f.codigo_detalle || null,
        codigo_barras: f.codigo_barras || null,
        costo: f.costo === '' ? 0 : Number(f.costo),
        precio: f.precio === '' ? 0 : Number(f.precio),
        preciofull: f.preciofull === '' ? (f.precio === '' ? 0 : Number(f.precio)) : Number(f.preciofull),
        stock: f.stock === '' ? 0 : Number(f.stock),
      })),
    };

    const res = editando
      ? await api.put('productos', productoEditar.id, payload)
      : await api.post('productos', payload);

    if (!res.success) {
      setGuardando(false);
      alert(res.error || (res.errores || []).join('\n') || 'Ocurrió un error al guardar');
      return;
    }

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

  return (
    <Modal
      titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={editando ? `SKU base: ${productoEditar?.sku_base || ''}` : 'Registra la cabecera y sus presentaciones por almacén'}
      icono="producto"
      tono="neutral"
      onClose={onClose}
      maxW="max-w-6xl"
      footer={
        <>
          <Boton variante="neutral" onClick={onClose}>Cancelar</Boton>
          <Boton type="submit" form="form-producto" variante="primario" icono="guardar" cargando={guardando}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </Boton>
        </>
      }
    >
      <form id="form-producto" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icono nombre="producto" className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Cabecera del producto</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Campo label="Nombre del producto" required className="md:col-span-2">
              <Input required value={formData.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre del producto base" />
            </Campo>
            <Campo label="SKU / Código del producto" hint="Mismo código para todas las presentaciones. Auto si se deja vacío.">
              <Input value={formData.sku_base} onChange={(e) => set('sku_base', e.target.value)} placeholder="P-00001" className="font-mono" />
            </Campo>
          </div>

          <Campo label="Descripción">
            <TextArea rows={2} value={formData.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Descripción del producto" />
          </Campo>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <Campo label="Unidad de medida">
              <Select
                value={formData.idunidad}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const u = unidades.find((x) => Number(x.id) === id);
                  setFormData((prev) => ({ ...prev, idunidad: id, unidad_medida: u?.abreviatura || prev.unidad_medida || 'UND' }));
                }}
              >
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
              </Select>
            </Campo>
          </div>

          <Campo label="Imagen del producto">
            <DropzoneImagen imagenActual={productoEditar?.imagen} onArchivo={(file) => setArchivoImagen(file)} />
          </Campo>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Icono nombre="inventario" className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Presentaciones por almacén</h4>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Cada fila es un SKU independiente: puede variar color, talla, costo, precio y stock por almacén.</p>
            </div>
            <Boton type="button" variante="neutral" icono="mas" onClick={agregarFila}>Agregar fila</Boton>
          </div>

          <div className="space-y-4">
            {filas.map((fila, idx) => {
              const ubicaciones = ubicacionesPorAlmacen[fila.almacen_id] || [];
              return (
                <div key={fila._key} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">Fila {idx + 1} {fila.id ? <span className="text-cyan-500">#SKU {fila.id}</span> : <span className="text-emerald-500">Nueva</span>}</p>
                    <Boton type="button" variante="peligro" tamano="sm" icono="papelera" onClick={() => quitarFila(fila._key)} disabled={filas.length === 1}>
                      Quitar
                    </Boton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Campo label="Almacén" required>
                      <Select required value={fila.almacen_id} onChange={(e) => { setFila(fila._key, 'almacen_id', e.target.value); setFila(fila._key, 'ubicacion_id', ''); }}>
                        <option value="">Selecciona...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
                      </Select>
                    </Campo>
                    <Campo label="Ubicación" hint="Vacío = ubicación General">
                      <Select value={fila.ubicacion_id} onChange={(e) => setFila(fila._key, 'ubicacion_id', e.target.value)}>
                        <option value="">General del almacén</option>
                        {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
                      </Select>
                    </Campo>
                    <Campo label="Color">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                          style={{ background: (colores.find((c) => Number(c.id) === Number(fila.idcolor))?.codigo_hex) || '#d1d5db' }}
                        />
                        <Select value={fila.idcolor} onChange={(e) => setFila(fila._key, 'idcolor', e.target.value)}>
                          {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </Select>
                      </div>
                    </Campo>
                    <Campo label="Talla">
                      <Select value={fila.idtalla} onChange={(e) => setFila(fila._key, 'idtalla', e.target.value)}>
                        {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </Select>
                    </Campo>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Campo label="Código de detalle" hint="Auto si se deja vacío">
                      <Input value={fila.codigo_detalle} onChange={(e) => setFila(fila._key, 'codigo_detalle', e.target.value)} className="font-mono" placeholder="SKU-01" />
                    </Campo>
                    <Campo label="Código de barras">
                      <Input value={fila.codigo_barras} onChange={(e) => setFila(fila._key, 'codigo_barras', e.target.value)} />
                    </Campo>
                    <Campo label={editando && fila.id ? 'Stock actual' : 'Stock inicial'} hint={editando && fila.id ? 'Al guardar, el cambio genera un ajuste auditado.' : 'Se registra como entrada inicial.'}>
                      <Input type="number" min="0" value={fila.stock} onChange={(e) => setFila(fila._key, 'stock', e.target.value)} />
                    </Campo>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Campo label="Costo ($)">
                      <Input type="number" step="0.01" min="0" value={fila.costo} onChange={(e) => setFila(fila._key, 'costo', e.target.value)} />
                    </Campo>
                    <Campo label="Precio ($)" required>
                      <Input type="number" step="0.01" min="0" required value={fila.precio} onChange={(e) => setFila(fila._key, 'precio', e.target.value)} />
                    </Campo>
                    <Campo label="Precio full ($)">
                      <Input type="number" step="0.01" min="0" value={fila.preciofull} onChange={(e) => setFila(fila._key, 'preciofull', e.target.value)} />
                    </Campo>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Unidad de medida: <span className="font-semibold text-gray-700 dark:text-gray-300">{abreviaturaUnidad}</span> (heredada de la cabecera)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ModalProducto;
