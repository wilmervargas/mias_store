<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Dolar.php';

class DolarController
{
    /** GET /index.php?url=dolar */
    public function index(): void
    {
        try {
            $tasa = Dolar::obtenerTasaActual();

            if (!$tasa) {
                responder(false, 'No hay tasa cambiaria configurada en el sistema', 404);
            }

            responder(true, 'Tasa cambiaria obtenida con exito', 200, [
                'tasa'   => (float) $tasa['monto'],
                'fecha'  => $tasa['fecha'],
                'moneda' => 'VES',
            ]);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar la tasa: ' . $e->getMessage(), 500);
        }
    }
}
