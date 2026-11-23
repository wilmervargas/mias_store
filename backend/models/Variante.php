<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/Producto.php';

/**
 * Variantes de producto (talla / color / modelo).
 *
 * El SKU es inmutable una vez creado. La variante base (es_base = 1)
 * no puede desactivarse: es la que sostiene el inventario historico.
 */
class Variante
{
    /** Lista las variantes de un producto. */
    public static function listar(int $productoId): array
    {
        return Producto::variantes($productoId);
    }

    /** Obtiene una variante por ID. */
    public static function obtener(int $id): ?array
    {
        $db  = Database::conectar();
        $sql = "SELECT v.*, t.nombre AS talla, co.nombre AS color, mo.nombre AS modelo
                FROM producto_variantes v
                LEFT JOIN tallas t   ON t.id = v.talla_id
                LEFT JOIN colores co ON co.id = v.color_id
                LEFT JOIN modelos mo ON mo.id = v.modelo_id
                WHERE v.id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    /**
     * Crea una variante para un producto.
     * Si no se envia SKU se genera automaticamente con la secuencia del producto.
     */
    public static function crear(int $productoId, array $datos): int
    {
        $db = Database::conectar();

        $producto = Producto::obtenerPorId($productoId);
        if (!$producto) {
            throw new RuntimeException("El producto #{$productoId} no existe.");
        }

        $db->beginTransaction();

        try {
            $sku = trim((string) ($datos['sku'] ?? ''));

            if ($sku === '') {
                $secuencia = Producto::siguienteSecuenciaSku($db, $productoId);
                $sku = Producto::generarSku(
                    $db,
                    $productoId,
                    (int) $producto['idcategoria'],
                    $secuencia
                );
            }

            $stmt = $db->prepare(
                "INSERT INTO producto_variantes
                 (producto_id, sku, codigo_barras, talla_id, color_id, modelo_id,
                  clave_variante, atributos, referencia, es_base, idestatus)
                 VALUES
                 (:producto_id, :sku, :codigo_barras, :talla_id, :color_id, :modelo_id,
                  :clave_variante, :atributos, :referencia, 0, 1)"
            );
            $stmt->execute([
                ':producto_id'   => $productoId,
                ':sku'           => $sku,
                ':codigo_barras' => self::limpiar($datos['codigo_barras'] ?? null),
                ':talla_id'      => !empty($datos['talla_id']) ? (int) $datos['talla_id'] : null,
                ':color_id'      => !empty($datos['color_id']) ? (int) $datos['color_id'] : null,
                ':modelo_id'     => !empty($datos['modelo_id']) ? (int) $datos['modelo_id'] : null,
                ':clave_variante'=> (string) ($datos['clave_variante'] ?? ''),
                ':atributos'     => !empty($datos['atributos'])
                    ? json_encode($datos['atributos'], JSON_UNESCAPED_UNICODE)
                    : null,
                ':referencia'    => $datos['referencia'] ?? $producto['nombre'],
            ]);

            $varianteId = (int) $db->lastInsertId();

            // Fila de inventario en cero para que la variante ya sea almacenable.
            [$almacenId, $ubicacionId] = Producto::resolverUbicacion(
                $db,
                isset($datos['almacen_id']) ? (int) $datos['almacen_id'] : null,
                isset($datos['ubicacion_id']) ? (int) $datos['ubicacion_id'] : null
            );

            $db->prepare(
                "INSERT INTO inventario_stock
                 (variante_id, almacen_id, ubicacion_id,
                  stock_actual, stock_reservado, stock_minimo,
                  inventario_inicial, fecha_inventario_inicial, idestatus)
                 VALUES
                 (:variante_id, :almacen_id, :ubicacion_id, 0, 0, :stock_minimo, 0, NOW(), 1)"
            )->execute([
                ':variante_id'  => $varianteId,
                ':almacen_id'   => $almacenId,
                ':ubicacion_id' => $ubicacionId,
                ':stock_minimo' => max(0, (int) ($datos['stock_minimo'] ?? 5)),
            ]);

            $db->commit();
            return $varianteId;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Actualiza atributos de una variante.
     * El SKU se ignora deliberadamente: es inmutable.
     */
    public static function actualizar(int $id, array $datos): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE producto_variantes SET
                codigo_barras = :codigo_barras,
                talla_id      = :talla_id,
                color_id      = :color_id,
                modelo_id     = :modelo_id,
                clave_variante= :clave_variante,
                atributos     = :atributos,
                referencia    = :referencia,
                idestatus     = :idestatus
             WHERE id = :id"
        );

        return $stmt->execute([
            ':id'            => $id,
            ':codigo_barras' => self::limpiar($datos['codigo_barras'] ?? $actual['codigo_barras']),
            ':talla_id'      => !empty($datos['talla_id']) ? (int) $datos['talla_id'] : null,
            ':color_id'      => !empty($datos['color_id']) ? (int) $datos['color_id'] : null,
            ':modelo_id'     => !empty($datos['modelo_id']) ? (int) $datos['modelo_id'] : null,
            ':clave_variante'=> (string) ($datos['clave_variante'] ?? $actual['clave_variante']),
            ':atributos'     => !empty($datos['atributos'])
                ? json_encode($datos['atributos'], JSON_UNESCAPED_UNICODE)
                : null,
            ':referencia'    => $datos['referencia'] ?? $actual['referencia'],
            ':idestatus'     => (int) ($datos['idestatus'] ?? $actual['idestatus']),
        ]);
    }

    /** Desactiva una variante (no se borra para conservar el kardex). */
    public static function desactivar(int $id): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        if ((int) $actual['es_base'] === 1) {
            throw new RuntimeException('La variante base no puede desactivarse.');
        }

        $db = Database::conectar();
        $stmt = $db->prepare("UPDATE producto_variantes SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    private static function limpiar(mixed $valor): ?string
    {
        $texto = trim((string) $valor);
        return $texto === '' ? null : $texto;
    }
}
