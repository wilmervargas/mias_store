<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Modelo de productos con soporte de variantes e inventario multialmacen.
 *
 * Reglas:
 *  - productos.stock es un cache sincronizado por triggers desde inventario_stock.
 *  - El SKU vive en producto_variantes.
 *  - Todo producto tiene una variante base (es_base = 1).
 *  - El stock nunca se escribe directo: se ajusta inventario_stock y el trigger
 *    recalcula productos.stock.
 */
class Producto
{
    /** Prefijos de SKU por categoria (compatibles con la migracion). */
    private const PREFIX_CATEGORIA = [
        1 => 'TEC',
        2 => 'HOG',
        3 => 'MAQ',
        6 => 'ALI',
    ];

    /** Listar catalogo con JOINs a categorias y marcas. */
    public static function obtenerTodos(bool $soloActivos = true): array
    {
        $db    = Database::conectar();
        $where = $soloActivos ? "WHERE p.idestatus = 1" : "";
        $sql = "SELECT
                    p.id, p.nombre, p.descripcion, p.precio, p.preciofull, p.costo,
                    p.stock, p.imagen, p.estrellas, p.idestatus, p.idsubcategoria,
                    p.idmodelo,
                    c.id AS idcategoria, c.nombre AS categoria,
                    m.id AS idmarca,     m.nombre AS marca,
                    mo.nombre AS modelo,
                    COUNT(DISTINCT v.id) AS variantes,
                    GROUP_CONCAT(DISTINCT v.sku ORDER BY v.es_base DESC, v.id) AS skus
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN modelos mo   ON mo.id = p.idmodelo
                LEFT JOIN producto_variantes v
                       ON v.producto_id = p.id AND v.idestatus = 1
                {$where}
                GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.preciofull, p.costo,
                         p.stock, p.imagen, p.estrellas, p.idestatus, p.idsubcategoria,
                         p.idmodelo, c.id, c.nombre, m.id, m.nombre, mo.nombre
                ORDER BY p.id DESC";
        return $db->query($sql)->fetchAll();
    }

    /** Obtener un producto por su ID, con variantes e inventario. */
    public static function obtenerPorId(int $id): ?array
    {
        $db  = Database::conectar();
        $sql = "SELECT p.*, c.nombre AS categoria, m.nombre AS marca, mo.nombre AS modelo
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN modelos mo   ON mo.id = p.idmodelo
                WHERE p.id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();

        if (!$fila) {
            return null;
        }

        $fila['variantes']  = self::variantes($id);
        $fila['inventario'] = self::inventario($id);

        return $fila;
    }

