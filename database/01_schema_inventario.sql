-- ============================================================
-- MIAS STORE - FASE 1: ESQUEMA DE INVENTARIO MULTIALMACEN
-- Base de datos: mias_store
-- MySQL 8.0.30+ / 8.4.x
--
-- Este script SOLO crea estructuras nuevas y agrega columnas.
-- No borra productos ni modifica datos existentes.
-- Ejecutar despues del backup:
--   database/backups/mias_store_antes_inventario.sql
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Tabla de control de migraciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT NOT NULL AUTO_INCREMENT,
  version VARCHAR(20) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schema_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- ALMACENES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS almacenes (
  id INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('principal','tienda','deposito','transito') NOT NULL DEFAULT 'principal',
  direccion VARCHAR(255) DEFAULT NULL,
  telefono VARCHAR(30) DEFAULT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_almacen_codigo (codigo),
  KEY idx_almacen_estatus (idestatus),
  CONSTRAINT fk_almacen_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- UBICACIONES FISICAS
-- pasillo / estante / sector / nivel
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ubicaciones (
  id INT NOT NULL AUTO_INCREMENT,
  almacen_id INT NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  pasillo VARCHAR(20) DEFAULT NULL,
  estante VARCHAR(20) DEFAULT NULL,
  sector VARCHAR(20) DEFAULT NULL,
  nivel VARCHAR(20) DEFAULT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ubicacion_codigo (almacen_id, codigo),
  UNIQUE KEY uq_ubicacion_almacen_id (almacen_id, id),
  KEY idx_ubicacion_almacen (almacen_id),
  KEY idx_ubicacion_estatus (idestatus),
  CONSTRAINT fk_ubicacion_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ubicacion_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- TALLAS
-- sistema: ropa, calzado, nino, cama, unica, otro
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tallas (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(20) NOT NULL,
  codigo VARCHAR(10) NOT NULL,
  sistema ENUM('ropa','calzado','nino','cama','unica','otro') NOT NULL DEFAULT 'unica',
  orden INT NOT NULL DEFAULT 0,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_talla_codigo (codigo),
  KEY idx_talla_estatus (idestatus),
  CONSTRAINT fk_talla_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- COLORES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colores (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(40) NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  hex CHAR(7) DEFAULT NULL,
  orden INT NOT NULL DEFAULT 0,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_color_codigo (codigo),
  KEY idx_color_estatus (idestatus),
  CONSTRAINT fk_color_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- MODELOS
-- Ej: Honor X8c, Samsung A26, Tecno Camon 30
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos (
  id INT NOT NULL AUTO_INCREMENT,
  idmarca INT DEFAULT NULL,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(30) DEFAULT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_modelo_marca_nombre (idmarca, nombre),
  KEY idx_modelo_marca (idmarca),
  KEY idx_modelo_codigo (codigo),
  KEY idx_modelo_estatus (idestatus),
  CONSTRAINT fk_modelo_marca FOREIGN KEY (idmarca) REFERENCES marcas (id) ON DELETE RESTRICT,
  CONSTRAINT fk_modelo_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- VARIANTES DEL PRODUCTO
-- Cada producto tiene al menos una variante base.
-- El SKU vive aqui, no en productos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producto_variantes (
  id INT NOT NULL AUTO_INCREMENT,
  producto_id INT NOT NULL,
  sku VARCHAR(64) NOT NULL,
  codigo_barras VARCHAR(64) DEFAULT NULL,
  talla_id INT DEFAULT NULL,
  color_id INT DEFAULT NULL,
  modelo_id INT DEFAULT NULL,
  clave_variante VARCHAR(100) NOT NULL DEFAULT '',
  atributos JSON DEFAULT NULL,
  referencia VARCHAR(150) DEFAULT NULL,
  es_base TINYINT(1) NOT NULL DEFAULT 0,
  base_producto_id INT DEFAULT NULL,
  combinacion_hash CHAR(64) NOT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variante_sku (sku),
  UNIQUE KEY uq_variante_barras (codigo_barras),
  UNIQUE KEY uq_variante_combinacion (combinacion_hash),
  UNIQUE KEY uq_variante_base (base_producto_id),
  KEY idx_variante_producto (producto_id),
  KEY idx_variante_talla (talla_id),
  KEY idx_variante_color (color_id),
  KEY idx_variante_modelo (modelo_id),
  KEY idx_variante_estatus (idestatus),
  CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_variante_talla FOREIGN KEY (talla_id) REFERENCES tallas (id) ON DELETE SET NULL,
  CONSTRAINT fk_variante_color FOREIGN KEY (color_id) REFERENCES colores (id) ON DELETE SET NULL,
  CONSTRAINT fk_variante_modelo FOREIGN KEY (modelo_id) REFERENCES modelos (id) ON DELETE SET NULL,
  CONSTRAINT fk_variante_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- INVENTARIO POR VARIANTE + ALMACEN + UBICACION
-- inventario_inicial es inmutable (protegido por trigger en 04)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_stock (
  id INT NOT NULL AUTO_INCREMENT,
  variante_id INT NOT NULL,
  almacen_id INT NOT NULL,
  ubicacion_id INT NOT NULL,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_reservado INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  stock_maximo INT DEFAULT NULL,
  inventario_inicial INT NOT NULL,
  fecha_inventario_inicial DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_entrada DATETIME DEFAULT NULL,
  ultima_salida DATETIME DEFAULT NULL,
  idestatus INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventario_variante_ubicacion (variante_id, ubicacion_id),
  KEY idx_inventario_almacen (almacen_id, variante_id),
  KEY idx_inventario_ubicacion (ubicacion_id),
  KEY idx_inventario_estatus (idestatus),
  CONSTRAINT chk_inventario_stock_actual CHECK (stock_actual >= 0),
  CONSTRAINT chk_inventario_reservado CHECK (stock_reservado >= 0),
  CONSTRAINT chk_inventario_reservado_menor CHECK (stock_reservado <= stock_actual),
  CONSTRAINT chk_inventario_minimo CHECK (stock_minimo >= 0),
  CONSTRAINT chk_inventario_maximo CHECK (stock_maximo IS NULL OR stock_maximo >= 0),
  CONSTRAINT chk_inventario_inicial CHECK (inventario_inicial >= 0),
  CONSTRAINT fk_inventario_variante FOREIGN KEY (variante_id) REFERENCES producto_variantes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inventario_ubicacion FOREIGN KEY (almacen_id, ubicacion_id) REFERENCES ubicaciones (almacen_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_inventario_estatus FOREIGN KEY (idestatus) REFERENCES estatus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- KARDEX: MOVIMIENTOS DE INVENTARIO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id BIGINT NOT NULL AUTO_INCREMENT,
  variante_id INT NOT NULL,
  almacen_id INT NOT NULL,
  ubicacion_id INT NOT NULL,
  tipo ENUM('inicial','entrada','salida','ajuste',
            'transferencia_salida','transferencia_entrada',
            'venta','devolucion','baja') NOT NULL,
  cantidad INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  costo_unitario DECIMAL(12,2) DEFAULT NULL,
  motivo VARCHAR(255) DEFAULT NULL,
  referencia_tipo VARCHAR(50) DEFAULT NULL,
  referencia_id INT DEFAULT NULL,
  usuario_id INT DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mov_variante_fecha (variante_id, created_at),
  KEY idx_mov_almacen_fecha (almacen_id, created_at),
  KEY idx_mov_tipo (tipo),
  KEY idx_mov_referencia (referencia_tipo, referencia_id),
  KEY idx_mov_usuario (usuario_id),
  CONSTRAINT chk_mov_stock_anterior CHECK (stock_anterior >= 0),
  CONSTRAINT chk_mov_stock_nuevo CHECK (stock_nuevo >= 0),
  CONSTRAINT fk_mov_variante FOREIGN KEY (variante_id) REFERENCES producto_variantes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_mov_ubicacion FOREIGN KEY (almacen_id, ubicacion_id) REFERENCES ubicaciones (almacen_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- PROCEDIMIENTOS AUXILIARES IDEMPOTENTES
-- Permiten volver a ejecutar el script sin errores.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_add_column_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_fk_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;

DELIMITER $$

CREATE PROCEDURE sp_add_column_if_not_exists(
  IN p_tabla VARCHAR(64),
  IN p_columna VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND COLUMN_NAME = p_columna
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN `', p_columna, '` ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE sp_add_index_if_not_exists(
  IN p_tabla VARCHAR(64),
  IN p_indice VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND INDEX_NAME = p_indice
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE sp_add_fk_if_not_exists(
  IN p_tabla VARCHAR(64),
  IN p_fk VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND CONSTRAINT_NAME = p_fk
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD CONSTRAINT `', p_fk, '` ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE sp_add_check_if_not_exists(
  IN p_tabla VARCHAR(64),
  IN p_check VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND CONSTRAINT_NAME = p_check
      AND CONSTRAINT_TYPE = 'CHECK'
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD CONSTRAINT `', p_check, '` ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

-- ------------------------------------------------------------
-- AMPLIACION DE PRODUCTOS
-- costo y precio con 2 decimales
-- ------------------------------------------------------------
CALL sp_add_column_if_not_exists('productos', 'costo',
  'DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER preciofull');
CALL sp_add_column_if_not_exists('productos', 'idmodelo',
  'INT DEFAULT NULL AFTER idmarca');
CALL sp_add_column_if_not_exists('productos', 'descripcion',
  'TEXT DEFAULT NULL AFTER nombre');
CALL sp_add_column_if_not_exists('productos', 'created_at',
  'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
CALL sp_add_column_if_not_exists('productos', 'updated_at',
  'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

ALTER TABLE productos
  MODIFY precio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  MODIFY preciofull DECIMAL(12,2) NOT NULL DEFAULT 0.00;

CALL sp_add_index_if_not_exists('productos', 'idx_producto_modelo',
  'KEY idx_producto_modelo (idmodelo)');

CALL sp_add_fk_if_not_exists('productos', 'fk_producto_modelo',
  'FOREIGN KEY (idmodelo) REFERENCES modelos (id) ON DELETE SET NULL');

CALL sp_add_check_if_not_exists('productos', 'chk_producto_stock',
  'CHECK (stock >= 0)');
CALL sp_add_check_if_not_exists('productos', 'chk_producto_costo',
  'CHECK (costo >= 0)');
CALL sp_add_check_if_not_exists('productos', 'chk_producto_precio',
  'CHECK (precio >= 0)');
CALL sp_add_check_if_not_exists('productos', 'chk_producto_preciofull',
  'CHECK (preciofull >= 0)');

-- ------------------------------------------------------------
-- REFERENCIA A VARIANTE EN CARRITO Y PEDIDOS
-- ------------------------------------------------------------
CALL sp_add_column_if_not_exists('items_carrito', 'variante_id',
  'INT DEFAULT NULL AFTER producto_id');
CALL sp_add_column_if_not_exists('items_pedido', 'variante_id',
  'INT DEFAULT NULL AFTER producto_id');
CALL sp_add_column_if_not_exists('items_pedido', 'costo_unitario',
  'DECIMAL(12,2) DEFAULT NULL AFTER precio_unitario');

CALL sp_add_index_if_not_exists('items_carrito', 'idx_item_carrito_variante',
  'KEY idx_item_carrito_variante (variante_id)');
CALL sp_add_index_if_not_exists('items_pedido', 'idx_item_pedido_variante',
  'KEY idx_item_pedido_variante (variante_id)');

CALL sp_add_fk_if_not_exists('items_carrito', 'fk_item_carrito_variante',
  'FOREIGN KEY (variante_id) REFERENCES producto_variantes (id) ON DELETE RESTRICT');
CALL sp_add_fk_if_not_exists('items_pedido', 'fk_item_pedido_variante',
  'FOREIGN KEY (variante_id) REFERENCES producto_variantes (id) ON DELETE RESTRICT');

-- ------------------------------------------------------------
-- REGISTRO DE MIGRACION
-- ------------------------------------------------------------
INSERT IGNORE INTO schema_migrations (version, descripcion)
VALUES ('01', 'Esquema de inventario multialmacen, variantes y kardex');

SELECT 'OK' AS resultado, '01_schema_inventario.sql ejecutado' AS mensaje;
