<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Catalogo.php';

class CatalogoController
{
    public function listar(string $tabla): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);
            $filtros = [
                'q'       => $_GET['q'] ?? '',
                'estatus' => $_GET['estatus'] ?? '',
                'idmarca' => $_GET['idmarca'] ?? '',
                'tipo'    => $_GET['tipo'] ?? '',
            ];
            responder(true, Catalogo::obtenerTodos($tabla, $soloActivos, $filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar ' . $tabla . ': ' . $e->getMessage(), 500);
        }
    }

    public function mostrar(string $tabla, int $id): void
    {
        try {
            $item = Catalogo::obtenerPorId($tabla, $id);
            if (!$item) {
                responder(false, "Registro #{$id} no encontrado en {$tabla}", 404);
            }
            responder(true, $item, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function crear(string $tabla): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            if (empty($datos['nombre'])) {
                responder(false, 'El nombre es obligatorio', 400);
            }
            if ($tabla === 'unidades' && empty($datos['abreviatura'])) {
                responder(false, 'La abreviatura es obligatoria', 400);
            }
            $id = Catalogo::crear($tabla, $datos);
            responder(true, ['id' => $id, 'mensaje' => 'Registro creado correctamente'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function actualizar(string $tabla, int $id): void
    {
        try {
            $actual = Catalogo::obtenerPorId($tabla, $id);
            if (!$actual) {
                responder(false, "Registro #{$id} no encontrado en {$tabla}", 404);
            }
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            Catalogo::actualizar($tabla, $id, array_merge($actual, $datos));
            responder(true, ['mensaje' => 'Registro actualizado correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function eliminar(string $tabla, int $id): void
    {
        try {
            $fisico = isset($_GET['fisico']) && (int) $_GET['fisico'] === 1;

            if ($fisico) {
                $resultado = Catalogo::eliminarFisico($tabla, $id);
                if (!$resultado['ok']) {
                    responder(false, $resultado['error'], $resultado['codigo']);
                }
                responder(true, ['mensaje' => "Registro #{$id} eliminado definitivamente"], 200);
            }

            Catalogo::eliminar($tabla, $id);
            responder(true, ['mensaje' => "Registro #{$id} marcado como Inactivo"], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 409);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }
}
