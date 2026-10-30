-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para mias_store
CREATE DATABASE IF NOT EXISTS `mias_store` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mias_store`;

-- Volcando estructura para tabla mias_store.almacenes
CREATE TABLE IF NOT EXISTS `almacenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('principal','tienda','deposito','transito') NOT NULL DEFAULT 'principal',
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_almacen_codigo` (`codigo`),
  KEY `idx_almacen_estatus` (`idestatus`),
  CONSTRAINT `fk_almacen_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.backup_items_carrito_v1
CREATE TABLE IF NOT EXISTS `backup_items_carrito_v1` (
  `id` int NOT NULL DEFAULT '0',
  `carrito_id` int DEFAULT NULL,
  `cliente_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `variante_id` int DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.backup_items_pedido_v1
CREATE TABLE IF NOT EXISTS `backup_items_pedido_v1` (
  `id` int NOT NULL DEFAULT '0',
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `variante_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `costo_unitario` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.backup_productos_v1
CREATE TABLE IF NOT EXISTS `backup_productos_v1` (
  `id` int NOT NULL DEFAULT '0',
  `idestatus` int NOT NULL,
  `idcategoria` int DEFAULT NULL,
  `idsubcategoria` int NOT NULL,
  `idmarca` int NOT NULL,
  `idmodelo` int DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb3,
  `tipo` varchar(9) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `estrellas` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT '0.00',
  `preciofull` decimal(12,2) NOT NULL DEFAULT '0.00',
  `costo` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL,
  `imagen` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.carritos
CREATE TABLE IF NOT EXISTS `carritos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carrito_cliente` (`cliente_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idestatus` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categorias_ibfk_1` (`idestatus`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.colores
CREATE TABLE IF NOT EXISTS `colores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(40) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `hex` char(7) DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_color_codigo` (`codigo`),
  KEY `idx_color_estatus` (`idestatus`),
  CONSTRAINT `fk_color_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.dolar
CREATE TABLE IF NOT EXISTS `dolar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.estatus
CREATE TABLE IF NOT EXISTS `estatus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.inventario_stock
CREATE TABLE IF NOT EXISTS `inventario_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `almacen_id` int NOT NULL,
  `ubicacion_id` int NOT NULL,
  `stock_actual` int NOT NULL DEFAULT '0',
  `stock_reservado` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '5',
  `stock_maximo` int DEFAULT NULL,
  `inventario_inicial` int NOT NULL,
  `fecha_inventario_inicial` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_entrada` datetime DEFAULT NULL,
  `ultima_salida` datetime DEFAULT NULL,
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventario_variante_ubicacion` (`variante_id`,`ubicacion_id`),
  KEY `idx_inventario_almacen` (`almacen_id`,`variante_id`),
  KEY `idx_inventario_ubicacion` (`ubicacion_id`),
  KEY `idx_inventario_estatus` (`idestatus`),
  KEY `fk_inventario_ubicacion` (`almacen_id`,`ubicacion_id`),
  CONSTRAINT `fk_inventario_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventario_ubicacion` FOREIGN KEY (`almacen_id`, `ubicacion_id`) REFERENCES `ubicaciones` (`almacen_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventario_variante` FOREIGN KEY (`variante_id`) REFERENCES `producto_variantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inventario_inicial` CHECK ((`inventario_inicial` >= 0)),
  CONSTRAINT `chk_inventario_maximo` CHECK (((`stock_maximo` is null) or (`stock_maximo` >= 0))),
  CONSTRAINT `chk_inventario_minimo` CHECK ((`stock_minimo` >= 0)),
  CONSTRAINT `chk_inventario_reservado` CHECK ((`stock_reservado` >= 0)),
  CONSTRAINT `chk_inventario_reservado_menor` CHECK ((`stock_reservado` <= `stock_actual`)),
  CONSTRAINT `chk_inventario_stock_actual` CHECK ((`stock_actual` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=398 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.items_carrito
CREATE TABLE IF NOT EXISTS `items_carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `carrito_id` int DEFAULT NULL,
  `cliente_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `variante_id` int DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carrito_cliente_variante` (`cliente_id`,`variante_id`),
  KEY `producto_id` (`producto_id`),
  KEY `items_carrito_ibfk_3` (`carrito_id`),
  KEY `idx_item_carrito_variante` (`variante_id`),
  CONSTRAINT `fk_item_carrito_variante` FOREIGN KEY (`variante_id`) REFERENCES `producto_variantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `items_carrito_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `items_carrito_ibfk_3` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.items_pedido
CREATE TABLE IF NOT EXISTS `items_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `variante_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `costo_unitario` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  KEY `idx_item_pedido_variante` (`variante_id`),
  CONSTRAINT `fk_item_pedido_variante` FOREIGN KEY (`variante_id`) REFERENCES `producto_variantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `items_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `items_pedido_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.marcas
CREATE TABLE IF NOT EXISTS `marcas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idestatus` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `marcas_ibfk_1` (`idestatus`),
  CONSTRAINT `marcas_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.modelos
CREATE TABLE IF NOT EXISTS `modelos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idmarca` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modelo_marca_nombre` (`idmarca`,`nombre`),
  KEY `idx_modelo_marca` (`idmarca`),
  KEY `idx_modelo_codigo` (`codigo`),
  KEY `idx_modelo_estatus` (`idestatus`),
  CONSTRAINT `fk_modelo_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_modelo_marca` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.movimientos_inventario
CREATE TABLE IF NOT EXISTS `movimientos_inventario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `almacen_id` int NOT NULL,
  `ubicacion_id` int NOT NULL,
  `tipo` enum('inicial','entrada','salida','ajuste','transferencia_salida','transferencia_entrada','venta','devolucion','baja') NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL,
  `stock_nuevo` int NOT NULL,
  `costo_unitario` decimal(12,2) DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mov_variante_fecha` (`variante_id`,`created_at`),
  KEY `idx_mov_almacen_fecha` (`almacen_id`,`created_at`),
  KEY `idx_mov_tipo` (`tipo`),
  KEY `idx_mov_referencia` (`referencia_tipo`,`referencia_id`),
  KEY `idx_mov_usuario` (`usuario_id`),
  KEY `fk_mov_ubicacion` (`almacen_id`,`ubicacion_id`),
  KEY `idx_mov_referencia_tipo_id` (`referencia_tipo`,`referencia_id`,`created_at`),
  CONSTRAINT `fk_mov_ubicacion` FOREIGN KEY (`almacen_id`, `ubicacion_id`) REFERENCES `ubicaciones` (`almacen_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_variante` FOREIGN KEY (`variante_id`) REFERENCES `producto_variantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_mov_stock_anterior` CHECK ((`stock_anterior` >= 0)),
  CONSTRAINT `chk_mov_stock_nuevo` CHECK ((`stock_nuevo` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=529 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.pedidos
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(12,2) NOT NULL,
  `estado` enum('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `direccion_envio` text,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `numero_referencia` varchar(100) DEFAULT NULL,
  `tasa_dolar_usada` decimal(10,4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.productos
CREATE TABLE IF NOT EXISTS `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idestatus` int NOT NULL,
  `idcategoria` int DEFAULT NULL,
  `idsubcategoria` int NOT NULL,
  `idmarca` int NOT NULL,
  `idmodelo` int DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `descripcion` text,
  `tipo` varchar(9) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `estrellas` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT '0.00',
  `preciofull` decimal(12,2) NOT NULL DEFAULT '0.00',
  `costo` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL,
  `imagen` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `productos_ibfk_1` (`idcategoria`),
  KEY `productos_ibfk_2` (`idsubcategoria`),
  KEY `productos_ibfk_3` (`idmarca`),
  KEY `productos_ibfk_4` (`idestatus`),
  KEY `idx_producto_modelo` (`idmodelo`),
  CONSTRAINT `fk_producto_modelo` FOREIGN KEY (`idmodelo`) REFERENCES `modelos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`idsubcategoria`) REFERENCES `subcategorias` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `productos_ibfk_4` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_producto_costo` CHECK ((`costo` >= 0)),
  CONSTRAINT `chk_producto_precio` CHECK ((`precio` >= 0)),
  CONSTRAINT `chk_producto_preciofull` CHECK ((`preciofull` >= 0)),
  CONSTRAINT `chk_producto_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=399 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.producto_variantes
CREATE TABLE IF NOT EXISTS `producto_variantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `sku` varchar(64) NOT NULL,
  `codigo_barras` varchar(64) DEFAULT NULL,
  `talla_id` int DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `modelo_id` int DEFAULT NULL,
  `clave_variante` varchar(100) NOT NULL DEFAULT '',
  `atributos` json DEFAULT NULL,
  `referencia` varchar(150) DEFAULT NULL,
  `es_base` tinyint(1) NOT NULL DEFAULT '0',
  `base_producto_id` int DEFAULT NULL,
  `combinacion_hash` char(64) NOT NULL,
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variante_sku` (`sku`),
  UNIQUE KEY `uq_variante_combinacion` (`combinacion_hash`),
  UNIQUE KEY `uq_variante_barras` (`codigo_barras`),
  UNIQUE KEY `uq_variante_base` (`base_producto_id`),
  KEY `idx_variante_producto` (`producto_id`),
  KEY `idx_variante_talla` (`talla_id`),
  KEY `idx_variante_color` (`color_id`),
  KEY `idx_variante_modelo` (`modelo_id`),
  KEY `idx_variante_estatus` (`idestatus`),
  CONSTRAINT `fk_variante_color` FOREIGN KEY (`color_id`) REFERENCES `colores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_variante_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_variante_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `modelos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_variante_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_variante_talla` FOREIGN KEY (`talla_id`) REFERENCES `tallas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=397 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.schema_migrations
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schema_version` (`version`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para procedimiento mias_store.sp_add_check_if_not_exists
DELIMITER //
CREATE PROCEDURE `sp_add_check_if_not_exists`(
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
END//
DELIMITER ;

-- Volcando estructura para procedimiento mias_store.sp_add_column_if_not_exists
DELIMITER //
CREATE PROCEDURE `sp_add_column_if_not_exists`(
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
END//
DELIMITER ;

-- Volcando estructura para procedimiento mias_store.sp_add_fk_if_not_exists
DELIMITER //
CREATE PROCEDURE `sp_add_fk_if_not_exists`(
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
END//
DELIMITER ;

-- Volcando estructura para procedimiento mias_store.sp_add_index_if_not_exists
DELIMITER //
CREATE PROCEDURE `sp_add_index_if_not_exists`(
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
END//
DELIMITER ;

-- Volcando estructura para procedimiento mias_store.sp_recalcular_stock_producto
DELIMITER //
CREATE PROCEDURE `sp_recalcular_stock_producto`(IN p_producto_id INT)
BEGIN
  UPDATE productos p
  SET p.stock = (
    SELECT COALESCE(SUM(i.stock_actual - i.stock_reservado), 0)
    FROM inventario_stock i
    INNER JOIN producto_variantes v ON v.id = i.variante_id
    WHERE v.producto_id = p_producto_id
      AND v.idestatus = 1
      AND i.idestatus = 1
  )
  WHERE p.id = p_producto_id;
END//
DELIMITER ;

-- Volcando estructura para tabla mias_store.subcategorias
CREATE TABLE IF NOT EXISTS `subcategorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idcategoria` int NOT NULL,
  `idestatus` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subcategorias_ibfk_1` (`idcategoria`),
  KEY `subcategorias_ibfk_2` (`idestatus`),
  CONSTRAINT `subcategorias_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `subcategorias_ibfk_2` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.tallas
CREATE TABLE IF NOT EXISTS `tallas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `sistema` enum('ropa','calzado','nino','cama','unica','otro') NOT NULL DEFAULT 'unica',
  `orden` int NOT NULL DEFAULT '0',
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_talla_codigo` (`codigo`),
  KEY `idx_talla_estatus` (`idestatus`),
  CONSTRAINT `fk_talla_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.ubicaciones
CREATE TABLE IF NOT EXISTS `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `almacen_id` int NOT NULL,
  `codigo` varchar(40) NOT NULL,
  `pasillo` varchar(20) DEFAULT NULL,
  `estante` varchar(20) DEFAULT NULL,
  `sector` varchar(20) DEFAULT NULL,
  `nivel` varchar(20) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `idestatus` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ubicacion_codigo` (`almacen_id`,`codigo`),
  UNIQUE KEY `uq_ubicacion_almacen_id` (`almacen_id`,`id`),
  KEY `idx_ubicacion_almacen` (`almacen_id`),
  KEY `idx_ubicacion_estatus` (`idestatus`),
  CONSTRAINT `fk_ubicacion_almacen` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ubicacion_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla mias_store.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','superadmin','operador') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'admin',
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para vista mias_store.vw_clasificacion_pendiente
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_clasificacion_pendiente` (
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`idcategoria` INT NULL,
	`idsubcategoria` INT NOT NULL,
	`categoria` VARCHAR(1) NULL COLLATE 'utf8mb3_general_ci',
	`marca` VARCHAR(1) NULL COLLATE 'utf8mb3_general_ci',
	`variante_id` INT NOT NULL,
	`sku` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`talla` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`color` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`modelo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`falta_color` INT NOT NULL,
	`falta_modelo` INT NOT NULL,
	`falta_talla` INT NULL
) ENGINE=MyISAM;

-- Volcando estructura para vista mias_store.vw_inventario_detalle
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_inventario_detalle` (
	`inventario_id` INT NOT NULL,
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`costo` DECIMAL(12,2) NOT NULL,
	`precio` DECIMAL(12,2) NOT NULL,
	`preciofull` DECIMAL(12,2) NOT NULL,
	`variante_id` INT NOT NULL,
	`sku` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`codigo_barras` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`clave_variante` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`talla` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`color` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`modelo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`almacen_id` INT NOT NULL,
	`almacen_codigo` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`almacen` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ubicacion_id` INT NOT NULL,
	`ubicacion_codigo` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`pasillo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`estante` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`sector` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`nivel` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`stock_actual` INT NOT NULL,
	`stock_reservado` INT NOT NULL,
	`stock_disponible` BIGINT NOT NULL,
	`stock_minimo` INT NOT NULL,
	`stock_maximo` INT NULL,
	`inventario_inicial` INT NOT NULL,
	`fecha_inventario_inicial` DATETIME NOT NULL,
	`ultima_entrada` DATETIME NULL,
	`ultima_salida` DATETIME NULL,
	`idestatus` INT NOT NULL
) ENGINE=MyISAM;

