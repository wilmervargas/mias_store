<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/TasaCambio.php';

class TasaCambioController
{
    private const MONEDAS = ['USD', 'EUR', 'USDT', 'AJU'];
    private const FUENTES = ['bcv', 'usdt', 'manual', 'ajustada'];

    public function listar(): void
    {
        try {
            $filtros = [
                'moneda_base' => $_GET['moneda_base'] ?? '',
                'fuente' => $_GET['fuente'] ?? '',
                'desde' => $_GET['desde'] ?? '',
                'hasta' => $_GET['hasta'] ?? '',
            ];
            responder(true, TasaCambio::obtenerTodas($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar tasas: ' . $e->getMessage(), 500);
        }
    }

    public function resumen(): void
    {
        try {
            // Auto-actualiza en la primera entrada del día (sin forzar si ya se intentó).
            TasaCambio::asegurarDelDia();
            $monedas = TasaCambio::resumen();
            responder(true, [
                'fecha' => (new DateTime('now'))->format('Y-m-d'),
                'monedas' => $monedas,
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al obtener resumen de tasas: ' . $e->getMessage(), 500);
        }
    }

    public function sincronizar(): void
    {
        try {
            $resultado = TasaCambio::asegurarDelDia(null, true);
            if ($resultado === null) {
                $resultado = TasaCambio::sincronizar();
            }
            $monedas = TasaCambio::resumen();
            responder(true, [
                'mensaje' => 'Sincronización ejecutada.',
                'resultado' => $resultado,
                'resumen' => [
                    'fecha' => (new DateTime('now'))->format('Y-m-d'),
                    'monedas' => $monedas,
                ],
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al sincronizar tasas: ' . $e->getMessage(), 500);
        }
    }

    public function mostrar(int $id): void
    {
        try {
            $tasa = TasaCambio::obtenerPorId($id);
            if (!$tasa) {
                responder(false, "Tasa con ID #{$id} no encontrada", 404);
            }
            responder(true, $tasa, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function crear(): void
    {
        try {
            $datos = $this->leerJson();
            $errores = $this->validar($datos);
            if ($errores) {
                responder(false, $errores, 400);
            }

            $id = TasaCambio::crear($datos);
            responder(true, [
                'id' => $id,
                'mensaje' => 'Tasa registrada correctamente',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function actualizar(int $id): void
    {
        try {
            $actual = TasaCambio::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Tasa con ID #{$id} no encontrada", 404);
            }

            $datos = $this->leerJson();
            $fusion = array_merge($actual, $datos);
            $errores = $this->validar($fusion);
            if ($errores) {
                responder(false, $errores, 400);
            }

            TasaCambio::actualizar($id, $fusion);
            responder(true, ['mensaje' => 'Tasa actualizada correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function eliminar(int $id): void
    {
        try {
            $actual = TasaCambio::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Tasa con ID #{$id} no encontrada", 404);
            }
            TasaCambio::eliminar($id);
            responder(true, ['mensaje' => 'Tasa eliminada correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    private function leerJson(): array
    {
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            responder(false, 'Cuerpo de petición inválido. Se espera JSON', 400);
        }
        return $datos;
    }

    private function validar(array &$datos): array
    {
        $errores = [];
        $monedaBase = strtoupper(trim((string) ($datos['moneda_base'] ?? '')));
        $fuente = trim((string) ($datos['fuente'] ?? 'manual'));
        $tasa = $datos['tasa'] ?? null;
        $vigente = trim((string) ($datos['vigente_desde'] ?? ''));

        if (!in_array($monedaBase, self::MONEDAS, true)) {
            $errores[] = 'Moneda inválida. Usa USD, EUR, USDT o AJU.';
        }
        if (!in_array($fuente, self::FUENTES, true)) {
            $errores[] = 'Fuente inválida.';
        }
        if ($tasa === null || $tasa === '' || !is_numeric($tasa) || (float) $tasa <= 0) {
            $errores[] = 'La tasa debe ser mayor que cero.';
        }
        if ($vigente === '' || strtotime($vigente) === false) {
            $errores[] = 'La fecha de vigencia es inválida.';
        }
        if ($monedaBase === 'USDT' && $fuente === 'bcv') {
            $errores[] = 'USDT no puede usar fuente BCV.';
        }
        if ($monedaBase === 'AJU' && $fuente === 'bcv') {
            $errores[] = 'La tasa ajustada no puede usar fuente BCV.';
        }

        if (empty($errores)) {
            $datos['moneda_base'] = $monedaBase;
            $datos['fuente'] = $fuente;
            $datos['moneda'] = 'VES';
            $datos['tasa'] = (float) $tasa;
            $dt = new DateTime($vigente);
            $datos['vigente_desde'] = $dt->format('Y-m-d H:i:s');
        }

        return $errores;
    }
}
