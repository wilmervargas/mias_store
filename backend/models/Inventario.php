<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
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

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

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
                $db->rollBack();
            }
            throw $e;
        }
    }

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
}