-- Volcando estructura para vista mias_store.vw_kardex
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_kardex` (
	`movimiento_id` BIGINT NOT NULL,
	`created_at` TIMESTAMP NULL,
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`sku` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`talla` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`color` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`modelo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`almacen` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ubicacion_codigo` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`pasillo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`estante` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`sector` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`nivel` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`tipo` ENUM('inicial','entrada','salida','ajuste','transferencia_salida','transferencia_entrada','venta','devolucion','baja') NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`cantidad` INT NOT NULL,
	`stock_anterior` INT NOT NULL,
	`stock_nuevo` INT NOT NULL,
	`costo_unitario` DECIMAL(12,2) NULL,
	`motivo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia_tipo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia_id` INT NULL,
	`usuario` VARCHAR(1) NULL COLLATE 'utf8mb3_general_ci'
) ENGINE=MyISAM;

-- Volcando estructura para vista mias_store.vw_producto_stock
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_producto_stock` (
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`costo` DECIMAL(12,2) NOT NULL,
	`precio` DECIMAL(12,2) NOT NULL,
	`preciofull` DECIMAL(12,2) NOT NULL,
	`margen_unitario` DECIMAL(13,2) NOT NULL,
	`variantes` BIGINT NOT NULL,
	`stock_total` DECIMAL(33,0) NOT NULL,
	`valor_costo` DECIMAL(45,2) NOT NULL,
	`valor_venta` DECIMAL(45,2) NOT NULL,
	`stock_cache` INT NOT NULL,
	`idestatus` INT NOT NULL
) ENGINE=MyISAM;

-- Volcando estructura para vista mias_store.vw_stock_critico
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_stock_critico` (
	`inventario_id` INT NOT NULL,
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`sku` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`referencia` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`almacen` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ubicacion_codigo` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`pasillo` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`estante` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`sector` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`nivel` VARCHAR(1) NULL COLLATE 'utf8mb4_0900_ai_ci',
	`stock_actual` INT NOT NULL,
	`stock_reservado` INT NOT NULL,
	`stock_disponible` BIGINT NOT NULL,
	`stock_minimo` INT NOT NULL
) ENGINE=MyISAM;

-- Volcando estructura para vista mias_store.vw_stock_por_almacen
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `vw_stock_por_almacen` (
	`producto_id` INT NOT NULL,
	`producto` VARCHAR(1) NOT NULL COLLATE 'utf8mb3_general_ci',
	`almacen_id` INT NOT NULL,
	`almacen_codigo` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`almacen` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`stock_disponible` DECIMAL(33,0) NOT NULL
) ENGINE=MyISAM;

-- Volcando estructura para disparador mias_store.trg_inv_ad
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_inv_ad` AFTER DELETE ON `inventario_stock` FOR EACH ROW BEGIN
  DECLARE v_producto_id INT;
  DECLARE v_variante_activa INT;

  SELECT producto_id, idestatus
    INTO v_producto_id, v_variante_activa
  FROM producto_variantes
  WHERE id = OLD.variante_id;

  IF OLD.idestatus = 1 AND v_variante_activa = 1 THEN
    UPDATE productos
    SET stock = stock - (OLD.stock_actual - OLD.stock_reservado)
    WHERE id = v_producto_id;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_inv_ai
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_inv_ai` AFTER INSERT ON `inventario_stock` FOR EACH ROW BEGIN
  DECLARE v_producto_id INT;
  DECLARE v_variante_activa INT;

  SELECT producto_id, idestatus
    INTO v_producto_id, v_variante_activa
  FROM producto_variantes
  WHERE id = NEW.variante_id;

  IF NEW.idestatus = 1 AND v_variante_activa = 1 THEN
    UPDATE productos
    SET stock = stock + (NEW.stock_actual - NEW.stock_reservado)
    WHERE id = v_producto_id;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_inv_au
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_inv_au` AFTER UPDATE ON `inventario_stock` FOR EACH ROW BEGIN
  DECLARE v_old_producto_id INT;
  DECLARE v_new_producto_id INT;
  DECLARE v_old_variante_activa INT;
  DECLARE v_new_variante_activa INT;

  SELECT producto_id, idestatus
    INTO v_old_producto_id, v_old_variante_activa
  FROM producto_variantes
  WHERE id = OLD.variante_id;

  SELECT producto_id, idestatus
    INTO v_new_producto_id, v_new_variante_activa
  FROM producto_variantes
  WHERE id = NEW.variante_id;

  IF OLD.idestatus = 1 AND v_old_variante_activa = 1 THEN
    UPDATE productos
    SET stock = stock - (OLD.stock_actual - OLD.stock_reservado)
    WHERE id = v_old_producto_id;
  END IF;

  IF NEW.idestatus = 1 AND v_new_variante_activa = 1 THEN
    UPDATE productos
    SET stock = stock + (NEW.stock_actual - NEW.stock_reservado)
    WHERE id = v_new_producto_id;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_inv_inicial_bu
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_inv_inicial_bu` BEFORE UPDATE ON `inventario_stock` FOR EACH ROW BEGIN
  IF NOT (NEW.inventario_inicial <=> OLD.inventario_inicial) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El inventario inicial es inmutable y no puede modificarse';
  END IF;

  IF NOT (NEW.fecha_inventario_inicial <=> OLD.fecha_inventario_inicial) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La fecha del inventario inicial es inmutable';
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_inv_no_delete_bd
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_inv_no_delete_bd` BEFORE DELETE ON `inventario_stock` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se puede eliminar una fila de inventario; use idestatus = 2';
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_var_ad
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_var_ad` AFTER DELETE ON `producto_variantes` FOR EACH ROW BEGIN
  CALL sp_recalcular_stock_producto(OLD.producto_id);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_var_au
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_var_au` AFTER UPDATE ON `producto_variantes` FOR EACH ROW BEGIN
  IF NOT (OLD.producto_id <=> NEW.producto_id)
     OR NOT (OLD.idestatus <=> NEW.idestatus) THEN

    CALL sp_recalcular_stock_producto(OLD.producto_id);

    IF NOT (OLD.producto_id <=> NEW.producto_id) THEN
      CALL sp_recalcular_stock_producto(NEW.producto_id);
    END IF;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_var_base_bi
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_var_base_bi` BEFORE INSERT ON `producto_variantes` FOR EACH ROW BEGIN
  SET NEW.base_producto_id = IF(NEW.es_base = 1, NEW.producto_id, NULL);
  SET NEW.combinacion_hash = SHA2(CONCAT_WS('|',
    NEW.producto_id,
    COALESCE(NEW.talla_id, 0),
    COALESCE(NEW.color_id, 0),
    COALESCE(NEW.modelo_id, 0),
    NEW.clave_variante
  ), 256);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador mias_store.trg_var_base_bu
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `trg_var_base_bu` BEFORE UPDATE ON `producto_variantes` FOR EACH ROW BEGIN
  SET NEW.base_producto_id = IF(NEW.es_base = 1, NEW.producto_id, NULL);
  SET NEW.combinacion_hash = SHA2(CONCAT_WS('|',
    NEW.producto_id,
    COALESCE(NEW.talla_id, 0),
    COALESCE(NEW.color_id, 0),
    COALESCE(NEW.modelo_id, 0),
    NEW.clave_variante
  ), 256);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_clasificacion_pendiente`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_clasificacion_pendiente` AS select `p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`p`.`idcategoria` AS `idcategoria`,`p`.`idsubcategoria` AS `idsubcategoria`,`cat`.`nombre` AS `categoria`,`mar`.`nombre` AS `marca`,`v`.`id` AS `variante_id`,`v`.`sku` AS `sku`,`v`.`referencia` AS `referencia`,`t`.`nombre` AS `talla`,`co`.`nombre` AS `color`,`mo`.`nombre` AS `modelo`,(`v`.`color_id` is null) AS `falta_color`,(`v`.`modelo_id` is null) AS `falta_modelo`,((`p`.`idsubcategoria` in (23,25)) and ((`v`.`talla_id` is null) or (`t`.`codigo` = 'UNICA'))) AS `falta_talla` from ((((((`productos` `p` join `producto_variantes` `v` on(((`v`.`producto_id` = `p`.`id`) and (`v`.`es_base` = 1)))) left join `categorias` `cat` on((`cat`.`id` = `p`.`idcategoria`))) left join `marcas` `mar` on((`mar`.`id` = `p`.`idmarca`))) left join `tallas` `t` on((`t`.`id` = `v`.`talla_id`))) left join `colores` `co` on((`co`.`id` = `v`.`color_id`))) left join `modelos` `mo` on((`mo`.`id` = `v`.`modelo_id`))) where ((`p`.`idestatus` = 1) and ((`v`.`color_id` is null) or (`v`.`modelo_id` is null) or ((`p`.`idsubcategoria` in (23,25)) and ((`v`.`talla_id` is null) or (`t`.`codigo` = 'UNICA')))));

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_inventario_detalle`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_inventario_detalle` AS select `i`.`id` AS `inventario_id`,`p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`p`.`costo` AS `costo`,`p`.`precio` AS `precio`,`p`.`preciofull` AS `preciofull`,`v`.`id` AS `variante_id`,`v`.`sku` AS `sku`,`v`.`codigo_barras` AS `codigo_barras`,`v`.`referencia` AS `referencia`,`v`.`clave_variante` AS `clave_variante`,`t`.`nombre` AS `talla`,`co`.`nombre` AS `color`,`mo`.`nombre` AS `modelo`,`a`.`id` AS `almacen_id`,`a`.`codigo` AS `almacen_codigo`,`a`.`nombre` AS `almacen`,`u`.`id` AS `ubicacion_id`,`u`.`codigo` AS `ubicacion_codigo`,`u`.`pasillo` AS `pasillo`,`u`.`estante` AS `estante`,`u`.`sector` AS `sector`,`u`.`nivel` AS `nivel`,`i`.`stock_actual` AS `stock_actual`,`i`.`stock_reservado` AS `stock_reservado`,(`i`.`stock_actual` - `i`.`stock_reservado`) AS `stock_disponible`,`i`.`stock_minimo` AS `stock_minimo`,`i`.`stock_maximo` AS `stock_maximo`,`i`.`inventario_inicial` AS `inventario_inicial`,`i`.`fecha_inventario_inicial` AS `fecha_inventario_inicial`,`i`.`ultima_entrada` AS `ultima_entrada`,`i`.`ultima_salida` AS `ultima_salida`,`i`.`idestatus` AS `idestatus` from (((((((`inventario_stock` `i` join `producto_variantes` `v` on((`v`.`id` = `i`.`variante_id`))) join `productos` `p` on((`p`.`id` = `v`.`producto_id`))) join `almacenes` `a` on((`a`.`id` = `i`.`almacen_id`))) join `ubicaciones` `u` on((`u`.`id` = `i`.`ubicacion_id`))) left join `tallas` `t` on((`t`.`id` = `v`.`talla_id`))) left join `colores` `co` on((`co`.`id` = `v`.`color_id`))) left join `modelos` `mo` on((`mo`.`id` = `v`.`modelo_id`)));

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_kardex`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_kardex` AS select `m`.`id` AS `movimiento_id`,`m`.`created_at` AS `created_at`,`p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`v`.`sku` AS `sku`,`v`.`referencia` AS `referencia`,`t`.`nombre` AS `talla`,`co`.`nombre` AS `color`,`mo`.`nombre` AS `modelo`,`a`.`nombre` AS `almacen`,`u`.`codigo` AS `ubicacion_codigo`,`u`.`pasillo` AS `pasillo`,`u`.`estante` AS `estante`,`u`.`sector` AS `sector`,`u`.`nivel` AS `nivel`,`m`.`tipo` AS `tipo`,`m`.`cantidad` AS `cantidad`,`m`.`stock_anterior` AS `stock_anterior`,`m`.`stock_nuevo` AS `stock_nuevo`,`m`.`costo_unitario` AS `costo_unitario`,`m`.`motivo` AS `motivo`,`m`.`referencia_tipo` AS `referencia_tipo`,`m`.`referencia_id` AS `referencia_id`,`us`.`nombre` AS `usuario` from ((((((((`movimientos_inventario` `m` join `producto_variantes` `v` on((`v`.`id` = `m`.`variante_id`))) join `productos` `p` on((`p`.`id` = `v`.`producto_id`))) join `almacenes` `a` on((`a`.`id` = `m`.`almacen_id`))) join `ubicaciones` `u` on((`u`.`id` = `m`.`ubicacion_id`))) left join `tallas` `t` on((`t`.`id` = `v`.`talla_id`))) left join `colores` `co` on((`co`.`id` = `v`.`color_id`))) left join `modelos` `mo` on((`mo`.`id` = `v`.`modelo_id`))) left join `usuarios` `us` on((`us`.`id` = `m`.`usuario_id`)));

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_producto_stock`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_producto_stock` AS select `p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`p`.`costo` AS `costo`,`p`.`precio` AS `precio`,`p`.`preciofull` AS `preciofull`,(`p`.`precio` - `p`.`costo`) AS `margen_unitario`,count(distinct `v`.`id`) AS `variantes`,coalesce(sum((`i`.`stock_actual` - `i`.`stock_reservado`)),0) AS `stock_total`,(coalesce(sum((`i`.`stock_actual` - `i`.`stock_reservado`)),0) * `p`.`costo`) AS `valor_costo`,(coalesce(sum((`i`.`stock_actual` - `i`.`stock_reservado`)),0) * `p`.`precio`) AS `valor_venta`,`p`.`stock` AS `stock_cache`,`p`.`idestatus` AS `idestatus` from ((`productos` `p` left join `producto_variantes` `v` on(((`v`.`producto_id` = `p`.`id`) and (`v`.`idestatus` = 1)))) left join `inventario_stock` `i` on(((`i`.`variante_id` = `v`.`id`) and (`i`.`idestatus` = 1)))) group by `p`.`id`,`p`.`nombre`,`p`.`costo`,`p`.`precio`,`p`.`preciofull`,`p`.`stock`,`p`.`idestatus`;

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_stock_critico`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_stock_critico` AS select `i`.`id` AS `inventario_id`,`p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`v`.`sku` AS `sku`,`v`.`referencia` AS `referencia`,`a`.`nombre` AS `almacen`,`u`.`codigo` AS `ubicacion_codigo`,`u`.`pasillo` AS `pasillo`,`u`.`estante` AS `estante`,`u`.`sector` AS `sector`,`u`.`nivel` AS `nivel`,`i`.`stock_actual` AS `stock_actual`,`i`.`stock_reservado` AS `stock_reservado`,(`i`.`stock_actual` - `i`.`stock_reservado`) AS `stock_disponible`,`i`.`stock_minimo` AS `stock_minimo` from ((((`inventario_stock` `i` join `producto_variantes` `v` on((`v`.`id` = `i`.`variante_id`))) join `productos` `p` on((`p`.`id` = `v`.`producto_id`))) join `almacenes` `a` on((`a`.`id` = `i`.`almacen_id`))) join `ubicaciones` `u` on((`u`.`id` = `i`.`ubicacion_id`))) where ((`i`.`idestatus` = 1) and (`v`.`idestatus` = 1) and (`p`.`idestatus` = 1) and ((`i`.`stock_actual` - `i`.`stock_reservado`) < `i`.`stock_minimo`));

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `vw_stock_por_almacen`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_stock_por_almacen` AS select `p`.`id` AS `producto_id`,`p`.`nombre` AS `producto`,`a`.`id` AS `almacen_id`,`a`.`codigo` AS `almacen_codigo`,`a`.`nombre` AS `almacen`,coalesce(sum((`i`.`stock_actual` - `i`.`stock_reservado`)),0) AS `stock_disponible` from (((`productos` `p` join `producto_variantes` `v` on(((`v`.`producto_id` = `p`.`id`) and (`v`.`idestatus` = 1)))) join `inventario_stock` `i` on(((`i`.`variante_id` = `v`.`id`) and (`i`.`idestatus` = 1)))) join `almacenes` `a` on((`a`.`id` = `i`.`almacen_id`))) group by `p`.`id`,`p`.`nombre`,`a`.`id`,`a`.`codigo`,`a`.`nombre`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
