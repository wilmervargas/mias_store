import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import { BadgeEstado } from '../ui/Tabla';

const fmt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};
const txt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

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
      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%25" height="100%25" fill="%23111827"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="34" font-family="Arial">Sin imagen</text></svg>',
    });
  }
  return lista;
}

export default function ModalVerProducto({ producto, onClose }) {
  const [detalle, setDetalle] = useState(producto || null);
  const [imagenes, setImagenes] = useState([]);
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
    ]).then(([resProd, resImgs]) => {
      if (!vivo) return;
      if (resProd?.success && resProd.datos) {
        const d = resProd.datos;
        setDetalle((prev) => ({ ...(prev || {}), ...d, filas: d.filas ?? prev?.filas ?? d.presentaciones ?? prev?.presentaciones ?? [] }));
      }
      if (resImgs?.success) setImagenes(Array.isArray(resImgs.datos) ? resImgs.datos : []);
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

  const grupos = [];
  const map = new Map();
  filas.forEach((f) => {
    const almObj = f.almacen || {};
    const ubic0 = (Array.isArray(f.ubicaciones) ? f.ubicaciones[0] : null) || f.ubicacion || {};
    const spa0 = (Array.isArray(f.stock_por_almacen) ? f.stock_por_almacen[0] : null) || {};
    const almId = almObj.almacen_id || almObj.id || f.almacen_id || ubic0.almacen_id || spa0.almacen_id || 'sin';
    const key = String(almId);
    if (!map.has(key)) {
      map.set(key, {
        key,
        almacen: {
          ...spa0,
          ...ubic0,
          ...almObj,
          codigo: almObj.codigo || almObj.almacen_codigo || ubic0.almacen_codigo || spa0.codigo || spa0.almacen_codigo || f.almacen_codigo,
          nombre: almObj.nombre || almObj.almacen || ubic0.almacen || spa0.nombre || spa0.almacen || f.almacen_nombre,
          almacen_id: almId,
        },
        almacen_id: almId,
        items: [],
      });
      grupos.push(map.get(key));
    } else {
      const g = map.get(key);
      if (!g.almacen.codigo) g.almacen.codigo = almObj.codigo || almObj.almacen_codigo || ubic0.almacen_codigo || spa0.codigo || spa0.almacen_codigo || f.almacen_codigo;
      if (!g.almacen.nombre) g.almacen.nombre = almObj.nombre || almObj.almacen || ubic0.almacen || spa0.nombre || spa0.almacen || f.almacen_nombre;
    }
    map.get(key).items.push(f);
  });

  return (
    <Modal
      titulo={txt(p.nombre)}
      subtitulo={`${txt(p.codigo_producto || p.sku_base)} · Solo visualización`}
      icono="producto"
      onClose={onClose}
      maxW="max-w-6xl"
      footer={<Boton variante="neutral" onClick={onClose}>Cerrar</Boton>}
    >
      <div className="space-y-4">
        {cargando ? <div className="text-[11px] text-cyan-600 dark:text-cyan-300">Cargando información completa...</div> : null}

        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-950 min-h-[340px] sm:min-h-[460px] flex items-center justify-center">
              <img
                src={activa?.src}
                alt={p.nombre || 'Producto'}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%25" height="100%25" fill="%23111827"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="34" font-family="Arial">Sin imagen</text></svg>'; }}
                className="max-h-[460px] w-full object-contain"
              />
              <div className="absolute left-3 top-3"><BadgeEstado activo={activo} /></div>
            </div>
            {fotos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {fotos.map((f, i) => (
                  <button key={f.key} type="button" onClick={() => setFotoActiva(i)} className={`shrink-0 rounded-xl border overflow-hidden ${i === fotoActiva ? 'border-rose-500 ring-2 ring-rose-500/25' : 'border-gray-200 dark:border-gray-700'}`}>
                    <img src={f.src} alt={`Foto ${i + 1}`} className="h-16 w-16 sm:h-20 sm:w-20 object-cover bg-white dark:bg-gray-950" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 min-w-0">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{txt(p.categoria || p.categoria_nombre)}</span>
                {p.subcategoria || p.subcategoria_nombre ? <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{txt(p.subcategoria || p.subcategoria_nombre)}</span> : null}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{txt(p.descripcion)}</p>

              {(() => {
                const costos = filas.length ? filas.map((f) => Number(f.costo)).filter((n) => Number.isFinite(n)) : [Number(p.costo)].filter((n) => Number.isFinite(n));
                const precios = filas.length ? filas.map((f) => Number(f.precio)).filter((n) => Number.isFinite(n)) : [Number(p.precio)].filter((n) => Number.isFinite(n));
                const costoTxt = costos.length ? (Math.min(...costos) === Math.max(...costos) ? `Bs ${fmt(costos[0])}` : `Bs ${fmt(Math.min(...costos))} - ${fmt(Math.max(...costos))}`) : '—';
                const precioTxt = precios.length ? (Math.min(...precios) === Math.max(...precios) ? `Bs ${fmt(precios[0])}` : `Bs ${fmt(Math.min(...precios))} - ${fmt(Math.max(...precios))}`) : '—';
                return (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/30">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Costo</p>
                      <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">{costoTxt}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Precio</p>
                      <p className="mt-1 text-sm font-black text-cyan-700 dark:text-cyan-300">{precioTxt}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Stock</p>
                      <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">{stockTotal} <span className="text-[10px] font-bold">{txt(p.unidad_abreviatura || p.unidad_medida)}</span></p>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950/30"><p className="text-gray-400 uppercase font-bold text-[10px]">Marca</p><p className="font-semibold">{txt(p.marca || p.marca_nombre)}</p></div>
                <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950/30"><p className="text-gray-400 uppercase font-bold text-[10px]">Modelo</p><p className="font-semibold">{txt(p.modelo || p.modelo_nombre)}</p></div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-3">Presentaciones</p>
              {filas.length === 0 ? (
                <p className="text-xs text-gray-500">Sin presentaciones registradas.</p>
              ) : (
                <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-[11px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/70 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold">Almacén</th>
                        <th className="px-3 py-2 text-left font-bold">Ubicación</th>
                        <th className="px-3 py-2 text-left font-bold">Color / Talla</th>
                        <th className="px-3 py-2 text-right font-bold">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupos.flatMap((g) => g.items.map((f, i) => {
                        const ubics = Array.isArray(f.ubicaciones) ? f.ubicaciones : (f.ubicacion ? [f.ubicacion] : []);
                        const ubicCod = [...new Set(ubics.map((u) => u.ubicacion_codigo || u.codigo || u.ruta).filter(Boolean))].join(', ') || f.ubicacion_codigo || f.ubicacion?.codigo || '-';
                        const stockFila = Number(f.stock ?? 0);
                        const almLabel = g.almacen?.codigo || g.almacen?.almacen_codigo || f.almacen_codigo || g.almacen?.nombre || (g.key === 'sin' ? 'Sin almacén' : `Almacén ${g.key}`);
                        return (
                          <tr key={`${g.key}-${f.id || i}`} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                            <td className="px-3 py-2 align-middle">
                              {i === 0 ? (
                                <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">{almLabel}</span>
                              ) : <span className="text-transparent select-none">.</span>}
                            </td>
                            <td className="px-3 py-2 align-middle font-mono text-[10px] text-gray-600 dark:text-gray-300">{ubicCod}</td>
                            <td className="px-3 py-2 align-middle">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm dark:border-gray-600 shrink-0" style={{ background: f.color_hex || f.codigo_hex || '#d1d5db' }} title={f.color || f.color_nombre || ''} />
                                <span className="text-gray-700 dark:text-gray-200">{txt(f.color || f.color_nombre)}</span>
                                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{txt(f.talla || f.talla_nombre)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-middle text-right">
                              <span className={`font-bold ${stockFila <= 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{stockFila}</span>
                              <span className="ml-1 text-[10px] text-gray-500">{txt(p.unidad_abreviatura || p.unidad_medida)}</span>
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
