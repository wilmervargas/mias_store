<<<<<<< HEAD
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
=======
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const TIPOS_MOVIMIENTO = [
  { id: 'entrada', label: 'Entrada', signo: '+' },
  { id: 'salida', label: 'Salida', signo: '-' },
  { id: 'ajuste', label: 'Ajuste (+/-)', signo: '±' },
  { id: 'devolucion', label: 'Devolución', signo: '+' },
  { id: 'baja', label: 'Baja', signo: '-' },
];

const TIPO_COLOR = {
  inicial: 'bg-slate-500/10 text-slate-300',
  entrada: 'bg-emerald-500/10 text-emerald-400',
  salida: 'bg-rose-500/10 text-rose-400',
  ajuste: 'bg-amber-500/10 text-amber-400',
  transferencia_salida: 'bg-sky-500/10 text-sky-400',
  transferencia_entrada: 'bg-blue-500/10 text-blue-300',
  venta: 'bg-fuchsia-500/10 text-fuchsia-400',
  devolucion: 'bg-teal-500/10 text-teal-300',
  baja: 'bg-rose-500/10 text-rose-400',
};

const dinero = (v) => `$ ${Number(v || 0).toLocaleString('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const CrudInventario = () => {
  const [vista, setVista] = useState('stock');
  const [resumen, setResumen] = useState(null);
  const [filas, setFilas] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [filtros, setFiltros] = useState({
    q: '', almacen_id: '', bajo_minimo: '', desde: '', hasta: '',
  });

  const [movimiento, setMovimiento] = useState(null);
  const [transferencia, setTransferencia] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarResumen = useCallback(async () => {
    const res = await api.get('inventario/resumen');
    if (res.success) setResumen(res.datos);
  }, []);

  const cargarFilas = useCallback(async () => {
    setCargando(true);
    setError(null);

    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== '') params.append(k, v);
    });

    const res = await api.get('inventario', params.toString());
    if (res.success) {
      setFilas(res.datos || []);
    } else {
      setFilas([]);
      setError(res.error || 'No se pudo cargar el inventario');
    }
    setCargando(false);
  }, [filtros]);

  const cargarKardex = useCallback(async () => {
    setCargando(true);
    setError(null);

    const params = new URLSearchParams({ limite: '200' });
    if (/^\d+$/.test(filtros.q)) params.append('producto_id', filtros.q);
    if (filtros.almacen_id !== '') params.append('almacen_id', filtros.almacen_id);
    if (filtros.desde !== '') params.append('desde', filtros.desde);
    if (filtros.hasta !== '') params.append('hasta', filtros.hasta);

    const res = await api.get('inventario/kardex', params.toString());
    if (res.success) {
      setKardex(res.datos || []);
    } else {
      setKardex([]);
      setError(res.error || 'No se pudo cargar el kardex');
    }
    setCargando(false);
  }, [filtros]);

  useEffect(() => {
    api.get('almacenes').then((r) => setAlmacenes((r.datos || []).filter((a) => Number(a.idestatus) === 1)));
    api.get('ubicaciones').then((r) => setUbicaciones((r.datos || []).filter((u) => Number(u.idestatus) === 1)));
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    if (vista === 'stock') cargarFilas();
    else cargarKardex();
  }, [vista, cargarFilas, cargarKardex]);

  const recargar = async () => {
    await cargarResumen();
    if (vista === 'stock') await cargarFilas();
    else await cargarKardex();
  };

  const abrirMovimiento = (fila) => {
    setMovimiento({
      fila,
      tipo: 'entrada',
      cantidad: '',
      motivo: '',
    });
  };

  const abrirTransferencia = (fila) => {
    setTransferencia({
      fila,
      cantidad: '',
      destino_ubicacion_id: '',
      motivo: '',
    });
  };

  const guardarMovimiento = async () => {
    if (!movimiento) return;
    const cantidad = Number(movimiento.cantidad);

    if (!cantidad) {
      alert('Indica una cantidad distinta de cero.');
      return;
    }
    if (movimiento.tipo !== 'ajuste' && cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    setGuardando(true);
    const res = await api.post('inventario/movimientos', {
      variante_id: movimiento.fila.variante_id,
      ubicacion_id: movimiento.fila.ubicacion_id,
      tipo: movimiento.tipo,
      cantidad: movimiento.tipo === 'ajuste' ? cantidad : Math.abs(cantidad),
      motivo: movimiento.motivo || null,
    });
    setGuardando(false);

    if (!res.success) {
      alert(res.error || 'No se pudo registrar el movimiento');
      return;
    }

    setMovimiento(null);
    recargar();
  };

  const guardarTransferencia = async () => {
    if (!transferencia) return;
    const cantidad = Number(transferencia.cantidad);

    if (!transferencia.destino_ubicacion_id) {
      alert('Selecciona la ubicación de destino.');
      return;
    }
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    setGuardando(true);
    const res = await api.post('inventario/transferencias', {
      variante_id: transferencia.fila.variante_id,
      origen_inventario_id: transferencia.fila.inventario_id,
      destino_ubicacion_id: Number(transferencia.destino_ubicacion_id),
      cantidad,
      motivo: transferencia.motivo || null,
    });
    setGuardando(false);

    if (!res.success) {
      alert(res.error || 'No se pudo registrar la transferencia');
      return;
    }

    setTransferencia(null);
    recargar();
  };

  const general = resumen?.general || {};
  const bajoMinimo = Number(general.ubicaciones_bajo_minimo || 0);

  return (
    <div className="space-y-4">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Unidades disponibles</span>
          <p className="text-2xl font-black text-white mt-1">{Number(general.unidades_disponibles || 0).toLocaleString('es-VE')}</p>
          <span className="text-[10px] text-slate-500">
            {Number(general.unidades_reservadas || 0).toLocaleString('es-VE')} reservadas
          </span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Valor a costo</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{dinero(general.valor_costo)}</p>
          <span className="text-[10px] text-slate-500">Inversión en almacén</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Valor a venta</span>
          <p className="text-2xl font-black text-sky-400 mt-1">{dinero(general.valor_venta)}</p>
          <span className="text-[10px] text-slate-500">
            {Number(general.variantes_con_stock || 0)} variantes en stock
          </span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Alertas de stock</span>
          <p className={`text-2xl font-black mt-1 ${bajoMinimo > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {bajoMinimo}
          </p>
          <span className="text-[10px] text-slate-500">
            {Number(general.ubicaciones_agotadas || 0)} agotadas · {Number(general.ubicaciones_con_stock || 0)} ubicaciones
          </span>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVista('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${vista === 'stock' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          📦 Stock por ubicación
        </button>
        <button
          type="button"
          onClick={() => setVista('kardex')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${vista === 'kardex' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          🧾 Kardex de movimientos
        </button>
        <button
          type="button"
          onClick={recargar}
          className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <input
          placeholder={vista === 'stock' ? 'Buscar producto o SKU...' : 'ID de producto...'}
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
          className="col-span-2 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        />
        <select
          value={filtros.almacen_id}
          onChange={(e) => setFiltros({ ...filtros, almacen_id: e.target.value })}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        {vista === 'stock' ? (
          <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
            <input
              type="checkbox"
              checked={filtros.bajo_minimo === '1'}
              onChange={(e) => setFiltros({ ...filtros, bajo_minimo: e.target.checked ? '1' : '' })}
            />
            Solo bajo mínimo
          </label>
        ) : (
          <div className="flex gap-2 col-span-2">
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
              className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
              className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setFiltros({ q: '', almacen_id: '', bajo_minimo: '', desde: '', hasta: '' })}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
        >
          Limpiar
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Tabla de stock */}
      {vista === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Producto</th>
                <th className="p-3.5">SKU / Variante</th>
                <th className="p-3.5">Almacén / Ubicación</th>
                <th className="p-3.5 text-right">Físico</th>
                <th className="p-3.5 text-right">Reservado</th>
                <th className="p-3.5 text-right">Disponible</th>
                <th className="p-3.5 text-right">Mínimo</th>
                <th className="p-3.5 text-right">Inicial</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cargando && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">Cargando inventario...</td></tr>
              )}
              {!cargando && filas.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">Sin resultados.</td></tr>
              )}
              {!cargando && filas.map((f) => {
                const disponible = Number(f.stock_disponible);
                const minimo = Number(f.stock_minimo);
                return (
                  <tr key={f.inventario_id} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <span className="font-bold text-white block max-w-[240px] truncate">{f.producto}</span>
                      <span className="text-[10px] text-slate-500">#{f.producto_id}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] text-rose-400 block">{f.sku}</span>
                      <span className="text-[10px] text-slate-400">
                        {[f.talla, f.color, f.modelo, f.clave_variante].filter(Boolean).join(' · ') || 'Base'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] text-slate-300 block">{f.almacen}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {f.ubicacion_codigo}
                        {f.pasillo ? ` · P${f.pasillo}` : ''}
                        {f.estante ? ` · E${f.estante}` : ''}
                        {f.sector ? ` · S${f.sector}` : ''}
                        {f.nivel ? ` · N${f.nivel}` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">{f.stock_actual}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{f.stock_reservado}</td>
                    <td className="p-3.5 text-right">
                      <span className={`font-mono font-bold ${disponible <= 0 ? 'text-rose-400' : disponible < minimo ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {disponible}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{minimo}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{f.inventario_inicial}</td>
                    <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => abrirMovimiento(f)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                      >
                        Movimiento
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirTransferencia(f)}
                        className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-white rounded-lg text-[11px]"
                      >
                        Transferir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de kardex */}
      {vista === 'kardex' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Producto / SKU</th>
                <th className="p-3.5">Ubicación</th>
                <th className="p-3.5 text-right">Cantidad</th>
                <th className="p-3.5 text-right">Antes</th>
                <th className="p-3.5 text-right">Después</th>
                <th className="p-3.5">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cargando && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500">Cargando kardex...</td></tr>
              )}
              {!cargando && kardex.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500">Sin movimientos para los filtros indicados.</td></tr>
              )}
              {!cargando && kardex.map((m) => (
                <tr key={m.movimiento_id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {String(m.created_at || '').replace('T', ' ')}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPO_COLOR[m.tipo] || 'bg-slate-500/10 text-slate-300'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] text-white block max-w-[220px] truncate">{m.producto}</span>
                    <span className="font-mono text-[10px] text-rose-400">{m.sku}</span>
                  </td>
                  <td className="p-3.5 text-[10px] text-slate-400">
                    {m.almacen} · {m.ubicacion_codigo}
                  </td>
                  <td className={`p-3.5 text-right font-mono font-bold ${Number(m.cantidad) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Number(m.cantidad) > 0 ? '+' : ''}{m.cantidad}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500">{m.stock_anterior}</td>
                  <td className="p-3.5 text-right font-mono text-slate-300">{m.stock_nuevo}</td>
                  <td className="p-3.5 text-[10px] text-slate-400 max-w-[200px] truncate" title={m.motivo || ''}>
                    {m.motivo || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal movimiento */}
      {movimiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-black text-white mb-1">Registrar movimiento</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              {movimiento.fila.producto} · <span className="font-mono text-rose-400">{movimiento.fila.sku}</span><br />
              {movimiento.fila.almacen} · {movimiento.fila.ubicacion_codigo} · disponible {movimiento.fila.stock_disponible}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Tipo</label>
                <select
                  value={movimiento.tipo}
                  onChange={(e) => setMovimiento({ ...movimiento, tipo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  {TIPOS_MOVIMIENTO.map((t) => (
                    <option key={t.id} value={t.id}>{t.signo} {t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Cantidad {movimiento.tipo === 'ajuste' ? '(usa negativo para restar)' : ''}
                </label>
                <input
                  type="number"
                  value={movimiento.cantidad}
                  onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Motivo</label>
                <input
                  type="text"
                  value={movimiento.motivo}
                  onChange={(e) => setMovimiento({ ...movimiento, motivo: e.target.value })}
                  placeholder="Ej: compra a proveedor, merma, conteo físico..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setMovimiento(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarMovimiento}
                disabled={guardando}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold"
              >
                {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal transferencia */}
      {transferencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-black text-white mb-1">Transferir stock</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Origen: {transferencia.fila.almacen} · {transferencia.fila.ubicacion_codigo}<br />
              {transferencia.fila.producto} · <span className="font-mono text-rose-400">{transferencia.fila.sku}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={transferencia.cantidad}
                  onChange={(e) => setTransferencia({ ...transferencia, cantidad: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <span className="text-[10px] text-slate-500">Disponible en origen: {transferencia.fila.stock_disponible}</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Ubicación destino</label>
                <select
                  value={transferencia.destino_ubicacion_id}
                  onChange={(e) => setTransferencia({ ...transferencia, destino_ubicacion_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="">Selecciona...</option>
                  {almacenes.map((a) => {
                    const opciones = ubicaciones.filter((u) => Number(u.almacen_id) === Number(a.id));
                    if (opciones.length === 0) return null;
                    return (
                      <optgroup key={a.id} label={a.nombre}>
                        {opciones
                          .filter((u) => Number(u.id) !== Number(transferencia.fila.ubicacion_id))
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.codigo}{u.pasillo ? ` · P${u.pasillo}` : ''}{u.estante ? ` · E${u.estante}` : ''}
                            </option>
                          ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Motivo</label>
                <input
                  type="text"
                  value={transferencia.motivo}
                  onChange={(e) => setTransferencia({ ...transferencia, motivo: e.target.value })}
                  placeholder="Ej: reposición a tienda"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setTransferencia(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarTransferencia}
                disabled={guardando}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold"
              >
                {guardando ? 'Transfiriendo...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
      )}
    </div>
  );
};

export default CrudInventario;
