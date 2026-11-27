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
    public const TIPOS = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion', 'venta', 'compra', 'migracion', 'merma'];

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

    /** Stock de un producto por almacen, con los datos del vinculo producto_almacen. */
    public static function stockPorAlmacen(int $productoId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT a.id AS almacen_id, a.codigo, a.nombre AS almacen,
                    pa.id AS producto_almacen_id, pa.sku_almacen,
                    pa.stock_minimo, pa.stock_maximo,
                    pa.idestatus AS vinculo_estatus,
                    pa.ubicacion_preferida_id,
                    COALESCE(SUM(i.cantidad), 0) AS stock
             FROM producto_almacen pa
             JOIN almacenes a ON a.id = pa.almacen_id
             LEFT JOIN ubicaciones u ON u.almacen_id = a.id
             LEFT JOIN inventario i ON i.ubicacion_id = u.id AND i.producto_id = pa.producto_id
             WHERE pa.producto_id = :p
             GROUP BY a.id, a.codigo, a.nombre, pa.id, pa.sku_almacen,
                      pa.stock_minimo, pa.stock_maximo, pa.idestatus, pa.ubicacion_preferida_id
             ORDER BY a.nombre"
        );
        $stmt->execute([':p' => $productoId]);
        return $stmt->fetchAll();
    }

    /**
     * Fija el stock total de un producto dentro de un almacen.
     * Si la ubicacion indicada no alcanza para descontar, distribuye la salida
     * entre las demas ubicaciones del mismo almacen. Deja un movimiento auditado.
     */
    public static function fijarStockAlmacen(
        int $productoId,
        int $almacenId,
        ?int $ubicacionId,
        int $deseado,
        array $meta = []
    ): void {
        if ($deseado < 0) {
            throw new InvalidArgumentException('El stock no puede ser negativo');
        }

        $db = Database::conectar();
        $propia = !$db->inTransaction();
        if ($propia) {
            $db->beginTransaction();
        }

        try {
            if ($ubicacionId !== null && $ubicacionId > 0) {
                if (self::almacenDeUbicacion($ubicacionId) !== $almacenId) {
                    throw new RuntimeException('La ubicacion seleccionada no pertenece al almacen indicado');
                }
            } else {
                $ubicacionId = self::ubicacionDefault($almacenId);
                if ($ubicacionId === null) {
                    throw new RuntimeException('El almacen seleccionado no tiene ubicaciones');
                }
            }

            $stmt = $db->prepare(
                "SELECT i.id, i.ubicacion_id, i.cantidad
                 FROM inventario i
                 JOIN ubicaciones u ON u.id = i.ubicacion_id
                 WHERE i.producto_id = :p AND u.almacen_id = :a
                 ORDER BY (i.ubicacion_id = :target) DESC, i.id ASC
                 FOR UPDATE"
            );
            $stmt->execute([':p' => $productoId, ':a' => $almacenId, ':target' => $ubicacionId]);
            $filas = $stmt->fetchAll();

            $total = 0;
            foreach ($filas as $fila) {
                $total += (int) $fila['cantidad'];
            }

            $delta = $deseado - $total;
            if ($delta === 0) {
                if ($propia) $db->commit();
                return;
            }

            if ($delta > 0) {
                self::aplicar($productoId, $ubicacionId, $delta);
            } else {
                $restante = -$delta;
                foreach ($filas as $fila) {
                    if ($restante <= 0) break;
                    $disponible = (int) $fila['cantidad'];
                    if ($disponible <= 0) continue;
                    $quitar = min($disponible, $restante);
                    self::aplicar($productoId, (int) $fila['ubicacion_id'], -$quitar);
                    $restante -= $quitar;
                }
                if ($restante > 0) {
                    throw new RuntimeException('No hay inventario suficiente en el almacen para fijar esa cantidad');
                }
            }

            $stmt = $db->prepare(
                "INSERT INTO movimientos_inventario
                    (tipo, producto_id, almacen_destino_id, ubicacion_destino_id,
                     cantidad, costo_unitario, referencia, motivo, usuario_id)
                 VALUES
                    ('ajuste', :p, :a, :u, :cant, :costo, :ref, :motivo, :usuario)"
            );
            $stmt->execute([
                ':p'       => $productoId,
                ':a'       => $almacenId,
                ':u'       => $ubicacionId,
                ':cant'    => abs($delta),
                ':costo'   => isset($meta['costo_unitario']) && $meta['costo_unitario'] !== ''
                    ? (float) $meta['costo_unitario'] : null,
                ':ref'     => $meta['referencia'] ?? 'Ajuste desde listado',
                ':motivo'  => $meta['motivo'] ?? 'Edicion de presentacion por almacen',
                ':usuario' => !empty($meta['usuario_id']) ? (int) $meta['usuario_id'] : null,
            ]);

            if ($propia) {
                $db->commit();
            }
        } catch (Throwable $e) {
            if ($propia && $db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Detalle de inventario con filtros. */
    public static function listar(array $f = []): array
    {
        $db = Database::conectar();
        $sql = "SELECT i.id, i.producto_id, i.ubicacion_id, i.cantidad, i.lote, i.fecha_vencimiento,
                       p.nombre AS producto, p.sku_base, p.codigo_producto, p.descripcion,
                       p.stock AS stock_total, p.costo, p.precio,
                       c.nombre AS categoria, ma.nombre AS marca, um.abreviatura AS unidad,
                       a.id AS almacen_id, a.codigo AS almacen_codigo, a.nombre AS almacen,
                       u.codigo AS ubicacion_codigo, u.ruta,
                       t.nombre AS tipo_ubicacion
                FROM inventario i
                JOIN productos p ON p.id = i.producto_id
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas ma ON ma.id = p.idmarca
                LEFT JOIN unidades um ON um.id = p.idunidad
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
        $sql = "SELECT mi.*, p.nombre AS producto, p.sku_base, p.codigo_producto, p.descripcion,
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

            if (in_array($tipo, ['salida', 'venta', 'transferencia', 'migracion', 'merma'], true)) {
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
                    throw new InvalidArgumentException('Debes indicar el almacén de destino');
                }
                if ($ubicacionDestino === null) {
                    $ubicacionDestino = self::ubicacionDefault($almacenDestino);
                }
                if ($ubicacionDestino === null) {
                    throw new RuntimeException('El almacén de destino no tiene ubicaciones');
                }
                if ($ubicacionOrigen === $ubicacionDestino) {
                    throw new InvalidArgumentException('La ubicación de origen y destino no pueden ser la misma.');
                }
                $stmtUb = $db->prepare("SELECT 1 FROM ubicaciones WHERE id = :u AND almacen_id = :a LIMIT 1");
                $stmtUb->execute([':u' => $ubicacionDestino, ':a' => $almacenDestino]);
                if (!$stmtUb->fetchColumn()) {
                    throw new InvalidArgumentException('La ubicación destino no pertenece al almacén destino.');
                }
                // Verificar que el almacén destino esté registrado para este producto
                $stmtPa = $db->prepare("SELECT 1 FROM producto_almacen WHERE producto_id = :p AND almacen_id = :a LIMIT 1");
                $stmtPa->execute([':p' => $productoId, ':a' => $almacenDestino]);
                $registrado = (bool) $stmtPa->fetchColumn();
                if (!$registrado) {
                    $stmtInv = $db->prepare("SELECT 1 FROM inventario i JOIN ubicaciones u ON u.id = i.ubicacion_id WHERE i.producto_id = :p AND u.almacen_id = :a LIMIT 1");
                    $stmtInv->execute([':p' => $productoId, ':a' => $almacenDestino]);
                    $registrado = (bool) $stmtInv->fetchColumn();
                }
                if (!$registrado) {
                    throw new InvalidArgumentException('El almacén destino no está registrado para este producto.');
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
                case 'merma':
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
                    self::aplicar($productoId, (int) $ubicacionOrigen, -$cantidad);
                    self::aplicar($productoId, (int) $ubicacionDestino, $cantidad);
                    break;
            }

            $stmt = $db->prepare(
                "INSERT INTO movimientos_inventario
                    (tipo, producto_id, almacen_origen_id, almacen_destino_id,
                     ubicacion_origen_id, ubicacion_destino_id, cantidad,
                     costo_unitario, referencia, motivo, concepto, usuario_id)
                 VALUES
                    (:tipo, :prod, :ao, :ad, :uo, :ud, :cant,
                     :costo, :ref, :motivo, :concepto, :usuario)"
            );
            $stmt->execute([
                ':tipo'     => $tipo,
                ':prod'     => $productoId,
                ':ao'       => $almacenOrigen,
                ':ad'       => $almacenDestino,
                ':uo'       => $ubicacionOrigen,
                ':ud'       => $ubicacionDestino,
                ':cant'     => abs($deltaRegistrado) > 0 ? abs($deltaRegistrado) : $cantidad,
                ':costo'    => isset($m['costo_unitario']) && $m['costo_unitario'] !== '' ? (float) $m['costo_unitario'] : null,
                ':ref'      => $m['referencia'] ?? null,
                ':motivo'   => $m['motivo'] ?? null,
                ':concepto' => !empty($m['concepto']) ? trim((string) $m['concepto']) : null,
                ':usuario'  => !empty($m['usuario_id']) ? (int) $m['usuario_id'] : null,
            ]);
            $movId = (int) $db->lastInsertId();

            // Mantener productos.stock sincronizado con inventario
            $sync = $db->prepare(
                "UPDATE productos p SET p.stock = (
                    SELECT COALESCE(SUM(i.cantidad), 0) FROM inventario i WHERE i.producto_id = p.id
                 ) WHERE p.id = :id"
            );
            $sync->execute([':id' => $productoId]);

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

    /** Obtiene un registro de inventario por ID. */
    public static function obtener(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT i.id, i.producto_id, i.ubicacion_id, i.cantidad, i.lote, i.fecha_vencimiento,
                    u.almacen_id
             FROM inventario i
             JOIN ubicaciones u ON u.id = i.ubicacion_id
             WHERE i.id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    /** Actualiza un registro de inventario completo. */
    public static function actualizar(int $id, array $datos): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            throw new RuntimeException("Registro de inventario #{$id} no encontrado");
        }

        $productoId = isset($datos['producto_id']) ? (int) $datos['producto_id'] : (int) $actual['producto_id'];
        $ubicacionId = isset($datos['ubicacion_id']) ? (int) $datos['ubicacion_id'] : (int) $actual['ubicacion_id'];
        $cantidad = isset($datos['cantidad']) ? (int) $datos['cantidad'] : (int) $actual['cantidad'];
        $lote = array_key_exists('lote', $datos) ? trim((string) $datos['lote']) : ($actual['lote'] ?? null);
        $fechaVenc = array_key_exists('fecha_vencimiento', $datos) ? trim((string) $datos['fecha_vencimiento']) : ($actual['fecha_vencimiento'] ?? null);

        if ($productoId <= 0) throw new InvalidArgumentException('El producto es obligatorio');
        if ($ubicacionId <= 0) throw new InvalidArgumentException('La ubicación es obligatoria');
        if ($cantidad < 0) throw new InvalidArgumentException('La cantidad no puede ser negativa');

        $db = Database::conectar();
        $stmt = $db->prepare("SELECT 1 FROM productos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $productoId]);
        if (!$stmt->fetchColumn()) throw new InvalidArgumentException('El producto indicado no existe');

        $almacenId = self::almacenDeUbicacion($ubicacionId);
        self::asegurarProductoAlmacen($productoId, $almacenId);

        // Evitar duplicado producto+ubicacion en otro registro
        $dup = $db->prepare(
            "SELECT id FROM inventario WHERE producto_id = :p AND ubicacion_id = :u AND id <> :id LIMIT 1"
        );
        $dup->execute([':p' => $productoId, ':u' => $ubicacionId, ':id' => $id]);
        if ($dup->fetchColumn()) {
            throw new RuntimeException('Ya existe un registro de inventario para ese producto en la ubicación seleccionada');
        }

        $stmt = $db->prepare(
            "UPDATE inventario
             SET producto_id = :p, ubicacion_id = :u, cantidad = :c, lote = :lote, fecha_vencimiento = :fv
             WHERE id = :id"
        );
        return $stmt->execute([
            ':p' => $productoId,
            ':u' => $ubicacionId,
            ':c' => $cantidad,
            ':lote' => ($lote === '' ? null : $lote),
            ':fv' => ($fechaVenc === '' ? null : $fechaVenc),
            ':id' => $id,
        ]);
    }

    /** Elimina un registro de inventario. */
    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare("DELETE FROM inventario WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException("Registro de inventario #{$id} no encontrado");
        }
        return true;
    }
}
