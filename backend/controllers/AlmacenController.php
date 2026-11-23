<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Almacen.php';

class AlmacenController
{
    public function listar(): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);
            $filtros = [
                'q'       => $_GET['q'] ?? '',
                'estatus' => $_GET['estatus'] ?? '',
            ];
            responder(true, Almacen::obtenerTodos($soloActivos, $filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar almacenes: ' . $e->getMessage(), 500);
        }
    }

    public function mostrar(int $id): void
    {
        try {
            $almacen = Almacen::obtenerPorId($id);
            if (!$almacen) {
                responder(false, "Almacen con ID #{$id} no encontrado", 404);
            }
            responder(true, $almacen, 200);
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
            $id = Almacen::crear($datos);
            responder(true, ['id' => $id, 'mensaje' => 'Almacen creado correctamente'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function actualizar(int $id): void
    {
        try {
            $actual = Almacen::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Almacen con ID #{$id} no encontrado", 404);
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
            Almacen::actualizar($id, $fusion);
            responder(true, ['mensaje' => 'Almacen actualizado correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function eliminar(int $id): void
    {
        try {
            $fisico = isset($_GET['fisico']) && (int) $_GET['fisico'] === 1;

            if ($fisico) {
                $resultado = Almacen::eliminarFisico($id);
                if (!$resultado['ok']) {
                    responder(false, $resultado['error'], $resultado['codigo']);
                }
                responder(true, ['mensaje' => "Almacen #{$id} eliminado definitivamente"], 200);
            }

            Almacen::eliminar($id);
            responder(true, ['mensaje' => "Almacen #{$id} marcado como Inactivo"], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 409);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    private function validar(array $datos): array
    {
        $errores = [];
        if (empty($datos['codigo'])) $errores[] = 'El codigo del almacen es obligatorio';
        if (empty($datos['nombre'])) $errores[] = 'El nombre del almacen es obligatorio';
        return $errores;
    }
}
