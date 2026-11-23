-- ============================================================
-- MIAS STORE - FASE 1: CATALOGOS BASE
-- Almacenes, ubicaciones, tallas, colores y modelo generico.
-- Idempotente: se puede ejecutar varias veces.
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- ESTATUS BASE
-- ------------------------------------------------------------
INSERT IGNORE INTO estatus (id, nombre) VALUES
  (1, 'Activo'),
  (2, 'Inactivo');

-- ------------------------------------------------------------
-- ALMACENES
-- ------------------------------------------------------------
INSERT IGNORE INTO almacenes (codigo, nombre, tipo, direccion, idestatus) VALUES
  ('PRINCIPAL', 'Almacén Principal', 'principal', NULL, 1),
  ('TIENDA',    'Tienda',            'tienda',    NULL, 1),
  ('DEPOSITO',  'Depósito',          'deposito',  NULL, 1);

-- ------------------------------------------------------------
-- UBICACIONES BASE
-- ------------------------------------------------------------
INSERT IGNORE INTO ubicaciones (almacen_id, codigo, pasillo, estante, sector, nivel, descripcion, idestatus)
SELECT a.id, 'SIN-UBICACION', NULL, NULL, NULL, NULL,
       'Ubicación por defecto para la migración inicial', 1
FROM almacenes a
WHERE a.codigo = 'PRINCIPAL';

INSERT IGNORE INTO ubicaciones (almacen_id, codigo, pasillo, estante, sector, nivel, descripcion, idestatus)
SELECT a.id, 'MOSTRADOR', NULL, NULL, NULL, NULL,
       'Mostrador / punto de venta', 1
FROM almacenes a
WHERE a.codigo = 'TIENDA';

INSERT IGNORE INTO ubicaciones (almacen_id, codigo, pasillo, estante, sector, nivel, descripcion, idestatus)
SELECT a.id, 'SIN-UBICACION', NULL, NULL, NULL, NULL,
       'Ubicación por defecto del depósito', 1
FROM almacenes a
WHERE a.codigo = 'DEPOSITO';

-- ------------------------------------------------------------
-- TALLAS
-- sistema: ropa, calzado, nino, cama, unica, otro
-- ------------------------------------------------------------
INSERT IGNORE INTO tallas (nombre, codigo, sistema, orden, idestatus) VALUES
  ('Única', 'UNICA', 'unica', 0, 1),

  ('XS',   'XS',   'ropa', 10, 1),
  ('S',    'S',    'ropa', 20, 1),
  ('M',    'M',    'ropa', 30, 1),
  ('L',    'L',    'ropa', 40, 1),
  ('XL',   'XL',   'ropa', 50, 1),
  ('XXL',  'XXL',  'ropa', 60, 1),
  ('XXXL', 'XXXL', 'ropa', 70, 1),

  ('35', '35', 'calzado', 135, 1),
  ('36', '36', 'calzado', 136, 1),
  ('37', '37', 'calzado', 137, 1),
  ('38', '38', 'calzado', 138, 1),
  ('39', '39', 'calzado', 139, 1),
  ('40', '40', 'calzado', 140, 1),
  ('41', '41', 'calzado', 141, 1),
  ('42', '42', 'calzado', 142, 1),
  ('43', '43', 'calzado', 143, 1),
  ('44', '44', 'calzado', 144, 1),
  ('45', '45', 'calzado', 145, 1),

  ('2',  'N2',  'nino', 202, 1),
  ('4',  'N4',  'nino', 204, 1),
  ('6',  'N6',  'nino', 206, 1),
  ('8',  'N8',  'nino', 208, 1),
  ('10', 'N10', 'nino', 210, 1),
  ('12', 'N12', 'nino', 212, 1),
  ('14', 'N14', 'nino', 214, 1),

  ('Twin',  'TWIN',  'cama', 301, 1),
  ('Full',  'FULL',  'cama', 302, 1),
  ('Queen', 'QUEEN', 'cama', 303, 1),
  ('King',  'KING',  'cama', 304, 1);

-- ------------------------------------------------------------
-- COLORES
-- ------------------------------------------------------------
INSERT IGNORE INTO colores (nombre, codigo, hex, orden, idestatus) VALUES
  ('Negro',        'NEGRO',        '#000000', 10, 1),
  ('Blanco',       'BLANCO',       '#FFFFFF', 20, 1),
  ('Gris',         'GRIS',         '#808080', 30, 1),
  ('Plata',        'PLATA',        '#C0C0C0', 40, 1),
  ('Azul',         'AZUL',         '#0000FF', 50, 1),
  ('Azul Marino',  'AZUL_MARINO',  '#001F3F', 60, 1),
  ('Celeste',      'CELESTE',      '#87CEEB', 70, 1),
  ('Verde',        'VERDE',        '#008000', 80, 1),
  ('Verde Claro',  'VERDE_CLARO',  '#90EE90', 90, 1),
  ('Rojo',         'ROJO',         '#FF0000', 100, 1),
  ('Rosado',       'ROSADO',       '#FFC0CB', 110, 1),
  ('Morado',       'MORADO',       '#800080', 120, 1),
  ('Dorado',       'DORADO',       '#FFD700', 130, 1),
  ('Beige',        'BEIGE',        '#F5F5DC', 140, 1),
  ('Marrón',       'MARRON',       '#8B4513', 150, 1),
  ('Naranja',      'NARANJA',      '#FFA500', 160, 1),
  ('Amarillo',     'AMARILLO',     '#FFFF00', 170, 1),
  ('Transparente', 'TRANSPARENTE', NULL,      180, 1),
  ('Multicolor',   'MULTICOLOR',   NULL,      190, 1),
  ('Sin color',    'SIN_COLOR',    NULL,      999, 1);

-- ------------------------------------------------------------
-- MODELO GENERICO
-- Se usa como valor inicial para productos sin modelo definido.
-- ------------------------------------------------------------
INSERT INTO modelos (idmarca, nombre, codigo, idestatus)
SELECT NULL, 'Genérico', 'GEN', 1
WHERE NOT EXISTS (
  SELECT 1 FROM modelos WHERE codigo = 'GEN' AND idmarca IS NULL
);

-- ------------------------------------------------------------
-- REGISTRO DE MIGRACION
-- ------------------------------------------------------------
INSERT IGNORE INTO schema_migrations (version, descripcion)
VALUES ('02', 'Catalogos base: almacenes, ubicaciones, tallas, colores y modelos');

SELECT 'OK' AS resultado, '02_seed_catalogos.sql ejecutado' AS mensaje;
