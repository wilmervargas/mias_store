<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
<<<<<<< HEAD
 * Catalogos simples: modelos, colores y tallas.
 * Se usa una sola clase con lista blanca de tablas y columnas.
 */
class Catalogo
{
    private const TABLAS = [
        'modelos' => ['idmarca', 'nombre'],
        'colores' => ['nombre', 'codigo_hex'],
        'tallas'  => ['nombre', 'tipo', 'orden'],
    ];

    private static function validar(string $tabla): array
    {
        if (!isset(self::TABLAS[$tabla])) {
            throw new InvalidArgumentException('Catalogo no valido');
        }
        return self::TABLAS[$tabla];
    }

    /**
     * Listado con filtros: q, estatus, idmarca (modelos), tipo (tallas).
     */
    public static function obtenerTodos(string $tabla, bool $soloActivos = true, array $f = []): array
    {
        self::validar($tabla);
        $db     = Database::conectar();
        $where  = [];
        $params = [];

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]            = 'x.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivos) {
            $where[] = 'x.idestatus = 1';
        }

        if (!empty($f['q'])) {
            $where[]       = 'x.nombre LIKE :q';
            $params[':q'] = '%' . trim((string) $f['q']) . '%';
        }

        if ($tabla === 'modelos' && !empty($f['idmarca'])) {
            $where[]           = 'x.idmarca = :idmarca';
            $params[':idmarca'] = (int) $f['idmarca'];
        }

        if ($tabla === 'tallas' && !empty($f['tipo'])) {
            $where[]        = 'x.tipo = :tipo';
            $params[':tipo'] = (string) $f['tipo'];
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        if ($tabla === 'modelos') {
            $sql = "SELECT x.*, m.nombre AS marca,
                           (SELECT COUNT(*) FROM productos p WHERE p.idmodelo = x.id) AS total_productos
                    FROM modelos x
                    LEFT JOIN marcas m ON m.id = x.idmarca
                    {$whereSql}
                    ORDER BY x.nombre";
        } elseif ($tabla === 'colores') {
            $sql = "SELECT x.*,
                           (SELECT COUNT(*) FROM productos p WHERE p.idcolor = x.id) AS total_productos
                    FROM colores x
                    {$whereSql}
                    ORDER BY x.nombre";
        } else {
            $sql = "SELECT x.*,
                           (SELECT COUNT(*) FROM productos p WHERE p.idtalla = x.id) AS total_productos
                    FROM tallas x
                    {$whereSql}
                    ORDER BY x.orden, x.nombre";
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$fila) {
            $fila['total_productos']     = (int) ($fila['total_productos'] ?? 0);
            $fila['total_productos_todos'] = (int) ($fila['total_productos'] ?? 0);
            $fila['puede_desactivar']    = $fila['total_productos'] === 0;
            $fila['puede_eliminar']      = $fila['total_productos'] === 0;
        }

        return $filas;
    }

    public static function obtenerPorId(string $tabla, int $id): ?array
    {
        self::validar($tabla);
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM {$tabla} WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(string $tabla, array $d): int
    {
        $columnas = self::validar($tabla);
        $db = Database::conectar();

        $valores = [];
        $params = [];
        foreach ($columnas as $col) {
            $valores[] = ':' . $col;
            $params[':' . $col] = $d[$col] ?? null;
        }

        $sql = "INSERT INTO {$tabla} (" . implode(', ', $columnas) . ", idestatus)
                VALUES (" . implode(', ', $valores) . ", 1)";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(string $tabla, int $id, array $d): bool
    {
        $columnas = self::validar($tabla);
        $db = Database::conectar();

        $sets = [];
        $params = [':id' => $id];
        foreach ($columnas as $col) {
            if (array_key_exists($col, $d)) {
                $sets[] = "{$col} = :{$col}";
                $params[':' . $col] = $d[$col];
            }
        }
        $sets[] = "idestatus = :idestatus";
        $params[':idestatus'] = (int) ($d['idestatus'] ?? 1);

        $sql = "UPDATE {$tabla} SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        return $stmt->execute($params);
    }

    public static function eliminar(string $tabla, int $id): bool
    {
        self::validar($tabla);

        $columnaProducto = [
            'modelos' => 'idmodelo',
            'colores' => 'idcolor',
            'tallas'  => 'idtalla',
        ][$tabla];

        $db = Database::conectar();
        $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE {$columnaProducto} = :id");
        $stmt->execute([':id' => $id]);
        $total = (int) $stmt->fetchColumn();

        if ($total > 0) {
            throw new RuntimeException(
                "No se puede desactivar el registro: tiene {$total} producto(s) vinculado(s). Reasigna primero esos productos."
            );
        }

        $stmt = $db->prepare("UPDATE {$tabla} SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si el registro no tiene productos vinculados. */
    public static function eliminarFisico(string $tabla, int $id): array
    {
        self::validar($tabla);

        $columnaProducto = [
            'modelos' => 'idmodelo',
            'colores' => 'idcolor',
            'tallas'  => 'idtalla',
        ][$tabla];

        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($tabla, $id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Registro #{$id} no encontrado en {$tabla}"];
            }

            $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE {$columnaProducto} = :id");
            $stmt->execute([':id' => $id]);
            $total = (int) $stmt->fetchColumn();

            if ($total > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar el registro: tiene {$total} producto(s) vinculado(s).",
                ];
            }

            $stmt = $db->prepare("DELETE FROM {$tabla} WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $db->commit();

            return ['ok' => true];
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return [
                'ok'     => false,
                'codigo' => 409,
                'error'  => 'No se pudo eliminar el registro porque tiene registros vinculados.',
            ];
        }
=======
 * Catalogos maestros del inventario.
 * Todos usan borrado logico (idestatus = 2) para no romper historicos.
 */

class Almacen
{
    public static function listar(): array
    {
        $db = Database::conectar();
        return $db->query(
            "SELECT a.*,
                    (SELECT COUNT(*) FROM ubicaciones u WHERE u.almacen_id = a.id AND u.idestatus = 1) AS ubicaciones
             FROM almacenes a
             ORDER BY a.id ASC"
        )->fetchAll();
    }

    public static function obtener(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM almacenes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO almacenes (codigo, nombre, tipo, direccion, telefono, idestatus)
             VALUES (:codigo, :nombre, :tipo, :direccion, :telefono, 1)"
        );
        $stmt->execute([
            ':codigo'    => strtoupper(trim((string) $d['codigo'])),
            ':nombre'    => trim((string) $d['nombre']),
            ':tipo'      => in_array($d['tipo'] ?? '', ['principal', 'tienda', 'deposito', 'transito'], true)
                ? $d['tipo'] : 'principal',
            ':direccion' => $d['direccion'] ?? null,
            ':telefono'  => $d['telefono'] ?? null,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE almacenes SET
                codigo    = :codigo,
                nombre    = :nombre,
                tipo      = :tipo,
                direccion = :direccion,
                telefono  = :telefono,
                idestatus = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'        => $id,
            ':codigo'    => strtoupper(trim((string) ($d['codigo'] ?? $actual['codigo']))),
            ':nombre'    => trim((string) ($d['nombre'] ?? $actual['nombre'])),
            ':tipo'      => $d['tipo'] ?? $actual['tipo'],
            ':direccion' => $d['direccion'] ?? $actual['direccion'],
            ':telefono'  => $d['telefono'] ?? $actual['telefono'],
            ':idestatus' => (int) ($d['idestatus'] ?? $actual['idestatus']),
        ]);
    }
}

class Ubicacion
{
    public static function listar(?int $almacenId = null): array
    {
        $db  = Database::conectar();
        $sql = "SELECT u.*, a.codigo AS almacen_codigo, a.nombre AS almacen
                FROM ubicaciones u
                INNER JOIN almacenes a ON a.id = u.almacen_id
                WHERE 1 = 1";
        $params = [];

        if ($almacenId !== null && $almacenId > 0) {
            $sql .= " AND u.almacen_id = :almacen_id";
            $params[':almacen_id'] = $almacenId;
        }

        $sql .= " ORDER BY a.id ASC, u.codigo ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function obtener(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM ubicaciones WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO ubicaciones
             (almacen_id, codigo, pasillo, estante, sector, nivel, descripcion, idestatus)
             VALUES
             (:almacen_id, :codigo, :pasillo, :estante, :sector, :nivel, :descripcion, 1)"
        );
        $stmt->execute([
            ':almacen_id'  => (int) $d['almacen_id'],
            ':codigo'      => strtoupper(trim((string) $d['codigo'])),
            ':pasillo'     => $d['pasillo'] ?? null,
            ':estante'     => $d['estante'] ?? null,
            ':sector'      => $d['sector'] ?? null,
            ':nivel'       => $d['nivel'] ?? null,
            ':descripcion' => $d['descripcion'] ?? null,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE ubicaciones SET
                almacen_id = :almacen_id,
                codigo     = :codigo,
                pasillo    = :pasillo,
                estante    = :estante,
                sector     = :sector,
                nivel      = :nivel,
                descripcion= :descripcion,
                idestatus  = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'          => $id,
            ':almacen_id'  => (int) ($d['almacen_id'] ?? $actual['almacen_id']),
            ':codigo'      => strtoupper(trim((string) ($d['codigo'] ?? $actual['codigo']))),
            ':pasillo'     => $d['pasillo'] ?? $actual['pasillo'],
            ':estante'     => $d['estante'] ?? $actual['estante'],
            ':sector'      => $d['sector'] ?? $actual['sector'],
            ':nivel'       => $d['nivel'] ?? $actual['nivel'],
            ':descripcion' => $d['descripcion'] ?? $actual['descripcion'],
            ':idestatus'   => (int) ($d['idestatus'] ?? $actual['idestatus']),
        ]);
    }
}

class Talla
{
    public static function listar(): array
    {
        $db = Database::conectar();
        return $db->query(
            "SELECT * FROM tallas ORDER BY sistema ASC, orden ASC, nombre ASC"
        )->fetchAll();
    }

    public static function obtener(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM tallas WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO tallas (nombre, codigo, sistema, orden, idestatus)
             VALUES (:nombre, :codigo, :sistema, :orden, 1)"
        );
        $stmt->execute([
            ':nombre'  => trim((string) $d['nombre']),
            ':codigo'  => strtoupper(trim((string) $d['codigo'])),
            ':sistema' => in_array($d['sistema'] ?? '', ['ropa', 'calzado', 'nino', 'cama', 'unica', 'otro'], true)
                ? $d['sistema'] : 'otro',
            ':orden'   => (int) ($d['orden'] ?? 0),
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE tallas SET
                nombre = :nombre, codigo = :codigo, sistema = :sistema,
                orden = :orden, idestatus = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'        => $id,
            ':nombre'    => trim((string) ($d['nombre'] ?? $actual['nombre'])),
            ':codigo'    => strtoupper(trim((string) ($d['codigo'] ?? $actual['codigo']))),
            ':sistema'   => $d['sistema'] ?? $actual['sistema'],
            ':orden'     => (int) ($d['orden'] ?? $actual['orden']),
            ':idestatus' => (int) ($d['idestatus'] ?? $actual['idestatus']),
        ]);
    }
}

class Color
{
    public static function listar(): array
    {
        $db = Database::conectar();
        return $db->query(
            "SELECT * FROM colores ORDER BY orden ASC, nombre ASC"
        )->fetchAll();
    }

    public static function obtener(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM colores WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO colores (nombre, codigo, hex, orden, idestatus)
             VALUES (:nombre, :codigo, :hex, :orden, 1)"
        );
        $stmt->execute([
            ':nombre' => trim((string) $d['nombre']),
            ':codigo' => strtoupper(trim((string) $d['codigo'])),
            ':hex'    => self::hex($d['hex'] ?? null),
            ':orden'  => (int) ($d['orden'] ?? 0),
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE colores SET
                nombre = :nombre, codigo = :codigo, hex = :hex,
                orden = :orden, idestatus = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'        => $id,
            ':nombre'    => trim((string) ($d['nombre'] ?? $actual['nombre'])),
            ':codigo'    => strtoupper(trim((string) ($d['codigo'] ?? $actual['codigo']))),
            ':hex'       => self::hex($d['hex'] ?? $actual['hex']),
            ':orden'     => (int) ($d['orden'] ?? $actual['orden']),
            ':idestatus' => (int) ($d['idestatus'] ?? $actual['idestatus']),
        ]);
    }

    private static function hex(mixed $valor): ?string
    {
        $hex = trim((string) $valor);
        return preg_match('/^#[0-9A-Fa-f]{6}$/', $hex) ? strtoupper($hex) : null;
    }
}

