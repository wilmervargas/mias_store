import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Select } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';
import ModalCombo from './ModalCombo';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const fmtBs = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `Bs ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
};

export default function CrudCombos() {
  const confirmar = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [q, setQ] = useState('');
  const [estatus, setEstatus] = useState('');
  const qDebounced = useDebounce(q);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (qDebounced) params.append('q', qDebounced);
    if (estatus !== '') params.append('idestatus', estatus);
    const res = await api.get('combos', params.toString());
    if (res.success) setItems(res.datos || []);
    else toast.error(res.error || 'No se pudieron cargar los combos');
    setCargando(false);
  }, [qDebounced, estatus, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => { setEditar(null); setModal(true); };
  const abrirEditar = async (c) => {
    const res = await api.get(`combos/${c.id}`);
    setEditar(res.success ? res.datos : c);
    setModal(true);
  };

  const eliminar = async (c) => {
    const ok = await confirmar({
      titulo: 'Eliminar combo',
      mensaje: `Se eliminará "${c.nombre}" (${c.sku}). Esta acción no se puede deshacer.`,
      variante: 'peligro',
    });
    if (!ok) return;
    const res = await api.delete('combos', c.id);
    if (res.success) { toast.exito('Combo eliminado'); cargar(); }
    else toast.error(res.error || 'No se pudo eliminar');
  };

  const columnas = useMemo(() => [
    { header: 'SKU', valor: (r) => r.sku },
    { header: 'Nombre', valor: (r) => r.nombre },
    { header: 'Componentes', valor: (r) => (r.detalle || []).map((d) => `${Number(d.cantidad)}x ${d.codigo_detalle || d.codigo_producto || d.sku_base || d.producto_nombre}`).join(' | ') },
    { header: 'Precio', valor: (r) => Number(r.precio || 0) },
    { header: 'Disponibilidad', valor: (r) => Number(r.disponibilidad || 0) },
    { header: 'Estatus', valor: (r) => Number(r.idestatus) === 1 ? 'Activo' : 'Inactivo' },
  ], []);

  const filtrosReporte = useMemo(() => {
    const f = [];
    if (qDebounced) f.push({ label: 'Búsqueda', value: qDebounced });
    if (estatus !== '') f.push({ label: 'Estatus', value: estatus === '1' ? 'Activo' : 'Inactivo' });
    return f;
  }, [qDebounced, estatus]);

  const exportar = (tipo) => {
    const payload = { nombre: 'reporte_combos', titulo: 'Reporte de Combos', filtros: filtrosReporte, columnas, filas: items };
    if (tipo === 'excel') exportarExcel({ ...payload, hoja: 'Combos' });
    else exportarPDF(payload);
  };

  const hayFiltros = Boolean(q) || estatus !== '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Combos</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Combos con precio propio; la disponibilidad depende del stock de sus componentes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
          <Boton variante="primario" icono="mas" onClick={abrirCrear}>Nuevo combo</Boton>
        </div>
      </div>

      <BarraFiltros total={items.length} etiqueta="combos" onLimpiar={() => { setQ(''); setEstatus(''); }} puedeLimpiar={hayFiltros}>
        <Buscador value={q} onChange={setQ} placeholder="Buscar por SKU o nombre..." />
        <Select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="w-full sm:w-40">
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="2">Inactivos</option>
        </Select>
      </BarraFiltros>

      <Tabla cargando={cargando} filas={items.length} mensajeVacio="No hay combos" columnas={[
        <Th key="img">Img</Th>,
        <Th key="sku">SKU</Th>,
        <Th key="nombre">Combo</Th>,
        <Th key="comp">Componentes</Th>,
        <Th key="precio" className="text-right">Precio</Th>,
        <Th key="disp" className="text-right">Disp.</Th>,
        <Th key="est">Estatus</Th>,
        <Th key="acc" className="text-right">Acciones</Th>,
      ]}>
        {items.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <Td>
              {c.imagen_url ? (
                <img src={c.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Icono nombre="capas" className="w-4 h-4 text-gray-400" /></div>
              )}
            </Td>
            <Td><span className="font-mono text-[10px] text-cyan-500">{c.sku}</span></Td>
            <Td><span className="font-semibold text-gray-900 dark:text-white">{c.nombre}</span></Td>
            <Td>
              <div className="space-y-0.5 text-[10px] text-gray-500 dark:text-gray-400 max-w-[320px]">
                {(c.detalle || []).slice(0, 4).map((d) => (
                  <div key={d.id || d.producto_id} className="truncate">{Number(d.cantidad)} x {d.codigo_detalle || d.codigo_producto || d.sku_base} - {d.producto_nombre}</div>
                ))}
                {(c.detalle || []).length > 4 ? <div>+{(c.detalle || []).length - 4} más</div> : null}
              </div>
            </Td>
            <Td className="text-right font-mono">{fmtBs(c.precio)}</Td>
            <Td className="text-right"><span className={`font-bold ${Number(c.disponibilidad) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{c.disponibilidad ?? 0}</span></Td>
            <Td><BadgeEstado activo={Number(c.idestatus) === 1} /></Td>
            <Td>
              <Acciones>
                <Boton variante="neutral" tamano="sm" icono="editar" onClick={() => abrirEditar(c)} aria-label="Editar" />
                <Boton variante="peligro" tamano="sm" icono="papelera" onClick={() => eliminar(c)} aria-label="Eliminar" />
              </Acciones>
            </Td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <ModalCombo
          comboEditar={editar}
          onClose={() => { setModal(false); setEditar(null); }}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
