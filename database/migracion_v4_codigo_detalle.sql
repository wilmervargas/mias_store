-- Migracion V4: codigo de producto compartido + codigo de detalle por presentacion
-- Ejecutar una sola vez despues de V3.

ALTER TABLE productos
  ADD COLUMN codigo_producto VARCHAR(64) NULL AFTER sku_base,
  ADD COLUMN codigo_detalle VARCHAR(64) NULL AFTER codigo_producto;

-- Poblar codigo_producto/codigo_detalle para datos existentes
UPDATE productos p
LEFT JOIN productos pb ON pb.id = p.producto_base_id
SET
  p.codigo_producto = CASE
    WHEN p.es_base = 1 THEN p.sku_base
    WHEN p.producto_base_id IS NOT NULL THEN COALESCE(pb.sku_base, p.sku_base)
    ELSE p.sku_base
  END,
  p.codigo_detalle = CASE
    WHEN p.es_base = 1 THEN NULL
    WHEN p.producto_base_id IS NOT NULL THEN CONCAT(COALESCE(pb.sku_base, p.sku_base), '-', LPAD(p.id, 2, '0'))
    ELSE CONCAT(p.sku_base, '-01')
  END;

-- Asegurar no nulos donde aplique
UPDATE productos SET codigo_producto = sku_base WHERE codigo_producto IS NULL OR codigo_producto = '';
UPDATE productos SET codigo_detalle = CONCAT(codigo_producto, '-', LPAD(id, 2, '0')) WHERE es_base = 0 AND (codigo_detalle IS NULL OR codigo_detalle = '');

CREATE INDEX idx_producto_codigo_producto ON productos (codigo_producto);
ALTER TABLE productos ADD UNIQUE KEY uq_producto_codigo_detalle (codigo_detalle);
