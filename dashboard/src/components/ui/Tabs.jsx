import Icono from './Icono';

const Tabs = ({ tabs, activa, onChange }) => (
  <div className="flex flex-wrap gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    {tabs.map((tab) => {
      const seleccionada = tab.id === activa;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition sm:flex-none sm:justify-start ${
            seleccionada
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <Icono nombre={tab.icono} className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {tab.labelCorto ? (
              <>
                <span className="sm:hidden">{tab.labelCorto}</span>
                <span className="hidden truncate sm:inline">{tab.label}</span>
              </>
            ) : tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

export default Tabs;
