<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
<<<<<<< HEAD

/**
 * Inventario por ubicacion fisica.
 * El stock de un almacen y el stock total del producto son sumas de inventario.
 * productos.stock se mantiene como cache (lo actualizan los triggers).
 */
class Inventario
{
    /** Tipos de movimiento permitidos. */
    public const TIPOS = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion', 'venta', 'compra', 'migracion'];

    /** Devuelve la ubicacion "General" (o la primera) de un almacen. */
    public static function ubicacionDefault(int $almacenId): ?int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT u.id
             FROM ubicaciones u
             JOIN tipos_ubicacion t ON t.id = u.idtipo_ubicacion
             WHERE u.almacen_id = :a AND u.idestatus = 1
             ORDER BY (t.nombre = 'General') DESC, u.profundidad ASC, u.id ASC
             LIMIT 1"
        );
        $stmt->execute([':a' => $almacenId]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /** Asegura que exista la ficha producto_almacen y devuelve su SKU. */
    public static function asegurarProductoAlmacen(int $productoId, int $almacenId): string
    {
        $db = Database::conectar();

        $stmt = $db->prepare("SELECT sku_almacen FROM producto_almacen WHERE producto_id = :p AND almacen_id = :a LIMIT 1");
        $stmt->execute([':p' => $productoId, ':a' => $almacenId]);
        $sku = $stmt->fetchColumn();
        if ($sku !== false) {
            return (string) $sku;
        }

        $stmt = $db->prepare("SELECT sku_base FROM productos WHERE id = :p LIMIT 1");
        $stmt->execute([':p' => $productoId]);
        $base = (string) $stmt->fetchColumn();

        $stmt = $db->prepare("SELECT codigo FROM almacenes WHERE id = :a LIMIT 1");
        $stmt->execute([':a' => $almacenId]);
        $codigo = (string) $stmt->fetchColumn();

        $skuAlmacen = $codigo . '-' . $base;

        // Evita colisiones si el SKU ya existe en otro producto.
        $existe = $db->prepare("SELECT 1 FROM producto_almacen WHERE sku_almacen = :s LIMIT 1");
        $existe->execute([':s' => $skuAlmacen]);
        if ($existe->fetchColumn()) {
            $skuAlmacen .= '-' . $productoId;
        }

        $ins = $db->prepare(
            "INSERT INTO producto_almacen
                (producto_id, almacen_id, sku_almacen, ubicacion_preferida_id, stock_minimo, idestatus)
             VALUES (:p, :a, :s, :u, 0, 1)"
        );
        $ins->execute([
            ':p' => $productoId,
            ':a' => $almacenId,
            ':s' => $skuAlmacen,
            ':u' => self::ubicacionDefault($almacenId),
        ]);

        return $skuAlmacen;
    }

    /**
     * Aplica un delta de cantidad sobre una ubicacion.
     * Crea la fila de inventario si no existe y el delta es positivo.
     */
    public static function aplicar(int $productoId, int $ubicacionId, int $delta): int
    {
        $db = Database::conectar();

        $stmt = $db->prepare(
            "SELECT id, cantidad FROM inventario
             WHERE producto_id = :p AND ubicacion_id = :u
             FOR UPDATE"
        );
        $stmt->execute([':p' => $productoId, ':u' => $ubicacionId]);
        $fila = $stmt->fetch();

        if ($fila) {
            $nueva = (int) $fila['cantidad'] + $delta;
            if ($nueva < 0) {
                throw new RuntimeException('Stock insuficiente en la ubicacion seleccionada');
            }
            $upd = $db->prepare("UPDATE inventario SET cantidad = :c WHERE id = :id");
            $upd->execute([':c' => $nueva, ':id' => (int) $fila['id']]);
            return $nueva;
        }

        if ($delta < 0) {
            throw new RuntimeException('No hay inventario registrado en la ubicacion seleccionada');
        }

        $ins = $db->prepare(
            "INSERT INTO inventario (producto_id, ubicacion_id, cantidad)
             VALUES (:p, :u, :c)"
        );
        $ins->execute([':p' => $productoId, ':u' => $ubicacionId, ':c' => $delta]);
        return $delta;
    }

    /** Almacen al que pertenece una ubicacion. */
    public static function almacenDeUbicacion(int $ubicacionId): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT almacen_id FROM ubicaciones WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $ubicacionId]);
        $id = $stmt->fetchColumn();
        if ($id === false) {
            throw new RuntimeException('Ubicacion no encontrada');
        }
        return (int) $id;
    }

    /** Stock de un producto por almacen. */
    public static function stockPorAlmacen(int $productoId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT a.id AS almacen_id, a.codigo, a.nombre AS almacen,
                    COALESCE(SUM(i.cantidad), 0) AS stock
             FROM producto_almacen pa
             JOIN almacenes a ON a.id = pa.almacen_id
             LEFT JOIN ubicaciones u ON u.almacen_id = a.id
             LEFT JOIN inventario i ON i.ubicacion_id = u.id AND i.producto_id = pa.producto_id
             WHERE pa.producto_id = :p
             GROUP BY a.id, a.codigo, a.nombre
             ORDER BY a.nombre"
        );
        $stmt->execute([':p' => $productoId]);
        return $stmt->fetchAll();
    }

    /** Detalle de inventario con filtros. */
    public static function listar(array $f = []): array
    {
        $db = Database::conectar();
        $sql = "SELECT i.id, i.producto_id, i.ubicacion_id, i.cantidad, i.lote, i.fecha_vencimiento,
                       p.nombre AS producto, p.sku_base,
                       a.id AS almacen_id, a.codigo AS almacen_codigo, a.nombre AS almacen,
                       u.codigo AS ubicacion_codigo, u.ruta,
                       t.nombre AS tipo_ubicacion
                FROM inventario i
                JOIN productos p ON p.id = i.producto_id
                JOIN ubicaciones u ON u.id = i.ubicacion_id
                JOIN almacenes a ON a.id = u.almacen_id
                JOIN tipos_ubicacion t ON t.id = u.idtipo_ubicacion
                WHERE 1 = 1";
        $params = [];

        if (!empty($f['almacen'])) {
            $sql .= " AND a.id = :alm";
            $params[':alm'] = (int) $f['almacen'];
        }
        if (!empty($f['ubicacion'])) {
            $sql .= " AND u.id = :ubi";
            $params[':ubi'] = (int) $f['ubicacion'];
        }
        if (!empty($f['producto'])) {
            $sql .= " AND p.id = :prod";
            $params[':prod'] = (int) $f['producto'];
        }
        if (!empty($f['q'])) {
            $sql .= " AND (p.nombre LIKE :q1 OR p.sku_base LIKE :q2)";
            $params[':q1'] = '%' . $f['q'] . '%';
            $params[':q2'] = '%' . $f['q'] . '%';
        }
        if (isset($f['solo_con_stock']) && (int) $f['solo_con_stock'] === 1) {
            $sql .= " AND i.cantidad > 0";
        }

        $sql .= " ORDER BY p.nombre ASC, a.nombre ASC, u.ruta ASC LIMIT 500";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Kardex: historial de movimientos con filtros. */
    public static function movimientos(array $f = []): array
    {
        $db = Database::conectar();
        $sql = "SELECT mi.*, p.nombre AS producto, p.sku_base,
                       ao.codigo AS almacen_origen, ad.codigo AS almacen_destino,
                       uo.codigo AS ubicacion_origen, ud.codigo AS ubicacion_destino
                FROM movimientos_inventario mi
                JOIN productos p ON p.id = mi.producto_id
                LEFT JOIN almacenes ao ON ao.id = mi.almacen_origen_id
                LEFT JOIN almacenes ad ON ad.id = mi.almacen_destino_id
                LEFT JOIN ubicaciones uo ON uo.id = mi.ubicacion_origen_id
                LEFT JOIN ubicaciones ud ON ud.id = mi.ubicacion_destino_id
                WHERE 1 = 1";
        $params = [];

        if (!empty($f['producto'])) {
            $sql .= " AND mi.producto_id = :prod";
            $params[':prod'] = (int) $f['producto'];
        }
        if (!empty($f['tipo'])) {
            $sql .= " AND mi.tipo = :tipo";
            $params[':tipo'] = $f['tipo'];
        }
        if (!empty($f['almacen'])) {
            $sql .= " AND (mi.almacen_origen_id = :alm1 OR mi.almacen_destino_id = :alm2)";
            $params[':alm1'] = (int) $f['almacen'];
            $params[':alm2'] = (int) $f['almacen'];
        }
        if (!empty($f['desde'])) {
            $sql .= " AND mi.created_at >= :desde";
            $params[':desde'] = $f['desde'] . ' 00:00:00';
        }
        if (!empty($f['hasta'])) {
            $sql .= " AND mi.created_at <= :hasta";
            $params[':hasta'] = $f['hasta'] . ' 23:59:59';
        }
        if (!empty($f['q'])) {
            $sql .= " AND (p.nombre LIKE :q1 OR p.sku_base LIKE :q2
                        OR mi.referencia LIKE :q3 OR mi.motivo LIKE :q4)";
            $busqueda      = '%' . trim((string) $f['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
            $params[':q3'] = $busqueda;
            $params[':q4'] = $busqueda;
        }

        $limite = isset($f['limite']) ? max(1, min(1000, (int) $f['limite'])) : 300;
        $sql .= " ORDER BY mi.id DESC LIMIT {$limite}";
=======
require_once __DIR__ . '/Producto.php';

/**
 * Inventario multialmacen y kardex.
 *
 * Todo cambio de stock pasa por aqui. Nunca se escribe productos.stock:
 * los triggers de inventario_stock mantienen ese cache.
 */
class Inventario
{
    private const TIPOS_SALIDA  = ['salida', 'venta', 'baja', 'transferencia_salida'];
    private const TIPOS_ENTRADA = ['entrada', 'devolucion', 'inicial', 'transferencia_entrada'];

    /** Lista el inventario detallado con filtros. */
    public static function listar(array $f = []): array
    {
        $db  = Database::conectar();
        $sql = "SELECT * FROM vw_inventario_detalle WHERE 1 = 1";
        $params = [];

        if (empty($f['incluir_inactivos'])) {
            $sql .= " AND idestatus = 1";
        }
        if (!empty($f['producto_id'])) {
            $sql .= " AND producto_id = :producto_id";
            $params[':producto_id'] = (int) $f['producto_id'];
        }
        if (!empty($f['variante_id'])) {
            $sql .= " AND variante_id = :variante_id";
            $params[':variante_id'] = (int) $f['variante_id'];
        }
        if (!empty($f['almacen_id'])) {
            $sql .= " AND almacen_id = :almacen_id";
            $params[':almacen_id'] = (int) $f['almacen_id'];
        }
        if (!empty($f['ubicacion_id'])) {
            $sql .= " AND ubicacion_id = :ubicacion_id";
            $params[':ubicacion_id'] = (int) $f['ubicacion_id'];
        }
        if (!empty($f['sku'])) {
            $sql .= " AND sku = :sku";
            $params[':sku'] = $f['sku'];
        }
        if (!empty($f['q'])) {
            $sql .= " AND (producto LIKE :q1 OR sku LIKE :q2 OR referencia LIKE :q3)";
            $busqueda = '%' . $f['q'] . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
            $params[':q3'] = $busqueda;
        }
        if (!empty($f['bajo_minimo'])) {
            $sql .= " AND stock_disponible < stock_minimo";
        }

        $sql .= " ORDER BY producto ASC, sku ASC, almacen_id ASC, ubicacion_codigo ASC";
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

<<<<<<< HEAD
    /**
     * Registra un movimiento y actualiza el inventario en una sola transaccion.
     * Entrada / compra / devolucion: suman en destino.
     * Salida / venta: restan en origen.
     * Ajuste: fija la cantidad exacta en destino (cantidad = nueva cantidad).
     * Transferencia: resta en origen y suma en destino.
     */
    public static function registrar(array $m): int
    {
        $tipo = (string) ($m['tipo'] ?? '');
        if (!in_array($tipo, self::TIPOS, true)) {
            throw new InvalidArgumentException('Tipo de movimiento invalido');
        }

        $productoId = (int) ($m['producto_id'] ?? 0);
        if ($productoId <= 0) {
            throw new InvalidArgumentException('El producto es obligatorio');
        }
        $cantidad = (int) ($m['cantidad'] ?? 0);
        if ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0');
        }

        $db = Database::conectar();
        $propia = !$db->inTransaction();
        if ($propia) {
            $db->beginTransaction();
        }

        try {
            // Resolver almacenes y ubicaciones.
            $almacenDestino = isset($m['almacen_destino_id']) && $m['almacen_destino_id'] !== ''
                ? (int) $m['almacen_destino_id'] : null;
            $almacenOrigen = isset($m['almacen_origen_id']) && $m['almacen_origen_id'] !== ''
                ? (int) $m['almacen_origen_id'] : null;
            $ubicacionDestino = isset($m['ubicacion_destino_id']) && $m['ubicacion_destino_id'] !== ''
                ? (int) $m['ubicacion_destino_id'] : null;
            $ubicacionOrigen = isset($m['ubicacion_origen_id']) && $m['ubicacion_origen_id'] !== ''
                ? (int) $m['ubicacion_origen_id'] : null;

            if ($ubicacionDestino !== null) {
                $almacenDestino = self::almacenDeUbicacion($ubicacionDestino);
            }
            if ($ubicacionOrigen !== null) {
                $almacenOrigen = self::almacenDeUbicacion($ubicacionOrigen);
            }

            if (in_array($tipo, ['entrada', 'compra', 'devolucion', 'ajuste'], true)) {
                if ($almacenDestino === null) {
                    throw new InvalidArgumentException('Debes indicar el almacen de destino');
                }
                if ($ubicacionDestino === null) {
                    $ubicacionDestino = self::ubicacionDefault($almacenDestino);
                }
                if ($ubicacionDestino === null) {
                    throw new RuntimeException('El almacen de destino no tiene ubicaciones');
                }
                self::asegurarProductoAlmacen($productoId, $almacenDestino);
            }

            if (in_array($tipo, ['salida', 'venta', 'transferencia'], true)) {
                if ($almacenOrigen === null) {
                    throw new InvalidArgumentException('Debes indicar el almacen de origen');
                }
                if ($ubicacionOrigen === null) {
                    $ubicacionOrigen = self::ubicacionDefault($almacenOrigen);
                }
                if ($ubicacionOrigen === null) {
                    throw new RuntimeException('El almacen de origen no tiene ubicaciones');
                }
            }

            if ($tipo === 'transferencia') {
                if ($almacenDestino === null) {
                    throw new InvalidArgumentException('Debes indicar el almacen de destino');
                }
                if ($ubicacionDestino === null) {
                    $ubicacionDestino = self::ubicacionDefault($almacenDestino);
                }
                if ($ubicacionDestino === null) {
                    throw new RuntimeException('El almacen de destino no tiene ubicaciones');
                }
                self::asegurarProductoAlmacen($productoId, $almacenDestino);
            }

            $deltaRegistrado = $cantidad;

            switch ($tipo) {
                case 'entrada':
                case 'compra':
                case 'devolucion':
                    self::aplicar($productoId, (int) $ubicacionDestino, $cantidad);
                    break;
                case 'salida':
                case 'venta':
                    self::aplicar($productoId, (int) $ubicacionOrigen, -$cantidad);
                    break;
                case 'ajuste':
                    $stmt = $db->prepare(
                        "SELECT cantidad FROM inventario WHERE producto_id = :p AND ubicacion_id = :u FOR UPDATE"
                    );
                    $stmt->execute([':p' => $productoId, ':u' => (int) $ubicacionDestino]);
                    $actual = $stmt->fetchColumn();
                    $actual = $actual === false ? 0 : (int) $actual;
                    $deltaRegistrado = $cantidad - $actual;
                    self::aplicar($productoId, (int) $ubicacionDestino, $deltaRegistrado);
                    break;
                case 'transferencia':
                    self::aplicar($productoId, (int) $ubicacionOrigen, -$cantidad);
                    self::aplicar($productoId, (int) $ubicacionDestino, $cantidad);
                    break;
                case 'migracion':
                    if ($ubicacionDestino === null) {
                        throw new InvalidArgumentException('Debes indicar la ubicacion de destino');
                    }
                    self::aplicar($productoId, (int) $ubicacionDestino, $cantidad);
                    break;
            }

            $stmt = $db->prepare(
                "INSERT INTO movimientos_inventario
                    (tipo, producto_id, almacen_origen_id, almacen_destino_id,
                     ubicacion_origen_id, ubicacion_destino_id, cantidad,
                     costo_unitario, referencia, motivo, usuario_id)
                 VALUES
                    (:tipo, :prod, :ao, :ad, :uo, :ud, :cant,
                     :costo, :ref, :motivo, :usuario)"
            );
            $stmt->execute([
                ':tipo'    => $tipo,
                ':prod'    => $productoId,
                ':ao'      => $almacenOrigen,
                ':ad'      => $almacenDestino,
                ':uo'      => $ubicacionOrigen,
                ':ud'      => $ubicacionDestino,
                ':cant'    => abs($deltaRegistrado) > 0 ? abs($deltaRegistrado) : $cantidad,
                ':costo'   => isset($m['costo_unitario']) && $m['costo_unitario'] !== '' ? (float) $m['costo_unitario'] : null,
                ':ref'     => $m['referencia'] ?? null,
                ':motivo'  => $m['motivo'] ?? null,
                ':usuario' => !empty($m['usuario_id']) ? (int) $m['usuario_id'] : null,
            ]);
            $movId = (int) $db->lastInsertId();

            if ($propia) {
                $db->commit();
            }
            return $movId;
        } catch (Throwable $e) {
            if ($propia && $db->inTransaction()) {
=======
    /** Kardex de movimientos con filtros y paginacion. */
    public static function kardex(array $f = []): array
    {
        $db  = Database::conectar();
        $sql = "SELECT * FROM vw_kardex WHERE 1 = 1";
        $params = [];

        if (!empty($f['producto_id'])) {
            $sql .= " AND producto_id = :producto_id";
            $params[':producto_id'] = (int) $f['producto_id'];
        }
        if (!empty($f['variante_id'])) {
            // vw_kardex no expone variante_id; se resuelve por SKU.
            $stmt = $db->prepare("SELECT sku FROM producto_variantes WHERE id = :id");
            $stmt->execute([':id' => (int) $f['variante_id']]);
            $sku = $stmt->fetchColumn();
            if ($sku === false) {
                return [];
            }
            $sql .= " AND sku = :sku";
            $params[':sku'] = $sku;
        }
        if (!empty($f['almacen_id'])) {
            $sql .= " AND almacen = (SELECT nombre FROM almacenes WHERE id = :almacen_id)";
            $params[':almacen_id'] = (int) $f['almacen_id'];
        }
        if (!empty($f['tipo'])) {
            $sql .= " AND tipo = :tipo";
            $params[':tipo'] = $f['tipo'];
        }
        if (!empty($f['desde'])) {
            $sql .= " AND created_at >= :desde";
            $params[':desde'] = $f['desde'] . ' 00:00:00';
        }
        if (!empty($f['hasta'])) {
            $sql .= " AND created_at <= :hasta";
            $params[':hasta'] = $f['hasta'] . ' 23:59:59';
        }

        $limite  = max(1, min(500, (int) ($f['limite'] ?? 100)));
        $offset  = max(0, (int) ($f['offset'] ?? 0));

        $sql .= " ORDER BY movimiento_id DESC LIMIT {$limite} OFFSET {$offset}";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Resumen global del inventario. */
    public static function resumen(): array
    {
        $db = Database::conectar();

        $general = $db->query(
            "SELECT
                COUNT(*)                                              AS ubicaciones_con_stock,
                COUNT(DISTINCT variante_id)                           AS variantes_con_stock,
                COUNT(DISTINCT producto_id)                           AS productos_con_stock,
                COALESCE(SUM(stock_actual), 0)                        AS unidades_fisicas,
                COALESCE(SUM(stock_reservado), 0)                     AS unidades_reservadas,
                COALESCE(SUM(stock_disponible), 0)                    AS unidades_disponibles,
                COALESCE(SUM(stock_disponible * costo), 0)            AS valor_costo,
                COALESCE(SUM(stock_disponible * precio), 0)           AS valor_venta,
                SUM(CASE WHEN stock_disponible < stock_minimo THEN 1 ELSE 0 END) AS ubicaciones_bajo_minimo,
                SUM(CASE WHEN stock_disponible = 0 THEN 1 ELSE 0 END)           AS ubicaciones_agotadas
             FROM vw_inventario_detalle
             WHERE idestatus = 1"
        )->fetch();

        $porAlmacen = $db->query(
            "SELECT almacen_id, almacen_codigo, almacen,
                    COUNT(DISTINCT producto_id)  AS productos,
                    COUNT(DISTINCT variante_id)  AS variantes,
                    COALESCE(SUM(stock_disponible), 0) AS unidades,
                    COALESCE(SUM(stock_disponible * costo), 0) AS valor_costo
             FROM vw_inventario_detalle
             WHERE idestatus = 1
             GROUP BY almacen_id, almacen_codigo, almacen
             ORDER BY almacen_id ASC"
        )->fetchAll();

        return [
            'general'     => $general,
            'por_almacen' => $porAlmacen,
        ];
    }

    /** Stock disponible de una variante, sumando todas sus ubicaciones. */
    public static function stockVariante(int $varianteId): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare(
            "SELECT COALESCE(SUM(stock_actual - stock_reservado), 0)
             FROM inventario_stock
             WHERE variante_id = :variante_id AND idestatus = 1"
        );
        $stmt->execute([':variante_id' => $varianteId]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Registra una entrada, salida, ajuste, devolucion o baja manual.
     * Si la ubicacion no existe para esa variante, la crea (solo entradas).
     */
    public static function registrarMovimiento(array $d): int
    {
        $varianteId = (int) ($d['variante_id'] ?? 0);
        $ubicacionId = (int) ($d['ubicacion_id'] ?? 0);
        $tipo       = (string) ($d['tipo'] ?? '');
        $cantidad   = (int) ($d['cantidad'] ?? 0);

        $permitidos = ['entrada', 'salida', 'ajuste', 'devolucion', 'baja'];
        if (!in_array($tipo, $permitidos, true)) {
            throw new InvalidArgumentException(
                'Tipo de movimiento invalido. Use: ' . implode(', ', $permitidos)
            );
        }
        if ($varianteId <= 0 || $ubicacionId <= 0) {
            throw new InvalidArgumentException('variante_id y ubicacion_id son obligatorios.');
        }
        if ($tipo === 'ajuste') {
            if ($cantidad === 0) {
                throw new InvalidArgumentException('El ajuste no puede ser cero.');
            }
        } elseif ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        $db = Database::conectar();

        $variante = $db->prepare(
            "SELECT v.id, v.producto_id, v.sku, p.costo, p.nombre
             FROM producto_variantes v
             INNER JOIN productos p ON p.id = v.producto_id
             WHERE v.id = :id LIMIT 1"
        );
        $variante->execute([':id' => $varianteId]);
        $datosVariante = $variante->fetch();

        if (!$datosVariante) {
            throw new RuntimeException("La variante #{$varianteId} no existe.");
        }

        $db->beginTransaction();

        try {
            $fila = self::bloquearFila($db, $varianteId, $ubicacionId);

            if (!$fila) {
                if (!in_array($tipo, self::TIPOS_ENTRADA, true)) {
                    throw new RuntimeException('No existe inventario de esa variante en la ubicacion indicada.');
                }
                [$almacenId, $ubicacionReal] = Producto::resolverUbicacion($db, null, $ubicacionId);
                $db->prepare(
                    "INSERT INTO inventario_stock
                     (variante_id, almacen_id, ubicacion_id,
                      stock_actual, stock_reservado, stock_minimo,
                      inventario_inicial, fecha_inventario_inicial, idestatus)
                     VALUES (:variante_id, :almacen_id, :ubicacion_id, 0, 0, 5, 0, NOW(), 1)"
                )->execute([
                    ':variante_id'  => $varianteId,
                    ':almacen_id'   => $almacenId,
                    ':ubicacion_id' => $ubicacionReal,
                ]);
                $fila = self::bloquearFila($db, $varianteId, $ubicacionReal);
            }

            $anterior = (int) $fila['stock_actual'];
            $reservado = (int) $fila['stock_reservado'];

            if ($tipo === 'ajuste') {
                $nuevo = $anterior + $cantidad;
                $delta = $cantidad;
            } elseif (in_array($tipo, self::TIPOS_ENTRADA, true)) {
                $nuevo = $anterior + $cantidad;
                $delta = $cantidad;
            } else {
                $disponible = $anterior - $reservado;
                if ($disponible < $cantidad) {
                    throw new RuntimeException(
                        "Stock insuficiente. Disponible en la ubicacion: {$disponible}."
                    );
                }
                $nuevo = $anterior - $cantidad;
                $delta = -$cantidad;
            }

            if ($nuevo < 0) {
                throw new RuntimeException('El movimiento dejaria el stock en negativo.');
            }
            if ($nuevo < $reservado) {
                throw new RuntimeException('El movimiento dejaria el stock por debajo de lo reservado.');
            }

            $campoFecha = $delta >= 0 ? 'ultima_entrada' : 'ultima_salida';
            $db->prepare(
                "UPDATE inventario_stock
                 SET stock_actual = :nuevo, {$campoFecha} = NOW()
                 WHERE id = :id"
            )->execute([':nuevo' => $nuevo, ':id' => $fila['id']]);

            Producto::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => (int) $fila['almacen_id'],
                'ubicacion_id'   => (int) $fila['ubicacion_id'],
                'tipo'           => $tipo,
                'cantidad'       => $tipo === 'ajuste' ? $delta : $cantidad,
                'stock_anterior' => $anterior,
                'stock_nuevo'    => $nuevo,
                'costo_unitario' => isset($d['costo_unitario'])
                    ? round((float) $d['costo_unitario'], 2)
                    : (float) $datosVariante['costo'],
                'motivo'         => $d['motivo'] ?? null,
                'referencia_tipo'=> $d['referencia_tipo'] ?? 'movimiento_manual',
                'referencia_id'  => $d['referencia_id'] ?? null,
                'usuario_id'     => $d['usuario_id'] ?? null,
            ]);

            $db->commit();
            return (int) $fila['id'];
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
                $db->rollBack();
            }
            throw $e;
        }
    }
<<<<<<< HEAD
=======

    /**
     * Transfiere stock entre ubicaciones (puede ser entre almacenes).
     * Crea la fila destino con inventario_inicial = 0 si no existe.
     */
    public static function transferir(array $d): void
    {
        $varianteId = (int) ($d['variante_id'] ?? 0);
        $origenId   = (int) ($d['origen_inventario_id'] ?? 0);
        $destinoUbi = (int) ($d['destino_ubicacion_id'] ?? 0);
        $cantidad   = (int) ($d['cantidad'] ?? 0);

        if ($varianteId <= 0 || $origenId <= 0 || $destinoUbi <= 0) {
            throw new InvalidArgumentException(
                'variante_id, origen_inventario_id y destino_ubicacion_id son obligatorios.'
            );
        }
        if ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $stmtOrigen = $db->prepare(
                "SELECT * FROM inventario_stock
                 WHERE id = :id AND variante_id = :variante_id
                 FOR UPDATE"
            );
            $stmtOrigen->execute([':id' => $origenId, ':variante_id' => $varianteId]);
            $origen = $stmtOrigen->fetch();

            if (!$origen) {
                throw new RuntimeException('La ubicacion de origen no existe para esa variante.');
            }

            $disponible = (int) $origen['stock_actual'] - (int) $origen['stock_reservado'];
            if ($disponible < $cantidad) {
                throw new RuntimeException("Stock insuficiente en origen. Disponible: {$disponible}.");
            }
            if ((int) $origen['ubicacion_id'] === $destinoUbi) {
                throw new RuntimeException('El origen y el destino son la misma ubicacion.');
            }

            $destino = self::bloquearFila($db, $varianteId, $destinoUbi);
            $destinoNuevo = false;

            if (!$destino) {
                [$almacenDestino, $ubiDestino] = Producto::resolverUbicacion($db, null, $destinoUbi);
                $db->prepare(
                    "INSERT INTO inventario_stock
                     (variante_id, almacen_id, ubicacion_id,
                      stock_actual, stock_reservado, stock_minimo,
                      inventario_inicial, fecha_inventario_inicial, idestatus)
                     VALUES (:variante_id, :almacen_id, :ubicacion_id, 0, 0, 5, 0, NOW(), 1)"
                )->execute([
                    ':variante_id'  => $varianteId,
                    ':almacen_id'   => $almacenDestino,
                    ':ubicacion_id' => $ubiDestino,
                ]);
                $destino = self::bloquearFila($db, $varianteId, $ubiDestino);
                $destinoNuevo = true;
            }

            $origenAnterior  = (int) $origen['stock_actual'];
            $destinoAnterior = (int) $destino['stock_actual'];
            $origenNuevo     = $origenAnterior - $cantidad;
            $destinoNuevoQty = $destinoAnterior + $cantidad;

            $db->prepare(
                "UPDATE inventario_stock
                 SET stock_actual = :nuevo, ultima_salida = NOW()
                 WHERE id = :id"
            )->execute([':nuevo' => $origenNuevo, ':id' => $origen['id']]);

            $db->prepare(
                "UPDATE inventario_stock
                 SET stock_actual = :nuevo, ultima_entrada = NOW()
                 WHERE id = :id"
            )->execute([':nuevo' => $destinoNuevoQty, ':id' => $destino['id']]);

            $motivo = $d['motivo'] ?? 'Transferencia entre ubicaciones';

            Producto::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => (int) $origen['almacen_id'],
                'ubicacion_id'   => (int) $origen['ubicacion_id'],
                'tipo'           => 'transferencia_salida',
                'cantidad'       => $cantidad,
                'stock_anterior' => $origenAnterior,
                'stock_nuevo'    => $origenNuevo,
                'motivo'         => $motivo,
                'referencia_tipo'=> 'transferencia',
                'referencia_id'  => $destinoNuevo ? null : (int) $destino['id'],
                'usuario_id'     => $d['usuario_id'] ?? null,
            ]);

            Producto::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => (int) $destino['almacen_id'],
                'ubicacion_id'   => (int) $destino['ubicacion_id'],
                'tipo'           => 'transferencia_entrada',
                'cantidad'       => $cantidad,
                'stock_anterior' => $destinoAnterior,
                'stock_nuevo'    => $destinoNuevoQty,
                'motivo'         => $motivo,
                'referencia_tipo'=> 'transferencia',
                'referencia_id'  => (int) $origen['id'],
                'usuario_id'     => $d['usuario_id'] ?? null,
            ]);

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Productos con clasificacion de talla/color/modelo pendiente. */
    public static function clasificacionPendiente(): array
    {
        $db = Database::conectar();
        return $db->query(
            "SELECT * FROM vw_clasificacion_pendiente
             ORDER BY producto_id ASC"
        )->fetchAll();
    }

    /** Bloquea (FOR UPDATE) la fila de inventario de una variante/ubicacion. */
    private static function bloquearFila(PDO $db, int $varianteId, int $ubicacionId): ?array
    {
        $stmt = $db->prepare(
            "SELECT * FROM inventario_stock
             WHERE variante_id = :variante_id AND ubicacion_id = :ubicacion_id
             FOR UPDATE"
        );
        $stmt->execute([
            ':variante_id'  => $varianteId,
            ':ubicacion_id' => $ubicacionId,
        ]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
}
