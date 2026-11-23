<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Usuario
{
    public static function buscarPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();

        return $fila ?: null;
    }

    public static function buscarPorEmail(string $email): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $fila = $stmt->fetch();

        return $fila ?: null;
    }

    /**
     * Lista de usuarios con sus roles.
     * Filtros: q (nombre/correo), estado (1 activo, 0 inactivo).
     */
    public static function listar(array $filtros = []): array
    {
        $db = Database::conectar();
        $where = [];
        $params = [];

        if (!empty($filtros['q'])) {
            $where[] = '(u.full_name LIKE :q1 OR u.email LIKE :q2)';
            $busqueda = '%' . trim((string) $filtros['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
        }

        if (isset($filtros['estado']) && $filtros['estado'] !== '') {
            $where[] = 'u.is_active = :activo';
            $params[':activo'] = ((int) $filtros['estado']) === 1 ? 1 : 0;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT u.id, u.full_name, u.email, u.is_active, u.is_staff,
                       u.is_superuser, u.last_login, u.created_at, u.updated_at
                FROM users u
                {$whereSql}
                ORDER BY u.is_superuser DESC, u.is_active DESC, u.full_name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $usuarios = $stmt->fetchAll();
        $mapaRoles = self::mapaRoles($db);

        foreach ($usuarios as &$usuario) {
            $usuario = self::normalizarSalida($usuario, $mapaRoles[(int) $usuario['id']] ?? []);
        }
        unset($usuario);

        return $usuarios;
    }

    public static function obtenerPorIdConRoles(int $id): ?array
    {
        $usuario = self::buscarPorId($id);
        if (!$usuario) {
            return null;
        }

        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT r.id, r.name, r.description
             FROM roles r
             INNER JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = :user_id
             ORDER BY r.name ASC'
        );
        $stmt->execute([':user_id' => $id]);
        $roles = array_map(static fn(array $fila): array => [
            'id'          => (int) $fila['id'],
            'name'        => (string) $fila['name'],
            'description' => (string) $fila['description'],
        ], $stmt->fetchAll());

        return self::normalizarSalida($usuario, $roles);
    }

    public static function existeEmail(string $email, int $excluirId = 0): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT COUNT(*) FROM users WHERE email = :email AND id <> :excluir');
        $stmt->execute([':email' => $email, ':excluir' => $excluirId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Crea una cuenta y sus roles.
     * Espera: full_name, email, password_hash, is_active, is_staff,
     *         is_superuser y roles (array de IDs).
     */
    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare(
                'INSERT INTO users (full_name, email, password_hash, is_active, is_staff, is_superuser)
                 VALUES (:full_name, :email, :password_hash, :is_active, :is_staff, :is_superuser)'
            );
            $stmt->execute([
                ':full_name'     => (string) $datos['full_name'],
                ':email'         => (string) $datos['email'],
                ':password_hash' => (string) $datos['password_hash'],
                ':is_active'     => (int) ($datos['is_active'] ?? 1),
                ':is_staff'      => (int) ($datos['is_staff'] ?? 1),
                ':is_superuser'  => (int) ($datos['is_superuser'] ?? 0),
            ]);

            $id = (int) $db->lastInsertId();
            self::sincronizarRoles($id, (array) ($datos['roles'] ?? []));

            $db->commit();
            return $id;
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Actualizacion parcial. Solo modifica las claves presentes.
     * Si incluye "roles", reemplaza la asignacion completa.
     */
    public static function actualizar(int $id, array $datos): void
    {
        $campos = [];
        $params = [':id' => $id];

        foreach (['full_name', 'email', 'password_hash'] as $campo) {
            if (array_key_exists($campo, $datos)) {
                $campos[] = "{$campo} = :{$campo}";
                $params[":{$campo}"] = (string) $datos[$campo];
            }
        }

        foreach (['is_active', 'is_staff', 'is_superuser'] as $campo) {
            if (array_key_exists($campo, $datos)) {
                $campos[] = "{$campo} = :{$campo}";
                $params[":{$campo}"] = ((int) $datos[$campo]) === 1 ? 1 : 0;
            }
        }

        $db = Database::conectar();
        $db->beginTransaction();

        try {
            if ($campos) {
                $stmt = $db->prepare('UPDATE users SET ' . implode(', ', $campos) . ' WHERE id = :id');
                $stmt->execute($params);
            }

            if (array_key_exists('roles', $datos)) {
                self::sincronizarRoles($id, (array) $datos['roles']);
            }

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    public static function eliminar(int $id): void
    {
        $db = Database::conectar();
        $stmt = $db->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public static function actualizarPassword(int $id, string $hash): void
    {
        $db = Database::conectar();
        $stmt = $db->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $stmt->execute([':hash' => $hash, ':id' => $id]);
    }

    public static function registrarLogin(int $id): void
    {
        $db = Database::conectar();
        $stmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    /** Cantidad de superusuarios activos, opcionalmente excluyendo uno. */
    public static function contarSuperusuariosActivos(int $excluirId = 0): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM users
             WHERE is_superuser = 1 AND is_active = 1 AND id <> :excluir'
        );
        $stmt->execute([':excluir' => $excluirId]);

        return (int) $stmt->fetchColumn();
    }

    public static function rolesIds(int $id): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare('SELECT role_id FROM user_roles WHERE user_id = :id ORDER BY role_id ASC');
        $stmt->execute([':id' => $id]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** Reemplaza los roles del usuario. Se usa dentro de transacciones. */
    public static function sincronizarRoles(int $userId, array $roleIds): void
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $roleIds), static fn(int $id): bool => $id > 0)));
        $db = Database::conectar();

        $db->prepare('DELETE FROM user_roles WHERE user_id = :id')
            ->execute([':id' => $userId]);

        if (!$ids) {
            return;
        }

        $stmt = $db->prepare(
            'INSERT IGNORE INTO user_roles (user_id, role_id)
             SELECT :user_id, id FROM roles WHERE id = :role_id'
        );

        foreach ($ids as $roleId) {
            $stmt->execute([':user_id' => $userId, ':role_id' => $roleId]);
        }
    }

    /** Quita el hash y agrega etiquetas de rol para la respuesta JSON. */
    public static function normalizarSalida(array $fila, array $roles = []): array
    {
        $fila['id']           = (int) $fila['id'];
        $fila['is_active']    = (int) $fila['is_active'];
        $fila['is_staff']     = (int) $fila['is_staff'];
        $fila['is_superuser'] = (int) $fila['is_superuser'];
        $fila['roles']        = array_values($roles);

        $nombres = array_map(static fn(array $rol): string => (string) $rol['name'], $fila['roles']);
        $fila['role_label'] = ((int) $fila['is_superuser'] === 1)
            ? 'Superusuario'
            : ($nombres ? implode(', ', $nombres) : 'Sin rol');

        unset($fila['password_hash']);
        return $fila;
    }

    private static function mapaRoles(PDO $db): array
    {
        $mapa = [];
        $filas = $db->query(
            'SELECT ur.user_id, r.id, r.name, r.description
             FROM user_roles ur
             INNER JOIN roles r ON r.id = ur.role_id
             ORDER BY r.name ASC'
        )->fetchAll();

        foreach ($filas as $fila) {
            $mapa[(int) $fila['user_id']][] = [
                'id'          => (int) $fila['id'],
                'name'        => (string) $fila['name'],
                'description' => (string) $fila['description'],
            ];
        }

        return $mapa;
    }
}
