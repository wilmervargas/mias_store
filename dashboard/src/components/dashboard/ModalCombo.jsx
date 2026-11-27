import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useConfirm } from '../ui/ConfirmProvider';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { Campo, Input, Select } from '../ui/Campo';
import { fmtNumero } from '../../utils/formato';

const vacio = { sku: '', nombre: '', precio: '0.00', idestatus: 1, imagen: '' };
const compVacio = () => ({ _key: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, producto_id: '', cantidad: '1' });

export default function ModalCombo({ comboEditar, onClose, onGuardado }) {
  const confirmar = useConfirm();
  const editando = Boolean(comboEditar?.id);
  const [form, setForm] = useState(vacio);
  const [componentes, setComponentes] = useState([compVacio()]);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargandoProductos(true);
    api.get('combos/productos-disponibles').then((r) => {
      if (!activo) return;
      if (r.success) setProductos(r.datos || []);
      else { console.error('productos-disponibles', r); setProductos([]); }
    }).finally(() => { if (activo) setCargandoProductos(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!comboEditar) return;
    setForm({
      sku: comboEditar.sku || '',
      nombre: comboEditar.nombre || '',
      precio: comboEditar.precio ?? '0.00',
      idestatus: comboEditar.idestatus ?? 1,
      imagen: comboEditar.imagen || '',
    });
    const det = Array.isArray(comboEditar.detalle) ? comboEditar.detalle : [];
    setComponentes(det.length ? det.map((d) => ({
      _key: `e-${d.id || d.producto_id}-${Math.random().toString(36).slice(2, 6)}`,
      producto_id: String(d.producto_id || ''),
      cantidad: String(d.cantidad ?? '1'),
    })) : [compVacio()]);
    setPreview(comboEditar.imagen_url || null);
  }, [comboEditar]);

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setComp = (key, k, v) => setComponentes((prev) => prev.map((c) => c._key === key ? { ...c, [k]: v } : c));
  const agregarComp = () => setComponentes((prev) => [...prev, compVacio()]);
  const quitarComp = async (key) => {
    if (componentes.length === 1) return;
    const ok = await confirmar({ titulo: 'Quitar componente', mensaje: '¿Quitar este componente del combo?', variante: 'peligro' });
    if (ok) setComponentes((prev) => prev.filter((c) => c._key !== key));
  };

  const productosPorId = useMemo(() => {
    const m = new Map();
    productos.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [productos]);

  const disponibilidad = useMemo(() => {
    const vals = componentes.map((c) => {
      const p = productosPorId.get(String(c.producto_id));
      const cant = Number(c.cantidad || 0);
      if (!p || cant <= 0) return null;
      return Math.floor(Number(p.stock || 0) / cant);
    }).filter((v) => v !== null);
    return vals.length ? Math.max(0, Math.min(...vals)) : 0;
  }, [componentes, productosPorId]);

  const onImagen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setImagenArchivo(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const comps = componentes
      .filter((c) => c.producto_id)
      .map((c) => ({ producto_id: Number(c.producto_id), cantidad: Number(c.cantidad) }));
    if (comps.length === 0) { alert('Agrega al menos un componente.'); return; }

    setGuardando(true);
    try {
      const payload = {
        sku: form.sku,
        nombre: form.nombre,
        precio: Number(form.precio || 0),
        idestatus: Number(form.idestatus),
        componentes: comps,
      };
      const res = editando ? await api.put('combos', comboEditar.id, payload) : await api.post('combos', payload);
      if (!res?.success) {
        console.error('Combo guardar error:', res);
        const msg = Array.isArray(res?.error) ? res.error.join(', ') : (res?.error || 'No se pudo guardar el combo');
        alert(msg);
        return;
      }
      const comboId = res.datos?.id || res.datos?.combo?.id || comboEditar?.id;

      if (imagenArchivo && comboId) {
        const up = await api.subirImagen('combos', comboId, imagenArchivo);
        if (!up.success) alert(up.error || 'Combo guardado, pero la imagen no se pudo subir');
      }

      onGuardado?.();
      onClose();
    } catch (err) {
      alert(err?.message || 'Error al guardar el combo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={editando ? 'Editar combo' : 'Nuevo combo'}
      subtitulo={editando ? `SKU: ${comboEditar?.sku || ''}` : 'Crea un combo con precio propio y componentes'}
      icono="capas"
      onClose={onClose}
      maxW="max-w-5xl"
      footer={(
        <>
          <Boton variante="neutral" onClick={onClose}>Cancelar</Boton>
          <Boton type="submit" form="form-combo" variante="primario" icono="guardar" cargando={guardando}>
            {guardando ? 'Guardando...' : 'Guardar combo'}
          </Boton>
        </>
      )}
    >
      <form id="form-combo" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Imagen</p>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/40">
              <input type="file" accept="image/*" className="hidden" onChange={onImagen} />
              {preview ? (
                <img src={preview} alt="Combo" className="h-40 w-full rounded-xl object-contain bg-white dark:bg-gray-950" />
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                  <Icono nombre="imagen" className="w-8 h-8 mb-2" />
                  <span className="text-[11px] font-semibold">Subir imagen</span>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Campo label="SKU" hint="Auto si se deja vacío">
                <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="font-mono" placeholder="COMBO-001" />
              </Campo>
              <Campo label="Nombre" required className="md:col-span-2">
                <Input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre del combo" />
              </Campo>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Campo label="Precio" required>
                <Input type="number" step="0.01" min="0" required value={form.precio} onChange={(e) => set('precio', e.target.value)} />
              </Campo>
              <Campo label="Estado">
                <Select value={form.idestatus} onChange={(e) => set('idestatus', e.target.value)}>
                  <option value={1}>Activo</option>
                  <option value={2}>Inactivo</option>
                </Select>
              </Campo>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Disponibilidad</p>
                <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">{disponibilidad}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">Componentes</p>
              <p className="text-[11px] text-gray-500">Solo presentaciones vendibles. La disponibilidad se calcula por el stock de estos productos.</p>
            </div>
            <Boton type="button" variante="neutral" icono="mas" onClick={agregarComp}>Agregar</Boton>
          </div>
          {!cargandoProductos && productos.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              No hay presentaciones disponibles para agregar. Verifica que existan productos con presentaciones activas.
            </div>
          ) : null}

          <div className="space-y-2">
            {componentes.map((c, idx) => {
              const p = productosPorId.get(String(c.producto_id));
              return (
                <div key={c._key} className="grid grid-cols-1 md:grid-cols-[1fr_130px_90px_40px] gap-2 items-end rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <Campo label={idx === 0 ? 'Producto / presentación' : undefined}>
                    <Select value={c.producto_id} onChange={(e) => setComp(c._key, 'producto_id', e.target.value)}>
                      <option value="">Selecciona...</option>
                      {productos.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {(prod.codigo_detalle || prod.codigo_producto || prod.sku_base)} - {prod.nombre} {prod.color ? `(${prod.color}` : ''}{prod.talla ? `/${prod.talla})` : prod.color ? ')' : ''} · Stock: {prod.stock}
                        </option>
                      ))}
                    </Select>
                  </Campo>
                  <Campo label={idx === 0 ? 'Cantidad' : undefined}>
                    <Input type="number" min="0.001" step="0.001" value={c.cantidad} onChange={(e) => setComp(c._key, 'cantidad', e.target.value)} />
                  </Campo>
                  <div className="text-[11px] text-gray-500 pb-2">
                    {p ? <span>Stock: <b className="text-gray-800 dark:text-gray-200">{fmtNumero(p.stock)}</b></span> : <span>&nbsp;</span>}
                  </div>
                  <div className="pb-1">
                    <Boton type="button" variante="peligro" tamano="sm" icono="papelera" onClick={() => quitarComp(c._key)} disabled={componentes.length === 1} aria-label="Quitar" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
