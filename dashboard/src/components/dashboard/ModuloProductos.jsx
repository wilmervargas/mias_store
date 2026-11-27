import { useEffect, useMemo, useState } from 'react';
import Icono from '../ui/Icono';
import { useAuth } from '../../context/AuthContext';
import CrudProductos from './CrudProductos';
import CrudCombos from './CrudCombos';

const TABS = [
  { id: 'productos', label: 'Productos', icono: 'producto', permiso: 'productos.ver' },
  { id: 'combos', label: 'Combos', icono: 'capas', permiso: 'combos.ver' },
];

const ModuloProductos = ({ tabInicial = 'productos' }) => {
  const { puede } = useAuth();
  const tabs = useMemo(() => TABS.filter((t) => !t.permiso || puede(t.permiso)), [puede]);
  const [tab, setTab] = useState(tabInicial);

  useEffect(() => {
    if (tabInicial && tabs.some((t) => t.id === tabInicial)) setTab(tabInicial);
  }, [tabInicial, tabs]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab(tabs[0]?.id || 'productos');
  }, [tab, tabs]);

  return (
    <div className="space-y-4">
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
        {tab === 'productos' && tabs.some((t) => t.id === 'productos') ? <CrudProductos /> : null}
        {tab === 'combos' && tabs.some((t) => t.id === 'combos') ? <CrudCombos /> : null}
      </div>
    </div>
  );
};

export default ModuloProductos;
