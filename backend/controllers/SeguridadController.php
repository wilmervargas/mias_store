<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Usuario.php';

class SeguridadController
{
    /** POST /?url=seguridad/cambiar-password (clave propia) */
    public function cambiarPassword(): void
    {
        try {
            $actor = Authz::requiereAutenticado();
            $datos = cuerpoJson();

            $actual = (string) ($datos['password_actual'] ?? '');
            $nueva = (string) ($datos['password_nueva'] ?? '');
            $confirmacion = (string) ($datos['password_confirmacion'] ?? '');

            if ($actual === '') {
                responder(false, 'Debes indicar tu contraseña actual.', 400);
            }

            if (!password_verify($actual, (string) $actor['password_hash'])) {
                responder(false, 'La contraseña actual no es correcta.', 400);
            }

            if ($this->longitud($nueva) < 8) {
                responder(false, 'La nueva contraseña debe tener al menos 8 caracteres.', 400);
            }

            if ($confirmacion !== '' && $nueva !== $confirmacion) {
                responder(false, 'La nueva contraseña y su confirmación no coinciden.', 400);
            }

            if (password_verify($nueva, (string) $actor['password_hash'])) {
                responder(false, 'La nueva contraseña debe ser diferente a la actual.', 400);
            }

            Usuario::actualizarPassword((int) $actor['id'], Auth::hashear($nueva));

            // Renueva el identificador de sesion despues de cambiar la clave.
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int) $actor['id'];
            Auth::refrescar();

            responder(true, ['mensaje' => 'Tu contraseña fue actualizada correctamente.'], 200);
        } catch (Throwable $e) {
            responder(false, 'No se pudo cambiar la contraseña: ' . $e->getMessage(), 500);
        }
    }

    /** POST /?url=seguridad/restablecer-password (clave de otro usuario) */
    public function restablecerPassword(): void
    {
        try {
            $actor = Authz::requiere('seguridad.claves');
            $datos = cuerpoJson();

            $usuarioId = (int) ($datos['user_id'] ?? 0);
            $email = Auth::normalizarEmail((string) ($datos['email'] ?? ''));

            $objetivo = null;
            if ($usuarioId > 0) {
                $objetivo = Usuario::buscarPorId($usuarioId);
            } elseif ($email !== '') {
                $objetivo = Usuario::buscarPorEmail($email);
            }

            if (!$objetivo) {
                responder(false, 'No se encontró el usuario indicado.', 404);
            }

            $esSuperActor = (int) $actor['is_superuser'] === 1;
            if ((int) $objetivo['is_superuser'] === 1 && !$esSuperActor) {
                responder(false, 'Solo un superusuario puede restablecer la clave de otro superusuario.', 403);
            }

            $password = (string) ($datos['password'] ?? '');
            $generada = false;

            if (trim($password) === '') {
                $password = Auth::generarClaveTemporal(14);
                $generada = true;
            } elseif ($this->longitud($password) < 8) {
                responder(false, 'La nueva contraseña debe tener al menos 8 caracteres.', 400);
            }

            Usuario::actualizarPassword((int) $objetivo['id'], Auth::hashear($password));

            if ((int) $objetivo['id'] === (int) $actor['id']) {
                session_regenerate_id(true);
                $_SESSION['user_id'] = (int) $actor['id'];
                Auth::refrescar();
            }

            responder(true, [
                'mensaje'           => 'Clave restablecida correctamente.',
                'usuario'           => [
                    'id'        => (int) $objetivo['id'],
                    'full_name' => (string) $objetivo['full_name'],
                    'email'     => (string) $objetivo['email'],
                ],
                'password_temporal' => $generada ? $password : null,
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'No se pudo restablecer la clave: ' . $e->getMessage(), 500);
        }
    }

    private function longitud(string $texto): int
    {
        return function_exists('mb_strlen') ? mb_strlen($texto, 'UTF-8') : strlen($texto);
    }
}
