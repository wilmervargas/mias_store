-- Tasas de cambio / divisas para el panel de control
CREATE TABLE IF NOT EXISTS tasas_cambio (
  id INT NOT NULL AUTO_INCREMENT,
  moneda VARCHAR(4) NOT NULL DEFAULT 'VES',
  moneda_base VARCHAR(4) NOT NULL,
  tasa DECIMAL(18,2) NOT NULL,
  fuente ENUM('bcv','usdt','manual','ajustada') NOT NULL DEFAULT 'manual',
  vigente_desde DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasa_moneda_base (moneda_base),
  KEY idx_tasa_vigente (vigente_desde),
  KEY idx_tasa_par_fecha (moneda, moneda_base, vigente_desde)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
