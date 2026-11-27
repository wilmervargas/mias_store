<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/Inventario.php';

class Combo
{
    public static function obtenerTodas(array $filtros = []): array
    {
        $db = Database::conectar();
        $sql = "SELECT c.id, c.idestatus, c.sku, c.nombre, c.precio, c.imagen, c.created_at, c.updated_at,
                       e.nombre AS estatus_nombre
                FROM combos c
                JOIN estatus e ON e.id = c.idestatus
                WHERE 1=1";
        $params = [];

        if (!empty($filtros['q'])) {
            $sql .= " AND (c.sku LIKE :q OR c.nombre LIKE :q)";
            $params[':q'] = '%' . trim((string) $filtros['q']) . '%';
        }
        $estatusFiltro = null;
        if (isset($filtros['idestatus']) && $filtros['idestatus'] !== '') {
            $estatusFiltro = (int) $filtros['idestatus'];
        } elseif (isset($filtros['activo']) && $filtros['activo'] !== '') {
            $estatusFiltro = ((int) $filtros['activo'] === 1) ? 1 : 2;
        }
        if ($estatusFiltro !== null) {
            $sql .= " AND c.idestatus = :idestatus";
            $params[':idestatus'] = $estatusFiltro;
        }

        $sql .= " ORDER BY c.nombre ASC, c.id DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $combos = $stmt->fetchAll();

        foreach ($combos as &$c) {
            $c['detalle'] = self::obtenerDetalle((int) $c['id']);
            $c['disponibilidad'] = self::disponibilidadDesdeDetalle($c['detalle']);
            $c['imagen_url'] = self::imagenUrl($c['imagen'] ?? null);
        }
        unset($c);

        return $combos;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT c.id, c.idestatus, c.sku, c.nombre, c.precio, c.imagen, c.created_at, c.updated_at,
                    e.nombre AS estatus_nombre
             FROM combos c
             JOIN estatus e ON e.id = c.idestatus
             WHERE c.id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $combo = $stmt->fetch();
        if (!$combo) return null;
        $combo['detalle'] = self::obtenerDetalle($id);
        $combo['disponibilidad'] = self::disponibilidadDesdeDetalle($combo['detalle']);
        $combo['imagen_url'] = self::imagenUrl($combo['imagen'] ?? null);
        return $combo;
    }

