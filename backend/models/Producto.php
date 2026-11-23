<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
<<<<<<< HEAD
require_once __DIR__ . '/Inventario.php';

class Producto
{
    /** Columnas comunes de listado (una fila de productos = una combinacion/SKU). */
    private static function selectBase(): string
    {
        return "SELECT
                    p.id, p.producto_base_id, p.nombre, p.descripcion,
                    p.precio, p.preciofull, p.costo, p.stock, p.imagen,
                    p.estrellas, p.idestatus, p.idcategoria, p.idsubcategoria,
                    p.idmarca, p.idmodelo, p.idcolor, p.idtalla,
                    p.sku_base, p.codigo_barras, p.unidad_medida,
                    p.created_at, p.updated_at,
                    c.id AS idcategoria_ref, c.nombre AS categoria,
                    m.id AS idmarca_ref, m.nombre AS marca,
                    mo.nombre AS modelo,
                    co.nombre AS color, co.codigo_hex AS color_hex,
                    t.nombre AS talla,
                    (SELECT GROUP_CONCAT(pa.sku_almacen ORDER BY pa.almacen_id SEPARATOR ', ')
                       FROM producto_almacen pa WHERE pa.producto_id = p.id) AS sku_almacen,
                    (SELECT GROUP_CONCAT(a.codigo ORDER BY a.id SEPARATOR ', ')
                       FROM producto_almacen pa JOIN almacenes a ON a.id = pa.almacen_id
                      WHERE pa.producto_id = p.id) AS almacenes_codigo
=======

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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN modelos mo   ON mo.id = p.idmodelo
<<<<<<< HEAD
                LEFT JOIN colores co   ON co.id = p.idcolor
                LEFT JOIN tallas t     ON t.id = p.idtalla";
    }

    public static function obtenerTodos(bool $soloActivos = true): array
    {
        $db  = Database::conectar();
        $where = $soloActivos ? "WHERE p.idestatus = 1" : "";
        $sql = self::selectBase() . " {$where} ORDER BY p.id DESC";
        return $db->query($sql)->fetchAll();
    }

    /** Obtener un producto por su ID, con stock por almacen y ubicaciones. */
    public static function obtenerPorId(int $id): ?array
    {
        $db  = Database::conectar();
        $sql = self::selectBase() . " WHERE p.id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        if (!$fila) {
            return null;
        }
        $fila['stock_por_almacen'] = Inventario::stockPorAlmacen($id);
        $fila['ubicaciones'] = self::inventarioPorUbicacion($id);
        return $fila;
    }

    /** Detalle de inventario (ubicacion + cantidad) de un producto. */
    public static function inventarioPorUbicacion(int $id): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT i.id, i.ubicacion_id, i.cantidad, i.lote, i.fecha_vencimiento,
                    u.codigo AS ubicacion_codigo, u.ruta, u.profundidad,
                    a.id AS almacen_id, a.codigo AS almacen_codigo, a.nombre AS almacen,
                    t.nombre AS tipo_ubicacion
             FROM inventario i
             JOIN ubicaciones u ON u.id = i.ubicacion_id
             JOIN almacenes a ON a.id = u.almacen_id
             JOIN tipos_ubicacion t ON t.id = u.idtipo_ubicacion
             WHERE i.producto_id = :p
             ORDER BY a.nombre, u.ruta"
        );
        $stmt->execute([':p' => $id]);
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        return $stmt->fetchAll();
    }

    /**
     * Busqueda avanzada con filtros combinables.
<<<<<<< HEAD
=======
     * Acepta: q, idcategoria, idmarca, idmodelo, talla_id, color_id,
     *         precioMin, precioMax, stockMin, con_stock.
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
     */
    public static function buscar(array $f, bool $soloActivos = true): array
    {
        $db  = Database::conectar();
<<<<<<< HEAD
        $sql = self::selectBase() . " WHERE 1 = 1";
        $params = [];

        if (!empty($f['q'])) {
            $sql .= " AND (p.nombre LIKE :q1 OR m.nombre LIKE :q2 OR p.sku_base LIKE :q3
                        OR p.codigo_barras LIKE :q4 OR mo.nombre LIKE :q5)";
            $params[':q1'] = '%' . $f['q'] . '%';
            $params[':q2'] = '%' . $f['q'] . '%';
            $params[':q3'] = '%' . $f['q'] . '%';
            $params[':q4'] = '%' . $f['q'] . '%';
            $params[':q5'] = '%' . $f['q'] . '%';
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
        if (!empty($f['idcolor'])) {
            $sql .= " AND p.idcolor = :col";
            $params[':col'] = (int) $f['idcolor'];
        }
        if (!empty($f['idtalla'])) {
            $sql .= " AND p.idtalla = :tal";
            $params[':tal'] = (int) $f['idtalla'];
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
        if (isset($f['stockMax']) && $f['stockMax'] !== '') {
            $sql .= " AND p.stock <= :smax";
            $params[':smax'] = (int) $f['stockMax'];
        }
        if (!empty($f['almacen'])) {
            $sql .= " AND EXISTS (SELECT 1 FROM producto_almacen pa
                                  WHERE pa.producto_id = p.id AND pa.almacen_id = :alm)";
            $params[':alm'] = (int) $f['almacen'];
        }
        if (isset($f['solo_agotados']) && (int) $f['solo_agotados'] === 1) {
            $sql .= " AND p.stock = 0";
        }
        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $sql .= " AND p.idestatus = :estatus";
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivos) {
            $sql .= " AND p.idestatus = 1";
        }

        $sql .= " ORDER BY p.id DESC LIMIT 500";
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
<<<<<<< HEAD
     * Insertar un producto y, si se indica, su stock inicial en un almacen.
     * Todo ocurre en una transaccion.
