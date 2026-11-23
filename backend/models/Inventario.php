<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

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

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

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
                $db->rollBack();
            }
            throw $e;
        }
    }
}
