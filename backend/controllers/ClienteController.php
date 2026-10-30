<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Cliente.php';

class ClienteController
{
    /** GET /index.php?url=clientes */
    public function listar(): void
    {
        try {
            responder(true, 'Clientes obtenidos con exito', 200, Cliente::listar());
        } catch (Throwable $e) {
            responder(false, 'Error al consultar los clientes: ' . $e->getMessage(), 500);
        }
    }
}
