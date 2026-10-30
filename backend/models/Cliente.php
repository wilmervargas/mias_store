<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Cliente
{
    /**
     * Lista todos los clientes con el resumen de sus compras.
     */
    public static function listar(): array
    {
        $db = Database::conectar();

        $sql = "SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.created_at,
                       COUNT(p.id) AS total_pedidos,
                       COALESCE(SUM(p.total), 0) AS total_gastado,
                       MAX(p.fecha_pedido) AS ultima_compra
                FROM clientes c
                LEFT JOIN pedidos p ON p.cliente_id = c.id
                GROUP BY c.id, c.nombre, c.email, c.telefono, c.direccion, c.created_at
                ORDER BY c.nombre ASC";

        return $db->query($sql)->fetchAll();
    }
}
