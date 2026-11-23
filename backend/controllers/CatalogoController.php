<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Catalogo.php';

<<<<<<< HEAD
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
=======
/**
 * Controlador generico para los catalogos de inventario.
 * Recursos: almacenes, ubicaciones, tallas, colores, modelos.
 */
class CatalogoController
{
    private const MODELOS = [
        'almacenes'   => Almacen::class,
        'ubicaciones' => Ubicacion::class,
        'tallas'      => Talla::class,
        'colores'     => Color::class,
        'modelos'     => Modelo::class,
    ];

    /** GET ?url={recurso} */
    public function listar(string $recurso): void
    {
        try {
            $clase = $this->clase($recurso);
            $datos = match ($recurso) {
                'ubicaciones' => $clase::listar(
                    isset($_GET['almacen_id']) ? (int) $_GET['almacen_id'] : null
                ),
                'modelos' => $clase::listar(
                    isset($_GET['idmarca']) ? (int) $_GET['idmarca'] : null
                ),
                default => $clase::listar(),
            };

            responder(true, $datos, 200);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

<<<<<<< HEAD
    public function crear(string $tabla): void
=======
    /** POST ?url={recurso} */
    public function crear(string $recurso): void
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
<<<<<<< HEAD
            if (empty($datos['nombre'])) {
                responder(false, 'El nombre es obligatorio', 400);
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
=======

            $errores = $this->validar($recurso, $datos);
            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            $clase = $this->clase($recurso);
            $id    = $clase::crear($datos);

            responder(true, [
                'id'      => $id,
                'mensaje' => ucfirst($recurso) . ' creado correctamente',
            ], 201);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** PUT ?url={recurso}/{id} */
    public function actualizar(string $recurso, int $id): void
    {
        try {
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }
<<<<<<< HEAD
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
=======

            $clase = $this->clase($recurso);
            if (!$clase::actualizar($id, $datos)) {
                responder(false, ucfirst($recurso) . " #{$id} no encontrado", 404);
            }

            responder(true, ['mensaje' => ucfirst($recurso) . ' actualizado correctamente'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    /** DELETE ?url={recurso}/{id} -> desactiva (borrado logico). */
    public function eliminar(string $recurso, int $id): void
    {
        try {
            $clase = $this->clase($recurso);
            if (!$clase::actualizar($id, ['idestatus' => 2])) {
                responder(false, ucfirst($recurso) . " #{$id} no encontrado", 404);
            }

            responder(true, ['mensaje' => ucfirst($recurso) . " #{$id} desactivado"], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 400);
        }
    }

    private function clase(string $recurso): string
    {
        if (!isset(self::MODELOS[$recurso])) {
            throw new InvalidArgumentException("Catalogo no soportado: {$recurso}");
        }
        return self::MODELOS[$recurso];
    }

    private function validar(string $recurso, array $d): array
    {
        $errores = [];

        switch ($recurso) {
            case 'almacenes':
                if (empty($d['codigo'])) $errores[] = 'El codigo del almacen es obligatorio';
                if (empty($d['nombre'])) $errores[] = 'El nombre del almacen es obligatorio';
                break;

            case 'ubicaciones':
                if (empty($d['almacen_id'])) $errores[] = 'almacen_id es obligatorio';
                if (empty($d['codigo']))     $errores[] = 'El codigo de la ubicacion es obligatorio';
                break;

            case 'tallas':
                if (empty($d['nombre'])) $errores[] = 'El nombre de la talla es obligatorio';
                if (empty($d['codigo'])) $errores[] = 'El codigo de la talla es obligatorio';
                break;

            case 'colores':
                if (empty($d['nombre'])) $errores[] = 'El nombre del color es obligatorio';
                if (empty($d['codigo'])) $errores[] = 'El codigo del color es obligatorio';
                break;

            case 'modelos':
                if (empty($d['nombre'])) $errores[] = 'El nombre del modelo es obligatorio';
                break;
        }

        return $errores;
    }
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
}
