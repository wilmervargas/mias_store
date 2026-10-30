<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Variante.php';

class VarianteController
{
    /** GET ?url=productos/{id}/variantes */
    public function listar(int $productoId): void
    {
        try {
            responder(true, Variante::listar($productoId), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar variantes: ' . $e->getMessage(), 500);
        }
    }

    /** GET ?url=variantes/{id} */
    public function mostrar(int $id): void
    {
        try {
            $variante = Variante::obtener($id);
            if (!$variante) {
                responder(false, "Variante #{$id} no encontrada", 404);
            }
            responder(true, $variante, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST ?url=productos/{id}/variantes */
    public function crear(int $productoId): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $nuevoId = Variante::crear($productoId, $datos);
            responder(true, [
                'id'      => $nuevoId,
                'mensaje' => 'Variante creada correctamente',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** PUT ?url=variantes/{id} */
    public function actualizar(int $id): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            if (!Variante::actualizar($id, $datos)) {
                responder(false, "Variante #{$id} no encontrada", 404);
            }

            responder(true, ['mensaje' => 'Variante actualizada correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** DELETE ?url=variantes/{id} -> desactiva (no borra). */
    public function eliminar(int $id): void
    {
        try {
            if (!Variante::desactivar($id)) {
                responder(false, "Variante #{$id} no encontrada", 404);
            }
            responder(true, ['mensaje' => "Variante #{$id} desactivada"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }
}
