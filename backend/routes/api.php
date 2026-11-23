<?php
<<<<<<< HEAD
// routes/api.php  ->  Router central de la API Mia's Store
=======
// routes/api.php  ->  Router central de la API Damasco (Clases 1, 2, 3 y 4)
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
// Recibe $url y $metodo definidos en index.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../controllers/ProductoController.php';
require_once __DIR__ . '/../controllers/CategoriaController.php';
<<<<<<< HEAD
require_once __DIR__ . '/../controllers/SubcategoriaController.php';
require_once __DIR__ . '/../controllers/MarcaController.php';
require_once __DIR__ . '/../controllers/ReporteController.php';
require_once __DIR__ . '/../controllers/AlmacenController.php';
require_once __DIR__ . '/../controllers/UbicacionController.php';
require_once __DIR__ . '/../controllers/CatalogoController.php';
require_once __DIR__ . '/../controllers/InventarioController.php';
require_once __DIR__ . '/../controllers/WhatsAppController.php';

$ctrlProd  = new ProductoController();
$ctrlCat   = new CategoriaController();
$ctrlSub   = new SubcategoriaController();
$ctrlMarca = new MarcaController();
$ctrlRepo  = new ReporteController();
$ctrlAlm   = new AlmacenController();
$ctrlUbi   = new UbicacionController();
$ctrlCatal = new CatalogoController();
$ctrlInv   = new InventarioController();
$ctrlWa    = new WhatsAppController();
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9

// ==============================================================
// 1. PRODUCTOS
// ==============================================================

