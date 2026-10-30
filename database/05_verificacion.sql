-- ============================================================
-- MIAS STORE - FASE 1: VERIFICACION
-- Ejecutar despues de 04_triggers_vistas.sql.
-- Todas las consultas son de solo lectura, excepto las pruebas
-- de inmutabilidad que se revierten con ROLLBACK.
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. MIGRACIONES APLICADAS
-- ------------------------------------------------------------
SELECT version, descripcion, applied_at
FROM schema_migrations
ORDER BY version;

-- ------------------------------------------------------------
-- 2. CONTEO GENERAL
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM productos)                              AS productos,
  (SELECT COUNT(*) FROM backup_productos_v1)                    AS productos_backup,
  (SELECT COUNT(*) FROM producto_variantes WHERE es_base = 1)   AS variantes_base,
  (SELECT COUNT(*) FROM inventario_stock)                       AS filas_inventario,
  (SELECT COUNT(*) FROM movimientos_inventario WHERE tipo='inicial') AS movimientos_iniciales,
  (SELECT COALESCE(SUM(stock), 0) FROM productos)               AS stock_productos,
  (SELECT COALESCE(SUM(stock_actual), 0) FROM inventario_stock WHERE idestatus=1) AS stock_inventario;

-- ------------------------------------------------------------
-- 3. PRODUCTOS SIN VARIANTE BASE (debe ser 0)
-- ------------------------------------------------------------
SELECT COUNT(*) AS productos_sin_variante_base
FROM productos p
LEFT JOIN producto_variantes v
  ON v.producto_id = p.id AND v.es_base = 1
WHERE v.id IS NULL;

-- ------------------------------------------------------------
-- 4. PRODUCTOS CON MAS DE UNA VARIANTE BASE (debe ser 0)
-- ------------------------------------------------------------
SELECT COUNT(*) AS productos_con_varias_bases
FROM (
  SELECT producto_id
  FROM producto_variantes
  WHERE es_base = 1
  GROUP BY producto_id
  HAVING COUNT(*) <> 1
) x;

-- ------------------------------------------------------------
-- 5. VARIANTES BASE SIN INVENTARIO (debe ser 0)
-- ------------------------------------------------------------
SELECT COUNT(*) AS variantes_base_sin_inventario
FROM producto_variantes v
LEFT JOIN inventario_stock i ON i.variante_id = v.id
WHERE v.es_base = 1 AND i.id IS NULL;

-- ------------------------------------------------------------
-- 6. DESCUADRE ENTRE productos.stock Y EL INVENTARIO REAL (debe ser 0)
-- ------------------------------------------------------------
SELECT COUNT(*) AS productos_con_stock_descuadrado
FROM (
  SELECT
    p.id,
    p.stock,
    COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) AS stock_calculado
  FROM productos p
  LEFT JOIN producto_variantes v
    ON v.producto_id = p.id AND v.idestatus = 1
  LEFT JOIN inventario_stock i
    ON i.variante_id = v.id AND i.idestatus = 1
  GROUP BY p.id, p.stock
  HAVING p.stock <> stock_calculado
) x;

-- ------------------------------------------------------------
-- 7. SKU DUPLICADOS (debe devolver 0 filas)
-- ------------------------------------------------------------
SELECT sku, COUNT(*) AS cantidad
FROM producto_variantes
GROUP BY sku
HAVING COUNT(*) > 1;

-- ------------------------------------------------------------
-- 8. ITEMS DE CARRITO / PEDIDOS SIN VARIANTE (debe ser 0)
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM items_carrito WHERE variante_id IS NULL) AS carrito_sin_variante,
  (SELECT COUNT(*) FROM items_pedido  WHERE variante_id IS NULL) AS pedidos_sin_variante;

-- ------------------------------------------------------------
-- 9. CLASIFICACION POR COLOR
-- ------------------------------------------------------------
SELECT
  COALESCE(c.nombre, '(sin color)') AS color,
  COUNT(*) AS variantes
FROM producto_variantes v
LEFT JOIN colores c ON c.id = v.color_id
WHERE v.es_base = 1
GROUP BY c.nombre
ORDER BY variantes DESC, color ASC;

-- ------------------------------------------------------------
-- 10. CLASIFICACION POR TALLA
-- ------------------------------------------------------------
SELECT
  COALESCE(t.nombre, '(sin talla)') AS talla,
  COUNT(*) AS variantes
FROM producto_variantes v
LEFT JOIN tallas t ON t.id = v.talla_id
WHERE v.es_base = 1
GROUP BY t.nombre
ORDER BY variantes DESC, talla ASC;

-- ------------------------------------------------------------
-- 11. CLASIFICACION PENDIENTE
-- ------------------------------------------------------------
SELECT COUNT(*) AS productos_con_clasificacion_pendiente
FROM vw_clasificacion_pendiente;

SELECT
  SUM(falta_color)  AS sin_color,
  SUM(falta_modelo) AS sin_modelo,
  SUM(falta_talla)  AS sin_talla_real
FROM vw_clasificacion_pendiente;

-- ------------------------------------------------------------
-- 12. TRIGGERS Y VISTAS CREADOS
-- ------------------------------------------------------------
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY TRIGGER_NAME;

SELECT TABLE_NAME
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- ------------------------------------------------------------
-- 13. PRUEBA DE INMUTABILIDAD DEL INVENTARIO INICIAL
-- Debe devolver: OK: bloqueado por trigger
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_test_inmutabilidad_inicial;

DELIMITER $$

CREATE PROCEDURE sp_test_inmutabilidad_inicial()
BEGIN
  DECLARE v_id INT;
  DECLARE v_resultado VARCHAR(100) DEFAULT 'FALLO: el trigger no bloqueo la modificacion';

  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    SET v_resultado = 'OK: bloqueado por trigger';

  SELECT id INTO v_id FROM inventario_stock ORDER BY id LIMIT 1;

  START TRANSACTION;
  UPDATE inventario_stock
  SET inventario_inicial = inventario_inicial + 1
  WHERE id = v_id;
  ROLLBACK;

  SELECT v_resultado AS test_inmutabilidad_inicial;
END$$

DELIMITER ;

CALL sp_test_inmutabilidad_inicial();

SELECT 'Resultado esperado: OK: bloqueado por trigger' AS nota;

DROP PROCEDURE IF EXISTS sp_test_inmutabilidad_inicial;

-- ------------------------------------------------------------
-- 14. PRUEBA DE BLOQUEO DE DELETE DE INVENTARIO
-- Debe devolver: OK: bloqueado por trigger
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_test_delete_inventario;

DELIMITER $$

CREATE PROCEDURE sp_test_delete_inventario()
BEGIN
  DECLARE v_id INT;
  DECLARE v_resultado VARCHAR(100) DEFAULT 'FALLO: el trigger no bloqueo el delete';

  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    SET v_resultado = 'OK: bloqueado por trigger';

  SELECT id INTO v_id FROM inventario_stock ORDER BY id LIMIT 1;

  START TRANSACTION;
  DELETE FROM inventario_stock WHERE id = v_id;
  ROLLBACK;

  SELECT v_resultado AS test_bloqueo_delete;
END$$

DELIMITER ;

CALL sp_test_delete_inventario();

SELECT 'Resultado esperado: OK: bloqueado por trigger' AS nota;

DROP PROCEDURE IF EXISTS sp_test_delete_inventario;

SELECT 'OK' AS resultado, '05_verificacion.sql ejecutado' AS mensaje;
