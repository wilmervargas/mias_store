<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Rol.php';
require_once __DIR__ . '/../models/Permiso.php';

class RolController
{
    /** GET /?url=roles */
    public function listar(): void
    {
        try {
            Authz::requiereAlguno([
                'roles.ver',
                'roles.crear',
                'roles.editar',
                'roles.eliminar',
                'roles.gestionar',
                'usuarios.ver',
                'usuarios.crear',
                'usuarios.editar',
                'usuarios.eliminar',
                'seguridad.claves',
            ]);

            responder(true, Rol::obtenerTodos(), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar roles: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=roles/{id} */
    public function mostrar(int $id): void
    {
        try {
            Authz::requiereAlguno([
                'roles.ver',
                'roles.gestionar',
                'usuarios.ver',
                'seguridad.claves',
            ]);

            $rol = Rol::obtenerPorId($id);
            if (!$rol) {
                responder(false, "Rol con ID #{$id} no encontrado.", 404);
            }

            responder(true, $rol, 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar el rol: ' . $e->getMessage(), 500);
        }
    }

    /** POST /?url=roles */
    public function crear(): void
    {
        try {
            $actor = Authz::requiereAlguno(['roles.crear', 'roles.gestionar']);
            $datos = cuerpoJson();

            $errores = [];
            $name = $this->normalizarNombre((string) ($datos['name'] ?? ''));
            $description = trim((string) ($datos['description'] ?? ''));

            $this->validarNombre($name, $errores);
            $this->validarDescripcion($description, $errores);

            if (!$errores && Rol::existeNombre($name)) {
                $errores[] = 'Ya existe un rol con ese nombre.';
            }

            $permisos = [];
            $incluyePermisos = array_key_exists('permisos', $datos);

            if ($incluyePermisos) {
                $permisos = $this->leerPermisos($datos['permisos'], $errores);
                $this->validarPermisos($permisos, $errores);

                if (!$this->puedeGestionar($actor)) {
                    responder(false, 'Necesitas el permiso roles.gestionar para asignar permisos.', 403);
                }
            }

            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            $id = Rol::crear($name, $description);

            if ($incluyePermisos) {
                Rol::sincronizarPermisos($id, $permisos);
            }

            responder(true, [
                'mensaje' => 'Rol creado correctamente.',
                'rol'     => Rol::obtenerPorId($id),
            ], 201);
        } catch (Throwable $e) {
            responder(false, 'Error al crear el rol: ' . $e->getMessage(), 500);
        }
    }

    /** PUT /?url=roles/{id} */
    public function actualizar(int $id): void
    {
        try {
            $actor = Authz::requiereAlguno(['roles.editar', 'roles.gestionar']);
            $rol = Rol::obtenerPorId($id);

            if (!$rol) {
                responder(false, "Rol con ID #{$id} no encontrado.", 404);
            }

            $datos = cuerpoJson();
            $errores = [];
            $cambios = [];

            if (array_key_exists('name', $datos)) {
                $name = $this->normalizarNombre((string) $datos['name']);
                $this->validarNombre($name, $errores);

                if ((string) $rol['name'] === 'ADMIN' && $name !== 'ADMIN') {
                    $errores[] = 'El rol ADMIN no se puede renombrar.';
                }

                if (!$errores && $name !== (string) $rol['name'] && Rol::existeNombre($name, $id)) {
                    $errores[] = 'Ya existe otro rol con ese nombre.';
                }

                if ($name !== (string) $rol['name']) {
                    $cambios['name'] = $name;
                }
            }

            if (array_key_exists('description', $datos)) {
                $description = trim((string) $datos['description']);
                $this->validarDescripcion($description, $errores);

                if ($description !== (string) $rol['description']) {
                    $cambios['description'] = $description;
                }
            }

            $incluyePermisos = array_key_exists('permisos', $datos);
            $permisos = [];

            if ($incluyePermisos) {
                if (!$this->puedeGestionar($actor)) {
                    responder(false, 'Necesitas el permiso roles.gestionar para modificar la matriz de permisos.', 403);
                }

                $permisos = $this->leerPermisos($datos['permisos'], $errores);
                $this->validarPermisos($permisos, $errores);
            }

            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            Rol::actualizar($id, $cambios);

            if ($incluyePermisos) {
                Rol::sincronizarPermisos($id, $permisos);
            }

            responder(true, [
                'mensaje' => 'Rol actualizado correctamente.',
                'rol'     => Rol::obtenerPorId($id),
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al actualizar el rol: ' . $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=roles/{id} */
    public function eliminar(int $id): void
    {
        try {
            Authz::requiere('roles.eliminar');
            $rol = Rol::obtenerPorId($id);

            if (!$rol) {
                responder(false, "Rol con ID #{$id} no encontrado.", 404);
            }

            if ((string) $rol['name'] === 'ADMIN') {
                responder(false, 'El rol ADMIN es esencial y no se puede eliminar.', 400);
            }

            $usuarios = Rol::contarUsuarios($id);
            if ($usuarios > 0) {
                responder(false, "No se puede eliminar el rol porque tiene {$usuarios} usuario(s) asignado(s).", 400);
            }

            Rol::eliminar($id);
            responder(true, ['mensaje' => 'Rol eliminado correctamente.'], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al eliminar el rol: ' . $e->getMessage(), 500);
        }
    }

    private function normalizarNombre(string $name): string
    {
        $name = strtoupper(trim($name));
        $name = preg_replace('/\s+/', ' ', $name) ?? $name;
        return $name;
    }

    private function validarNombre(string $name, array &$errores): void
    {
        if (!preg_match('/^[A-Z0-9][A-Z0-9 _-]{1,59}$/', $name)) {
            $errores[] = 'El nombre del rol debe tener entre 2 y 60 caracteres: letras, números, espacios, guiones o guiones bajos.';
        }
    }

    private function validarDescripcion(string $description, array &$errores): void
    {
        $longitud = function_exists('mb_strlen') ? mb_strlen($description, 'UTF-8') : strlen($description);
        if ($longitud > 255) {
            $errores[] = 'La descripción del rol no puede superar los 255 caracteres.';
        }
    }

    private function leerPermisos(mixed $valor, array &$errores): array
    {
        if (!is_array($valor)) {
            $errores[] = 'El campo permisos debe ser una lista de identificadores.';
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('intval', $valor),
            static fn(int $id): bool => $id > 0
        )));
    }

    private function validarPermisos(array $permisos, array &$errores): void
    {
        if (!$permisos) {
            return;
        }

        if (count(Permiso::idsExistentes($permisos)) !== count($permisos)) {
            $errores[] = 'Uno o más permisos seleccionados no existen.';
        }
    }

    private function puedeGestionar(array $actor): bool
    {
        return (int) $actor['is_superuser'] === 1 || Authz::puede('roles.gestionar');
    }
}
