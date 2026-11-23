<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Marca
{
    /**
     * Marcas con conteos de productos/modelos.
     * $soloActivas protege la Tienda de Clase 1.
     * Filtros: q, estatus.
     */
    public static function obtenerTodas(bool $soloActivas = true, array $f = []): array
    {
        $db     = Database::conectar();
        $where  = [];
        $params = [];

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]          = 'm.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivas) {
            $where[] = 'm.idestatus = 1';
        }

        if (!empty($f['q'])) {
            $where[]       = 'm.nombre LIKE :q';
            $params[':q'] = '%' . trim((string) $f['q']) . '%';
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT m.*,
                       COUNT(DISTINCT p.id) AS total_productos,
                       (SELECT COUNT(*) FROM productos p2 WHERE p2.idmarca = m.id) AS total_productos_todos,
                       (SELECT COUNT(*) FROM modelos mo WHERE mo.idmarca = m.id) AS total_modelos
                FROM marcas m
                LEFT JOIN productos p ON p.idmarca = m.id AND p.idestatus = 1
                {$whereSql}
                GROUP BY m.id, m.idestatus, m.nombre
                ORDER BY m.nombre ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$fila) {
            $fila['total_productos_todos'] = (int) ($fila['total_productos_todos'] ?? 0);
            $fila['total_modelos']         = (int) ($fila['total_modelos'] ?? 0);
            $fila['puede_desactivar']      = $fila['total_productos_todos'] === 0;
            $fila['puede_eliminar']        = $fila['total_productos_todos'] === 0
                                            && $fila['total_modelos'] === 0;
        }

        return $filas;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM marcas WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(string $nombre): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("INSERT INTO marcas (nombre, idestatus) VALUES (:nombre, 1)");
        $stmt->execute([':nombre' => $nombre]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, string $nombre, int $idestatus = 1): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE marcas SET nombre = :nombre, idestatus = :idestatus WHERE id = :id");
        return $stmt->execute([':id' => $id, ':nombre' => $nombre, ':idestatus' => $idestatus]);
    }

    /** Borrado logico. Se bloquea si la marca tiene productos vinculados. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE idmarca = :id");
        $stmt->execute([':id' => $id]);
        $total = (int) $stmt->fetchColumn();

        if ($total > 0) {
            throw new RuntimeException(
                "No se puede desactivar la marca: tiene {$total} producto(s) vinculado(s). Reasigna primero esos productos."
            );
        }

        $stmt = $db->prepare("UPDATE marcas SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si no tiene productos ni modelos vinculados. */
    public static function eliminarFisico(int $id): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Marca #{$id} no encontrada"];
            }

            $stmt = $db->prepare(
                "SELECT
                    (SELECT COUNT(*) FROM productos WHERE idmarca = :p1) AS productos,
                    (SELECT COUNT(*) FROM modelos  WHERE idmarca = :p2) AS modelos"
            );
            $stmt->execute([':p1' => $id, ':p2' => $id]);
            $vinculos = $stmt->fetch();

            $productos = (int) ($vinculos['productos'] ?? 0);
            $modelos   = (int) ($vinculos['modelos'] ?? 0);

            if ($productos > 0 || $modelos > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar la marca: {$productos} producto(s) y {$modelos} modelo(s) vinculados.",
                ];
            }

            $stmt = $db->prepare("DELETE FROM marcas WHERE id = :id");
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
                'error'  => 'No se pudo eliminar la marca porque tiene registros vinculados.',
            ];
        }
    }
}
