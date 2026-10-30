<?php
// index.php  ->  Front Controller de la API Damasco
declare(strict_types=1);

// ==============================================================
// 1. CABECERAS CORS (para que React en :5173 pueda consumir la API)
// ==============================================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
// 3. ENRUTADOR MODULAR DE LA API
// ==============================================================
require_once __DIR__ . '/routes/api.php';
