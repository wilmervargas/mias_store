export const Tabla = ({
  cabecera,
  children,
  cargando = false,
  vacio = false,
  colSpan = 8,
  textoCargando = 'Cargando...',
  textoVacio = 'Sin registros.',
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm dark:bg-slate-900 dark:border-slate-800">
    <table className="w-full min-w-[680px] text-left text-xs">
      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800">
        <tr>{cabecera}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {cargando ? (
          <tr>
            <td colSpan={colSpan} className="p-8 text-center text-slate-500 dark:text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin dark:border-slate-600 dark:border-t-indigo-400" />
                {textoCargando}
              </span>
            </td>
          </tr>
        ) : vacio ? (
          <tr>
            <td colSpan={colSpan} className="p-8 text-center text-slate-500 dark:text-slate-500">
              {textoVacio}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  </div>
);

export const Th = ({ children, align = 'left', className = '' }) => (
  <th className={`p-3.5 whitespace-nowrap ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, align = 'left', className = '' }) => (
  <td className={`p-3.5 text-slate-700 dark:text-slate-300 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
    {children}
  </td>
);

export const BadgeEstado = ({ activo, activoLabel = 'Activo', inactivoLabel = 'Inactivo' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
    activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'}`} />
    {activo ? activoLabel : inactivoLabel}
  </span>
);

export const BadgeVinculo = ({ libre, textoLibre = 'Libre', textoVinculado = 'Vinculado' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
    libre ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
  }`}>
    {libre ? textoLibre : textoVinculado}
  </span>
);

export const Acciones = ({ children }) => (
  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
    {children}
  </div>
);
