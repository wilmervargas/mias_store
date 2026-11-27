import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Boton from '../ui/Boton';
import { Card, CardBody } from '../ui/Card';
import { Campo, Input, TextArea } from '../ui/Campo';
import PageHeader from '../ui/PageHeader';
import Icono from '../ui/Icono';
import { useToast } from '../ui/ToastProvider';
import { exportarExcel, exportarPDF } from '../../utils/reportes';

const API_BASE = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000/index.php?url=`;

const VACIO = {
  razon_social: '',
  nombre_comercial: '',
  rif: '',
  representante: '',
  direccion: '',
  email: '',
  eslogan: '',
  logo: '',
  logo_url: null,
  moneda_base: 'USD',
  iva_rate: '16.00',
  igtf_rate: '0.00',
  telefonos: ['', ''],
};

function normalizarTelefono(v) {
  let d = String(v || '').replace(/\D+/g, '');
  if (/^0\d{10}$/.test(d)) d = '58' + d.slice(1);
  else if (/^\d{10}$/.test(d)) d = '58' + d;
  return d;
}

function telefonoValido(v) {
  return /^58\d{10}$/.test(normalizarTelefono(v));
}

export default function ModuloEmpresa() {
  const toast = useToast();
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const res = await api.get('empresa');
    if (res.success) {
      const d = res.datos || {};
      const tels = Array.isArray(d.telefonos) ? d.telefonos : [];
      setForm({ ...VACIO, ...d, telefonos: [tels[0] || '', tels[1] || ''] });
    } else {
      toast.error(res.error || 'No se pudo cargar la empresa.');
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const setTelefono = (idx, valor) => {
    setForm((prev) => {
      const telefonos = [...(prev.telefonos || ['', ''])];
      telefonos[idx] = valor;
      return { ...prev, telefonos };
    });
  };

  const validar = () => {
    if (!String(form.razon_social || '').trim()) return 'La razón social es obligatoria.';
    const moneda = String(form.moneda_base || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(moneda)) return 'La moneda base debe ser un código ISO de 3 letras.';
    const email = String(form.email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no tiene un formato válido.';
    const telefonos = (form.telefonos || []).slice(0, 2).map(normalizarTelefono).filter(Boolean);
    const invalidos = telefonos.filter((t) => !telefonoValido(t));
    if (invalidos.length) return 'Hay teléfonos inválidos. Usa formato 0424 4032682 o 584244032682; se guardarán como 58XXXXXXXXXX.';
    return null;
  };

  const guardar = async () => {
    const error = validar();
    if (error) { toast.error(error); return; }
    setGuardando(true);
    const payload = {
      razon_social: form.razon_social,
      nombre_comercial: form.nombre_comercial,
      rif: form.rif,
      representante: form.representante,
      direccion: form.direccion,
      email: form.email,
      eslogan: form.eslogan,
      moneda_base: String(form.moneda_base || 'USD').toUpperCase(),
      iva_rate: form.iva_rate,
      igtf_rate: form.igtf_rate,
      telefonos: (form.telefonos || []).slice(0, 2).map(normalizarTelefono).filter(Boolean),
    };
    const res = await api.put('empresa', '', payload);
    // api.put usa /recurso/id; para singleton usamos endpoint directo
    let resultado = res;
    if (!res.success && res.error) {
      // fallback por si el endpoint no acepta /empresa/
      resultado = await fetch(`${API_BASE}empresa`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()).catch(() => ({ success: false, error: 'No se pudo guardar.' }));
    }
    setGuardando(false);
    if (!resultado.success) { toast.error(resultado.error || 'No se pudo guardar la empresa.'); return; }
    const d = resultado.datos || {};
    const tels = Array.isArray(d.telefonos) ? d.telefonos : [];
    setForm({ ...VACIO, ...d, telefonos: [tels[0] || '', tels[1] || ''] });
    window.dispatchEvent(new CustomEvent('mias:empresa-actualizada'));
    toast.exito('Configuración de empresa guardada.');
  };

  const subirLogo = async (file) => {
    if (!file) return;
    setSubiendoLogo(true);
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const res = await fetch(`${API_BASE}empresa/logo`, { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudo subir el logo.');
      const d = data.datos || {};
      setForm((prev) => ({ ...prev, ...d, telefonos: Array.isArray(d.telefonos) && d.telefonos.length ? d.telefonos : prev.telefonos }));
      window.dispatchEvent(new CustomEvent('mias:empresa-actualizada'));
      toast.exito('Logo actualizado.');
    } catch (e) {
      toast.error(e.message || 'No se pudo subir el logo.');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const quitarLogo = async () => {
    if (!window.confirm('¿Quitar el logo actual?')) return;
    setSubiendoLogo(true);
    try {
      const res = await fetch(`${API_BASE}empresa/logo`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudo quitar el logo.');
      const d = data.datos || {};
      setForm((prev) => ({ ...prev, ...d, logo: '', logo_url: null, telefonos: Array.isArray(d.telefonos) && d.telefonos.length ? d.telefonos : prev.telefonos }));
      window.dispatchEvent(new CustomEvent('mias:empresa-actualizada'));
      toast.exito('Logo eliminado.');
    } catch (e) {
      toast.error(e.message || 'No se pudo quitar el logo.');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const exportar = (tipo) => {
    const filas = [
      { campo: 'Razón social', valor: form.razon_social },
      { campo: 'Nombre comercial', valor: form.nombre_comercial },
      { campo: 'RIF / Documento fiscal', valor: form.rif },
      { campo: 'Representante', valor: form.representante },
      { campo: 'Correo', valor: form.email },
      { campo: 'Dirección', valor: form.direccion },
      { campo: 'Eslogan', valor: form.eslogan },
      { campo: 'Teléfono 1', valor: form.telefonos?.[0] || '' },
      { campo: 'Teléfono 2', valor: form.telefonos?.[1] || '' },
      { campo: 'Moneda base', valor: form.moneda_base },
      { campo: 'IVA (%)', valor: form.iva_rate },
      { campo: 'IGTF (%)', valor: form.igtf_rate },
    ];
    const cols = [
      { header: 'Campo', valor: (r) => r.campo },
      { header: 'Valor', valor: (r) => r.valor },
    ];
    if (tipo === 'excel') exportarExcel({ nombre: 'reporte_empresa', hoja: 'Empresa', titulo: 'Reporte de Empresa', columnas: cols, filas });
    else exportarPDF({ nombre: 'reporte_empresa', titulo: 'Reporte de Empresa', columnas: cols, filas, orientacion: 'portrait' });
  };

  if (cargando) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="ajustes"
        title="Empresa"
        description="Configura la identidad del negocio. El primer teléfono registrado será el WhatsApp por defecto."
        actions={
          <div className="flex items-center gap-2">
            <Boton variante="neutral" icono="excel" onClick={() => exportar('excel')}>Excel</Boton>
            <Boton variante="neutral" icono="pdf" onClick={() => exportar('pdf')}>PDF</Boton>
            <Boton variante="primario" icono="guardar" onClick={guardar} cargando={guardando}>Guardar cambios</Boton>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardBody className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Datos generales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Razón social *">
                <Input value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} placeholder="Nombre legal de la empresa" />
              </Campo>
              <Campo label="Nombre comercial">
                <Input value={form.nombre_comercial} onChange={(e) => set('nombre_comercial', e.target.value)} placeholder="Nombre visible" />
              </Campo>
              <Campo label="RIF / Documento fiscal">
                <Input value={form.rif} onChange={(e) => set('rif', e.target.value)} placeholder="J-12345678-9" />
              </Campo>
              <Campo label="Representante">
                <Input value={form.representante} onChange={(e) => set('representante', e.target.value)} placeholder="Nombre del representante" />
              </Campo>
              <Campo label="Correo">
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="empresa@correo.com" />
              </Campo>
              <Campo label="Moneda base">
                <Input value={form.moneda_base} onChange={(e) => set('moneda_base', e.target.value.toUpperCase())} maxLength={3} placeholder="USD" />
              </Campo>
              <Campo label="IVA (%)">
                <Input type="number" min="0" max="100" step="0.01" value={form.iva_rate} onChange={(e) => set('iva_rate', e.target.value)} />
              </Campo>
              <Campo label="IGTF (%)">
                <Input type="number" min="0" max="100" step="0.01" value={form.igtf_rate} onChange={(e) => set('igtf_rate', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Dirección">
              <TextArea rows={3} value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Dirección fiscal o comercial" />
            </Campo>
            <Campo label="Eslogan">
              <Input value={form.eslogan} onChange={(e) => set('eslogan', e.target.value)} placeholder="Frase corta de la marca" />
            </Campo>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Logo</h2>
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo empresa" className="h-full w-full object-contain" />
                  ) : (
                    <Icono nombre="imagen" className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${subiendoLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Icono nombre="subir" className="h-4 w-4" />
                    {subiendoLogo ? 'Subiendo...' : 'Subir logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { subirLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  {form.logo_url ? (
                    <Boton variante="peligro" tamano="sm" icono="papelera" onClick={quitarLogo} disabled={subiendoLogo}>Quitar</Boton>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">Cualquier imagen. Máximo 5 MB.</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Teléfonos</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Registra los teléfonos de contacto de la empresa. Se guardan como 58XXXXXXXXXX.</p>
              </div>

              <div className="space-y-3">
                {[0, 1].map((idx) => (
                  <Campo key={idx} label={`Teléfono ${idx + 1}`}>
                    <Input
                      value={form.telefonos?.[idx] || ''}
                      onChange={(e) => setTelefono(idx, e.target.value)}
                      onBlur={(e) => setTelefono(idx, normalizarTelefono(e.target.value))}
                      placeholder="0424 4032682"
                      inputMode="tel"
                    />
                  </Campo>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
