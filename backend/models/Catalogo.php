<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
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
    }
}
