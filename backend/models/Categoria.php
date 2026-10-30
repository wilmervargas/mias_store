<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Categoria
{
    /** Categorias con conteo de productos activos. $soloActivas protege la Tienda de Clase 1. */
    public static function obtenerTodas(bool $soloActivas = true): array
    {
        $db    = Database::conectar();
        $where = $soloActivas ? "WHERE c.idestatus = 1" : "";
        $sql   = "SELECT c.*, COUNT(p.id) AS total_productos
                  FROM categorias c
                  LEFT JOIN productos p ON p.idcategoria = c.id AND p.idestatus = 1
                  {$where}
                  GROUP BY c.id, c.idestatus, c.nombre, c.descripcion
                  ORDER BY c.nombre ASC";
        return $db->query($sql)->fetchAll();
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM categorias WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(string $nombre, string $descripcion): int
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("INSERT INTO categorias (nombre, descripcion, idestatus) VALUES (:nombre, :descripcion, 1)");
        $stmt->execute([':nombre' => $nombre, ':descripcion' => $descripcion]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, string $nombre, string $descripcion, int $idestatus = 1): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE categorias SET nombre = :nombre, descripcion = :descripcion, idestatus = :idestatus WHERE id = :id");
        return $stmt->execute([
            ':id'          => $id,
            ':nombre'      => $nombre,
            ':descripcion' => $descripcion,
            ':idestatus'   => $idestatus,
        ]);
    }

    /** Borrado logico. */
    public static function eliminar(int $id): bool
    {
        $db   = Database::conectar();
        $stmt = $db->prepare("UPDATE categorias SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
