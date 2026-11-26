import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import { BarraFiltros } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Acciones, Tabla, Td, Th } from '../ui/Tabla';

const MONEDAS = [
  { id: 'USD', label: 'Dólar BCV', fuente: 'bcv' },
  { id: 'EUR', label: 'Euro BCV', fuente: 'bcv' },
  { id: 'USDT', label: 'USDT', fuente: 'usdt' },
  { id: 'AJU', label: 'Monto personalizado', fuente: 'ajustada' },
];

const FUENTE_LABEL = { bcv: 'BCV', usdt: 'USDT', manual: 'Manual', ajustada: 'Ajustada' };

const fmtMonto = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const fmtFecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
};

const nowLocalInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalInput = (iso) => {
  if (!iso) return nowLocalInput();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowLocalInput();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formVacio = (previas = []) => {
  const usd = previas.find((p) => p.moneda === 'USD');
  return {
    moneda_base: 'USD',
    tasa: usd?.tasa ?? '',
    fuente: 'bcv',
    vigente_desde: nowLocalInput(),
  };
};

const ModuloDivisas = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [resumen, setResumen] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio());
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [filtros, setFiltros] = useState({ moneda_base: '', fuente: '', desde: '', hasta: '' });

  const cargarResumen = useCallback(async () => {
    const res = await api.get('tasas-cambio/resumen');
    if (res.success) setResumen(res.datos?.monedas || res.datos?.resumen?.monedas || []);
  }, []);

  const cargarTasas = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (filtros.moneda_base) params.append('moneda_base', filtros.moneda_base);
    if (filtros.fuente) params.append('fuente', filtros.fuente);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    const res = await api.get('tasas-cambio', params.toString());
    if (res.success) setTasas(res.datos || []);
    else toast.error(res.error || 'No se pudieron cargar las tasas');
    setCargando(false);
  }, [filtros, toast]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);
  useEffect(() => { cargarTasas(); }, [cargarTasas]);

  const resumenPorMoneda = useMemo(() => {
    const map = new Map(resumen.map((r) => [r.moneda, r]));
    return MONEDAS.map((m) => ({ ...m, ...(map.get(m.id) || {}) }));
  }, [resumen]);

  const abrirCrear = (monedaBase) => {
    const previa = resumen.find((r) => r.moneda === monedaBase);
    const base = monedaBase || 'USD';
    const cfg = MONEDAS.find((m) => m.id === base);
    setEditando(null);
    setForm({
      moneda_base: base,
      tasa: previa?.tasa ?? '',
      fuente: cfg?.fuente || 'manual',
      vigente_desde: nowLocalInput(),
    });
    setModalAbierto(true);
  };

  const abrirEditar = (tasa) => {
    setEditando(tasa);
    setForm({
      moneda_base: tasa.moneda_base,
      tasa: tasa.tasa ?? '',
      fuente: tasa.fuente || 'manual',
      vigente_desde: toLocalInput(tasa.vigente_desde),
    });
    setModalAbierto(true);
  };

  const onChangeMoneda = (moneda_base) => {
    const cfg = MONEDAS.find((m) => m.id === moneda_base);
    const previa = resumen.find((r) => r.moneda === moneda_base);
    setForm((prev) => ({
      ...prev,
      moneda_base,
      fuente: cfg?.fuente || prev.fuente || 'manual',
      tasa: previa?.tasa ?? prev.tasa ?? '',
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    const tasaNum = Number(form.tasa);
    if (!form.moneda_base) return toast.error('Selecciona una moneda.');
    if (!Number.isFinite(tasaNum) || tasaNum <= 0) return toast.error('La tasa debe ser mayor que cero.');
    if (!form.vigente_desde) return toast.error('Indica la fecha y hora de vigencia.');

    setGuardando(true);
    const payload = {
      moneda: 'VES',
      moneda_base: form.moneda_base,
      tasa: tasaNum,
      fuente: form.fuente,
      vigente_desde: new Date(form.vigente_desde).toISOString(),
    };
    const res = editando
      ? await api.put('tasas-cambio', editando.id, payload)
      : await api.post('tasas-cambio', payload);
    setGuardando(false);

    if (!res.success) return toast.error(res.error || 'No se pudo guardar la tasa');
    toast.exito(editando ? 'Tasa actualizada' : 'Tasa registrada');
    setModalAbierto(false);
    setEditando(null);
    cargarResumen();
    cargarTasas();
  };

  const eliminar = async (tasa) => {
    const ok = await confirmar({
      titulo: 'Eliminar tasa',
      mensaje: `¿Eliminar la tasa ${tasa.moneda_base} de Bs ${fmtMonto(tasa.tasa)}?`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: ['Esta acción no se puede deshacer.', 'Los documentos ya registrados conservan su tasa congelada.'],
    });
    if (!ok) return;
    const res = await api.delete('tasas-cambio', tasa.id);
    if (!res.success) return toast.error(res.error || 'No se pudo eliminar la tasa');
    toast.exito('Tasa eliminada');
    cargarResumen();
    cargarTasas();
  };

  const limpiar = () => setFiltros({ moneda_base: '', fuente: '', desde: '', hasta: '' });
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Divisas y tasas de cambio</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Actualiza diariamente el dólar, euro, USDT y un monto personalizado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="refrescar" cargando={sincronizando} onClick={async () => {
            setSincronizando(true);
            const res = await api.post('tasas-cambio/sincronizar', {});
            setSincronizando(false);
            if (!res.success) return toast.error(res.error || 'No se pudo sincronizar');
            const monedas = res.datos?.resumen?.monedas;
            if (monedas) setResumen(monedas);
            toast.exito(res.datos?.mensaje || 'Tasas sincronizadas');
            cargarTasas();
          }}>Sincronizar hoy</Boton>
          <Boton variante="primario" icono="mas" onClick={() => abrirCrear('USD')}>Registrar tasa</Boton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {resumenPorMoneda.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">{r.label}</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                  <span className="text-base mr-1">Bs</span>{fmtMonto(r.tasa)}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">por 1 {r.id === 'AJU' ? 'unidad' : r.id}</p>
              </div>
              {r.tasa ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.es_del_dia ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                  {r.es_del_dia ? 'Del día' : 'Anterior'}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-gray-500">
              <span>{r.tasa ? `${FUENTE_LABEL[r.fuente] || r.fuente} · ${fmtFecha(r.vigente_desde)}` : 'Sin tasa registrada'}</span>
              <Boton tamano="sm" variante="neutral" onClick={() => abrirCrear(r.id)}>{r.tasa ? 'Actualizar' : 'Registrar'}</Boton>
            </div>
          </div>
        ))}
      </div>

      <BarraFiltros total={tasas.length} etiqueta="tasas" onLimpiar={limpiar} puedeLimpiar={hayFiltros}>
        <Select value={filtros.moneda_base} onChange={(e) => setFiltros({ ...filtros, moneda_base: e.target.value })} className="md:w-44">
          <option value="">Todas las monedas</option>
          {MONEDAS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </Select>
        <Select value={filtros.fuente} onChange={(e) => setFiltros({ ...filtros, fuente: e.target.value })} className="md:w-40">
          <option value="">Todas las fuentes</option>
          <option value="bcv">BCV</option>
          <option value="usdt">USDT</option>
          <option value="manual">Manual</option>
          <option value="ajustada">Ajustada</option>
        </Select>
        <Input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} className="md:w-40" />
        <Input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} className="md:w-40" />
      </BarraFiltros>

      <Tabla
        colSpan={6}
        cargando={cargando}
        vacio={tasas.length === 0}
        textoVacio="No hay tasas registradas."
        cabecera={<><Th>Vigencia</Th><Th>Moneda</Th><Th align="right">Tasa (Bs)</Th><Th>Fuente</Th><Th>Registrada</Th><Th align="right">Acciones</Th></>}
      >
        {tasas.map((t) => (
          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            <Td className="text-gray-500">{fmtFecha(t.vigente_desde)}</Td>
            <Td className="font-bold text-gray-900 dark:text-white">{MONEDAS.find((m) => m.id === t.moneda_base)?.label || t.moneda_base}</Td>
            <Td align="right" className="font-mono font-bold text-gray-900 dark:text-white">Bs {fmtMonto(t.tasa)}</Td>
            <Td><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{FUENTE_LABEL[t.fuente] || t.fuente}</span></Td>
            <Td className="text-gray-500 text-[11px]">{fmtFecha(t.created_at)}</Td>
            <Td align="right">
              <Acciones>
                <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(t)}>Editar</Boton>
                <Boton tamano="sm" variante="peligro" icono="papelera" onClick={() => eliminar(t)}>Eliminar</Boton>
              </Acciones>
            </Td>
          </tr>
        ))}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar tasa' : 'Registrar tasa'}
          subtitulo="La tasa se guarda como bolívares por 1 unidad."
          icono="dinero"
          onClose={() => { setModalAbierto(false); setEditando(null); }}
          footer={<>
            <Boton variante="neutral" onClick={() => { setModalAbierto(false); setEditando(null); }}>Cancelar</Boton>
            <Boton type="submit" form="form-tasa" variante="exito" icono="guardar" cargando={guardando}>Guardar</Boton>
          </>}
        >
          <form id="form-tasa" onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="Moneda" required>
                <Select required value={form.moneda_base} onChange={(e) => onChangeMoneda(e.target.value)}>
                  {MONEDAS.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.id})</option>)}
                </Select>
              </Campo>
              <Campo label="Tasa (Bs por 1 unidad)" required>
                <Input required type="number" step="0.01" min="0" value={form.tasa} onChange={(e) => setForm({ ...form, tasa: e.target.value })} placeholder="36.50" />
              </Campo>
              <Campo label="Fuente" required>
                <Select required value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })}>
                  {form.moneda_base !== 'USDT' && form.moneda_base !== 'AJU' ? <option value="bcv">BCV</option> : null}
                  <option value="usdt">USDT / paralelo</option>
                  <option value="manual">Manual</option>
                  <option value="ajustada">Ajustada</option>
                </Select>
              </Campo>
              <Campo label="Vigente desde" required>
                <Input required type="datetime-local" value={form.vigente_desde} onChange={(e) => setForm({ ...form, vigente_desde: e.target.value })} />
              </Campo>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
              Se guardará <strong>1 {form.moneda_base} = Bs {fmtMonto(form.tasa || 0)}</strong> ({FUENTE_LABEL[form.fuente] || form.fuente}).
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ModuloDivisas;
