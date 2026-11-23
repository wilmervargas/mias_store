-- ============================================================
-- MIAS STORE - SOPORTE DEL BACKEND
-- Indices de integridad que usa la API de carrito e inventario.
-- Idempotente: se puede ejecutar mas de una vez.
-- ============================================================

USE mias_store;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Un carrito activo por cliente
-- ------------------------------------------------------------
CALL sp_add_index_if_not_exists('carritos', 'uq_carrito_cliente',
  'UNIQUE KEY uq_carrito_cliente (cliente_id)');

-- ------------------------------------------------------------
-- Una linea por variante dentro del carrito de un cliente
-- ------------------------------------------------------------
CALL sp_add_index_if_not_exists('items_carrito', 'uq_carrito_cliente_variante',
  'UNIQUE KEY uq_carrito_cliente_variante (cliente_id, variante_id)');

-- ------------------------------------------------------------
-- Busqueda de movimientos por referencia de pedido
-- ------------------------------------------------------------
CALL sp_add_index_if_not_exists('movimientos_inventario', 'idx_mov_referencia_tipo_id',
  'KEY idx_mov_referencia_tipo_id (referencia_tipo, referencia_id, created_at)');

INSERT IGNORE INTO schema_migrations (version, descripcion)
VALUES ('06', 'Indices de soporte para carrito por variante e inventario');

SELECT 'OK' AS resultado, '06_soporte_backend.sql ejecutado' AS mensaje;
