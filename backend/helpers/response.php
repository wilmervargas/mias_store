<?php
declare(strict_types=1);

/**
 * Helper unificado de respuesta JSON.
 * Todos los controladores responden por aqui.
 *
<<<<<<< HEAD
 * Exito:  { success: true,  datos: <contenido>, total?: <n> }
 * Error:  { success: false, error: "<mensaje>", errores: [...] }
 *
 * La clave 'datos' es la que ya consume la Tienda Publica (Clase 1),
 * por lo que mantenerla conserva la retrocompatibilidad.
 */
function responder(bool $success, mixed $contenido, int $codigo = 200): void
=======
 * Exito:  { success: true, exito: true, mensaje: "...", datos: <payload>, data: <payload>, total?: <n> }
 * Error:  { success: false, exito: false, mensaje: "...", error: "...", errores: [...] }
 *
 * Las claves 'datos' y 'success' son las que ya consume la Tienda Publica
 * (Clase 1) y el Dashboard (Clases 2 y 3). Las claves 'exito' y 'mensaje'
 * mantienen compatibles los ejemplos de la Clase 4.
 *
 * El cuarto parametro permite enviar un mensaje y un payload separados:
 *   responder(true, 'Pedido creado', 201, $detalle);
 */
function responder(bool $success, mixed $contenido, int $codigo = 200, mixed $datos = null): void
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');

    if ($success) {
<<<<<<< HEAD
        $respuesta = [
            'success' => true,
            'datos'   => $contenido,
        ];

        // Si el contenido es una coleccion (lista), agregamos el total
        if (is_array($contenido) && $contenido === array_values($contenido)) {
            $respuesta['total'] = count($contenido);
=======
        $payload = $datos !== null ? $datos : $contenido;
        $mensaje = is_string($contenido) ? $contenido : 'Operacion exitosa';

        $respuesta = [
            'success' => true,
            'exito'   => true,
            'mensaje' => $mensaje,
            'datos'   => $payload,
            'data'    => $payload,
        ];

        // Si el payload es una coleccion (lista), agregamos el total
        if (is_array($payload) && $payload === array_values($payload)) {
            $respuesta['total'] = count($payload);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        }

        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        // Si recibimos varios errores de validacion, mostramos el primero y la lista completa
        $mensaje = is_array($contenido) ? implode(' | ', $contenido) : (string) $contenido;

        echo json_encode([
            'success' => false,
<<<<<<< HEAD
=======
            'exito'   => false,
            'mensaje' => $mensaje,
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
            'error'   => $mensaje,
            'errores' => is_array($contenido) ? $contenido : [],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    exit; // Una respuesta por peticion.
}
