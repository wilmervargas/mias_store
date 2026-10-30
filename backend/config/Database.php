<?php
declare(strict_types=1);

/**
 * Conexion a MySQL (WAMP) mediante PDO.
 * Base de datos: damasco
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
            // Permite apuntar a otra base (pruebas) sin tocar el codigo.
            $host = getenv('MIAS_DB_HOST') ?: self::$host;
            $db   = getenv('MIAS_DB_NAME') ?: self::$db;
            $user = getenv('MIAS_DB_USER') ?: self::$user;
            $pass = getenv('MIAS_DB_PASS');
            $pass = $pass === false ? self::$pass : $pass;

            $dsn = "mysql:host=" . $host . ";dbname=" . $db . ";charset=" . self::$charset;
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$conexion = new PDO($dsn, $user, $pass, $opciones);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Fallo de conexion a la base de datos Damasco: ' . $e->getMessage(),
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$conexion;
    }
}
