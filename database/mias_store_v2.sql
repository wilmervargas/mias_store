-- ============================================================
--  MIA'S STORE - Esquema limpio V2
--  Instalacion nueva con:
--    - costos y precios decimales
--    - modelos, colores y tallas
--    - SKU base global y SKU por almacen
--    - almacenes y ubicaciones fisicas en arbol
--    - inventario por ubicacion y auditoria de movimientos
--
--  Uso:
--    mysql -u root -D mias_store < database/mias_store_v2.sql
--
--  No incluye datos de productos ni pedidos: es una base limpia.
--  Para conservar los datos actuales usa database/migracion_v2.sql.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- 1. ESTATUS
-- ============================================================
DROP TABLE IF EXISTS items_carrito;
DROP TABLE IF EXISTS carritos;
DROP TABLE IF EXISTS items_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS producto_almacen;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS ubicaciones;
DROP TABLE IF EXISTS tipos_ubicacion;
DROP TABLE IF EXISTS almacenes;
DROP TABLE IF EXISTS tallas;
DROP TABLE IF EXISTS colores;
DROP TABLE IF EXISTS modelos;
DROP TABLE IF EXISTS marcas;
DROP TABLE IF EXISTS subcategorias;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS dolar;
DROP TABLE IF EXISTS estatus;

