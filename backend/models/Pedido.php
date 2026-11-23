<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/Producto.php';
require_once __DIR__ . '/Carrito.php';

/**
 * Pedidos con descuento de inventario real.
 *
 * El pedido y el descuento de stock ocurren en una sola transaccion.
 * Cada descuento genera un movimiento de kardex tipo 'venta'.
 */
class Pedido
{
    /**
     * Crea un pedido completo de forma atomica.
     *
     * @param array $datos Cabecera: cliente_id, direccion_envio, metodo_pago,
     *                     numero_referencia, tasa_dolar_usada
     * @param array $items [['variante_id'=>1,'producto_id'=>1,'cantidad'=>2], ...]
     * @return int ID del pedido generado
     */
    public static function crear(array $datos, array $items): int
    {
        if (empty($items)) {
            throw new InvalidArgumentException('El pedido no contiene ningun producto.');
        }

        $db = Database::conectar();

        try {
            $db->beginTransaction();

            // 1. Normalizar items: resolver variante, validar producto y precios.
            $normalizados = [];
            $variantesUsadas = [];

            foreach ($items as $item) {
                $productoId = (int) ($item['producto_id'] ?? 0);
                $cantidad   = (int) ($item['cantidad'] ?? 0);

                if ($productoId <= 0 || $cantidad <= 0) {
                    throw new RuntimeException('Cada item debe tener producto_id y cantidad validos.');
                }

                $stmtCheck = $db->prepare(
                    "SELECT id, nombre, precio, costo, idestatus
                     FROM productos
                     WHERE id = :id
                     FOR UPDATE"
                );
                $stmtCheck->execute([':id' => $productoId]);
                $productoBD = $stmtCheck->fetch();

                if (!$productoBD || (int) $productoBD['idestatus'] !== 1) {
                    throw new RuntimeException(
                        "El producto ID #{$productoId} no existe o esta inactivo."
                    );
                }

                $varianteId = Carrito::resolverVariante(
                    $db,
                    $productoId,
                    isset($item['variante_id']) && $item['variante_id'] !== null
                        ? (int) $item['variante_id']
                        : null
                );

                $normalizados[] = [
                    'producto_id'     => $productoId,
                    'variante_id'     => $varianteId,
                    'cantidad'        => $cantidad,
                    'precio_unitario' => round((float) $productoBD['precio'], 2),
                    'costo_unitario'  => round((float) $productoBD['costo'], 2),
                    'nombre'          => $productoBD['nombre'],
                ];

                $variantesUsadas[$varianteId] = true;
            }

            // 2. Bloquear inventario de todas las variantes, en orden estable.
            $variantes = array_keys($variantesUsadas);
            sort($variantes);

            $inventario = [];   // variante_id => filas
            foreach ($variantes as $varianteId) {
                $stmtInv = $db->prepare(
                    "SELECT id, variante_id, almacen_id, ubicacion_id,
                            stock_actual, stock_reservado
                     FROM inventario_stock
                     WHERE variante_id = :variante_id AND idestatus = 1
                     ORDER BY id ASC
                     FOR UPDATE"
                );
                $stmtInv->execute([':variante_id' => $varianteId]);
                $inventario[$varianteId] = $stmtInv->fetchAll();
            }

            // 3. Validar disponibilidad total por variante.
            $requerido = [];
            foreach ($normalizados as $item) {
                $varianteId = $item['variante_id'];
                $requerido[$varianteId] = ($requerido[$varianteId] ?? 0) + $item['cantidad'];
            }

            foreach ($requerido as $varianteId => $cantidadRequerida) {
                $disponible = 0;
                foreach ($inventario[$varianteId] as $fila) {
                    $disponible += (int) $fila['stock_actual'] - (int) $fila['stock_reservado'];
                }

                if ($disponible < $cantidadRequerida) {
                    throw new RuntimeException(
                        "Stock insuficiente para la variante #{$varianteId}. "
                        . "Disponibles: {$disponible}, Solicitados: {$cantidadRequerida}."
                    );
                }
            }

            // 4. Crear la cabecera del pedido.
            $totalCalculado = 0;
            foreach ($normalizados as $item) {
                $totalCalculado += $item['precio_unitario'] * $item['cantidad'];
            }

            $stmtPedido = $db->prepare(
                "INSERT INTO pedidos
                 (cliente_id, total, estado, direccion_envio, metodo_pago,
                  numero_referencia, tasa_dolar_usada)
                 VALUES
                 (:cliente_id, :total, 'pagado', :direccion_envio, :metodo_pago,
                  :numero_referencia, :tasa_dolar_usada)"
            );
            $stmtPedido->execute([
                ':cliente_id'        => $datos['cliente_id'],
                ':total'             => round($totalCalculado, 2),
                ':direccion_envio'   => $datos['direccion_envio'],
                ':metodo_pago'       => $datos['metodo_pago'],
                ':numero_referencia' => $datos['numero_referencia'],
                ':tasa_dolar_usada'  => $datos['tasa_dolar_usada'],
            ]);

            $pedidoId = (int) $db->lastInsertId();

            // 5. Detallar el pedido.
            $stmtItem = $db->prepare(
                "INSERT INTO items_pedido
                 (pedido_id, producto_id, variante_id, cantidad,
                  precio_unitario, costo_unitario)
                 VALUES
                 (:pedido_id, :producto_id, :variante_id, :cantidad,
                  :precio_unitario, :costo_unitario)"
            );

            foreach ($normalizados as $item) {
                $stmtItem->execute([
                    ':pedido_id'       => $pedidoId,
                    ':producto_id'     => $item['producto_id'],
                    ':variante_id'     => $item['variante_id'],
                    ':cantidad'        => $item['cantidad'],
                    ':precio_unitario' => $item['precio_unitario'],
                    ':costo_unitario'  => $item['costo_unitario'],
                ]);
            }

            // 6. Descontar inventario y registrar kardex.
            foreach ($requerido as $varianteId => $cantidadRequerida) {
                $restante = $cantidadRequerida;

                foreach ($inventario[$varianteId] as $fila) {
                    if ($restante <= 0) {
                        break;
                    }

                    $anterior   = (int) $fila['stock_actual'];
                    $reservado  = (int) $fila['stock_reservado'];
                    $disponible = $anterior - $reservado;

                    if ($disponible <= 0) {
                        continue;
                    }

                    $mover    = min($disponible, $restante);
                    $nuevo    = $anterior - $mover;
                    $restante -= $mover;

                    $db->prepare(
                        "UPDATE inventario_stock
                         SET stock_actual = :nuevo, ultima_salida = NOW()
                         WHERE id = :id"
                    )->execute([':nuevo' => $nuevo, ':id' => $fila['id']]);

                    Producto::registrarMovimiento($db, [
                        'variante_id'    => $varianteId,
                        'almacen_id'     => (int) $fila['almacen_id'],
                        'ubicacion_id'   => (int) $fila['ubicacion_id'],
                        'tipo'           => 'venta',
                        'cantidad'       => $mover,
                        'stock_anterior' => $anterior,
                        'stock_nuevo'    => $nuevo,
                        'costo_unitario' => self::costoVariante($normalizados, $varianteId),
                        'motivo'         => "Venta del pedido #{$pedidoId}",
                        'referencia_tipo'=> 'pedido',
                        'referencia_id'  => $pedidoId,
                    ]);
                }

                if ($restante > 0) {
                    // No deberia ocurrir: la validacion previa lo impide.
                    throw new RuntimeException(
                        "No fue posible descontar el inventario completo de la variante #{$varianteId}."
                    );
                }
            }

            $db->commit();

            return $pedidoId;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Lista todas las ordenes con el cliente y el resumen de sus items. */
    public static function listarTodos(): array
    {
        $db = Database::conectar();

        $sql = "SELECT p.id, p.cliente_id, c.nombre AS cliente_nombre, c.email AS cliente_email,
                       p.fecha_pedido, p.total, p.estado, p.direccion_envio, p.metodo_pago,
                       p.numero_referencia, p.tasa_dolar_usada,
                       COUNT(ip.id) AS items_count,
                       COALESCE(SUM(ip.cantidad), 0) AS unidades
                FROM pedidos p
                INNER JOIN clientes c ON c.id = p.cliente_id
                LEFT JOIN items_pedido ip ON ip.pedido_id = p.id
                GROUP BY p.id, p.cliente_id, c.nombre, c.email, p.fecha_pedido, p.total,
                         p.estado, p.direccion_envio, p.metodo_pago, p.numero_referencia,
                         p.tasa_dolar_usada
                ORDER BY p.fecha_pedido DESC, p.id DESC";

        return $db->query($sql)->fetchAll();
    }

    /** Consulta un pedido con sus items y los atributos de cada variante. */
    public static function obtenerDetalle(int $id): ?array
    {
        $db = Database::conectar();

        $sqlP = "SELECT p.*, c.nombre AS cliente_nombre, c.email AS cliente_email
                 FROM pedidos p
                 INNER JOIN clientes c ON c.id = p.cliente_id
                 WHERE p.id = :id";
        $stmtP = $db->prepare($sqlP);
        $stmtP->execute([':id' => $id]);
        $pedido = $stmtP->fetch();

        if (!$pedido) {
            return null;
        }

        $sqlI = "SELECT ip.*, prod.nombre AS producto_nombre, prod.imagen,
                        v.sku, v.referencia,
                        t.nombre AS talla, co.nombre AS color, mo.nombre AS modelo
                 FROM items_pedido ip
                 INNER JOIN productos prod ON prod.id = ip.producto_id
                 LEFT JOIN producto_variantes v ON v.id = ip.variante_id
                 LEFT JOIN tallas t   ON t.id = v.talla_id
                 LEFT JOIN colores co ON co.id = v.color_id
                 LEFT JOIN modelos mo ON mo.id = v.modelo_id
                 WHERE ip.pedido_id = :id
                 ORDER BY ip.id ASC";
        $stmtI = $db->prepare($sqlI);
        $stmtI->execute([':id' => $id]);
        $pedido['items'] = $stmtI->fetchAll();

        return $pedido;
    }

    /** Costo unitario de una variante dentro del pedido. */
    private static function costoVariante(array $items, int $varianteId): float
    {
        foreach ($items as $item) {
            if ((int) $item['variante_id'] === $varianteId) {
                return (float) $item['costo_unitario'];
            }
        }
        return 0.0;
    }
}
