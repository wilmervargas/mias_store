<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Rol.php';

class UsuarioController
{
    private const PERMISOS_LECTURA = [
        'usuarios.ver',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.eliminar',
        'seguridad.claves',
    ];

    /** GET /?url=usuarios */
    public function listar(): void
    {
        try {
            Authz::requiereAlguno(self::PERMISOS_LECTURA);

            $filtros = [
                'q'      => $_GET['q'] ?? '',
                'estado' => $_GET['estado'] ?? '',
            ];

            responder(true, Usuario::listar($filtros), 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar usuarios: ' . $e->getMessage(), 500);
        }
    }

    /** GET /?url=usuarios/{id} */
    public function mostrar(int $id): void
    {
        try {
            Authz::requiereAlguno(self::PERMISOS_LECTURA);

            $usuario = Usuario::obtenerPorIdConRoles($id);
            if (!$usuario) {
                responder(false, "Usuario con ID #{$id} no encontrado.", 404);
            }

            responder(true, $usuario, 200);
        } catch (Throwable $e) {
            responder(false, 'Error al consultar el usuario: ' . $e->getMessage(), 500);
        }
    }

    /** POST /?url=usuarios */
    public function crear(): void
    {
        try {
            $actor = Authz::requiere('usuarios.crear');
            $esSuperActor = (int) $actor['is_superuser'] === 1;
            $datos = cuerpoJson();

            $errores = [];
            $nombre = trim((string) ($datos['full_name'] ?? ''));
            $email = Auth::normalizarEmail((string) ($datos['email'] ?? ''));
            $password = (string) ($datos['password'] ?? '');
            $isActive = array_key_exists('is_active', $datos) ? $this->bandera($datos['is_active'], 1) : 1;
            $isSuper = array_key_exists('is_superuser', $datos) ? $this->bandera($datos['is_superuser'], 0) : 0;

            $this->validarNombre($nombre, $errores);
            $this->validarEmail($email, $errores);

            if ($password === '' || $this->longitud($password) < 8) {
                $errores[] = 'La contraseña debe tener al menos 8 caracteres.';
            }

            if (!$errores && Usuario::existeEmail($email)) {
                $errores[] = 'Ya existe una cuenta registrada con ese correo electrónico.';
            }

            $roles = [];
            if (array_key_exists('roles', $datos)) {
                $roles = $this->leerRoles($datos['roles'], $errores);
                $this->validarRoles($roles, $errores);
            }

            if ($isSuper === 1 && !$esSuperActor) {
                responder(false, 'Solo un superusuario puede crear otra cuenta de superusuario.', 403);
            }

            if (!$esSuperActor && $this->incluyeRolAdmin($roles)) {
                responder(false, 'Solo un superusuario puede asignar el rol ADMIN.', 403);
            }

            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            $id = Usuario::crear([
                'full_name'     => $nombre,
                'email'         => $email,
                'password_hash' => Auth::hashear($password),
                'is_active'     => $isActive,
                'is_staff'      => 1,
                'is_superuser'  => $isSuper,
                'roles'         => $roles,
            ]);

            responder(true, [
                'mensaje' => 'Cuenta creada correctamente.',
                'usuario' => Usuario::obtenerPorIdConRoles($id),
            ], 201);
        } catch (Throwable $e) {
            responder(false, 'Error al crear el usuario: ' . $e->getMessage(), 500);
        }
    }

    /** PUT /?url=usuarios/{id} */
    public function actualizar(int $id): void
    {
        try {
            $actor = Authz::requiere('usuarios.editar');
            $esSuperActor = (int) $actor['is_superuser'] === 1;
            $esMismo = (int) $actor['id'] === $id;

            $objetivo = Usuario::buscarPorId($id);
            if (!$objetivo) {
                responder(false, "Usuario con ID #{$id} no encontrado.", 404);
            }

            $objetivoEsSuper = (int) $objetivo['is_superuser'] === 1;

            if ($objetivoEsSuper && !$esSuperActor) {
                responder(false, 'Solo un superusuario puede modificar a otro superusuario.', 403);
            }

            $datos = cuerpoJson();
            $errores = [];
            $cambios = [];

            // Nombre
            if (array_key_exists('full_name', $datos)) {
                $nombre = trim((string) $datos['full_name']);
                $this->validarNombre($nombre, $errores);
                if ($nombre !== (string) $objetivo['full_name']) {
                    $cambios['full_name'] = $nombre;
                }
            }

            // Correo
            if (array_key_exists('email', $datos)) {
                $email = Auth::normalizarEmail((string) $datos['email']);
                $this->validarEmail($email, $errores);

                if (!$errores && $email !== (string) $objetivo['email'] && Usuario::existeEmail($email, $id)) {
                    $errores[] = 'Ya existe otra cuenta registrada con ese correo electrónico.';
                }

                if ($email !== (string) $objetivo['email']) {
                    $cambios['email'] = $email;
                }
            }

            // Contrasena (opcional al editar)
            if (array_key_exists('password', $datos)) {
                $password = (string) $datos['password'];
                if (trim($password) !== '') {
                    if ($this->longitud($password) < 8) {
                        $errores[] = 'La nueva contraseña debe tener al menos 8 caracteres.';
                    } else {
                        $cambios['password_hash'] = Auth::hashear($password);
                    }
                }
            }

            // Estado de superusuario
            if (array_key_exists('is_superuser', $datos)) {
                $nuevoSuper = $this->bandera($datos['is_superuser'], $objetivoEsSuper ? 1 : 0);

                if ($nuevoSuper !== ($objetivoEsSuper ? 1 : 0)) {
                    if (!$esSuperActor) {
                        responder(false, 'Solo un superusuario puede cambiar el estado de superusuario.', 403);
                    }

                    if ($esMismo && $objetivoEsSuper && $nuevoSuper === 0) {
                        responder(false, 'No puedes quitarte tu propio estado de superusuario.', 400);
                    }

                    $cambios['is_superuser'] = $nuevoSuper;
                }
            }

            // Estado activo
            if (array_key_exists('is_active', $datos)) {
                $nuevoActivo = $this->bandera($datos['is_active'], (int) $objetivo['is_active']);

                if ($nuevoActivo !== (int) $objetivo['is_active']) {
                    if ($esMismo && $nuevoActivo === 0) {
                        responder(false, 'No puedes desactivar tu propia cuenta.', 400);
                    }
                    $cambios['is_active'] = $nuevoActivo;
                }
            }

            // Roles
            if (array_key_exists('roles', $datos)) {
                $roles = $this->leerRoles($datos['roles'], $errores);
                $this->validarRoles($roles, $errores);

                if (!$esSuperActor) {
                    $actuales = Usuario::rolesIds($id);
                    $agregados = array_values(array_diff($roles, $actuales));
                    $admin = Rol::obtenerPorNombre('ADMIN');

                    if ($admin && in_array((int) $admin['id'], $agregados, true)) {
                        responder(false, 'Solo un superusuario puede asignar el rol ADMIN.', 403);
                    }
                }

                $cambios['roles'] = $roles;
            }

            // Proteccion del ultimo superusuario activo
            $eraSuperActivo = $objetivoEsSuper && (int) $objetivo['is_active'] === 1;
            $quedaraSuper = array_key_exists('is_superuser', $cambios)
                ? (int) $cambios['is_superuser']
                : (int) $objetivo['is_superuser'];
            $quedaraActivo = array_key_exists('is_active', $cambios)
                ? (int) $cambios['is_active']
                : (int) $objetivo['is_active'];

            if ($eraSuperActivo && ($quedaraSuper !== 1 || $quedaraActivo !== 1)) {
                if (Usuario::contarSuperusuariosActivos($id) === 0) {
                    $errores[] = 'No puedes desactivar ni quitar el estado de superusuario al último superusuario activo.';
                }
            }

            if (!empty($errores)) {
                responder(false, $errores, 400);
            }

            Usuario::actualizar($id, $cambios);

            if ($esMismo) {
                Auth::refrescar();
            }

            responder(true, [
                'mensaje' => 'Cuenta actualizada correctamente.',
                'usuario' => Usuario::obtenerPorIdConRoles($id),
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al actualizar el usuario: ' . $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=usuarios/{id} */
    public function eliminar(int $id): void
    {
        try {
            $actor = Authz::requiere('usuarios.eliminar');
            $objetivo = Usuario::buscarPorId($id);

            if (!$objetivo) {
                responder(false, "Usuario con ID #{$id} no encontrado.", 404);
            }

            if ((int) $objetivo['id'] === (int) $actor['id']) {
                responder(false, 'No puedes eliminar tu propia cuenta.', 400);
            }

            $esSuperActor = (int) $actor['is_superuser'] === 1;
            $objetivoEsSuper = (int) $objetivo['is_superuser'] === 1;

            if ($objetivoEsSuper && !$esSuperActor) {
                responder(false, 'Solo un superusuario puede eliminar a otro superusuario.', 403);
            }

            if ($objetivoEsSuper && (int) $objetivo['is_active'] === 1) {
                if (Usuario::contarSuperusuariosActivos($id) === 0) {
                    responder(false, 'No puedes eliminar al último superusuario activo.', 400);
                }
            }

            Usuario::eliminar($id);
            responder(true, ['mensaje' => 'Cuenta eliminada correctamente.'], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al eliminar el usuario: ' . $e->getMessage(), 500);
        }
    }

    private function validarNombre(string $nombre, array &$errores): void
    {
        $longitud = $this->longitud($nombre);

        if ($longitud < 3) {
            $errores[] = 'El nombre completo debe tener al menos 3 caracteres.';
        } elseif ($longitud > 150) {
            $errores[] = 'El nombre completo no puede superar los 150 caracteres.';
        }
    }

    private function validarEmail(string $email, array &$errores): void
    {
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errores[] = 'El correo electrónico no tiene un formato válido.';
        } elseif ($this->longitud($email) > 190) {
            $errores[] = 'El correo electrónico no puede superar los 190 caracteres.';
        }
    }

    private function leerRoles(mixed $valor, array &$errores): array
    {
        if (!is_array($valor)) {
            $errores[] = 'El campo roles debe ser una lista de identificadores.';
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('intval', $valor),
            static fn(int $id): bool => $id > 0
        )));
    }

    private function validarRoles(array $roles, array &$errores): void
    {
        if (!$roles) {
            return;
        }

        if (count(Rol::idsExistentes($roles)) !== count($roles)) {
            $errores[] = 'Uno o más roles seleccionados no existen.';
        }
    }

    private function incluyeRolAdmin(array $roles): bool
    {
        if (!$roles) {
            return false;
        }

        $admin = Rol::obtenerPorNombre('ADMIN');
        return $admin !== null && in_array((int) $admin['id'], $roles, true);
    }

    private function bandera(mixed $valor, int $defecto = 0): int
    {
        if ($valor === null) {
            return $defecto;
        }
        if (is_bool($valor)) {
            return $valor ? 1 : 0;
        }
        return ((int) $valor) === 1 ? 1 : 0;
    }

    private function longitud(string $texto): int
    {
        return function_exists('mb_strlen') ? mb_strlen($texto, 'UTF-8') : strlen($texto);
    }
}
