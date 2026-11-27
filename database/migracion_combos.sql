-- ============================================================
-- Migración: Módulo de Combos
-- ============================================================

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

-- Permisos combos (idempotente)
INSERT IGNORE INTO permissions (code, module, description) VALUES
('combos.ver', 'combos', 'Ver combos y su disponibilidad'),
('combos.crear', 'combos', 'Crear combos'),
('combos.editar', 'combos', 'Editar combos y sus componentes'),
('combos.eliminar', 'combos', 'Eliminar o desactivar combos');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('combos.ver', 'combos.crear', 'combos.editar', 'combos.eliminar')
WHERE r.name = 'ADMIN';
