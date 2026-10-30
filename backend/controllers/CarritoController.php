<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Carrito.php';

class CarritoController
{
    /** GET ?url=carrito&cliente_id=1 */
    public function listar(): void
    {
        $clienteId = (int) ($_GET['cliente_id'] ?? 0);

        if ($clienteId <= 0) {
            responder(false, 'cliente_id es requerido', 400);
        }

        try {
            $items = Carrito::listar($clienteId);

            $totalUSD = 0;
            foreach ($items as $item) {
                $totalUSD += ((float) $item['precio'] * (int) $item['cantidad']);
            }

            responder(true, 'Carrito obtenido', 200, [
                'items'    => $items,
                'totalUSD' => round($totalUSD, 2),
            ]);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar el carrito: ' . $e->getMessage(), 500);
        }
    }

    /** POST ?url=carrito/items  { cliente_id, producto_id, variante_id?, cantidad } */
    public function agregar(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            responder(false, 'El cuerpo de la peticion debe ser un JSON valido', 400);
        }

        if (empty($data['cliente_id']) || empty($data['producto_id'])) {
            responder(false, 'cliente_id y producto_id son requeridos', 400);
        }

        $clienteId  = (int) $data['cliente_id'];
        $productoId = (int) $data['producto_id'];
        $varianteId = isset($data['variante_id']) && $data['variante_id'] !== null && $data['variante_id'] !== ''
            ? (int) $data['variante_id']
            : null;
        $cantidad   = (int) ($data['cantidad'] ?? 1);

        try {
            Carrito::agregarItem($clienteId, $productoId, $cantidad, $varianteId);

            responder(true, 'Producto agregado al carrito', 201, [
                'items'    => Carrito::listar($clienteId),
                'totalUSD' => $this->totalUSD($clienteId),
            ]);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** PUT ?url=carrito/items/{id}  { cantidad } */
    public function actualizar(int $itemId): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            responder(false, 'El cuerpo de la peticion debe ser un JSON valido', 400);
        }

        $cantidad = (int) ($data['cantidad'] ?? 0);

        try {
            Carrito::actualizarCantidad($itemId, $cantidad);
            responder(true, 'Cantidad actualizada', 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** DELETE ?url=carrito/items/{id} */
    public function eliminar(int $itemId): void
    {
        try {
            Carrito::eliminarItem($itemId);
            responder(true, 'Item eliminado', 200);
        } catch (Throwable $e) {
            responder(false, 'Error al eliminar el item: ' . $e->getMessage(), 500);
        }
    }

    /** DELETE ?url=carrito&cliente_id=1 */
    public function vaciar(): void
    {
        $clienteId = (int) ($_GET['cliente_id'] ?? 0);

        if ($clienteId <= 0) {
            responder(false, 'cliente_id es requerido', 400);
        }

        try {
            Carrito::vaciar($clienteId);
            responder(true, 'Carrito vaciado', 200, [
                'items'    => [],
                'totalUSD' => 0,
            ]);
        } catch (Throwable $e) {
            responder(false, 'Error al vaciar el carrito: ' . $e->getMessage(), 500);
        }
    }

    private function totalUSD(int $clienteId): float
    {
        $total = 0;
        foreach (Carrito::listar($clienteId) as $item) {
            $total += ((float) $item['precio'] * (int) $item['cantidad']);
        }
        return round($total, 2);
    }
}
