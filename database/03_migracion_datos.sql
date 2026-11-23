-- ============================================================
-- MIAS STORE - FASE 1: MIGRACION DE DATOS EXISTENTES
-- Conserva los 393 productos y sus IDs.
--
-- 1. Crea una variante base por producto.
-- 2. Carga el stock actual como inventario inicial (una sola vez).
-- 3. Registra el movimiento inicial en el kardex.
-- 4. Rellena variante_id en carrito y pedidos.
-- 5. Clasifica colores y tallas de cama/ropa cuando es detectable.
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- BACKUPS LOGICOS (si no existen)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_productos_v1 AS SELECT * FROM productos;
CREATE TABLE IF NOT EXISTS backup_items_carrito_v1 AS SELECT * FROM items_carrito;
CREATE TABLE IF NOT EXISTS backup_items_pedido_v1 AS SELECT * FROM items_pedido;

-- ------------------------------------------------------------
-- 1. VARIANTE BASE POR PRODUCTO
-- SKU: DAM-{CATEGORIA}-{ID_PRODUCTO_5}-01
-- ------------------------------------------------------------
INSERT INTO producto_variantes
  (producto_id, sku, codigo_barras, talla_id, color_id, modelo_id,
   clave_variante, atributos, referencia, es_base, base_producto_id,
   combinacion_hash, idestatus)
SELECT
  p.id,
  CONCAT(
    'DAM-',
    CASE p.idcategoria
      WHEN 1 THEN 'TEC'
      WHEN 2 THEN 'HOG'
      WHEN 3 THEN 'MAQ'
      WHEN 6 THEN 'ALI'
      ELSE 'GEN'
    END,
    '-', LPAD(p.id, 5, '0'), '-01'
  ),
  NULL,
  t.id,
  NULL,
  NULL,
  '',
  NULL,
  p.nombre,
  1,
  p.id,
  SHA2(CONCAT_WS('|', p.id, t.id, 0, 0, ''), 256),
  1
FROM productos p
JOIN tallas t ON t.codigo = 'UNICA'
WHERE NOT EXISTS (
  SELECT 1 FROM producto_variantes v
  WHERE v.producto_id = p.id AND v.es_base = 1
);

-- ------------------------------------------------------------
-- 2. CLASIFICACION AUTOMATICA DE COLOR
-- Solo se aplica a la variante base y si aun no tiene color.
-- ------------------------------------------------------------
UPDATE producto_variantes v
JOIN productos p ON p.id = v.producto_id
JOIN colores c ON c.codigo = CASE
  WHEN UPPER(p.nombre) LIKE '%VERDE CLARO%'      THEN 'VERDE_CLARO'
  WHEN UPPER(p.nombre) LIKE '%AZUL MARINO%'      THEN 'AZUL_MARINO'
  WHEN UPPER(p.nombre) LIKE '%ACERO INOX%'       THEN 'PLATA'
  WHEN UPPER(p.nombre) LIKE '%PLATEADO%'         THEN 'PLATA'
  WHEN UPPER(p.nombre) LIKE '%CROMADO%'          THEN 'PLATA'
  WHEN UPPER(p.nombre) LIKE '%CROMADA%'          THEN 'PLATA'
  WHEN UPPER(p.nombre) LIKE '%PURPURA%'          THEN 'MORADO'
  WHEN UPPER(p.nombre) LIKE '%MORADO%'           THEN 'MORADO'
  WHEN UPPER(p.nombre) LIKE '%ROSADO%'           THEN 'ROSADO'
  WHEN UPPER(p.nombre) LIKE '%ROJO%'             THEN 'ROJO'
  WHEN UPPER(p.nombre) LIKE '%DORADO%'           THEN 'DORADO'
  WHEN UPPER(p.nombre) LIKE '%BEIGE%'            THEN 'BEIGE'
  WHEN UPPER(p.nombre) LIKE '%MARRÓN%'           THEN 'MARRON'
  WHEN UPPER(p.nombre) LIKE '%MARRON%'           THEN 'MARRON'
  WHEN UPPER(p.nombre) LIKE '%CAFÉ%'             THEN 'MARRON'
  WHEN UPPER(p.nombre) LIKE '%CAFE%'             THEN 'MARRON'
  WHEN UPPER(p.nombre) LIKE '%NARANJA%'          THEN 'NARANJA'
  WHEN UPPER(p.nombre) LIKE '%AMARILLO%'         THEN 'AMARILLO'
  WHEN UPPER(p.nombre) LIKE '%CELESTE%'          THEN 'CELESTE'
  WHEN UPPER(p.nombre) LIKE '%VERDE%'            THEN 'VERDE'
  WHEN UPPER(p.nombre) LIKE '%AZUL%'             THEN 'AZUL'
  WHEN UPPER(p.nombre) LIKE '%BLANCO%'           THEN 'BLANCO'
  WHEN UPPER(p.nombre) LIKE '%GRIS%'             THEN 'GRIS'
  WHEN UPPER(p.nombre) LIKE '%NEGRO%'            THEN 'NEGRO'
  WHEN UPPER(p.nombre) LIKE '%PLATA%'            THEN 'PLATA'
  WHEN UPPER(p.nombre) LIKE '%TRANSPARENTE%'     THEN 'TRANSPARENTE'
  WHEN UPPER(p.nombre) LIKE '%MULTICOLOR%'       THEN 'MULTICOLOR'
  ELSE NULL