=======
     * Crear un producto con su variante base y su inventario inicial.
     * Todo ocurre en una transaccion: si falla el inventario, no queda el producto.
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
     */
    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
<<<<<<< HEAD
            $sku = trim((string) ($datos['sku_base'] ?? ''));
            if ($sku === '') {
                // Temporal unico; se reemplaza por el definitivo despues del INSERT.
                $sku = 'TMP-' . bin2hex(random_bytes(6));
            }

            $sql = "INSERT INTO productos
                    (producto_base_id, nombre, descripcion, precio, preciofull, costo,
                     stock, idcategoria, idsubcategoria, idmarca, idmodelo, idcolor, idtalla,
                     sku_base, codigo_barras, unidad_medida, estrellas, imagen, idestatus)
                    VALUES
                    (:producto_base_id, :nombre, :descripcion, :precio, :preciofull, :costo,
                     0, :idcategoria, :idsubcategoria, :idmarca, :idmodelo, :idcolor, :idtalla,
                     :sku_base, :codigo_barras, :unidad_medida, :estrellas, :imagen, :idestatus)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':producto_base_id' => !empty($datos['producto_base_id']) ? (int) $datos['producto_base_id'] : null,
                ':nombre'           => $datos['nombre'],
                ':descripcion'      => $datos['descripcion'] ?? null,
                ':precio'           => (float) $datos['precio'],
                ':preciofull'       => (float) ($datos['preciofull'] ?? $datos['precio']),
                ':costo'            => (float) ($datos['costo'] ?? 0),
                ':idcategoria'      => (int) ($datos['idcategoria'] ?? 1),
                ':idsubcategoria'   => (int) ($datos['idsubcategoria'] ?? 1),
                ':idmarca'          => (int) ($datos['idmarca'] ?? 1),
                ':idmodelo'         => (int) ($datos['idmodelo'] ?? 1),
                ':idcolor'          => (int) ($datos['idcolor'] ?? 1),
                ':idtalla'          => (int) ($datos['idtalla'] ?? 1),
                ':sku_base'         => $sku,
                ':codigo_barras'    => !empty($datos['codigo_barras']) ? $datos['codigo_barras'] : null,
                ':unidad_medida'    => $datos['unidad_medida'] ?? 'UND',
                ':estrellas'        => (string) ($datos['estrellas'] ?? '5'),
                ':imagen'           => $datos['imagen'] ?? 'sin-foto.png',
                ':idestatus'        => (int) ($datos['idestatus'] ?? 1),
            ]);

            $id = (int) $db->lastInsertId();

            if (str_starts_with($sku, 'TMP-')) {
                $sku = 'P-' . str_pad((string) $id, 5, '0', STR_PAD_LEFT);
                $upd = $db->prepare("UPDATE productos SET sku_base = :sku WHERE id = :id");
                $upd->execute([':sku' => $sku, ':id' => $id]);
            }

            $almacenId = !empty($datos['almacen_id']) ? (int) $datos['almacen_id'] : 1;
            $ubicacionId = !empty($datos['ubicacion_id']) ? (int) $datos['ubicacion_id'] : null;
            $stockInicial = max(0, (int) ($datos['stock_inicial'] ?? $datos['stock'] ?? 0));

            Inventario::asegurarProductoAlmacen($id, $almacenId);

            if ($stockInicial > 0) {
                Inventario::registrar([
                    'tipo'                => 'entrada',
                    'producto_id'         => $id,
                    'almacen_destino_id'  => $almacenId,
                    'ubicacion_destino_id'=> $ubicacionId,
                    'cantidad'            => $stockInicial,
                    'costo_unitario'      => (float) ($datos['costo'] ?? 0),
                    'referencia'          => 'Stock inicial',
                    'motivo'              => 'Registro de producto',
                ]);
            }

            $db->commit();
            return $id;
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

