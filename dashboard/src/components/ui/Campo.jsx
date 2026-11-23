export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-colors dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-400 dark:focus:ring-purple-500/20';

export const Campo = ({ label, hint, required = false, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    {children}
    {hint && <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1.5">{hint}</p>}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input className={`${inputClass} ${className}`} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`${inputClass} ${className}`} {...props}>
    {children}
  </select>
);

export const TextArea = ({ className = '', rows = 3, ...props }) => (
  <textarea rows={rows} className={`${inputClass} resize-none ${className}`} {...props} />
);
