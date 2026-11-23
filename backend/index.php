<?php
// index.php  ->  Front Controller de la API Mia's Store
declare(strict_types=1);

// ==============================================================
// 1. CABECERAS CORS CON CREDENCIALES
//    El dashboard corre en otro puerto (Vite :5173), por lo que
//    se refleja el Origin local y se permite el envio de cookies.
// ==============================================================
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$origenPermitido = false;

if ($origen !== '') {
    $partes = parse_url($origen);
    $host = strtolower((string) ($partes['host'] ?? ''));
    $esquema = strtolower((string) ($partes['scheme'] ?? ''));

    if (
        in_array($esquema, ['http', 'https'], true)
        && in_array($host, ['localhost', '127.0.0.1', '::1', '[::1]'], true)
    ) {
        $origenPermitido = true;
    }
}

if ($origenPermitido) {
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('X-Content-Type-Options: nosniff');

// Preflight OPTIONS: el navegador lo envia ANTES de un POST/PUT/DELETE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(200);
    exit;
}

// Parametros de peticion
$url    = $_GET['url'] ?? '';
$metodo = $_SERVER['REQUEST_METHOD'];

// ==============================================================
// 2. LANDING DE BIENVENIDA (Raiz: http://localhost:8000/)
// ==============================================================
if ($url === '' && $metodo === 'GET') {
    if (file_exists(__DIR__ . '/index.html')) {
        header('Content-Type: text/html; charset=utf-8');
        readfile(__DIR__ . '/index.html');
        exit;
    }
}

// ==============================================================
// 3. SESION PHP (cookie HttpOnly / SameSite=Lax)
// ==============================================================
require_once __DIR__ . '/core/Auth.php';
Auth::iniciar();

// ==============================================================
// 4. ENRUTADOR MODULAR DE LA API
// ==============================================================
require_once __DIR__ . '/routes/api.php';
