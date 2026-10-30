<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/Dolar.php';
require_once __DIR__ . '/../models/Carrito.php';

class PedidoController
{
    /**
     * POST /index.php?url=pedidos
     * El carrito se lee de items_carrito (BD), nunca del cliente.
     */
    public function crear(): void
    {
        try {
            $cuerpo = file_get_contents('php://input');
            $data   = json_decode($cuerpo, true);

            if (!is_array($data)) {
                responder(false, 'El cuerpo de la peticion debe ser un JSON valido', 400);
            }

            $obligatorios = ['cliente_id', 'direccion_envio', 'metodo_pago'];
            foreach ($obligatorios as $campo) {
                if (empty($data[$campo])) {
                    responder(false, "El campo '{$campo}' es requerido.", 400);
                }
            }

            $clienteId = (int) $data['cliente_id'];
            $items     = Carrito::itemsParaPedido($clienteId);

            if (count($items) === 0) {
                responder(false, 'El carrito esta vacio. Agrega productos antes de pagar.', 400);
            }

            if (empty($data['tasa_dolar_usada'])) {
                $tasaBD = Dolar::obtenerTasaActual();
                $data['tasa_dolar_usada'] = $tasaBD ? (float) $tasaBD['monto'] : 639.00;
            }

            $pedidoId = Pedido::crear([
                'cliente_id'        => $clienteId,
                'direccion_envio'   => trim((string) $data['direccion_envio']),
                'metodo_pago'       => trim((string) $data['metodo_pago']),
                'numero_referencia' => trim((string) ($data['numero_referencia'] ?? ('REF-' . time()))),
                'tasa_dolar_usada'  => (float) $data['tasa_dolar_usada'],
            ], $items);

            Carrito::vaciar($clienteId);

            $detalle = Pedido::obtenerDetalle($pedidoId);

            responder(true, "Pedido #{$pedidoId} procesado exitosamente", 201, $detalle);
        } catch (Throwable $e) {
            responder(false, 'Error al procesar el pedido: ' . $e->getMessage(), 400);
        }
    }

    /** GET /index.php?url=pedidos  (listado para el Dashboard) */
    public function listar(): void
    {
        try {
            responder(true, 'Pedidos obtenidos con exito', 200, Pedido::listarTodos());
        } catch (Throwable $e) {
            responder(false, 'Error al consultar los pedidos: ' . $e->getMessage(), 500);
        }
    }

    /** GET /index.php?url=pedidos&id={id} */
    public function ver(int $id): void
    {
        try {
            $pedido = Pedido::obtenerDetalle($id);

            if (!$pedido) {
                responder(false, "Pedido #{$id} no encontrado", 404);
            }

            responder(true, 'Pedido obtenido con exito', 200, $pedido);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar el pedido: ' . $e->getMessage(), 500);
        }
    }
}
