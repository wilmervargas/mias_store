import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { BadgeEstado } from '../ui/Tabla';
import { api } from '../../services/api';

const fmt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};
const txt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

const Stat = ({ label, value, tone = 'gray', sub }) => {
  const tones = {
    gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800',
    emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    cyan: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20',
    rose: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20',
    amber: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.gray}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-black text-gray-900 dark:text-white break-words">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{sub}</p> : null}
    </div>
  );
};

const InfoItem = ({ label, value, children }) => (
  <div className="py-2 min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
    {children ? <div className="mt-0.5">{children}</div> : <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-100 break-words">{value}</p>}
  </div>
);

function normalizarImagenes(producto, imgsApi) {
  const lista = [];
  const push = (src) => {
    if (!src) return;
    const key = String(src);
    if (lista.some((x) => x.key === key)) return;
    lista.push({ key, src });
  };
  const toUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `http://localhost:8000/imagenes/${img}`;
    const raw = img.url || img.imagen || img.ruta || img.archivo || img.nombre;
    if (!raw) return null;
    return String(raw).startsWith('http') ? String(raw) : `http://localhost:8000/imagenes/${raw}`;
  };
  if (Array.isArray(imgsApi)) imgsApi.forEach((img) => push(toUrl(img)));
  if (Array.isArray(producto?.imagenes)) producto.imagenes.forEach((img) => push(toUrl(img)));
  push(toUrl(producto?.imagen));
  if (lista.length === 0) {
    lista.push({
      key: 'sin-imagen',
      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%" height="100%" fill="%23111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="34" font-family="Arial">Sin imagen</text></svg>',
    });
  }
  return lista;
}

function ColorDot({ nombre, hex }) {
  const color = hex || '#9ca3af';
  const claro = ['#ffffff', '#fff', '#f5f5f5', '#f3f4f6'].includes(String(color).toLowerCase());
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className={`h-4 w-4 rounded-full border shrink-0 ${claro ? 'border-gray-300' : 'border-white/20'}`} style={{ background: color }} />
      <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{txt(nombre)}</span>
    </span>
  );
}

function TallaBadge({ value }) {
  const v = txt(value);
  return <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-black text-gray-700 dark:bg-gray-800 dark:text-gray-200">{v}</span>;
}

