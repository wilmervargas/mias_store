<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Subcategoria.php';
require_once __DIR__ . '/../models/Categoria.php';

class SubcategoriaController
{
    /** GET /?url=subcategorias (&idcategoria=&q=&todos=1) */
    public function listar(): void
    {
        try {
            $soloActivas = !isset($_GET['incluir_inactivas']) && !isset($_GET['todos']);
            $filtros = [
                'q'           => $_GET['q'] ?? '',
                'estatus'     => $_GET['estatus'] ?? '',
                'idcategoria' => $_GET['idcategoria'] ?? '',
            ];
            responder(true, Subcategoria::obtenerTodas($soloActivas, $filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar subcategorias: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=subcategorias/{id} */
    public function mostrar(int $id): void
    {
        try {
            $sub = Subcategoria::obtenerPorId($id);
            if (!$sub) {
                responder(false, "Subcategoria con ID #{$id} no encontrada", 404);
            }
            responder(true, $sub, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST /?url=subcategorias */
    public function crear(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
            if (empty($datos['nombre'])) {
                responder(false, 'El nombre de la subcategoria es obligatorio', 400);
            }
            if (empty($datos['idcategoria'])) {
                responder(false, 'Debes asignar una categoria valida', 400);
            }

            $idcategoria = (int) $datos['idcategoria'];
            if (!Categoria::obtenerPorId($idcategoria)) {
                responder(false, 'La categoria indicada no existe', 400);
            }

            $nombre  = trim((string) $datos['nombre']);
            $estatus = isset($datos['idestatus']) ? (int) $datos['idestatus'] : 1;
            $nuevoId = Subcategoria::crear($idcategoria, $nombre, $estatus);

            responder(true, [
                'id'          => $nuevoId,
                'idcategoria' => $idcategoria,
                'nombre'      => $nombre,
                'mensaje'     => 'Subcategoria creada con exito',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** PUT /?url=subcategorias/{id} */
    public function actualizar(int $id): void
    {
        try {
            $actual = Subcategoria::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Subcategoria con ID #{$id} no encontrada", 404);
            }

            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $fusion = array_merge($actual, $datos);
            if (empty($fusion['nombre'])) {
                responder(false, 'El nombre no puede estar vacio', 400);
            }
            if (empty($fusion['idcategoria'])) {
                responder(false, 'Debes asignar una categoria valida', 400);
            }

            $idcategoria = (int) $fusion['idcategoria'];
            if (!Categoria::obtenerPorId($idcategoria)) {
                responder(false, 'La categoria indicada no existe', 400);
            }

            Subcategoria::actualizar(
                $id,
                $idcategoria,
                trim((string) $fusion['nombre']),
                (int) ($fusion['idestatus'] ?? 1)
            );
            responder(true, ['mensaje' => 'Subcategoria actualizada exitosamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=subcategorias/{id}[&fisico=1] */
    public function eliminar(int $id): void
    {
        try {
            $fisico = isset($_GET['fisico']) && (int) $_GET['fisico'] === 1;

            if ($fisico) {
                $resultado = Subcategoria::eliminarFisico($id);
                if (!$resultado['ok']) {
                    responder(false, $resultado['error'], $resultado['codigo']);
                }
                responder(true, ['mensaje' => "Subcategoria #{$id} eliminada definitivamente"], 200);
            }

            Subcategoria::eliminar($id);
            responder(true, ['mensaje' => "Subcategoria #{$id} desactivada (borrado logico)"], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 409);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }
}
