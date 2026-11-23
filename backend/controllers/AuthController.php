<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Auth.php';

class AuthController
{
    /** POST /?url=auth/login */
    public function login(): void
    {
        try {
            $datos = cuerpoJson();
            $email = (string) ($datos['email'] ?? '');
            $password = (string) ($datos['password'] ?? '');

            if ($email === '' || $password === '') {
                responder(false, 'Correo electrónico o contraseña incorrectos.', 401);
            }

            if (!Auth::login($email, $password)) {
                // Mensaje generico: evita revelar si el correo existe.
                responder(false, 'Correo electrónico o contraseña incorrectos.', 401);
            }

            responder(true, Auth::payloadSesion(), 200);
        } catch (Throwable $e) {
            responder(false, 'No se pudo iniciar sesión. Intenta nuevamente.', 500);
        }
    }

    /** GET /?url=auth/me */
    public function me(): void
    {
        try {
            if (!Auth::usuario()) {
                responder(false, 'Sesión no iniciada o expirada.', 401);
            }

            responder(true, Auth::payloadSesion(), 200);
        } catch (Throwable $e) {
            responder(false, 'No se pudo consultar la sesión.', 500);
        }
    }

    /** POST /?url=auth/logout */
    public function logout(): void
    {
        try {
            Auth::logout();
            responder(true, ['mensaje' => 'Sesión cerrada correctamente.'], 200);
        } catch (Throwable $e) {
            responder(false, 'No se pudo cerrar la sesión.', 500);
        }
    }
}
