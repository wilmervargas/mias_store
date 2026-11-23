<?php
declare(strict_types=1);

require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/../helpers/response.php';

/**
 * Autorizacion centralizada.
 *
 * Orden de evaluacion de Authz::puede($codigo):
 * 1. Sin sesion o cuenta inactiva  -> false
 * 2. is_superuser = 1              -> true
 * 3. Override en user_permissions  -> allowed
 * 4. Permiso en algun rol          -> true
 * 5. En otro caso                  -> false
 */
class Authz
{
    public static function puede(string $codigo): bool
    {
        $usuario = Auth::usuario();
        if (!$usuario || (int) $usuario['is_active'] !== 1) {
            return false;
        }

        if ((int) $usuario['is_superuser'] === 1) {
            return true;
        }

        return in_array($codigo, Auth::permisosEfectivos(), true);
    }

    public static function puedeAlguno(array $codigos): bool
    {
        foreach ($codigos as $codigo) {
            if (self::puede((string) $codigo)) {
                return true;
            }
        }
        return false;
    }

    public static function requiereAutenticado(): array
    {
        $usuario = Auth::usuario();
        if (!$usuario) {
            responder(false, 'Debes iniciar sesión para continuar.', 401);
        }
        return $usuario;
    }

    public static function requiere(string $codigo): array
    {
        $usuario = self::requiereAutenticado();
        if (!self::puede($codigo)) {
            responder(false, 'No tienes permisos para realizar esta acción.', 403);
        }
        return $usuario;
    }

    public static function requiereAlguno(array $codigos): array
    {
        $usuario = self::requiereAutenticado();
        if (!self::puedeAlguno($codigos)) {
            responder(false, 'No tienes permisos para realizar esta acción.', 403);
        }
        return $usuario;
    }

    /**
     * Acceso a la seccion "Seguridad y Accesos".
     * Superusuario o cualquier permiso de administracion de accesos.
     */
    public static function puedeVerSeguridad(): bool
    {
        if (Auth::esSuperusuario()) {
            return true;
        }

        return self::puedeAlguno([
            'usuarios.ver',
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',
            'roles.ver',
            'roles.gestionar',
            'seguridad.ver',
            'seguridad.claves',
        ]);
    }

    public static function requiereSeguridad(): array
    {
        $usuario = self::requiereAutenticado();
        if (!self::puedeVerSeguridad()) {
            responder(false, 'No tienes permisos para acceder a Seguridad y Accesos.', 403);
        }
        return $usuario;
    }
}
