<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Permiso.php';

class PermisoController
{
    /** GET /?url=permisos -> catalogo agrupado para la matriz de roles. */
    public function listar(): void
    {
        try {
            Authz::requiereAlguno([
                'roles.ver',
                'roles.crear',
                'roles.editar',
                'roles.gestionar',
                'usuarios.ver',
                'seguridad.claves',
            ]);

            $modulos = Permiso::matriz();
            $total = 0;
            foreach ($modulos as $modulo) {
                $total += count($modulo['permisos']);
            }

            responder(true, [
                'modulos'  => $modulos,
                'acciones' => Permiso::acciones(),
                'total'    => $total,
            ], 200);
        } catch (Throwable $e) {
            responder(false, 'Error al listar permisos: ' . $e->getMessage(), 500);
        }
    }
}
