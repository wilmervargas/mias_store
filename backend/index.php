<?php
// index.php -> Front Controller de la API Mia's Store
declare(strict_types=1);

// ============================================================== 
// 1. CABECERAS CORS
// ============================================================== 
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Preflight OPTIONS: el navegador lo envía antes de peticiones no simples.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(204);
    exit;
}

// ============================================================== 
// 2. PARÁMETROS DE PETICIÓN
// ============================================================== 
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$url    = $_GET['url'] ?? '';

// Soporte básico para servidores que exponen la ruta en PATH_INFO/REQUEST_URI.
if ($url === '') {
    $path = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    $path = trim((string) $path, '/');
    // Si el front controller se invoca directamente, no tratar el nombre del script como ruta API.
    if ($path !== '' && $path !== 'index.php') {
        $url = $path;
    }
}

$url = trim((string) $url, "/ \t\n\r\0\x0B");

// ============================================================== 
// 3. LANDING DE BIENVENIDA (raíz)
// ============================================================== 
if ($url === '' && $metodo === 'GET') {
    $landing = __DIR__ . '/index.html';
    if (is_file($landing)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($landing);
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'mensaje' => "API Mia's Store activa",
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================== 
// 4. ENRUTADOR MODULAR DE LA API
// ============================================================== 
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/routes/api.php';
} catch (Throwable $e) {
    http_response_code(500);

    $respuesta = [
        'success' => false,
        'error'   => 'Error interno del servidor',
    ];

    // En desarrollo local es útil ver el detalle; se puede ocultar definiendo API_DEBUG=false.
    $debug = getenv('API_DEBUG');
    if ($debug === false || filter_var($debug, FILTER_VALIDATE_BOOLEAN)) {
        $respuesta['detalle'] = $e->getMessage();
    }

    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
