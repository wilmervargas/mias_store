-- ============================================================
-- Mia's Store - Esquema completo de base de datos
-- Generado automÃ¡ticamente para bootstrap/reparaciÃ³n
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `mias_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `mias_store`;

-- --------------------------------------------------------
-- Tabla: almacenes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `almacenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_almacen_codigo` (`codigo`),
  KEY `idx_almacen_estatus` (`idestatus`),
  CONSTRAINT `fk_almacen_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: backup_items_carrito_v1
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `backup_items_carrito_v1` (
  `id` int(11) NOT NULL DEFAULT 0,
  `carrito_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `variante_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: carritos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carritos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: categorias
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categorias_ibfk_1` (`idestatus`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: clientes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: colores
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `colores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `codigo_hex` char(7) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_color_nombre` (`nombre`),
  KEY `idx_color_estatus` (`idestatus`),
  CONSTRAINT `fk_color_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: dolar
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `dolar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: estatus
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `estatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: inventario
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `producto_id` int(11) NOT NULL,
  `ubicacion_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `lote` varchar(50) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventario_producto_ubicacion` (`producto_id`,`ubicacion_id`),
  KEY `idx_inventario_ubicacion` (`ubicacion_id`),
  CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventario_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=543 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: items_carrito
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items_carrito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carrito_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  KEY `items_carrito_ibfk_3` (`carrito_id`),
  CONSTRAINT `items_carrito_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `items_carrito_ibfk_3` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: items_pedido
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items_pedido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `items_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `items_pedido_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: marcas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `marcas_ibfk_1` (`idestatus`),
  CONSTRAINT `marcas_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: modelos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `modelos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idmarca` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modelo_marca_nombre` (`idmarca`,`nombre`),
  KEY `idx_modelo_estatus` (`idestatus`),
  CONSTRAINT `fk_modelo_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  CONSTRAINT `fk_modelo_marca` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: movimientos_inventario
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `movimientos_inventario` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tipo` enum('entrada','salida','ajuste','transferencia','devolucion','venta','compra','migracion') NOT NULL,
  `producto_id` int(11) NOT NULL,
  `almacen_origen_id` int(11) DEFAULT NULL,
  `almacen_destino_id` int(11) DEFAULT NULL,
  `ubicacion_origen_id` int(11) DEFAULT NULL,
  `ubicacion_destino_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `costo_unitario` decimal(12,2) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `concepto` varchar(50) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mov_producto` (`producto_id`,`created_at`),
  KEY `idx_mov_almacen_origen` (`almacen_origen_id`),
  KEY `idx_mov_almacen_destino` (`almacen_destino_id`),
  KEY `idx_mov_tipo` (`tipo`,`created_at`),
  KEY `fk_mov_ubicacion_origen` (`ubicacion_origen_id`),
  KEY `fk_mov_ubicacion_destino` (`ubicacion_destino_id`),
  KEY `fk_mov_usuario` (`usuario_id`),
  CONSTRAINT `fk_mov_almacen_destino` FOREIGN KEY (`almacen_destino_id`) REFERENCES `almacenes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_almacen_origen` FOREIGN KEY (`almacen_origen_id`) REFERENCES `almacenes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mov_ubicacion_destino` FOREIGN KEY (`ubicacion_destino_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_ubicacion_origen` FOREIGN KEY (`ubicacion_origen_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=564 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: pedidos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `fecha_pedido` timestamp NULL DEFAULT current_timestamp(),
  `total` decimal(12,2) NOT NULL,
  `estado` enum('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `direccion_envio` text DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `numero_referencia` varchar(100) DEFAULT NULL,
  `tasa_dolar_usada` decimal(10,4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: permissions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(80) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permissions_code` (`code`),
  KEY `idx_permissions_module` (`module`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: producto_almacen
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `producto_almacen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `producto_id` int(11) NOT NULL,
  `almacen_id` int(11) NOT NULL,
  `sku_almacen` varchar(80) NOT NULL,
  `ubicacion_preferida_id` int(11) DEFAULT NULL,
  `stock_minimo` int(11) NOT NULL DEFAULT 0,
  `stock_maximo` int(11) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producto_almacen` (`producto_id`,`almacen_id`),
  UNIQUE KEY `uq_sku_almacen` (`sku_almacen`),
  KEY `idx_pa_almacen` (`almacen_id`),
  KEY `idx_pa_ubicacion` (`ubicacion_preferida_id`),
  KEY `idx_pa_estatus` (`idestatus`),
  CONSTRAINT `fk_pa_almacen` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`id`),
  CONSTRAINT `fk_pa_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  CONSTRAINT `fk_pa_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pa_ubicacion` FOREIGN KEY (`ubicacion_preferida_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=542 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------
-- Tabla: producto_imagenes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \producto_imagenes\ (
  \id\ int(11) NOT NULL AUTO_INCREMENT,
  \producto_id\ int(11) NOT NULL,
  \imagen\ varchar(150) NOT NULL,
  \orden\ int(11) NOT NULL DEFAULT 0,
  \created_at\ timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\id\),
  KEY \idx_pi_producto\ (\producto_id\,\orden\),
  CONSTRAINT \k_pi_producto\ FOREIGN KEY (\producto_id\) REFERENCES \productos\ (\id\) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: productos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `producto_base_id` int(11) DEFAULT NULL,
  `es_base` tinyint(1) NOT NULL DEFAULT 0,
  `idestatus` int(11) NOT NULL,
  `idcategoria` int(11) DEFAULT NULL,
  `idsubcategoria` int(11) NOT NULL,
  `idmarca` int(11) NOT NULL,
  `idmodelo` int(11) NOT NULL DEFAULT 1,
  `idcolor` int(11) NOT NULL DEFAULT 1,
  `idtalla` int(11) NOT NULL DEFAULT 1,
  `idunidad` int(11) NOT NULL DEFAULT 1,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `sku_base` varchar(64) NOT NULL,
  `codigo_producto` varchar(64) DEFAULT NULL,
  `codigo_detalle` varchar(64) DEFAULT NULL,
  `codigo_barras` varchar(64) DEFAULT NULL,
  `tipo` varchar(9) DEFAULT NULL,
  `estrellas` varchar(100) NOT NULL,
  `costo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `precio` decimal(12,2) NOT NULL,
  `preciofull` decimal(12,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_inicial` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 0,
  `stock_maximo` int(11) DEFAULT NULL,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'UND',
  `imagen` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producto_sku_base` (`sku_base`),
  UNIQUE KEY `uq_producto_codigo_barras` (`codigo_barras`),
  UNIQUE KEY `uq_producto_codigo_detalle` (`codigo_detalle`),
  KEY `productos_ibfk_1` (`idcategoria`),
  KEY `productos_ibfk_2` (`idsubcategoria`),
  KEY `productos_ibfk_3` (`idmarca`),
  KEY `productos_ibfk_4` (`idestatus`),
  KEY `idx_producto_modelo` (`idmodelo`),
  KEY `idx_producto_color` (`idcolor`),
  KEY `idx_producto_talla` (`idtalla`),
  KEY `idx_producto_base` (`producto_base_id`),
  KEY `idx_productos_idunidad` (`idunidad`),
  KEY `idx_producto_es_base` (`es_base`),
  KEY `idx_producto_codigo_producto` (`codigo_producto`),
  CONSTRAINT `fk_producto_base` FOREIGN KEY (`producto_base_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_producto_color` FOREIGN KEY (`idcolor`) REFERENCES `colores` (`id`),
  CONSTRAINT `fk_producto_modelo` FOREIGN KEY (`idmodelo`) REFERENCES `modelos` (`id`),
  CONSTRAINT `fk_producto_talla` FOREIGN KEY (`idtalla`) REFERENCES `tallas` (`id`),
  CONSTRAINT `fk_productos_unidad` FOREIGN KEY (`idunidad`) REFERENCES `unidades` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`idsubcategoria`) REFERENCES `subcategorias` (`id`),
  CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`),
  CONSTRAINT `productos_ibfk_4` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  CONSTRAINT `chk_producto_precio` CHECK (`precio` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=452 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: role_permissions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` int(10) unsigned NOT NULL,
  `permission_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: roles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: subcategorias
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subcategorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idcategoria` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subcategorias_ibfk_1` (`idcategoria`),
  KEY `subcategorias_ibfk_2` (`idestatus`),
  CONSTRAINT `subcategorias_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`),
  CONSTRAINT `subcategorias_ibfk_2` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: tallas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tallas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) NOT NULL,
  `tipo` enum('letra','numero','libre') NOT NULL DEFAULT 'libre',
  `orden` int(11) NOT NULL DEFAULT 0,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_talla_tipo_nombre` (`tipo`,`nombre`),
  KEY `idx_talla_estatus` (`idestatus`),
  CONSTRAINT `fk_talla_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: tasas_cambio
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasas_cambio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moneda` varchar(4) NOT NULL DEFAULT 'VES',
  `moneda_base` varchar(4) NOT NULL,
  `tasa` decimal(18,2) NOT NULL,
  `fuente` enum('bcv','usdt','manual','ajustada') NOT NULL DEFAULT 'manual',
  `vigente_desde` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tasa_moneda_base` (`moneda_base`),
  KEY `idx_tasa_vigente` (`vigente_desde`),
  KEY `idx_tasa_par_fecha` (`moneda`,`moneda_base`,`vigente_desde`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: tipos_ubicacion
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipos_ubicacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_ubicacion_nombre` (`nombre`),
  KEY `fk_tipo_ubicacion_estatus` (`idestatus`),
  CONSTRAINT `fk_tipo_ubicacion_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: ubicaciones
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ubicaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `almacen_id` int(11) NOT NULL,
  `padre_id` int(11) DEFAULT NULL,
  `idtipo_ubicacion` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `profundidad` tinyint(4) NOT NULL DEFAULT 0,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ubicacion_almacen_codigo` (`almacen_id`,`codigo`),
  KEY `idx_ubicacion_padre` (`padre_id`),
  KEY `idx_ubicacion_tipo` (`idtipo_ubicacion`),
  KEY `idx_ubicacion_estatus` (`idestatus`),
  CONSTRAINT `fk_ubicacion_almacen` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ubicacion_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  CONSTRAINT `fk_ubicacion_padre` FOREIGN KEY (`padre_id`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `fk_ubicacion_tipo` FOREIGN KEY (`idtipo_ubicacion`) REFERENCES `tipos_ubicacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: unidades
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `unidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `abreviatura` varchar(20) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_unidades_nombre` (`nombre`),
  UNIQUE KEY `uq_unidades_abreviatura` (`abreviatura`),
  KEY `idx_unidades_estatus` (`idestatus`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: user_permissions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_permissions` (
  `user_id` int(10) unsigned NOT NULL,
  `permission_id` int(10) unsigned NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `idx_user_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: user_roles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int(10) unsigned NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `idx_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_staff` tinyint(1) NOT NULL DEFAULT 0,
  `is_superuser` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_superuser` (`is_superuser`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: usuarios
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','superadmin','operador') DEFAULT 'admin',
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- Tabla: empresa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `empresa` (
  `id` int(11) NOT NULL DEFAULT 1,
  `razon_social` varchar(200) NOT NULL DEFAULT '',
  `nombre_comercial` varchar(200) NOT NULL DEFAULT '',
  `rif` varchar(30) NOT NULL DEFAULT '',
  `representante` varchar(150) NOT NULL DEFAULT '',
  `direccion` text DEFAULT NULL,
  `telefono` varchar(30) NOT NULL DEFAULT '',
  `telefonos` text DEFAULT NULL,
  `email` varchar(190) NOT NULL DEFAULT '',
  `eslogan` varchar(200) NOT NULL DEFAULT '',
  `logo` varchar(255) NOT NULL DEFAULT '',
  `moneda_base` varchar(3) NOT NULL DEFAULT 'USD',
  `iva_rate` decimal(5,2) NOT NULL DEFAULT 16.00,
  `igtf_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: combos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `combos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `sku` varchar(64) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `imagen` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_combo_sku` (`sku`),
  KEY `idx_combo_estatus` (`idestatus`),
  KEY `idx_combo_nombre` (`nombre`),
  CONSTRAINT `fk_combo_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: combo_detalle
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `combo_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `combo_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_combo_producto` (`combo_id`, `producto_id`),
  KEY `idx_combo_detalle_combo` (`combo_id`),
  KEY `idx_combo_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_combo_detalle_combo` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combo_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Vista: v_stock_almacen
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_almacen` AS select `i`.`producto_id` AS `producto_id`,`u`.`almacen_id` AS `almacen_id`,`a`.`nombre` AS `almacen`,coalesce(sum(`i`.`cantidad`),0) AS `stock` from ((`inventario` `i` join `ubicaciones` `u` on(`u`.`id` = `i`.`ubicacion_id`)) join `almacenes` `a` on(`a`.`id` = `u`.`almacen_id`)) group by `i`.`producto_id`,`u`.`almacen_id`,`a`.`nombre`;

-- Vista: v_stock_producto
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_producto` AS select `p`.`id` AS `producto_id`,`p`.`nombre` AS `nombre`,`p`.`sku_base` AS `sku_base`,coalesce(sum(`i`.`cantidad`),0) AS `stock_total` from (`productos` `p` left join `inventario` `i` on(`i`.`producto_id` = `p`.`id`)) group by `p`.`id`,`p`.`nombre`,`p`.`sku_base`;

-- Vista: v_stock_ubicacion
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_ubicacion` AS select `i`.`producto_id` AS `producto_id`,`i`.`ubicacion_id` AS `ubicacion_id`,`u`.`almacen_id` AS `almacen_id`,`u`.`codigo` AS `ubicacion_codigo`,`u`.`ruta` AS `ruta`,`i`.`cantidad` AS `cantidad` from (`inventario` `i` join `ubicaciones` `u` on(`u`.`id` = `i`.`ubicacion_id`));

-- Vista: v_valor_inventario
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_valor_inventario` AS select `p`.`id` AS `producto_id`,`p`.`nombre` AS `nombre`,`p`.`sku_base` AS `sku_base`,`p`.`costo` AS `costo`,`p`.`precio` AS `precio`,coalesce(sum(`i`.`cantidad`),0) AS `stock_total`,coalesce(sum(`i`.`cantidad`),0) * `p`.`costo` AS `valor_costo`,coalesce(sum(`i`.`cantidad`),0) * `p`.`precio` AS `valor_venta` from (`productos` `p` left join `inventario` `i` on(`i`.`producto_id` = `p`.`id`)) group by `p`.`id`,`p`.`nombre`,`p`.`sku_base`,`p`.`costo`,`p`.`precio`;

SET FOREIGN_KEY_CHECKS = 1;

