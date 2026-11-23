import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Icono from '../ui/Icono';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Tabla, Td, Th } from '../ui/Tabla';

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
  const toast = useToast();

  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicacionesOrigen, setUbicacionesOrigen] = useState([]);
  const [ubicacionesDestino, setUbicacionesDestino] = useState([]);
  const [filtros, setFiltros] = useState({ almacen: '', q: '', solo_con_stock: '1' });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

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

  const limpiar = () => setFiltros({ almacen: '', q: '', solo_con_stock: '1' });
  const hayFiltros = filtros.q !== '' || filtros.almacen !== '' || filtros.solo_con_stock !== '1';

  const tipoActual = TIPOS.find((t) => t.id === form.tipo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Inventario por ubicación</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Stock real distribuido por almacén y ubicación física</p>
        </div>
        <Boton variante="primario" icono="movimiento" onClick={abrirMovimiento}>
          Registrar Movimiento
        </Boton>
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
        <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 cursor-pointer">
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
        colSpan={6}
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
          </>
        }
      >
        {inventario.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <Td className="font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.producto}</Td>
            <Td className="font-mono text-[10px] text-cyan-400">{item.sku_base}</Td>
            <Td className="text-slate-300">{item.almacen_codigo}</Td>
            <Td className="font-mono text-[10px] text-slate-400">{item.ruta}</Td>
            <Td className="text-slate-400">{item.tipo_ubicacion}</Td>
            <Td align="right" className={`font-bold ${Number(item.cantidad) === 0 ? 'text-rose-400' : 'text-white'}`}>
              {item.cantidad}
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
              <div className={`p-3.5 rounded-2xl border ${requiereOrigen ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-950/30 border-slate-800/60 opacity-50'}`}>
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

              <div className={`p-3.5 rounded-2xl border ${requiereDestino ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950/30 border-slate-800/60 opacity-50'}`}>
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

            <p className="text-[10px] text-slate-500 flex items-start gap-2">
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
    </div>
  );
};

export default CrudInventario;
