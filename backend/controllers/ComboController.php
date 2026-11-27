<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Combo.php';

class ComboController
{
    public function listar(): void
    {
        try {
            Authz::requiere('combos.ver');
            $filtros = [
                'q' => $_GET['q'] ?? '',
                'idestatus' => $_GET['idestatus'] ?? ($_GET['activo'] ?? ''),
                'activo' => $_GET['activo'] ?? '',
            ];
            responder(true, Combo::obtenerTodas($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar combos: ' . $e->getMessage(), 500);
        }
    }

    public function mostrar(int $id): void
    {
        try {
            Authz::requiere('combos.ver');
            $combo = Combo::obtenerPorId($id);
            if (!$combo) responder(false, "Combo con ID #{$id} no encontrado", 404);
            responder(true, $combo, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function crear(): void
    {
        try {
            Authz::requiere('combos.crear');
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) responder(false, 'Cuerpo de petición inválido. Se espera JSON', 400);
            $id = Combo::crear($datos);
            $combo = Combo::obtenerPorId($id);
            responder(true, ['id' => $id, 'combo' => $combo, 'mensaje' => 'Combo creado correctamente'], 201);
        } catch (InvalidArgumentException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (Throwable $e) {
            responder(false, 'Error al crear combo: ' . $e->getMessage(), 500);
        }
    }

    public function actualizar(int $id): void
    {
        try {
            Authz::requiere('combos.editar');
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) responder(false, 'Cuerpo de petición inválido. Se espera JSON', 400);
            Combo::actualizar($id, $datos);
            $combo = Combo::obtenerPorId($id);
            responder(true, ['combo' => $combo, 'mensaje' => 'Combo actualizado correctamente'], 200);
        } catch (InvalidArgumentException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 404);
        } catch (Throwable $e) {
            responder(false, 'Error al actualizar combo: ' . $e->getMessage(), 500);
        }
    }

    public function eliminar(int $id): void
    {
        try {
            Authz::requiere('combos.eliminar');
            $combo = Combo::obtenerPorId($id);
            if (!$combo) responder(false, "Combo con ID #{$id} no encontrado", 404);
            Combo::eliminar($id);
            responder(true, ['mensaje' => 'Combo eliminado correctamente'], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 404);
        } catch (Throwable $e) {
            responder(false, 'Error al eliminar combo: ' . $e->getMessage(), 500);
        }
    }

    public function subirImagen(int $id): void
    {
        try {
            Authz::requiere('combos.editar');
            $combo = Combo::obtenerPorId($id);
            if (!$combo) responder(false, "Combo con ID #{$id} no encontrado", 404);

            if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
                responder(false, 'No se recibió ninguna imagen válida', 400);
            }
            $archivo = $_FILES['imagen'];

            $permitidos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($archivo['tmp_name']);
            if (!isset($permitidos[$mime])) {
                responder(false, 'Formato no permitido. Solo JPG, PNG, WEBP o GIF', 400);
            }
            if ($archivo['size'] > 5 * 1024 * 1024) {
                responder(false, 'La imagen supera el límite de 5 MB', 400);
            }

            $extension = $permitidos[$mime];
            $nombreUnico = 'combo_' . $id . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
            $dir = __DIR__ . '/../imagenes/';
            if (!is_dir($dir)) mkdir($dir, 0777, true);
            $destino = $dir . $nombreUnico;

            if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
                responder(false, 'No se pudo guardar la imagen en el servidor', 500);
            }

            Combo::actualizar($id, ['imagen' => $nombreUnico]);
            responder(true, [
                'imagen' => $nombreUnico,
                'url' => 'http://localhost:8000/imagenes/' . $nombreUnico,
                'mensaje' => 'Imagen subida correctamente',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    public function vender(int $id): void
    {
        try {
            Authz::requiere('combos.editar');
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) responder(false, 'Cuerpo de petición inválido. Se espera JSON', 400);
            $resultado = Combo::registrarVenta($id, $datos);
            responder(true, $resultado, 201);
        } catch (InvalidArgumentException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 400);
        } catch (Throwable $e) {
            responder(false, 'Error al registrar venta de combo: ' . $e->getMessage(), 500);
        }
    }

    public function productosDisponibles(): void
    {
        try {
            Authz::requiere('combos.ver');
            responder(true, Combo::productosDisponibles(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar productos: ' . $e->getMessage(), 500);
        }
    }
}
