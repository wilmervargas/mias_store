-- Imagenes multiples por producto
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id INT NOT NULL AUTO_INCREMENT,
  producto_id INT NOT NULL,
  imagen VARCHAR(150) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pi_producto (producto_id, orden),
  CONSTRAINT fk_pi_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
