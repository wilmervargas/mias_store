-- ============================================================
-- MIAS STORE - FASE 1: TRIGGERS Y VISTAS
-- Protege el inventario inicial y mantiene sincronizado
-- productos.stock con el inventario real.
-- Ejecutar DESPUES de 03_migracion_datos.sql.
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- LIMPIEZA DE OBJETOS PREVIOS
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_inv_inicial_bu;
DROP TRIGGER IF EXISTS trg_inv_no_delete_bd;
DROP TRIGGER IF EXISTS trg_inv_ai;
DROP TRIGGER IF EXISTS trg_inv_au;
DROP TRIGGER IF EXISTS trg_inv_ad;
DROP TRIGGER IF EXISTS trg_var_au;
DROP TRIGGER IF EXISTS trg_var_ad;
DROP TRIGGER IF EXISTS trg_var_base_bi;
DROP TRIGGER IF EXISTS trg_var_base_bu;

DROP PROCEDURE IF EXISTS sp_recalcular_stock_producto;

DELIMITER $$

-- ------------------------------------------------------------
-- RECALCULA EL STOCK CACHEADO DE UN PRODUCTO
-- productos.stock = SUM(stock_actual - stock_reservado)
-- ------------------------------------------------------------
CREATE PROCEDURE sp_recalcular_stock_producto(IN p_producto_id INT)
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
END$$

-- ------------------------------------------------------------
-- PROTECCION DEL INVENTARIO INICIAL
-- Una vez creada la fila, inventario_inicial y su fecha
-- no pueden modificarse nunca.
-- ------------------------------------------------------------
CREATE TRIGGER trg_inv_inicial_bu
BEFORE UPDATE ON inventario_stock
FOR EACH ROW
BEGIN
  IF NOT (NEW.inventario_inicial <=> OLD.inventario_inicial) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El inventario inicial es inmutable y no puede modificarse';
  END IF;

  IF NOT (NEW.fecha_inventario_inicial <=> OLD.fecha_inventario_inicial) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La fecha del inventario inicial es inmutable';
  END IF;
END$$

-- ------------------------------------------------------------
-- NO SE PERMITE BORRAR FILAS DE INVENTARIO
-- Se desactivan con idestatus = 2.
-- ------------------------------------------------------------
CREATE TRIGGER trg_inv_no_delete_bd
BEFORE DELETE ON inventario_stock
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se puede eliminar una fila de inventario; use idestatus = 2';
END$$

-- ------------------------------------------------------------
-- SINCRONIZACION: INSERT DE INVENTARIO
-- ------------------------------------------------------------
CREATE TRIGGER trg_inv_ai
AFTER INSERT ON inventario_stock
FOR EACH ROW
BEGIN
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
END$$

-- ------------------------------------------------------------
-- SINCRONIZACION: UPDATE DE INVENTARIO
-- Resta el valor anterior y suma el nuevo.
-- ------------------------------------------------------------
CREATE TRIGGER trg_inv_au
AFTER UPDATE ON inventario_stock
FOR EACH ROW
BEGIN
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
END$$

-- ------------------------------------------------------------
-- SINCRONIZACION: DELETE DE INVENTARIO
-- El trigger anterior bloquea el delete, pero se mantiene
-- por seguridad si alguien desactiva la proteccion.
-- ------------------------------------------------------------
CREATE TRIGGER trg_inv_ad
AFTER DELETE ON inventario_stock
FOR EACH ROW
BEGIN
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
END$$

-- ------------------------------------------------------------
-- VARIANTE BASE Y HASH DE COMBINACION
-- Se mantienen con triggers para evitar columnas generadas
-- que referencian columnas con foreign key en MySQL 8.4.
-- ------------------------------------------------------------
CREATE TRIGGER trg_var_base_bi
BEFORE INSERT ON producto_variantes
FOR EACH ROW
BEGIN
  SET NEW.base_producto_id = IF(NEW.es_base = 1, NEW.producto_id, NULL);
  SET NEW.combinacion_hash = SHA2(CONCAT_WS('|',
    NEW.producto_id,
    COALESCE(NEW.talla_id, 0),
    COALESCE(NEW.color_id, 0),
    COALESCE(NEW.modelo_id, 0),
    NEW.clave_variante
  ), 256);
END$$