<<<<<<< HEAD
    /** Actualizar un producto (recibe el registro ya fusionado con el actual). */
    public static function actualizar(int $id, array $datos): bool
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $skuAnterior = null;
            $stmt = $db->prepare("SELECT sku_base FROM productos WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $skuAnterior = $stmt->fetchColumn();

            $sql = "UPDATE productos SET
                        producto_base_id = :producto_base_id,
                        nombre           = :nombre,
                        descripcion      = :descripcion,
                        precio           = :precio,
                        preciofull       = :preciofull,
                        costo            = :costo,
                        idcategoria      = :idcategoria,
                        idsubcategoria   = :idsubcategoria,
                        idmarca          = :idmarca,
                        idmodelo         = :idmodelo,
                        idcolor          = :idcolor,
                        idtalla          = :idtalla,
                        sku_base         = :sku_base,
                        codigo_barras    = :codigo_barras,
                        unidad_medida    = :unidad_medida,
                        estrellas        = :estrellas,
                        imagen           = :imagen,
                        idestatus        = :idestatus
                    WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':id'               => $id,
                ':producto_base_id' => !empty($datos['producto_base_id']) ? (int) $datos['producto_base_id'] : null,
                ':nombre'           => $datos['nombre'],
                ':descripcion'      => $datos['descripcion'] ?? null,
                ':precio'           => (float) $datos['precio'],
                ':preciofull'       => (float) ($datos['preciofull'] ?? $datos['precio']),
                ':costo'            => (float) ($datos['costo'] ?? 0),
                ':idcategoria'      => (int) ($datos['idcategoria'] ?? 1),
                ':idsubcategoria'   => (int) ($datos['idsubcategoria'] ?? 1),
                ':idmarca'          => (int) ($datos['idmarca'] ?? 1),
                ':idmodelo'         => (int) ($datos['idmodelo'] ?? 1),
                ':idcolor'          => (int) ($datos['idcolor'] ?? 1),
                ':idtalla'          => (int) ($datos['idtalla'] ?? 1),
                ':sku_base'         => $datos['sku_base'],
                ':codigo_barras'    => !empty($datos['codigo_barras']) ? $datos['codigo_barras'] : null,
                ':unidad_medida'    => $datos['unidad_medida'] ?? 'UND',
                ':estrellas'        => (string) ($datos['estrellas'] ?? '5'),
                ':imagen'           => $datos['imagen'] ?? 'sin-foto.png',
                ':idestatus'        => (int) ($datos['idestatus'] ?? 1),
            ]);

            // Mantener el SKU por almacen sincronizado con el SKU base.
            if ($skuAnterior !== false && $skuAnterior !== $datos['sku_base']) {
                $stmt = $db->prepare(
                    "SELECT pa.id, pa.almacen_id, a.codigo
                     FROM producto_almacen pa JOIN almacenes a ON a.id = pa.almacen_id
                     WHERE pa.producto_id = :p"
                );
                $stmt->execute([':p' => $id]);
                $upd = $db->prepare("UPDATE producto_almacen SET sku_almacen = :sku WHERE id = :id");
                foreach ($stmt->fetchAll() as $pa) {
                    $upd->execute([
                        ':sku' => $pa['codigo'] . '-' . $datos['sku_base'],
                        ':id'  => (int) $pa['id'],
                    ]);
                }
            }

            // Ajuste manual de stock (solo si el cliente lo envia explicitamente).
            if (array_key_exists('stock', $datos) && $datos['stock'] !== '' && $datos['stock'] !== null) {
                $nuevoStock = max(0, (int) $datos['stock']);
                $stmt = $db->prepare("SELECT stock FROM productos WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $id]);
                $stockActual = (int) $stmt->fetchColumn();

                if ($nuevoStock !== $stockActual) {
                    $almacenId = !empty($datos['almacen_id']) ? (int) $datos['almacen_id'] : 1;
                    $ubicacionId = !empty($datos['ubicacion_id'])
                        ? (int) $datos['ubicacion_id']
                        : Inventario::ubicacionDefault($almacenId);

                    if ($ubicacionId === null) {
                        throw new RuntimeException('El almacen seleccionado no tiene ubicaciones');
                    }

                    $delta = $nuevoStock - $stockActual;

                    // El ajuste se aplica sobre la ubicacion elegida, pero el
                    // objetivo se calcula desde el total para no duplicar stock.
                    $stmt = $db->prepare(
                        "SELECT cantidad FROM inventario WHERE producto_id = :p AND ubicacion_id = :u LIMIT 1"
                    );
                    $stmt->execute([':p' => $id, ':u' => $ubicacionId]);
                    $enUbicacion = $stmt->fetchColumn();
                    $enUbicacion = $enUbicacion === false ? 0 : (int) $enUbicacion;
                    $objetivoUbicacion = $enUbicacion + $delta;

                    if ($objetivoUbicacion < 0) {
                        throw new RuntimeException(
                            'El stock de la ubicacion seleccionada no permite reducir esa cantidad'
                        );
                    }

                    Inventario::asegurarProductoAlmacen($id, $almacenId);
                    Inventario::registrar([
                        'tipo'                 => 'ajuste',
                        'producto_id'          => $id,
                        'almacen_destino_id'   => $almacenId,
                        'ubicacion_destino_id' => $ubicacionId,
                        'cantidad'             => $objetivoUbicacion,
                        'costo_unitario'       => (float) ($datos['costo'] ?? 0),
                        'referencia'           => 'Ajuste manual',
                        'motivo'               => 'Cambio de stock desde el formulario (' . ($delta >= 0 ? '+' : '') . $delta . ')',
                    ]);
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

    /** Borrado logico: marca el producto como inactivo. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE productos SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Borrado fisico definitivo.
     * Las tablas relacionadas con ON DELETE CASCADE se limpian automaticamente
     * (producto_almacen, inventario, movimientos, items de pedido y carrito).
     */
    public static function eliminarFisico(int $id): bool
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
<<<<<<< HEAD
            $stmt = $db->prepare("DELETE FROM productos WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                throw new RuntimeException("Producto #{$id} no encontrado");
            }

            $db->commit();
            return true;
=======
            $stmt = $db->prepare("UPDATE productos SET idestatus = 2 WHERE id = :id");
            $stmt->execute([':id' => $id]);

            $stmtVar = $db->prepare("UPDATE producto_variantes SET idestatus = 2 WHERE producto_id = :id");
            $stmtVar->execute([':id' => $id]);

            $db->commit();
            return $stmt->rowCount() > 0;
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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

<<<<<<< HEAD
    /** Resumen general del inventario (valores a costo y a venta). */
=======
    /** Resumen general del inventario en una sola consulta. */
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    public static function resumenInventario(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT
<<<<<<< HEAD
                    COUNT(*)                                                AS total_productos,
                    COALESCE(SUM(p.stock), 0)                               AS total_unidades,
                    COALESCE(SUM(p.costo * p.stock), 0)                     AS valor_costo,
                    COALESCE(SUM(p.precio * p.stock), 0)                    AS valor_venta,
                    COALESCE(SUM(p.precio * p.stock), 0)                    AS valor_inventario,
                    SUM(CASE WHEN p.stock < 10 THEN 1 ELSE 0 END)           AS criticos,
                    SUM(CASE WHEN p.stock = 0  THEN 1 ELSE 0 END)           AS agotados,
                    COUNT(DISTINCT p.idmarca)                               AS total_marcas,
                    COUNT(DISTINCT p.idcategoria)                           AS total_categorias
                FROM productos p
                WHERE p.idestatus = 1";
        return $db->query($sql)->fetch();
    }

    /** Productos con stock por debajo del umbral (reposicion). */
    public static function stockCritico(int $umbral = 10): array
    {
        $db  = Database::conectar();
        $sql = "SELECT p.id, p.nombre, p.sku_base, p.stock, p.precio, p.costo,
                       c.nombre AS categoria, m.nombre AS marca,
                       co.nombre AS color, t.nombre AS talla
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN colores co   ON co.id = p.idcolor
                LEFT JOIN tallas t     ON t.id = p.idtalla
                WHERE p.idestatus = 1 AND p.stock < :umbral
                ORDER BY p.stock ASC
                LIMIT 200";
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        $stmt = $db->prepare($sql);
        $stmt->execute([':umbral' => $umbral]);
        return $stmt->fetchAll();
    }

    /** Valor del inventario agrupado por categoria. */
    public static function valorPorCategoria(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT c.nombre AS categoria,
<<<<<<< HEAD
                       COUNT(p.id) AS productos,
                       COALESCE(SUM(p.stock), 0) AS unidades,
                       COALESCE(SUM(p.costo * p.stock), 0) AS valor_costo,
                       COALESCE(SUM(p.precio * p.stock), 0) AS valor
                FROM categorias c
                LEFT JOIN productos p ON p.idcategoria = c.id AND p.idestatus = 1
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
                GROUP BY c.id, c.nombre
                ORDER BY valor DESC";
        return $db->query($sql)->fetchAll();
    }

<<<<<<< HEAD
    /** Stock total agrupado por almacen. */
    public static function stockPorAlmacen(): array
    {
        $db = Database::conectar();
        $sql = "SELECT a.id, a.codigo, a.nombre,
                       COUNT(DISTINCT i.producto_id) AS productos,
                       COALESCE(SUM(i.cantidad), 0)  AS unidades,
                       COALESCE(SUM(i.cantidad * p.costo), 0)  AS valor_costo,
                       COALESCE(SUM(i.cantidad * p.precio), 0) AS valor_venta
                FROM almacenes a
                LEFT JOIN ubicaciones u ON u.almacen_id = a.id
                LEFT JOIN inventario i  ON i.ubicacion_id = u.id
                LEFT JOIN productos p   ON p.id = i.producto_id
                WHERE a.idestatus = 1
                GROUP BY a.id, a.codigo, a.nombre
                ORDER BY a.nombre";
        return $db->query($sql)->fetchAll();
    }

    /** Valor del inventario por producto (a costo y a venta). */
    public static function valorInventario(): array
    {
        $db = Database::conectar();
        $sql = "SELECT p.id, p.nombre, p.sku_base, p.costo, p.precio, p.stock,
                       (p.stock * p.costo)  AS valor_costo,
                       (p.stock * p.precio) AS valor_venta
                FROM productos p
                WHERE p.idestatus = 1
                ORDER BY valor_costo DESC
                LIMIT 500";
        return $db->query($sql)->fetchAll();
    }

    /** Stock por ubicacion fisica. */
    public static function stockPorUbicacion(?int $almacenId = null): array
    {
        $db = Database::conectar();
        $sql = "SELECT a.codigo AS almacen_codigo, a.nombre AS almacen,
                       u.id AS ubicacion_id, u.codigo, u.ruta,
                       t.nombre AS tipo_ubicacion,
                       COUNT(i.producto_id) AS productos,
                       COALESCE(SUM(i.cantidad), 0) AS unidades
                FROM ubicaciones u
                JOIN almacenes a ON a.id = u.almacen_id
                JOIN tipos_ubicacion t ON t.id = u.idtipo_ubicacion
                LEFT JOIN inventario i ON i.ubicacion_id = u.id
                WHERE u.idestatus = 1";
        $params = [];
        if ($almacenId !== null && $almacenId > 0) {
            $sql .= " AND a.id = :alm";
            $params[':alm'] = $almacenId;
        }
        $sql .= " GROUP BY a.codigo, a.nombre, u.id, u.codigo, u.ruta, t.nombre
                  ORDER BY a.nombre, u.ruta";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    }
}
