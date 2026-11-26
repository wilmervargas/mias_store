<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Verifica y repara la base de datos/tablas al entrar al sistema.
 * - Crea la BD si no existe.
 * - Crea tablas faltantes usando database/schema_completo.sql.
 * - Garantiza un superusuario por defecto.
 */
class DbBootstrap
{
    private const DEFAULT_EMAIL = 'wilmere.vargas@gmail.com';
    private const DEFAULT_PASSWORD = 'Kg*19022021*';
    private const DEFAULT_NAME = 'Wilmere Vargas';

    /** Ejecuta bootstrap completo (BD + tablas + usuario). */
    public static function asegurar(PDO $serverPdo, string $dbName): PDO
    {
        $serverPdo->exec(
            "CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
        );
        $serverPdo->exec("USE `{$dbName}`");

        self::aplicarSchema($serverPdo);
        self::asegurarUsuarioDefault($serverPdo);
        self::marcarListo($dbName);

        return $serverPdo;
    }

    /** Verifica tablas faltantes en una BD ya conectada; repara si hace falta. */
    public static function verificarTablas(PDO $db, string $dbName): void
    {
        if (self::estaListo($dbName)) return;

        $schemaPath = self::schemaPath();
        if (!is_file($schemaPath)) {
            self::marcarListo($dbName);
            return;
        }

        $tablasRequeridas = self::tablasDelSchema($schemaPath);
        if (!$tablasRequeridas) {
            self::marcarListo($dbName);
            return;
        }

        $existentes = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $existentes = array_fill_keys(array_map('strtolower', $existentes), true);
        $faltan = [];
        foreach ($tablasRequeridas as $t) {
            if (!isset($existentes[strtolower($t)])) $faltan[] = $t;
        }

        if ($faltan) {
            self::aplicarSchema($db);
        }
        self::asegurarUsuarioDefault($db);
        self::marcarListo($dbName);
    }

    private static function aplicarSchema(PDO $db): void
    {
        $schemaPath = self::schemaPath();
        if (!is_file($schemaPath)) return;

        $sql = file_get_contents($schemaPath);
        if ($sql === false || trim($sql) === '') return;

        // Quitar comentarios de línea y bloques simples
        $sql = preg_replace('/^\s*--.*$/m', '', $sql);
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

        // Separar por ; al final de línea/instrucción
        $stmts = preg_split('/;\s*(?:\r?\n|$)/', $sql);
        $db->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($stmts as $stmt) {
            $stmt = trim($stmt);
            if ($stmt === '') continue;
            // Evitar CREATE DATABASE/USE duplicados agresivos en conexión ya seleccionada
            if (preg_match('/^CREATE\s+DATABASE/i', $stmt)) continue;
            if (preg_match('/^USE\s+/i', $stmt)) continue;
            try {
                $db->exec($stmt);
            } catch (Throwable $e) {
                // Idempotente: ignorar errores de objetos ya existentes; registrar otros en log.
                $msg = $e->getMessage();
                if (stripos($msg, 'already exists') !== false) continue;
                if (stripos($msg, 'Duplicate') !== false) continue;
                error_log('[DbBootstrap] ' . $msg . ' :: ' . substr($stmt, 0, 120));
            }
        }
        $db->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    private static function asegurarUsuarioDefault(PDO $db): void
    {
        // Verificar que exista la tabla users
        try {
            $existeTabla = $db->query("SHOW TABLES LIKE 'users'")->fetchColumn();
        } catch (Throwable $e) {
            return;
        }
        if (!$existeTabla) return;

        $email = self::DEFAULT_EMAIL;
        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        if ($stmt->fetchColumn()) return;

        $hash = password_hash(self::DEFAULT_PASSWORD, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT);
        $stmt = $db->prepare(
            'INSERT INTO users (full_name, email, password_hash, is_active, is_staff, is_superuser)
             VALUES (:name, :email, :hash, 1, 1, 1)'
        );
        $stmt->execute([
            ':name' => self::DEFAULT_NAME,
            ':email' => $email,
            ':hash' => $hash,
        ]);
    }

    private static function tablasDelSchema(string $schemaPath): array
    {
        $sql = file_get_contents($schemaPath) ?: '';
        preg_match_all('/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`?([a-zA-Z0-9_]+)`?/i', $sql, $m);
        return array_values(array_unique($m[1] ?? []));
    }

    private static function schemaPath(): string
    {
        return dirname(__DIR__, 2) . '/database/schema_completo.sql';
    }

    private static function flagPath(string $dbName): string
    {
        $dir = sys_get_temp_dir();
        return $dir . '/mias_store_bootstrap_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $dbName) . '.flag';
    }

    private static function estaListo(string $dbName): bool
    {
        $flag = self::flagPath($dbName);
        if (!is_file($flag)) return false;
        // Revalidar cada 6 horas por si se agregaron tablas
        return (time() - filemtime($flag)) < 21600;
    }

    private static function marcarListo(string $dbName): void
    {
        @file_put_contents(self::flagPath($dbName), (string) time());
    }

    public static function invalidarCache(string $dbName): void
    {
        $flag = self::flagPath($dbName);
        if (is_file($flag)) @unlink($flag);
    }
}