CREATE TRIGGER trg_var_base_bu
BEFORE UPDATE ON producto_variantes
FOR EACH ROW
BEGIN
  SET NEW.base_producto_id = IF(NEW.es_base = 1, NEW.producto_id, NULL);
  SET NEW.combinacion_hash = SHA2(CONCAT_WS('|',
    NEW.producto_id,
    COALESCE(NEW.talla_id, 0),
    COALESCE(NEW.color_id, 0),
    COALESCE(NEW.modelo_id, 0),
    NEW.clave_variante
  ), 256);
END$$

-- ------------------------------------------------------------
-- SINCRONIZACION: CAMBIO DE ESTATUS O DE PRODUCTO EN VARIANTE
-- ------------------------------------------------------------
CREATE TRIGGER trg_var_au
AFTER UPDATE ON producto_variantes
FOR EACH ROW
BEGIN
  IF NOT (OLD.producto_id <=> NEW.producto_id)
     OR NOT (OLD.idestatus <=> NEW.idestatus) THEN

    CALL sp_recalcular_stock_producto(OLD.producto_id);

    IF NOT (OLD.producto_id <=> NEW.producto_id) THEN
      CALL sp_recalcular_stock_producto(NEW.producto_id);
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_var_ad
AFTER DELETE ON producto_variantes
FOR EACH ROW
BEGIN
  CALL sp_recalcular_stock_producto(OLD.producto_id);
END$$

DELIMITER ;

-- ------------------------------------------------------------
-- RECALCULO ABSOLUTO INICIAL (antes de activar sincronizacion)
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
-- VISTAS
-- ------------------------------------------------------------

-- Inventario detallado con producto, variante, almacen y ubicacion
CREATE OR REPLACE VIEW vw_inventario_detalle AS
SELECT
  i.id                              AS inventario_id,
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  p.costo,
  p.precio,
  p.preciofull,
  v.id                              AS variante_id,
  v.sku,
  v.codigo_barras,
  v.referencia,
  v.clave_variante,
  t.nombre                          AS talla,
  co.nombre                         AS color,
  mo.nombre                         AS modelo,
  a.id                              AS almacen_id,
  a.codigo                          AS almacen_codigo,
  a.nombre                          AS almacen,
  u.id                              AS ubicacion_id,
  u.codigo                          AS ubicacion_codigo,
  u.pasillo,
  u.estante,
  u.sector,
  u.nivel,
  i.stock_actual,
  i.stock_reservado,
  (i.stock_actual - i.stock_reservado) AS stock_disponible,
  i.stock_minimo,
  i.stock_maximo,
  i.inventario_inicial,
  i.fecha_inventario_inicial,
  i.ultima_entrada,
  i.ultima_salida,
  i.idestatus
FROM inventario_stock i
INNER JOIN producto_variantes v ON v.id = i.variante_id
INNER JOIN productos p         ON p.id = v.producto_id
INNER JOIN almacenes a         ON a.id = i.almacen_id
INNER JOIN ubicaciones u       ON u.id = i.ubicacion_id
LEFT  JOIN tallas t            ON t.id = v.talla_id
LEFT  JOIN colores co          ON co.id = v.color_id
LEFT  JOIN modelos mo          ON mo.id = v.modelo_id;

-- Stock total por producto
CREATE OR REPLACE VIEW vw_producto_stock AS
SELECT
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  p.costo,
  p.precio,
  p.preciofull,
  (p.precio - p.costo)              AS margen_unitario,
  COUNT(DISTINCT v.id)              AS variantes,
  COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) AS stock_total,
  COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) * p.costo  AS valor_costo,
  COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) * p.precio AS valor_venta,
  p.stock                           AS stock_cache,
  p.idestatus
FROM productos p
LEFT JOIN producto_variantes v ON v.producto_id = p.id AND v.idestatus = 1
LEFT JOIN inventario_stock i   ON i.variante_id = v.id AND i.idestatus = 1
GROUP BY p.id, p.nombre, p.costo, p.precio, p.preciofull, p.stock, p.idestatus;

-- Stock por producto y almacen
CREATE OR REPLACE VIEW vw_stock_por_almacen AS
SELECT
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  a.id                              AS almacen_id,
  a.codigo                          AS almacen_codigo,
  a.nombre                          AS almacen,
  COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) AS stock_disponible