export default function ModalDetalleProducto({ producto, onClose }) {
  const [detalle, setDetalle] = useState(producto || null);
  const [imagenes, setImagenes] = useState([]);
  const [coloresCat, setColoresCat] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fotoActiva, setFotoActiva] = useState(0);

  useEffect(() => { setDetalle(producto || null); setFotoActiva(0); }, [producto]);

  useEffect(() => {
    if (!producto?.id) return;
    let vivo = true;
    setCargando(true);
    Promise.all([
      api.get(`productos/${producto.id}`),
      api.get(`productos/${producto.id}/imagenes`),
      api.get('colores'),
    ]).then(([resProd, resImgs, resCol]) => {
      if (!vivo) return;
      if (resProd?.success && resProd.datos) {
        const d = resProd.datos;
        setDetalle((prev) => ({ ...(prev || {}), ...d, filas: d.filas ?? prev?.filas ?? d.presentaciones ?? prev?.presentaciones ?? [] }));
      }
      if (resImgs?.success) setImagenes(Array.isArray(resImgs.datos) ? resImgs.datos : []);
      if (resCol?.success) setColoresCat(Array.isArray(resCol.datos) ? resCol.datos : []);
    }).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [producto?.id]);

  const p = detalle || producto || {};
  const fotos = useMemo(() => normalizarImagenes(p, imagenes), [p, imagenes]);
  const activa = fotos[Math.min(fotoActiva, fotos.length - 1)] || fotos[0];
  if (!producto) return null;

  const activo = Number(p.idestatus) === 1;
  const filas = Array.isArray(p.filas) ? p.filas : (Array.isArray(p.presentaciones) ? p.presentaciones : []);
  const stockTotal = filas.length > 0 ? filas.reduce((acc, f) => acc + Number(f.stock || 0), 0) : Number(p.stock || 0);
  const tipo = p.es_base ? 'Producto base' : (p.producto_base_id ? 'Presentación' : 'Producto simple');

  const hexPorColor = (f) => {
    const directo = f.codigo_hex || f.color_hex || f.hex;
    if (directo) return directo;
    const id = f.idcolor ?? f.color_id;
    const nombre = String(f.color || f.color_nombre || '').toLowerCase();
    const found = coloresCat.find((c) => String(c.id) === String(id) || String(c.nombre || '').toLowerCase() === nombre);
    return found?.codigo_hex || found?.hex || null;
  };

  return (
    <Modal
      titulo={p.nombre || 'Detalle de producto'}
      subtitulo={`${p.codigo_producto || p.sku_base || `ID #${p.id || ''}`} · Solo visualización`}
      icono="producto"
      onClose={onClose}
      ancho="max-w-6xl"
      footer={<Boton variante="neutral" onClick={onClose}>Cerrar</Boton>}
    >
      <div className="space-y-4">
        {cargando ? (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
            Cargando información completa e imágenes vinculadas...
          </div>
        ) : null}

        <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-3 dark:border-gray-800 dark:from-gray-900/70 dark:to-gray-950/40">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_1fr] gap-3 items-start">
            <div className="relative overflow-hidden rounded-2xl bg-gray-950/5 dark:bg-gray-950">
              <img
                src={activa?.src}
                alt={p.nombre || 'Producto'}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%" height="100%" fill="%23111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="34" font-family="Arial">Sin imagen</text></svg>'; }}
                className="w-full h-[260px] sm:h-[320px] object-contain"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <BadgeEstado activo={activo} />
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700 shadow dark:bg-gray-900/80 dark:text-gray-200">{tipo}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Fotos vinculadas ({fotos.length})</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {fotos.map((f, i) => (
                  <button key={f.key} type="button" onClick={() => setFotoActiva(i)} className={`rounded-xl border overflow-hidden transition ${i === fotoActiva ? 'border-rose-500 ring-2 ring-rose-500/25' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`} title={`Foto ${i + 1}`}>
                    <img src={f.src} alt={`Foto ${i + 1}`} className="h-16 w-full object-cover bg-white dark:bg-gray-950" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.opacity = '0.3'; }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                    {txt(p.categoria || p.categoria_nombre)}
                  </span>
                  {p.subcategoria || p.subcategoria_nombre ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {txt(p.subcategoria || p.subcategoria_nombre)}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-gray-900 dark:text-white break-words">{txt(p.nombre)}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">{txt(p.descripcion)}</p>
              </div>
              <div className="shrink-0 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Código</p>
                <p className="font-mono text-sm sm:text-base font-black text-cyan-700 dark:text-cyan-300 break-all">{txt(p.codigo_producto || p.sku_base)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Stock total" value={`${stockTotal}`} sub={txt(p.unidad_abreviatura || p.unidad_medida)} tone={stockTotal > 0 ? 'emerald' : 'rose'} />
              <Stat label="Costo" value={p.costo != null ? `Bs ${fmt(p.costo)}` : '—'} />
              <Stat label="Precio" value={p.precio != null ? `Bs ${fmt(p.precio)}` : '—'} tone="cyan" />
              <Stat label="Precio full" value={p.preciofull != null ? `Bs ${fmt(p.preciofull)}` : '—'} tone="amber" />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900/40">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2"><Icono nombre="producto" className="w-4 h-4" /> Datos generales</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
              {[
                ['Marca', txt(p.marca || p.marca_nombre)],
                ['Modelo', txt(p.modelo || p.modelo_nombre)],
                ['Unidad', txt(p.unidad_abreviatura || p.unidad_medida || p.unidad_nombre)],
                ['Stock inicial', txt(p.stock_inicial)],
                ['Stock mínimo', txt(p.stock_minimo)],
                ['Stock máximo', txt(p.stock_maximo)],
                ['Estatus', activo ? 'Activo' : 'Inactivo'],
                ['Tipo', tipo],
                ['ID', txt(p.id)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/30 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-100 break-words">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2"><Icono nombre="ajustes" className="w-4 h-4" /> Identificadores y trazabilidad</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <InfoItem label="ID categoría" value={txt(p.idcategoria)} />
              <InfoItem label="ID subcategoría" value={txt(p.idsubcategoria)} />
              <InfoItem label="ID marca" value={txt(p.idmarca)} />
              <InfoItem label="ID modelo" value={txt(p.idmodelo)} />
              <InfoItem label="ID unidad" value={txt(p.idunidad)} />
              <InfoItem label="Producto base ID" value={txt(p.producto_base_id)} />
              <InfoItem label="Creado" value={txt(p.created_at)} />
              <InfoItem label="Actualizado" value={txt(p.updated_at)} />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2"><Icono nombre="imagen" className="w-4 h-4" /> Resumen visual</h4>
            <div className="space-y-3">
              <InfoItem label="Colores presentes">
                <div className="flex flex-wrap gap-2 mt-1">
                  {[...new Map(filas.map((f) => {
                    const nombre = f.color || f.color_nombre || '—';
                    return [String(f.idcolor || nombre), { nombre, hex: hexPorColor(f) }];
                  })).values()].filter((c) => c.nombre !== '—').map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
                      <span className="h-3.5 w-3.5 rounded-full border border-gray-300" style={{ background: c.hex || '#9ca3af' }} />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{c.nombre}</span>
                    </span>
                  ))}
                  {filas.length === 0 ? <span className="text-xs text-gray-500">—</span> : null}
                </div>
              </InfoItem>
              <InfoItem label="Tallas presentes">
                <div className="flex flex-wrap gap-2 mt-1">
                  {[...new Set(filas.map((f) => f.talla || f.talla_nombre).filter(Boolean))].map((t, i) => <TallaBadge key={i} value={t} />)}
                  {[...new Set(filas.map((f) => f.talla || f.talla_nombre).filter(Boolean))].length === 0 ? <span className="text-xs text-gray-500">—</span> : null}
                </div>
              </InfoItem>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2"><Icono nombre="inventario" className="w-4 h-4" /> Presentaciones / información específica</h4>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{filas.length} registro(s)</span>
          </div>

          {filas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Este producto no tiene presentaciones registradas.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-[11px] min-w-[960px]">
                  <thead className="bg-gray-50/80 dark:bg-gray-900/70 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold">ID</th>
                      <th className="px-3 py-2.5 text-left font-bold">Código</th>
                      <th className="px-3 py-2.5 text-left font-bold">Color</th>
                      <th className="px-3 py-2.5 text-left font-bold">Talla</th>
                      <th className="px-3 py-2.5 text-left font-bold">Almacén / Ubic.</th>
                      <th className="px-3 py-2.5 text-right font-bold">Costo</th>
                      <th className="px-3 py-2.5 text-right font-bold">Precio</th>
                      <th className="px-3 py-2.5 text-right font-bold">P. Full</th>
                      <th className="px-3 py-2.5 text-right font-bold">Stock ini.</th>
                      <th className="px-3 py-2.5 text-right font-bold">Stock</th>
                      <th className="px-3 py-2.5 text-left font-bold">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => {
                      const alm = f.almacen || {};
                      const ubi = f.ubicacion || {};
                      const est = Number(f.idestatus ?? f.estatus ?? 1) === 1;
                      return (
                        <tr key={f.id || i} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/30 align-top">
                          <td className="px-3 py-2.5 text-gray-500">{txt(f.id || f.producto_id)}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{txt(f.codigo_detalle || f.sku)}</div>
                            <div className="font-mono text-[10px] text-gray-400">{txt(f.codigo_barras)}</div>
                          </td>
                          <td className="px-3 py-2.5"><ColorDot nombre={f.color || f.color_nombre} hex={hexPorColor(f)} /></td>
                          <td className="px-3 py-2.5"><TallaBadge value={f.talla || f.talla_nombre} /></td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-gray-800 dark:text-gray-100">{txt(alm.nombre || alm.codigo || f.almacen_nombre || f.almacen_id)}</div>
                            <div className="text-[10px] text-gray-500">{txt(ubi.codigo || ubi.ruta || f.ubicacion_codigo || f.ubicacion_id)}</div>
                          </td>
                          <td className="px-3 py-2.5 text-right">{f.costo != null ? fmt(f.costo) : '—'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-white">{f.precio != null ? fmt(f.precio) : '—'}</td>
                          <td className="px-3 py-2.5 text-right">{f.preciofull != null ? fmt(f.preciofull) : '—'}</td>
                          <td className="px-3 py-2.5 text-right">{txt(f.stock_inicial)}</td>
                          <td className="px-3 py-2.5 text-right"><span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${Number(f.stock || 0) > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{txt(f.stock)}</span></td>
                          <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${est ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{est ? 'Activo' : 'Inactivo'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filas.map((f, i) => {
                  const alm = f.almacen || {};
                  const ubi = f.ubicacion || {};
                  const est = Number(f.idestatus ?? f.estatus ?? 1) === 1;
                  return (
                    <div key={f.id || i} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 break-all">{txt(f.codigo_detalle || f.sku)}</p>
                          <p className="text-[10px] text-gray-500 font-mono break-all">{txt(f.codigo_barras)}</p>
                        </div>
                        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${est ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{est ? 'Activo' : 'Inactivo'}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ColorDot nombre={f.color || f.color_nombre} hex={hexPorColor(f)} />
                        <TallaBadge value={f.talla || f.talla_nombre} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">Almacén</p><p className="font-semibold text-gray-800 dark:text-gray-100 break-words">{txt(alm.nombre || alm.codigo || f.almacen_nombre || f.almacen_id)}</p></div>
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">Ubicación</p><p className="font-semibold text-gray-800 dark:text-gray-100 break-words">{txt(ubi.codigo || ubi.ruta || f.ubicacion_codigo || f.ubicacion_id)}</p></div>
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">Costo</p><p className="font-semibold">{f.costo != null ? `Bs ${fmt(f.costo)}` : '—'}</p></div>
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">Precio</p><p className="font-semibold">{f.precio != null ? `Bs ${fmt(f.precio)}` : '—'}</p></div>
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">P. Full</p><p className="font-semibold">{f.preciofull != null ? `Bs ${fmt(f.preciofull)}` : '—'}</p></div>
                        <div><p className="text-gray-400 uppercase font-bold text-[10px]">Stock ini. / Stock</p><p className="font-semibold">{txt(f.stock_inicial)} / {txt(f.stock)}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
