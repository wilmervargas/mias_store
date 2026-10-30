export default function ReciboPedido({ pedido, onClose }) {
  if (!pedido) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Transacción completada
            </span>
            <h3 className="text-xl font-black text-white">Pedido #{pedido.id}</h3>
          </div>
          <span className="text-3xl">✅</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 mb-4 text-xs text-slate-300 space-y-1">
          <p><strong className="text-white">Cliente:</strong> {pedido.cliente_nombre}</p>
          <p><strong className="text-white">Correo:</strong> {pedido.cliente_email}</p>
          <p><strong className="text-white">Dirección:</strong> {pedido.direccion_envio}</p>
          <p><strong className="text-white">Método de pago:</strong> {pedido.metodo_pago}</p>
          <p><strong className="text-white">Referencia:</strong> {pedido.numero_referencia}</p>
          <p><strong className="text-white">Tasa aplicada:</strong> {Number(pedido.tasa_dolar_usada).toFixed(2)} Bs/USD</p>
        </div>

        <div className="space-y-2 mb-4">
          {(pedido.items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-slate-800 text-xs"
            >
              <span className="text-slate-300 truncate">{item.producto_nombre}</span>
              <span className="text-slate-500 font-mono">
                {item.cantidad} x ${Number(item.precio_unitario).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/50 border border-slate-800">
          <span className="text-sm text-slate-400">Total pagado</span>
          <span className="text-lg font-black text-emerald-400">
            ${Number(pedido.total).toFixed(2)} USD
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl cursor-pointer"
        >
          Cerrar recibo
        </button>
      </div>
    </div>
  );
}
