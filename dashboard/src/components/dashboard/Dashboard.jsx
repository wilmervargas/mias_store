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

const Dashboard = () => {
  const [moduloActivo, setModuloActivo] = useState('productos');

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
  );
};

export default Dashboard;
