import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useConfirm } from '../ui/ConfirmProvider';
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
  stock_inicial: '',
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
  stock_inicial: f.stock_inicial ?? (f.id ? '' : (f.stock ?? '')),
  stock: f.stock ?? '',
});

const ModalProducto = ({ productoEditar, onClose, onGuardado, soloLectura = false }) => {
  const confirmar = useConfirm();
  const editando = Boolean(productoEditar?.id);
  const filasIniciales = useMemo(() => {
    const filas = productoEditar?.filas;
    if (Array.isArray(filas) && filas.length > 0) return filas.map((f) => normalizarFila(f));
    if (editando) return [normalizarFila(productoEditar)];
    return [filaVacia()];
  }, [productoEditar, editando]);

  const primeraFila = productoEditar?.filas?.[0] || productoEditar || {};
  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || '',
    descripcion: productoEditar?.descripcion || '',
    sku_base: productoEditar?.codigo_producto || productoEditar?.sku_base || '',
    idcategoria: productoEditar?.idcategoria || '',
    idsubcategoria: productoEditar?.idsubcategoria || '',
    idmarca: productoEditar?.idmarca || '',
    idmodelo: productoEditar?.idmodelo || '',
    idunidad: productoEditar?.idunidad || 1,
    unidad_medida: productoEditar?.unidad_medida || 'UND',
    costo: productoEditar?.costo > 0 ? productoEditar.costo : (primeraFila?.costo ?? ''),
    precio: productoEditar?.precio > 0 ? productoEditar.precio : (primeraFila?.precio ?? ''),
    preciofull: productoEditar?.preciofull > 0 ? productoEditar.preciofull : (primeraFila?.preciofull ?? ''),
    stock_inicial: productoEditar?.stock_inicial ?? '',
    stock_minimo: productoEditar?.stock_minimo ?? 0,
    stock_maximo: productoEditar?.stock_maximo ?? '',
    imagen: productoEditar?.imagen || 'sin-foto.png',
    idestatus: productoEditar?.idestatus ?? 1,
  });

  const [filas, setFilas] = useState(filasIniciales);
  const [filasEliminadas, setFilasEliminadas] = useState([]);
  const [ajuste, setAjuste] = useState(null); // { fila, tipo, concepto, cantidad, motivo, costo_unitario }
  const [stockInicialEdit, setStockInicialEdit] = useState({ abierto: false, valor: '', password: '', guardando: false });
  const [almacenesProducto, setAlmacenesProducto] = useState([]);
  const [ubicacionesProducto, setUbicacionesProducto] = useState([]);
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicacionesPorAlmacen, setUbicacionesPorAlmacen] = useState({});
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('categorias').then((res) => setCategorias(res.datos || []));
    api.get('subcategorias', 'todos=1').then((res) => setSubcategorias(res.datos || []));
    api.get('marcas').then((res) => setMarcas(res.datos || []));
    api.get('modelos').then((res) => {
      const lista = res.datos || [];
      setModelos(lista);
      setFormData((prev) => (prev.idmodelo ? prev : { ...prev, idmodelo: lista[0]?.id ? String(lista[0].id) : '' }));
    });
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
    const res = await api.get('ubicaciones', `almacen=${almacenId}`);
    if (res.success) setUbicacionesPorAlmacen((prev) => ({ ...prev, [almacenId]: res.datos || [] }));
  };

  useEffect(() => {
    const ids = [...new Set(filas.map((f) => f.almacen_id).filter(Boolean))];
    ids.forEach((id) => cargarUbicaciones(id));
  }, [filas]);

  useEffect(() => {
    if (ajuste?.almacen_id) cargarUbicaciones(ajuste.almacen_id);
  }, [ajuste?.almacen_id]);
  useEffect(() => {
    if (ajuste?.almacen_destino_id) cargarUbicaciones(ajuste.almacen_destino_id);
  }, [ajuste?.almacen_destino_id]);

  useEffect(() => {
    if (!ajuste?.filaId) { setAlmacenesProducto([]); setUbicacionesProducto([]); return; }
    Promise.all([
      api.get(`inventario/producto/${ajuste.filaId}`),
      api.get('inventario', `producto=${ajuste.filaId}`),
    ]).then(([r1, r2]) => {
      const desdeProducto = r1.success ? (r1.datos || []).map((a) => String(a.almacen_id)) : [];
      const filasInv = r2.success ? (r2.datos || []) : [];
      const desdeInv = filasInv.map((x) => String(x.almacen_id)).filter(Boolean);
      setAlmacenesProducto([...new Set([...desdeProducto, ...desdeInv])]);
      setUbicacionesProducto(filasInv.map((x) => String(x.ubicacion_id)).filter(Boolean));
    });
  }, [ajuste?.filaId]);

  useEffect(() => {
    if (!editando || !productoEditar?.id) { setImagenesExistentes([]); return; }
    api.get(`productos/${productoEditar.id}/imagenes`).then((res) => {
      if (res.success) setImagenesExistentes(res.datos || []);
    });
  }, [editando, productoEditar?.id]);

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

  const quitarFila = async (key) => {
    const filaActual = filas.find((f) => f._key === key);
    if (!filaActual) return;

    let vaciarStock = false;
    if (filaActual.id) {
      const stock = Number(filaActual.stock || 0);
      const ok = await confirmar({
        titulo: stock > 0 ? 'Quitar presentación con existencia' : 'Quitar presentación',
        mensaje: '¿Deseas quitar esta presentación del producto?',
        variante: 'peligro',
        textoConfirmar: stock > 0 ? 'Sí, poner en cero y quitar' : 'Sí, quitar',
        detalle: [
          `Presentación/SKU #${filaActual.id}.`,
          stock > 0
            ? `Tiene ${stock} unidad(es) en existencia. Si continúas, el sistema pondrá el stock en cero automáticamente antes de eliminarla.`
            : 'La presentación se eliminará al guardar el producto.',
          'Esta acción no se puede deshacer.',
        ],
        checkLabel: 'Entiendo las consecuencias y deseo continuar.',
      });
      if (!ok) return;
      vaciarStock = stock > 0;
      setFilasEliminadas((prev) => (
        prev.some((x) => x.id === filaActual.id) ? prev : [...prev, { id: filaActual.id, vaciarStock }]
      ));
    }

    setFilas((prev) => (prev.length === 1 ? prev : prev.filter((f) => f._key !== key)));
  };

  const unidadSeleccionada = unidades.find((u) => Number(u.id) === Number(formData.idunidad));
  const abreviaturaUnidad = unidadSeleccionada?.abreviatura || formData.unidad_medida || 'UND';
  const subcategoriasFiltradas = subcategorias.filter((s) => {
    const mismaCategoria = !formData.idcategoria || Number(s.idcategoria) === Number(formData.idcategoria);
    const activaOActual = Number(s.idestatus) === 1 || String(s.id) === String(formData.idsubcategoria);
    return mismaCategoria && activaOActual;
  });

  const eliminarImagenExistente = async (imgId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    const res = await api.delete('productos/imagenes', imgId);
    if (res.success) setImagenesExistentes((prev) => prev.filter((x) => x.id !== imgId));
    else alert(res.error || 'No se pudo eliminar la imagen');
  };

  const guardarStockInicial = async () => {
    if (!ajuste?.filaId) return;
    const valor = Number(stockInicialEdit.valor);
    if (!Number.isInteger(valor) || valor < 0) { alert('El stock inicial debe ser un entero mayor o igual a 0.'); return; }
    if (!stockInicialEdit.password) { alert('Debes ingresar la contraseña del superusuario.'); return; }

    const ok = await confirmar({
      titulo: 'Modificar stock inicial',
      mensaje: `Vas a cambiar únicamente el STOCK INICIAL de la presentación a ${valor}. Esta acción requiere contraseña de superusuario y no modifica el stock actual por movimientos. ¿Deseas continuar?`,
      textoConfirmar: 'Sí, modificar',
      variante: 'peligro',
    });
    if (!ok) return;

    setStockInicialEdit((p) => ({ ...p, guardando: true }));
    const res = await api.post(`productos/${ajuste.filaId}/stock-inicial`, {
      stock_inicial: valor,
      password: stockInicialEdit.password,
    });
    setStockInicialEdit((p) => ({ ...p, guardando: false }));
    if (!res?.success) {
      alert(res?.error || 'No se pudo actualizar el stock inicial.');
      return;
    }
    setFilas((prev) => prev.map((f) => Number(f.id) === Number(ajuste.filaId) ? { ...f, stock_inicial: valor } : f));
    setStockInicialEdit({ abierto: false, valor: '', password: '', guardando: false });
    alert(res?.datos?.mensaje || 'Stock inicial actualizado correctamente.');
  };

  const guardarAjuste = async () => {
    if (!ajuste?.filaId) return;
    const cantidad = Number(ajuste.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) { alert('Indica una cantidad mayor a 0.'); return; }
    if (!ajuste.almacen_id) { alert('Selecciona el almacén.'); return; }

    const concepto = ajuste.concepto || 'otro';
    const esTransferencia = ['transferencia', 'migracion'].includes(concepto);
    if (esTransferencia && !ajuste.almacen_destino_id) { alert('Selecciona el almacén destino.'); return; }
    if (esTransferencia) {
      if (almacenesProducto.length > 0 && !almacenesProducto.includes(String(ajuste.almacen_destino_id))) {
        alert('El almacén destino no está registrado para este producto.');
        return;
      }
      if (String(ajuste.almacen_id) === String(ajuste.almacen_destino_id) && String(ajuste.ubicacion_id || '') === String(ajuste.ubicacion_destino_id || '')) {
        alert('La ubicación de origen y destino no pueden ser la misma.');
        return;
      }
    }

    let tipoMov = ajuste.tipo === 'entrada' ? 'entrada' : 'salida';
    if (ajuste.tipo === 'ajuste') tipoMov = 'ajuste';
    if (concepto === 'devolucion') tipoMov = 'devolucion';
    if (concepto === 'merma') tipoMov = 'merma';
    if (concepto === 'transferencia') tipoMov = 'transferencia';
    if (concepto === 'migracion') tipoMov = 'migracion';

    const suma = ['entrada', 'devolucion', 'compra'].includes(tipoMov) || (tipoMov === 'ajuste');
    const resta = ['salida', 'venta', 'merma'].includes(tipoMov);

    const ok = await confirmar({
      titulo: 'Registrar ajuste de inventario',
      mensaje: `Se registrará un movimiento de tipo ${tipoMov.toUpperCase()} (${concepto}) por ${cantidad} unidad(es). Esto actualizará el stock y generará auditoría. ¿Deseas continuar?`,
      textoConfirmar: 'Sí, registrar ajuste',
      variante: 'peligro',
    });
    if (!ok) return;

    const payload = {
      tipo: tipoMov,
      producto_id: Number(ajuste.filaId),
      cantidad,
      concepto,
      motivo: ajuste.motivo || concepto || '',
      referencia: 'Ajuste manual',
    };
    if (['entrada', 'devolucion', 'ajuste'].includes(tipoMov)) {
      payload.almacen_destino_id = Number(ajuste.almacen_id);
      if (ajuste.ubicacion_id) payload.ubicacion_destino_id = Number(ajuste.ubicacion_id);
    } else if (['salida', 'venta', 'merma'].includes(tipoMov)) {
      payload.almacen_origen_id = Number(ajuste.almacen_id);
      if (ajuste.ubicacion_id) payload.ubicacion_origen_id = Number(ajuste.ubicacion_id);
    } else if (['transferencia', 'migracion'].includes(tipoMov)) {
      payload.almacen_origen_id = Number(ajuste.almacen_id);
      if (ajuste.ubicacion_id) payload.ubicacion_origen_id = Number(ajuste.ubicacion_id);
      payload.almacen_destino_id = Number(ajuste.almacen_destino_id);
      if (ajuste.ubicacion_destino_id) payload.ubicacion_destino_id = Number(ajuste.ubicacion_destino_id);
    }

    setGuardandoAjuste(true);
    const res = await api.post('inventario/movimientos', payload);
    setGuardandoAjuste(false);
    if (!res.success) { alert(res.error || res.message || 'No se pudo registrar el ajuste.'); return; }

    // Actualizar stock local
    setFilas((prev) => prev.map((f) => {
      const actual = Number(f.stock || 0);
      const mismaFila = Number(f.id) === Number(ajuste.filaId);
      const esOrigen = String(f.almacen_id) === String(ajuste.almacen_id) && String(f.ubicacion_id || '') === String(ajuste.ubicacion_id || '');
      const esDestino = String(f.almacen_id) === String(ajuste.almacen_destino_id || '') && String(f.ubicacion_id || '') === String(ajuste.ubicacion_destino_id || '');

      if (['entrada', 'devolucion'].includes(tipoMov)) {
        if (mismaFila) return { ...f, stock: actual + cantidad };
      } else if (['salida', 'merma'].includes(tipoMov)) {
        if (mismaFila) return { ...f, stock: Math.max(0, actual - cantidad) };
      } else if (tipoMov === 'ajuste') {
        if (mismaFila) return { ...f, stock: cantidad };
      } else if (['transferencia', 'migracion'].includes(tipoMov)) {
        if (esOrigen) return { ...f, stock: Math.max(0, actual - cantidad) };
        if (esDestino) return { ...f, stock: actual + cantidad };
        // fallback: si la fila seleccionada es origen por id
        if (mismaFila && esOrigen) return { ...f, stock: Math.max(0, actual - cantidad) };
      }
      return f;
    }));
    setAjuste(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idsubcategoria) {
      alert('Debes seleccionar una subcategoría para el producto.');
      return;
    }
    if (filas.length === 0) {
      alert('Debes agregar al menos una fila de almacén/variante.');
      return;
    }

    setGuardando(true);
    const costo = formData.costo === '' ? 0 : Number(formData.costo);
    const precio = formData.precio === '' ? 0 : Number(formData.precio);
    const preciofull = formData.preciofull === '' ? precio : Number(formData.preciofull);

    if (precio <= 0) {
      alert('Debes indicar un precio mayor a 0.');
      return;
    }

    const imagenPrincipal = imagenesExistentes[0]?.imagen || 'sin-foto.png';
    const payload = {
      ...formData,
      imagen: imagenPrincipal,
      costo,
      precio,
      preciofull,
      stock_inicial: formData.stock_inicial === '' ? 0 : Number(formData.stock_inicial),
      stock_minimo: formData.stock_minimo === '' ? 0 : Number(formData.stock_minimo),
      stock_maximo: formData.stock_maximo === '' ? null : Number(formData.stock_maximo),
      unidad_medida: abreviaturaUnidad,
      filas: filas.map((f) => ({
        id: f.id || undefined,
        almacen_id: f.almacen_id ? Number(f.almacen_id) : null,
        ubicacion_id: f.ubicacion_id ? Number(f.ubicacion_id) : null,
        idcolor: Number(f.idcolor || 1),
        idtalla: Number(f.idtalla || 1),
        codigo_detalle: f.codigo_detalle || null,
        codigo_barras: f.codigo_barras || null,
        costo,
        precio,
        preciofull,
        stock_inicial: f.stock_inicial === '' ? 0 : Number(f.stock_inicial),
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
    if (imagenesNuevas.length > 0 && idFinal) {
      const subida = await api.subirImagenes('productos', idFinal, imagenesNuevas);
      if (!subida.success) {
        alert(subida.error || 'El producto se guardó, pero algunas imágenes no se pudieron subir');
      }
    }

    if (filasEliminadas.length > 0) {
      const erroresEliminar = [];
      for (const filaEliminada of filasEliminadas) {
        const params = filaEliminada.vaciarStock ? 'fisico=1&vaciar_stock=1' : 'fisico=1';
        const del = await api.delete('productos', filaEliminada.id, params);
        if (!del.success) {
          erroresEliminar.push(`Presentación #${filaEliminada.id}: ${del.error || 'no se pudo eliminar'}`);
        }
      }
      if (erroresEliminar.length > 0) {
        alert(`El producto se guardó, pero algunas presentaciones no se pudieron eliminar:\n\n${erroresEliminar.join('\n')}`);
      }
    }

    setGuardando(false);
    onGuardado();
  };

  return (
    <Modal
      titulo={soloLectura ? 'Detalle de producto' : (editando ? 'Editar producto' : 'Nuevo producto')}
      subtitulo={soloLectura ? `SKU base: ${productoEditar?.sku_base || ''} · Solo visualización` : (editando ? `SKU base: ${productoEditar?.sku_base || ''}` : 'Registra la cabecera y sus presentaciones por almacén')}
      icono="producto"
      tono="neutral"
      onClose={onClose}
      maxW="max-w-6xl"
      footer={
        soloLectura ? (
          <Boton variante="neutral" onClick={onClose}>Cerrar</Boton>
        ) : (
          <>
            <Boton variante="neutral" onClick={onClose}>Cancelar</Boton>
            <Boton type="submit" form="form-producto" variante="primario" icono="guardar" cargando={guardando}>
              {guardando ? 'Guardando...' : 'Guardar producto'}
            </Boton>
          </>
        )
      }
    >
      <form id="form-producto" onSubmit={soloLectura ? (e) => e.preventDefault() : handleSubmit} className="space-y-6">
        <fieldset disabled={soloLectura} className={soloLectura ? 'contents' : 'contents'}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icono nombre="producto" className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Cabecera del producto</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Campo label="Nombre del producto" required className="md:col-span-2">
              <Input required value={formData.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre del producto base" />
            </Campo>
            <Campo label="SKU / Código del producto" hint={editando ? 'El SKU de cabecera no se puede modificar.' : 'Mismo código para todas las presentaciones. Auto si se deja vacío.'}>
              <Input value={formData.sku_base} onChange={(e) => set('sku_base', e.target.value)} placeholder="P-00001" className="font-mono" disabled={editando} readOnly={editando} />
            </Campo>
          </div>

          <Campo label="Descripción">
            <TextArea rows={2} value={formData.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Descripción del producto" />
          </Campo>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Campo label="Costo ($)">
              <Input type="number" step="0.01" min="0" value={formData.costo} onChange={(e) => set('costo', e.target.value)} />
            </Campo>
            <Campo label="Precio ($)" required>
              <Input type="number" step="0.01" min="0" required value={formData.precio} onChange={(e) => set('precio', e.target.value)} />
            </Campo>
            <Campo label="Precio especial ($)">
              <Input type="number" step="0.01" min="0" value={formData.preciofull} onChange={(e) => set('preciofull', e.target.value)} />
            </Campo>
            <Campo label="Stock mínimo">
              <Input type="number" min="0" value={formData.stock_minimo} onChange={(e) => set('stock_minimo', e.target.value)} />
            </Campo>
            <Campo label="Stock máximo">
              <Input type="number" min="0" value={formData.stock_maximo} onChange={(e) => set('stock_maximo', e.target.value)} placeholder="Sin límite" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Campo label="Categoría" required>
              <Select
                required
                value={formData.idcategoria}
                onChange={(e) => {
                  const idcategoria = e.target.value;
                  setFormData((prev) => ({ ...prev, idcategoria, idsubcategoria: '' }));
                }}
              >
                <option value="">Selecciona...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>
            <Campo
              label="Subcategoría"
              required
              hint={
                !formData.idcategoria
                  ? 'Selecciona primero una categoría'
                  : subcategoriasFiltradas.length === 0
                    ? 'Esta categoría no tiene subcategorías activas. Crea una en Catálogos > Subcategorías.'
                    : undefined
              }
            >
              <Select
                required={!!formData.idcategoria && subcategoriasFiltradas.length > 0}
                value={formData.idsubcategoria}
                onChange={(e) => set('idsubcategoria', e.target.value)}
                disabled={!formData.idcategoria || subcategoriasFiltradas.length === 0}
              >
                <option value="">
                  {subcategoriasFiltradas.length === 0 ? 'Sin subcategorías disponibles' : 'Selecciona...'}
                </option>
                {subcategoriasFiltradas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </Select>
            </Campo>
            <Campo label="Marca" required>
              <Select required value={formData.idmarca} onChange={(e) => set('idmarca', e.target.value)}>
                <option value="">Selecciona...</option>
                {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </Select>
            </Campo>
            <Campo label="Modelo" required>
              <Select required value={formData.idmodelo} onChange={(e) => set('idmodelo', e.target.value)}>
                <option value="">Selecciona...</option>
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

          <Campo label="Imágenes del producto" hint="Hasta 6 imágenes, ninguna obligatoria.">
            <DropzoneImagen
              imagenesActuales={imagenesExistentes}
              onNuevosChange={setImagenesNuevas}
              onEliminarExistente={eliminarImagenExistente}
              max={6}
              soloLectura={soloLectura}
            />
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
            {!soloLectura && <Boton type="button" variante="neutral" icono="mas" onClick={agregarFila}>Agregar fila</Boton>}
          </div>

          <div className="space-y-4">
            {filas.map((fila, idx) => {
              const ubicaciones = ubicacionesPorAlmacen[fila.almacen_id] || [];
              return (
                <div key={fila._key} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">Fila {idx + 1} {fila.id ? <span className="text-cyan-500">#SKU {fila.id}</span> : <span className="text-emerald-500">Nueva</span>}</p>
                    {!soloLectura && (
                      <div className="flex items-center gap-2">
                        {editando && fila.id && (
                          <Boton type="button" variante="neutral" tamano="sm" icono="ajustes" onClick={() => setAjuste({ filaId: fila.id, almacen_id: fila.almacen_id, ubicacion_id: fila.ubicacion_id || '', almacen_destino_id: '', ubicacion_destino_id: '', tipo: 'entrada', concepto: 'compra', cantidad: 1, motivo: '' })}>
                            Ajustes
                          </Boton>
                        )}
                        <Boton type="button" variante="peligro" tamano="sm" icono="papelera" onClick={() => quitarFila(fila._key)}>
                          Quitar
                        </Boton>
                      </div>
                    )}
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Campo label="Código de detalle" hint="Auto si se deja vacío">
                      <Input value={fila.codigo_detalle} onChange={(e) => setFila(fila._key, 'codigo_detalle', e.target.value)} className="font-mono" placeholder="SKU-01" />
                    </Campo>
                    <Campo label="Código de barras">
                      <Input value={fila.codigo_barras} onChange={(e) => setFila(fila._key, 'codigo_barras', e.target.value)} />
                    </Campo>
                    <Campo label="Stock inicial" hint={fila.id ? 'Punto de partida, no editable.' : 'Se registra como entrada inicial.'}>
                      <Input
                        type="number"
                        min="0"
                        value={fila.stock_inicial}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFilas((prev) => prev.map((x) => (x._key === fila._key ? { ...x, stock_inicial: v, ...(x.id ? {} : { stock: v }) } : x)));
                        }}
                        disabled={Boolean(fila.id)}
                      />
                    </Campo>
                    <Campo label="Stock actual" hint={fila.id ? 'Solo cambia mediante ajustes.' : 'Se define con el stock inicial.'}>
                      <Input
                        type="number"
                        min="0"
                        value={fila.stock}
                        onChange={(e) => setFila(fila._key, 'stock', e.target.value)}
                        disabled={Boolean(fila.id)}
                      />
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
        </fieldset>
      </form>

      {ajuste && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Ajuste de inventario</h4>
              <button type="button" onClick={() => setAjuste(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo" required>
                <Select value={ajuste.tipo} onChange={(e) => {
                  const tipo = e.target.value;
                  const concepto = tipo === 'entrada' ? 'compra' : tipo === 'salida' ? 'venta' : tipo === 'ajuste' ? 'ajuste' : 'otro';
                  setAjuste((p) => ({ ...p, tipo, concepto }));
                }}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </Select>
              </Campo>
              <Campo label="Concepto" required>
                <Select value={ajuste.concepto} onChange={(e) => setAjuste((p) => ({ ...p, concepto: e.target.value }))}>
                  {ajuste.tipo === 'entrada' ? (
                    <>
                      <option value="compra">Compra</option>
                      <option value="devolucion">Devolución</option>
                      <option value="otro">Otro</option>
                    </>
                  ) : ajuste.tipo === 'salida' ? (
                    <>
                      <option value="venta">Venta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="migracion">Migración</option>
                      <option value="merma">Merma</option>
                      <option value="danado">Dañado</option>
                      <option value="extravio">Extravío</option>
                      <option value="robo">Robo</option>
                      <option value="otro">Otro</option>
                    </>
                  ) : (
                    <>
                      <option value="ajuste">Ajuste de inventario</option>
                      <option value="conteo">Conteo físico</option>
                    </>
                  )}
                </Select>
              </Campo>
              <Campo label={['transferencia','migracion'].includes(ajuste.concepto) ? 'Almacén origen' : 'Almacén'} required>
                <Select value={ajuste.almacen_id} onChange={(e) => { setAjuste((p) => ({ ...p, almacen_id: e.target.value, ubicacion_id: '' })); }}>
                  <option value="">Selecciona...</option>
                  {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>)}
                </Select>
              </Campo>
              <Campo label={['transferencia','migracion'].includes(ajuste.concepto) ? 'Ubicación origen' : 'Ubicación'}>
                <Select value={ajuste.ubicacion_id} onChange={(e) => setAjuste((p) => ({ ...p, ubicacion_id: e.target.value }))}>
                  <option value="">Automática</option>
                  {(ubicacionesPorAlmacen[ajuste.almacen_id] || []).map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}
                </Select>
              </Campo>
              {['transferencia','migracion'].includes(ajuste.concepto) && (
                <>
                  <Campo label="Almacén destino" required>
                    <Select value={ajuste.almacen_destino_id || ''} onChange={(e) => { setAjuste((p) => ({ ...p, almacen_destino_id: e.target.value, ubicacion_destino_id: '' })); }}>
                      <option value="">Selecciona...</option>
                      {almacenes
                        .filter((a) => almacenesProducto.length === 0 || almacenesProducto.includes(String(a.id)))
                        .map((a) => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>)}
                    </Select>
                  </Campo>
                  <Campo label="Ubicación destino">
                    <Select value={ajuste.ubicacion_destino_id || ''} onChange={(e) => setAjuste((p) => ({ ...p, ubicacion_destino_id: e.target.value }))}>
                      <option value="">Automática</option>
                      {(ubicacionesPorAlmacen[ajuste.almacen_destino_id] || []).map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}
                    </Select>
                  </Campo>
                </>
              )}
              <Campo label={ajuste.tipo === "ajuste" ? "Nueva cantidad" : "Cantidad"} required>
                <Input type="number" min="1" value={ajuste.cantidad} onChange={(e) => setAjuste((p) => ({ ...p, cantidad: e.target.value }))} />
              </Campo>
            </div>
            <Campo label="Motivo">
              <Input value={ajuste.motivo} onChange={(e) => setAjuste((p) => ({ ...p, motivo: e.target.value }))} placeholder="Detalle del ajuste" />
            </Campo>

            {stockInicialEdit.abierto && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">Modificar únicamente STOCK INICIAL (requiere contraseña de superusuario)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Campo label="Nuevo stock inicial" required>
                    <Input type="number" min="0" step="1" value={stockInicialEdit.valor} onChange={(e) => setStockInicialEdit((p) => ({ ...p, valor: e.target.value }))} />
                  </Campo>
                  <Campo label="Contraseña superusuario" required>
                    <Input type="password" value={stockInicialEdit.password} onChange={(e) => setStockInicialEdit((p) => ({ ...p, password: e.target.value }))} placeholder="Contraseña" />
                  </Campo>
                </div>
                <div className="flex justify-end gap-2">
                  <Boton type="button" variante="neutral" tamano="sm" onClick={() => setStockInicialEdit({ abierto: false, valor: '', password: '', guardando: false })}>Cancelar</Boton>
                  <Boton type="button" variante="peligro" tamano="sm" onClick={guardarStockInicial} disabled={stockInicialEdit.guardando}>{stockInicialEdit.guardando ? 'Validando...' : 'Guardar stock inicial'}</Boton>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Boton type="button" variante="advertencia" tamano="sm" onClick={() => setStockInicialEdit((p) => ({ ...p, abierto: !p.abierto, valor: p.abierto ? '' : String((filas.find(f => Number(f.id) === Number(ajuste.filaId))?.stock_inicial) ?? ''), password: '' }))}>
                Modificar stock inicial
              </Boton>
              <div className="flex items-center gap-2">
                <Boton type="button" variante="neutral" onClick={() => { setAjuste(null); setStockInicialEdit({ abierto: false, valor: '', password: '', guardando: false }); }}>Cancelar</Boton>
                <Boton type="button" variante="primario" onClick={guardarAjuste} disabled={guardandoAjuste}>{guardandoAjuste ? 'Guardando...' : 'Registrar ajuste'}</Boton>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ModalProducto;
