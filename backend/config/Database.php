<?php
declare(strict_types=1);

/**
 * Conexion a MySQL (WAMP) mediante PDO.
<<<<<<< HEAD
 * Base de datos: mias_store
=======
 * Base de datos: damasco
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
            $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db . ";charset=" . self::$charset;
=======
            // Permite apuntar a otra base (pruebas) sin tocar el codigo.
            $host = getenv('MIAS_DB_HOST') ?: self::$host;
            $db   = getenv('MIAS_DB_NAME') ?: self::$db;
            $user = getenv('MIAS_DB_USER') ?: self::$user;
            $pass = getenv('MIAS_DB_PASS');
            $pass = $pass === false ? self::$pass : $pass;

            $dsn = "mysql:host=" . $host . ";dbname=" . $db . ";charset=" . self::$charset;
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
<<<<<<< HEAD
                self::$conexion = new PDO($dsn, self::$user, self::$pass, $opciones);
=======
                self::$conexion = new PDO($dsn, $user, $pass, $opciones);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
<<<<<<< HEAD
                    'error'   => 'Fallo de conexion a la base de datos Mias_Store: ' . $e->getMessage(),
=======
                    'error'   => 'Fallo de conexion a la base de datos Damasco: ' . $e->getMessage(),
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$conexion;
    }
}
