-- ============================================================
--  MIA'S STORE - Migracion V2
--  Pasa el inventario plano de productos.stock a:
--    almacenes -> ubicaciones -> inventario -> movimientos
--  Agrega modelo / color / talla / SKU base y SKU por almacen.
--
--  IMPORTANTE:
--   - Ejecutar sobre una copia primero.
--   - No contiene USE; se ejecuta con: mysql -u root -D mias_store < archivo.sql
--   - Es una migracion de una sola pasada.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;
START TRANSACTION;

-- ============================================================
-- 1. CATALOGOS DE PRODUCTO
-- ============================================================

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
  CONSTRAINT fk_modelo_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
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
  CONSTRAINT fk_color_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
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
  CONSTRAINT fk_talla_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sentinelas: permiten que las llaves foraneas sean NOT NULL sin usar NULL.
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

-- ============================================================
-- 2. ALMACENES Y UBICACIONES
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
  CONSTRAINT fk_almacen_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tipos_ubicacion (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipo_ubicacion_nombre (nombre),
  CONSTRAINT fk_tipo_ubicacion_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
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
  CONSTRAINT fk_ubicacion_tipo FOREIGN KEY (idtipo_ubicacion) REFERENCES tipos_ubicacion (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ubicacion_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  (1, 1, NULL, 1, 'GEN',    'General',     'GEN', 0, 1),
  (2, 1, NULL, 2, 'ZONA-A', 'Zona A',      'ZONA-A', 0, 1),
  (3, 1, 2,    4, 'PAS-01', 'Pasillo 1',   'ZONA-A/PAS-01', 1, 1),
  (4, 1, 3,    5, 'EST-01', 'Estante 1',   'ZONA-A/PAS-01/EST-01', 2, 1),
  (5, 1, 4,    6, 'NIV-01', 'Nivel 1',     'ZONA-A/PAS-01/EST-01/NIV-01', 3, 1),
  (6, 1, 5,    7, 'POS-01', 'Posicion 1',  'ZONA-A/PAS-01/EST-01/NIV-01/POS-01', 4, 1);

-- ============================================================
-- 3. PRODUCTOS: NUEVAS COLUMNAS
-- ============================================================

ALTER TABLE productos
  ADD COLUMN producto_base_id INT NULL AFTER id,
  ADD COLUMN idmodelo INT NOT NULL DEFAULT 1 AFTER idmarca,
  ADD COLUMN idcolor INT NOT NULL DEFAULT 1 AFTER idmodelo,
  ADD COLUMN idtalla INT NOT NULL DEFAULT 1 AFTER idcolor,
  ADD COLUMN sku_base VARCHAR(64) NULL AFTER nombre,
  ADD COLUMN codigo_barras VARCHAR(64) NULL AFTER sku_base,
  ADD COLUMN descripcion TEXT NULL AFTER nombre,
  ADD COLUMN unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UND' AFTER stock,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  MODIFY COLUMN costo DECIMAL(12,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN precio DECIMAL(12,2) NOT NULL,
  MODIFY COLUMN preciofull DECIMAL(12,2) NOT NULL,
  MODIFY COLUMN stock INT NOT NULL DEFAULT 0;

-- Mapear la talla de texto existente al catalogo de tallas.
CREATE TEMPORARY TABLE tmp_tallas (
  nombre VARCHAR(20) NOT NULL PRIMARY KEY
);

INSERT INTO tmp_tallas (nombre)
SELECT DISTINCT TRIM(talla)
FROM productos
WHERE talla IS NOT NULL AND TRIM(talla) <> '';

INSERT INTO tallas (nombre, tipo, orden, idestatus)
SELECT t.nombre, 'libre', 0, 1
FROM tmp_tallas t
LEFT JOIN tallas x ON x.nombre = t.nombre
WHERE x.id IS NULL;

DROP TEMPORARY TABLE tmp_tallas;

UPDATE productos p
SET p.idtalla = COALESCE(
  (SELECT t.id FROM tallas t WHERE t.nombre = TRIM(p.talla) ORDER BY t.id LIMIT 1),
  1
)
WHERE p.talla IS NOT NULL AND TRIM(p.talla) <> '';

-- Color detectado por nombre (el primero que coincida gana).
UPDATE productos SET idcolor = 20 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%VERDE CLARO%';
UPDATE productos SET idcolor = 21 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%AZUL OSCURO%';
UPDATE productos SET idcolor = 2  WHERE idcolor = 1 AND (UPPER(nombre) LIKE '%NEGRO%' OR UPPER(nombre) LIKE '%NEGRA%');
UPDATE productos SET idcolor = 3  WHERE idcolor = 1 AND (UPPER(nombre) LIKE '%BLANCO%' OR UPPER(nombre) LIKE '%BLANCA%');
UPDATE productos SET idcolor = 4  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%AZUL%';
UPDATE productos SET idcolor = 5  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%VERDE%';
UPDATE productos SET idcolor = 6  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%GRIS%';
UPDATE productos SET idcolor = 7  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%PLATEADO%';
UPDATE productos SET idcolor = 8  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%DORADO%';
UPDATE productos SET idcolor = 9  WHERE idcolor = 1 AND UPPER(nombre) LIKE '%ROSADO%';
UPDATE productos SET idcolor = 10 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%PURPURA%';
UPDATE productos SET idcolor = 11 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%MORADO%';
UPDATE productos SET idcolor = 12 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%CELESTE%';
UPDATE productos SET idcolor = 13 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%AMARILLO%';
UPDATE productos SET idcolor = 14 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%MARRON%';
UPDATE productos SET idcolor = 15 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%BEIGE%';
UPDATE productos SET idcolor = 16 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%ROJO%';
UPDATE productos SET idcolor = 17 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%NARANJA%';
UPDATE productos SET idcolor = 18 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%TRANSPARENTE%';
UPDATE productos SET idcolor = 19 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%TITANIO%';
UPDATE productos SET idcolor = 22 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%ROSA%';
UPDATE productos SET idcolor = 23 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%CREMA%';
UPDATE productos SET idcolor = 24 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%VINOTINTO%';
UPDATE productos SET idcolor = 25 WHERE idcolor = 1 AND UPPER(nombre) LIKE '%TURQUESA%';

-- SKU base inicial seguro. Luego se puede renombrar desde el dashboard.
UPDATE productos
SET sku_base = CONCAT('P-', LPAD(id, 5, '0'))
WHERE sku_base IS NULL OR sku_base = '';

-- Costo inicial provisional: 60% del precio.
UPDATE productos
SET costo = ROUND(precio * 0.60, 2)
WHERE costo = 0;

ALTER TABLE productos
  MODIFY COLUMN sku_base VARCHAR(64) NOT NULL,
  ADD UNIQUE KEY uq_producto_sku_base (sku_base),
  ADD UNIQUE KEY uq_producto_codigo_barras (codigo_barras),
  ADD KEY idx_producto_modelo (idmodelo),
  ADD KEY idx_producto_color (idcolor),
  ADD KEY idx_producto_talla (idtalla),
  ADD KEY idx_producto_base (producto_base_id),
  ADD CONSTRAINT fk_producto_modelo FOREIGN KEY (idmodelo) REFERENCES modelos (id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_producto_color FOREIGN KEY (idcolor) REFERENCES colores (id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_producto_talla FOREIGN KEY (idtalla) REFERENCES tallas (id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_producto_base FOREIGN KEY (producto_base_id) REFERENCES productos (id) ON DELETE SET NULL;

-- La columna talla de texto queda reemplazada por idtalla.
ALTER TABLE productos DROP COLUMN talla;

-- ============================================================
-- 4. SKU POR ALMACEN
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
  CONSTRAINT fk_pa_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pa_ubicacion FOREIGN KEY (ubicacion_preferida_id) REFERENCES ubicaciones (id) ON DELETE SET NULL,
  CONSTRAINT fk_pa_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO producto_almacen
  (producto_id, almacen_id, sku_almacen, ubicacion_preferida_id, stock_minimo, idestatus)
SELECT p.id, 1, CONCAT('ALM01-', p.sku_base), 1, 0, 1
FROM productos p;

-- ============================================================
-- 5. INVENTARIO POR UBICACION
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
  CONSTRAINT fk_inventario_ubicacion FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id) ON DELETE RESTRICT,
  CONSTRAINT chk_inventario_cantidad CHECK (cantidad >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO inventario (producto_id, ubicacion_id, cantidad)
SELECT id, 1, GREATEST(stock, 0)
FROM productos;

-- ============================================================
-- 6. MOVIMIENTOS DE INVENTARIO
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

INSERT INTO movimientos_inventario
  (tipo, producto_id, almacen_destino_id, ubicacion_destino_id, cantidad, costo_unitario, referencia, motivo)
SELECT 'migracion', id, 1, 1, stock, costo, 'Stock inicial migrado', 'Carga inicial desde productos.stock'
FROM productos
WHERE stock > 0;

-- ============================================================
-- 7. MANTENER productos.stock COMO TOTAL CACHEADO
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

UPDATE productos p
SET p.stock = (SELECT COALESCE(SUM(i.cantidad), 0) FROM inventario i WHERE i.producto_id = p.id);

-- ============================================================
-- 8. VISTAS DE CONSULTA
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

COMMIT;

-- ============================================================
-- 9. VERIFICACION
-- ============================================================

SELECT 'productos' AS tabla, COUNT(*) AS filas FROM productos
UNION ALL SELECT 'producto_almacen', COUNT(*) FROM producto_almacen
UNION ALL SELECT 'inventario', COUNT(*) FROM inventario
UNION ALL SELECT 'movimientos_inventario', COUNT(*) FROM movimientos_inventario
UNION ALL SELECT 'almacenes', COUNT(*) FROM almacenes
UNION ALL SELECT 'ubicaciones', COUNT(*) FROM ubicaciones;

SELECT
  (SELECT COALESCE(SUM(cantidad), 0) FROM inventario) AS total_inventario,
  (SELECT COALESCE(SUM(stock), 0) FROM productos) AS total_stock_cacheado;
