<<<<<<< HEAD
import { useMemo, useState } from 'react';
import AppLayout from '../layout/AppLayout';
import CrudProductos from './CrudProductos';
import CrudCategorias from './CrudCategorias';
import CrudMarcas from './CrudMarcas';
import CrudAlmacenes from './CrudAlmacenes';
import CrudUbicaciones from './CrudUbicaciones';
import CrudCatalogos from './CrudCatalogos';
import CrudInventario from './CrudInventario';
import CrudMovimientos from './CrudMovimientos';
import PanelReportes from './PanelReportes';
import ModuloWhatsApp from './ModuloWhatsApp';

const MODULOS = {
  productos: {
    componente: CrudProductos,
    titulo: 'Productos y SKUs',
    descripcion: 'Crea, edita y organiza las variantes del catálogo con sus precios y estado.',
    grupo: 'Operación',
  },
  inventario: {
    componente: CrudInventario,
    titulo: 'Inventario por ubicación',
    descripcion: 'Consulta existencias disponibles por almacén y ubicación física.',
    grupo: 'Operación',
  },
  movimientos: {
    componente: CrudMovimientos,
    titulo: 'Movimientos de inventario',
    descripcion: 'Registra y audita entradas, salidas, traslados y ajustes de stock.',
    grupo: 'Operación',
  },
  almacenes: {
    componente: CrudAlmacenes,
    titulo: 'Almacenes',
    descripcion: 'Administra los almacenes donde se resguarda la mercancía.',
    grupo: 'Almacén',
  },
  ubicaciones: {
    componente: CrudUbicaciones,
    titulo: 'Ubicaciones físicas',
    descripcion: 'Define pasillos, estantes y zonas para ubicar el inventario con precisión.',
    grupo: 'Almacén',
  },
  categorias: {
    componente: CrudCategorias,
    titulo: 'Categorías',
    descripcion: 'Organiza los productos en familias para facilitar su gestión y búsqueda.',
    grupo: 'Catálogos',
  },
  marcas: {
    componente: CrudMarcas,
    titulo: 'Marcas',
    descripcion: 'Mantén el listado de marcas y fabricantes asociados a tus productos.',
    grupo: 'Catálogos',
  },
  catalogos: {
    componente: CrudCatalogos,
    titulo: 'Modelos, colores y tallas',
    descripcion: 'Gestiona los atributos que definen las variantes de tus productos.',
    grupo: 'Catálogos',
  },
  reportes: {
    componente: PanelReportes,
    titulo: 'Reportes',
    descripcion: 'Visualiza indicadores clave de inventario, stock y valorización.',
    grupo: 'Análisis',
  },
  whatsapp: {
    componente: ModuloWhatsApp,
    titulo: 'WhatsApp Web',
    descripcion: 'Conecta el servicio WhatsApp y envía mensajes desde Mia\'s Store.',
    grupo: 'Sistema',
  },
};
=======
import React, { useState } from 'react';
import CrudProductos from './CrudProductos';
import CrudCategorias from './CrudCategorias';
import CrudMarcas from './CrudMarcas';
import CrudInventario from './CrudInventario';
import PanelReportes from './PanelReportes';
import TablaClientes from './TablaClientes';
import TablaPedidos from './TablaPedidos';
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

const Dashboard = () => {
  const [moduloActivo, setModuloActivo] = useState('productos');

<<<<<<< HEAD
  const actual = MODULOS[moduloActivo] || MODULOS.productos;
  const ComponenteActivo = actual.componente;

  return (
    <AppLayout moduloActivo={moduloActivo} onSelect={setModuloActivo} moduloActual={actual}>
      <div className="space-y-6">
        <section className="min-w-0">
          <ComponenteActivo />
        </section>
      </div>
    </AppLayout>
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
  );
};

export default Dashboard;
