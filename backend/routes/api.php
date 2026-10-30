<?php
// routes/api.php  ->  Router central de la API Damasco (Clases 1, 2, 3 y 4)
// Recibe $url y $metodo definidos en index.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../controllers/ProductoController.php';
require_once __DIR__ . '/../controllers/CategoriaController.php';
require_once __DIR__ . '/../controllers/MarcaController.php';
require_once __DIR__ . '/../controllers/ReporteController.php';
require_once __DIR__ . '/../controllers/DolarController.php';
require_once __DIR__ . '/../controllers/CarritoController.php';
require_once __DIR__ . '/../controllers/PedidoController.php';
require_once __DIR__ . '/../controllers/ClienteController.php';
require_once __DIR__ . '/../controllers/VarianteController.php';
require_once __DIR__ . '/../controllers/CatalogoController.php';
require_once __DIR__ . '/../controllers/InventarioController.php';

$ctrlProd    = new ProductoController();
$ctrlCat     = new CategoriaController();
$ctrlMarca   = new MarcaController();
$ctrlRepo    = new ReporteController();
$ctrlDolar   = new DolarController();
$ctrlCarrito = new CarritoController();
$ctrlPedido  = new PedidoController();
$ctrlCliente = new ClienteController();
$ctrlVariante = new VarianteController();
$ctrlCatalogo = new CatalogoController();
$ctrlInventario = new InventarioController();

// ==============================================================
// 1. PRODUCTOS
// ==============================================================

