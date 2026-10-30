<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Categoria.php';

class CategoriaController
{
    /** GET /?url=categorias  (o ?todos=1 para incluir inactivas) */
    public function listar(): void
    {
        try {
            $soloActivas = !isset($_GET['incluir_inactivas']) && !isset($_GET['todos']);
            responder(true, Categoria::obtenerTodas($soloActivas), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar categorias: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=categorias/{id} */
    public function mostrar(int $id): void
    {
        try {
            $cat = Categoria::obtenerPorId($id);
            if (!$cat) {
                responder(false, "Categoria con ID #{$id} no encontrada", 404);
            }
            responder(true, $cat, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST /?url=categorias */
    public function crear(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            if (empty($datos['nombre'])) {
                responder(false, 'El nombre de la categoria es obligatorio', 400);
            }

            $nombre      = trim((string) $datos['nombre']);
            $descripcion = trim((string) ($datos['descripcion'] ?? ''));
            $nuevoId     = Categoria::crear($nombre, $descripcion);

            responder(true, ['id' => $nuevoId, 'nombre' => $nombre, 'mensaje' => 'Categoria creada con exito'], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** PUT /?url=categorias/{id} -> Actualizacion parcial (conserva lo no enviado). */
    public function actualizar(int $id): void
    {
        try {
            $actual = Categoria::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Categoria con ID #{$id} no encontrada", 404);
            }

            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $fusion = array_merge($actual, $datos);
            if (empty($fusion['nombre'])) {
                responder(false, 'El nombre no puede estar vacio', 400);
            }

            Categoria::actualizar(
                $id,
                trim((string) $fusion['nombre']),
                trim((string) ($fusion['descripcion'] ?? '')),
                (int) $fusion['idestatus']
            );
            responder(true, ['mensaje' => 'Categoria actualizada exitosamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=categorias/{id} -> Borrado logico. */
    public function eliminar(int $id): void
    {
        try {
            Categoria::eliminar($id);
            responder(true, ['mensaje' => "Categoria #{$id} desactivada (borrado logico)"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }
}
