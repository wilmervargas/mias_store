-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-11-2026 a las 11:31:49
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mias_store`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `almacenes`
--

CREATE TABLE `almacenes` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `almacenes`
--

INSERT INTO `almacenes` (`id`, `codigo`, `nombre`, `direccion`, `telefono`, `idestatus`, `created_at`, `updated_at`) VALUES
(1, 'ALM01', 'Almacen Principal', 'Sede principal', '', 1, '2026-10-29 22:22:09', '2026-11-12 00:01:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `carritos`
--

INSERT INTO `carritos` (`id`, `cliente_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-11-26 18:21:23', '2025-11-26 18:21:23'),
(2, 2, '2025-11-26 18:21:23', '2025-11-26 18:21:23'),
(3, 3, '2025-11-26 18:21:23', '2025-11-26 18:21:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `idestatus`, `nombre`, `descripcion`) VALUES
(8, 1, 'Blusas Damas', 'Blusas con mucho estilo para Damas'),
(9, 1, 'Ropa para Damas', 'Ropa para Damas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `email`, `telefono`, `direccion`, `password_hash`, `created_at`) VALUES
(1, 'Ana Pérez', 'ana@example.com', '555-1111', NULL, '$2b$10$vXIr4x3802phkw1oAz1n.OUvpWqpqvFSDEpFMLRClopR5Svk.Pdl6', '2025-11-26 18:14:52'),
(2, 'Luis Gómez', 'luis@example.com', '555-2222', NULL, '$2b$10$UyimgqgYzqb3mPDLNwx.kOGj4Lv/LUNLDtxecosbXLBlJDT.wE1vW', '2025-11-26 18:14:52'),
(3, 'Carla Díaz', 'carla@example.com', '555-3333', NULL, '$2b$10$OFbcPNwUKSnLvN5Sckj3Oue8w3RCYr6sWClMGdjDmZJUDdRbwu28.', '2025-11-26 18:14:52'),
(4, 'Miguel Rojas', 'miguel@example.com', '555-4444', NULL, '$2b$10$YIrYYx1GunNh0qKBySrV3.3K1xlm.cZJJdtNjE7FVde5TFXQvGCha', '2025-11-26 18:14:52'),
(5, 'Sofía Martínez', 'sofia@example.com', '555-5555', NULL, '$2b$10$uGQ/nfkLR89WYk66H.brbe.CbqULFTlbXOYPD37fDoRWYr62aaLCi', '2025-11-26 18:14:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `colores`
--

CREATE TABLE `colores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `codigo_hex` char(7) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `colores`
--

INSERT INTO `colores` (`id`, `nombre`, `codigo_hex`, `idestatus`, `created_at`) VALUES
(1, 'Sin color', NULL, 1, '2026-10-29 22:22:07'),
(2, 'Negro', '#000000', 1, '2026-10-29 22:22:07'),
(3, 'Blanco', '#FFFFFF', 1, '2026-10-29 22:22:07'),
(4, 'Azul', '#1E40AF', 1, '2026-10-29 22:22:07'),
(5, 'Verde', '#16A34A', 1, '2026-10-29 22:22:07'),
(6, 'Gris', '#6B7280', 1, '2026-10-29 22:22:07'),
(7, 'Plateado', '#C0C0C0', 1, '2026-10-29 22:22:07'),
(8, 'Dorado', '#D4AF37', 1, '2026-10-29 22:22:07'),
(9, 'Rosado', '#F472B6', 1, '2026-10-29 22:22:07'),
(10, 'Purpura', '#7E22CE', 1, '2026-10-29 22:22:07'),
(11, 'Morado', '#6B21A8', 1, '2026-10-29 22:22:07'),
(12, 'Celeste', '#38BDF8', 1, '2026-10-29 22:22:07'),
(13, 'Amarillo', '#FACC15', 1, '2026-10-29 22:22:07'),
(14, 'Marron', '#78350F', 1, '2026-10-29 22:22:07'),
(15, 'Beige', '#D6C7A1', 1, '2026-10-29 22:22:07'),
(16, 'Rojo', '#DC2626', 1, '2026-10-29 22:22:07'),
(17, 'Naranja', '#F97316', 1, '2026-10-29 22:22:07'),
(18, 'Transparente', NULL, 1, '2026-10-29 22:22:07'),
(19, 'Titanio', '#8A8D8F', 1, '2026-10-29 22:22:07'),
(20, 'Verde Claro', '#86EFAC', 1, '2026-10-29 22:22:07'),
(21, 'Azul Oscuro', '#1E3A8A', 1, '2026-10-29 22:22:07'),
(22, 'Rosa', '#FB7185', 1, '2026-10-29 22:22:07'),
(23, 'Crema', '#F5F0DC', 1, '2026-10-29 22:22:07'),
(24, 'Vinotinto', '#7F1D1D', 1, '2026-10-29 22:22:07'),
(25, 'Turquesa', '#14B8A6', 1, '2026-10-29 22:22:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dolar`
--

CREATE TABLE `dolar` (
  `id` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `dolar`
--

INSERT INTO `dolar` (`id`, `fecha`, `monto`) VALUES
(1, '2025-11-26', 243.57),
(2, '2023-03-19', 607.39),
(3, '2026-07-02', 639.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estatus`
--

CREATE TABLE `estatus` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `estatus`
--

INSERT INTO `estatus` (`id`, `nombre`) VALUES
(1, 'Activo'),
(2, 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `ubicacion_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `lote` varchar(50) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id`, `producto_id`, `ubicacion_id`, `cantidad`, `lote`, `fecha_vencimiento`, `updated_at`) VALUES
(519, 1, 1, 22, NULL, NULL, '2026-11-12 01:53:35');

--
-- Disparadores `inventario`
--
DELIMITER $$
CREATE TRIGGER `trg_inventario_ad` AFTER DELETE ON `inventario` FOR EACH ROW BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = OLD.producto_id)
  WHERE id = OLD.producto_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_inventario_ai` AFTER INSERT ON `inventario` FOR EACH ROW BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = NEW.producto_id)
  WHERE id = NEW.producto_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_inventario_au` AFTER UPDATE ON `inventario` FOR EACH ROW BEGIN
  UPDATE productos
  SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = OLD.producto_id)
  WHERE id = OLD.producto_id;

  IF NEW.producto_id <> OLD.producto_id THEN
    UPDATE productos
    SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = NEW.producto_id)
    WHERE id = NEW.producto_id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items_carrito`
--

CREATE TABLE `items_carrito` (
  `id` int(11) NOT NULL,
  `carrito_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items_pedido`
--

CREATE TABLE `items_pedido` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcas`
--

CREATE TABLE `marcas` (
  `id` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `marcas`
--

INSERT INTO `marcas` (`id`, `idestatus`, `nombre`) VALUES
(1, 1, 'Variadas Mia\'s Store');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelos`
--

CREATE TABLE `modelos` (
  `id` int(11) NOT NULL,
  `idmarca` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modelos`
--

INSERT INTO `modelos` (`id`, `idmarca`, `nombre`, `idestatus`, `created_at`) VALUES
(2, 1, 'Blusas con Mangas', 1, '2026-11-12 01:12:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id` bigint(20) NOT NULL,
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
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id`, `tipo`, `producto_id`, `almacen_origen_id`, `almacen_destino_id`, `ubicacion_origen_id`, `ubicacion_destino_id`, `cantidad`, `costo_unitario`, `referencia`, `motivo`, `usuario_id`, `created_at`) VALUES
(524, 'ajuste', 1, NULL, 1, NULL, 1, 22, 1.00, 'Ajuste manual', 'Cambio de stock desde el formulario (+22)', NULL, '2026-11-12 01:53:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `fecha_pedido` timestamp NULL DEFAULT current_timestamp(),
  `total` decimal(12,2) NOT NULL,
  `estado` enum('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `direccion_envio` text DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `numero_referencia` varchar(100) DEFAULT NULL,
  `tasa_dolar_usada` decimal(10,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `producto_base_id` int(11) DEFAULT NULL,
  `idestatus` int(11) NOT NULL,
  `idcategoria` int(11) DEFAULT NULL,
  `idsubcategoria` int(11) NOT NULL,
  `idmarca` int(11) NOT NULL,
  `idmodelo` int(11) NOT NULL DEFAULT 1,
  `idcolor` int(11) NOT NULL DEFAULT 1,
  `idtalla` int(11) NOT NULL DEFAULT 1,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `sku_base` varchar(64) NOT NULL,
  `codigo_barras` varchar(64) DEFAULT NULL,
  `tipo` varchar(9) DEFAULT NULL,
  `estrellas` varchar(100) NOT NULL,
  `costo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `precio` decimal(12,2) NOT NULL,
  `preciofull` decimal(12,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'UND',
  `imagen` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `producto_base_id`, `idestatus`, `idcategoria`, `idsubcategoria`, `idmarca`, `idmodelo`, `idcolor`, `idtalla`, `nombre`, `descripcion`, `sku_base`, `codigo_barras`, `tipo`, `estrellas`, `costo`, `precio`, `preciofull`, `stock`, `unidad_medida`, `imagen`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 8, 34, 1, 2, 17, 16, '111111111111111111', '2222222222222222222222', '11111', NULL, '', '', 1.00, 2.00, 3.00, 22, 'UND', 'prod_1_a5879c0d.jpg', '2026-11-12 01:52:56', '2026-11-21 01:15:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_almacen`
--

CREATE TABLE `producto_almacen` (
  `id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `almacen_id` int(11) NOT NULL,
  `sku_almacen` varchar(80) NOT NULL,
  `ubicacion_preferida_id` int(11) DEFAULT NULL,
  `stock_minimo` int(11) NOT NULL DEFAULT 0,
  `stock_maximo` int(11) DEFAULT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto_almacen`
--

INSERT INTO `producto_almacen` (`id`, `producto_id`, `almacen_id`, `sku_almacen`, `ubicacion_preferida_id`, `stock_minimo`, `stock_maximo`, `idestatus`, `created_at`, `updated_at`) VALUES
(519, 1, 1, 'ALM01-11111', 1, 0, NULL, 1, '2026-11-12 01:53:34', '2026-11-12 01:53:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subcategorias`
--

CREATE TABLE `subcategorias` (
  `id` int(11) NOT NULL,
  `idcategoria` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `subcategorias`
--

INSERT INTO `subcategorias` (`id`, `idcategoria`, `idestatus`, `nombre`) VALUES
(34, 8, 1, 'Blusas cortas'),
(36, 9, 1, 'damas damas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tallas`
--

CREATE TABLE `tallas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(20) NOT NULL,
  `tipo` enum('letra','numero','libre') NOT NULL DEFAULT 'libre',
  `orden` int(11) NOT NULL DEFAULT 0,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tallas`
--

INSERT INTO `tallas` (`id`, `nombre`, `tipo`, `orden`, `idestatus`, `created_at`) VALUES
(1, 'Sin talla', 'libre', 0, 1, '2026-10-29 22:22:07'),
(2, 'XS', 'letra', 10, 1, '2026-10-29 22:22:07'),
(3, 'S', 'letra', 20, 1, '2026-10-29 22:22:07'),
(4, 'M', 'letra', 30, 1, '2026-10-29 22:22:07'),
(5, 'L', 'letra', 40, 1, '2026-10-29 22:22:07'),
(6, 'XL', 'letra', 50, 1, '2026-10-29 22:22:07'),
(7, 'XXL', 'letra', 60, 1, '2026-10-29 22:22:07'),
(8, 'XXXL', 'letra', 70, 1, '2026-10-29 22:22:07'),
(9, '36', 'numero', 36, 1, '2026-10-29 22:22:07'),
(10, '37', 'numero', 37, 1, '2026-10-29 22:22:07'),
(11, '38', 'numero', 38, 1, '2026-10-29 22:22:07'),
(12, '39', 'numero', 39, 1, '2026-10-29 22:22:07'),
(13, '40', 'numero', 40, 1, '2026-10-29 22:22:07'),
(14, '41', 'numero', 41, 1, '2026-10-29 22:22:07'),
(15, '42', 'numero', 42, 1, '2026-10-29 22:22:07'),
(16, '43', 'numero', 43, 1, '2026-10-29 22:22:07'),
(17, '44', 'numero', 44, 1, '2026-10-29 22:22:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_ubicacion`
--

CREATE TABLE `tipos_ubicacion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_ubicacion`
--

INSERT INTO `tipos_ubicacion` (`id`, `nombre`, `idestatus`) VALUES
(1, 'General', 1),
(2, 'Zona', 1),
(3, 'Sector', 1),
(4, 'Pasillo', 1),
(5, 'Estante', 1),
(6, 'Nivel', 1),
(7, 'Posicion', 1),
(8, 'Caja', 1),
(9, 'Vitrina', 1),
(10, 'Area', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones`
--

CREATE TABLE `ubicaciones` (
  `id` int(11) NOT NULL,
  `almacen_id` int(11) NOT NULL,
  `padre_id` int(11) DEFAULT NULL,
  `idtipo_ubicacion` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `profundidad` tinyint(4) NOT NULL DEFAULT 0,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ubicaciones`
--

INSERT INTO `ubicaciones` (`id`, `almacen_id`, `padre_id`, `idtipo_ubicacion`, `codigo`, `nombre`, `ruta`, `profundidad`, `idestatus`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 1, 'GEN', 'General', 'GEN', 0, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(2, 1, NULL, 2, 'ZONA-A', 'Zona A', 'ZONA-A', 0, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(3, 1, 2, 4, 'PAS-01', 'Pasillo 1', 'ZONA-A/PAS-01', 1, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(4, 1, 3, 5, 'EST-01', 'Estante 1', 'ZONA-A/PAS-01/EST-01', 2, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(5, 1, 4, 6, 'NIV-01', 'Nivel 1', 'ZONA-A/PAS-01/EST-01/NIV-01', 3, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(6, 1, 5, 7, 'POS-01', 'Posicion 1', 'ZONA-A/PAS-01/EST-01/NIV-01/POS-01', 4, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','superadmin','operador') DEFAULT 'admin',
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `telefono`, `created_at`) VALUES
(9, 'Wilmer Vargas', 'wilmere.vargas@gmail.com', 'Kg*1902*', 'admin', NULL, '2026-10-29 01:49:50');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_stock_almacen`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_stock_almacen` (
`producto_id` int(11)
,`almacen_id` int(11)
,`almacen` varchar(100)
,`stock` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_stock_producto`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_stock_producto` (
`producto_id` int(11)
,`nombre` varchar(100)
,`sku_base` varchar(64)
,`stock_total` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_stock_ubicacion`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_stock_ubicacion` (
`producto_id` int(11)
,`ubicacion_id` int(11)
,`almacen_id` int(11)
,`ubicacion_codigo` varchar(50)
,`ruta` varchar(255)
,`cantidad` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_valor_inventario`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_valor_inventario` (
`producto_id` int(11)
,`nombre` varchar(100)
,`sku_base` varchar(64)
,`costo` decimal(12,2)
,`precio` decimal(12,2)
,`stock_total` decimal(32,0)
,`valor_costo` decimal(44,2)
,`valor_venta` decimal(44,2)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_stock_almacen`
--
DROP TABLE IF EXISTS `v_stock_almacen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_almacen`  AS SELECT `i`.`producto_id` AS `producto_id`, `u`.`almacen_id` AS `almacen_id`, `a`.`nombre` AS `almacen`, coalesce(sum(`i`.`cantidad`),0) AS `stock` FROM ((`inventario` `i` join `ubicaciones` `u` on(`u`.`id` = `i`.`ubicacion_id`)) join `almacenes` `a` on(`a`.`id` = `u`.`almacen_id`)) GROUP BY `i`.`producto_id`, `u`.`almacen_id`, `a`.`nombre` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_stock_producto`
--
DROP TABLE IF EXISTS `v_stock_producto`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_producto`  AS SELECT `p`.`id` AS `producto_id`, `p`.`nombre` AS `nombre`, `p`.`sku_base` AS `sku_base`, coalesce(sum(`i`.`cantidad`),0) AS `stock_total` FROM (`productos` `p` left join `inventario` `i` on(`i`.`producto_id` = `p`.`id`)) GROUP BY `p`.`id`, `p`.`nombre`, `p`.`sku_base` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_stock_ubicacion`
--
DROP TABLE IF EXISTS `v_stock_ubicacion`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_stock_ubicacion`  AS SELECT `i`.`producto_id` AS `producto_id`, `i`.`ubicacion_id` AS `ubicacion_id`, `u`.`almacen_id` AS `almacen_id`, `u`.`codigo` AS `ubicacion_codigo`, `u`.`ruta` AS `ruta`, `i`.`cantidad` AS `cantidad` FROM (`inventario` `i` join `ubicaciones` `u` on(`u`.`id` = `i`.`ubicacion_id`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_valor_inventario`
--
DROP TABLE IF EXISTS `v_valor_inventario`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_valor_inventario`  AS SELECT `p`.`id` AS `producto_id`, `p`.`nombre` AS `nombre`, `p`.`sku_base` AS `sku_base`, `p`.`costo` AS `costo`, `p`.`precio` AS `precio`, coalesce(sum(`i`.`cantidad`),0) AS `stock_total`, coalesce(sum(`i`.`cantidad`),0) * `p`.`costo` AS `valor_costo`, coalesce(sum(`i`.`cantidad`),0) * `p`.`precio` AS `valor_venta` FROM (`productos` `p` left join `inventario` `i` on(`i`.`producto_id` = `p`.`id`)) GROUP BY `p`.`id`, `p`.`nombre`, `p`.`sku_base`, `p`.`costo`, `p`.`precio` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `almacenes`
--
ALTER TABLE `almacenes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_almacen_codigo` (`codigo`),
  ADD KEY `idx_almacen_estatus` (`idestatus`);

--
-- Indices de la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categorias_ibfk_1` (`idestatus`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `colores`
--
ALTER TABLE `colores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_color_nombre` (`nombre`),
  ADD KEY `idx_color_estatus` (`idestatus`);

--
-- Indices de la tabla `dolar`
--
ALTER TABLE `dolar`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estatus`
--
ALTER TABLE `estatus`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_inventario_producto_ubicacion` (`producto_id`,`ubicacion_id`),
  ADD KEY `idx_inventario_ubicacion` (`ubicacion_id`);

--
-- Indices de la tabla `items_carrito`
--
ALTER TABLE `items_carrito`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_id` (`producto_id`),
  ADD KEY `items_carrito_ibfk_3` (`carrito_id`);

--
-- Indices de la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `marcas`
--
ALTER TABLE `marcas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marcas_ibfk_1` (`idestatus`);

--
-- Indices de la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_modelo_marca_nombre` (`idmarca`,`nombre`),
  ADD KEY `idx_modelo_estatus` (`idestatus`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mov_producto` (`producto_id`,`created_at`),
  ADD KEY `idx_mov_almacen_origen` (`almacen_origen_id`),
  ADD KEY `idx_mov_almacen_destino` (`almacen_destino_id`),
  ADD KEY `idx_mov_tipo` (`tipo`,`created_at`),
  ADD KEY `fk_mov_ubicacion_origen` (`ubicacion_origen_id`),
  ADD KEY `fk_mov_ubicacion_destino` (`ubicacion_destino_id`),
  ADD KEY `fk_mov_usuario` (`usuario_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_producto_sku_base` (`sku_base`),
  ADD UNIQUE KEY `uq_producto_codigo_barras` (`codigo_barras`),
  ADD KEY `productos_ibfk_1` (`idcategoria`),
  ADD KEY `productos_ibfk_2` (`idsubcategoria`),
  ADD KEY `productos_ibfk_3` (`idmarca`),
  ADD KEY `productos_ibfk_4` (`idestatus`),
  ADD KEY `idx_producto_modelo` (`idmodelo`),
  ADD KEY `idx_producto_color` (`idcolor`),
  ADD KEY `idx_producto_talla` (`idtalla`),
  ADD KEY `idx_producto_base` (`producto_base_id`);

--
-- Indices de la tabla `producto_almacen`
--
ALTER TABLE `producto_almacen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_producto_almacen` (`producto_id`,`almacen_id`),
  ADD UNIQUE KEY `uq_sku_almacen` (`sku_almacen`),
  ADD KEY `idx_pa_almacen` (`almacen_id`),
  ADD KEY `idx_pa_ubicacion` (`ubicacion_preferida_id`),
  ADD KEY `idx_pa_estatus` (`idestatus`);

--
-- Indices de la tabla `subcategorias`
--
ALTER TABLE `subcategorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subcategorias_ibfk_1` (`idcategoria`),
  ADD KEY `subcategorias_ibfk_2` (`idestatus`);

--
-- Indices de la tabla `tallas`
--
ALTER TABLE `tallas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_talla_tipo_nombre` (`tipo`,`nombre`),
  ADD KEY `idx_talla_estatus` (`idestatus`);

--
-- Indices de la tabla `tipos_ubicacion`
--
ALTER TABLE `tipos_ubicacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tipo_ubicacion_nombre` (`nombre`),
  ADD KEY `fk_tipo_ubicacion_estatus` (`idestatus`);

--
-- Indices de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ubicacion_almacen_codigo` (`almacen_id`,`codigo`),
  ADD KEY `idx_ubicacion_padre` (`padre_id`),
  ADD KEY `idx_ubicacion_tipo` (`idtipo_ubicacion`),
  ADD KEY `idx_ubicacion_estatus` (`idestatus`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `almacenes`
--
ALTER TABLE `almacenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `carritos`
--
ALTER TABLE `carritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `colores`
--
ALTER TABLE `colores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `dolar`
--
ALTER TABLE `dolar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `estatus`
--
ALTER TABLE `estatus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `items_carrito`
--
ALTER TABLE `items_carrito`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `marcas`
--
ALTER TABLE `marcas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `modelos`
--
ALTER TABLE `modelos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=417;

--
-- AUTO_INCREMENT de la tabla `producto_almacen`
--
ALTER TABLE `producto_almacen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=520;

--
-- AUTO_INCREMENT de la tabla `subcategorias`
--
ALTER TABLE `subcategorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `tallas`
--
ALTER TABLE `tallas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `tipos_ubicacion`
--
ALTER TABLE `tipos_ubicacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `almacenes`
--
ALTER TABLE `almacenes`
  ADD CONSTRAINT `fk_almacen_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `colores`
--
ALTER TABLE `colores`
  ADD CONSTRAINT `fk_color_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_inventario_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`);

--
-- Filtros para la tabla `items_carrito`
--
ALTER TABLE `items_carrito`
  ADD CONSTRAINT `items_carrito_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `items_carrito_ibfk_3` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  ADD CONSTRAINT `items_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `items_pedido_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `marcas`
--
ALTER TABLE `marcas`
  ADD CONSTRAINT `marcas_ibfk_1` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD CONSTRAINT `fk_modelo_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  ADD CONSTRAINT `fk_modelo_marca` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `fk_mov_almacen_destino` FOREIGN KEY (`almacen_destino_id`) REFERENCES `almacenes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mov_almacen_origen` FOREIGN KEY (`almacen_origen_id`) REFERENCES `almacenes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mov_ubicacion_destino` FOREIGN KEY (`ubicacion_destino_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mov_ubicacion_origen` FOREIGN KEY (`ubicacion_origen_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_producto_base` FOREIGN KEY (`producto_base_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_producto_color` FOREIGN KEY (`idcolor`) REFERENCES `colores` (`id`),
  ADD CONSTRAINT `fk_producto_modelo` FOREIGN KEY (`idmodelo`) REFERENCES `modelos` (`id`),
  ADD CONSTRAINT `fk_producto_talla` FOREIGN KEY (`idtalla`) REFERENCES `tallas` (`id`),
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`idsubcategoria`) REFERENCES `subcategorias` (`id`),
  ADD CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`idmarca`) REFERENCES `marcas` (`id`),
  ADD CONSTRAINT `productos_ibfk_4` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `producto_almacen`
--
ALTER TABLE `producto_almacen`
  ADD CONSTRAINT `fk_pa_almacen` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`id`),
  ADD CONSTRAINT `fk_pa_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  ADD CONSTRAINT `fk_pa_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pa_ubicacion` FOREIGN KEY (`ubicacion_preferida_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `subcategorias`
--
ALTER TABLE `subcategorias`
  ADD CONSTRAINT `subcategorias_ibfk_1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`id`),
  ADD CONSTRAINT `subcategorias_ibfk_2` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `tallas`
--
ALTER TABLE `tallas`
  ADD CONSTRAINT `fk_talla_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `tipos_ubicacion`
--
ALTER TABLE `tipos_ubicacion`
  ADD CONSTRAINT `fk_tipo_ubicacion_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD CONSTRAINT `fk_ubicacion_almacen` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ubicacion_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`),
  ADD CONSTRAINT `fk_ubicacion_padre` FOREIGN KEY (`padre_id`) REFERENCES `ubicaciones` (`id`),
  ADD CONSTRAINT `fk_ubicacion_tipo` FOREIGN KEY (`idtipo_ubicacion`) REFERENCES `tipos_ubicacion` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

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
