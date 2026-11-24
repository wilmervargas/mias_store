-- Migracion V3: soporte producto base + filas/SKUs por almacen
-- Ejecutar una sola vez sobre una base ya migrada a V2.

ALTER TABLE productos
  ADD COLUMN es_base TINYINT(1) NOT NULL DEFAULT 0 AFTER producto_base_id;

-- Permitir precio 0 para registros base; la app valida precio > 0 en SKUs.
ALTER TABLE productos DROP CHECK chk_producto_precio;
ALTER TABLE productos
  ADD CONSTRAINT chk_producto_precio CHECK (precio >= 0);

-- Los productos existentes se consideran SKUs (es_base = 0).
UPDATE productos SET es_base = 0 WHERE es_base IS NULL;

-- Indice util para cargar hijos por base.
CREATE INDEX idx_producto_es_base ON productos (es_base);