class Modelo
{
    public static function listar(?int $marcaId = null): array
    {
        $db  = Database::conectar();
        $sql = "SELECT mo.*, m.nombre AS marca
                FROM modelos mo
                LEFT JOIN marcas m ON m.id = mo.idmarca
                WHERE 1 = 1";
        $params = [];

        if ($marcaId !== null && $marcaId > 0) {
            $sql .= " AND mo.idmarca = :idmarca";
            $params[':idmarca'] = $marcaId;
        }

        $sql .= " ORDER BY m.nombre ASC, mo.nombre ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function obtener(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM modelos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO modelos (idmarca, nombre, codigo, idestatus)
             VALUES (:idmarca, :nombre, :codigo, 1)"
        );
        $stmt->execute([
            ':idmarca' => !empty($d['idmarca']) ? (int) $d['idmarca'] : null,
            ':nombre'  => trim((string) $d['nombre']),
            ':codigo'  => !empty($d['codigo']) ? strtoupper(trim((string) $d['codigo'])) : null,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $actual = self::obtener($id);
        if (!$actual) {
            return false;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE modelos SET
                idmarca = :idmarca, nombre = :nombre, codigo = :codigo,
                idestatus = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'        => $id,
            ':idmarca'   => !empty($d['idmarca']) ? (int) $d['idmarca'] : $actual['idmarca'],
            ':nombre'    => trim((string) ($d['nombre'] ?? $actual['nombre'])),
            ':codigo'    => !empty($d['codigo']) ? strtoupper(trim((string) $d['codigo'])) : $actual['codigo'],
            ':idestatus' => (int) ($d['idestatus'] ?? $actual['idestatus']),
        ]);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    }
}
