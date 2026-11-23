<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Producto.php';

class ProductoController
{
    /**
     * GET /?url=productos
<<<<<<< HEAD
     * Filtros: q, idcategoria, idmarca, idmodelo, idcolor, idtalla,
     *          precioMin, precioMax, stockMin, stockMax, almacen, solo_agotados
=======
     * Acepta filtros: q, idcategoria, idmarca, precioMin, precioMax, stockMin
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
     * y ?todos=1 para incluir inactivos (Dashboard).
     */
    public function listar(): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);

            $filtros = [
<<<<<<< HEAD
                'q'            => $_GET['q'] ?? '',
                'idcategoria'  => $_GET['idcategoria'] ?? '',
                'idmarca'      => $_GET['idmarca'] ?? '',
                'idmodelo'     => $_GET['idmodelo'] ?? '',
                'idcolor'      => $_GET['idcolor'] ?? '',
                'idtalla'      => $_GET['idtalla'] ?? '',
                'precioMin'    => $_GET['precioMin'] ?? '',
                'precioMax'    => $_GET['precioMax'] ?? '',
                'stockMin'     => $_GET['stockMin'] ?? '',
                'stockMax'     => $_GET['stockMax'] ?? '',
                'almacen'      => $_GET['almacen'] ?? '',
                'solo_agotados' => $_GET['solo_agotados'] ?? '',
                'estatus'      => $_GET['estatus'] ?? '',
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
                'mensaje' => "Producto registrado exitosamente en el catálogo Mia's Store",
=======
                'mensaje' => 'Producto registrado exitosamente en el catalogo Damasco',
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /**
     * PUT /?url=productos/{id}
     * Actualizacion PARCIAL: fusiona lo enviado con el registro actual.
<<<<<<< HEAD
     * Si se envia "stock" distinto al actual, se registra un ajuste de inventario.
=======
     * Permite actualizar solo el stock o reactivar (idestatus = 1) sin reenviar todo.
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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

<<<<<<< HEAD
    /** DELETE /?url=productos/{id}[&fisico=1] */
    public function eliminar(int $id): void
    {
        try {
            $fisico = isset($_GET['fisico']) && (int) $_GET['fisico'] === 1;

            if ($fisico) {
                Producto::eliminarFisico($id);
                responder(true, ['mensaje' => "Producto #{$id} eliminado definitivamente"], 200);
            }

            Producto::eliminar($id);
            responder(true, ['mensaje' => "Producto #{$id} marcado como Inactivo"], 200);
        } catch (RuntimeException $e) {
            responder(false, $e->getMessage(), 404);
=======
    /** DELETE /?url=productos/{id} -> Borrado logico. */
    public function eliminar(int $id): void
    {
        try {
            Producto::eliminar($id);
            responder(true, ['mensaje' => "Producto #{$id} marcado como Inactivo"], 200);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /**
     * POST /?url=productos/{id}/imagen  (multipart/form-data)
<<<<<<< HEAD
=======
     * Valida tipo real con finfo, peso, genera nombre unico y mueve el archivo.
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
        if (empty($datos['nombre'])) $errores[] = 'El nombre del producto es obligatorio';
        if (!isset($datos['precio']) || (float) $datos['precio'] <= 0) $errores[] = 'El precio debe ser mayor a 0';
        if (isset($datos['costo']) && (float) $datos['costo'] < 0) $errores[] = 'El costo no puede ser negativo';
        if (isset($datos['stock']) && $datos['stock'] !== '' && (int) $datos['stock'] < 0) {
            $errores[] = 'El stock no puede ser negativo';
        }
        if (isset($datos['stock_inicial']) && (int) $datos['stock_inicial'] < 0) {
            $errores[] = 'El stock inicial no puede ser negativo';
        }
        if (empty($datos['idcategoria'])) $errores[] = 'Debes asignar una categoria valida';
        if (empty($datos['idmarca'])) $errores[] = 'Debes asignar una marca valida';
        if (!empty($datos['sku_base']) && !preg_match('/^[A-Za-z0-9._-]{3,64}$/', (string) $datos['sku_base'])) {
            $errores[] = 'El SKU solo admite letras, numeros, punto, guion y guion bajo (3 a 64 caracteres)';
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        }
        return $errores;
    }
}