FROM productos p
INNER JOIN producto_variantes v ON v.producto_id = p.id AND v.idestatus = 1
INNER JOIN inventario_stock i   ON i.variante_id = v.id AND i.idestatus = 1
INNER JOIN almacenes a          ON a.id = i.almacen_id
GROUP BY p.id, p.nombre, a.id, a.codigo, a.nombre;

-- Kardex legible
CREATE OR REPLACE VIEW vw_kardex AS
SELECT
  m.id                              AS movimiento_id,
  m.created_at,
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  v.sku,
  v.referencia,
  t.nombre                          AS talla,
  co.nombre                         AS color,
  mo.nombre                         AS modelo,
  a.nombre                          AS almacen,
  u.codigo                          AS ubicacion_codigo,
  u.pasillo,
  u.estante,
  u.sector,
  u.nivel,
  m.tipo,
  m.cantidad,
  m.stock_anterior,
  m.stock_nuevo,
  m.costo_unitario,
  m.motivo,
  m.referencia_tipo,
  m.referencia_id,
  us.nombre                         AS usuario
FROM movimientos_inventario m
INNER JOIN producto_variantes v ON v.id = m.variante_id
INNER JOIN productos p         ON p.id = v.producto_id
INNER JOIN almacenes a         ON a.id = m.almacen_id
INNER JOIN ubicaciones u       ON u.id = m.ubicacion_id
LEFT  JOIN tallas t            ON t.id = v.talla_id
LEFT  JOIN colores co          ON co.id = v.color_id
LEFT  JOIN modelos mo          ON mo.id = v.modelo_id
LEFT  JOIN usuarios us         ON us.id = m.usuario_id;

-- Stock critico por ubicacion
CREATE OR REPLACE VIEW vw_stock_critico AS
SELECT
  i.id                              AS inventario_id,
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  v.sku,
  v.referencia,
  a.nombre                          AS almacen,
  u.codigo                          AS ubicacion_codigo,
  u.pasillo,
  u.estante,
  u.sector,
  u.nivel,
  i.stock_actual,
  i.stock_reservado,
  (i.stock_actual - i.stock_reservado) AS stock_disponible,
  i.stock_minimo
FROM inventario_stock i
INNER JOIN producto_variantes v ON v.id = i.variante_id
INNER JOIN productos p         ON p.id = v.producto_id
INNER JOIN almacenes a         ON a.id = i.almacen_id
INNER JOIN ubicaciones u       ON u.id = i.ubicacion_id
WHERE i.idestatus = 1
  AND v.idestatus = 1
  AND p.idestatus = 1
  AND (i.stock_actual - i.stock_reservado) < i.stock_minimo;

-- Clasificacion pendiente: color, modelo y talla real
CREATE OR REPLACE VIEW vw_clasificacion_pendiente AS
SELECT
  p.id                              AS producto_id,
  p.nombre                          AS producto,
  p.idcategoria,
  p.idsubcategoria,
  cat.nombre                        AS categoria,
  mar.nombre                        AS marca,
  v.id                              AS variante_id,
  v.sku,
  v.referencia,
  t.nombre                          AS talla,
  co.nombre                         AS color,
  mo.nombre                         AS modelo,
  (v.color_id IS NULL)              AS falta_color,
  (v.modelo_id IS NULL)             AS falta_modelo,
  (p.idsubcategoria IN (23, 25)
    AND (v.talla_id IS NULL OR t.codigo = 'UNICA')) AS falta_talla
FROM productos p
INNER JOIN producto_variantes v ON v.producto_id = p.id AND v.es_base = 1
LEFT  JOIN categorias cat       ON cat.id = p.idcategoria
LEFT  JOIN marcas mar           ON mar.id = p.idmarca
LEFT  JOIN tallas t             ON t.id = v.talla_id
LEFT  JOIN colores co           ON co.id = v.color_id
LEFT  JOIN modelos mo           ON mo.id = v.modelo_id
WHERE p.idestatus = 1
  AND (
    v.color_id IS NULL
    OR v.modelo_id IS NULL
    OR (p.idsubcategoria IN (23, 25)
        AND (v.talla_id IS NULL OR t.codigo = 'UNICA'))
  );

-- ------------------------------------------------------------
-- REGISTRO DE MIGRACION
-- ------------------------------------------------------------
INSERT IGNORE INTO schema_migrations (version, descripcion)
VALUES ('04', 'Triggers de inmutabilidad, sincronizacion de stock y vistas');

SELECT 'OK' AS resultado, '04_triggers_vistas.sql ejecutado' AS mensaje;
