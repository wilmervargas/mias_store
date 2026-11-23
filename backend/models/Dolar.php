<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Dolar
{
    /** Tasa oficial mas reciente registrada en damasco.sql. */
    public static function obtenerTasaActual(): ?array
    {
        $db = Database::conectar();
        $sql = "SELECT id, fecha, monto
                FROM dolar
                ORDER BY fecha DESC, id DESC
                LIMIT 1";

        $resultado = $db->query($sql)->fetch();
        return $resultado ?: null;
    }

    /** Historial de las ultimas 10 variaciones cambiarias. */
    public static function historial(): array
    {
        $db = Database::conectar();
        $sql = "SELECT id, fecha, monto
                FROM dolar
                ORDER BY fecha DESC, id DESC
                LIMIT 10";

        return $db->query($sql)->fetchAll();
    }
}
