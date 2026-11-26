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
    private static bool $bootstrapped = false;

    public static function conectar(): PDO
    {
        if (self::$conexion === null) {
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_general_ci",
            ];

            try {
                $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db . ";charset=" . self::$charset;
                self::$conexion = new PDO($dsn, self::$user, self::$pass, $opciones);
            } catch (PDOException $e) {
                // Si la BD no existe o falla, intentar bootstrap (crear BD/tablas/usuario).
                self::$conexion = self::intentarBootstrap($opciones, $e);
            }
        }

        if (!self::$bootstrapped) {
            self::$bootstrapped = true;
            try {
                require_once __DIR__ . '/../core/DbBootstrap.php';
                DbBootstrap::verificarTablas(self::$conexion, self::$db);
            } catch (Throwable $e) {
                error_log('[Database] Bootstrap verificacion: ' . $e->getMessage());
            }
        }

        return self::$conexion;
    }

    private static function intentarBootstrap(array $opciones, PDOException $original): PDO
    {
        try {
            require_once __DIR__ . '/../core/DbBootstrap.php';
            $dsnServer = "mysql:host=" . self::$host . ";charset=" . self::$charset;
            $serverPdo = new PDO($dsnServer, self::$user, self::$pass, $opciones);
            return DbBootstrap::asegurar($serverPdo, self::$db);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => 'Fallo de conexion a la base de datos Mias_Store: ' . $original->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}
