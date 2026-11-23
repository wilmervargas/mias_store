import Icono from './Icono';

export function PageHeader({ title, description, icon, actions, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {typeof icon === 'string' ? <Icono nombre={icon} className="h-5 w-5" /> : icon}
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          {children}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