END
SET v.color_id = c.id
WHERE v.es_base = 1
  AND v.color_id IS NULL;

-- ------------------------------------------------------------
-- 3. CLASIFICACION AUTOMATICA DE TALLA
-- Primero todo queda en UNICA. Luego se detectan:
--   - Tallas de cama (Twin/Full/Queen/King) en mobiliario/textiles.
--   - Tallas de ropa solo cuando el nombre dice "TALLA X".
-- Se evita confundir capacidades (6L, 4L, 3M) con tallas.
-- ------------------------------------------------------------
UPDATE producto_variantes v
JOIN tallas t ON t.codigo = 'UNICA'
SET v.talla_id = t.id
WHERE v.es_base = 1;

UPDATE producto_variantes v
JOIN productos p ON p.id = v.producto_id
JOIN tallas t ON t.codigo = CASE
  WHEN UPPER(p.nombre) REGEXP '(^|[^A-Z])KING([^A-Z]|$)'  THEN 'KING'
  WHEN UPPER(p.nombre) REGEXP '(^|[^A-Z])QUEEN([^A-Z]|$)' THEN 'QUEEN'
  WHEN UPPER(p.nombre) REGEXP '(^|[^A-Z])FULL([^A-Z]|$)'  THEN 'FULL'
  WHEN UPPER(p.nombre) REGEXP '(^|[^A-Z])TWIN([^A-Z]|$)'  THEN 'TWIN'
  ELSE NULL
END
SET v.talla_id = t.id
WHERE v.es_base = 1
  AND p.idsubcategoria IN (23, 25);

UPDATE producto_variantes v
JOIN productos p ON p.id = v.producto_id
JOIN tallas t ON t.codigo = CASE
  WHEN UPPER(p.nombre) LIKE '%TALLA XXXL%' THEN 'XXXL'
  WHEN UPPER(p.nombre) LIKE '%TALLA XXL%'  THEN 'XXL'
  WHEN UPPER(p.nombre) LIKE '%TALLA XL%'   THEN 'XL'
  WHEN UPPER(p.nombre) LIKE '%TALLA XS%'   THEN 'XS'
  WHEN UPPER(p.nombre) LIKE '%TALLA L%'    THEN 'L'
  WHEN UPPER(p.nombre) LIKE '%TALLA M%'    THEN 'M'
  WHEN UPPER(p.nombre) LIKE '%TALLA S%'    THEN 'S'
  ELSE NULL
END
SET v.talla_id = t.id
WHERE v.es_base = 1
  AND UPPER(p.nombre) LIKE '%TALLA %';

-- ------------------------------------------------------------
-- 4. INVENTARIO INICIAL
-- El stock actual de productos se convierte en inventario_inicial.
-- Se carga en el almacen PRINCIPAL / ubicacion SIN-UBICACION.
-- ------------------------------------------------------------
INSERT INTO inventario_stock
  (variante_id, almacen_id, ubicacion_id,
   stock_actual, stock_reservado, stock_minimo, stock_maximo,
   inventario_inicial, fecha_inventario_inicial, idestatus)
