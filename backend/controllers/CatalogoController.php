<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../models/Catalogo.php';

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
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 500);
        }
    }

    /** POST ?url={recurso} */
    public function crear(string $recurso): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

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
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de peticion invalido. Se espera JSON', 400);
            }

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
}
