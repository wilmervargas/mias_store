<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Inventario.php';
require_once __DIR__ . '/../models/Producto.php';

class InventarioController
{
    /** GET /?url=inventario&almacen=1&ubicacion=2&producto=10&q=...&solo_con_stock=1 */
    public function listar(): void
    {
        try {
            $filtros = [
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
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
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
        }
    }

    /**
     * GET /?url=inventario/listado
     * Listado agrupado por producto para el modulo de inventarios.
     */
    public function listado(): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);
            $filtros = [
                'q'             => $_GET['q'] ?? '',
                'idcategoria'   => $_GET['idcategoria'] ?? '',
                'idmarca'       => $_GET['idmarca'] ?? '',
                'idunidad'      => $_GET['idunidad'] ?? '',
                'almacen'       => $_GET['almacen'] ?? '',
                'stock_estado'  => $_GET['stock_estado'] ?? '',
                'estatus'       => $_GET['estatus'] ?? '',
                'pagina'        => $_GET['pagina'] ?? $_GET['page'] ?? '',
                'por_pagina'    => $_GET['por_pagina'] ?? $_GET['limit'] ?? '',
                'paginado'      => '1',
            ];

            responder(true, Producto::buscarAgrupado($filtros, $soloActivos), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar inventario: ' . $e->getMessage(), 500);
        }
    }

    /** PUT /?url=inventario/{id} */
    public function actualizar(int $id): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            Inventario::actualizar($id, $datos);
            responder(true, ['mensaje' => 'Registro de inventario actualizado correctamente'], 200);
        } catch (InvalidArgumentException | RuntimeException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=inventario/{id} */
    public function eliminar(int $id): void
    {
        try {
            Inventario::eliminar($id);
            responder(true, ['mensaje' => 'Registro de inventario eliminado correctamente'], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }
}