    /** Obtener un producto por SKU de cualquiera de sus variantes. */
    public static function obtenerPorSku(string $sku): ?array
    {
        $db  = Database::conectar();
        $sql = "SELECT p.id
                FROM producto_variantes v
                INNER JOIN productos p ON p.id = v.producto_id
                WHERE v.sku = :sku
                LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':sku' => $sku]);
        $fila = $stmt->fetch();

        return $fila ? self::obtenerPorId((int) $fila['id']) : null;
    }

    /** Variantes de un producto con sus atributos legibles. */
    public static function variantes(int $productoId): array
    {
        $db  = Database::conectar();
        $sql = "SELECT v.id, v.producto_id, v.sku, v.codigo_barras,
                       v.talla_id, v.color_id, v.modelo_id,
                       v.clave_variante, v.atributos, v.referencia,
                       v.es_base, v.idestatus,
                       t.nombre AS talla, co.nombre AS color, mo.nombre AS modelo,
                       COALESCE(i.stock_disponible, 0) AS stock_disponible
                FROM producto_variantes v
                LEFT JOIN tallas t   ON t.id = v.talla_id
                LEFT JOIN colores co ON co.id = v.color_id
                LEFT JOIN modelos mo ON mo.id = v.modelo_id
                LEFT JOIN (
                    SELECT variante_id,
                           SUM(stock_actual - stock_reservado) AS stock_disponible
                    FROM inventario_stock
                    WHERE idestatus = 1
                    GROUP BY variante_id
                ) i ON i.variante_id = v.id
                WHERE v.producto_id = :producto_id
                ORDER BY v.es_base DESC, v.id ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute([':producto_id' => $productoId]);
        return $stmt->fetchAll();
    }

    /** Inventario de un producto agrupado por almacen/ubicacion. */
    public static function inventario(int $productoId): array
    {
        $db  = Database::conectar();
        $sql = "SELECT *
                FROM vw_inventario_detalle
                WHERE producto_id = :producto_id
                ORDER BY almacen_id, ubicacion_codigo, sku";
        $stmt = $db->prepare($sql);
        $stmt->execute([':producto_id' => $productoId]);
        return $stmt->fetchAll();
    }

    /**
     * Busqueda avanzada con filtros combinables.
     * Acepta: q, idcategoria, idmarca, idmodelo, talla_id, color_id,
     *         precioMin, precioMax, stockMin, con_stock.
     */
    public static function buscar(array $f, bool $soloActivos = true): array
    {
        $db  = Database::conectar();
        $sql = "SELECT p.id, p.nombre, p.descripcion, p.precio, p.preciofull, p.costo,
                       p.stock, p.imagen, p.estrellas, p.idestatus,
                       c.id AS idcategoria, c.nombre AS categoria,
                       m.id AS idmarca, m.nombre AS marca,
                       mo.nombre AS modelo,
                       COUNT(DISTINCT v.id) AS variantes,
                       GROUP_CONCAT(DISTINCT v.sku ORDER BY v.es_base DESC, v.id) AS skus
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN modelos mo   ON mo.id = p.idmodelo
                LEFT JOIN producto_variantes v
                       ON v.producto_id = p.id AND v.idestatus = 1
                WHERE 1 = 1";
        $params = [];

        if (!empty($f['q'])) {
            // Placeholders separados: PDO con prepares nativos no reutiliza :q.
            $sql .= " AND (p.nombre LIKE :q1 OR m.nombre LIKE :q2 OR mo.nombre LIKE :q3
                            OR EXISTS (SELECT 1 FROM producto_variantes vq
                                       WHERE vq.producto_id = p.id AND vq.sku LIKE :q4))";
            $busqueda = '%' . $f['q'] . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
            $params[':q3'] = $busqueda;
            $params[':q4'] = $busqueda;
        }
        if (!empty($f['idcategoria'])) {
            $sql .= " AND p.idcategoria = :cat";
            $params[':cat'] = (int) $f['idcategoria'];
        }
        if (!empty($f['idmarca'])) {
            $sql .= " AND p.idmarca = :mar";
            $params[':mar'] = (int) $f['idmarca'];
        }
        if (!empty($f['idmodelo'])) {
            $sql .= " AND p.idmodelo = :mod";
            $params[':mod'] = (int) $f['idmodelo'];
        }
        if (!empty($f['talla_id'])) {
            $sql .= " AND EXISTS (SELECT 1 FROM producto_variantes vf
                                  WHERE vf.producto_id = p.id
                                    AND vf.idestatus = 1
                                    AND vf.talla_id = :talla)";
            $params[':talla'] = (int) $f['talla_id'];
        }
        if (!empty($f['color_id'])) {
            $sql .= " AND EXISTS (SELECT 1 FROM producto_variantes vf
                                  WHERE vf.producto_id = p.id
                                    AND vf.idestatus = 1
                                    AND vf.color_id = :color)";
            $params[':color'] = (int) $f['color_id'];
        }
        if (isset($f['precioMin']) && $f['precioMin'] !== '') {
            $sql .= " AND p.precio >= :pmin";
            $params[':pmin'] = (float) $f['precioMin'];
        }
        if (isset($f['precioMax']) && $f['precioMax'] !== '') {
            $sql .= " AND p.precio <= :pmax";
            $params[':pmax'] = (float) $f['precioMax'];
        }
        if (isset($f['stockMin']) && $f['stockMin'] !== '') {
            $sql .= " AND p.stock >= :smin";
            $params[':smin'] = (int) $f['stockMin'];
        }
        if (!empty($f['con_stock'])) {
            $sql .= " AND p.stock > 0";
        }
        if ($soloActivos) {
            $sql .= " AND p.idestatus = 1";
        }

        $sql .= " GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.preciofull, p.costo,
                           p.stock, p.imagen, p.estrellas, p.idestatus, p.idcategoria,
                           c.id, c.nombre, m.id, m.nombre, mo.nombre
                  ORDER BY p.precio ASC LIMIT 200";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Crear un producto con su variante base y su inventario inicial.
     * Todo ocurre en una transaccion: si falla el inventario, no queda el producto.
     */
    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $precio     = round((float) ($datos['precio'] ?? 0), 2);
            $preciofull = round((float) ($datos['preciofull'] ?? $precio), 2);
            $costo      = round((float) ($datos['costo'] ?? 0), 2);
            $stockInicial = max(0, (int) ($datos['stock'] ?? 0));

            $sql = "INSERT INTO productos
                    (nombre, descripcion, precio, preciofull, costo, stock,
                     idcategoria, idsubcategoria, idmarca, idmodelo,
                     estrellas, imagen, idestatus)
                    VALUES
                    (:nombre, :descripcion, :precio, :preciofull, :costo, 0,
                     :idcategoria, :idsubcategoria, :idmarca, :idmodelo,
                     :estrellas, :imagen, 1)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':nombre'         => $datos['nombre'],
                ':descripcion'    => $datos['descripcion'] ?? null,
                ':precio'         => $precio,
                ':preciofull'     => $preciofull,
                ':costo'          => $costo,
                ':idcategoria'    => (int) $datos['idcategoria'],
                ':idsubcategoria' => (int) ($datos['idsubcategoria'] ?? 1),
                ':idmarca'        => (int) $datos['idmarca'],
                ':idmodelo'       => !empty($datos['idmodelo']) ? (int) $datos['idmodelo'] : null,
                ':estrellas'      => (string) ($datos['estrellas'] ?? '5'),
                ':imagen'         => $datos['imagen'] ?? 'sin-foto.png',
            ]);
            $productoId = (int) $db->lastInsertId();

            $sku      = self::generarSku($db, $productoId, (int) $datos['idcategoria'], 1);
            $tallaId  = !empty($datos['talla_id'])
                ? (int) $datos['talla_id']
                : self::idTallaUnica($db);
            $colorId  = !empty($datos['color_id']) ? (int) $datos['color_id'] : null;
            $modeloId = !empty($datos['idmodelo']) ? (int) $datos['idmodelo'] : null;

            $stmtVar = $db->prepare(
                "INSERT INTO producto_variantes
                 (producto_id, sku, talla_id, color_id, modelo_id,
                  clave_variante, referencia, es_base, idestatus)
                 VALUES
                 (:producto_id, :sku, :talla_id, :color_id, :modelo_id,
                  '', :referencia, 1, 1)"
            );
            $stmtVar->execute([
                ':producto_id' => $productoId,
                ':sku'         => $sku,
                ':talla_id'    => $tallaId,
                ':color_id'    => $colorId,
                ':modelo_id'   => $modeloId,
                ':referencia'  => $datos['nombre'],
            ]);
            $varianteId = (int) $db->lastInsertId();

            [$almacenId, $ubicacionId] = self::resolverUbicacion(
                $db,
                isset($datos['almacen_id']) ? (int) $datos['almacen_id'] : null,
                isset($datos['ubicacion_id']) ? (int) $datos['ubicacion_id'] : null
            );

            $stmtInv = $db->prepare(
                "INSERT INTO inventario_stock
                 (variante_id, almacen_id, ubicacion_id,
                  stock_actual, stock_reservado, stock_minimo,
                  inventario_inicial, fecha_inventario_inicial, idestatus)
                 VALUES
                 (:variante_id, :almacen_id, :ubicacion_id,
                  :stock, 0, :stock_minimo, :stock_inicial, NOW(), 1)"
            );
            $stmtInv->execute([
                ':variante_id'   => $varianteId,
                ':almacen_id'    => $almacenId,
                ':ubicacion_id'  => $ubicacionId,
                ':stock'         => $stockInicial,
                ':stock_minimo'  => max(0, (int) ($datos['stock_minimo'] ?? 5)),
                ':stock_inicial' => $stockInicial,
            ]);

            self::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => $almacenId,
                'ubicacion_id'   => $ubicacionId,
                'tipo'           => 'inicial',
                'cantidad'       => $stockInicial,
                'stock_anterior' => 0,
                'stock_nuevo'    => $stockInicial,
                'costo_unitario' => $costo,
                'motivo'         => 'Inventario inicial al crear el producto',
                'referencia_tipo'=> 'producto',
                'referencia_id'  => $productoId,
            ]);

            $db->commit();
            return $productoId;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Actualizar un producto (recibe el registro ya fusionado con el actual).
     * Si cambia el stock, se registra como ajuste en el inventario de la
     * variante base; productos.stock lo recalcula el trigger.
     */
    public static function actualizar(int $id, array $datos): bool
    {
        $db      = Database::conectar();
        $actual  = self::obtenerPorId($id);

        if (!$actual) {
            return false;
        }

        $precio     = round((float) $datos['precio'], 2);
        $preciofull = round((float) ($datos['preciofull'] ?? $precio), 2);
        $costo      = round((float) ($datos['costo'] ?? $actual['costo'] ?? 0), 2);

        $db->beginTransaction();

        try {
            $sql = "UPDATE productos SET
                        nombre         = :nombre,
                        descripcion    = :descripcion,
                        precio         = :precio,
                        preciofull     = :preciofull,
                        costo          = :costo,
                        idcategoria    = :idcategoria,
                        idsubcategoria = :idsubcategoria,
                        idmarca        = :idmarca,
                        idmodelo       = :idmodelo,
                        estrellas      = :estrellas,
                        imagen         = :imagen,
                        idestatus      = :idestatus
                    WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':id'             => $id,
                ':nombre'         => $datos['nombre'],
                ':descripcion'    => $datos['descripcion'] ?? null,
                ':precio'         => $precio,
                ':preciofull'     => $preciofull,
                ':costo'          => $costo,
                ':idcategoria'    => (int) $datos['idcategoria'],
                ':idsubcategoria' => (int) ($datos['idsubcategoria'] ?? 1),
                ':idmarca'        => (int) $datos['idmarca'],
                ':idmodelo'       => !empty($datos['idmodelo']) ? (int) $datos['idmodelo'] : null,
                ':estrellas'      => (string) ($datos['estrellas'] ?? '5'),
                ':imagen'         => $datos['imagen'] ?? 'sin-foto.png',
                ':idestatus'      => (int) ($datos['idestatus'] ?? 1),
            ]);

            // Al reactivar un producto, se reactiva su variante base.
            if ((int) $actual['idestatus'] === 2 && (int) ($datos['idestatus'] ?? 1) === 1) {
                $db->prepare(
                    "UPDATE producto_variantes
                     SET idestatus = 1
                     WHERE producto_id = :id AND es_base = 1"
                )->execute([':id' => $id]);
            }

            if (array_key_exists('stock', $datos)) {
                $delta = (int) $datos['stock'] - (int) $actual['stock'];
                if ($delta !== 0) {
                    $varianteId = self::idVarianteBase($db, $id);
                    if ($varianteId === null) {
                        throw new RuntimeException('El producto no tiene variante base para ajustar stock.');
                    }
                    self::ajustarStockVariante($db, $varianteId, $delta, 'Ajuste desde edicion de producto');
                }
            }

            $db->commit();
            return true;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Borrado logico: marca el producto y sus variantes como inactivos. */
    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("UPDATE productos SET idestatus = 2 WHERE id = :id");
            $stmt->execute([':id' => $id]);

            $stmtVar = $db->prepare("UPDATE producto_variantes SET idestatus = 2 WHERE producto_id = :id");
            $stmtVar->execute([':id' => $id]);

            $db->commit();
            return $stmt->rowCount() > 0;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Asociar el nombre del archivo de imagen a un producto. */
    public static function setImagen(int $id, string $imagen): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE productos SET imagen = :imagen WHERE id = :id");
        return $stmt->execute([':imagen' => $imagen, ':id' => $id]);
    }

    /** Resumen general del inventario en una sola consulta. */
    public static function resumenInventario(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT
                    COUNT(*)                                            AS total_productos,
                    COALESCE(SUM(t.stock_total), 0)                     AS total_unidades,
                    COALESCE(SUM(t.valor_venta), 0)                     AS valor_inventario,
                    COALESCE(SUM(t.valor_costo), 0)                     AS valor_costo,
                    SUM(CASE WHEN t.stock_total < 10 THEN 1 ELSE 0 END) AS criticos,
                    SUM(CASE WHEN t.stock_total = 0  THEN 1 ELSE 0 END) AS agotados
                FROM (
                    SELECT p.id,
                           COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) AS stock_total,
                           COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) * p.precio AS valor_venta,
                           COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) * p.costo  AS valor_costo
                    FROM productos p
                    LEFT JOIN producto_variantes v
                           ON v.producto_id = p.id AND v.idestatus = 1
                    LEFT JOIN inventario_stock i
                           ON i.variante_id = v.id AND i.idestatus = 1
                    WHERE p.idestatus = 1
                    GROUP BY p.id, p.precio, p.costo
                ) t";
        return $db->query($sql)->fetch();
    }

    /** Productos con stock total por debajo del umbral (reposicion). */
    public static function stockCritico(int $umbral = 10): array
    {
        $db  = Database::conectar();
        $sql = "SELECT p.id, p.nombre, p.stock, p.precio, p.costo,
                       c.nombre AS categoria, m.nombre AS marca,
                       COUNT(DISTINCT v.id) AS variantes
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN producto_variantes v
                       ON v.producto_id = p.id AND v.idestatus = 1
                WHERE p.idestatus = 1 AND p.stock < :umbral
                GROUP BY p.id, p.nombre, p.stock, p.precio, p.costo, c.nombre, m.nombre
                ORDER BY p.stock ASC
                LIMIT 100";
        $stmt = $db->prepare($sql);
        $stmt->execute([':umbral' => $umbral]);
        return $stmt->fetchAll();
    }

    /** Valor del inventario agrupado por categoria. */
    public static function valorPorCategoria(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT c.nombre AS categoria,
                       COUNT(DISTINCT p.id) AS productos,
                       COALESCE(SUM(i.stock_actual - i.stock_reservado), 0) AS unidades,
                       COALESCE(SUM((i.stock_actual - i.stock_reservado) * p.precio), 0) AS valor,
                       COALESCE(SUM((i.stock_actual - i.stock_reservado) * p.costo), 0) AS valor_costo
                FROM categorias c
                LEFT JOIN productos p
                       ON p.idcategoria = c.id AND p.idestatus = 1
                LEFT JOIN producto_variantes v
                       ON v.producto_id = p.id AND v.idestatus = 1
                LEFT JOIN inventario_stock i
                       ON i.variante_id = v.id AND i.idestatus = 1
                GROUP BY c.id, c.nombre
                ORDER BY valor DESC";
        return $db->query($sql)->fetchAll();
    }

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------

    /** Genera un SKU unico: DAM-{CAT}-{ID_5}-{SECUENCIA_2}. */
    public static function generarSku(PDO $db, int $productoId, int $idcategoria, int $secuencia = 1): string
    {
        $prefijo = self::PREFIX_CATEGORIA[$idcategoria] ?? 'GEN';

        return sprintf(
            'DAM-%s-%05d-%02d',
            $prefijo,
            $productoId,
            $secuencia
        );
    }

    /** Siguiente secuencia de SKU disponible para un producto. */
    public static function siguienteSecuenciaSku(PDO $db, int $productoId): int
    {
        $stmt = $db->prepare(
            "SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(sku, '-', -1) AS UNSIGNED)), 0) + 1
             FROM producto_variantes
             WHERE producto_id = :producto_id"
        );
        $stmt->execute([':producto_id' => $productoId]);
        return max(1, (int) $stmt->fetchColumn());
    }

    /** ID de la variante base de un producto. */
    public static function idVarianteBase(PDO $db, int $productoId): ?int
    {
        $stmt = $db->prepare(
            "SELECT id FROM producto_variantes
             WHERE producto_id = :producto_id AND es_base = 1
             LIMIT 1"
        );
        $stmt->execute([':producto_id' => $productoId]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /** ID de la talla UNICA. */
    private static function idTallaUnica(PDO $db): ?int
    {
        $id = $db->query("SELECT id FROM tallas WHERE codigo = 'UNICA' LIMIT 1")->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /**
     * Resuelve almacen/ubicacion. Si no se indican, usa la ubicacion
     * por defecto del almacen principal.
     *
     * @return array{0:int,1:int}
     */
    public static function resolverUbicacion(PDO $db, ?int $almacenId, ?int $ubicacionId): array
    {
        if ($ubicacionId !== null && $ubicacionId > 0) {
            $stmt = $db->prepare(
                "SELECT almacen_id, id FROM ubicaciones
                 WHERE id = :id AND idestatus = 1 LIMIT 1"
            );
            $stmt->execute([':id' => $ubicacionId]);
            $fila = $stmt->fetch();
            if (!$fila) {
                throw new RuntimeException("La ubicacion #{$ubicacionId} no existe o esta inactiva.");
            }
            return [(int) $fila['almacen_id'], (int) $fila['id']];
        }

        if ($almacenId !== null && $almacenId > 0) {
            $stmt = $db->prepare(
                "SELECT id FROM ubicaciones
                 WHERE almacen_id = :almacen_id AND idestatus = 1
                 ORDER BY id ASC LIMIT 1"
            );
            $stmt->execute([':almacen_id' => $almacenId]);
            $uid = $stmt->fetchColumn();
            if ($uid === false) {
                throw new RuntimeException("El almacen #{$almacenId} no tiene ubicaciones activas.");
            }
            return [$almacenId, (int) $uid];
        }

        $fila = $db->query(
            "SELECT u.almacen_id, u.id
             FROM ubicaciones u
             INNER JOIN almacenes a ON a.id = u.almacen_id
             WHERE a.codigo = 'PRINCIPAL' AND u.idestatus = 1
             ORDER BY u.id ASC LIMIT 1"
        )->fetch();

        if (!$fila) {
            throw new RuntimeException('No existe una ubicacion por defecto en el almacen PRINCIPAL.');
        }

        return [(int) $fila['almacen_id'], (int) $fila['id']];
    }

    /**
     * Ajusta el stock de una variante repartiendolo entre sus ubicaciones.
     * Un delta positivo suma; uno negativo descuenta. Registra kardex.
     */
    public static function ajustarStockVariante(PDO $db, int $varianteId, int $delta, string $motivo): void
    {
        if ($delta === 0) {
            return;
        }

        $stmt = $db->prepare(
            "SELECT id, almacen_id, ubicacion_id, stock_actual, stock_reservado
             FROM inventario_stock
             WHERE variante_id = :variante_id AND idestatus = 1
             ORDER BY stock_actual DESC, id ASC
             FOR UPDATE"
        );
        $stmt->execute([':variante_id' => $varianteId]);
        $filas = $stmt->fetchAll();

        if (empty($filas)) {
            throw new RuntimeException('La variante no tiene inventario registrado.');
        }

        if ($delta > 0) {
            // Se suma a la ubicacion con mas stock.
            $fila = $filas[0];
            $anterior = (int) $fila['stock_actual'];
            $nuevo    = $anterior + $delta;

            $db->prepare(
                "UPDATE inventario_stock
                 SET stock_actual = :nuevo, ultima_entrada = NOW()
                 WHERE id = :id"
            )->execute([':nuevo' => $nuevo, ':id' => $fila['id']]);

            self::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => (int) $fila['almacen_id'],
                'ubicacion_id'   => (int) $fila['ubicacion_id'],
                'tipo'           => 'ajuste',
                'cantidad'       => $delta,
                'stock_anterior' => $anterior,
                'stock_nuevo'    => $nuevo,
                'motivo'         => $motivo,
                'referencia_tipo'=> 'ajuste_manual',
            ]);
            return;
        }

        $restante = abs($delta);

        foreach ($filas as $fila) {
            if ($restante <= 0) {
                break;
            }

            $disponible = (int) $fila['stock_actual'] - (int) $fila['stock_reservado'];
            if ($disponible <= 0) {
                continue;
            }

            $mover    = min($disponible, $restante);
            $anterior = (int) $fila['stock_actual'];
            $nuevo    = $anterior - $mover;
            $restante -= $mover;

            $db->prepare(
                "UPDATE inventario_stock
                 SET stock_actual = :nuevo, ultima_salida = NOW()
                 WHERE id = :id"
            )->execute([':nuevo' => $nuevo, ':id' => $fila['id']]);

            self::registrarMovimiento($db, [
                'variante_id'    => $varianteId,
                'almacen_id'     => (int) $fila['almacen_id'],
                'ubicacion_id'   => (int) $fila['ubicacion_id'],
                'tipo'           => 'ajuste',
                'cantidad'       => -$mover,
                'stock_anterior' => $anterior,
                'stock_nuevo'    => $nuevo,
                'motivo'         => $motivo,
                'referencia_tipo'=> 'ajuste_manual',
            ]);
        }

        if ($restante > 0) {
            throw new RuntimeException('No hay stock suficiente para aplicar el ajuste solicitado.');
        }
    }

    /** Inserta un movimiento de kardex. */
    public static function registrarMovimiento(PDO $db, array $m): void
    {
        $stmt = $db->prepare(
            "INSERT INTO movimientos_inventario
             (variante_id, almacen_id, ubicacion_id, tipo, cantidad,
              stock_anterior, stock_nuevo, costo_unitario, motivo,
              referencia_tipo, referencia_id, usuario_id)
             VALUES
             (:variante_id, :almacen_id, :ubicacion_id, :tipo, :cantidad,
              :stock_anterior, :stock_nuevo, :costo_unitario, :motivo,
              :referencia_tipo, :referencia_id, :usuario_id)"
        );
        $stmt->execute([
            ':variante_id'     => $m['variante_id'],
            ':almacen_id'      => $m['almacen_id'],
            ':ubicacion_id'    => $m['ubicacion_id'],
            ':tipo'            => $m['tipo'],
            ':cantidad'        => $m['cantidad'],
            ':stock_anterior'  => $m['stock_anterior'],
            ':stock_nuevo'     => $m['stock_nuevo'],
            ':costo_unitario'  => $m['costo_unitario'] ?? null,
            ':motivo'          => $m['motivo'] ?? null,
            ':referencia_tipo' => $m['referencia_tipo'] ?? null,
            ':referencia_id'   => $m['referencia_id'] ?? null,
            ':usuario_id'      => $m['usuario_id'] ?? null,
        ]);
    }
}
