<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Categoria
{
    /**
     * Categorias con conteo de productos y subcategorias.
     * Filtros: q, estatus.
     */
    public static function obtenerTodas(bool $soloActivas = true, array $f = []): array
    {
        $db     = Database::conectar();
        $where  = [];
        $params = [];

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]            = 'c.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivas) {
            $where[] = 'c.idestatus = 1';
        }

        if (!empty($f['q'])) {
            $where[]       = '(c.nombre LIKE :q1 OR c.descripcion LIKE :q2)';
            $busqueda      = '%' . trim((string) $f['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT c.*,
                       COUNT(DISTINCT p.id) AS total_productos,
                       (SELECT COUNT(*) FROM productos p2 WHERE p2.idcategoria = c.id) AS total_productos_todos,
                       (SELECT COUNT(*) FROM subcategorias s WHERE s.idcategoria = c.id) AS total_subcategorias
                FROM categorias c
                LEFT JOIN productos p ON p.idcategoria = c.id AND p.idestatus = 1
                {$whereSql}
                GROUP BY c.id, c.idestatus, c.nombre, c.descripcion
                ORDER BY c.nombre ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$fila) {
            $fila['total_productos_todos'] = (int) ($fila['total_productos_todos'] ?? 0);
            $fila['total_subcategorias']   = (int) ($fila['total_subcategorias'] ?? 0);
            $fila['puede_desactivar']      = $fila['total_productos_todos'] === 0;
            $fila['puede_eliminar']        = $fila['total_productos_todos'] === 0
                                            && $fila['total_subcategorias'] === 0;
        }

        return $filas;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM categorias WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(string $nombre, string $descripcion): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("INSERT INTO categorias (nombre, descripcion, idestatus) VALUES (:nombre, :descripcion, 1)");
        $stmt->execute([':nombre' => $nombre, ':descripcion' => $descripcion]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, string $nombre, string $descripcion, int $idestatus = 1): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE categorias SET nombre = :nombre, descripcion = :descripcion, idestatus = :idestatus WHERE id = :id");
        return $stmt->execute([
            ':id'          => $id,
            ':nombre'      => $nombre,
            ':descripcion' => $descripcion,
            ':idestatus'   => $idestatus,
        ]);
    }

    /** Borrado logico. Se bloquea si la categoria tiene productos vinculados. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE idcategoria = :id");
        $stmt->execute([':id' => $id]);
        $total = (int) $stmt->fetchColumn();

        if ($total > 0) {
            throw new RuntimeException(
                "No se puede desactivar la categoria: tiene {$total} producto(s) vinculado(s). Reasigna primero esos productos."
            );
        }

        $stmt = $db->prepare("UPDATE categorias SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si no tiene productos ni subcategorias. */
    public static function eliminarFisico(int $id): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Categoria #{$id} no encontrada"];
            }

            $stmt = $db->prepare(
                "SELECT
                    (SELECT COUNT(*) FROM productos     WHERE idcategoria = :p1) AS productos,
                    (SELECT COUNT(*) FROM subcategorias WHERE idcategoria = :p2) AS subcategorias"
            );
            $stmt->execute([':p1' => $id, ':p2' => $id]);
            $vinculos = $stmt->fetch();

            $productos     = (int) ($vinculos['productos'] ?? 0);
            $subcategorias = (int) ($vinculos['subcategorias'] ?? 0);

            if ($productos > 0 || $subcategorias > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar la categoria: {$productos} producto(s) y {$subcategorias} subcategoria(s) vinculadas.",
                ];
            }

            $stmt = $db->prepare("DELETE FROM categorias WHERE id = :id");
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
                'error'  => 'No se pudo eliminar la categoria porque tiene registros vinculados.',
            ];
        }
    }
}
