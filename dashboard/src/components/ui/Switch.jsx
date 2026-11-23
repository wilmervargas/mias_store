const Switch = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Alternar'}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange?.(!checked);
      }}
      className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'bg-gradient-to-r from-pink-500 to-purple-600'
          : 'bg-gray-300 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
    {(label || description) ? (
      <div className="min-w-0">
        {label ? (
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{label}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-[10px] leading-snug text-gray-500 dark:text-gray-500">
            {description}
          </p>
        ) : null}
      </div>
    ) : null}
  </div>
);

export default Switch;