    private static function obtenerDetalle(int $comboId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT cd.id, cd.combo_id, cd.producto_id, cd.cantidad,
                    p.sku_base, p.codigo_producto, p.codigo_detalle, p.nombre AS producto_nombre,
                    p.stock, p.precio AS producto_precio, p.imagen AS producto_imagen,
                    p.es_base, p.idestatus AS producto_estatus,
                    c.nombre AS color, c.codigo_hex AS color_hex,
                    t.nombre AS talla,
                    COALESCE(m.nombre, '') AS marca,
                    COALESCE(cat.nombre, '') AS categoria
             FROM combo_detalle cd
             JOIN productos p ON p.id = cd.producto_id
             LEFT JOIN colores c ON c.id = p.idcolor
             LEFT JOIN tallas t ON t.id = p.idtalla
             LEFT JOIN marcas m ON m.id = p.idmarca
             LEFT JOIN categorias cat ON cat.id = p.idcategoria
             WHERE cd.combo_id = :id
             ORDER BY p.nombre ASC, cd.id ASC"
        );
        $stmt->execute([':id' => $comboId]);
        return $stmt->fetchAll();
    }

    private static function disponibilidadDesdeDetalle(array $detalle): int
    {
        if (!$detalle) return 0;
        $mins = [];
        foreach ($detalle as $d) {
            $stock = (float) ($d['stock'] ?? 0);
            $cant = (float) ($d['cantidad'] ?? 0);
            if ($cant <= 0) return 0;
            $mins[] = (int) floor($stock / $cant);
        }
        return $mins ? max(0, min($mins)) : 0;
    }

    public static function crear(array $datos): int
    {
        self::validar($datos, true);
        $componentes = self::normalizarComponentes($datos['componentes'] ?? []);

        $db = Database::conectar();
        $db->beginTransaction();
        try {
            $sku = self::normalizarSku($datos['sku'] ?? '', (string) ($datos['nombre'] ?? ''));
            self::asegurarSkuUnico($sku, null);

            $stmt = $db->prepare(
                "INSERT INTO combos (idestatus, sku, nombre, precio, imagen)
                 VALUES (:idestatus, :sku, :nombre, :precio, :imagen)"
            );
            $stmt->execute([
                ':idestatus' => (int) ($datos['idestatus'] ?? 1),
                ':sku' => $sku,
                ':nombre' => trim((string) $datos['nombre']),
                ':precio' => (float) ($datos['precio'] ?? 0),
                ':imagen' => !empty($datos['imagen']) ? trim((string) $datos['imagen']) : null,
            ]);
            $comboId = (int) $db->lastInsertId();
            self::reemplazarComponentes($comboId, $componentes);
            $db->commit();
            return $comboId;
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }

    public static function actualizar(int $id, array $datos): bool
    {
        $actual = self::obtenerPorId($id);
        if (!$actual) throw new RuntimeException("Combo #{$id} no encontrado");

        $merged = array_merge($actual, $datos);
        self::validar($merged, false, $id);
        $componentes = array_key_exists('componentes', $datos)
            ? self::normalizarComponentes($datos['componentes'] ?? [])
            : null;

        $db = Database::conectar();
        $db->beginTransaction();
        try {
            $sku = self::normalizarSku($datos['sku'] ?? $actual['sku'], (string) ($datos['nombre'] ?? $actual['nombre']));
            self::asegurarSkuUnico($sku, $id);

            $imagen = array_key_exists('imagen', $datos) ? $datos['imagen'] : $actual['imagen'];
            $stmt = $db->prepare(
                "UPDATE combos SET idestatus=:idestatus, sku=:sku, nombre=:nombre, precio=:precio, imagen=:imagen WHERE id=:id"
            );
            $stmt->execute([
                ':idestatus' => (int) ($datos['idestatus'] ?? $actual['idestatus']),
                ':sku' => $sku,
                ':nombre' => trim((string) ($datos['nombre'] ?? $actual['nombre'])),
                ':precio' => (float) ($datos['precio'] ?? $actual['precio']),
                ':imagen' => ($imagen === '' ? null : $imagen),
                ':id' => $id,
            ]);

            if ($componentes !== null) {
                self::reemplazarComponentes($id, $componentes);
            }
            $db->commit();
            return true;
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }

    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare("DELETE FROM combos WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException("Combo #{$id} no encontrado");
        }
        return true;
    }

    private static function reemplazarComponentes(int $comboId, array $componentes): void
    {
        $db = Database::conectar();
        $del = $db->prepare("DELETE FROM combo_detalle WHERE combo_id = :id");
        $del->execute([':id' => $comboId]);

        $ins = $db->prepare(
            "INSERT INTO combo_detalle (combo_id, producto_id, cantidad) VALUES (:combo, :producto, :cantidad)"
        );
        foreach ($componentes as $comp) {
            $ins->execute([
                ':combo' => $comboId,
                ':producto' => (int) $comp['producto_id'],
                ':cantidad' => (float) $comp['cantidad'],
            ]);
        }
    }

    private static function normalizarSku(string $sku, string $nombre): string
    {
        $sku = strtoupper(trim($sku));
        if ($sku === '') {
            $base = preg_replace('/[^A-Z0-9]+/', '-', strtoupper($nombre));
            $base = trim((string) $base, '-');
            $sku = 'COMBO-' . ($base !== '' ? substr($base, 0, 20) : 'ITEM') . '-' . date('His');
        }
        return $sku;
    }

    private static function asegurarSkuUnico(string $sku, ?int $ignorarId): void
    {
        $db = Database::conectar();
        $sql = "SELECT id FROM combos WHERE sku = :sku";
        $params = [':sku' => $sku];
        if ($ignorarId !== null) {
            $sql .= " AND id <> :id";
            $params[':id'] = $ignorarId;
        }
        $sql .= " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        if ($stmt->fetchColumn()) {
            throw new InvalidArgumentException("El SKU '{$sku}' ya existe en otro combo");
        }
    }

    private static function validar(array $datos, bool $crear, ?int $id = null): void
    {
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        if ($nombre === '') throw new InvalidArgumentException('El nombre del combo es obligatorio');
        $precio = $datos['precio'] ?? null;
        if ($precio === null || $precio === '' || !is_numeric($precio) || (float) $precio < 0) {
            throw new InvalidArgumentException('El precio del combo debe ser un número mayor o igual a 0');
        }
        if ($crear && empty($datos['componentes'])) {
            throw new InvalidArgumentException('Debes agregar al menos un componente al combo');
        }
    }

    private static function normalizarComponentes($componentes): array
    {
        if (!is_array($componentes) || count($componentes) === 0) {
            throw new InvalidArgumentException('Debes agregar al menos un componente al combo');
        }
        $db = Database::conectar();
        $vistos = [];
        $out = [];
        foreach ($componentes as $c) {
            $productoId = (int) ($c['producto_id'] ?? $c['producto'] ?? 0);
            $cantidad = (float) ($c['cantidad'] ?? 0);
            if ($productoId <= 0) throw new InvalidArgumentException('Cada componente debe tener un producto válido');
            if ($cantidad <= 0) throw new InvalidArgumentException('La cantidad de cada componente debe ser mayor a 0');
            if (isset($vistos[$productoId])) throw new InvalidArgumentException('No repitas el mismo producto en el combo');
            $vistos[$productoId] = true;

            $stmt = $db->prepare("SELECT id, es_base, idestatus, nombre FROM productos WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $productoId]);
            $p = $stmt->fetch();
            if (!$p) throw new InvalidArgumentException("El producto #{$productoId} no existe");
            if ((int) $p['es_base'] === 1) {
                throw new InvalidArgumentException("El producto '{$p['nombre']}' es base; selecciona una presentación específica");
            }
            $out[] = ['producto_id' => $productoId, 'cantidad' => $cantidad];
        }
        return $out;
    }

    private static function imagenUrl(?string $imagen): ?string
    {
        $img = trim((string) $imagen);
        if ($img === '') return null;
        if (preg_match('#^https?://#i', $img)) return $img;
        return 'http://localhost:8000/imagenes/' . ltrim($img, '/');
    }

    /** Productos vendibles para seleccionar como componentes (solo presentaciones). */
    public static function productosDisponibles(): array
    {
        $db = Database::conectar();
        $stmt = $db->query(
            "SELECT p.id, p.nombre, p.sku_base, p.codigo_producto, p.codigo_detalle, p.stock, p.precio, p.imagen,
                    p.idestatus, p.es_base,
                    c.nombre AS color, c.codigo_hex AS color_hex,
                    t.nombre AS talla,
                    m.nombre AS marca,
                    cat.nombre AS categoria
             FROM productos p
             LEFT JOIN colores c ON c.id = p.idcolor
             LEFT JOIN tallas t ON t.id = p.idtalla
             LEFT JOIN marcas m ON m.id = p.idmarca
             LEFT JOIN categorias cat ON cat.id = p.idcategoria
             WHERE p.es_base = 0 AND p.idestatus = 1
             ORDER BY p.nombre ASC, p.id ASC"
        );
        return $stmt->fetchAll();
    }

    /** Registra venta de combo: descuenta stock de componentes y crea movimientos por componente. */
    public static function registrarVenta(int $comboId, array $datos): array
    {
        $combo = self::obtenerPorId($comboId);
        if (!$combo) throw new RuntimeException("Combo #{$comboId} no encontrado");

        $cantidadCombos = (int) ($datos['cantidad'] ?? 1);
        if ($cantidadCombos <= 0) throw new InvalidArgumentException('La cantidad de combos debe ser mayor a 0');

        $almacenOrigen = isset($datos['almacen_origen_id']) && $datos['almacen_origen_id'] !== '' ? (int) $datos['almacen_origen_id'] : null;
        $ubicacionOrigen = isset($datos['ubicacion_origen_id']) && $datos['ubicacion_origen_id'] !== '' ? (int) $datos['ubicacion_origen_id'] : null;
        $referencia = trim((string) ($datos['referencia'] ?? ('COMBO-' . $combo['sku'])));
        $motivo = trim((string) ($datos['motivo'] ?? ('Venta combo ' . $combo['nombre'])));
        $usuarioId = !empty($datos['usuario_id']) ? (int) $datos['usuario_id'] : null;

        $db = Database::conectar();
        $db->beginTransaction();
        try {
            $movimientos = [];
            foreach ($combo['detalle'] as $comp) {
                $productoId = (int) $comp['producto_id'];
                $cantComp = (float) $comp['cantidad'] * $cantidadCombos;
                if (floor($cantComp) != $cantComp) {
                    // movimientos_inventario.cantidad es int; exigir entero para venta
                    throw new InvalidArgumentException("La cantidad resultante para '{$comp['producto_nombre']}' debe ser entera");
                }
                $cantInt = (int) $cantComp;
                if ($cantInt <= 0) continue;

                // Validación previa de stock disponible
                $stockActual = (int) ($comp['stock'] ?? 0);
                if ($stockActual < $cantInt) {
                    throw new RuntimeException("Stock insuficiente para '{$comp['producto_nombre']}'. Disponible: {$stockActual}, requerido: {$cantInt}");
                }

                $movId = Inventario::registrar([
                    'tipo' => 'venta',
                    'producto_id' => $productoId,
                    'cantidad' => $cantInt,
                    'almacen_origen_id' => $almacenOrigen,
                    'ubicacion_origen_id' => $ubicacionOrigen,
                    'referencia' => $referencia,
                    'motivo' => $motivo,
                    'concepto' => 'venta_combo',
                    'usuario_id' => $usuarioId,
                ]);
                $movimientos[] = ['producto_id' => $productoId, 'cantidad' => $cantInt, 'movimiento_id' => $movId];
            }
            $db->commit();
            return ['combo_id' => $comboId, 'cantidad_combos' => $cantidadCombos, 'movimientos' => $movimientos];
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }
}
