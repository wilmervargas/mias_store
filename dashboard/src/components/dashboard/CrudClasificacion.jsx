import { useEffect, useMemo, useRef, useState } from 'react';
import Icono from '../ui/Icono';
import Boton from '../ui/Boton';
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
  const catRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    if (tabInicial && tabs.some((t) => t.id === tabInicial)) setTab(tabInicial);
  }, [tabInicial, tabs]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab(tabs[0]?.id || 'categorias');
  }, [tab, tabs]);

  const refActual = tab === 'subcategorias' ? subRef : catRef;
  const labelNuevo = tab === 'subcategorias' ? 'Nueva Subcategoría' : 'Nueva Categoría';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">Clasificación</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Gestiona categorías y subcategorías desde una sola pantalla.</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="neutral" icono="excel" onClick={() => refActual.current?.exportar('excel')}>Excel</Boton>
          <Boton variante="neutral" icono="pdf" onClick={() => refActual.current?.exportar('pdf')}>PDF</Boton>
          <Boton variante="primario" icono="mas" onClick={() => refActual.current?.abrirCrear()}>{labelNuevo}</Boton>
        </div>
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
        {tab === 'categorias' && tabs.some((t) => t.id === 'categorias') ? <CrudCategorias ref={catRef} embebido /> : null}
        {tab === 'subcategorias' && tabs.some((t) => t.id === 'subcategorias') ? <CrudSubcategorias ref={subRef} embebido /> : null}
      </div>
    </div>
  );
};

export default CrudClasificacion;
