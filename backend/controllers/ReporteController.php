<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Producto.php';

class ReporteController
{
    /** GET /?url=reportes/resumen */
    public function resumen(): void
    {
        try {
            $datos = [
                'resumen'    => Producto::resumenInventario(),
                'categorias' => Producto::valorPorCategoria(),
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
}
