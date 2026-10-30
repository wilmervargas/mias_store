<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Marca.php';

class MarcaController
{
    /** GET /?url=marcas  (o ?todos=1 para incluir inactivas) */
    public function listar(): void
    {
        try {
            $soloActivas = !isset($_GET['incluir_inactivas']) && !isset($_GET['todos']);
            responder(true, Marca::obtenerTodas($soloActivas), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar marcas: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=marcas/{id} */
    public function mostrar(int $id): void
    {
        try {
            $marca = Marca::obtenerPorId($id);
            if (!$marca) {
                responder(false, "Marca con ID #{$id} no encontrada", 404);
            }
            responder(true, $marca, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST /?url=marcas */
    public function crear(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            if (empty($datos['nombre'])) {
                responder(false, 'El nombre comercial de la marca es obligatorio', 400);
            }

            $nombre  = trim((string) $datos['nombre']);
            $nuevoId = Marca::crear($nombre);

            responder(true, ['id' => $nuevoId, 'nombre' => $nombre, 'mensaje' => 'Marca registrada exitosamente'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** PUT /?url=marcas/{id} -> Actualizacion parcial. */
    public function actualizar(int $id): void
    {
        try {
            $actual = Marca::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Marca con ID #{$id} no encontrada", 404);
            }

            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $fusion = array_merge($actual, $datos);
            if (empty($fusion['nombre'])) {
                responder(false, 'El nombre no puede estar vacio', 400);
            }

            Marca::actualizar($id, trim((string) $fusion['nombre']), (int) $fusion['idestatus']);
            responder(true, ['mensaje' => 'Marca actualizada con exito'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=marcas/{id} -> Borrado logico. */
    public function eliminar(int $id): void
    {
        try {
            Marca::eliminar($id);
            responder(true, ['mensaje' => "Marca #{$id} desactivada"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }
}
