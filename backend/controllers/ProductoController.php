<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Producto.php';

class ProductoController
{
    public function listar(): void
    {
        try {
            $soloActivos = !isset($_GET['todos']) && !isset($_GET['incluir_inactivos']);

            $filtros = [
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
                'agrupado'     => $_GET['agrupado'] ?? '',
            ];

            responder(true, Producto::buscar($filtros, $soloActivos), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar productos: ' . $e->getMessage(), 500);
        }
    }

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

    public function crear(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

            $errores = $this->validar($datos, true);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            $nuevoId = Producto::crear($datos);
            responder(true, [
                'id'      => $nuevoId,
                'mensaje' => "Producto registrado exitosamente en el catálogo Mia's Store",
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

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

            // Compatibilidad: updates simples (reactivar/desactivar) sin filas.
            $tieneFilas = isset($datos['filas']) || isset($datos['stock_inicial']) || isset($datos['almacen_id']) || isset($datos['precio']);
            if (!$tieneFilas) {
                $fusion = array_merge($actual, $datos);
                $errores = $this->validarCabecera($fusion);
                if (!empty($errores)) {
                    responder(false, $errores, 400);
                }
                // Para cambios simples de estatus/campos base en SKU antiguo, usar update directo por fila.
                $db = Database::conectar();
                $campos = [];
                $params = [':id' => $id];
                foreach (['nombre','descripcion','idestatus','idcategoria','idsubcategoria','idmarca','idmodelo','idunidad','unidad_medida','imagen'] as $c) {
                    if (array_key_exists($c, $datos)) {
                        $campos[] = "$c = :$c";
                        $params[":$c"] = $datos[$c];
                    }
                }
                if ($campos) {
                    $stmt = $db->prepare('UPDATE productos SET ' . implode(', ', $campos) . ' WHERE id = :id');
                    $stmt->execute($params);
                }
                responder(true, ['mensaje' => 'Producto actualizado correctamente'], 200);
            }

            $fusion  = array_merge($actual, $datos);
            // Mantener cabecera actual si no viene
            foreach (['nombre','descripcion','idcategoria','idsubcategoria','idmarca','idmodelo','idunidad','unidad_medida','sku_base','imagen','idestatus'] as $k) {
                if (!array_key_exists($k, $datos) && isset($actual[$k])) $fusion[$k] = $actual[$k];
            }
            $errores = $this->validar($fusion, false);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            Producto::actualizar($id, $fusion);
            responder(true, ['mensaje' => 'Producto actualizado correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

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
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

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

    private function validarCabecera(array $datos): array
    {
        $errores = [];
        if (empty($datos['nombre'])) $errores[] = 'El nombre del producto es obligatorio';
        if (empty($datos['idcategoria'])) $errores[] = 'Debes asignar una categoria valida';
        if (empty($datos['idmarca'])) $errores[] = 'Debes asignar una marca valida';
        if (!empty($datos['sku_base']) && !preg_match('/^[A-Za-z0-9._-]{3,64}$/', (string) $datos['sku_base'])) {
            $errores[] = 'El SKU solo admite letras, numeros, punto, guion y guion bajo (3 a 64 caracteres)';
        }
        return $errores;
    }

    private function validar(?array $datos, bool $requiereFilas): array
    {
        $errores = $this->validarCabecera($datos ?? []);

        $filas = $datos['filas'] ?? null;
        if (!is_array($filas)) {
            // Compatibilidad payload plano
            $filas = [[
                'almacen_id' => $datos['almacen_id'] ?? null,
                'ubicacion_id' => $datos['ubicacion_id'] ?? null,
                'idcolor' => $datos['idcolor'] ?? 1,
                'idtalla' => $datos['idtalla'] ?? 1,
                'codigo_barras' => $datos['codigo_barras'] ?? null,
                'costo' => $datos['costo'] ?? 0,
                'precio' => $datos['precio'] ?? null,
                'preciofull' => $datos['preciofull'] ?? null,
                'stock' => $datos['stock'] ?? ($datos['stock_inicial'] ?? 0),
            ]];
        }

        if ($requiereFilas && count($filas) === 0) {
            $errores[] = 'Debes agregar al menos una fila de almacen/variante';
        }

        $barcodes = [];
        foreach ($filas as $i => $fila) {
            $n = $i + 1;
            if (!isset($fila['precio']) || (float) $fila['precio'] <= 0) $errores[] = "Fila {$n}: el precio debe ser mayor a 0";
            if (isset($fila['costo']) && (float) $fila['costo'] < 0) $errores[] = "Fila {$n}: el costo no puede ser negativo";
            $stock = $fila['stock'] ?? ($fila['stock_inicial'] ?? 0);
            if ($stock !== '' && $stock !== null && (int) $stock < 0) $errores[] = "Fila {$n}: el stock no puede ser negativo";
            if (empty($fila['almacen_id'])) $errores[] = "Fila {$n}: debes seleccionar un almacen";
            $cb = trim((string) ($fila['codigo_barras'] ?? ''));
            if ($cb !== '') {
                $k = mb_strtolower($cb);
                if (isset($barcodes[$k])) $errores[] = "Fila {$n}: el codigo de barras esta repetido en el formulario";
                $barcodes[$k] = true;
            }
        }

        return $errores;
    }
}
