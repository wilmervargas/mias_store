-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-11-2026 a las 20:07:07
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
(1, 'ALM01', 'Almacen Principal', 'Sede principal', '', 1, '2026-10-29 22:22:09', '2026-11-12 00:01:19'),
(6, 'ALM02', 'ALMACEN ALIANZA GARDENS', 'CR. ALIANZA GARDENS, CIUDAD ALIANZA, GUACARA', '', 1, '2026-11-24 20:34:34', '2026-11-27 17:18:26'),
(7, 'ALM03', 'ALMACEN SAMAN', 'URB APAMATES, GUACARA', '', 1, '2026-11-27 17:17:57', '2026-11-27 17:18:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `backup_items_carrito_v1`
--

CREATE TABLE `backup_items_carrito_v1` (
  `id` int(11) NOT NULL DEFAULT 0,
  `carrito_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `variante_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `idestatus`, `nombre`, `descripcion`) VALUES
(8, 1, 'Blusas Damas', 'Blusas con mucho estilo para Damas'),
(9, 1, 'Ropa para Damas', 'Ropa para Damas'),
(10, 1, 'Cal-Cab', 'Calzado Caballeros');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` mediumtext DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Estructura de tabla para la tabla `combos`
--

CREATE TABLE `combos` (
  `id` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `sku` varchar(64) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `imagen` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `combos`
--

INSERT INTO `combos` (`id`, `idestatus`, `sku`, `nombre`, `precio`, `imagen`, `created_at`, `updated_at`) VALUES
(10, 1, 'COMBO-01', 'COMBO  ESPECIAL MIA\'S STORE', 30.00, 'combo_10_2fe2bdbd.jpg', '2026-11-27 17:49:15', '2026-11-27 17:49:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `combo_detalle`
--

CREATE TABLE `combo_detalle` (
  `id` int(11) NOT NULL,
  `combo_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `combo_detalle`
--

INSERT INTO `combo_detalle` (`id`, `combo_id`, `producto_id`, `cantidad`, `created_at`, `updated_at`) VALUES
(19, 10, 453, 1.000, '2026-11-27 17:54:43', '2026-11-27 17:54:43'),
(20, 10, 458, 1.000, '2026-11-27 17:54:43', '2026-11-27 17:54:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dolar`
--

CREATE TABLE `dolar` (
  `id` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `dolar`
--

INSERT INTO `dolar` (`id`, `fecha`, `monto`) VALUES
(1, '2025-11-26', 243.57),
(2, '2023-03-19', 607.39),
(3, '2026-07-02', 639.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`id`, `razon_social`, `nombre_comercial`, `rif`, `representante`, `direccion`, `telefono`, `telefonos`, `email`, `eslogan`, `logo`, `moneda_base`, `iva_rate`, `igtf_rate`, `created_at`, `updated_at`) VALUES
(1, 'Mia\'s Store', 'Mia\'s Store', 'V-07144090-3', 'MICHELLE VARGAS', 'CR ALIANZA GARDENS', '584144979139', '[\"584144979139\",\"584244032682\"]', 'wilmere.vargas@gmail.com', 'TU TIENDA', 'empresa_logo_dcd475aafff5.jpg', 'USD', 16.00, 0.00, '2026-11-27 12:45:19', '2026-11-27 14:45:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estatus`
--

CREATE TABLE `estatus` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id`, `producto_id`, `ubicacion_id`, `cantidad`, `lote`, `fecha_vencimiento`, `updated_at`) VALUES
(546, 453, 3, 0, NULL, NULL, '2026-11-26 17:58:38'),
(547, 453, 13, 0, NULL, NULL, '2026-11-26 18:55:51'),
(548, 453, 2, 0, NULL, NULL, '2026-11-26 18:07:00'),
(549, 453, 4, 0, NULL, NULL, '2026-11-26 18:07:12'),
(550, 453, 6, 0, NULL, NULL, '2026-11-26 18:07:42'),
(551, 453, 1, 0, NULL, NULL, '2026-11-26 18:08:08'),
(552, 453, 5, 599, NULL, NULL, '2026-11-27 18:34:24'),
(553, 454, 5, 0, NULL, NULL, '2026-11-26 18:23:43'),
(555, 456, 2, 0, NULL, NULL, '2026-11-27 18:23:53'),
(556, 456, 13, 0, NULL, NULL, '2026-11-26 18:23:56'),
(557, 454, 2, 0, NULL, NULL, '2026-11-26 19:14:12'),
(558, 454, 13, 0, NULL, NULL, '2026-11-27 18:23:37'),
(559, 454, 1, 0, NULL, NULL, '2026-11-26 19:19:05'),
(560, 458, 13, 0, NULL, NULL, '2026-11-27 18:14:21'),
(561, 458, 1, 0, NULL, NULL, '2026-11-27 18:09:42'),
(562, 458, 14, 1, NULL, NULL, '2026-11-27 18:45:24'),
(563, 458, 15, 0, NULL, NULL, '2026-11-27 18:14:21'),
(564, 454, 14, 1001, NULL, NULL, '2026-11-27 18:35:39'),
(565, 456, 3, 0, NULL, NULL, '2026-11-27 18:34:54'),
(566, 460, 6, 0, NULL, NULL, '2026-11-27 18:24:54'),
(567, 460, 2, 11, NULL, NULL, '2026-11-27 18:49:20'),
(568, 458, 2, 0, NULL, NULL, '2026-11-27 18:45:24');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcas`
--

CREATE TABLE `marcas` (
  `id` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `marcas`
--

INSERT INTO `marcas` (`id`, `idestatus`, `nombre`) VALUES
(1, 1, 'Variadas Mia\'s Store'),
(66, 1, 'Nike'),
(67, 1, 'Adidas'),
(68, 1, 'Coach'),
(69, 1, 'Lacoste');

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
(2, 69, 'Blusas con Mangas', 1, '2026-11-12 01:12:01');

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
  `concepto` varchar(50) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id`, `tipo`, `producto_id`, `almacen_origen_id`, `almacen_destino_id`, `ubicacion_origen_id`, `ubicacion_destino_id`, `cantidad`, `costo_unitario`, `referencia`, `motivo`, `concepto`, `usuario_id`, `created_at`) VALUES
(569, 'entrada', 453, NULL, 1, NULL, 3, 10, 10.00, 'Stock inicial', 'Registro de producto', NULL, NULL, '2026-11-26 17:57:19'),
(570, 'entrada', 454, NULL, 1, NULL, 5, 10, 10.00, 'Stock inicial', 'Registro de producto', NULL, NULL, '2026-11-26 18:08:39'),
(572, 'entrada', 456, NULL, 1, NULL, 2, 11, 10.00, 'Stock inicial', 'Registro de producto', NULL, NULL, '2026-11-26 18:09:55'),
(573, 'entrada', 453, NULL, 1, NULL, 5, 99, 10.00, 'Ajuste manual', 'Se gartega proque me da la gana', 'compra', NULL, '2026-11-26 18:50:02'),
(575, 'entrada', 453, NULL, 6, NULL, 13, 500, NULL, 'Ajuste manual', 'aumente 6500 y lo cambie de almacen', 'compra', NULL, '2026-11-26 18:55:40'),
(577, 'entrada', 453, NULL, 1, NULL, 5, 1, NULL, 'Ajuste manual', 'uno', 'compra', NULL, '2026-11-26 19:09:03'),
(578, 'entrada', 454, NULL, 6, NULL, 13, 1111, NULL, 'Ajuste manual', 'GANITAS', 'compra', NULL, '2026-11-26 19:12:37'),
(579, 'entrada', 454, NULL, 6, NULL, 13, 1, NULL, 'Ajuste manual', 'compra', 'compra', NULL, '2026-11-26 19:13:18'),
(580, 'entrada', 454, NULL, 6, NULL, 13, 1, NULL, 'Ajuste manual', 'compra', 'compra', NULL, '2026-11-26 19:14:08'),
(581, 'entrada', 454, NULL, 1, NULL, 1, 1, NULL, 'Ajuste manual', 'compra', 'compra', NULL, '2026-11-26 19:14:25'),
(582, 'entrada', 454, NULL, 1, NULL, 1, 100, NULL, 'Ajuste manual', 'compra', 'compra', NULL, '2026-11-26 19:17:13'),
(583, 'entrada', 458, NULL, 6, NULL, 13, 20, 10.00, 'Stock inicial', 'Registro de producto', NULL, NULL, '2026-11-27 17:21:35'),
(584, 'entrada', 458, NULL, 6, NULL, 13, 1, NULL, 'Ajuste manual', 'Ajuste por error en stock inicial', 'compra', NULL, '2026-11-27 17:58:48'),
(585, 'devolucion', 458, NULL, 6, NULL, 13, 5, NULL, 'Ajuste manual', 'devolvieron 5 y estaban sin pedidos', 'devolucion', NULL, '2026-11-27 17:59:46'),
(586, 'entrada', 458, NULL, 6, NULL, 13, 11, NULL, 'Ajuste manual', 'LOCO', 'otro', NULL, '2026-11-27 18:00:28'),
(587, 'salida', 458, 6, NULL, 13, NULL, 17, NULL, 'Ajuste manual', 'VENTA SIN PEDIDO RESTA 17 DE INVENATRIO', 'venta', NULL, '2026-11-27 18:03:28'),
(588, 'transferencia', 458, 6, 1, 13, 1, 3, NULL, 'Ajuste manual', 'TRANSFERENCIA 3 AL ALMACEN PRINCIPAL', 'transferencia', NULL, '2026-11-27 18:05:31'),
(589, 'transferencia', 458, 6, 1, 13, 1, 1, NULL, 'Ajuste manual', 'OTRA TRTAMNSFERNCVIA DE 1', 'transferencia', NULL, '2026-11-27 18:07:18'),
(590, 'transferencia', 458, 6, 1, 13, 1, 5, NULL, 'Ajuste manual', 'AJUSTE DE 5 PARA ALMACEN PPAL TRANSFERENCIA', 'transferencia', NULL, '2026-11-27 18:09:12'),
(591, 'transferencia', 458, 6, 7, 13, 15, 1, NULL, 'Ajuste manual', 'transferencia', 'transferencia', NULL, '2026-11-27 18:12:42'),
(592, 'entrada', 460, NULL, 1, NULL, 6, 11, 10.00, 'Stock inicial', 'Registro de producto', NULL, NULL, '2026-11-27 18:24:39'),
(593, '', 458, 6, NULL, 14, NULL, 5, NULL, 'Ajuste manual', 'mermas', 'merma', NULL, '2026-11-27 18:32:16'),
(594, '', 460, 1, NULL, 2, NULL, 1, NULL, 'Ajuste manual', 'merma', 'merma', NULL, '2026-11-27 18:33:10'),
(595, 'salida', 458, 6, NULL, 14, NULL, 3, NULL, 'Ajuste manual', 'dañados 3', 'danado', NULL, '2026-11-27 18:33:39'),
(596, 'salida', 453, 1, NULL, 5, NULL, 11, NULL, 'Ajuste manual', 'extravio', 'extravio', NULL, '2026-11-27 18:34:24'),
(597, 'salida', 456, 1, NULL, 3, NULL, 11, NULL, 'Ajuste manual', 'robos', 'robo', NULL, '2026-11-27 18:34:54'),
(598, 'salida', 454, 6, NULL, 14, NULL, 223, NULL, 'Ajuste manual', 'otro motivos', 'otro', NULL, '2026-11-27 18:35:39'),
(599, 'transferencia', 458, 6, 1, 14, 2, 3, NULL, 'Ajuste manual', 'tres a almacen 1', 'transferencia', NULL, '2026-11-27 18:37:08'),
(601, 'transferencia', 458, 6, 1, 14, 2, 2, NULL, 'Ajuste manual', 'fsdfsdfsd', 'transferencia', NULL, '2026-11-27 18:43:24'),
(602, 'ajuste', 458, NULL, 6, NULL, 14, 2, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (-2)', NULL, NULL, '2026-11-27 18:43:38'),
(603, 'ajuste', 460, NULL, 1, NULL, 2, 2, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (+2)', NULL, NULL, '2026-11-27 18:43:38'),
(604, 'transferencia', 458, 6, 1, 14, 2, 5, NULL, 'Ajuste manual', 'paso 5', 'transferencia', NULL, '2026-11-27 18:44:22'),
(605, 'ajuste', 458, NULL, 6, NULL, 14, 5, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (-5)', NULL, NULL, '2026-11-27 18:44:25'),
(606, 'ajuste', 460, NULL, 1, NULL, 2, 5, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (+5)', NULL, NULL, '2026-11-27 18:44:25'),
(607, 'migracion', 458, 6, 1, 14, 2, 4, NULL, 'Ajuste manual', 'migracion', 'migracion', NULL, '2026-11-27 18:45:22'),
(608, 'ajuste', 458, NULL, 6, NULL, 14, 4, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (-4)', NULL, NULL, '2026-11-27 18:45:24'),
(609, 'ajuste', 460, NULL, 1, NULL, 2, 4, 10.00, 'Ajuste manual', 'Cambio de stock desde el formulario (+4)', NULL, NULL, '2026-11-27 18:45:24'),
(610, 'ajuste', 460, NULL, 1, NULL, 2, 4, NULL, 'Ajuste manual', 'ajuste a 25', 'ajuste', NULL, '2026-11-27 18:46:21'),
(611, 'ajuste', 460, NULL, 1, NULL, 2, 15, NULL, 'Ajuste manual', 'conteo fisico', 'conteo', NULL, '2026-11-27 18:47:04'),
(612, 'ajuste', 460, NULL, 1, NULL, 2, 20, NULL, 'Ajuste manual', 'ajuste', 'ajuste', NULL, '2026-11-27 18:48:37'),
(613, 'ajuste', 460, NULL, 1, NULL, 2, 19, NULL, 'Ajuste manual', 'otro po rajuste', 'otro', NULL, '2026-11-27 18:49:20');

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
  `direccion_envio` mediumtext DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `numero_referencia` varchar(100) DEFAULT NULL,
  `tasa_dolar_usada` decimal(10,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(80) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `module`, `description`) VALUES
(1, 'productos.ver', 'productos', 'Ver el catalogo de productos y variantes'),
(2, 'productos.crear', 'productos', 'Crear productos y variantes'),
(3, 'productos.editar', 'productos', 'Editar productos, precios y estado'),
(4, 'productos.eliminar', 'productos', 'Eliminar o desactivar productos'),
(5, 'inventario.ver', 'inventario', 'Ver existencias por almacen y ubicacion'),
(6, 'inventario.editar', 'inventario', 'Ajustar existencias de inventario'),
(7, 'movimientos.ver', 'movimientos', 'Ver el historial de movimientos'),
(8, 'movimientos.crear', 'movimientos', 'Registrar entradas, salidas, traslados y ajustes'),
(9, 'almacenes.ver', 'almacenes', 'Ver almacenes'),
(10, 'almacenes.crear', 'almacenes', 'Crear almacenes'),
(11, 'almacenes.editar', 'almacenes', 'Editar almacenes'),
(12, 'almacenes.eliminar', 'almacenes', 'Eliminar o desactivar almacenes'),
(13, 'ubicaciones.ver', 'ubicaciones', 'Ver ubicaciones fisicas'),
(14, 'ubicaciones.crear', 'ubicaciones', 'Crear ubicaciones'),
(15, 'ubicaciones.editar', 'ubicaciones', 'Editar ubicaciones'),
(16, 'ubicaciones.eliminar', 'ubicaciones', 'Eliminar o desactivar ubicaciones'),
(17, 'categorias.ver', 'categorias', 'Ver categorias'),
(18, 'categorias.crear', 'categorias', 'Crear categorias'),
(19, 'categorias.editar', 'categorias', 'Editar categorias'),
(20, 'categorias.eliminar', 'categorias', 'Eliminar o desactivar categorias'),
(21, 'marcas.ver', 'marcas', 'Ver marcas'),
(22, 'marcas.crear', 'marcas', 'Crear marcas'),
(23, 'marcas.editar', 'marcas', 'Editar marcas'),
(24, 'marcas.eliminar', 'marcas', 'Eliminar o desactivar marcas'),
(25, 'catalogos.ver', 'catalogos', 'Ver modelos, colores y tallas'),
(26, 'catalogos.crear', 'catalogos', 'Crear modelos, colores y tallas'),
(27, 'catalogos.editar', 'catalogos', 'Editar modelos, colores y tallas'),
(28, 'catalogos.eliminar', 'catalogos', 'Eliminar modelos, colores y tallas'),
(29, 'reportes.ver', 'reportes', 'Ver reportes e indicadores'),
(30, 'whatsapp.ver', 'whatsapp', 'Ver el estado de la conexion de WhatsApp'),
(31, 'whatsapp.crear', 'whatsapp', 'Enviar mensajes por WhatsApp'),
(32, 'whatsapp.editar', 'whatsapp', 'Conectar, reiniciar o cerrar sesion de WhatsApp'),
(33, 'usuarios.ver', 'usuarios', 'Ver usuarios y cuentas'),
(34, 'usuarios.crear', 'usuarios', 'Crear usuarios'),
(35, 'usuarios.editar', 'usuarios', 'Editar usuarios y asignar roles'),
(36, 'usuarios.eliminar', 'usuarios', 'Eliminar usuarios'),
(37, 'roles.ver', 'roles', 'Ver roles y sus permisos'),
(38, 'roles.crear', 'roles', 'Crear roles'),
(39, 'roles.editar', 'roles', 'Editar nombre y descripcion de roles'),
(40, 'roles.eliminar', 'roles', 'Eliminar roles sin usuarios asignados'),
(41, 'roles.gestionar', 'roles', 'Gestionar la matriz de permisos de los roles'),
(42, 'seguridad.ver', 'seguridad', 'Ver el centro de claves y seguridad'),
(43, 'seguridad.claves', 'seguridad', 'Restablecer claves de otros usuarios'),
(44, 'unidades.ver', 'unidades', 'Ver unidades de medida'),
(45, 'unidades.crear', 'unidades', 'Crear unidades de medida'),
(46, 'unidades.editar', 'unidades', 'Editar unidades de medida'),
(47, 'unidades.eliminar', 'unidades', 'Eliminar o desactivar unidades de medida'),
(48, 'combos.ver', 'combos', 'Ver combos y su disponibilidad'),
(49, 'combos.crear', 'combos', 'Crear combos'),
(50, 'combos.editar', 'combos', 'Editar combos y sus componentes'),
(51, 'combos.eliminar', 'combos', 'Eliminar o desactivar combos'),
(52, 'empresa.ver', 'empresa', 'Ver la configuracion de la empresa'),
(53, 'empresa.editar', 'empresa', 'Editar la configuracion de la empresa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
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
  `descripcion` mediumtext DEFAULT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `producto_base_id`, `es_base`, `idestatus`, `idcategoria`, `idsubcategoria`, `idmarca`, `idmodelo`, `idcolor`, `idtalla`, `idunidad`, `nombre`, `descripcion`, `sku_base`, `codigo_producto`, `codigo_detalle`, `codigo_barras`, `tipo`, `estrellas`, `costo`, `precio`, `preciofull`, `stock`, `stock_inicial`, `stock_minimo`, `stock_maximo`, `unidad_medida`, `imagen`, `created_at`, `updated_at`) VALUES
(447, NULL, 1, 1, 9, 36, 1, 2, 1, 1, 1, 'BODY', 'BODY MODELO 1', 'P-00447XX', 'P-00447XX', NULL, NULL, NULL, '5', 0.00, 0.00, 0.00, 0, 0, 10, 100, 'UND', 'prod_447_9b37ab7e.jpg', '2026-11-26 14:59:10', '2026-11-27 13:41:03'),
(453, 447, 0, 1, 9, 36, 1, 2, 10, 3, 1, 'BODY', 'BODY MODELO 1', 'P-00453', 'P-00447XX', 'P-00447XX-D453', NULL, NULL, '5', 10.00, 20.00, 15.00, 599, 0, 10, 100, 'UND', 'prod_447_c3aff051.jpg', '2026-11-26 17:57:19', '2026-11-27 18:34:24'),
(454, 447, 0, 1, 9, 36, 1, 2, 13, 3, 1, 'BODY', 'BODY MODELO 1', 'P-00454', 'P-00447XX', 'P-00447XX-D454', NULL, NULL, '5', 10.00, 20.00, 15.00, 1001, 10, 10, 100, 'UND', 'prod_447_c3aff051.jpg', '2026-11-26 18:08:39', '2026-11-27 18:35:39'),
(456, 447, 0, 1, 9, 36, 1, 2, 10, 5, 1, 'BODY', 'BODY MODELO 1', 'P-00456', 'P-00447XX', 'P-00447XX-D456', NULL, NULL, '5', 10.00, 20.00, 15.00, 0, 11, 10, 100, 'UND', 'prod_447_c3aff051.jpg', '2026-11-26 18:09:55', '2026-11-27 18:34:54'),
(457, NULL, 1, 1, 10, 37, 69, 2, 1, 1, 1, 'WILMER', 'WILMER VARGAS ORTEGA', 'P-00457', 'P-00457', NULL, NULL, NULL, '5', 0.00, 0.00, 0.00, 0, 0, 10, 200, 'UND', 'prod_457_b2ba4b84.jpg', '2026-11-27 17:21:35', '2026-11-27 17:25:14'),
(458, 457, 0, 1, 10, 37, 69, 2, 16, 5, 1, 'WILMER', 'WILMER VARGAS ORTEGA', 'P-00458', 'P-00457', 'P-00457-D458', NULL, NULL, '5', 10.00, 20.00, 15.00, 1, 19, 10, 200, 'UND', 'sin-foto.png', '2026-11-27 17:21:35', '2026-11-27 18:45:24'),
(460, 457, 0, 1, 10, 37, 69, 2, 16, 5, 1, 'WILMER', 'WILMER VARGAS ORTEGA', 'P-00460', 'P-00457', 'P-00457-D460', NULL, NULL, '5', 10.00, 20.00, 15.00, 11, 11, 10, 200, 'UND', 'prod_457_b2ba4b84.jpg', '2026-11-27 18:24:39', '2026-11-27 18:49:20');

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
(549, 453, 1, 'ALM01-P-00453', 1, 0, NULL, 1, '2026-11-26 18:07:59', '2026-11-26 18:07:59'),
(554, 456, 1, 'ALM01-P-00456', 1, 0, NULL, 1, '2026-11-26 18:23:56', '2026-11-26 18:23:56'),
(559, 454, 6, 'ALM02-P-00454', 13, 0, NULL, 1, '2026-11-26 19:19:05', '2026-11-26 19:19:05'),
(560, 458, 6, 'ALM02-P-00458', 13, 0, NULL, 1, '2026-11-27 17:21:35', '2026-11-27 17:21:35'),
(569, 460, 1, 'ALM01-P-00460', 1, 0, NULL, 1, '2026-11-27 18:24:39', '2026-11-27 18:24:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_imagenes`
--

CREATE TABLE `producto_imagenes` (
  `id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `imagen` varchar(150) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto_imagenes`
--

INSERT INTO `producto_imagenes` (`id`, `producto_id`, `imagen`, `orden`, `created_at`) VALUES
(10, 447, 'prod_447_9b37ab7e.jpg', 0, '2026-11-26 19:10:07'),
(11, 447, 'prod_447_86783c87.jpg', 1, '2026-11-26 19:10:07'),
(12, 457, 'prod_457_b2ba4b84.jpg', 0, '2026-11-27 17:21:35'),
(13, 457, 'prod_457_833ba986.jpg', 1, '2026-11-27 17:21:35'),
(14, 457, 'prod_457_bf93ee36.jpg', 2, '2026-11-27 17:21:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(60) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'ADMIN', 'Acceso total al panel administrativo, usuarios y seguridad.', '2026-11-23 10:42:59'),
(2, 'OPERADOR', 'Gestion operativa completa: catalogo, almacenes, inventario y movimientos.', '2026-11-23 10:42:59'),
(3, 'VENTAS', 'Lectura operativa para consulta de catalogo, inventario y reportes.', '2026-11-23 10:42:59'),
(4, 'LECTOR', 'Consulta general del sistema sin acceso al centro de claves.', '2026-11-23 10:42:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(1, 41),
(1, 42),
(1, 43),
(1, 44),
(1, 45),
(1, 46),
(1, 47),
(1, 48),
(1, 49),
(1, 50),
(1, 51),
(1, 52),
(1, 53),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13),
(2, 14),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(2, 20),
(2, 21),
(2, 22),
(2, 23),
(2, 24),
(2, 25),
(2, 26),
(2, 27),
(2, 28),
(2, 29),
(2, 30),
(2, 31),
(2, 32),
(2, 44),
(2, 45),
(2, 46),
(2, 47),
(3, 1),
(3, 5),
(3, 7),
(3, 9),
(3, 13),
(3, 17),
(3, 21),
(3, 25),
(3, 29),
(3, 30),
(3, 44),
(4, 1),
(4, 5),
(4, 7),
(4, 9),
(4, 13),
(4, 17),
(4, 21),
(4, 25),
(4, 29),
(4, 30),
(4, 33),
(4, 37),
(4, 44);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subcategorias`
--

CREATE TABLE `subcategorias` (
  `id` int(11) NOT NULL,
  `idcategoria` int(11) NOT NULL,
  `idestatus` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `subcategorias`
--

INSERT INTO `subcategorias` (`id`, `idcategoria`, `idestatus`, `nombre`) VALUES
(34, 8, 1, 'Blusas cortas'),
(36, 9, 1, 'damas damas'),
(37, 10, 1, 'Mocacin'),
(38, 10, 1, 'Deportivo');

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
-- Estructura de tabla para la tabla `tasas_cambio`
--

CREATE TABLE `tasas_cambio` (
  `id` int(11) NOT NULL,
  `moneda` varchar(4) NOT NULL DEFAULT 'VES',
  `moneda_base` varchar(4) NOT NULL,
  `tasa` decimal(18,2) NOT NULL,
  `fuente` enum('bcv','usdt','manual','ajustada') NOT NULL DEFAULT 'manual',
  `vigente_desde` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tasas_cambio`
--

INSERT INTO `tasas_cambio` (`id`, `moneda`, `moneda_base`, `tasa`, `fuente`, `vigente_desde`, `created_at`, `updated_at`) VALUES
(30, 'VES', 'USD', 924.35, 'bcv', '2026-11-26 00:00:00', '2026-11-26 16:18:55', '2026-11-26 16:18:55'),
(31, 'VES', 'EUR', 1011.73, 'bcv', '2026-11-26 00:00:00', '2026-11-26 16:18:55', '2026-11-26 16:18:55'),
(32, 'VES', 'USDT', 1093.98, 'usdt', '2026-11-26 00:00:00', '2026-11-26 16:18:55', '2026-11-26 16:18:55'),
(36, 'VES', 'USD', 926.36, 'bcv', '2026-11-27 00:00:00', '2026-11-27 12:15:43', '2026-11-27 12:15:43'),
(37, 'VES', 'EUR', 1016.86, 'bcv', '2026-11-27 00:00:00', '2026-11-27 12:15:43', '2026-11-27 12:15:43'),
(41, 'VES', 'AJU', 1020.00, 'ajustada', '2026-11-26 13:40:00', '2026-11-27 13:40:42', '2026-11-27 13:40:42'),
(42, 'VES', 'AJU', 1020.00, 'ajustada', '2026-11-27 00:00:00', '2026-11-27 13:40:50', '2026-11-27 13:40:50'),
(43, 'VES', 'AJU', 1025.00, 'ajustada', '2026-11-27 14:10:00', '2026-11-27 14:10:44', '2026-11-27 14:10:44'),
(44, 'VES', 'USDT', 1084.57, 'usdt', '2026-11-27 00:00:00', '2026-11-27 14:10:50', '2026-11-27 14:10:50');

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
(6, 1, 5, 7, 'POS-01', 'Posicion 1', 'ZONA-A/PAS-01/EST-01/NIV-01/POS-01', 4, 1, '2026-10-29 22:22:09', '2026-10-29 22:22:09'),
(13, 6, NULL, 1, 'GEN', 'General', 'GEN', 0, 1, '2026-11-24 20:34:34', '2026-11-24 20:34:34'),
(14, 6, 13, 6, 'NIV 02', 'Nivel 02', 'GEN/NIV 02', 1, 1, '2026-11-27 17:16:36', '2026-11-27 17:17:12'),
(15, 7, NULL, 1, 'GEN', 'General', 'GEN', 0, 1, '2026-11-27 17:17:57', '2026-11-27 17:17:57'),
(16, 7, 15, 1, 'PAS02', 'pasillo 02', 'GEN/PAS02', 1, 1, '2026-11-27 18:15:43', '2026-11-27 18:15:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades`
--

CREATE TABLE `unidades` (
  `id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `abreviatura` varchar(20) NOT NULL,
  `idestatus` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `unidades`
--

INSERT INTO `unidades` (`id`, `nombre`, `abreviatura`, `idestatus`, `created_at`, `updated_at`) VALUES
(1, 'Unidad', 'UND', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(2, 'Pieza', 'PZA', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(3, 'Docena', 'DOC', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(4, 'Paquete', 'PAQ', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(5, 'Caja', 'CAJ', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(6, 'Kilogramo', 'KG', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(7, 'Gramo', 'G', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(8, 'Litro', 'L', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(9, 'Mililitro', 'ML', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59'),
(10, 'Metro', 'M', 1, '2026-11-24 18:44:59', '2026-11-24 18:44:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_staff` tinyint(1) NOT NULL DEFAULT 0,
  `is_superuser` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `is_active`, `is_staff`, `is_superuser`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'Wilmer Vargas', 'wilmere.vargas@gmail.com', '$argon2id$v=19$m=65536,t=4,p=1$WlNoV3kyUGVqZUJJUklCVg$3YBsArJK1BF3jprph0L2qcXEBy5FHFhmjyOr8pDDlAM', 1, 1, 1, '2026-11-27 10:44:58', '2026-11-23 10:42:59', '2026-11-27 10:44:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_permissions`
--

CREATE TABLE `user_permissions` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indices de la tabla `combos`
--
ALTER TABLE `combos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_combo_sku` (`sku`),
  ADD KEY `idx_combo_estatus` (`idestatus`),
  ADD KEY `idx_combo_nombre` (`nombre`);

--
-- Indices de la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_combo_producto` (`combo_id`,`producto_id`),
  ADD KEY `idx_combo_detalle_combo` (`combo_id`),
  ADD KEY `idx_combo_detalle_producto` (`producto_id`);

--
-- Indices de la tabla `dolar`
--
ALTER TABLE `dolar`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
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
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissions_code` (`code`),
  ADD KEY `idx_permissions_module` (`module`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_producto_sku_base` (`sku_base`),
  ADD UNIQUE KEY `uq_producto_codigo_barras` (`codigo_barras`),
  ADD UNIQUE KEY `uq_producto_codigo_detalle` (`codigo_detalle`),
  ADD KEY `productos_ibfk_1` (`idcategoria`),
  ADD KEY `productos_ibfk_2` (`idsubcategoria`),
  ADD KEY `productos_ibfk_3` (`idmarca`),
  ADD KEY `productos_ibfk_4` (`idestatus`),
  ADD KEY `idx_producto_modelo` (`idmodelo`),
  ADD KEY `idx_producto_color` (`idcolor`),
  ADD KEY `idx_producto_talla` (`idtalla`),
  ADD KEY `idx_producto_base` (`producto_base_id`),
  ADD KEY `idx_productos_idunidad` (`idunidad`),
  ADD KEY `idx_producto_es_base` (`es_base`),
  ADD KEY `idx_producto_codigo_producto` (`codigo_producto`);

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
-- Indices de la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pi_producto` (`producto_id`,`orden`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roles_name` (`name`);

--
-- Indices de la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `idx_role_permissions_permission` (`permission_id`);

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
-- Indices de la tabla `tasas_cambio`
--
ALTER TABLE `tasas_cambio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tasa_moneda_base` (`moneda_base`),
  ADD KEY `idx_tasa_vigente` (`vigente_desde`),
  ADD KEY `idx_tasa_par_fecha` (`moneda`,`moneda_base`,`vigente_desde`);

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
-- Indices de la tabla `unidades`
--
ALTER TABLE `unidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_unidades_nombre` (`nombre`),
  ADD UNIQUE KEY `uq_unidades_abreviatura` (`abreviatura`),
  ADD KEY `idx_unidades_estatus` (`idestatus`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `idx_users_active` (`is_active`),
  ADD KEY `idx_users_superuser` (`is_superuser`);

--
-- Indices de la tabla `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`user_id`,`permission_id`),
  ADD KEY `idx_user_permissions_permission` (`permission_id`);

--
-- Indices de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `idx_user_roles_role` (`role_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `carritos`
--
ALTER TABLE `carritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `colores`
--
ALTER TABLE `colores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `combos`
--
ALTER TABLE `combos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=569;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de la tabla `modelos`
--
ALTER TABLE `modelos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=614;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- AUTO_INCREMENT de la tabla `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `producto_almacen`
--
ALTER TABLE `producto_almacen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=573;

--
-- AUTO_INCREMENT de la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `subcategorias`
--
ALTER TABLE `subcategorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `tallas`
--
ALTER TABLE `tallas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `tasas_cambio`
--
ALTER TABLE `tasas_cambio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de la tabla `tipos_ubicacion`
--
ALTER TABLE `tipos_ubicacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `unidades`
--
ALTER TABLE `unidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- Filtros para la tabla `combos`
--
ALTER TABLE `combos`
  ADD CONSTRAINT `fk_combo_estatus` FOREIGN KEY (`idestatus`) REFERENCES `estatus` (`id`);

--
-- Filtros para la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  ADD CONSTRAINT `fk_combo_detalle_combo` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_combo_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

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
  ADD CONSTRAINT `fk_productos_unidad` FOREIGN KEY (`idunidad`) REFERENCES `unidades` (`id`) ON UPDATE CASCADE,
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
-- Filtros para la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  ADD CONSTRAINT `fk_pi_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

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

--
-- Filtros para la tabla `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
