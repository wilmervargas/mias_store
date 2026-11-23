const items = [
  { id: 'tienda', label: 'Tienda', icon: '🛍️', hint: 'Catálogo de productos' },
];

export default function Sidebar({ open, onClose, vistaActiva = 'tienda', onSelect }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[14rem] transform flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mia&apos;s Store</p>
            <p className="text-xs text-slate-400">Tienda</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Explorar</p>
          <div className="space-y-1">
            {items.map((item) => {
              const activo = vistaActiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.hint}
                  onClick={() => { onSelect?.(item.id); onClose?.(); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activo ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-xs font-medium text-slate-300">Mia&apos;s Store</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Catálogo y compras</p>
      </div>
    </aside>
  );
}
