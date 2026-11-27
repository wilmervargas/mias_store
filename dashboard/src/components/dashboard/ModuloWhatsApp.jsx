import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import Boton from '../ui/Boton';
import { Card, CardBody } from '../ui/Card';
import { Campo, Input, TextArea } from '../ui/Campo';
import PageHeader from '../ui/PageHeader';
import Icono from '../ui/Icono';

const STATE_LABELS = {
  starting: 'Iniciando',
  connecting: 'Conectando',
  qr: 'Esperando QR',
  open: 'Conectado',
  close: 'Reconectando',
  logged_out: 'Sesión cerrada',
};

function normalizeStatus(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      connected: false,
      state: 'starting',
      needsQr: false,
      qrDataUrl: null,
      message: 'Consultando estado...',
      lastError: null,
      me: null,
    };
  }
  return {
    connected: Boolean(raw.connected),
    state: raw.state || 'starting',
    needsQr: Boolean(raw.needsQr),
    qrDataUrl: raw.qrDataUrl || null,
    message: raw.message || '',
    lastError: raw.lastError || null,
    me: raw.me || null,
  };
}

export default function ModuloWhatsApp() {
  const [status, setStatus] = useState(normalizeStatus(null));
  const [backendDown, setBackendDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('Mensaje de prueba desde la empresa.');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [empresaWhatsapp, setEmpresaWhatsapp] = useState('');

  useEffect(() => {
    api.get('empresa').then((res) => {
      if (res.success) {
        const ws = res.datos?.whatsapp || res.datos?.telefonos?.[0] || '';
        setEmpresaWhatsapp(ws || '');
      }
    });
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.get('whatsapp/estado');
      if (!res.success) {
        setBackendDown(true);
        setNotice({ type: 'error', text: res.error || 'No se pudo obtener el estado de WhatsApp.' });
        return;
      }
      setStatus(normalizeStatus(res.datos));
      setBackendDown(false);
    } catch {
      setBackendDown(true);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const interval = setInterval(() => {
      void refreshStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleRestart = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await api.post('whatsapp/reiniciar', {});
      if (!res.success) throw new Error(res.error || 'Error al reconectar.');
      const msg = res.datos?.message || 'Reconectando...';
      setNotice({ type: 'info', text: msg });
      void refreshStatus();
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Error al reconectar.' });
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      'Esto cerrará la sesión actual y borrará las credenciales guardadas. Tendrás que escanear un QR nuevo.\n\n¿Continuar?'
    );
    if (!confirmed) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await api.post('whatsapp/logout', {});
      if (!res.success) throw new Error(res.error || 'Error al cerrar sesión.');
      const msg = res.datos?.message || 'Sesión cerrada.';
      setNotice({ type: 'info', text: msg });
      void refreshStatus();
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Error al cerrar sesión.' });
    } finally {
      setBusy(false);
    }
  };

  const normalizarWa = (v) => {
    let d = String(v || '').replace(/\D/g, '');
    if (/^0\d{10}$/.test(d)) d = '58' + d.slice(1);
    else if (/^\d{10}$/.test(d)) d = '58' + d;
    return d;
  };
  const cleanPhone = normalizarWa(to);
  const canSend = !sending && /^58\d{10}$/.test(cleanPhone) && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post('whatsapp/enviar', { to: cleanPhone, message });
      if (!res.success) throw new Error(res.error || 'No se pudo enviar.');
      const data = res.datos || {};
      const text = data.message || 'Mensaje enviado.';
      const extra = [data.to ? `Destino: ${data.to}` : null, data.messageId ? `ID: ${data.messageId}` : null].filter(Boolean).join(' · ');
      setSendResult({ type: 'success', text: extra ? `${text} ${extra}` : text });
    } catch (error) {
      setSendResult({ type: 'error', text: error.message || 'No se pudo enviar.' });
    } finally {
      setSending(false);
    }
  };

  const badgeClass = status.connected
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : status.needsQr
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <PageHeader
        icon="whatsapp"
        title="WhatsApp Web"
        description="Rutina de conexión y envío mediante el servicio local ws/ (Baileys), integrada al backend PHP de Mia's Store."
        actions={
          <Boton variante="neutral" icono="refrescar" onClick={() => { void refreshStatus(); }} disabled={busy}>
            Actualizar
          </Boton>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Estado de la conexión</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                {STATE_LABELS[status.state] || status.state || '—'}
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">Servicio: <code className="text-gray-700 dark:text-gray-300">ws/server</code> (proxy API PHP: <code className="text-gray-700 dark:text-gray-300">whatsapp/estado</code>)</p>

            <p className={`text-sm ${status.connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {status.message || '—'}
            </p>
            {status.me ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-gray-200">Emisor vinculado:</span> +{status.me}
              </p>
            ) : null}

            {status.lastError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {String(status.lastError)}
              </div>
            ) : null}
            {backendDown ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                No se pudo contactar al backend PHP o al servicio <code>ws/server</code>. Verifica que PHP y el servicio WhatsApp estén en ejecución.
              </div>
            ) : null}

            {status.needsQr && status.qrDataUrl ? (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <img
                  src={status.qrDataUrl}
                  alt="Código QR para vincular WhatsApp"
                  className="mx-auto h-64 w-64 rounded-lg bg-white p-2"
                />
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  <li>Abre WhatsApp en el teléfono emisor.</li>
                  <li>Ve a <strong>Dispositivos vinculados</strong>.</li>
                  <li>Toca <strong>Vincular un dispositivo</strong> y escanea este QR.</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-400">El código se renueva automáticamente.</p>
              </div>
            ) : null}

            {status.needsQr && !status.qrDataUrl ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Generando el código QR… si no aparece, pulsa <strong>Reconectar</strong> o revisa la consola de <code>ws/server</code>.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Boton variante="neutral" icono="refrescar" onClick={handleRestart} disabled={busy} cargando={busy}>
                Reconectar
              </Boton>
              <Boton variante="advertencia" icono="poder" onClick={handleLogout} disabled={busy}>
                Vincular otro número
              </Boton>
            </div>

            {notice ? (
              <div className={`rounded-xl border p-3 text-sm ${
                notice.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                  : notice.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300'
              }`}>
                {notice.text}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Icono nombre="enviar" className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Enviar mensaje</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Envío manual (rutina WhatsApp Web)</p>
              </div>
            </div>

            <Campo label="Número destino" hint="Puedes escribir 0424 4032682; para WhatsApp se usa 584244032682.">
              <div className="space-y-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder={empresaWhatsapp || '0424 4032682'}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  autoComplete="off"
                />
                {empresaWhatsapp ? (
                  <button
                    type="button"
                    onClick={() => setTo(empresaWhatsapp)}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Usar WhatsApp de empresa: +{empresaWhatsapp}
                  </button>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    No hay teléfonos de contacto configurados en Empresa.
                  </p>
                )}
              </div>
            </Campo>

            <Campo label="Mensaje">
              <TextArea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
            </Campo>

            <div className="flex flex-wrap items-center gap-2">
              <Boton variante="exito" icono="enviar" onClick={handleSend} disabled={!canSend} cargando={sending}>
                Enviar por servicio
              </Boton>
              <Boton
                variante="neutral"
                icono="whatsapp"
                onClick={() => {
                  if (!/^58\d{10}$/.test(cleanPhone)) { alert('Indica un número destino válido.'); return; }
                  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || '')}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                disabled={!/^58\d{10}$/.test(cleanPhone) || !message.trim()}
              >
                Abrir WhatsApp Web (manual)
              </Boton>
              {!status.connected ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">El envío por servicio requiere conexión; la opción manual funciona sin el servicio.</span>
              ) : null}
            </div>

            {sendResult ? (
              <div className={`rounded-xl border p-3 text-sm ${
                sendResult.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
              }`}>
                {sendResult.text}
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
