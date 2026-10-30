import { useState } from 'react';
import { API_URL } from '../config';

export const CheckoutModal = ({ abierto, onClose, carrito, tasaDolar, onPedidoExitoso }) => {
  const [clienteId, setClienteId] = useState('1');
  const [direccion, setDireccion] = useState('Av. Bolívar, Calle 4, Local 12');
  const [metodoPago, setMetodoPago] = useState('Pago Movil');
  const [referencia, setReferencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!abierto) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      cliente_id: Number(clienteId),
      direccion_envio: direccion,
      metodo_pago: metodoPago,
      numero_referencia: referencia || `REF-${Date.now().toString().slice(-6)}`,
      tasa_dolar_usada: Number(tasaDolar),
    };

    try {
      const res = await fetch(`${API_URL}?url=pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!(data.success || data.exito)) {
        throw new Error(data.error || data.mensaje || 'Error al procesar el pedido');
      }

      await carrito.recargar?.();
      onPedidoExitoso(data.datos);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black text-white mb-2">Finalizar Compra</h3>
        <p className="text-xs text-slate-400 mb-4">
          Total a pagar:{' '}
          <strong className="text-emerald-400">
            ${Number(carrito.totalUSD).toFixed(2)} USD
          </strong>{' '}
          (Bs. {(Number(carrito.totalUSD) * Number(tasaDolar)).toLocaleString('es-VE', {
            minimumFractionDigits: 2,
          })})
        </p>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Cliente Registrado (damasco.sql):</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full p-2.5 bg-black/50 border border-slate-800 rounded-xl text-white"
            >
              <option value="1">Ana Pérez (ana@example.com)</option>
              <option value="2">Luis Gómez (luis@example.com)</option>
              <option value="3">Carla Díaz (carla@example.com)</option>
              <option value="4">Miguel Rojas (miguel@example.com)</option>
              <option value="5">Sofía Martínez (sofia@example.com)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Dirección de Entrega:</label>
            <input
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full p-2.5 bg-black/50 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Método de Pago:</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full p-2.5 bg-black/50 border border-slate-800 rounded-xl text-white"
              >
                <option value="Pago Movil">Pago Móvil</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Zelle">Zelle (USD)</option>
                <option value="Efectivo">Efectivo en Tienda</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Nº Referencia / Voucher:</label>
              <input
                type="text"
                placeholder="Ej: 123456"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full p-2.5 bg-black/50 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 leading-relaxed">
            El carrito ya está guardado en <strong>items_carrito</strong>. El servidor generará el
            pedido, descontará el stock y vaciará tu carrito dentro de una transacción atómica.
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
            >
              {enviando ? 'Procesando Transacción...' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
