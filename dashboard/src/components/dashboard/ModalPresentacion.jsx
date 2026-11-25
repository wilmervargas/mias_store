import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import Icono from '../ui/Icono';
import { Campo, Input, Select } from '../ui/Campo';

const ModalPresentacion = ({ producto, fila, almacen, colores = [], tallas = [], onClose, onGuardado }) => {
  const toast = useToast();
  const [guardando, setGuardando] = useState(false);

  const ubicacion = useMemo(() => {
    const lista = Array.isArray(fila?.ubicaciones) ? fila.ubicaciones : [];
    return lista.find((u) => Number(u.almacen_id) === Number(almacen?.almacen_id));
  }, [fila, almacen]);

  const [form, setForm] = useState({
    idcolor: fila?.idcolor || 1,
    idtalla: fila?.idtalla || 1,
    costo: fila?.costo ?? '',
    precio: fila?.precio ?? '',
    preciofull: fila?.preciofull ?? '',
    stock: almacen?.stock ?? fila?.stock ?? '',
    codigo_detalle: fila?.codigo_detalle || '',
    codigo_barras: fila?.codigo_barras || '',
    sku_almacen: almacen?.sku_almacen || '',
  });

  const set = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const colorSeleccionado = colores.find((c) => Number(c.id) === Number(form.idcolor));
  const tallaSeleccionada = tallas.find((t) => Number(t.id) === Number(form.idtalla));

  const guardar = async (e) => {
    e.preventDefault();
    if (!almacen?.almacen_id) {
      toast.error('No se pudo identificar el almacén de esta presentación');
      return;
    }
    if (form.precio === '' || Number(form.precio) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    if (form.stock !== '' && Number(form.stock) < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    const payload = {
      almacen_id: Number(almacen.almacen_id),
      ubicacion_id: ubicacion?.ubicacion_id || almacen?.ubicacion_preferida_id || null,
      idcolor: Number(form.idcolor || 1),
      idtalla: Number(form.idtalla || 1),
      costo: form.costo === '' ? 0 : Number(form.costo),
      precio: Number(form.precio),
      preciofull: form.preciofull === '' ? Number(form.precio) : Number(form.preciofull),
      stock: form.stock === '' ? 0 : Number(form.stock),
      codigo_detalle: form.codigo_detalle.trim() || null,
      codigo_barras: form.codigo_barras.trim() || null,
      sku_almacen: form.sku_almacen.trim() || null,
    };

    setGuardando(true);
    const res = await api.put('productos', `${fila.id}/presentacion`, payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || 'No se pudo actualizar la presentación');
      return;
    }

    toast.exito('Presentación del almacén actualizada');
    onGuardado();
  };

  const nombreAlmacen = almacen
    ? `${almacen.codigo} · ${almacen.almacen}`
    : 'Sin almacén asignado';

  return (
    <Modal
      titulo="Editar presentación del almacén"
      subtitulo={`${producto?.nombre || 'Producto'} · ${nombreAlmacen}`}
      icono="inventario"
      tono="info"
      onClose={onClose}
      maxW="max-w-2xl"
      footer={
        <>
          <Boton variante="neutral" onClick={onClose}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-presentacion" variante="exito" icono="guardar" cargando={guardando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-presentacion" onSubmit={guardar} className="space-y-4">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-3.5 dark:border-cyan-500/20 dark:bg-cyan-500/5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5">
              <Icono nombre="almacen" className="w-3.5 h-3.5 text-cyan-500" />
              <strong>{almacen?.codigo || '—'}</strong>
              {almacen?.almacen}
            </span>
            <span>Ubicación: {ubicacion?.ruta || ubicacion?.ubicacion_codigo || 'General'}</span>
            <span>Stock actual: <strong>{Number(almacen?.stock || 0)}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="SKU del almacén" hint="Código único de esta presentación en el almacén.">
            <Input
              value={form.sku_almacen}
              onChange={(e) => set('sku_almacen', e.target.value.toUpperCase())}
              placeholder="ALM01-P-00001"
              className="font-mono uppercase"
            />
          </Campo>
          <Campo label="Código de detalle">
            <Input
              value={form.codigo_detalle}
              onChange={(e) => set('codigo_detalle', e.target.value)}
              placeholder="SKU-01"
              className="font-mono"
            />
          </Campo>
          <Campo label="Código de barras">
            <Input
              value={form.codigo_barras}
              onChange={(e) => set('codigo_barras', e.target.value)}
            />
          </Campo>
          <Campo label="Stock en este almacén" hint="El cambio queda auditado como ajuste de inventario.">
            <Input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              placeholder="0"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Color">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                style={{ background: colorSeleccionado?.codigo_hex || '#d1d5db' }}
              />
              <Select value={form.idcolor} onChange={(e) => set('idcolor', e.target.value)}>
                {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </div>
          </Campo>
          <Campo label="Talla">
            <Select value={form.idtalla} onChange={(e) => set('idtalla', e.target.value)}>
              {tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
          </Campo>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo label="Costo ($)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.costo}
              onChange={(e) => set('costo', e.target.value)}
            />
          </Campo>
          <Campo label="Precio ($)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.precio}
              onChange={(e) => set('precio', e.target.value)}
            />
          </Campo>
          <Campo label="Precio full ($)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.preciofull}
              onChange={(e) => set('preciofull', e.target.value)}
            />
          </Campo>
        </div>

        <p className="text-[10px] text-gray-500 flex items-start gap-2">
          <Icono nombre="alerta" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/70" />
          Esta edición afecta únicamente a <strong>{tallaSeleccionada?.nombre || 'la talla'}</strong> /{' '}
          <strong>{colorSeleccionado?.nombre || 'el color'}</strong> en el almacén {almacen?.codigo || ''}.
          Si cambias el stock se registrará un movimiento de ajuste.
        </p>
      </form>
    </Modal>
  );
};

export default ModalPresentacion;
