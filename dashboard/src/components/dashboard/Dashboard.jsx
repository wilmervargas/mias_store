import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../layout/AppLayout';
import ModuloDivisas from './ModuloDivisas';
import ModuloProductos from './ModuloProductos';
import CrudClasificacion from './CrudClasificacion';
import CrudAlmacenes from './CrudAlmacenes';
import CrudUbicaciones from './CrudUbicaciones';
import CrudCatalogos from './CrudCatalogos';

const CrudUnidades = () => <CrudCatalogos tabFijo="unidades" />;
import CrudInventario from './CrudInventario';
import CrudMovimientos from './CrudMovimientos';
import PanelReportes from './PanelReportes';
import ModuloWhatsApp from './ModuloWhatsApp';
import ModuloEmpresa from './ModuloEmpresa';
import ModuloSeguridad from '../seguridad/ModuloSeguridad';
import Icono from '../ui/Icono';
import { useAuth } from '../../context/AuthContext';
import { ACCESO_MODULO } from '../../config/navegacion';

const MODULOS = {
  divisas: {
    componente: ModuloDivisas,
    titulo: 'Divisas y tasas de cambio',
    descripcion: 'Consulta y actualiza diariamente el dólar, euro, USDT y un monto personalizado.',
    grupo: 'Panel de control',
  },
  productos: {
    componente: ModuloProductos,
    titulo: 'Productos y combos',
    descripcion: 'Gestiona productos, variantes y combos comerciales desde un solo módulo.',
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
    titulo: 'Movimientos / Kardex',
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
  clasificacion: {
    componente: CrudClasificacion,
    titulo: 'Categorías y subcategorías',
    descripcion: 'Gestiona categorías y subcategorías desde una sola pantalla con pestañas.',
    grupo: 'Catálogos',
  },
  catalogos: {
    componente: CrudCatalogos,
    titulo: 'Marcas, modelos, colores y tallas',
    descripcion: 'Gestiona marcas y atributos que definen las variantes de tus productos.',
    grupo: 'Catálogos',
  },
  unidades: {
    componente: CrudUnidades,
    titulo: 'Unidades de medida',
    descripcion: 'Gestiona las unidades usadas por los productos: pieza, docena, paquete, kilogramo, etc.',
    grupo: 'Catálogos',
  },
  reportes: {
    componente: PanelReportes,
    titulo: 'Reportes',
    descripcion: 'Visualiza indicadores clave de inventario, stock y valorización.',
    grupo: 'Análisis',
  },
  empresa: {
    componente: ModuloEmpresa,
    titulo: 'Configuración de empresa',
    descripcion: 'Define la identidad, contacto, logo y parámetros fiscales de la empresa.',
    grupo: 'Sistema',
  },
  whatsapp: {
    componente: ModuloWhatsApp,
    titulo: 'WhatsApp Web',
    descripcion: 'Conecta el servicio WhatsApp y envía mensajes desde la empresa.',
    grupo: 'Sistema',
  },
  seguridad: {
    componente: ModuloSeguridad,
    titulo: 'Seguridad y Accesos',
    descripcion: 'Usuarios, roles, permisos y protección de claves.',
    grupo: 'Seguridad',
  },
};

const Dashboard = () => {
  const { puede, puedeSeguridad } = useAuth();

  const puedeModulo = useCallback((id) => {
    if (id === 'seguridad') return puedeSeguridad;
    if (id === 'clasificacion') return puede('categorias.ver') || puede('marcas.ver');
    const codigo = ACCESO_MODULO[id];
    if (Array.isArray(codigo)) return codigo.some((c) => puede(c));
    return codigo ? puede(codigo) : true;
  }, [puede, puedeSeguridad]);

  const [moduloActivo, setModuloActivo] = useState(() => (
    Object.keys(MODULOS).find((id) => puedeModulo(id)) || ''
  ));
  const [nombreEmpresa, setNombreEmpresa] = useState('Empresa');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:8000/index.php?url=empresa`, { credentials: 'include' });
        const data = await res.json();
        if (data?.success) {
          const nombre = data.datos?.nombre_comercial || data.datos?.razon_social || '';
          setNombreEmpresa(nombre || 'Empresa');
        }
      } catch { /* ignore */ }
    };
    cargar();
    window.addEventListener('mias:empresa-actualizada', cargar);
    return () => window.removeEventListener('mias:empresa-actualizada', cargar);
  }, []);

  useEffect(() => {
    if (!moduloActivo || !puedeModulo(moduloActivo)) {
      const primero = Object.keys(MODULOS).find((id) => puedeModulo(id)) || '';
      if (primero !== moduloActivo) setModuloActivo(primero);
    }
  }, [moduloActivo, puedeModulo]);

  const actual = moduloActivo && puedeModulo(moduloActivo) ? MODULOS[moduloActivo] : null;
  const ComponenteActivo = actual?.componente || null;

  return (
    <AppLayout
      moduloActivo={moduloActivo}
      onSelect={setModuloActivo}
      moduloActual={actual || { titulo: 'Panel administrativo', grupo: nombreEmpresa }}
    >
      {ComponenteActivo ? (
        <div className="space-y-6">
          <section className="min-w-0">
            <ComponenteActivo />
          </section>
        </div>
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-white/70 p-8 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
            <Icono nombre="candado" className="h-7 w-7" />
          </span>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">
            Tu cuenta no tiene módulos habilitados
          </h2>
          <p className="max-w-md text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            Pide a un superusuario que asigne un rol con permisos de acceso. Mientras tanto,
            puedes cambiar tu contraseña desde el menú de tu perfil.
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;
