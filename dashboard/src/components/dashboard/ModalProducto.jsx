import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import DropzoneImagen from './DropzoneImagen';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { Campo, Input, Select, TextArea } from '../ui/Campo';

const ModalProducto = ({ productoEditar, onClose, onGuardado }) => {
  const editando = Boolean(productoEditar?.id);

  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || '',
    descripcion: productoEditar?.descripcion || '',
    precio: productoEditar?.precio || '',
    preciofull: productoEditar?.preciofull || '',
    costo: productoEditar?.costo ?? '',
    sku_base: productoEditar?.sku_base || '',
    codigo_barras: productoEditar?.codigo_barras || '',
    idcategoria: productoEditar?.idcategoria || '',
    idsubcategoria: productoEditar?.idsubcategoria || 1,
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || 1,
    idcolor: productoEditar?.idcolor || 1,
    idtalla: productoEditar?.idtalla || 1,
    idunidad: productoEditar?.idunidad || 1,
    producto_base_id: productoEditar?.producto_base_id || '',
    unidad_medida: productoEditar?.unidad_medida || 'UND',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    idestatus: productoEditar?.idestatus ?? 1,
    stock: productoEditar?.stock ?? '',
    stock_inicial: '',
    almacen_id: productoEditar?.stock_por_almacen?.[0]?.almacen_id || '',
    ubicacion_id: '',
  });

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

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
            <Select
              value={formData.idunidad}
              onChange={(e) => {
                const id = Number(e.target.value);
                const u = unidades.find((x) => Number(x.id) === id);
                setFormData((prev) => ({
                  ...prev,
                  idunidad: id,
                  unidad_medida: u?.abreviatura || prev.unidad_medida || 'UND',
                }));
              }}
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
              ))}
            </Select>
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

        <div className="p-4 bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Icono nombre="inventario" className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Inventario</h4>
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
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800/70">
              {productoEditar.stock_por_almacen.map((s) => (
                <span key={s.almacen_id} className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-[10px] text-gray-600 dark:text-gray-300">
                  {s.codigo}: <strong className="text-gray-900 dark:text-white">{s.stock}</strong>
                </span>
              ))}
            </div>
          )}

          {editando && productoEditar?.sku_almacen && (
            <p className="text-[10px] text-gray-500 font-mono">SKU por almacén: {productoEditar.sku_almacen}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default ModalProducto;
