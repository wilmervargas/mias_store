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
                    p.precio, p.preciofull, p.costo, p.stock, p.stock_inicial, p.stock_minimo, p.stock_maximo, p.imagen,
                    p.estrellas, p.idestatus, p.idcategoria, p.idsubcategoria,
                    p.idmarca, p.idmodelo, p.idcolor, p.idtalla, p.idunidad,
                    p.sku_base, p.codigo_producto, p.codigo_detalle, p.codigo_barras, p.unidad_medida,
                    p.created_at, p.updated_at,
                    c.id AS idcategoria_ref, c.nombre AS categoria,
                    sc.nombre AS subcategoria,
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
                LEFT JOIN subcategorias sc ON sc.id = p.idsubcategoria
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
            'stock_inicial' => (int) ($p['stock_inicial'] ?? 0),
            'stock_minimo' => (int) ($p['stock_minimo'] ?? 0),
            'stock_maximo' => $p['stock_maximo'] !== null && $p['stock_maximo'] !== '' ? (int) $p['stock_maximo'] : null,
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
             WHERE i.producto_id = :p AND i.cantidad > 0
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
        if (!empty($f['idsubcategoria'])) {
            $sql .= " AND p.idsubcategoria = :subcat";
            $params[':subcat'] = (int) $f['idsubcategoria'];
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
        if (!empty($f['idsubcategoria'])) { $where[] = "p.idsubcategoria = :subcat"; $params[':subcat'] = (int)$f['idsubcategoria']; }
        if (!empty($f['idmarca'])) { $where[] = "p.idmarca = :mar"; $params[':mar'] = (int)$f['idmarca']; }
        if (!empty($f['idmodelo'])) { $where[] = "p.idmodelo = :mod"; $params[':mod'] = (int)$f['idmodelo']; }
        if (!empty($f['idunidad'])) { $where[] = "p.idunidad = :uni"; $params[':uni'] = (int)$f['idunidad']; }

        $having = [];
        if (!empty($f['idcolor'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND h2.idcolor=:col)"; $params[':col']=(int)$f['idcolor']; }
        if (!empty($f['idtalla'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND h2.idtalla=:tal)"; $params[':tal']=(int)$f['idtalla']; }
        if (!empty($f['almacen'])) { $where[] = "EXISTS (SELECT 1 FROM productos h2 JOIN producto_almacen pa ON pa.producto_id=h2.id WHERE h2.producto_base_id=p.id AND h2.es_base=0 AND pa.almacen_id=:alm)"; $params[':alm']=(int)$f['almacen']; }
        if (isset($f['precioMin']) && $f['precioMin'] !== '') { $having[] = "MAX(h.precio) >= :pmin"; $params[':pmin']=(float)$f['precioMin']; }
        if (isset($f['precioMax']) && $f['precioMax'] !== '') { $having[] = "MIN(h.precio) <= :pmax"; $params[':pmax']=(float)$f['precioMax']; }
        if (isset($f['stockMin']) && $f['stockMin'] !== '') { $having[] = "stock_total >= :smin"; $params[':smin']=(int)$f['stockMin']; }
        if (isset($f['solo_agotados']) && (int)$f['solo_agotados'] === 1) { $having[] = "stock_total = 0"; }

        $stockEstado = trim((string) ($f['stock_estado'] ?? ''));
        if ($stockEstado === 'con_stock') { $having[] = "stock_total > 0"; }
        elseif ($stockEstado === 'sin_stock') { $having[] = "stock_total = 0"; }
        elseif ($stockEstado === 'bajo_stock') { $having[] = "stock_total > 0 AND stock_total < 10"; }

        $sql = "SELECT
                    p.id, p.nombre, p.descripcion, p.sku_base, p.codigo_producto, p.imagen, p.idestatus,
                    p.es_base, p.idcategoria, p.idmarca, p.idmodelo, p.idunidad, p.unidad_medida,
                    c.nombre AS categoria, m.nombre AS marca, mo.nombre AS modelo,
                    un.abreviatura AS unidad_abreviatura,
                    COUNT(DISTINCT h.id) AS total_filas,
                    (SELECT COALESCE(SUM(hs.stock), 0)
                       FROM productos hs
                      WHERE hs.producto_base_id = p.id AND hs.es_base = 0) AS stock_total,
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
                         p.es_base, p.idcategoria, p.idmarca, p.idmodelo, p.idunidad, p.unidad_medida,
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
        if (!empty($f['idsubcategoria'])) { $where2[]="p.idsubcategoria=:subcat"; $params2[':subcat']=(int)$f['idsubcategoria']; }
        if (!empty($f['idmarca'])) { $where2[]="p.idmarca=:mar"; $params2[':mar']=(int)$f['idmarca']; }
        if (!empty($f['idmodelo'])) { $where2[]="p.idmodelo=:mod"; $params2[':mod']=(int)$f['idmodelo']; }
        if (!empty($f['idunidad'])) { $where2[]="p.idunidad=:uni"; $params2[':uni']=(int)$f['idunidad']; }
        if (!empty($f['idcolor'])) { $where2[]="p.idcolor=:col"; $params2[':col']=(int)$f['idcolor']; }
        if (!empty($f['idtalla'])) { $where2[]="p.idtalla=:tal"; $params2[':tal']=(int)$f['idtalla']; }
        if (!empty($f['almacen'])) { $where2[]="EXISTS (SELECT 1 FROM producto_almacen pa2 WHERE pa2.producto_id=p.id AND pa2.almacen_id=:alm)"; $params2[':alm']=(int)$f['almacen']; }
        if (isset($f['precioMin']) && $f['precioMin']!=='') { $where2[]="p.precio>=:pmin"; $params2[':pmin']=(float)$f['precioMin']; }
        if (isset($f['precioMax']) && $f['precioMax']!=='') { $where2[]="p.precio<=:pmax"; $params2[':pmax']=(float)$f['precioMax']; }
        if (isset($f['stockMin']) && $f['stockMin']!=='') { $where2[]="p.stock>=:smin"; $params2[':smin']=(int)$f['stockMin']; }
        if (isset($f['solo_agotados']) && (int)$f['solo_agotados']===1) { $where2[]="p.stock=0"; }
        if ($stockEstado === 'con_stock') { $where2[] = "p.stock > 0"; }
        elseif ($stockEstado === 'sin_stock') { $where2[] = "p.stock = 0"; }
        elseif ($stockEstado === 'bajo_stock') { $where2[] = "p.stock > 0 AND p.stock < 10"; }

        $sql2 = "SELECT p.id,p.nombre,p.descripcion,p.sku_base,p.codigo_producto,p.imagen,p.idestatus,p.es_base,p.idcategoria,p.idmarca,p.idmodelo,p.idunidad,p.unidad_medida,
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

        $pagina = isset($f['pagina']) ? (int) $f['pagina'] : (isset($f['page']) ? (int) $f['page'] : 0);
        $porPagina = isset($f['por_pagina']) ? (int) $f['por_pagina'] : (isset($f['limit']) ? (int) $f['limit'] : 0);
        $paginado = $pagina > 0 || $porPagina > 0 || !empty($f['paginado']);

        if ($paginado) {
            $pagina = max(1, $pagina);
            $porPagina = max(1, min(100, $porPagina > 0 ? $porPagina : 20));
            $total = count($all);
            $totalPaginas = max(1, (int) ceil($total / $porPagina));
            $pagina = min($pagina, $totalPaginas);
            $offset = ($pagina - 1) * $porPagina;
            return [
                'productos' => array_slice($all, $offset, $porPagina),
                'paginacion' => [
                    'total' => $total,
                    'pagina' => $pagina,
                    'por_pagina' => $porPagina,
                    'total_paginas' => $totalPaginas,
                ],
            ];
        }

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

        $stockInicial = max(0, (int) ($datos['stock_inicial'] ?? 0));
        $stockMinimo = max(0, (int) ($datos['stock_minimo'] ?? 0));
        $stockMaximo = ($datos['stock_maximo'] ?? '') === '' || $datos['stock_maximo'] === null ? null : max(0, (int) $datos['stock_maximo']);
        $sql = "INSERT INTO productos
                (producto_base_id, es_base, nombre, descripcion, precio, preciofull, costo,
                 stock, stock_inicial, stock_minimo, stock_maximo, idcategoria, idsubcategoria, idmarca, idmodelo, idcolor, idtalla, idunidad,
                 sku_base, codigo_producto, codigo_detalle, codigo_barras, unidad_medida, estrellas, imagen, idestatus)
                VALUES
                (:producto_base_id, :es_base, :nombre, :descripcion, :precio, :preciofull, :costo,
                 0, :stock_inicial, :stock_minimo, :stock_maximo, :idcategoria, :idsubcategoria, :idmarca, :idmodelo, :idcolor, :idtalla, :idunidad,
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
            ':stock_inicial'    => $stockInicial,
            ':stock_minimo'     => $stockMinimo,
            ':stock_maximo'     => $stockMaximo,
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
        $stockMinimo = max(0, (int) ($datos['stock_minimo'] ?? 0));
        $stockMaximo = ($datos['stock_maximo'] ?? '') === '' || $datos['stock_maximo'] === null ? null : max(0, (int) $datos['stock_maximo']);

        $sql = "UPDATE productos SET
                    producto_base_id = :producto_base_id,
                    es_base          = :es_base,
                    nombre           = :nombre,
                    descripcion      = :descripcion,
                    precio           = :precio,
                    preciofull       = :preciofull,
                    costo            = :costo,
                    stock_minimo     = :stock_minimo,
                    stock_maximo     = :stock_maximo,
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
            ':stock_minimo'     => $stockMinimo,
            ':stock_maximo'     => $stockMaximo,
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
        // Una presentación/fila debe quedar vinculada solo al almacén seleccionado
        $db->prepare("DELETE FROM producto_almacen WHERE producto_id = :p AND almacen_id <> :a")
           ->execute([':p' => $productoId, ':a' => $almacenId]);

        $stmt = $db->prepare("SELECT stock FROM productos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $productoId]);
        $stockActual = (int) $stmt->fetchColumn();

        if ($esNuevo) {
            // Regla: en creación, stock inicial = stock actual
            $db->prepare("UPDATE productos SET stock_inicial = :si WHERE id = :id AND es_base = 0")
               ->execute([':si' => $stockDeseado, ':id' => $productoId]);
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

        // Si cambió de almacén, mover inventario de otros almacenes al almacén/ubicación destino
        if (!$esNuevo) {
            $stmtOtros = $db->prepare(
                "SELECT i.id, i.ubicacion_id, i.cantidad, u.almacen_id
                 FROM inventario i JOIN ubicaciones u ON u.id = i.ubicacion_id
                 WHERE i.producto_id = :p AND u.almacen_id <> :a AND i.cantidad > 0
                 FOR UPDATE"
            );
            $stmtOtros->execute([':p' => $productoId, ':a' => $almacenId]);
            foreach ($stmtOtros->fetchAll() as $otroAlm) {
                $cantMover = (int) $otroAlm['cantidad'];
                if ($cantMover <= 0) continue;
                $stmtT = $db->prepare("SELECT id, cantidad FROM inventario WHERE producto_id=:p AND ubicacion_id=:u LIMIT 1 FOR UPDATE");
                $stmtT->execute([':p' => $productoId, ':u' => $ubicacionId]);
                $tRow = $stmtT->fetch();
                if ($tRow) {
                    $db->prepare("UPDATE inventario SET cantidad = cantidad + :c WHERE id=:id")->execute([':c'=>$cantMover, ':id'=>(int)$tRow['id']]);
                } else {
                    $db->prepare("INSERT INTO inventario (producto_id, ubicacion_id, cantidad) VALUES (:p,:u,:c)")->execute([':p'=>$productoId, ':u'=>$ubicacionId, ':c'=>$cantMover]);
                }
                $db->prepare("UPDATE inventario SET cantidad = 0 WHERE id=:id")->execute([':id'=>(int)$otroAlm['id']]);
            }
        }

        $delta = $stockDeseado - $stockActual;

        // Consolidar stock del producto en el almacén hacia la ubicación seleccionada
        $stmt = $db->prepare(
            "SELECT i.id, i.ubicacion_id, i.cantidad
             FROM inventario i
             JOIN ubicaciones u ON u.id = i.ubicacion_id
             WHERE i.producto_id = :p AND u.almacen_id = :a
             FOR UPDATE"
        );
        $stmt->execute([':p' => $productoId, ':a' => $almacenId]);
        $invRows = $stmt->fetchAll();
        $enUbicacion = 0;
        $otros = [];
        foreach ($invRows as $ir) {
            $uid = (int) $ir['ubicacion_id'];
            $cant = (int) $ir['cantidad'];
            if ($uid === $ubicacionId) { $enUbicacion += $cant; }
            else { $otros[] = ['id' => (int)$ir['id'], 'ubicacion_id' => $uid, 'cantidad' => $cant]; }
        }

        // Mover stock de otras ubicaciones del mismo almacén a la seleccionada
        foreach ($otros as $otro) {
            if ($otro['cantidad'] <= 0) continue;
            // sumar al target
            $stmtUp = $db->prepare("SELECT id, cantidad FROM inventario WHERE producto_id=:p AND ubicacion_id=:u LIMIT 1 FOR UPDATE");
            $stmtUp->execute([':p' => $productoId, ':u' => $ubicacionId]);
            $targetRow = $stmtUp->fetch();
            if ($targetRow) {
                $db->prepare("UPDATE inventario SET cantidad = cantidad + :c WHERE id=:id")
                   ->execute([':c' => $otro['cantidad'], ':id' => (int)$targetRow['id']]);
            } else {
                $db->prepare("INSERT INTO inventario (producto_id, ubicacion_id, cantidad) VALUES (:p,:u,:c)")
                   ->execute([':p' => $productoId, ':u' => $ubicacionId, ':c' => $otro['cantidad']]);
            }
            $db->prepare("UPDATE inventario SET cantidad = 0 WHERE id=:id")->execute([':id' => $otro['id']]);
            $enUbicacion += $otro['cantidad'];
        }

        if ($delta === 0) {
            return;
        }

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

    private static function validarFilasUnicas(PDO $db, array $filas, string $codigoProducto, int $baseId = 0): void
    {
        $idsPayload = [];
        foreach ($filas as $f) {
            $fid = (int) ($f['id'] ?? $f['producto_id'] ?? 0);
            if ($fid > 0) $idsPayload[] = $fid;
        }
        $vistos = [];
        foreach ($filas as $i => $fila) {
            $almacen = (int) ($fila['almacen_id'] ?? 0);
            $ubicacion = ($fila['ubicacion_id'] ?? '') === '' ? '0' : (string) (int) $fila['ubicacion_id'];
            $color = (int) ($fila['idcolor'] ?? 1);
            $talla = (int) ($fila['idtalla'] ?? 1);
            $key = implode('|', [$codigoProducto, $almacen, $ubicacion, $color, $talla]);
            $n = $i + 1;
            if (isset($vistos[$key])) {
                throw new InvalidArgumentException(
                    "Fila {$n}: ya existe otra presentación con la misma combinación SKU + almacén + ubicación + color + talla."
                );
            }
            if ($baseId > 0) {
                $ubicacionId = ($ubicacion === '0') ? null : (int) $ubicacion;
                $sql = "SELECT p.id FROM productos p LEFT JOIN producto_almacen pa ON pa.producto_id = p.id AND pa.almacen_id = :alm WHERE p.producto_base_id = :base AND p.es_base = 0 AND pa.almacen_id = :alm2 AND p.idcolor = :color AND p.idtalla = :talla";
                $params = [':base'=>$baseId, ':alm'=>$almacen, ':alm2'=>$almacen, ':color'=>$color, ':talla'=>$talla];
                if ($idsPayload) {
                    $ph = [];
                    foreach ($idsPayload as $k => $pid) { $phk = ":pid$k"; $ph[] = $phk; $params[$phk] = $pid; }
                    $sql .= " AND p.id NOT IN (" . implode(',', $ph) . ")";
                }
                if ($ubicacionId === null) {
                    $sql .= " AND NOT EXISTS (SELECT 1 FROM inventario i2 JOIN ubicaciones u2 ON u2.id=i2.ubicacion_id WHERE i2.producto_id=p.id AND u2.almacen_id=:alm3)";
                    $params[':alm3'] = $almacen;
                } else {
                    $sql .= " AND EXISTS (SELECT 1 FROM inventario i2 WHERE i2.producto_id=p.id AND i2.ubicacion_id=:ub)";
                    $params[':ub'] = $ubicacionId;
                }
                $sql .= " LIMIT 1";
                $stmt = $db->prepare($sql); $stmt->execute($params);
                if ($stmt->fetchColumn()) {
                    throw new InvalidArgumentException(
                        "Fila {$n}: ya existe otra presentación con la misma combinación SKU + almacén + ubicación + color + talla."
                    );
                }
            }
            $vistos[$key] = true;
        }
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
            self::validarFilasUnicas($db, $filas, trim((string) ($datos['sku_base'] ?? $datos['codigo_producto'] ?? '')), 0);

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
            self::validarFilasUnicas($db, $filas, trim((string) ($baseActual['codigo_producto'] ?? $baseActual['sku_base'] ?? '')), (int) $baseId);

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
            $codigoProducto = trim((string) ($baseActual['codigo_producto'] ?? $baseActual['sku_base'] ?? ''));
            $baseData['codigo_producto'] = $codigoProducto;
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

    /** Devuelve la fila cruda de un producto (sin resolver base/hijos). */
    public static function obtenerFilaPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM productos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    /**
     * Actualiza una presentacion (SKU hijo) y el stock de UN almacen concreto.
     * No toca las demas presentaciones del producto base.
     */
    public static function actualizarPresentacion(int $id, array $datos, ?int $usuarioId = null): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerFilaPorId($id);
            if (!$actual) {
                throw new RuntimeException("Producto #{$id} no encontrado");
            }
            if ((int) ($actual['es_base'] ?? 0) === 1) {
                throw new RuntimeException('El producto principal no se edita como presentacion de almacen');
            }

            $precio = array_key_exists('precio', $datos) ? (float) $datos['precio'] : (float) $actual['precio'];
            if ($precio <= 0) {
                throw new InvalidArgumentException('El precio debe ser mayor a 0');
            }
            $costo = array_key_exists('costo', $datos) ? (float) $datos['costo'] : (float) $actual['costo'];
            if ($costo < 0) {
                throw new InvalidArgumentException('El costo no puede ser negativo');
            }
            $preciofull = array_key_exists('preciofull', $datos)
                ? (float) $datos['preciofull']
                : (float) ($actual['preciofull'] ?? $precio);
            if ($preciofull <= 0) $preciofull = $precio;

            $idcolor = (int) ($datos['idcolor'] ?? $actual['idcolor'] ?? 1);
            $idtalla = (int) ($datos['idtalla'] ?? $actual['idtalla'] ?? 1);
            if ($idcolor <= 0) $idcolor = 1;
            if ($idtalla <= 0) $idtalla = 1;

            $codigoDetalle = array_key_exists('codigo_detalle', $datos)
                ? trim((string) $datos['codigo_detalle'])
                : (string) ($actual['codigo_detalle'] ?? '');
            $codigoBarras = array_key_exists('codigo_barras', $datos)
                ? trim((string) $datos['codigo_barras'])
                : (string) ($actual['codigo_barras'] ?? '');

            $stmt = $db->prepare(
                "UPDATE productos SET
                    idcolor = :idcolor,
                    idtalla = :idtalla,
                    costo = :costo,
                    precio = :precio,
                    preciofull = :preciofull,
                    codigo_detalle = :codigo_detalle,
                    codigo_barras = :codigo_barras
                 WHERE id = :id"
            );
            $stmt->execute([
                ':idcolor'        => $idcolor,
                ':idtalla'        => $idtalla,
                ':costo'          => $costo,
                ':precio'         => $precio,
                ':preciofull'     => $preciofull,
                ':codigo_detalle' => $codigoDetalle !== '' ? $codigoDetalle : null,
                ':codigo_barras'  => $codigoBarras !== '' ? $codigoBarras : null,
                ':id'             => $id,
            ]);

            $almacenId = (int) ($datos['almacen_id'] ?? 0);
            if ($almacenId <= 0) {
                throw new InvalidArgumentException('Debes indicar el almacen de la presentacion');
            }

            $stmt = $db->prepare(
                "SELECT id FROM producto_almacen WHERE producto_id = :p AND almacen_id = :a LIMIT 1"
            );
            $stmt->execute([':p' => $id, ':a' => $almacenId]);
            if ($stmt->fetchColumn() === false) {
                Inventario::asegurarProductoAlmacen($id, $almacenId);
            }

            $skuAlmacen = array_key_exists('sku_almacen', $datos)
                ? trim((string) $datos['sku_almacen'])
                : '';
            if ($skuAlmacen !== '') {
                $stmt = $db->prepare(
                    "SELECT 1 FROM producto_almacen
                     WHERE sku_almacen = :s AND NOT (producto_id = :p AND almacen_id = :a)
                     LIMIT 1"
                );
                $stmt->execute([':s' => $skuAlmacen, ':p' => $id, ':a' => $almacenId]);
                if ($stmt->fetchColumn()) {
                    throw new InvalidArgumentException('El SKU de almacen ya esta en uso por otro producto');
                }
                $stmt = $db->prepare(
                    "UPDATE producto_almacen SET sku_almacen = :s
                     WHERE producto_id = :p AND almacen_id = :a"
                );
                $stmt->execute([':s' => $skuAlmacen, ':p' => $id, ':a' => $almacenId]);
            }

            $ubicacionId = array_key_exists('ubicacion_id', $datos) && $datos['ubicacion_id'] !== ''
                ? (int) $datos['ubicacion_id'] : null;
            if ($ubicacionId !== null) {
                if (Inventario::almacenDeUbicacion($ubicacionId) !== $almacenId) {
                    throw new InvalidArgumentException('La ubicacion no pertenece al almacen indicado');
                }
                $stmt = $db->prepare(
                    "UPDATE producto_almacen SET ubicacion_preferida_id = :u
                     WHERE producto_id = :p AND almacen_id = :a"
                );
                $stmt->execute([':u' => $ubicacionId, ':p' => $id, ':a' => $almacenId]);
            }

            // Validar clave única: SKU(cabecera) + almacen + ubicacion + color + talla
            $baseIdDup = (int) ($actual['producto_base_id'] ?? 0);
            if ($baseIdDup > 0) {
                $sqlDup = "SELECT p.id FROM productos p
                           LEFT JOIN producto_almacen pa ON pa.producto_id=p.id AND pa.almacen_id=:alm
                           WHERE p.producto_base_id=:base AND p.es_base=0 AND p.id<>:id
                             AND pa.almacen_id=:alm2 AND p.idcolor=:color AND p.idtalla=:talla";
                $paramsDup = [':base'=>$baseIdDup, ':id'=>$id, ':alm'=>$almacenId, ':alm2'=>$almacenId, ':color'=>$idcolor, ':talla'=>$idtalla];
                if ($ubicacionId === null) {
                    $sqlDup .= " AND NOT EXISTS (SELECT 1 FROM inventario i2 JOIN ubicaciones u2 ON u2.id=i2.ubicacion_id WHERE i2.producto_id=p.id AND u2.almacen_id=:alm3)";
                    $paramsDup[':alm3'] = $almacenId;
                } else {
                    $sqlDup .= " AND EXISTS (SELECT 1 FROM inventario i2 WHERE i2.producto_id=p.id AND i2.ubicacion_id=:ub)";
                    $paramsDup[':ub'] = $ubicacionId;
                }
                $sqlDup .= " LIMIT 1";
                $stmtDup = $db->prepare($sqlDup);
                $stmtDup->execute($paramsDup);
                if ($stmtDup->fetchColumn()) {
                    throw new InvalidArgumentException('Ya existe otra presentación con la misma combinación SKU + almacén + ubicación + color + talla.');
                }
            }

            if (array_key_exists('stock', $datos) && $datos['stock'] !== '' && $datos['stock'] !== null) {
                Inventario::fijarStockAlmacen(
                    $id,
                    $almacenId,
                    $ubicacionId,
                    max(0, (int) $datos['stock']),
                    [
                        'costo_unitario' => $costo,
                        'referencia'     => 'Edicion de presentacion',
                        'motivo'         => 'Stock ajustado desde el listado de productos',
                        'usuario_id'     => $usuarioId,
                    ]
                );
            }

            $db->commit();
            return self::obtenerFilaPorId($id) ?? [];
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

    public static function eliminarFisico(int $id, bool $vaciarStock = false): bool
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerFilaPorId($id);
            if (!$actual) {
                throw new RuntimeException("Producto #{$id} no encontrado");
            }

            // Un producto principal no se elimina mientras tenga presentaciones/SKUs hijos.
            if ((int) ($actual['es_base'] ?? 0) === 1) {
                $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE producto_base_id = :id AND es_base = 0");
                $stmt->execute([':id' => $id]);
                $hijos = (int) $stmt->fetchColumn();
                if ($hijos > 0) {
                    throw new RuntimeException(
                        "No se puede eliminar el producto principal: tiene {$hijos} presentacion(es) vinculada(s). " .
                        'Elimina o desvincula primero las presentaciones.'
                    );
                }
            }

            $stmt = $db->prepare("SELECT COALESCE(SUM(cantidad), 0) FROM inventario WHERE producto_id = :id");
            $stmt->execute([':id' => $id]);
            $stock = (int) $stmt->fetchColumn();
            if ($stock > 0) {
                if (!$vaciarStock) {
                    throw new RuntimeException(
                        "No se puede eliminar: el producto tiene {$stock} unidad(es) en inventario. " .
                        'Ajusta el stock a cero primero.'
                    );
                }

                // Vaciar existencia antes de eliminar, dejando registro de ajuste.
                $stmtInv = $db->prepare(
                    "SELECT i.ubicacion_id, i.cantidad, u.almacen_id
                     FROM inventario i
                     JOIN ubicaciones u ON u.id = i.ubicacion_id
                     WHERE i.producto_id = :id AND i.cantidad > 0"
                );
                $stmtInv->execute([':id' => $id]);
                $filasInv = $stmtInv->fetchAll();
                $stmtMov = $db->prepare(
                    "INSERT INTO movimientos_inventario
                        (tipo, producto_id, almacen_origen_id, ubicacion_origen_id, cantidad, costo_unitario, referencia, motivo, usuario_id)
                     VALUES
                        ('ajuste', :p, :a, :u, 0, :costo, :ref, :motivo, NULL)"
                );
                foreach ($filasInv as $inv) {
                    $stmtMov->execute([
                        ':p'      => $id,
                        ':a'      => (int) $inv['almacen_id'],
                        ':u'      => (int) $inv['ubicacion_id'],
                        ':costo'  => (float) ($actual['costo'] ?? 0),
                        ':ref'    => 'Eliminacion de producto',
                        ':motivo' => 'Stock puesto en cero automaticamente antes de eliminar la presentacion',
                    ]);
                }

                $db->prepare("DELETE FROM inventario WHERE producto_id = :id")->execute([':id' => $id]);
                $db->prepare("UPDATE productos SET stock = 0 WHERE id = :id")->execute([':id' => $id]);
            }

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

    public static function imagenes(int $productoId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT id, producto_id, imagen, orden, created_at FROM producto_imagenes WHERE producto_id = :p ORDER BY orden ASC, id ASC");
        $stmt->execute([':p' => $productoId]);
        return $stmt->fetchAll();
    }

    public static function agregarImagen(int $productoId, string $imagen, ?int $orden = null): int
    {
        $db = Database::conectar();
        if ($orden === null) {
            $s = $db->prepare("SELECT COALESCE(MAX(orden), -1) + 1 FROM producto_imagenes WHERE producto_id = :p");
            $s->execute([':p' => $productoId]);
            $orden = (int) $s->fetchColumn();
        }
        $stmt = $db->prepare("INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (:p, :img, :o)");
        $stmt->execute([':p' => $productoId, ':img' => $imagen, ':o' => $orden]);
        $id = (int) $db->lastInsertId();
        // si el producto no tiene imagen principal, asignarla
        $p = $db->prepare("SELECT imagen FROM productos WHERE id = :id LIMIT 1");
        $p->execute([':id' => $productoId]);
        $actual = (string) $p->fetchColumn();
        if ($actual === '' || $actual === 'sin-foto.png') {
            self::setImagen($productoId, $imagen);
        }
        return $id;
    }

    public static function eliminarImagen(int $imagenId): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT producto_id, imagen FROM producto_imagenes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $imagenId]);
        $row = $stmt->fetch();
        if (!$row) return false;
        $productoId = (int) $row['producto_id'];
        $img = (string) $row['imagen'];
        $db->prepare("DELETE FROM producto_imagenes WHERE id = :id")->execute([':id' => $imagenId]);
        // si era la principal, asignar la siguiente
        $p = $db->prepare("SELECT imagen FROM productos WHERE id = :id LIMIT 1");
        $p->execute([':id' => $productoId]);
        $actual = (string) $p->fetchColumn();
        if ($actual === $img) {
            $next = $db->prepare("SELECT imagen FROM producto_imagenes WHERE producto_id = :p ORDER BY orden ASC, id ASC LIMIT 1");
            $next->execute([':p' => $productoId]);
            $nueva = $next->fetchColumn();
            self::setImagen($productoId, $nueva ? (string) $nueva : 'sin-foto.png');
        }
        return true;
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
