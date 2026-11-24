-- ============================================================
-- Migracion: Tabla de unidades de medida
-- Base de datos: mias_store
-- Idempotente: puede ejecutarse varias veces sin romper datos.
-- ============================================================

SET NAMES utf8mb4;
USE mias_store;

START TRANSACTION;

-- 1. Tabla de unidades
CREATE TABLE IF NOT EXISTS unidades (
  id          INT          NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(60)  NOT NULL,
  abreviatura VARCHAR(20)  NOT NULL,
  idestatus   INT          NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_unidades_nombre (nombre),
  UNIQUE KEY uq_unidades_abreviatura (abreviatura),
  KEY idx_unidades_estatus (idestatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Semilla de unidades base
INSERT IGNORE INTO unidades (id, nombre, abreviatura, idestatus) VALUES
  (1, 'Unidad',     'UND', 1),
  (2, 'Pieza',      'PZA', 1),
  (3, 'Docena',     'DOC', 1),
  (4, 'Paquete',    'PAQ', 1),
  (5, 'Caja',       'CAJ', 1),
  (6, 'Kilogramo',  'KG',  1),
  (7, 'Gramo',      'G',   1),
  (8, 'Litro',      'L',   1),
  (9, 'Mililitro',  'ML',  1),
  (10,'Metro',      'M',   1);

-- 3. Columna idunidad en productos (vinculacion a tabla unidades)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'idunidad'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE productos ADD COLUMN idunidad INT NOT NULL DEFAULT 1 AFTER idtalla',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Normalizar datos existentes: mapear unidad_medida -> idunidad
-- Si la abreviatura coincide, usa esa unidad; si no, crea una unidad ad-hoc.
INSERT INTO unidades (nombre, abreviatura, idestatus)
SELECT DISTINCT TRIM(p.unidad_medida), UPPER(TRIM(p.unidad_medida)), 1
FROM productos p
LEFT JOIN unidades u ON UPPER(u.abreviatura) = UPPER(TRIM(p.unidad_medida))
WHERE p.unidad_medida IS NOT NULL AND TRIM(p.unidad_medida) <> '' AND u.id IS NULL;

UPDATE productos p
JOIN unidades u ON UPPER(u.abreviatura) = UPPER(TRIM(p.unidad_medida))
SET p.idunidad = u.id
WHERE p.unidad_medida IS NOT NULL AND TRIM(p.unidad_medida) <> '';

UPDATE productos SET idunidad = 1 WHERE idunidad IS NULL OR idunidad = 0;

-- 5. Indice y FK (solo si no existe)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND INDEX_NAME = 'idx_productos_idunidad'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE productos ADD KEY idx_productos_idunidad (idunidad)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'
    AND CONSTRAINT_NAME = 'fk_productos_unidad' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE productos ADD CONSTRAINT fk_productos_unidad FOREIGN KEY (idunidad) REFERENCES unidades(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Permisos para modulo unidades (si se maneja como modulo propio)
-- Se agregan tambien bajo catalogos ya existente; estos son opcionales.
INSERT IGNORE INTO permissions (code, module, description) VALUES
  ('unidades.ver',      'unidades', 'Ver unidades de medida'),
  ('unidades.crear',    'unidades', 'Crear unidades de medida'),
  ('unidades.editar',   'unidades', 'Editar unidades de medida'),
  ('unidades.eliminar', 'unidades', 'Eliminar o desactivar unidades de medida');

-- Asignar permisos de unidades a roles que ya tienen catalogos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p2.id
FROM role_permissions rp
JOIN permissions p1 ON p1.id = rp.permission_id AND p1.module = 'catalogos'
JOIN permissions p2 ON p2.module = 'unidades' AND p2.code = REPLACE(p1.code, 'catalogos.', 'unidades.');

-- Superusuario/admin ya cubierto por rol; asegurar admin por nombre
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.module = 'unidades';

COMMIT;

-- Verificacion
SELECT 'unidades' AS tabla, COUNT(*) AS total FROM unidades;
SELECT id, nombre, abreviatura, idestatus FROM unidades ORDER BY id;