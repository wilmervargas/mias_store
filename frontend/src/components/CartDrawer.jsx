import { useCurrency } from '../context/CurrencyContext';

export const CartDrawer = ({ abierto, onClose, carrito, tasaDolar, onIniciarCheckout }) => {
  const { moneda, formatearPrecio } = useCurrency();

  if (!abierto) return null;

  const totalBs = Number(carrito.totalUSD) * Number(tasaDolar);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full z-10 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="text-lg font-black text-white">Tu Carrito ({carrito.totalItems})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {carrito.items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <span className="text-4xl block mb-2">🛍️</span>
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            carrito.items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-black/40 rounded-xl border border-slate-800 flex gap-3 items-center"
              >
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/imagenes/${item.imagen}`}
                  alt={item.nombre}
                  className="w-14 h-14 object-contain rounded-lg bg-slate-800/60 p-1"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200';
                  }}
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.nombre}</h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {[item.talla, item.color, item.modelo].filter(Boolean).join(' · ') || 'Presentación base'}
                    {item.sku ? <span className="font-mono text-slate-500"> · {item.sku}</span> : null}
                  </p>
                  <p className="text-[11px] text-amber-400 font-mono">
                    {formatearPrecio(item.precio)}
                    {' • '}
                    {formatearPrecio(item.precio, moneda === 'USD' ? 'VES' : 'USD')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => carrito.cambiarCantidad(item.id, -1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-2">{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => carrito.cambiarCantidad(item.id, 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => carrito.eliminarItem(item.id)}
                  className="text-red-400 hover:text-red-300 text-xs p-2 cursor-pointer"
                  title="Eliminar del carrito"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {carrito.items.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total en Dólares:</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                ${Number(carrito.totalUSD).toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total en Bolívares:</span>
              <span className="font-mono font-black text-amber-400 text-base">
                Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={onIniciarCheckout}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💳 Proceder al Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
