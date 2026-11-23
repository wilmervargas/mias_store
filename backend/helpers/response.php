<?php
declare(strict_types=1);

/**
 * Helper unificado de respuesta JSON.
 * Todos los controladores responden por aqui.
 *
 * Exito:  { success: true,  datos: <contenido>, total?: <n> }
 * Error:  { success: false, error: "<mensaje>", errores: [...] }
 *
 * La clave 'datos' es la que ya consume la Tienda Publica (Clase 1),
 * por lo que mantenerla conserva la retrocompatibilidad.
 */
function responder(bool $success, mixed $contenido, int $codigo = 200): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');

    if ($success) {
        $respuesta = [
            'success' => true,
            'datos'   => $contenido,
        ];

        // Si el contenido es una coleccion (lista), agregamos el total
        if (is_array($contenido) && $contenido === array_values($contenido)) {
            $respuesta['total'] = count($contenido);
        }

        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        // Si recibimos varios errores de validacion, mostramos el primero y la lista completa
        $mensaje = is_array($contenido) ? implode(' | ', $contenido) : (string) $contenido;

        echo json_encode([
            'success' => false,
            'error'   => $mensaje,
            'errores' => is_array($contenido) ? $contenido : [],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    exit; // Una respuesta por peticion.
}
