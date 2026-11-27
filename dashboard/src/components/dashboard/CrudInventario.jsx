import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Icono from '../ui/Icono';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Acciones, Tabla, Td, Th } from '../ui/Tabla';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const TIPOS = [
  { id: 'entrada', label: 'Entrada', signo: '+' },
  { id: 'salida', label: 'Salida', signo: '−' },
  { id: 'ajuste', label: 'Ajuste (fija cantidad)', signo: '=' },
  { id: 'transferencia', label: 'Transferencia', signo: '⇄' },
  { id: 'compra', label: 'Compra', signo: '+' },
  { id: 'venta', label: 'Venta', signo: '−' },
  { id: 'devolucion', label: 'Devolución', signo: '+' },
];

const formVacio = {
  tipo: 'entrada',
  producto_id: '',
  cantidad: '',
  almacen_origen_id: '',
  ubicacion_origen_id: '',
  almacen_destino_id: '',
  ubicacion_destino_id: '',
  costo_unitario: '',
  referencia: '',
  motivo: '',
};

const CrudInventario = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicacionesOrigen, setUbicacionesOrigen] = useState([]);
  const [ubicacionesDestino, setUbicacionesDestino] = useState([]);
  const [ubicacionesEditar, setUbicacionesEditar] = useState([]);
  const [filtros, setFiltros] = useState({ almacen: '', q: '', solo_con_stock: '1' });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [registroEditar, setRegistroEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({ producto_id: '', almacen_id: '', ubicacion_id: '', cantidad: '', lote: '', fecha_vencimiento: '' });
  const [guardandoEditar, setGuardandoEditar] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  useEffect(() => {
    api.get('productos', 'todos=1').then((r) => setProductos(r.datos || []));
    api.get('almacenes').then((r) => setAlmacenes(r.datos || []));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.almacen !== '') params.append('almacen', filtros.almacen);
    if (filtros.solo_con_stock !== '') params.append('solo_con_stock', filtros.solo_con_stock);

    const res = await api.get('inventario', params.toString());
    if (res.success) {
      setInventario(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudo cargar el inventario');
    }
    setCargando(false);
  }, [qDebounced, filtros.almacen, filtros.solo_con_stock, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!form.almacen_origen_id) { setUbicacionesOrigen([]); return; }
    let activo = true;
    api.get('ubicaciones', `almacen=${form.almacen_origen_id}`).then((r) => {
      if (activo && r.success) setUbicacionesOrigen(r.datos || []);
    });
    return () => { activo = false; };
  }, [form.almacen_origen_id]);

  useEffect(() => {
    if (!form.almacen_destino_id) { setUbicacionesDestino([]); return; }
    let activo = true;
    api.get('ubicaciones', `almacen=${form.almacen_destino_id}`).then((r) => {
      if (activo && r.success) setUbicacionesDestino(r.datos || []);
    });
    return () => { activo = false; };
  }, [form.almacen_destino_id]);

  useEffect(() => {
    if (!formEditar.almacen_id) { setUbicacionesEditar([]); return; }
    let activo = true;
    api.get('ubicaciones', `almacen=${formEditar.almacen_id}`).then((r) => {
      if (activo && r.success) setUbicacionesEditar(r.datos || []);
    });
    return () => { activo = false; };
  }, [formEditar.almacen_id]);

  const set = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const cambiarTipo = (tipo) => {
    setForm((prev) => ({
      ...prev,
      tipo,
      almacen_origen_id: '',
      ubicacion_origen_id: '',
      almacen_destino_id: '',
      ubicacion_destino_id: '',
    }));
  };

  const requiereOrigen = ['salida', 'venta', 'transferencia'].includes(form.tipo);
  const requiereDestino = ['entrada', 'compra', 'devolucion', 'ajuste', 'transferencia'].includes(form.tipo);

  const abrirMovimiento = () => {
    setForm(formVacio);
    setModalAbierto(true);
  };

  const registrar = async (e) => {
    e.preventDefault();
    if (!form.producto_id || !form.cantidad) {
      toast.error('Selecciona un producto e indica la cantidad');
      return;
    }

    const payload = {
      tipo: form.tipo,
      producto_id: Number(form.producto_id),
      cantidad: Number(form.cantidad),
      costo_unitario: form.costo_unitario || null,
      referencia: form.referencia || null,
      motivo: form.motivo || null,
    };
    if (requiereOrigen) {
      payload.almacen_origen_id = form.almacen_origen_id ? Number(form.almacen_origen_id) : null;
      payload.ubicacion_origen_id = form.ubicacion_origen_id ? Number(form.ubicacion_origen_id) : null;
    }
    if (requiereDestino) {
      payload.almacen_destino_id = form.almacen_destino_id ? Number(form.almacen_destino_id) : null;
      payload.ubicacion_destino_id = form.ubicacion_destino_id ? Number(form.ubicacion_destino_id) : null;
    }

    setGuardando(true);
    const res = await api.post('inventario/movimientos', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || 'No se pudo registrar el movimiento');
      return;
    }

    toast.exito('Movimiento registrado correctamente');
    setModalAbierto(false);
    setForm(formVacio);
    cargar();
  };

  const abrirEditar = (item) => {
    setRegistroEditar(item);
    setFormEditar({
      producto_id: String(item.producto_id || ''),
      almacen_id: String(item.almacen_id || ''),
      ubicacion_id: String(item.ubicacion_id || ''),
      cantidad: item.cantidad ?? '',
      lote: item.lote || '',
      fecha_vencimiento: item.fecha_vencimiento || '',
    });
    setModalEditar(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!registroEditar) return;
    if (!formEditar.producto_id || !formEditar.ubicacion_id || formEditar.cantidad === '') {
      toast.error('Producto, ubicación y cantidad son obligatorios');
      return;
    }
    setGuardandoEditar(true);
    const res = await api.put('inventario', registroEditar.id, {
      producto_id: Number(formEditar.producto_id),
      ubicacion_id: Number(formEditar.ubicacion_id),
      cantidad: Number(formEditar.cantidad),
      lote: formEditar.lote || null,
      fecha_vencimiento: formEditar.fecha_vencimiento || null,
    });
    setGuardandoEditar(false);
    if (!res.success) {
      toast.error(res.error || 'No se pudo actualizar el registro');
      return;
    }
    toast.exito('Registro de inventario actualizado');
    setModalEditar(false);
    setRegistroEditar(null);
    cargar();
  };

  const eliminarRegistro = async (item) => {
    const ok = await confirmar({
      titulo: 'Eliminar registro de inventario',
      mensaje: `¿Deseas eliminar el registro de "${item.producto}" en ${item.ruta || item.ubicacion_codigo || 'la ubicación'}?`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        `SKU: ${item.sku_base || '—'}`,
        `Cantidad actual: ${item.cantidad}`,
        'El stock del producto se recalculará automáticamente.',
      ],
    });
    if (!ok) return;
    const res = await api.delete('inventario', item.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar el registro');
      return;
    }
    toast.exito('Registro de inventario eliminado');
    cargar();
  };

  const limpiar = () => setFiltros({ almacen: '', q: '', solo_con_stock: '1' });
  const hayFiltros = filtros.q !== '' || filtros.almacen !== '' || filtros.solo_con_stock !== '1';

  const exportar = (tipo) => {
    const cols = [
      { header: 'Producto', valor: (r) => r.producto },
      { header: 'SKU', valor: (r) => r.sku_base },
      { header: 'Almacén', valor: (r) => r.almacen_codigo },
      { header: 'Ubicación', valor: (r) => r.ruta },
      { header: 'Tipo', valor: (r) => r.tipo_ubicacion },
      { header: 'Cantidad', valor: (r) => r.cantidad },
    ];
    const filtrosRep = [];
    if (filtros.q) filtrosRep.push({ label: 'Búsqueda', value: filtros.q });
    if (filtros.almacen) filtrosRep.push({ label: 'Almacén', value: almacenes.find((a) => String(a.id) === String(filtros.almacen))?.codigo || filtros.almacen });
    filtrosRep.push({ label: 'Solo con stock', value: filtros.solo_con_stock === '1' ? 'Sí' : 'No' });
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_inventario', hoja: 'Inventario', columnas: cols, filas: inventario });
    else exportarPDF({ nombre: 'reporte_inventario', titulo: 'Reporte de Inventario', filtros: filtrosRep, columnas: cols, filas: inventario });
  };

  const tipoActual = TIPOS.find((t) => t.id === form.tipo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Inventario por ubicación</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Stock real distribuido por almacén y ubicación física</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
          <Boton variante="primario" icono="movimiento" onClick={abrirMovimiento}>Registrar Movimiento</Boton>
        </div>
      </div>

      <BarraFiltros
        total={inventario.length}
        etiqueta="registros de inventario"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar producto o SKU..."
          className="col-span-2 md:w-72"
        />
        <Select
          value={filtros.almacen}
          onChange={(e) => setFiltros({ ...filtros, almacen: e.target.value })}
          className="md:w-52"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
        </Select>
        <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-[11px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.solo_con_stock === '1'}
            onChange={(e) => setFiltros({ ...filtros, solo_con_stock: e.target.checked ? '1' : '' })}
            className="accent-rose-500"
          />
          Solo con stock
        </label>
      </BarraFiltros>

      <Tabla
        colSpan={7}
        cargando={cargando}
        vacio={inventario.length === 0}
        textoVacio="Sin registros de inventario para los filtros seleccionados."
        cabecera={
          <>
            <Th>Producto</Th>
            <Th>SKU</Th>
            <Th>Almacén</Th>
            <Th>Ubicación</Th>
            <Th>Tipo</Th>
            <Th align="right">Cantidad</Th>
            <Th align="center">Acciones</Th>
          </>
        }
      >
        {inventario.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            <Td className="font-bold text-gray-900 dark:text-white max-w-xs truncate">{item.producto}</Td>
            <Td className="font-mono text-[10px] text-cyan-400">{item.sku_base}</Td>
            <Td className="text-gray-300">{item.almacen_codigo}</Td>
            <Td className="font-mono text-[10px] text-gray-400">{item.ruta}</Td>
            <Td className="text-gray-400">{item.tipo_ubicacion}</Td>
            <Td align="right" className={`font-bold ${Number(item.cantidad) === 0 ? 'text-rose-400' : 'text-white'}`}>
              {item.cantidad}
            </Td>
            <Td align="center"><Acciones>
                <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(item)} title="Editar" aria-label="Editar"></Boton>
                <Boton tamano="sm" variante="peligro" icono="papelera" onClick={() => eliminarRegistro(item)} title="Eliminar" aria-label="Eliminar"></Boton>
              </Acciones>
            </Td>
          </tr>
        ))}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo="Registrar movimiento"
          subtitulo="El stock se actualiza automáticamente en la ubicación indicada"
          icono="movimiento"
          tono="info"
          onClose={() => setModalAbierto(false)}
          maxW="max-w-2xl"
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-movimiento" variante="exito" icono="guardar" cargando={guardando}>
                Registrar movimiento
              </Boton>
            </>
          }
        >
          <form id="form-movimiento" onSubmit={registrar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Campo label="Tipo de movimiento" required>
                <Select value={form.tipo} onChange={(e) => cambiarTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.signo} {t.label}</option>)}
                </Select>
              </Campo>
              <Campo label="Producto" required className="sm:col-span-2">
                <Select
                  required
                  value={form.producto_id}
                  onChange={(e) => set('producto_id', e.target.value)}
                >
                  <option value="">Selecciona un producto...</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.sku_base} · {p.nombre}</option>)}
                </Select>
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Campo label={form.tipo === 'ajuste' ? 'Nueva cantidad' : 'Cantidad'} required>
                <Input
                  type="number"
                  min="1"
                  required
                  value={form.cantidad}
                  onChange={(e) => set('cantidad', e.target.value)}
                  placeholder="0"
                />
              </Campo>
              <Campo label="Costo unitario">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costo_unitario}
                  onChange={(e) => set('costo_unitario', e.target.value)}
                  placeholder="0.00"
                />
              </Campo>
              <Campo label="Referencia">
                <Input
                  value={form.referencia}
                  onChange={(e) => set('referencia', e.target.value)}
                  placeholder="Factura, guía..."
                />
              </Campo>
              <Campo label="Motivo">
                <Input
                  value={form.motivo}
                  onChange={(e) => set('motivo', e.target.value)}
                  placeholder="Reubicación..."
                />
              </Campo>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-3.5 rounded-2xl border ${requiereOrigen ? 'bg-rose-500/5 border-rose-500/20' : 'bg-gray-950/30 border-gray-800/60 opacity-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icono nombre="subir" className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Origen</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    disabled={!requiereOrigen}
                    value={form.almacen_origen_id}
                    onChange={(e) => setForm({ ...form, almacen_origen_id: e.target.value, ubicacion_origen_id: '' })}
                  >
                    <option value="">Almacén...</option>
                    {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo}</option>)}
                  </Select>
                  <Select
                    disabled={!requiereOrigen}
                    value={form.ubicacion_origen_id}
                    onChange={(e) => set('ubicacion_origen_id', e.target.value)}
                  >
                    <option value="">Ubicación general</option>
                    {ubicacionesOrigen.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
                  </Select>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border ${requiereDestino ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-950/30 border-gray-800/60 opacity-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icono nombre="inventario" className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Destino</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    disabled={!requiereDestino}
                    value={form.almacen_destino_id}
                    onChange={(e) => setForm({ ...form, almacen_destino_id: e.target.value, ubicacion_destino_id: '' })}
                  >
                    <option value="">Almacén...</option>
                    {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo}</option>)}
                  </Select>
                  <Select
                    disabled={!requiereDestino}
                    value={form.ubicacion_destino_id}
                    onChange={(e) => set('ubicacion_destino_id', e.target.value)}
                  >
                    <option value="">Ubicación general</option>
                    {ubicacionesDestino.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 flex items-start gap-2">
              <Icono nombre="alerta" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/70" />
              {tipoActual?.id === 'ajuste'
                ? 'El ajuste fija la cantidad exacta en la ubicación de destino.'
                : tipoActual?.id === 'transferencia'
                  ? 'La transferencia resta en origen y suma en destino.'
                  : 'El movimiento queda registrado en la auditoría de inventario.'}
            </p>
          </form>
        </Modal>
      )}

      {modalEditar && registroEditar && (
        <Modal
          titulo="Editar registro de inventario"
          subtitulo={`#${registroEditar.id} · ${registroEditar.producto || ''}`}
          icono="editar"
          tono="info"
          onClose={() => { setModalEditar(false); setRegistroEditar(null); }}
          maxW="max-w-2xl"
          footer={
            <>
              <Boton variante="neutral" onClick={() => { setModalEditar(false); setRegistroEditar(null); }}>Cancelar</Boton>
              <Boton type="submit" form="form-editar-inventario" variante="exito" icono="guardar" cargando={guardandoEditar}>Guardar cambios</Boton>
            </>
          }
        >
          <form id="form-editar-inventario" onSubmit={guardarEdicion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Producto" required className="sm:col-span-2">
                <Select required value={formEditar.producto_id} onChange={(e) => setFormEditar({ ...formEditar, producto_id: e.target.value })}>
                  <option value="">Selecciona un producto...</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.sku_base || p.codigo_producto} · {p.nombre}</option>)}
                </Select>
              </Campo>
              <Campo label="Almacén" required>
                <Select required value={formEditar.almacen_id} onChange={(e) => setFormEditar({ ...formEditar, almacen_id: e.target.value, ubicacion_id: '' })}>
                  <option value="">Selecciona almacén...</option>
                  {almacenes.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
                </Select>
              </Campo>
              <Campo label="Ubicación" required>
                <Select required value={formEditar.ubicacion_id} onChange={(e) => setFormEditar({ ...formEditar, ubicacion_id: e.target.value })}>
                  <option value="">Selecciona ubicación...</option>
                  {ubicacionesEditar.map((u) => <option key={u.id} value={u.id}>{u.ruta}</option>)}
                </Select>
              </Campo>
              <Campo label="Cantidad" required>
                <Input type="number" min="0" required value={formEditar.cantidad} onChange={(e) => setFormEditar({ ...formEditar, cantidad: e.target.value })} />
              </Campo>
              <Campo label="Lote">
                <Input value={formEditar.lote} onChange={(e) => setFormEditar({ ...formEditar, lote: e.target.value })} />
              </Campo>
              <Campo label="Fecha de vencimiento">
                <Input type="date" value={formEditar.fecha_vencimiento || ''} onChange={(e) => setFormEditar({ ...formEditar, fecha_vencimiento: e.target.value })} />
              </Campo>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CrudInventario;
