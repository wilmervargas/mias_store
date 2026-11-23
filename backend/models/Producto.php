<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
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
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m     ON m.id = p.idmarca
                LEFT JOIN modelos mo   ON mo.id = p.idmodelo
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
        return $stmt->fetchAll();
    }

    /**
     * Busqueda avanzada con filtros combinables.
     */
    public static function buscar(array $f, bool $soloActivos = true): array
    {
        $db  = Database::conectar();
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
        if (!empty($f['idcolor'])) {
            $sql .= " AND p.idcolor = :col";
            $params[':col'] = (int) $f['idcolor'];
        }
        if (!empty($f['idtalla'])) {
            $sql .= " AND p.idtalla = :tal";
            $params[':tal'] = (int) $f['idtalla'];
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

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Insertar un producto y, si se indica, su stock inicial en un almacen.
     * Todo ocurre en una transaccion.
     */
    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
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
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

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
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("DELETE FROM productos WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                throw new RuntimeException("Producto #{$id} no encontrado");
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

    /** Asociar el nombre del archivo de imagen a un producto. */
    public static function setImagen(int $id, string $imagen): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE productos SET imagen = :imagen WHERE id = :id");
        return $stmt->execute([':imagen' => $imagen, ':id' => $id]);
    }

    /** Resumen general del inventario (valores a costo y a venta). */
    public static function resumenInventario(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT
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
        $stmt = $db->prepare($sql);
        $stmt->execute([':umbral' => $umbral]);
        return $stmt->fetchAll();
    }

    /** Valor del inventario agrupado por categoria. */
    public static function valorPorCategoria(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT c.nombre AS categoria,
                       COUNT(p.id) AS productos,
                       COALESCE(SUM(p.stock), 0) AS unidades,
                       COALESCE(SUM(p.costo * p.stock), 0) AS valor_costo,
                       COALESCE(SUM(p.precio * p.stock), 0) AS valor
                FROM categorias c
                LEFT JOIN productos p ON p.idcategoria = c.id AND p.idestatus = 1
                GROUP BY c.id, c.nombre
                ORDER BY valor DESC";
        return $db->query($sql)->fetchAll();
    }

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
    }
}
