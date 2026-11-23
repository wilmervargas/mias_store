<?php
declare(strict_types=1);

/**
 * Conexion a MySQL (WAMP) mediante PDO.
 * Base de datos: mias_store
 * Usuario por defecto de WAMP: root  |  Contrasena: (vacia)
 */
class Database
{
    private static string $host    = 'localhost';
    private static string $db      = 'mias_store';
    private static string $user    = 'root';
    private static string $pass    = '';
    private static string $charset = 'utf8mb4';
    private static ?PDO $conexion  = null;

    public static function conectar(): PDO
    {
        if (self::$conexion === null) {
            $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db . ";charset=" . self::$charset;
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$conexion = new PDO($dsn, self::$user, self::$pass, $opciones);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Fallo de conexion a la base de datos Mias_Store: ' . $e->getMessage(),
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$conexion;
    }
}
