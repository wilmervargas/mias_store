<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Rol
{
    public static function obtenerTodos(): array
    {
        $db = Database::conectar();
        $roles = $db->query(
            'SELECT r.id, r.name, r.description, r.created_at,
                    (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS total_usuarios,
                    (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS total_permisos
             FROM roles r
             ORDER BY r.name ASC'
        )->fetchAll();

        $porRol = self::mapaPermisos($db);

        foreach ($roles as &$rol) {
            self::normalizar($rol, $porRol[(int) $rol['id']] ?? []);
        }
        unset($rol);

        return $roles;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT r.id, r.name, r.description, r.created_at,
                    (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS total_usuarios,
                    (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS total_permisos
             FROM roles r
             WHERE r.id = :id'
        );
        $stmt->execute([':id' => $id]);
        $rol = $stmt->fetch();

        if (!$rol) {
            return null;
        }

        self::normalizar($rol, self::permisosDe($id));
        return $rol;
    }

    public static function obtenerPorNombre(string $name): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT id FROM roles WHERE name = :name LIMIT 1');
        $stmt->execute([':name' => $name]);
        $id = $stmt->fetchColumn();

        return $id === false ? null : self::obtenerPorId((int) $id);
    }

    /** Roles asignados a un usuario (id, name, description). */
    public static function obtenerDeUsuario(int $userId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT r.id, r.name, r.description
             FROM roles r
             INNER JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = :user_id
             ORDER BY r.name ASC'
        );
        $stmt->execute([':user_id' => $userId]);

        return array_map(static fn(array $fila): array => [
            'id'          => (int) $fila['id'],
            'name'        => (string) $fila['name'],
            'description' => (string) $fila['description'],
        ], $stmt->fetchAll());
    }

    public static function idsDeUsuario(int $userId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT role_id FROM user_roles WHERE user_id = :user_id');
        $stmt->execute([':user_id' => $userId]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** Devuelve solo los IDs existentes dentro de la lista recibida. */
    public static function idsExistentes(array $ids): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids), static fn(int $id): bool => $id > 0)));
        if (!$ids) {
            return [];
        }

        $db = Database::conectar();
        $marcadores = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare("SELECT id FROM roles WHERE id IN ({$marcadores})");
        $stmt->execute($ids);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public static function existeNombre(string $name, int $excluirId = 0): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT COUNT(*) FROM roles WHERE name = :name AND id <> :excluir');
        $stmt->execute([':name' => $name, ':excluir' => $excluirId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    public static function crear(string $name, string $description): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare('INSERT INTO roles (name, description) VALUES (:name, :description)');
        $stmt->execute([':name' => $name, ':description' => $description]);

        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $datos): void
    {
        $campos = [];
        $params = [':id' => $id];

        if (array_key_exists('name', $datos)) {
            $campos[] = 'name = :name';
            $params[':name'] = (string) $datos['name'];
        }

        if (array_key_exists('description', $datos)) {
            $campos[] = 'description = :description';
            $params[':description'] = (string) $datos['description'];
        }

        if (!$campos) {
            return;
        }

        $db = Database::conectar();
        $stmt = $db->prepare('UPDATE roles SET ' . implode(', ', $campos) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public static function eliminar(int $id): void
    {
        $db = Database::conectar();
        $stmt = $db->prepare('DELETE FROM roles WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public static function contarUsuarios(int $id): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT COUNT(*) FROM user_roles WHERE role_id = :id');
        $stmt->execute([':id' => $id]);

        return (int) $stmt->fetchColumn();
    }

    /** IDs de permisos asignados al rol. */
    public static function permisosDe(int $roleId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT permission_id FROM role_permissions WHERE role_id = :id ORDER BY permission_id ASC');
        $stmt->execute([':id' => $roleId]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** Reemplaza por completo la matriz de permisos de un rol. */
    public static function sincronizarPermisos(int $roleId, array $permisoIds): void
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $permisoIds), static fn(int $id): bool => $id > 0)));
        $db = Database::conectar();

        $db->beginTransaction();
        try {
            $db->prepare('DELETE FROM role_permissions WHERE role_id = :id')
                ->execute([':id' => $roleId]);

            if ($ids) {
                $stmt = $db->prepare(
                    'INSERT IGNORE INTO role_permissions (role_id, permission_id)
                     SELECT :role_id, id FROM permissions WHERE id = :permission_id'
                );

                foreach ($ids as $permisoId) {
                    $stmt->execute([
                        ':role_id'       => $roleId,
                        ':permission_id' => $permisoId,
                    ]);
                }
            }

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    private static function mapaPermisos(PDO $db): array
    {
        $mapa = [];
        $filas = $db->query('SELECT role_id, permission_id FROM role_permissions ORDER BY permission_id ASC')->fetchAll();

        foreach ($filas as $fila) {
            $mapa[(int) $fila['role_id']][] = (int) $fila['permission_id'];
        }

        return $mapa;
    }

    private static function normalizar(array &$rol, array $permisoIds): void
    {
        $rol['id']             = (int) $rol['id'];
        $rol['name']           = (string) $rol['name'];
        $rol['description']    = (string) $rol['description'];
        $rol['total_usuarios'] = (int) $rol['total_usuarios'];
        $rol['total_permisos'] = (int) $rol['total_permisos'];
        $rol['permiso_ids']    = array_values($permisoIds);
    }
}
