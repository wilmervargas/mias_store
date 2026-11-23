<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Inventario.php';

class InventarioController
{
<<<<<<< HEAD
    /** GET /?url=inventario&almacen=1&ubicacion=2&producto=10&q=...&solo_con_stock=1 */
=======
    /** GET ?url=inventario */
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    public function listar(): void
    {
        try {
            $filtros = [
<<<<<<< HEAD
                'almacen'         => $_GET['almacen'] ?? '',
                'ubicacion'       => $_GET['ubicacion'] ?? '',
                'producto'        => $_GET['producto'] ?? '',
                'q'               => $_GET['q'] ?? '',
                'solo_con_stock'  => $_GET['solo_con_stock'] ?? '',
            ];
            responder(true, Inventario::listar($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar inventario: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=inventario/movimientos&producto=10&tipo=entrada */
    public function movimientos(): void
    {
        try {
            $filtros = [
                'producto' => $_GET['producto'] ?? '',
                'tipo'     => $_GET['tipo'] ?? '',
                'almacen'  => $_GET['almacen'] ?? '',
                'desde'    => $_GET['desde'] ?? '',
                'hasta'    => $_GET['hasta'] ?? '',
                'q'        => $_GET['q'] ?? '',
                'limite'   => $_GET['limite'] ?? '',
            ];
            responder(true, Inventario::movimientos($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar movimientos: ' . $e->getMessage(), 500);
        }
    }

    /** POST /?url=inventario/movimientos */
    public function registrar(): void
=======
                'q'                => $_GET['q'] ?? '',
                'producto_id'      => $_GET['producto_id'] ?? '',
                'variante_id'      => $_GET['variante_id'] ?? '',
                'almacen_id'       => $_GET['almacen_id'] ?? '',
                'ubicacion_id'     => $_GET['ubicacion_id'] ?? '',
                'sku'              => $_GET['sku'] ?? '',
                'bajo_minimo'      => $_GET['bajo_minimo'] ?? '',
                'incluir_inactivos'=> $_GET['incluir_inactivos'] ?? '',
            ];

            responder(true, Inventario::listar($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar inventario: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=inventario/kardex */
    public function kardex(): void
    {
        try {
            $filtros = [
                'producto_id' => $_GET['producto_id'] ?? '',
                'variante_id' => $_GET['variante_id'] ?? '',
                'almacen_id'  => $_GET['almacen_id'] ?? '',
                'tipo'        => $_GET['tipo'] ?? '',
                'desde'       => $_GET['desde'] ?? '',
                'hasta'       => $_GET['hasta'] ?? '',
                'limite'      => $_GET['limite'] ?? 100,
                'offset'      => $_GET['offset'] ?? 0,
            ];

            responder(true, Inventario::kardex($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar el kardex: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=inventario/resumen */
    public function resumen(): void
    {
        try {
            responder(true, Inventario::resumen(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el resumen de inventario: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=inventario/critico */
    public function critico(): void
    {
        try {
            responder(true, Inventario::listar(['bajo_minimo' => 1]), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar stock critico: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=inventario/clasificacion */
    public function clasificacion(): void
    {
        try {
            responder(true, Inventario::clasificacionPendiente(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar clasificacion pendiente: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=inventario/stock/{varianteId} */
    public function stockVariante(int $varianteId): void
    {
        try {
            responder(true, [
                'variante_id' => $varianteId,
                'disponible'  => Inventario::stockVariante($varianteId),
            ], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST ?url=inventario/movimientos */
    public function movimiento(): void
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
<<<<<<< HEAD
            $id = Inventario::registrar($datos);
            responder(true, ['id' => $id, 'mensaje' => 'Movimiento registrado correctamente'], 201);
        } catch (InvalidArgumentException | RuntimeException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** GET /?url=inventario/producto/{id} */
    public function stockProducto(int $productoId): void
    {
        try {
            responder(true, Inventario::stockPorAlmacen($productoId), 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
=======

            $inventarioId = Inventario::registrarMovimiento($datos);

            responder(true, [
                'inventario_id' => $inventarioId,
                'mensaje'       => 'Movimiento de inventario registrado',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** POST ?url=inventario/transferencias */
    public function transferir(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            Inventario::transferir($datos);

            responder(true, ['mensaje' => 'Transferencia registrada correctamente'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        }
    }
}
