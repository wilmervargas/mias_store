// Permiso .ver necesario para mostrar cada modulo del dashboard.
// El modulo "seguridad" se evalua con la regla especial puedeSeguridad.
export const ACCESO_MODULO = {
  divisas: null,
  productos: ['productos.ver', 'combos.ver'],
  inventario: 'inventario.ver',
  movimientos: 'movimientos.ver',
  almacenes: 'almacenes.ver',
  ubicaciones: 'ubicaciones.ver',
  categorias: 'categorias.ver',
  subcategorias: 'categorias.ver',
  marcas: 'marcas.ver',
  clasificacion: null,
  catalogos: 'catalogos.ver',
  unidades: 'unidades.ver',
  reportes: 'reportes.ver',
  whatsapp: 'whatsapp.ver',
  empresa: 'empresa.ver',
  seguridad: null,
};

export const GRUPOS_MENU = [
  {
    title: 'Panel de control',
    items: [
      { id: 'divisas', label: 'Divisas y tasas', icono: 'dinero', hint: 'Dólar, euro, USDT y monto personalizado' },
    ],
  },
  {
    title: 'Operación',
    items: [
      { id: 'productos', label: 'Productos y combos', icono: 'producto', hint: 'SKUs, variantes y combos' },
      { id: 'inventario', label: 'Inventario', icono: 'inventario', hint: 'Stock por ubicación' },
      { id: 'movimientos', label: 'Movimientos / Kardex', icono: 'movimiento', hint: 'Entradas, salidas y ajustes' },
    ],
  },
  {
    title: 'Almacén',
    items: [
      { id: 'almacenes', label: 'Almacenes', icono: 'almacen', hint: 'Centros de almacenamiento' },
      { id: 'ubicaciones', label: 'Ubicaciones', icono: 'ubicacion', hint: 'Pasillos, estantes y zonas' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { id: 'clasificacion', label: 'Categorías y subcategorías', icono: 'categoria', hint: 'Clasificación comercial en pestañas' },
      { id: 'catalogos', label: 'Marcas, modelos, colores y tallas', icono: 'catalogo', hint: 'Atributos de variantes y marcas' },
      { id: 'unidades', label: 'Unidades de medida', icono: 'inventario', hint: 'Pieza, docena, paquete, etc.' },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { id: 'reportes', label: 'Reportes', icono: 'reporte', hint: 'Indicadores y resúmenes' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'empresa', label: 'Empresa', icono: 'ajustes', hint: 'Datos fiscales, contacto y logo' },
      { id: 'whatsapp', label: 'WhatsApp', icono: 'whatsapp', hint: 'Conexión y envío de mensajes' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { id: 'seguridad', label: 'Seguridad y Accesos', icono: 'escudo', hint: 'Usuarios, roles y claves' },
    ],
  },
];
