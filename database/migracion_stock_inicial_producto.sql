-- Agrega stock inicial inmodificable por presentación/producto.
-- Ejecutar una sola vez en bases existentes.

ALTER TABLE productos
  ADD COLUMN stock_inicial INT NOT NULL DEFAULT 0 AFTER stock;

-- Opcional: inicializar stock_inicial con el stock actual para registros existentes.
UPDATE productos SET stock_inicial = stock WHERE stock_inicial = 0;
