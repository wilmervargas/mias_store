<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Carrito de compras por variante.
 *
 * Cada linea del carrito apunta a una variante concreta. Si el cliente
 * no elige variante, se usa la variante base del producto.
 * El stock se valida contra inventario_stock, nunca contra productos.stock.
 */
class Carrito
{
    /** Devuelve el carrito del cliente; si no existe, lo crea. */
    public static function obtenerOCrear(int $clienteId): array
    {
        $db = Database::conectar();

        $stmt = $db->prepare("SELECT * FROM carritos WHERE cliente_id = :cliente_id ORDER BY id ASC LIMIT 1");
        $stmt->execute([':cliente_id' => $clienteId]);
        $carrito = $stmt->fetch();

        if (!$carrito) {
            $db->prepare("INSERT INTO carritos (cliente_id) VALUES (:cliente_id)")
               ->execute([':cliente_id' => $clienteId]);

            $stmt->execute([':cliente_id' => $clienteId]);
            $carrito = $stmt->fetch();
        }

        return $carrito;
    }

    /** Items del carrito con producto, variante y stock disponible real. */
    public static function listar(int $clienteId): array
    {
        $db = Database::conectar();

        $sql = "SELECT ic.id, ic.producto_id, ic.variante_id, ic.cantidad,
                       p.nombre, p.precio, p.imagen,
                       v.sku, v.referencia,
                       t.nombre AS talla, co.nombre AS color, mo.nombre AS modelo,
                       COALESCE(s.stock_disponible, 0) AS stock
                FROM items_carrito ic
                INNER JOIN productos p ON p.id = ic.producto_id
                LEFT JOIN producto_variantes v ON v.id = ic.variante_id
                LEFT JOIN tallas t   ON t.id = v.talla_id
                LEFT JOIN colores co ON co.id = v.color_id
                LEFT JOIN modelos mo ON mo.id = v.modelo_id
                LEFT JOIN (
                    SELECT variante_id,
                           SUM(stock_actual - stock_reservado) AS stock_disponible
                    FROM inventario_stock
                    WHERE idestatus = 1
                    GROUP BY variante_id
                ) s ON s.variante_id = v.id
                WHERE ic.cliente_id = :cliente_id
                  AND p.idestatus = 1
                ORDER BY ic.added_at ASC, ic.id ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute([':cliente_id' => $clienteId]);
        return $stmt->fetchAll();
    }

