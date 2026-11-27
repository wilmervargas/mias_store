import { useEffect, useMemo, useState } from 'react';
import Icono from '../ui/Icono';
import { useAuth } from '../../context/AuthContext';
import CrudCategorias from './CrudCategorias';
import CrudSubcategorias from './CrudSubcategorias';

const TABS = [
  { id: 'categorias', label: 'Categorías', icono: 'categoria', permiso: 'categorias.ver' },
  { id: 'subcategorias', label: 'Subcategorías', icono: 'categoria', permiso: 'categorias.ver' },
];

const CrudClasificacion = ({ tabInicial = 'categorias' }) => {
  const { puede } = useAuth();
  const tabs = useMemo(() => TABS.filter((t) => !t.permiso || puede(t.permiso)), [puede]);
  const [tab, setTab] = useState(tabInicial);

  useEffect(() => {
    if (tabInicial && tabs.some((t) => t.id === tabInicial)) setTab(tabInicial);
  }, [tabInicial, tabs]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab(tabs[0]?.id || 'categorias');
  }, [tab, tabs]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-black text-gray-900 dark:text-white">Clasificación</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">Gestiona categorías y subcategorías desde una sola pantalla.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === t.id
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Icono nombre={t.icono} className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'categorias' && tabs.some((t) => t.id === 'categorias') ? <CrudCategorias embebido /> : null}
        {tab === 'subcategorias' && tabs.some((t) => t.id === 'subcategorias') ? <CrudSubcategorias embebido /> : null}
      </div>
    </div>
  );
};

export default CrudClasificacion;
