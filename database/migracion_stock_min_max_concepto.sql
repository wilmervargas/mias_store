-- Agrega stock minimo/maximo en cabecera de producto y concepto en movimientos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS stock_minimo INT NOT NULL DEFAULT 0 AFTER stock_inicial,
  ADD COLUMN IF NOT EXISTS stock_maximo INT DEFAULT NULL AFTER stock_minimo;

ALTER TABLE movimientos_inventario
  ADD COLUMN IF NOT EXISTS concepto VARCHAR(50) NULL AFTER motivo;
