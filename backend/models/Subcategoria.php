<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Subcategoria
{
    /**
     * Subcategorias con su categoria vinculada.
     * Filtros: q, idcategoria, estatus.
     */
    public static function obtenerTodas(bool $soloActivas = true, array $f = []): array
    {
        $db     = Database::conectar();
        $where  = [];
        $params = [];

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]            = 's.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivas) {
            $where[] = 's.idestatus = 1';
        }

        if (!empty($f['idcategoria'])) {
            $where[]                = 's.idcategoria = :idcategoria';
            $params[':idcategoria'] = (int) $f['idcategoria'];
        }

        if (!empty($f['q'])) {
            $where[]       = '(s.nombre LIKE :q1 OR c.nombre LIKE :q2)';
            $busqueda      = '%' . trim((string) $f['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT s.id, s.idcategoria, s.idestatus, s.nombre,
                       c.nombre AS categoria_nombre,
                       c.idestatus AS categoria_estatus
                FROM subcategorias s
                INNER JOIN categorias c ON c.id = s.idcategoria
                {$whereSql}
                ORDER BY c.nombre ASC, s.nombre ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db   = Database::conectar();
        $sql  = "SELECT s.id, s.idcategoria, s.idestatus, s.nombre,
                        c.nombre AS categoria_nombre,
                        c.idestatus AS categoria_estatus
                 FROM subcategorias s
                 INNER JOIN categorias c ON c.id = s.idcategoria
                 WHERE s.id = :id
                 LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(int $idcategoria, string $nombre, int $idestatus = 1): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO subcategorias (idcategoria, idestatus, nombre)
             VALUES (:idcategoria, :idestatus, :nombre)"
        );
        $stmt->execute([
            ':idcategoria' => $idcategoria,
            ':idestatus'   => $idestatus,
            ':nombre'      => $nombre,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, int $idcategoria, string $nombre, int $idestatus = 1): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE subcategorias
             SET idcategoria = :idcategoria, idestatus = :idestatus, nombre = :nombre
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'          => $id,
            ':idcategoria' => $idcategoria,
            ':idestatus'   => $idestatus,
            ':nombre'      => $nombre,
        ]);
    }

    /** Borrado logico. Se bloquea si hay productos vinculados. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE idsubcategoria = :id");
        $stmt->execute([':id' => $id]);
        $total = (int) $stmt->fetchColumn();

        if ($total > 0) {
            throw new RuntimeException(
                "No se puede desactivar la subcategoria: tiene {$total} producto(s) vinculado(s)."
            );
        }

        $stmt = $db->prepare("UPDATE subcategorias SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si no tiene productos vinculados. */
    public static function eliminarFisico(int $id): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Subcategoria #{$id} no encontrada"];
            }

            $stmt = $db->prepare("SELECT COUNT(*) FROM productos WHERE idsubcategoria = :id");
            $stmt->execute([':id' => $id]);
            $productos = (int) $stmt->fetchColumn();

            if ($productos > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar la subcategoria: {$productos} producto(s) vinculado(s).",
                ];
            }

            $stmt = $db->prepare("DELETE FROM subcategorias WHERE id = :id");
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
                'error'  => 'No se pudo eliminar la subcategoria porque tiene registros vinculados.',
            ];
        }
    }
}