// PASO 3 (Clase 3): subida de imagen  ->  va ANTES de /productos/{id}
if ($metodo === 'POST' && preg_match('#^(?:api/)?productos/([0-9]+)/imagen$#', $url, $m)) {
    $ctrlProd->subirImagen((int) $m[1]);
    exit;
}
// Variantes del producto -> van antes de /productos/{id}
if ($metodo === 'GET' && preg_match('#^(?:api/)?productos/([0-9]+)/variantes$#', $url, $m)) {
    $ctrlVariante->listar((int) $m[1]);
    exit;
}
if ($metodo === 'POST' && preg_match('#^(?:api/)?productos/([0-9]+)/variantes$#', $url, $m)) {
    $ctrlVariante->crear((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && preg_match('#^(?:api/)?productos/([0-9]+)$#', $url, $m)) {
    $ctrlProd->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'productos' || $url === 'api/productos')) {
    $ctrlProd->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'productos' || $url === 'api/productos')) {
    $ctrlProd->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?productos/([0-9]+)$#', $url, $m)) {
    $ctrlProd->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?productos/([0-9]+)$#', $url, $m)) {
    $ctrlProd->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 2. CATEGORIAS
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?categorias/([0-9]+)$#', $url, $m)) {
    $ctrlCat->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'categorias' || $url === 'api/categorias')) {
    $ctrlCat->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'categorias' || $url === 'api/categorias')) {
    $ctrlCat->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?categorias/([0-9]+)$#', $url, $m)) {
    $ctrlCat->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?categorias/([0-9]+)$#', $url, $m)) {
    $ctrlCat->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 3. MARCAS
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?marcas/([0-9]+)$#', $url, $m)) {
    $ctrlMarca->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'marcas' || $url === 'api/marcas')) {
    $ctrlMarca->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'marcas' || $url === 'api/marcas')) {
    $ctrlMarca->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?marcas/([0-9]+)$#', $url, $m)) {
    $ctrlMarca->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?marcas/([0-9]+)$#', $url, $m)) {
    $ctrlMarca->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 4. REPORTES (Clase 3)
// ==============================================================
if ($metodo === 'GET' && ($url === 'reportes/resumen' || $url === 'api/reportes/resumen')) {
    $ctrlRepo->resumen();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/stock-critico' || $url === 'api/reportes/stock-critico')) {
    $ctrlRepo->stockCritico();
    exit;
}

// ==============================================================
// 5. DOLAR (Clase 4)
// ==============================================================
if ($metodo === 'GET' && ($url === 'dolar' || $url === 'api/dolar')) {
    $ctrlDolar->index();
    exit;
}

// ==============================================================
// 6. CARRITO (Clase 4)
// ==============================================================
if ($metodo === 'GET' && ($url === 'carrito' || $url === 'api/carrito')) {
    $ctrlCarrito->listar();
    exit;
}
if ($metodo === 'DELETE' && ($url === 'carrito' || $url === 'api/carrito')) {
    $ctrlCarrito->vaciar();
    exit;
}
if ($metodo === 'POST' && ($url === 'carrito/items' || $url === 'api/carrito/items')) {
    $ctrlCarrito->agregar();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?carrito/items/([0-9]+)$#', $url, $m)) {
    $ctrlCarrito->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?carrito/items/([0-9]+)$#', $url, $m)) {
    $ctrlCarrito->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 7. CLIENTES (Dashboard)
// ==============================================================
if ($metodo === 'GET' && ($url === 'clientes' || $url === 'api/clientes')) {
    $ctrlCliente->listar();
    exit;
}

// ==============================================================
// 8. PEDIDOS (Clase 4 + Dashboard)
// ==============================================================
if ($metodo === 'POST' && ($url === 'pedidos' || $url === 'api/pedidos')) {
    $ctrlPedido->crear();
    exit;
}
if ($metodo === 'GET' && ($url === 'pedidos' || $url === 'api/pedidos')) {
    if (!empty($_GET['id'])) {
        $ctrlPedido->ver((int) $_GET['id']);
    } else {
        $ctrlPedido->listar();
    }
    exit;
}

// ==============================================================
// 9. VARIANTES (talla / color / modelo)
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?variantes/([0-9]+)$#', $url, $m)) {
    $ctrlVariante->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?variantes/([0-9]+)$#', $url, $m)) {
    $ctrlVariante->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?variantes/([0-9]+)$#', $url, $m)) {
    $ctrlVariante->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 10. CATALOGOS DE INVENTARIO
// ==============================================================
$catalogos = '(almacenes|ubicaciones|tallas|colores|modelos)';

if ($metodo === 'GET' && preg_match("#^(?:api/)?{$catalogos}$#", $url, $m)) {
    $ctrlCatalogo->listar($m[1]);
    exit;
}
if ($metodo === 'POST' && preg_match("#^(?:api/)?{$catalogos}$#", $url, $m)) {
    $ctrlCatalogo->crear($m[1]);
    exit;
}
if ($metodo === 'PUT' && preg_match("#^(?:api/)?{$catalogos}/([0-9]+)$#", $url, $m)) {
    $ctrlCatalogo->actualizar($m[1], (int) $m[2]);
    exit;
}
if ($metodo === 'DELETE' && preg_match("#^(?:api/)?{$catalogos}/([0-9]+)$#", $url, $m)) {
    $ctrlCatalogo->eliminar($m[1], (int) $m[2]);
    exit;
}

// ==============================================================
// 11. INVENTARIO Y KARDEX
// ==============================================================
if ($metodo === 'GET' && ($url === 'inventario' || $url === 'api/inventario')) {
    $ctrlInventario->listar();
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario/resumen' || $url === 'api/inventario/resumen')) {
    $ctrlInventario->resumen();
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario/kardex' || $url === 'api/inventario/kardex')) {
    $ctrlInventario->kardex();
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario/critico' || $url === 'api/inventario/critico')) {
    $ctrlInventario->critico();
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario/clasificacion' || $url === 'api/inventario/clasificacion')) {
    $ctrlInventario->clasificacion();
    exit;
}
if ($metodo === 'GET' && preg_match('#^(?:api/)?inventario/stock/([0-9]+)$#', $url, $m)) {
    $ctrlInventario->stockVariante((int) $m[1]);
    exit;
}
if ($metodo === 'POST' && ($url === 'inventario/movimientos' || $url === 'api/inventario/movimientos')) {
    $ctrlInventario->movimiento();
    exit;
}
if ($metodo === 'POST' && ($url === 'inventario/transferencias' || $url === 'api/inventario/transferencias')) {
    $ctrlInventario->transferir();
    exit;
}

// ==============================================================
// 12. RUTA NO ENCONTRADA (404)
// ==============================================================
responder(false, "Ruta no encontrada: [{$metodo}] {$url}", 404);
