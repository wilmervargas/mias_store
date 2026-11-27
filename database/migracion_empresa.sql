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