    /**
     * Agrega una variante al carrito o suma cantidad si ya estaba.
     * Valida el stock real y bloquea las filas de inventario durante la operacion.
     */
    public static function agregarItem(int $clienteId, int $productoId, int $cantidad, ?int $varianteId = null): void
    {
        if ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        $carrito = self::obtenerOCrear($clienteId);
        $db = Database::conectar();

        $db->beginTransaction();

        try {
            $stmtProducto = $db->prepare(
                "SELECT id, idestatus FROM productos WHERE id = :id FOR UPDATE"
            );
            $stmtProducto->execute([':id' => $productoId]);
            $producto = $stmtProducto->fetch();

            if (!$producto || (int) $producto['idestatus'] !== 1) {
                throw new RuntimeException('El producto no existe o esta inactivo.');
            }

            $varianteId = self::resolverVariante($db, $productoId, $varianteId);
            $stockDisponible = self::bloquearStockVariante($db, $varianteId);

            $stmtItem = $db->prepare(
                "SELECT id, cantidad
                 FROM items_carrito
                 WHERE cliente_id = :cliente_id
                   AND variante_id = :variante_id
                 LIMIT 1
                 FOR UPDATE"
            );
            $stmtItem->execute([
                ':cliente_id'  => $clienteId,
                ':variante_id' => $varianteId,
            ]);
            $item = $stmtItem->fetch();

            $cantidadFinal = $item ? ((int) $item['cantidad'] + $cantidad) : $cantidad;

            if ($cantidadFinal > $stockDisponible) {
                throw new RuntimeException(
                    'Stock insuficiente. Disponibles: ' . $stockDisponible
                    . ', solicitados: ' . $cantidadFinal . '.'
                );
            }

            if ($item) {
                $db->prepare("UPDATE items_carrito SET cantidad = :cantidad WHERE id = :id")
                   ->execute([':cantidad' => $cantidadFinal, ':id' => $item['id']]);
            } else {
                $db->prepare(
                    "INSERT INTO items_carrito
                     (carrito_id, cliente_id, producto_id, variante_id, cantidad)
                     VALUES
                     (:carrito_id, :cliente_id, :producto_id, :variante_id, :cantidad)"
                )->execute([
                    ':carrito_id'  => $carrito['id'],
                    ':cliente_id'  => $clienteId,
                    ':producto_id' => $productoId,
                    ':variante_id' => $varianteId,
                    ':cantidad'    => $cantidad,
                ]);
            }

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Cambia la cantidad de una linea validando el stock de su variante. */
    public static function actualizarCantidad(int $itemId, int $cantidad): void
    {
        if ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare(
                "SELECT ic.id, ic.producto_id, ic.variante_id
                 FROM items_carrito ic
                 WHERE ic.id = :id
                 FOR UPDATE"
            );
            $stmt->execute([':id' => $itemId]);
            $item = $stmt->fetch();

            if (!$item) {
                throw new RuntimeException('El item del carrito no existe.');
            }

            $varianteId = self::resolverVariante(
                $db,
                (int) $item['producto_id'],
                $item['variante_id'] !== null ? (int) $item['variante_id'] : null
            );
            $stockDisponible = self::bloquearStockVariante($db, $varianteId);

            if ($cantidad > $stockDisponible) {
                throw new RuntimeException(
                    'Stock insuficiente. Disponibles: ' . $stockDisponible . '.'
                );
            }

            $db->prepare("UPDATE items_carrito SET cantidad = :cantidad WHERE id = :id")
               ->execute([':cantidad' => $cantidad, ':id' => $itemId]);

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Elimina una linea del carrito. */
    public static function eliminarItem(int $itemId): void
    {
        $db = Database::conectar();
        $db->prepare("DELETE FROM items_carrito WHERE id = :id")
           ->execute([':id' => $itemId]);
    }

    /** Vacia el carrito (se usa despues de generar el pedido). */
    public static function vaciar(int $clienteId): void
    {
        $db = Database::conectar();
        $db->prepare("DELETE FROM items_carrito WHERE cliente_id = :cliente_id")
           ->execute([':cliente_id' => $clienteId]);
    }

    /** Items listos para Pedido::crear, con precio y costo tomados de la BD. */
    public static function itemsParaPedido(int $clienteId): array
    {
        $db = Database::conectar();

        $sql = "SELECT ic.variante_id, ic.producto_id, ic.cantidad,
                       p.precio AS precio_unitario, p.costo AS costo_unitario
                FROM items_carrito ic
                INNER JOIN productos p ON p.id = ic.producto_id
                WHERE ic.cliente_id = :cliente_id
                  AND p.idestatus = 1
                ORDER BY ic.id ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute([':cliente_id' => $clienteId]);
        return $stmt->fetchAll();
    }

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------

    /**
     * Resuelve y valida la variante a usar.
     * Si no se indica, devuelve la variante base del producto.
     */
    public static function resolverVariante(PDO $db, int $productoId, ?int $varianteId): int
    {
        if ($varianteId !== null && $varianteId > 0) {
            $stmt = $db->prepare(
                "SELECT id FROM producto_variantes
                 WHERE id = :id AND producto_id = :producto_id AND idestatus = 1
                 LIMIT 1"
            );
            $stmt->execute([':id' => $varianteId, ':producto_id' => $productoId]);

            if ($stmt->fetchColumn() === false) {
                throw new RuntimeException(
                    "La variante #{$varianteId} no existe, no pertenece al producto o esta inactiva."
                );
            }
            return $varianteId;
        }

        $stmt = $db->prepare(
            "SELECT id FROM producto_variantes
             WHERE producto_id = :producto_id AND es_base = 1 AND idestatus = 1
             LIMIT 1"
        );
        $stmt->execute([':producto_id' => $productoId]);
        $id = $stmt->fetchColumn();

        if ($id === false) {
            throw new RuntimeException('El producto no tiene una variante base activa.');
        }
        return (int) $id;
    }

    /**
     * Bloquea todas las filas de inventario de una variante y devuelve
     * el stock disponible total (stock_actual - stock_reservado).
     */
    public static function bloquearStockVariante(PDO $db, int $varianteId): int
    {
        $stmt = $db->prepare(
            "SELECT stock_actual, stock_reservado
             FROM inventario_stock
             WHERE variante_id = :variante_id AND idestatus = 1
             ORDER BY id ASC
             FOR UPDATE"
        );
        $stmt->execute([':variante_id' => $varianteId]);

        $disponible = 0;
        foreach ($stmt->fetchAll() as $fila) {
            $disponible += (int) $fila['stock_actual'] - (int) $fila['stock_reservado'];
        }
        return $disponible;
    }
}