<<<<<<< HEAD
// Subida de imagen -> va ANTES de /productos/{id}
=======
// PASO 3 (Clase 3): subida de imagen  ->  va ANTES de /productos/{id}
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
if ($metodo === 'POST' && preg_match('#^(?:api/)?productos/([0-9]+)/imagen$#', $url, $m)) {
    $ctrlProd->subirImagen((int) $m[1]);
    exit;
}
<<<<<<< HEAD
=======
// Variantes del producto -> van antes de /productos/{id}
if ($metodo === 'GET' && preg_match('#^(?:api/)?productos/([0-9]+)/variantes$#', $url, $m)) {
    $ctrlVariante->listar((int) $m[1]);
    exit;
}
if ($metodo === 'POST' && preg_match('#^(?:api/)?productos/([0-9]+)/variantes$#', $url, $m)) {
    $ctrlVariante->crear((int) $m[1]);
    exit;
}
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
// 3. SUBCATEGORIAS (vinculadas a categorias)
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?subcategorias/([0-9]+)$#', $url, $m)) {
    $ctrlSub->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'subcategorias' || $url === 'api/subcategorias')) {
    $ctrlSub->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'subcategorias' || $url === 'api/subcategorias')) {
    $ctrlSub->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?subcategorias/([0-9]+)$#', $url, $m)) {
    $ctrlSub->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?subcategorias/([0-9]+)$#', $url, $m)) {
    $ctrlSub->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 4. MARCAS
=======
// 3. MARCAS
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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
<<<<<<< HEAD
// 4. ALMACENES
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?almacenes/([0-9]+)$#', $url, $m)) {
    $ctrlAlm->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'almacenes' || $url === 'api/almacenes')) {
    $ctrlAlm->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'almacenes' || $url === 'api/almacenes')) {
    $ctrlAlm->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?almacenes/([0-9]+)$#', $url, $m)) {
    $ctrlAlm->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?almacenes/([0-9]+)$#', $url, $m)) {
    $ctrlAlm->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 5. UBICACIONES
// ==============================================================
if ($metodo === 'GET' && ($url === 'ubicaciones/tipos' || $url === 'api/ubicaciones/tipos')) {
    $ctrlUbi->tipos();
    exit;
}
if ($metodo === 'GET' && preg_match('#^(?:api/)?ubicaciones/([0-9]+)$#', $url, $m)) {
    $ctrlUbi->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'ubicaciones' || $url === 'api/ubicaciones')) {
    $ctrlUbi->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'ubicaciones' || $url === 'api/ubicaciones')) {
    $ctrlUbi->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?ubicaciones/([0-9]+)$#', $url, $m)) {
    $ctrlUbi->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?ubicaciones/([0-9]+)$#', $url, $m)) {
    $ctrlUbi->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 6. CATALOGOS (modelos, colores, tallas)
// ==============================================================
foreach (['modelos', 'colores', 'tallas'] as $catalogo) {
    if ($metodo === 'GET' && preg_match('#^(?:api/)?' . $catalogo . '/([0-9]+)$#', $url, $m)) {
        $ctrlCatal->mostrar($catalogo, (int) $m[1]);
        exit;
    }
    if ($metodo === 'GET' && ($url === $catalogo || $url === 'api/' . $catalogo)) {
        $ctrlCatal->listar($catalogo);
        exit;
    }
    if ($metodo === 'POST' && ($url === $catalogo || $url === 'api/' . $catalogo)) {
        $ctrlCatal->crear($catalogo);
        exit;
    }
    if ($metodo === 'PUT' && preg_match('#^(?:api/)?' . $catalogo . '/([0-9]+)$#', $url, $m)) {
        $ctrlCatal->actualizar($catalogo, (int) $m[1]);
        exit;
    }
    if ($metodo === 'DELETE' && preg_match('#^(?:api/)?' . $catalogo . '/([0-9]+)$#', $url, $m)) {
        $ctrlCatal->eliminar($catalogo, (int) $m[1]);
        exit;
    }
}

// ==============================================================
// 7. INVENTARIO Y MOVIMIENTOS
// ==============================================================
if ($metodo === 'GET' && preg_match('#^(?:api/)?inventario/producto/([0-9]+)$#', $url, $m)) {
    $ctrlInv->stockProducto((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario/movimientos' || $url === 'api/inventario/movimientos')) {
    $ctrlInv->movimientos();
    exit;
}
if ($metodo === 'POST' && ($url === 'inventario/movimientos' || $url === 'api/inventario/movimientos')) {
    $ctrlInv->registrar();
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario' || $url === 'api/inventario')) {
    $ctrlInv->listar();
    exit;
}

// ==============================================================
// 8. REPORTES
=======
// 4. REPORTES (Clase 3)
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
// ==============================================================
if ($metodo === 'GET' && ($url === 'reportes/resumen' || $url === 'api/reportes/resumen')) {
    $ctrlRepo->resumen();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/stock-critico' || $url === 'api/reportes/stock-critico')) {
    $ctrlRepo->stockCritico();
    exit;
}
<<<<<<< HEAD
if ($metodo === 'GET' && ($url === 'reportes/stock-por-almacen' || $url === 'api/reportes/stock-por-almacen')) {
    $ctrlRepo->stockPorAlmacen();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/stock-por-ubicacion' || $url === 'api/reportes/stock-por-ubicacion')) {
    $ctrlRepo->stockPorUbicacion();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/valor-inventario' || $url === 'api/reportes/valor-inventario')) {
    $ctrlRepo->valorInventario();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/kardex' || $url === 'api/reportes/kardex')) {
    $ctrlRepo->kardex();
=======

// ==============================================================
// 5. DOLAR (Clase 4)
// ==============================================================
if ($metodo === 'GET' && ($url === 'dolar' || $url === 'api/dolar')) {
    $ctrlDolar->index();
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    exit;
}

// ==============================================================
<<<<<<< HEAD
// 9. WHATSAPP WEB (proxy al servicio ws/server)
// ==============================================================
if ($metodo === 'GET' && ($url === 'whatsapp/estado' || $url === 'api/whatsapp/estado')) {
    $ctrlWa->estado();
    exit;
}
if ($metodo === 'POST' && ($url === 'whatsapp/enviar' || $url === 'api/whatsapp/enviar')) {
    $ctrlWa->enviar();
    exit;
}
if ($metodo === 'POST' && ($url === 'whatsapp/reiniciar' || $url === 'api/whatsapp/reiniciar' || $url === 'whatsapp/restart' || $url === 'api/whatsapp/restart')) {
    $ctrlWa->reiniciar();
    exit;
}
if ($metodo === 'POST' && ($url === 'whatsapp/logout' || $url === 'api/whatsapp/logout' || $url === 'whatsapp/cerrar' || $url === 'api/whatsapp/cerrar')) {
    $ctrlWa->cerrarSesion();
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    exit;
}

// ==============================================================
<<<<<<< HEAD
// 10. RUTA NO ENCONTRADA (404)
=======
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
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
// ==============================================================
responder(false, "Ruta no encontrada: [{$metodo}] {$url}", 404);
