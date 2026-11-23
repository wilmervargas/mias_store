<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Rol.php';
require_once __DIR__ . '/../models/Permiso.php';

/**
 * Gestion de sesion y del usuario autenticado.
 *
 * La sesion solo guarda el ID del usuario. En cada peticion se vuelve a
 * consultar la base de datos para reflejar cambios de estado o permisos.
 */
class Auth
{
    private const HASH_FALSO = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';

    private static ?array $usuario = null;
    private static bool $cargado = false;
    private static ?array $cachePermisos = null;

    /**
     * Configura la cookie de sesion y la inicia.
     * Debe llamarse antes de enviar cualquier salida.
     */
    public static function iniciar(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $seguro = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.gc_maxlifetime', '28800');

        session_name('mias_store_sid');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $seguro,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();
    }

    public static function normalizarEmail(string $email): string
    {
        $email = trim($email);
        return function_exists('mb_strtolower')
            ? mb_strtolower($email, 'UTF-8')
            : strtolower($email);
    }

    public static function hashear(string $password): string
    {
        $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
        return password_hash($password, $algoritmo);
    }

    /** Devuelve el usuario autenticado y activo, o null. */
    public static function usuario(): ?array
    {
        if (self::$cargado) {
            return self::$usuario;
        }

        self::$cargado = true;
        $id = (int) ($_SESSION['user_id'] ?? 0);

        if ($id <= 0) {
            self::$usuario = null;
            return null;
        }

        $usuario = Usuario::buscarPorId($id);

        // Cuenta eliminada, desactivada o inexistente: se invalida la sesion.
        if (!$usuario || (int) $usuario['is_active'] !== 1) {
            unset($_SESSION['user_id']);
            self::$usuario = null;
            return null;
        }

        self::$usuario = $usuario;
        return $usuario;
    }

    public static function id(): ?int
    {
        $usuario = self::usuario();
        return $usuario ? (int) $usuario['id'] : null;
    }

    public static function autenticado(): bool
    {
        return self::usuario() !== null;
    }

    public static function esSuperusuario(): bool
    {
        $usuario = self::usuario();
        return $usuario !== null && (int) $usuario['is_superuser'] === 1;
    }

    /**
     * Intenta autenticar por correo y contrasena.
     * Devuelve true solo si la cuenta existe, esta activa y la clave coincide.
     */
    public static function login(string $email, string $password): bool
    {
        $email = self::normalizarEmail($email);

        if ($email === '' || $password === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $usuario = Usuario::buscarPorEmail($email);

        if (!$usuario) {
            // Mantiene un costo similar al de una verificacion real.
            password_verify($password, self::HASH_FALSO);
            return false;
        }

        if (!password_verify($password, (string) $usuario['password_hash'])) {
            return false;
        }

        if ((int) $usuario['is_active'] !== 1) {
            return false;
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $usuario['id'];

        Usuario::registrarLogin((int) $usuario['id']);
        self::refrescar();

        return true;
    }

    public static function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }

        session_destroy();
        self::refrescar();
    }

    /** Limpia las caches internas para volver a consultar la base de datos. */
    public static function refrescar(): void
    {
        self::$usuario = null;
        self::$cargado = false;
        self::$cachePermisos = null;
    }

    /**
     * Permisos efectivos del usuario autenticado.
     *
     * Regla:
     * - Superusuario: todos los permisos del sistema.
     * - Override en user_permissions: manda sobre los roles.
     * - Roles asignados: union de sus permisos.
     */
    public static function permisosEfectivos(): array
    {
        if (self::$cachePermisos !== null) {
            return self::$cachePermisos;
        }

        $usuario = self::usuario();
        if (!$usuario) {
            return self::$cachePermisos = [];
        }

        if ((int) $usuario['is_superuser'] === 1) {
            return self::$cachePermisos = Permiso::todosLosCodigos();
        }

        $codigos = array_fill_keys(Permiso::codigosPorUsuario((int) $usuario['id']), true);
        $overrides = Permiso::overridesDeUsuario((int) $usuario['id']);

        foreach ($overrides as $codigo => $permitido) {
            if ($permitido) {
                $codigos[$codigo] = true;
            } else {
                unset($codigos[$codigo]);
            }
        }

        return self::$cachePermisos = array_values(array_keys($codigos));
    }

    /** Perfil publico del usuario (sin hash de contrasena). */
    public static function perfil(?array $usuario = null): array
    {
        $usuario = $usuario ?? self::usuario();
        if (!$usuario) {
            return [];
        }

        $roles = Rol::obtenerDeUsuario((int) $usuario['id']);
        $nombres = array_map(static fn(array $rol): string => (string) $rol['name'], $roles);
        $esSuper = (int) $usuario['is_superuser'] === 1;

        return [
            'id'           => (int) $usuario['id'],
            'full_name'    => (string) $usuario['full_name'],
            'email'        => (string) $usuario['email'],
            'is_active'    => (int) $usuario['is_active'],
            'is_staff'     => (int) $usuario['is_staff'],
            'is_superuser' => (int) $usuario['is_superuser'],
            'last_login'   => $usuario['last_login'],
            'created_at'   => $usuario['created_at'],
            'roles'        => $roles,
            'role_label'   => $esSuper
                ? 'Superusuario'
                : ($nombres ? implode(', ', $nombres) : 'Sin rol'),
        ];
    }

    /** Respuesta estandar de sesion para /auth/login y /auth/me. */
    public static function payloadSesion(): array
    {
        $usuario = self::usuario();
        if (!$usuario) {
            return [];
        }

        $permisos = self::permisosEfectivos();
        $esSuper = (int) $usuario['is_superuser'] === 1;

        $puedeSeguridad = $esSuper
            || in_array('usuarios.ver', $permisos, true)
            || in_array('roles.ver', $permisos, true)
            || in_array('roles.gestionar', $permisos, true)
            || in_array('seguridad.ver', $permisos, true)
            || in_array('seguridad.claves', $permisos, true);

        return [
            'usuario'          => self::perfil($usuario),
            'permisos'         => $permisos,
            'puede_seguridad'  => $puedeSeguridad,
        ];
    }

    /** Genera una clave temporal legible y segura (para restablecimientos). */
    public static function generarClaveTemporal(int $longitud = 14): string
    {
        $mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $minusculas = 'abcdefghijkmnopqrstuvwxyz';
        $numeros    = '23456789';
        $simbolos   = '!@#$%*_-+?';
        $todos      = $mayusculas . $minusculas . $numeros . $simbolos;

        $clave = [
            $mayusculas[random_int(0, strlen($mayusculas) - 1)],
            $minusculas[random_int(0, strlen($minusculas) - 1)],
            $numeros[random_int(0, strlen($numeros) - 1)],
            $simbolos[random_int(0, strlen($simbolos) - 1)],
        ];

        for ($i = count($clave); $i < $longitud; $i++) {
            $clave[] = $todos[random_int(0, strlen($todos) - 1)];
        }

        for ($i = count($clave) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$clave[$i], $clave[$j]] = [$clave[$j], $clave[$i]];
        }

        return implode('', $clave);
    }
}
