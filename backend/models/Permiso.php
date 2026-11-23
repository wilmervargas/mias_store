<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Permiso
{
    /** Orden de aparicion de los modulos en la matriz visual. */
    private const MODULOS = [
        'productos'   => 'Productos y SKUs',
        'inventario'  => 'Inventario',
        'movimientos' => 'Movimientos',
        'almacenes'   => 'Almacenes',
        'ubicaciones' => 'Ubicaciones',
        'categorias'  => 'Categorias',
        'marcas'      => 'Marcas',
        'catalogos'   => 'Catalogos (modelos, colores y tallas)',
        'reportes'    => 'Reportes',
        'whatsapp'    => 'WhatsApp',
        'usuarios'    => 'Usuarios y cuentas',
        'roles'       => 'Roles y permisos',
        'seguridad'   => 'Centro de claves y seguridad',
    ];

    private const ACCIONES = [
        'ver'       => 'Ver',
        'crear'     => 'Crear',
        'editar'    => 'Editar',
        'eliminar'  => 'Eliminar',
        'gestionar' => 'Gestionar',
        'claves'    => 'Claves',
    ];

    public static function etiquetaModulo(string $modulo): string
    {
        return self::MODULOS[$modulo] ?? ucfirst($modulo);
    }

    public static function etiquetaAccion(string $accion): string
    {
        return self::ACCIONES[$accion] ?? ucfirst($accion);
    }

    public static function acciones(): array
    {
        $acciones = [];
        foreach (self::ACCIONES as $clave => $etiqueta) {
            $acciones[] = ['key' => $clave, 'label' => $etiqueta];
        }
        return $acciones;
    }

    /** Lista plana de permisos, ordenada por modulo y luego por id. */
    public static function obtenerTodos(): array
    {
        $db = Database::conectar();
        $filas = $db->query(
            'SELECT id, code, module, description FROM permissions ORDER BY id ASC'
        )->fetchAll();

        $ordenModulo = array_flip(array_keys(self::MODULOS));
        $permisos = array_map([self::class, 'normalizarFila'], $filas);

        usort($permisos, static function (array $a, array $b) use ($ordenModulo): int {
            $oa = $ordenModulo[$a['module']] ?? 999;
            $ob = $ordenModulo[$b['module']] ?? 999;
            return $oa <=> $ob ?: $a['id'] <=> $b['id'];
        });

        return $permisos;
    }

    /** Matriz agrupada por modulo, lista para pintar en el dashboard. */
    public static function matriz(): array
    {
        $grupos = [];
        foreach (self::obtenerTodos() as $permiso) {
            $modulo = $permiso['module'];
            if (!isset($grupos[$modulo])) {
                $grupos[$modulo] = [
                    'module'   => $modulo,
                    'label'    => self::etiquetaModulo($modulo),
                    'permisos' => [],
                ];
            }
            $grupos[$modulo]['permisos'][] = $permiso;
        }

        $orden = array_flip(array_keys(self::MODULOS));
        $lista = array_values($grupos);
        usort($lista, static function (array $a, array $b) use ($orden): int {
            return ($orden[$a['module']] ?? 999) <=> ($orden[$b['module']] ?? 999);
        });

        return $lista;
    }

    public static function todosLosCodigos(): array
    {
        $db = Database::conectar();
        return $db->query('SELECT code FROM permissions ORDER BY id ASC')
            ->fetchAll(PDO::FETCH_COLUMN);
    }

    /** Codigos que aportan los roles asignados a un usuario. */
    public static function codigosPorUsuario(int $userId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT DISTINCT p.code
             FROM permissions p
             INNER JOIN role_permissions rp ON rp.permission_id = p.id
             INNER JOIN user_roles ur ON ur.role_id = rp.role_id
             WHERE ur.user_id = :user_id'
        );
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Overrides explicitos del usuario.
     * Devuelve [codigo => bool] donde true = permitir y false = denegar.
     */
    public static function overridesDeUsuario(int $userId): array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            'SELECT p.code, up.allowed
             FROM user_permissions up
             INNER JOIN permissions p ON p.id = up.permission_id
             WHERE up.user_id = :user_id'
        );
        $stmt->execute([':user_id' => $userId]);

        $mapa = [];
        foreach ($stmt->fetchAll() as $fila) {
            $mapa[(string) $fila['code']] = (int) $fila['allowed'] === 1;
        }
        return $mapa;
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
        $stmt = $db->prepare("SELECT id FROM permissions WHERE id IN ({$marcadores})");
        $stmt->execute($ids);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    private static function normalizarFila(array $fila): array
    {
        $code = (string) $fila['code'];
        $accion = explode('.', $code, 2)[1] ?? '';

        return [
            'id'           => (int) $fila['id'],
            'code'         => $code,
            'module'       => (string) $fila['module'],
            'action'       => $accion,
            'action_label' => self::etiquetaAccion($accion),
            'description'  => (string) $fila['description'],
        ];
    }
}
