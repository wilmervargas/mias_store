// Permiso .ver necesario para mostrar cada modulo del dashboard.
// El modulo "seguridad" se evalua con la regla especial puedeSeguridad.
export const ACCESO_MODULO = {
  productos: 'productos.ver',
  inventario: 'inventario.ver',
  movimientos: 'movimientos.ver',
  almacenes: 'almacenes.ver',
  ubicaciones: 'ubicaciones.ver',
  categorias: 'categorias.ver',
  marcas: 'marcas.ver',
  catalogos: 'catalogos.ver',
  reportes: 'reportes.ver',
  whatsapp: 'whatsapp.ver',
  seguridad: null,
};

export const GRUPOS_MENU = [
  {
    title: 'Operación',
    items: [
      { id: 'productos', label: 'Productos', icono: 'producto', hint: 'SKUs, precios y ficha' },
      { id: 'inventario', label: 'Inventario', icono: 'inventario', hint: 'Stock por ubicación' },
      { id: 'movimientos', label: 'Movimientos', icono: 'movimiento', hint: 'Entradas, salidas y ajustes' },
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
      { id: 'categorias', label: 'Categorías', icono: 'categoria', hint: 'Familias principales' },
      { id: 'marcas', label: 'Marcas', icono: 'marca', hint: 'Fabricantes y marcas' },
      { id: 'catalogos', label: 'Modelos, colores y tallas', icono: 'catalogo', hint: 'Atributos de variantes' },
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
