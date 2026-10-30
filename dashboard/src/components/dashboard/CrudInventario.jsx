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
      )}
    </div>
  );
};

export default CrudInventario;
