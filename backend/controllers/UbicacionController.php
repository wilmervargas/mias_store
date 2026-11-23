<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Ubicacion.php';

class UbicacionController
{
    /** GET /?url=ubicaciones&almacen=1&todos=1 */
    public function listar(): void
    {
        try {
            $almacen = isset($_GET['almacen']) && $_GET['almacen'] !== '' ? (int) $_GET['almacen'] : null;
            $soloActivas = !isset($_GET['todos']) && !isset($_GET['incluir_inactivas']);
            $filtros = [
                'q'       => $_GET['q'] ?? '',
                'tipo'    => $_GET['tipo'] ?? '',
                'estatus' => $_GET['estatus'] ?? '',
            ];
            responder(true, Ubicacion::obtenerTodas($almacen, $soloActivas, $filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar ubicaciones: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=ubicaciones/tipos */
    public function tipos(): void
    {
        try {
            responder(true, Ubicacion::tipos(), 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function mostrar(int $id): void
    {
        try {
            $ubicacion = Ubicacion::obtenerPorId($id);
            if (!$ubicacion) {
                responder(false, "Ubicacion con ID #{$id} no encontrada", 404);
            }
            responder(true, $ubicacion, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function crear(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            $errores = $this->validar($datos);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }
            $id = Ubicacion::crear($datos);
            responder(true, ['id' => $id, 'mensaje' => 'Ubicacion creada correctamente'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function actualizar(int $id): void
    {
        try {
            $actual = Ubicacion::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Ubicacion con ID #{$id} no encontrada", 404);
            }
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            $fusion = array_merge($actual, $datos);
            $errores = $this->validar($fusion);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }
            Ubicacion::actualizar($id, $fusion);
            responder(true, ['mensaje' => 'Ubicacion actualizada correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function eliminar(int $id): void
    {
        try {
            $fisico = isset($_GET['fisico']) && (int) $_GET['fisico'] === 1;

            if ($fisico) {
                $resultado = Ubicacion::eliminarFisico($id);
                if (!$resultado['ok']) {
                    responder(false, $resultado['error'], $resultado['codigo']);
                }
                responder(true, ['mensaje' => "Ubicacion #{$id} eliminada definitivamente"], 200);
            }

            Ubicacion::eliminar($id);
            responder(true, ['mensaje' => "Ubicacion #{$id} marcada como Inactiva"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    private function validar(array $datos): array
    {
        $errores = [];
        if (empty($datos['almacen_id'])) $errores[] = 'Debes indicar el almacen';
        if (empty($datos['idtipo_ubicacion'])) $errores[] = 'Debes indicar el tipo de ubicacion';
        if (empty($datos['codigo'])) $errores[] = 'El codigo de la ubicacion es obligatorio';
        if (empty($datos['nombre'])) $errores[] = 'El nombre de la ubicacion es obligatorio';
        return $errores;
    }
}
