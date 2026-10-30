<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Marca
{
    /** Marcas con conteo de productos activos. $soloActivas protege la Tienda de Clase 1. */
    public static function obtenerTodas(bool $soloActivas = true): array
    {
        $db    = Database::conectar();
        $where = $soloActivas ? "WHERE m.idestatus = 1" : "";
        $sql   = "SELECT m.*, COUNT(p.id) AS total_productos
                  FROM marcas m
                  LEFT JOIN productos p ON p.idmarca = m.id AND p.idestatus = 1
                  {$where}
                  GROUP BY m.id, m.idestatus, m.nombre
                  ORDER BY m.nombre ASC";
        return $db->query($sql)->fetchAll();
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM marcas WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(string $nombre): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("INSERT INTO marcas (nombre, idestatus) VALUES (:nombre, 1)");
        $stmt->execute([':nombre' => $nombre]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, string $nombre, int $idestatus = 1): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE marcas SET nombre = :nombre, idestatus = :idestatus WHERE id = :id");
        return $stmt->execute([':id' => $id, ':nombre' => $nombre, ':idestatus' => $idestatus]);
    }

    /** Borrado logico. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE marcas SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
