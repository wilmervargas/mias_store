<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Producto.php';

class ProductoController
{
    /**
     * GET /?url=productos
     * Acepta filtros: q, idcategoria, idmarca, precioMin, precioMax, stockMin
     * y ?todos=1 para incluir inactivos (Dashboard).
     */
    public function listar(): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);

            $filtros = [
                'q'           => $_GET['q'] ?? '',
                'idcategoria' => $_GET['idcategoria'] ?? '',
                'idmarca'     => $_GET['idmarca'] ?? '',
                'idmodelo'    => $_GET['idmodelo'] ?? '',
                'talla_id'    => $_GET['talla_id'] ?? '',
                'color_id'    => $_GET['color_id'] ?? '',
                'precioMin'   => $_GET['precioMin'] ?? '',
                'precioMax'   => $_GET['precioMax'] ?? '',
                'stockMin'    => $_GET['stockMin'] ?? '',
                'con_stock'   => $_GET['con_stock'] ?? '',
            ];

            responder(true, Producto::buscar($filtros, $soloActivos), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar productos: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=productos/{id} */
    public function mostrar(int $id): void
    {
        try {
            $producto = Producto::obtenerPorId($id);
            if (!$producto) {
                responder(false, "Producto con ID #{$id} no encontrado", 404);
            }
            responder(true, $producto, 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST /?url=productos */
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

            $nuevoId = Producto::crear($datos);
            responder(true, [
                'id'      => $nuevoId,
                'mensaje' => 'Producto registrado exitosamente en el catalogo Damasco',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /**
     * PUT /?url=productos/{id}
     * Actualizacion PARCIAL: fusiona lo enviado con el registro actual.
     * Permite actualizar solo el stock o reactivar (idestatus = 1) sin reenviar todo.
     */
    public function actualizar(int $id): void
    {
        try {
            $actual = Producto::obtenerPorId($id);
            if (!$actual) {
                responder(false, "Producto con ID #{$id} no encontrado", 404);
            }

            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $fusion  = array_merge($actual, $datos);
            $errores = $this->validar($fusion);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            Producto::actualizar($id, $fusion);
            responder(true, ['mensaje' => 'Producto actualizado correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=productos/{id} -> Borrado logico. */
    public function eliminar(int $id): void
    {
        try {
            Producto::eliminar($id);
            responder(true, ['mensaje' => "Producto #{$id} marcado como Inactivo"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /**
     * POST /?url=productos/{id}/imagen  (multipart/form-data)
     * Valida tipo real con finfo, peso, genera nombre unico y mueve el archivo.
     */
    public function subirImagen(int $id): void
    {
        try {
            if (!Producto::obtenerPorId($id)) {
                responder(false, "Producto con ID #{$id} no encontrado", 404);
            }

            if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
                responder(false, 'No se recibio ninguna imagen valida', 400);
            }
            $archivo = $_FILES['imagen'];

            $permitidos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($archivo['tmp_name']);
            if (!isset($permitidos[$mime])) {
                responder(false, 'Formato no permitido. Solo JPG, PNG o WEBP', 400);
            }
            if ($archivo['size'] > 2 * 1024 * 1024) {
                responder(false, 'La imagen supera el limite de 2 MB', 400);
            }

            $extension   = $permitidos[$mime];
            $nombreUnico = 'prod_' . $id . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
            $destino     = __DIR__ . '/../imagenes/' . $nombreUnico;

            if (!is_dir(__DIR__ . '/../imagenes')) {
                mkdir(__DIR__ . '/../imagenes', 0777, true);
            }
            if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
                responder(false, 'No se pudo guardar la imagen en el servidor', 500);
            }

            Producto::setImagen($id, $nombreUnico);
            responder(true, [
                'imagen'  => $nombreUnico,
                'url'     => 'http://localhost:8000/imagenes/' . $nombreUnico,
                'mensaje' => 'Imagen subida y asociada al producto',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    private function validar(?array $datos): array
    {
        $errores = [];
        if (empty($datos['nombre'])) {
            $errores[] = 'El nombre del producto es obligatorio';
        }
        if (!isset($datos['precio']) || !is_numeric($datos['precio']) || (float) $datos['precio'] <= 0) {
            $errores[] = 'El precio debe ser mayor a 0';
        }
        if (isset($datos['preciofull']) && $datos['preciofull'] !== ''
            && (!is_numeric($datos['preciofull']) || (float) $datos['preciofull'] < 0)) {
            $errores[] = 'El precio de lista no puede ser negativo';
        }
        if (isset($datos['costo']) && $datos['costo'] !== ''
            && (!is_numeric($datos['costo']) || (float) $datos['costo'] < 0)) {
            $errores[] = 'El costo no puede ser negativo';
        }
        if (isset($datos['stock']) && $datos['stock'] !== ''
            && (!is_numeric($datos['stock']) || (int) $datos['stock'] < 0)) {
            $errores[] = 'El stock no puede ser negativo';
        }
        if (empty($datos['idcategoria'])) {
            $errores[] = 'Debes asignar una categoria valida';
        }
        if (empty($datos['idmarca'])) {
            $errores[] = 'Debes asignar una marca valida';
        }
        return $errores;
    }
}
