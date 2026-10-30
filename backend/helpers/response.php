<?php
declare(strict_types=1);

/**
 * Helper unificado de respuesta JSON.
 * Todos los controladores responden por aqui.
 *
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
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');

    if ($success) {
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
        }

        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        // Si recibimos varios errores de validacion, mostramos el primero y la lista completa
        $mensaje = is_array($contenido) ? implode(' | ', $contenido) : (string) $contenido;

        echo json_encode([
            'success' => false,
            'exito'   => false,
            'mensaje' => $mensaje,
            'error'   => $mensaje,
            'errores' => is_array($contenido) ? $contenido : [],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    exit; // Una respuesta por peticion.
}