SELECT
  v.id,
  a.id,
  u.id,
  GREATEST(p.stock, 0),
  0,
  5,
  NULL,
  GREATEST(p.stock, 0),
  NOW(),
  1
FROM productos p
JOIN producto_variantes v ON v.producto_id = p.id AND v.es_base = 1
JOIN almacenes a ON a.codigo = 'PRINCIPAL'
JOIN ubicaciones u ON u.almacen_id = a.id AND u.codigo = 'SIN-UBICACION'
WHERE NOT EXISTS (
  SELECT 1 FROM inventario_stock i
  WHERE i.variante_id = v.id AND i.ubicacion_id = u.id
);

-- ------------------------------------------------------------
-- 5. MOVIMIENTO INICIAL EN EL KARDEX
-- ------------------------------------------------------------
INSERT INTO movimientos_inventario
  (variante_id, almacen_id, ubicacion_id, tipo, cantidad,
   stock_anterior, stock_nuevo, costo_unitario, motivo,
   referencia_tipo, referencia_id, usuario_id, created_at)
SELECT
  i.variante_id,
  i.almacen_id,
  i.ubicacion_id,
  'inicial',
  i.inventario_inicial,
  0,
  i.inventario_inicial,
  p.costo,
  'Carga inicial durante la migración de inventario',
  'migracion',
  p.id,
  NULL,
  i.fecha_inventario_inicial
FROM inventario_stock i
JOIN producto_variantes v ON v.id = i.variante_id
JOIN productos p ON p.id = v.producto_id
WHERE NOT EXISTS (
  SELECT 1 FROM movimientos_inventario m
  WHERE m.variante_id = i.variante_id
    AND m.ubicacion_id = i.ubicacion_id
    AND m.tipo = 'inicial'
);

-- ------------------------------------------------------------
-- 6. BACKFILL DE VARIANTE EN CARRITO Y PEDIDOS
-- ------------------------------------------------------------
UPDATE items_carrito ic
JOIN producto_variantes v
  ON v.producto_id = ic.producto_id AND v.es_base = 1
SET ic.variante_id = v.id
WHERE ic.variante_id IS NULL;

UPDATE items_pedido ip
JOIN producto_variantes v
  ON v.producto_id = ip.producto_id AND v.es_base = 1
SET ip.variante_id = v.id,
    ip.costo_unitario = COALESCE(ip.costo_unitario, 0.00)
WHERE ip.variante_id IS NULL;

-- ------------------------------------------------------------
-- 7. SINCRONIZAR EL STOCK CACHEADO DE PRODUCTOS
-- productos.stock = suma de stock disponible de sus variantes
-- ------------------------------------------------------------
UPDATE productos p
LEFT JOIN (
  SELECT v.producto_id,
         SUM(i.stock_actual - i.stock_reservado) AS total
  FROM producto_variantes v
  JOIN inventario_stock i ON i.variante_id = v.id AND i.idestatus = 1
  WHERE v.idestatus = 1
  GROUP BY v.producto_id
) s ON s.producto_id = p.id
SET p.stock = COALESCE(s.total, 0);

-- ------------------------------------------------------------
-- REGISTRO DE MIGRACION
-- ------------------------------------------------------------
INSERT IGNORE INTO schema_migrations (version, descripcion)
VALUES ('03', 'Migracion de productos existentes a variantes e inventario inicial');

SELECT
  (SELECT COUNT(*) FROM productos) AS productos,
  (SELECT COUNT(*) FROM producto_variantes WHERE es_base = 1) AS variantes_base,
  (SELECT COUNT(*) FROM inventario_stock) AS filas_inventario,
  (SELECT COUNT(*) FROM movimientos_inventario WHERE tipo = 'inicial') AS movimientos_iniciales,
  (SELECT COUNT(*) FROM items_carrito WHERE variante_id IS NULL) AS carrito_sin_variante,
  (SELECT COUNT(*) FROM items_pedido WHERE variante_id IS NULL) AS pedidos_sin_variante,
  (SELECT COALESCE(SUM(stock), 0) FROM productos) AS stock_total_productos,
  (SELECT COALESCE(SUM(stock_actual), 0) FROM inventario_stock WHERE idestatus = 1) AS stock_total_inventario;
