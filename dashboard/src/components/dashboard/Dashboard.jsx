import React, { useState } from 'react';
import CrudProductos from './CrudProductos';
import CrudCategorias from './CrudCategorias';
import CrudMarcas from './CrudMarcas';
import CrudInventario from './CrudInventario';
import PanelReportes from './PanelReportes';
import TablaClientes from './TablaClientes';
import TablaPedidos from './TablaPedidos';

const Dashboard = () => {
  const [moduloActivo, setModuloActivo] = useState('productos');

  const modulos = [
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'inventario', label: 'Inventario', icon: '🏬' },
    { id: 'categorias', label: 'Categorías', icon: '🏷️' },
    { id: 'marcas', label: 'Marcas', icon: '🏢' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'pedidos', label: 'Pedidos', icon: '🧾' },
    { id: 'reportes', label: 'Reportes', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Damasco Pro</h2>
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block">Panel Admin</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {modulos.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModuloActivo(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  moduloActivo === tab.id
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80 mt-6 md:mt-0 text-[11px] text-slate-500">
          <span>Backend PHP 8 • PDO MySQL</span>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-white capitalize">Gestión de {moduloActivo}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {moduloActivo === 'clientes' || moduloActivo === 'pedidos'
              ? 'Consulta en vivo de la información almacenada en MySQL.'
              : moduloActivo === 'inventario'
                ? 'Stock multialmacén, movimientos y kardex en tiempo real.'
                : 'Operaciones Create, Read, Update y Delete sincronizadas en vivo con la API PHP.'}
          </p>
        </header>

        {moduloActivo === 'productos' && <CrudProductos />}
        {moduloActivo === 'inventario' && <CrudInventario />}
        {moduloActivo === 'categorias' && <CrudCategorias />}
        {moduloActivo === 'marcas' && <CrudMarcas />}
        {moduloActivo === 'clientes' && <TablaClientes />}
        {moduloActivo === 'pedidos' && <TablaPedidos />}
        {moduloActivo === 'reportes' && <PanelReportes />}
      </main>
    </div>
  );
};

export default Dashboard;
