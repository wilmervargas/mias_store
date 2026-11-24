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
                    p.id, p.producto_base_id, p.es_base, p.nombre, p.descripcion,
                    p.precio, p.preciofull, p.costo, p.stock, p.imagen,
                    p.estrellas, p.idestatus, p.idcategoria, p.idsubcategoria,
                    p.idmarca, p.idmodelo, p.idcolor, p.idtalla, p.idunidad,
                    p.sku_base, p.codigo_producto, p.codigo_detalle, p.codigo_barras, p.unidad_medida,
                    p.created_at, p.updated_at,
                    c.id AS idcategoria_ref, c.nombre AS categoria,
                    m.id AS idmarca_ref, m.nombre AS marca,
                    mo.nombre AS modelo,
                    co.nombre AS color, co.codigo_hex AS color_hex,
                    t.nombre AS talla,
                    un.nombre AS unidad, un.abreviatura AS unidad_abreviatura,
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
                LEFT JOIN tallas t     ON t.id = p.idtalla
                LEFT JOIN unidades un  ON un.id = p.idunidad";
    }

    public static function obtenerTodos(bool $soloActivos = true): array
    {
        $db  = Database::conectar();
        $where = $soloActivos ? "WHERE p.idestatus = 1 AND p.es_base = 0" : "WHERE p.es_base = 0";
        $sql = self::selectBase() . " {$where} ORDER BY p.id DESC";
        return $db->query($sql)->fetchAll();
    }

    /** Obtener un producto por su ID. Si es base o hijo, devuelve cabecera + filas. */
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

        $baseId = ((int) ($fila['es_base'] ?? 0) === 1)
            ? (int) $fila['id']
            : (!empty($fila['producto_base_id']) ? (int) $fila['producto_base_id'] : null);

        if ($baseId !== null) {
            $base = self::obtenerRegistroSimple($baseId);
            if ($base) {
                $base['filas'] = self::obtenerFilasPorBase($baseId);
                $base['stock_por_almacen'] = Inventario::stockPorAlmacen($baseId);
                $base['ubicaciones'] = self::inventarioPorUbicacion($baseId);
                return $base;
            }
        }

        // Producto standalone (sin base): exponerlo como cabecera + una fila para el modal nuevo.
        $fila['filas'] = [self::formatearFila($fila)];
        return $fila;
    }

    private static function obtenerRegistroSimple(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(self::selectBase() . " WHERE p.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    private static function obtenerFilasPorBase(int $baseId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(self::selectBase() . " WHERE p.producto_base_id = :base AND p.es_base = 0 ORDER BY p.id ASC");
        $stmt->execute([':base' => $baseId]);
        $hijos = $stmt->fetchAll();
        $filas = [];
        foreach ($hijos as $hijo) {
            $filas[] = self::formatearFila($hijo);
        }
        return $filas;
    }

    private static function formatearFila(array $p): array
    {
        $stockPorAlmacen = Inventario::stockPorAlmacen((int) $p['id']);
        $ubicaciones = self::inventarioPorUbicacion((int) $p['id']);
        $primeraUbic = $ubicaciones[0] ?? null;
        $primerAlmacen = $stockPorAlmacen[0] ?? null;

        return [
            'id' => (int) $p['id'],
            'producto_id' => (int) $p['id'],
            'almacen_id' => $primeraUbic['almacen_id'] ?? ($primerAlmacen['almacen_id'] ?? ''),
            'ubicacion_id' => $primeraUbic['ubicacion_id'] ?? '',
            'idcolor' => (int) ($p['idcolor'] ?? 1),
            'idtalla' => (int) ($p['idtalla'] ?? 1),
            'color' => $p['color'] ?? null,
            'color_hex' => $p['color_hex'] ?? null,
            'talla' => $p['talla'] ?? null,
            'codigo_barras' => $p['codigo_barras'] ?? '',
            'codigo_producto' => $p['codigo_producto'] ?? ($p['sku_base'] ?? ''),
            'codigo_detalle' => $p['codigo_detalle'] ?? '',
            'costo' => (float) ($p['costo'] ?? 0),
            'precio' => (float) ($p['precio'] ?? 0),
            'preciofull' => (float) ($p['preciofull'] ?? 0),
            'stock' => (int) ($p['stock'] ?? 0),
            'sku_base' => $p['sku_base'] ?? '',
            'sku_almacen' => $p['sku_almacen'] ?? '',
            'idestatus' => (int) ($p['idestatus'] ?? 1),
            'unidad_medida' => $p['unidad_medida'] ?? 'UND',
            'idunidad' => (int) ($p['idunidad'] ?? 1),
            'stock_por_almacen' => $stockPorAlmacen,
            'ubicaciones' => $ubicaciones,
        ];
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

    /** Busqueda avanzada con filtros combinables. */
    public static function buscar(array $f, bool $soloActivos = true): array
    {
        if (!empty($f['agrupado'])) {
            return self::buscarAgrupado($f, $soloActivos);
        }
        $db  = Database::conectar();
        $sql = self::selectBase() . " WHERE p.es_base = 0";
        $params = [];

        if (!empty($f['q'])) {
            $sql .= " AND (p.nombre LIKE :q1 OR m.nombre LIKE :q2 OR p.sku_base LIKE :q3
                        OR p.codigo_barras LIKE :q4 OR mo.nombre LIKE :q5
                        OR EXISTS (
                            SELECT 1 FROM productos pb
                            WHERE pb.id = p.producto_base_id
                              AND (pb.nombre LIKE :q6 OR pb.sku_base LIKE :q7)
                        ))";
            $term = '%' . $f['q'] . '%';
            $params[':q1'] = $term;
            $params[':q2'] = $term;
            $params[':q3'] = $term;
            $params[':q4'] = $term;
            $params[':q5'] = $term;
            $params[':q6'] = $term;
            $params[':q7'] = $term;
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

        $sql .= " ORDER BY p.producto_base_id DESC, p.id DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function buscarAgrupado(array $f, bool $soloActivos = true): array
    {
        $db = Database::conectar();
        $where = ["1=1"];
        $params = [];

        if ($soloActivos && (!isset($f['estatus']) || $f['estatus'] === '')) {
            $where[] = "p.idestatus = 1";
        } elseif (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[] = "p.idestatus = :estatus";
            $params[':estatus'] = (int) $f['estatus'];
        }

        if (!empty($f['q'])) {
            $where[] = "(p.nombre LIKE :q1 OR p.sku_base LIKE :q2 OR p.codigo_producto LIKE :q3 OR p.descripcion LIKE :q4
                        OR EXISTS (
                            SELECT 1 FROM productos h
                            LEFT JOIN marcas mh ON mh.id = h.idmarca
                            LEFT JOIN modelos moh ON moh.id = h.idmodelo
                            WHERE h.producto_base_id = p.id AND h.es_base = 0
                              AND (h.nombre LIKE :q5 OR h.codigo_detalle LIKE :q6 OR h.codigo_barras LIKE :q7 OR mh.nombre LIKE :q8 OR moh.nombre LIKE :q9)
                        ))";
            $term = '%' . $f['q'] . '%';
            foreach ([':q1',':q2',':q3',':q4',':q5',':q6',':q7',':q8',':q9'] as $k) $params[$k] = $term;
        }
        if (!empty($f['idcategoria'])) { $where[] = "p.idcategoria = :cat"; $params[':cat'] = (int)$f['idcategoria']; }
        if (!empty($f['idmarca'])) { $where[] = "p.idmarca = :mar"; $params[':mar'] = (int)$f['idmarca']; }
        if (!empty($f['idmodelo'])) { $where[] = "p.idmodelo = :mod"; $params[':mod'] = (int)$f['idmodelo']; }

        $having = [];
        if (!empty($f['idcolor'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND h2.idcolor=:col)"; $params[':col']=(int)$f['idcolor']; }
        if (!empty($f['idtalla'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND h2.idtalla=:tal)"; $params[':tal']=(int)$f['idtalla']; }
        if (!empty($f['almacen'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 JOIN producto_almacen pa ON pa.producto_id=h2.id WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND pa.almacen_id=:alm)"; $params[':alm']=(int)$f['almacen']; }
        if (isset($f['precioMin']) && $f['precioMin'] !== '') { $having[] = "MAX(h.precio) >= :pmin"; $params[':pmin']=(float)$f['precioMin']; }
        if (isset($f['precioMax']) && $f['precioMax'] !== '') { $having[] = "MIN(h.precio) <= :pmax"; $params[':pmax']=(float)$f['precioMax']; }
        if (isset($f['stockMin']) && $f['stockMin'] !== '') { $having[] = "COALESCE(SUM(h.stock),0) >= :smin"; $params[':smin']=(int)$f['stockMin']; }
        if (isset($f['solo_agotados']) && (int)$f['solo_agotados'] === 1) { $having[] = "COALESCE(SUM(h.stock),0) = 0"; }

        $sql = "SELECT
                    p.id, p.nombre, p.descripcion, p.sku_base, p.codigo_producto, p.imagen, p.idestatus,
                    p.idcategoria, p.idmarca, p.idmodelo, p.idunidad, p.unidad_medida,
                    c.nombre AS categoria, m.nombre AS marca, mo.nombre AS modelo,
                    un.abreviatura AS unidad_abreviatura,
                    COUNT(h.id) AS total_filas,
                    COALESCE(SUM(h.stock),0) AS stock_total,
                    MIN(h.precio) AS precio_min,
                    MAX(h.precio) AS precio_max,
                    MIN(h.costo) AS costo_min,
                    MAX(h.costo) AS costo_max,
                    GROUP_CONCAT(DISTINCT co.nombre ORDER BY co.nombre SEPARATOR ', ') AS colores,
                    GROUP_CONCAT(DISTINCT CONCAT(co.nombre, '~', COALESCE(co.codigo_hex, '')) ORDER BY co.nombre SEPARATOR '||') AS colores_detalle,
                    GROUP_CONCAT(DISTINCT ta.nombre ORDER BY ta.nombre SEPARATOR ', ') AS tallas,
                    GROUP_CONCAT(DISTINCT a.codigo ORDER BY a.codigo SEPARATOR ', ') AS almacenes_codigo
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.idcategoria
                LEFT JOIN marcas m ON m.id = p.idmarca
                LEFT JOIN modelos mo ON mo.id = p.idmodelo
                LEFT JOIN unidades un ON un.id = p.idunidad
                LEFT JOIN productos h ON h.producto_base_id = p.id AND h.es_base = 0
                LEFT JOIN colores co ON co.id = h.idcolor
                LEFT JOIN tallas ta ON ta.id = h.idtalla
                LEFT JOIN producto_almacen pa ON pa.producto_id = h.id
                LEFT JOIN almacenes a ON a.id = pa.almacen_id
                WHERE p.es_base = 1 AND " . implode(' AND ', $where) . "
                GROUP BY p.id, p.nombre, p.descripcion, p.sku_base, p.codigo_producto, p.imagen, p.idestatus,
                         p.idcategoria, p.idmarca, p.idmodelo, p.idunidad, p.unidad_medida,
                         c.nombre, m.nombre, mo.nombre, un.abreviatura";
        if ($having) $sql .= " HAVING " . implode(' AND ', $having);
        $sql .= " ORDER BY p.id DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $bases = $stmt->fetchAll();

        // Incluir productos legacy standalone (sin base, no es_base) como filas agrupadas simples
        $where2 = ["p.es_base = 0", "p.producto_base_id IS NULL"];
        $params2 = [];
        if ($soloActivos && (!isset($f['estatus']) || $f['estatus'] === '')) $where2[] = "p.idestatus = 1";
        elseif (isset($f['estatus']) && $f['estatus'] !== '') { $where2[] = "p.idestatus = :estatus"; $params2[':estatus'] = (int)$f['estatus']; }
        if (!empty($f['q'])) { $where2[] = "(p.nombre LIKE :q OR p.sku_base LIKE :q2 OR p.codigo_producto LIKE :q3 OR p.codigo_barras LIKE :q4)"; $term='%'.$f['q'].'%'; $params2[':q']=$term;$params2[':q2']=$term;$params2[':q3']=$term;$params2[':q4']=$term; }
        if (!empty($f['idcategoria'])) { $where2[]="p.idcategoria=:cat"; $params2[':cat']=(int)$f['idcategoria']; }
        if (!empty($f['idmarca'])) { $where2[]="p.idmarca=:mar"; $params2[':mar']=(int)$f['idmarca']; }
        if (!empty($f['idmodelo'])) { $where2[]="p.idmodelo=:mod"; $params2[':mod']=(int)$f['idmodelo']; }
        if (!empty($f['idcolor'])) { $where2[]="p.idcolor=:col"; $params2[':col']=(int)$f['idcolor']; }
        if (!empty($f['idtalla'])) { $where2[]="p.idtalla=:tal"; $params2[':tal']=(int)$f['idtalla']; }
        if (!empty($f['almacen'])) { $where2[]="EXISTS (SELECT 1 FROM producto_almacen pa2 WHERE pa2.producto_id=p.id AND pa2.almacen_id=:alm)"; $params2[':alm']=(int)$f['almacen']; }
        if (isset($f['precioMin']) && $f['precioMin']!=='') { $where2[]="p.precio>=:pmin"; $params2[':pmin']=(float)$f['precioMin']; }
        if (isset($f['precioMax']) && $f['precioMax']!=='') { $where2[]="p.precio<=:pmax"; $params2[':pmax']=(float)$f['precioMax']; }
        if (isset($f['stockMin']) && $f['stockMin']!=='') { $where2[]="p.stock>=:smin"; $params2[':smin']=(int)$f['stockMin']; }
        if (isset($f['solo_agotados']) && (int)$f['solo_agotados']===1) { $where2[]="p.stock=0"; }

        $sql2 = "SELECT p.id,p.nombre,p.descripcion,p.sku_base,p.codigo_producto,p.imagen,p.idestatus,p.idcategoria,p.idmarca,p.idmodelo,p.idunidad,p.unidad_medida,
                        c.nombre AS categoria,m.nombre AS marca,mo.nombre AS modelo,un.abreviatura AS unidad_abreviatura,
                        1 AS total_filas, p.stock AS stock_total, p.precio AS precio_min, p.precio AS precio_max, p.costo AS costo_min, p.costo AS costo_max,
                        co.nombre AS colores, CONCAT(co.nombre, '~', COALESCE(co.codigo_hex, '')) AS colores_detalle, ta.nombre AS tallas,
                        (SELECT GROUP_CONCAT(DISTINCT a2.codigo ORDER BY a2.codigo SEPARATOR ', ') FROM producto_almacen pa2 JOIN almacenes a2 ON a2.id=pa2.almacen_id WHERE pa2.producto_id=p.id) AS almacenes_codigo
                 FROM productos p
                 LEFT JOIN categorias c ON c.id=p.idcategoria
                 LEFT JOIN marcas m ON m.id=p.idmarca
                 LEFT JOIN modelos mo ON mo.id=p.idmodelo
                 LEFT JOIN unidades un ON un.id=p.idunidad
                 LEFT JOIN colores co ON co.id=p.idcolor
                 LEFT JOIN tallas ta ON ta.id=p.idtalla
                 WHERE " . implode(' AND ', $where2) . "
                 ORDER BY p.id DESC LIMIT 500";
        $stmt2 = $db->prepare($sql2);
        $stmt2->execute($params2);
        $standalone = $stmt2->fetchAll();

        $all = array_merge($bases, $standalone);
        usort($all, fn($a,$b) => ((int)$b['id']) <=> ((int)$a['id']));
        return array_slice($all, 0, 500);
    }

    private static function resolverUnidad(PDO $db, array $datos): array
    {
        $idunidad = (int) ($datos['idunidad'] ?? 1);
        $unidadMedida = trim((string) ($datos['unidad_medida'] ?? ''));
        if ($idunidad > 0) {
            $stmtU = $db->prepare("SELECT abreviatura FROM unidades WHERE id = :id LIMIT 1");
            $stmtU->execute([':id' => $idunidad]);
            $abrev = $stmtU->fetchColumn();
            if ($abrev) $unidadMedida = (string) $abrev;
        }
        if ($unidadMedida === '') $unidadMedida = 'UND';
        return [$idunidad > 0 ? $idunidad : 1, $unidadMedida];
    }

    private static function generarSkuBase(PDO $db, ?string $sku, string $prefijo = 'P-'): string
    {
        $sku = trim((string) ($sku ?? ''));
        if ($sku !== '') return $sku;
        return 'TMP-' . strtoupper(bin2hex(random_bytes(6)));
    }

    private static function finalizarSku(PDO $db, int $id, string $sku, string $prefijo = 'P-'): string
    {
        if (str_starts_with($sku, 'TMP-')) {
            $sku = $prefijo . str_pad((string) $id, 5, '0', STR_PAD_LEFT);
            $upd = $db->prepare("UPDATE productos SET sku_base = :sku WHERE id = :id");
            $upd->execute([':sku' => $sku, ':id' => $id]);
        }
        return $sku;
    }

    private static function insertarProducto(PDO $db, array $datos, bool $esBase): int
    {
        [$idunidad, $unidadMedida] = self::resolverUnidad($db, $datos);
        $sku = self::generarSkuBase($db, $datos['sku_base'] ?? null, $esBase ? 'P-' : 'P-');
        $precio = (float) ($datos['precio'] ?? 0);
        if ($esBase && $precio <= 0) $precio = 0;

        $codigoProducto = trim((string) ($datos['codigo_producto'] ?? ''));
        $codigoDetalle = trim((string) ($datos['codigo_detalle'] ?? ''));

        $sql = "INSERT INTO productos
                (producto_base_id, es_base, nombre, descripcion, precio, preciofull, costo,
                 stock, idcategoria, idsubcategoria, idmarca, idmodelo, idcolor, idtalla, idunidad,
                 sku_base, codigo_producto, codigo_detalle, codigo_barras, unidad_medida, estrellas, imagen, idestatus)
                VALUES
                (:producto_base_id, :es_base, :nombre, :descripcion, :precio, :preciofull, :costo,
                 0, :idcategoria, :idsubcategoria, :idmarca, :idmodelo, :idcolor, :idtalla, :idunidad,
                 :sku_base, :codigo_producto, :codigo_detalle, :codigo_barras, :unidad_medida, :estrellas, :imagen, :idestatus)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':producto_base_id' => !empty($datos['producto_base_id']) ? (int) $datos['producto_base_id'] : null,
            ':es_base'          => $esBase ? 1 : 0,
            ':nombre'           => $datos['nombre'],
            ':descripcion'      => $datos['descripcion'] ?? null,
            ':precio'           => $precio,
            ':preciofull'       => (float) ($datos['preciofull'] ?? ($precio > 0 ? $precio : 0)),
            ':costo'            => (float) ($datos['costo'] ?? 0),
            ':idcategoria'      => (int) ($datos['idcategoria'] ?? 1),
            ':idsubcategoria'   => (int) ($datos['idsubcategoria'] ?? 1),
            ':idmarca'          => (int) ($datos['idmarca'] ?? 1),
            ':idmodelo'         => (int) ($datos['idmodelo'] ?? 1),
            ':idcolor'          => (int) ($datos['idcolor'] ?? 1),
            ':idtalla'          => (int) ($datos['idtalla'] ?? 1),
            ':idunidad'         => $idunidad,
            ':sku_base'         => $sku,
            ':codigo_producto'  => $codigoProducto !== '' ? $codigoProducto : null,
            ':codigo_detalle'   => $codigoDetalle !== '' ? $codigoDetalle : null,
            ':codigo_barras'    => !empty($datos['codigo_barras']) ? trim((string) $datos['codigo_barras']) : null,
            ':unidad_medida'    => $unidadMedida,
            ':estrellas'        => (string) ($datos['estrellas'] ?? '5'),
            ':imagen'           => $datos['imagen'] ?? 'sin-foto.png',
            ':idestatus'        => (int) ($datos['idestatus'] ?? 1),
        ]);

        $id = (int) $db->lastInsertId();
        $skuFinal = self::finalizarSku($db, $id, $sku, 'P-');

        // Asegurar codigo_producto / codigo_detalle
        if ($codigoProducto === '') {
            $codigoProducto = $skuFinal;
        }
        if ($esBase) {
            $codigoDetalle = null;
        } elseif ($codigoDetalle === '') {
            $codigoDetalle = $codigoProducto . '-D' . str_pad((string) $id, 2, '0', STR_PAD_LEFT);
        }
        $upd = $db->prepare("UPDATE productos SET codigo_producto = :cp, codigo_detalle = :cd WHERE id = :id");
        $upd->execute([':cp' => $codigoProducto, ':cd' => $codigoDetalle, ':id' => $id]);

        return $id;
    }

    private static function actualizarProductoRow(PDO $db, int $id, array $datos, bool $esBase): void
    {
        [$idunidad, $unidadMedida] = self::resolverUnidad($db, $datos);
        $precio = (float) ($datos['precio'] ?? 0);
        if ($esBase && $precio < 0) $precio = 0;

        $codigoProducto = trim((string) ($datos['codigo_producto'] ?? $datos['sku_base'] ?? ''));
        $codigoDetalle = trim((string) ($datos['codigo_detalle'] ?? ''));
        if ($esBase) $codigoDetalle = '';

        $sql = "UPDATE productos SET
                    producto_base_id = :producto_base_id,
                    es_base          = :es_base,
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
                    idunidad         = :idunidad,
                    sku_base         = :sku_base,
                    codigo_producto  = :codigo_producto,
                    codigo_detalle   = :codigo_detalle,
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
            ':es_base'          => $esBase ? 1 : 0,
            ':nombre'           => $datos['nombre'],
            ':descripcion'      => $datos['descripcion'] ?? null,
            ':precio'           => $precio,
            ':preciofull'       => (float) ($datos['preciofull'] ?? ($precio > 0 ? $precio : 0)),
            ':costo'            => (float) ($datos['costo'] ?? 0),
            ':idcategoria'      => (int) ($datos['idcategoria'] ?? 1),
            ':idsubcategoria'   => (int) ($datos['idsubcategoria'] ?? 1),
            ':idmarca'          => (int) ($datos['idmarca'] ?? 1),
            ':idmodelo'         => (int) ($datos['idmodelo'] ?? 1),
            ':idcolor'          => (int) ($datos['idcolor'] ?? 1),
            ':idtalla'          => (int) ($datos['idtalla'] ?? 1),
            ':idunidad'         => $idunidad,
            ':sku_base'         => $datos['sku_base'],
            ':codigo_producto'  => $codigoProducto !== '' ? $codigoProducto : null,
            ':codigo_detalle'   => $codigoDetalle !== '' ? $codigoDetalle : null,
            ':codigo_barras'    => !empty($datos['codigo_barras']) ? trim((string) $datos['codigo_barras']) : null,
            ':unidad_medida'    => $unidadMedida,
            ':estrellas'        => (string) ($datos['estrellas'] ?? '5'),
            ':imagen'           => $datos['imagen'] ?? 'sin-foto.png',
            ':idestatus'        => (int) ($datos['idestatus'] ?? 1),
        ]);
    }

    private static function sincronizarSkuAlmacen(PDO $db, int $productoId, string $skuBase): void
    {
        $stmt = $db->prepare(
            "SELECT pa.id, pa.almacen_id, a.codigo
             FROM producto_almacen pa JOIN almacenes a ON a.id = pa.almacen_id
             WHERE pa.producto_id = :p"
        );
        $stmt->execute([':p' => $productoId]);
        $upd = $db->prepare("UPDATE producto_almacen SET sku_almacen = :sku WHERE id = :id");
        foreach ($stmt->fetchAll() as $pa) {
            $skuAlmacen = $pa['codigo'] . '-' . $skuBase;
            $existe = $db->prepare("SELECT 1 FROM producto_almacen WHERE sku_almacen = :s AND id <> :id LIMIT 1");
            $existe->execute([':s' => $skuAlmacen, ':id' => (int) $pa['id']]);
            if ($existe->fetchColumn()) $skuAlmacen .= '-' . $productoId;
            $upd->execute([':sku' => $skuAlmacen, ':id' => (int) $pa['id']]);
        }
    }

    private static function aplicarStockFila(PDO $db, int $productoId, array $fila, bool $esNuevo, float $costo): void
    {
        $almacenId = !empty($fila['almacen_id']) ? (int) $fila['almacen_id'] : 0;
        $ubicacionId = !empty($fila['ubicacion_id']) ? (int) $fila['ubicacion_id'] : null;
        $stockDeseado = max(0, (int) ($fila['stock'] ?? $fila['stock_inicial'] ?? 0));

        if ($almacenId <= 0) {
            return;
        }

        if ($ubicacionId !== null) {
            $almacenUbic = Inventario::almacenDeUbicacion($ubicacionId);
            if ($almacenUbic !== $almacenId) {
                throw new RuntimeException('La ubicacion seleccionada no pertenece al almacen indicado');
            }
        } else {
            $ubicacionId = Inventario::ubicacionDefault($almacenId);
        }

        if ($ubicacionId === null) {
            throw new RuntimeException('El almacen seleccionado no tiene ubicaciones');
        }

        Inventario::asegurarProductoAlmacen($productoId, $almacenId);

        $stmt = $db->prepare("SELECT stock FROM productos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $productoId]);
        $stockActual = (int) $stmt->fetchColumn();

        if ($esNuevo) {
            if ($stockDeseado > 0) {
                Inventario::registrar([
                    'tipo'                 => 'entrada',
                    'producto_id'          => $productoId,
                    'almacen_destino_id'   => $almacenId,
                    'ubicacion_destino_id' => $ubicacionId,
                    'cantidad'             => $stockDeseado,
                    'costo_unitario'       => $costo,
                    'referencia'           => 'Stock inicial',
                    'motivo'               => 'Registro de producto',
                ]);
            }
            return;
        }

        if ($stockDeseado === $stockActual) {
            return;
        }

        $stmt = $db->prepare("SELECT cantidad FROM inventario WHERE producto_id = :p AND ubicacion_id = :u LIMIT 1");
        $stmt->execute([':p' => $productoId, ':u' => $ubicacionId]);
        $enUbicacion = $stmt->fetchColumn();
        $enUbicacion = $enUbicacion === false ? 0 : (int) $enUbicacion;
        $delta = $stockDeseado - $stockActual;
        $objetivoUbicacion = $enUbicacion + $delta;

        if ($objetivoUbicacion < 0) {
            throw new RuntimeException('El stock de la ubicacion seleccionada no permite reducir esa cantidad');
        }

        Inventario::registrar([
            'tipo'                 => 'ajuste',
            'producto_id'          => $productoId,
            'almacen_destino_id'   => $almacenId,
            'ubicacion_destino_id' => $ubicacionId,
            'cantidad'             => $objetivoUbicacion,
            'costo_unitario'       => $costo,
            'referencia'           => 'Ajuste manual',
            'motivo'               => 'Cambio de stock desde el formulario (' . ($delta >= 0 ? '+' : '') . $delta . ')',
        ]);
    }

    private static function normalizarFilas(array $datos): array
    {
        $filas = $datos['filas'] ?? null;
        if (is_array($filas) && count($filas) > 0) {
            return array_values($filas);
        }

        // Compatibilidad con payload antiguo de una sola fila.
        $tieneStock = isset($datos['stock_inicial']) || isset($datos['stock']) || !empty($datos['almacen_id']);
        $tieneVariante = isset($datos['idcolor']) || isset($datos['idtalla']) || isset($datos['precio']) || isset($datos['codigo_barras']);
        if ($tieneStock || $tieneVariante) {
            return [[
                'id' => $datos['fila_id'] ?? null,
                'almacen_id' => $datos['almacen_id'] ?? null,
                'ubicacion_id' => $datos['ubicacion_id'] ?? null,
                'idcolor' => $datos['idcolor'] ?? 1,
                'idtalla' => $datos['idtalla'] ?? 1,
                'codigo_barras' => $datos['codigo_barras'] ?? null,
                'costo' => $datos['costo'] ?? 0,
                'precio' => $datos['precio'] ?? 0,
                'preciofull' => $datos['preciofull'] ?? ($datos['precio'] ?? 0),
                'stock' => $datos['stock'] ?? ($datos['stock_inicial'] ?? 0),
                'stock_inicial' => $datos['stock_inicial'] ?? null,
                'idestatus' => $datos['idestatus'] ?? 1,
            ]];
        }

        return [];
    }

    /** Crear producto base + filas/SKUs por almacen. */
    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $filas = self::normalizarFilas($datos);
            if (count($filas) === 0) {
                throw new InvalidArgumentException('Debes agregar al menos una fila de almacen/variante');
            }

            $baseData = $datos;
            $baseData['producto_base_id'] = null;
            $baseData['es_base'] = 1;
            $baseData['precio'] = 0;
            $baseData['preciofull'] = 0;
            $baseData['costo'] = 0;
            $baseData['codigo_barras'] = null;
            $baseData['idcolor'] = 1;
            $baseData['idtalla'] = 1;
            $baseId = self::insertarProducto($db, $baseData, true);
            $baseRow = self::obtenerRegistroSimple($baseId);
            $codigoProducto = trim((string) ($baseRow['codigo_producto'] ?? $baseRow['sku_base'] ?? ''));

            foreach ($filas as $idx => $fila) {
                $filaData = array_merge($datos, $fila);
                $filaData['producto_base_id'] = $baseId;
                $filaData['es_base'] = 0;
                $filaData['nombre'] = $datos['nombre'];
                $filaData['descripcion'] = $datos['descripcion'] ?? null;
                $filaData['idcategoria'] = $datos['idcategoria'] ?? 1;
                $filaData['idsubcategoria'] = $datos['idsubcategoria'] ?? 1;
                $filaData['idmarca'] = $datos['idmarca'] ?? 1;
                $filaData['idmodelo'] = $datos['idmodelo'] ?? 1;
                $filaData['idunidad'] = $datos['idunidad'] ?? 1;
                $filaData['unidad_medida'] = $datos['unidad_medida'] ?? 'UND';
                $filaData['imagen'] = $datos['imagen'] ?? 'sin-foto.png';
                $filaData['sku_base'] = trim((string) ($fila['sku_base'] ?? ''));
                if ($filaData['sku_base'] === '') {
                    $filaData['sku_base'] = 'TMP-' . strtoupper(bin2hex(random_bytes(5))) . '-' . ($idx + 1);
                }
                $filaData['codigo_producto'] = $codigoProducto;
                $filaData['codigo_detalle'] = trim((string) ($fila['codigo_detalle'] ?? ''));

                $hijoId = self::insertarProducto($db, $filaData, false);
                self::aplicarStockFila($db, $hijoId, $fila, true, (float) ($filaData['costo'] ?? 0));
            }

            $db->commit();
            return $baseId;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /** Actualizar producto base y reconciliar filas/SKUs. */
    public static function actualizar(int $id, array $datos): bool
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerRegistroSimple($id);
            if (!$actual) {
                throw new RuntimeException("Producto #{$id} no encontrado");
            }

            $esBase = (int) ($actual['es_base'] ?? 0) === 1;
            $baseId = $esBase ? $id : (int) ($actual['producto_base_id'] ?: $id);

            // Si es un SKU standalone antiguo, convertirlo a base+fila para el nuevo modelo.
            if (!$esBase && empty($actual['producto_base_id'])) {
                $baseId = self::convertirStandaloneABase($db, $actual);
                $esBaseTarget = true;
            } else {
                $esBaseTarget = true;
            }

            $baseActual = self::obtenerRegistroSimple($baseId);
            if (!$baseActual) {
                throw new RuntimeException('Producto base no encontrado');
            }

            $filas = self::normalizarFilas($datos);
            if (count($filas) === 0) {
                throw new InvalidArgumentException('Debes incluir al menos una fila de almacen/variante');
            }

            $baseData = array_merge($baseActual, $datos);
            $baseData['producto_base_id'] = null;
            $baseData['es_base'] = 1;
            $baseData['precio'] = 0;
            $baseData['preciofull'] = 0;
            $baseData['costo'] = 0;
            $baseData['codigo_barras'] = null;
            $baseData['idcolor'] = 1;
            $baseData['idtalla'] = 1;
            $baseData['sku_base'] = $baseActual['sku_base'];
            $codigoProducto = trim((string) ($datos['sku_base'] ?? $datos['codigo_producto'] ?? $baseActual['codigo_producto'] ?? $baseActual['sku_base'] ?? ''));
            $baseData['sku_base'] = $codigoProducto !== '' ? $codigoProducto : $baseActual['sku_base'];
            $baseData['codigo_producto'] = $baseData['sku_base'];
            $baseData['codigo_detalle'] = null;
            self::actualizarProductoRow($db, $baseId, $baseData, true);
            $baseRow = self::obtenerRegistroSimple($baseId);
            $codigoProducto = trim((string) ($baseRow['codigo_producto'] ?? $baseData['codigo_producto'] ?? ''));

            $existentes = $db->prepare("SELECT id, sku_base, codigo_producto, codigo_detalle, stock FROM productos WHERE producto_base_id = :base AND es_base = 0");
            $existentes->execute([':base' => $baseId]);
            $mapExistentes = [];
            foreach ($existentes->fetchAll() as $row) {
                $mapExistentes[(int) $row['id']] = $row;
            }

            $idsRecibidos = [];

            foreach ($filas as $idx => $fila) {
                $filaId = !empty($fila['id']) ? (int) $fila['id'] : (!empty($fila['producto_id']) ? (int) $fila['producto_id'] : 0);
                $esNuevo = $filaId <= 0 || !isset($mapExistentes[$filaId]);

                $filaData = array_merge($baseData, $fila);
                $filaData['producto_base_id'] = $baseId;
                $filaData['es_base'] = 0;
                $filaData['nombre'] = $datos['nombre'] ?? $baseActual['nombre'];
                $filaData['descripcion'] = $datos['descripcion'] ?? $baseActual['descripcion'];
                $filaData['idcategoria'] = $datos['idcategoria'] ?? $baseActual['idcategoria'];
                $filaData['idsubcategoria'] = $datos['idsubcategoria'] ?? $baseActual['idsubcategoria'];
                $filaData['idmarca'] = $datos['idmarca'] ?? $baseActual['idmarca'];
                $filaData['idmodelo'] = $datos['idmodelo'] ?? $baseActual['idmodelo'];
                $filaData['idunidad'] = $datos['idunidad'] ?? $baseActual['idunidad'];
                $filaData['unidad_medida'] = $datos['unidad_medida'] ?? $baseActual['unidad_medida'];
                $filaData['imagen'] = $baseActual['imagen'] ?? 'sin-foto.png';
                $filaData['codigo_producto'] = $codigoProducto;

                if ($esNuevo) {
                    $filaData['sku_base'] = trim((string) ($fila['sku_base'] ?? ''));
                    if ($filaData['sku_base'] === '') {
                        $filaData['sku_base'] = 'TMP-' . strtoupper(bin2hex(random_bytes(5))) . '-' . ($idx + 1);
                    }
                    $filaData['codigo_detalle'] = trim((string) ($fila['codigo_detalle'] ?? ''));
                    $hijoId = self::insertarProducto($db, $filaData, false);
                    self::aplicarStockFila($db, $hijoId, $fila, true, (float) ($filaData['costo'] ?? 0));
                    $idsRecibidos[] = $hijoId;
                } else {
                    $actualHijo = self::obtenerRegistroSimple($filaId);
                    if (!$actualHijo) {
                        throw new RuntimeException("La fila #{$filaId} no existe");
                    }
                    $filaData['sku_base'] = $actualHijo['sku_base'];
                    $filaData['codigo_detalle'] = trim((string) ($fila['codigo_detalle'] ?? $actualHijo['codigo_detalle'] ?? ''));
                    if ($filaData['codigo_detalle'] === '') {
                        $filaData['codigo_detalle'] = $codigoProducto . '-D' . str_pad((string) $filaId, 2, '0', STR_PAD_LEFT);
                    }
                    $filaData['imagen'] = $actualHijo['imagen'] ?? $baseActual['imagen'] ?? 'sin-foto.png';
                    self::actualizarProductoRow($db, $filaId, $filaData, false);
                    self::aplicarStockFila($db, $filaId, $fila, false, (float) ($filaData['costo'] ?? 0));
                    $idsRecibidos[] = $filaId;
                }
            }

            // Filas ausentes: no borrar automáticamente por seguridad. Si no vinieron, se dejan como están.
            // (Evita eliminación accidental de SKUs con historial).

            $db->commit();
            return true;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    private static function convertirStandaloneABase(PDO $db, array $actual): int
    {
        $baseData = $actual;
        $baseData['producto_base_id'] = null;
        $baseData['es_base'] = 1;
        $baseData['precio'] = 0;
        $baseData['preciofull'] = 0;
        $baseData['costo'] = 0;
        $baseData['codigo_barras'] = null;
        $baseData['idcolor'] = 1;
        $baseData['idtalla'] = 1;
        $baseData['sku_base'] = 'TMP-' . strtoupper(bin2hex(random_bytes(6)));
        $baseId = self::insertarProducto($db, $baseData, true);

        $upd = $db->prepare("UPDATE productos SET producto_base_id = :base, es_base = 0 WHERE id = :id");
        $upd->execute([':base' => $baseId, ':id' => (int) $actual['id']]);
        return $baseId;
    }

    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE productos SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

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

    public static function setImagen(int $id, string $imagen): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE productos SET imagen = :imagen WHERE id = :id");
        return $stmt->execute([':imagen' => $imagen, ':id' => $id]);
    }

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
                WHERE p.idestatus = 1 AND p.es_base = 0";
        return $db->query($sql)->fetch();
    }

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
                WHERE p.idestatus = 1 AND p.es_base = 0 AND p.stock < :umbral
                ORDER BY p.stock ASC
                LIMIT 200";
        $stmt = $db->prepare($sql);
        $stmt->execute([':umbral' => $umbral]);
        return $stmt->fetchAll();
    }

    public static function valorPorCategoria(): array
    {
        $db  = Database::conectar();
        $sql = "SELECT c.nombre AS categoria,
                       COUNT(p.id) AS productos,
                       COALESCE(SUM(p.stock), 0) AS unidades,
                       COALESCE(SUM(p.costo * p.stock), 0) AS valor_costo,
                       COALESCE(SUM(p.precio * p.stock), 0) AS valor
                FROM categorias c
                LEFT JOIN productos p ON p.idcategoria = c.id AND p.idestatus = 1 AND p.es_base = 0
                GROUP BY c.id, c.nombre
                ORDER BY valor DESC";
        return $db->query($sql)->fetchAll();
    }

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
                LEFT JOIN productos p   ON p.id = i.producto_id AND p.es_base = 0
                WHERE a.idestatus = 1
                GROUP BY a.id, a.codigo, a.nombre
                ORDER BY a.nombre";
        return $db->query($sql)->fetchAll();
    }

    public static function valorInventario(): array
    {
        $db = Database::conectar();
        $sql = "SELECT p.id, p.nombre, p.sku_base, p.costo, p.precio, p.stock,
                       (p.stock * p.costo)  AS valor_costo,
                       (p.stock * p.precio) AS valor_venta
                FROM productos p
                WHERE p.idestatus = 1 AND p.es_base = 0
                ORDER BY valor_costo DESC
                LIMIT 500";
        return $db->query($sql)->fetchAll();
    }

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
                LEFT JOIN productos p ON p.id = i.producto_id AND p.es_base = 0
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
