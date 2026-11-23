<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Producto.php';
<<<<<<< HEAD
require_once __DIR__ . '/../models/Inventario.php';
=======
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

class ReporteController
{
    /** GET /?url=reportes/resumen */
    public function resumen(): void
    {
        try {
            $datos = [
                'resumen'    => Producto::resumenInventario(),
                'categorias' => Producto::valorPorCategoria(),
<<<<<<< HEAD
                'almacenes'  => Producto::stockPorAlmacen(),
=======
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            ];
            responder(true, $datos, 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el resumen: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=reportes/stock-critico&umbral=10 */
    public function stockCritico(): void
    {
        try {
            $umbral = isset($_GET['umbral']) ? max(0, (int) $_GET['umbral']) : 10;
            responder(true, Producto::stockCritico($umbral), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el reporte: ' . $e->getMessage(), 500);
        }
    }
<<<<<<< HEAD

    /** GET /?url=reportes/stock-por-almacen */
    public function stockPorAlmacen(): void
    {
        try {
            responder(true, Producto::stockPorAlmacen(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el reporte: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=reportes/stock-por-ubicacion&almacen=1 */
    public function stockPorUbicacion(): void
    {
        try {
            $almacen = isset($_GET['almacen']) && $_GET['almacen'] !== '' ? (int) $_GET['almacen'] : null;
            responder(true, Producto::stockPorUbicacion($almacen), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el reporte: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=reportes/valor-inventario */
    public function valorInventario(): void
    {
        try {
            responder(true, Producto::valorInventario(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el reporte: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=reportes/kardex&producto=10 */
    public function kardex(): void
    {
        try {
            $producto = isset($_GET['producto']) ? (int) $_GET['producto'] : 0;
            if ($producto <= 0) {
                responder(false, 'Debes indicar el producto para el kardex', 400);
            }
            responder(true, Inventario::movimientos(['producto' => $producto, 'limite' => 500]), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al generar el kardex: ' . $e->getMessage(), 500);
        }
    }
=======
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
}