CREATE TABLE estatus (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 2. CATALOGOS DE PRODUCTO
-- ============================================================
CREATE TABLE categorias (
  id INT NOT NULL AUTO_INCREMENT,
  idestatus INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_categoria_estatus (idestatus),
  CONSTRAINT fk_categoria_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE subcategorias (
  id INT NOT NULL AUTO_INCREMENT,
  idcategoria INT NOT NULL,
  idestatus INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_subcategoria_categoria (idcategoria),
  KEY idx_subcategoria_estatus (idestatus),
  CONSTRAINT fk_subcategoria_categoria FOREIGN KEY (idcategoria) REFERENCES categorias (id),
  CONSTRAINT fk_subcategoria_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE marcas (
  id INT NOT NULL AUTO_INCREMENT,
  idestatus INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_marca_estatus (idestatus),
  CONSTRAINT fk_marca_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE modelos (
  id INT NOT NULL AUTO_INCREMENT,
  idmarca INT NULL,
  nombre VARCHAR(100) NOT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_modelo_marca_nombre (idmarca, nombre),
  KEY idx_modelo_estatus (idestatus),
  CONSTRAINT fk_modelo_marca FOREIGN KEY (idmarca) REFERENCES marcas (id) ON DELETE SET NULL,
  CONSTRAINT fk_modelo_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE colores (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  codigo_hex CHAR(7) NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_color_nombre (nombre),
  KEY idx_color_estatus (idestatus),
  CONSTRAINT fk_color_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tallas (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(20) NOT NULL,
  tipo ENUM('letra','numero','libre') NOT NULL DEFAULT 'libre',
  orden INT NOT NULL DEFAULT 0,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_talla_tipo_nombre (tipo, nombre),
  KEY idx_talla_estatus (idestatus),
  CONSTRAINT fk_talla_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 3. ALMACENES Y UBICACIONES
-- ============================================================
CREATE TABLE almacenes (
  id INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(30) NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_almacen_codigo (codigo),
  KEY idx_almacen_estatus (idestatus),
  CONSTRAINT fk_almacen_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tipos_ubicacion (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipo_ubicacion_nombre (nombre),
  CONSTRAINT fk_tipo_ubicacion_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE ubicaciones (
  id INT NOT NULL AUTO_INCREMENT,
  almacen_id INT NOT NULL,
  padre_id INT NULL,
  idtipo_ubicacion INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  ruta VARCHAR(255) NOT NULL,
  profundidad TINYINT NOT NULL DEFAULT 0,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ubicacion_almacen_codigo (almacen_id, codigo),
  KEY idx_ubicacion_padre (padre_id),
  KEY idx_ubicacion_tipo (idtipo_ubicacion),
  KEY idx_ubicacion_estatus (idestatus),
  CONSTRAINT fk_ubicacion_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON DELETE CASCADE,
  CONSTRAINT fk_ubicacion_padre FOREIGN KEY (padre_id) REFERENCES ubicaciones (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ubicacion_tipo FOREIGN KEY (idtipo_ubicacion) REFERENCES tipos_ubicacion (id),
  CONSTRAINT fk_ubicacion_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 4. USUARIOS, CLIENTES Y DOLAR
-- ============================================================
CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','superadmin','operador') DEFAULT 'admin',
  telefono VARCHAR(20) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE clientes (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NULL,
  direccion TEXT NULL,
  password_hash VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cliente_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE dolar (
  id INT NOT NULL AUTO_INCREMENT,
  fecha DATE NULL,
  monto DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 5. PRODUCTOS (una fila = una combinacion modelo/color/talla = un SKU)
-- ============================================================
CREATE TABLE productos (
  id INT NOT NULL AUTO_INCREMENT,
  producto_base_id INT NULL,
  idestatus INT NOT NULL,
  idcategoria INT NULL,
  idsubcategoria INT NOT NULL,
  idmarca INT NOT NULL,
  idmodelo INT NOT NULL DEFAULT 1,
  idcolor INT NOT NULL DEFAULT 1,
  idtalla INT NOT NULL DEFAULT 1,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  sku_base VARCHAR(64) NOT NULL,
  codigo_barras VARCHAR(64) NULL,
  tipo VARCHAR(9) NULL,
  estrellas VARCHAR(100) NOT NULL DEFAULT '5',
  costo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  precio DECIMAL(12,2) NOT NULL,
  preciofull DECIMAL(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UND',
  imagen VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_producto_sku_base (sku_base),
  UNIQUE KEY uq_producto_codigo_barras (codigo_barras),
  KEY idx_producto_categoria (idcategoria),
  KEY idx_producto_subcategoria (idsubcategoria),
  KEY idx_producto_marca (idmarca),
  KEY idx_producto_estatus (idestatus),
  KEY idx_producto_modelo (idmodelo),
  KEY idx_producto_color (idcolor),
  KEY idx_producto_talla (idtalla),
  KEY idx_producto_base (producto_base_id),
  CONSTRAINT fk_producto_base FOREIGN KEY (producto_base_id) REFERENCES productos (id) ON DELETE SET NULL,
  CONSTRAINT fk_producto_categoria FOREIGN KEY (idcategoria) REFERENCES categorias (id),
  CONSTRAINT fk_producto_subcategoria FOREIGN KEY (idsubcategoria) REFERENCES subcategorias (id),
  CONSTRAINT fk_producto_marca FOREIGN KEY (idmarca) REFERENCES marcas (id),
  CONSTRAINT fk_producto_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id),
  CONSTRAINT fk_producto_modelo FOREIGN KEY (idmodelo) REFERENCES modelos (id),
  CONSTRAINT fk_producto_color FOREIGN KEY (idcolor) REFERENCES colores (id),
  CONSTRAINT fk_producto_talla FOREIGN KEY (idtalla) REFERENCES tallas (id),
  CONSTRAINT chk_producto_costo CHECK (costo >= 0),
  CONSTRAINT chk_producto_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 6. SKU POR ALMACEN
-- ============================================================
CREATE TABLE producto_almacen (
  id INT NOT NULL AUTO_INCREMENT,
  producto_id INT NOT NULL,
  almacen_id INT NOT NULL,
  sku_almacen VARCHAR(80) NOT NULL,
  ubicacion_preferida_id INT NULL,
  stock_minimo INT NOT NULL DEFAULT 0,
  stock_maximo INT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_producto_almacen (producto_id, almacen_id),
  UNIQUE KEY uq_sku_almacen (sku_almacen),
  KEY idx_pa_almacen (almacen_id),
  KEY idx_pa_ubicacion (ubicacion_preferida_id),
  KEY idx_pa_estatus (idestatus),
  CONSTRAINT fk_pa_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id),
  CONSTRAINT fk_pa_ubicacion FOREIGN KEY (ubicacion_preferida_id) REFERENCES ubicaciones (id) ON DELETE SET NULL,
  CONSTRAINT fk_pa_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 7. INVENTARIO POR UBICACION FISICA
-- ============================================================
CREATE TABLE inventario (
  id INT NOT NULL AUTO_INCREMENT,
  producto_id INT NOT NULL,
  ubicacion_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  lote VARCHAR(50) NULL,
  fecha_vencimiento DATE NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventario_producto_ubicacion (producto_id, ubicacion_id),
  KEY idx_inventario_ubicacion (ubicacion_id),
  CONSTRAINT fk_inventario_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_inventario_ubicacion FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id),
  CONSTRAINT chk_inventario_cantidad CHECK (cantidad >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 8. MOVIMIENTOS DE INVENTARIO (AUDITORIA)
-- ============================================================
CREATE TABLE movimientos_inventario (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tipo ENUM('entrada','salida','ajuste','transferencia','devolucion','venta','compra','migracion') NOT NULL,
  producto_id INT NOT NULL,
  almacen_origen_id INT NULL,
  almacen_destino_id INT NULL,
  ubicacion_origen_id INT NULL,
  ubicacion_destino_id INT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(12,2) NULL,
  referencia VARCHAR(100) NULL,
  motivo VARCHAR(255) NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mov_producto (producto_id, created_at),
  KEY idx_mov_almacen_origen (almacen_origen_id),
  KEY idx_mov_almacen_destino (almacen_destino_id),
  KEY idx_mov_tipo (tipo, created_at),
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_almacen_origen FOREIGN KEY (almacen_origen_id) REFERENCES almacenes (id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_almacen_destino FOREIGN KEY (almacen_destino_id) REFERENCES almacenes (id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_ubicacion_origen FOREIGN KEY (ubicacion_origen_id) REFERENCES ubicaciones (id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_ubicacion_destino FOREIGN KEY (ubicacion_destino_id) REFERENCES ubicaciones (id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT chk_mov_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 9. PEDIDOS Y CARRITOS
-- ============================================================
CREATE TABLE pedidos (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  fecha_pedido TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(12,2) NOT NULL,
  estado ENUM('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
  direccion_envio TEXT NULL,
  metodo_pago VARCHAR(50) NULL,
  numero_referencia VARCHAR(100) NULL,
  tasa_dolar_usada DECIMAL(10,4) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE items_pedido (
  id INT NOT NULL AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_item_pedido (pedido_id),
  KEY idx_item_pedido_producto (producto_id),
  CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_pedido_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE carritos (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE items_carrito (
  id INT NOT NULL AUTO_INCREMENT,
  carrito_id INT NULL,
  cliente_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_item_carrito_producto (producto_id),
  KEY idx_item_carrito_carrito (carrito_id),
  CONSTRAINT fk_item_carrito_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_carrito_carrito FOREIGN KEY (carrito_id) REFERENCES carritos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 10. DATOS SEMILLA
-- ============================================================
INSERT INTO estatus (id, nombre) VALUES
  (1, 'Activo'),
  (2, 'Inactivo');

INSERT INTO categorias (id, idestatus, nombre, descripcion) VALUES
  (1, 1, 'Tecnología', 'breve descripción del la categoria'),
  (2, 1, 'Hogar & Decoración', 'Mobiliario, Textil, Menaje y Utensilios de Cocina (No eléctricos)'),
  (3, 1, 'Maquinaria & Línea Blanca', 'Equipos grandes y pequeños de funcionamiento eléctrico'),
  (6, 1, 'Alimentos', 'Alimentos descripción');

INSERT INTO subcategorias (id, idcategoria, idestatus, nombre) VALUES
  (1, 1, 1, 'Teléfonos y Smartphones'),
  (2, 1, 1, 'Audífonos'),
  (3, 1, 1, 'Cámaras de Seguridad'),
  (4, 1, 1, 'Cargadores y Cables'),
  (5, 1, 1, 'Impresoras'),
  (6, 1, 1, 'Parlantes y Cornetas'),
  (7, 1, 1, 'Laptops'),
  (8, 1, 1, 'Mini PC'),
  (9, 1, 1, 'Tablets'),
  (10, 1, 1, 'Monitores'),
  (11, 1, 1, 'Redes (Routers/Repetidores)'),
  (12, 1, 1, 'Periféricos (Mouse y Hubs)'),
  (13, 1, 1, 'Gaming (Sillas y Accesorios)'),
  (14, 1, 1, 'Smartwatches/Wearables'),
  (15, 1, 1, 'Teclados'),
  (16, 1, 1, 'Televisores'),
  (17, 3, 1, 'Planchado, Limpieza y Utensilios Eléctricos'),
  (18, 2, 1, 'Ventiladores'),
  (20, 3, 1, 'Protección Eléctrica'),
  (22, 2, 1, 'Cuidado Personal y Estética'),
  (23, 2, 1, 'Mobiliario y Dormitorio'),
  (24, 2, 1, 'Menaje y Utensilios de Cocina'),
  (25, 2, 1, 'Textiles (Toallas, Cobijas)'),
  (26, 2, 1, 'Soportes y Bases (TV)'),
  (27, 3, 1, 'Línea de Lavado (Lavadoras/Secadoras)'),
  (28, 3, 1, 'Refrigeración y Congelación'),
  (29, 3, 1, 'Aires Acondicionados'),
  (30, 3, 1, 'Cocción y Hornos (Topes, Cocinas)'),
  (31, 3, 1, 'Electrodomésticos de Cocina'),
  (32, 3, 1, 'Microondas'),
  (33, 3, 1, 'Campanas Extractoras');

INSERT INTO marcas (id, idestatus, nombre) VALUES
  (1, 1, 'Vidvie'),
  (2, 1, 'HONOR'),
  (3, 1, 'Lenyes'),
  (4, 1, 'Damasco Technology'),
  (5, 1, 'DAMASCO'),
  (6, 1, 'Hewlett-Packard'),
  (7, 1, 'Epson'),
  (8, 1, 'SAMSUNG'),
  (9, 1, 'OLAX'),
  (10, 1, 'REALME'),
  (11, 1, 'Tenda'),
  (12, 1, 'Razer'),
  (13, 1, 'TECNO'),
  (14, 1, 'XIAOMI'),
  (15, 1, 'XIAOMI REDMI'),
  (16, 1, 'ZTE'),
  (17, 1, 'ROYAL'),
  (18, 1, 'OSTER'),
  (19, 1, 'Damasco Home'),
  (20, 1, 'GENERICO'),
  (21, 1, 'PARADAYS'),
  (22, 1, 'DECAKILA'),
  (23, 1, 'AEGEAN'),
  (24, 1, 'WELL'),
  (25, 1, 'CLIPPED'),
  (26, 1, 'SOHO'),
  (27, 1, 'MAXIDREAMS'),
  (28, 1, 'indurama'),
  (29, 1, 'Midea'),
  (30, 1, 'Hamilton Beach'),
  (31, 1, 'Galanz'),
  (32, 1, 'LG'),
  (33, 1, 'Black & Decker'),
  (34, 1, 'RCA');

-- Sentinelas: evitan NULL en las llaves foraneas.
INSERT INTO modelos (id, idmarca, nombre, idestatus) VALUES
  (1, NULL, 'Sin modelo', 1);

INSERT INTO colores (id, nombre, codigo_hex, idestatus) VALUES
  (1,  'Sin color',    NULL, 1),
  (2,  'Negro',        '#000000', 1),
  (3,  'Blanco',       '#FFFFFF', 1),
  (4,  'Azul',         '#1E40AF', 1),
  (5,  'Verde',        '#16A34A', 1),
  (6,  'Gris',         '#6B7280', 1),
  (7,  'Plateado',     '#C0C0C0', 1),
  (8,  'Dorado',       '#D4AF37', 1),
  (9,  'Rosado',       '#F472B6', 1),
  (10, 'Purpura',      '#7E22CE', 1),
  (11, 'Morado',       '#6B21A8', 1),
  (12, 'Celeste',      '#38BDF8', 1),
  (13, 'Amarillo',     '#FACC15', 1),
  (14, 'Marron',       '#78350F', 1),
  (15, 'Beige',        '#D6C7A1', 1),
  (16, 'Rojo',         '#DC2626', 1),
  (17, 'Naranja',      '#F97316', 1),
  (18, 'Transparente', NULL, 1),
  (19, 'Titanio',      '#8A8D8F', 1),
  (20, 'Verde Claro',  '#86EFAC', 1),
  (21, 'Azul Oscuro',  '#1E3A8A', 1),
  (22, 'Rosa',         '#FB7185', 1),
  (23, 'Crema',        '#F5F0DC', 1),
  (24, 'Vinotinto',    '#7F1D1D', 1),
  (25, 'Turquesa',     '#14B8A6', 1);

INSERT INTO tallas (id, nombre, tipo, orden, idestatus) VALUES
  (1,  'Sin talla', 'libre',  0,  1),
  (2,  'XS',        'letra',  10, 1),
  (3,  'S',         'letra',  20, 1),
  (4,  'M',         'letra',  30, 1),
  (5,  'L',         'letra',  40, 1),
  (6,  'XL',        'letra',  50, 1),
  (7,  'XXL',       'letra',  60, 1),
  (8,  'XXXL',      'letra',  70, 1),
  (9,  '36',        'numero', 36, 1),
  (10, '37',        'numero', 37, 1),
  (11, '38',        'numero', 38, 1),
  (12, '39',        'numero', 39, 1),
  (13, '40',        'numero', 40, 1),
  (14, '41',        'numero', 41, 1),
  (15, '42',        'numero', 42, 1),
  (16, '43',        'numero', 43, 1),
  (17, '44',        'numero', 44, 1);

INSERT INTO tipos_ubicacion (id, nombre, idestatus) VALUES
  (1,  'General',  1),
  (2,  'Zona',     1),
  (3,  'Sector',   1),
  (4,  'Pasillo',  1),
  (5,  'Estante',  1),
  (6,  'Nivel',    1),
  (7,  'Posicion', 1),
  (8,  'Caja',     1),
  (9,  'Vitrina',  1),
  (10, 'Area',     1);

INSERT INTO almacenes (id, codigo, nombre, direccion, idestatus) VALUES
  (1, 'ALM01', 'Almacen Principal', 'Sede principal', 1);

INSERT INTO ubicaciones (id, almacen_id, padre_id, idtipo_ubicacion, codigo, nombre, ruta, profundidad, idestatus) VALUES
  (1, 1, NULL, 1, 'GEN',    'General',    'GEN', 0, 1),
  (2, 1, NULL, 2, 'ZONA-A', 'Zona A',     'ZONA-A', 0, 1),
  (3, 1, 2,    4, 'PAS-01', 'Pasillo 1',  'ZONA-A/PAS-01', 1, 1),
  (4, 1, 3,    5, 'EST-01', 'Estante 1',  'ZONA-A/PAS-01/EST-01', 2, 1),
  (5, 1, 4,    6, 'NIV-01', 'Nivel 1',    'ZONA-A/PAS-01/EST-01/NIV-01', 3, 1),
  (6, 1, 5,    7, 'POS-01', 'Posicion 1', 'ZONA-A/PAS-01/EST-01/NIV-01/POS-01', 4, 1);

-- ============================================================
-- 11. TRIGGERS: productos.stock = suma de inventario
-- ============================================================
DROP TRIGGER IF EXISTS trg_inventario_ai;
DROP TRIGGER IF EXISTS trg_inventario_au;
DROP TRIGGER IF EXISTS trg_inventario_ad;

DELIMITER //

CREATE TRIGGER trg_inventario_ai AFTER INSERT ON inventario
FOR EACH ROW
BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = NEW.producto_id)
  WHERE id = NEW.producto_id;
END//

CREATE TRIGGER trg_inventario_au AFTER UPDATE ON inventario
FOR EACH ROW
BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = OLD.producto_id)
  WHERE id = OLD.producto_id;

  IF NEW.producto_id <> OLD.producto_id THEN
    UPDATE productos
    SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = NEW.producto_id)
    WHERE id = NEW.producto_id;
  END IF;
END//

CREATE TRIGGER trg_inventario_ad AFTER DELETE ON inventario
FOR EACH ROW
BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = OLD.producto_id)
  WHERE id = OLD.producto_id;
END//

DELIMITER ;

-- ============================================================
-- 12. VISTAS DE CONSULTA
-- ============================================================
CREATE OR REPLACE VIEW v_stock_producto AS
SELECT
  p.id AS producto_id,
  p.nombre,
  p.sku_base,
  COALESCE(SUM(i.cantidad), 0) AS stock_total
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
GROUP BY p.id, p.nombre, p.sku_base;

CREATE OR REPLACE VIEW v_stock_almacen AS
SELECT
  i.producto_id,
  u.almacen_id,
  a.nombre AS almacen,
  COALESCE(SUM(i.cantidad), 0) AS stock
FROM inventario i
JOIN ubicaciones u ON u.id = i.ubicacion_id
JOIN almacenes a ON a.id = u.almacen_id
GROUP BY i.producto_id, u.almacen_id, a.nombre;

CREATE OR REPLACE VIEW v_stock_ubicacion AS
SELECT
  i.producto_id,
  i.ubicacion_id,
  u.almacen_id,
  u.codigo AS ubicacion_codigo,
  u.ruta,
  i.cantidad
FROM inventario i
JOIN ubicaciones u ON u.id = i.ubicacion_id;

CREATE OR REPLACE VIEW v_valor_inventario AS
SELECT
  p.id AS producto_id,
  p.nombre,
  p.sku_base,
  p.costo,
  p.precio,
  COALESCE(SUM(i.cantidad), 0) AS stock_total,
  COALESCE(SUM(i.cantidad), 0) * p.costo AS valor_costo,
  COALESCE(SUM(i.cantidad), 0) * p.precio AS valor_venta
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
GROUP BY p.id, p.nombre, p.sku_base, p.costo, p.precio;

-- ============================================================
-- 13. VERIFICACION
-- ============================================================
SELECT 'estatus' AS tabla, COUNT(*) AS filas FROM estatus
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'subcategorias', COUNT(*) FROM subcategorias
UNION ALL SELECT 'marcas', COUNT(*) FROM marcas
UNION ALL SELECT 'modelos', COUNT(*) FROM modelos
UNION ALL SELECT 'colores', COUNT(*) FROM colores
UNION ALL SELECT 'tallas', COUNT(*) FROM tallas
UNION ALL SELECT 'almacenes', COUNT(*) FROM almacenes
UNION ALL SELECT 'ubicaciones', COUNT(*) FROM ubicaciones
UNION ALL SELECT 'productos', COUNT(*) FROM productos;
