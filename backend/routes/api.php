<?php
// routes/api.php  ->  Router central de la API Mia's Store
// Recibe $url y $metodo definidos en index.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../controllers/ProductoController.php';
require_once __DIR__ . '/../controllers/CategoriaController.php';
require_once __DIR__ . '/../controllers/SubcategoriaController.php';
require_once __DIR__ . '/../controllers/MarcaController.php';
require_once __DIR__ . '/../controllers/ReporteController.php';
require_once __DIR__ . '/../controllers/AlmacenController.php';
require_once __DIR__ . '/../controllers/UbicacionController.php';
require_once __DIR__ . '/../controllers/CatalogoController.php';
require_once __DIR__ . '/../controllers/InventarioController.php';
require_once __DIR__ . '/../controllers/WhatsAppController.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UsuarioController.php';
require_once __DIR__ . '/../controllers/RolController.php';
require_once __DIR__ . '/../controllers/PermisoController.php';
require_once __DIR__ . '/../controllers/SeguridadController.php';
require_once __DIR__ . '/../controllers/TasaCambioController.php';

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
$ctrlAuth  = new AuthController();
$ctrlUser  = new UsuarioController();
$ctrlRol   = new RolController();
$ctrlPerm  = new PermisoController();
$ctrlSeg   = new SeguridadController();
$ctrlTasa  = new TasaCambioController();

// ==============================================================
// 0. AUTENTICACION Y CONTROL DE ACCESOS
// ==============================================================
if ($metodo === 'POST' && ($url === 'auth/login' || $url === 'api/auth/login')) {
    $ctrlAuth->login();
    exit;
}
if ($metodo === 'GET' && ($url === 'auth/me' || $url === 'api/auth/me')) {
    $ctrlAuth->me();
    exit;
}
if ($metodo === 'POST' && ($url === 'auth/logout' || $url === 'api/auth/logout')) {
    $ctrlAuth->logout();
    exit;
}

// Usuarios y cuentas
if ($metodo === 'GET' && preg_match('#^(?:api/)?usuarios/([0-9]+)$#', $url, $m)) {
    $ctrlUser->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'usuarios' || $url === 'api/usuarios')) {
    $ctrlUser->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'usuarios' || $url === 'api/usuarios')) {
    $ctrlUser->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?usuarios/([0-9]+)$#', $url, $m)) {
    $ctrlUser->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?usuarios/([0-9]+)$#', $url, $m)) {
    $ctrlUser->eliminar((int) $m[1]);
    exit;
}

// Roles y permisos
if ($metodo === 'GET' && preg_match('#^(?:api/)?roles/([0-9]+)$#', $url, $m)) {
    $ctrlRol->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'roles' || $url === 'api/roles')) {
    $ctrlRol->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'roles' || $url === 'api/roles')) {
    $ctrlRol->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?roles/([0-9]+)$#', $url, $m)) {
    $ctrlRol->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?roles/([0-9]+)$#', $url, $m)) {
    $ctrlRol->eliminar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'permisos' || $url === 'api/permisos')) {
    $ctrlPerm->listar();
    exit;
}

// Centro de claves y seguridad
if ($metodo === 'POST' && ($url === 'seguridad/cambiar-password' || $url === 'api/seguridad/cambiar-password')) {
    $ctrlSeg->cambiarPassword();
    exit;
}
if ($metodo === 'POST' && ($url === 'seguridad/restablecer-password' || $url === 'api/seguridad/restablecer-password')) {
    $ctrlSeg->restablecerPassword();
    exit;
}

// ==============================================================
// 1. PRODUCTOS
// ==============================================================

// Subida de imagen -> va ANTES de /productos/{id}
if ($metodo === 'POST' && preg_match('#^(?:api/)?productos/([0-9]+)/imagen$#', $url, $m)) {
    $ctrlProd->subirImagen((int) $m[1]);
    exit;
}
// Edicion de una presentacion/SKU y su stock en un almacen
if ($metodo === 'PUT' && preg_match('#^(?:api/)?productos/([0-9]+)/presentacion$#', $url, $m)) {
    $ctrlProd->actualizarPresentacion((int) $m[1]);
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
// 6. CATALOGOS (modelos, colores, tallas, unidades)
// ==============================================================
foreach (['modelos', 'colores', 'tallas', 'unidades'] as $catalogo) {
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
if ($metodo === 'GET' && ($url === 'inventario/listado' || $url === 'api/inventario/listado')) {
    $ctrlInv->listado();
    exit;
}
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
if ($metodo === 'PUT' && preg_match('#^(?:api/)?inventario/([0-9]+)$#', $url, $m)) {
    $ctrlInv->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?inventario/([0-9]+)$#', $url, $m)) {
    $ctrlInv->eliminar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'inventario' || $url === 'api/inventario')) {
    $ctrlInv->listar();
    exit;
}

// ==============================================================
// 8. REPORTES
// ==============================================================
if ($metodo === 'GET' && ($url === 'reportes/resumen' || $url === 'api/reportes/resumen')) {
    $ctrlRepo->resumen();
    exit;
}
if ($metodo === 'GET' && ($url === 'reportes/stock-critico' || $url === 'api/reportes/stock-critico')) {
    $ctrlRepo->stockCritico();
    exit;
}
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
    exit;
}

// ==============================================================
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
    exit;
}

// ==============================================================
// 11. TASAS DE CAMBIO / DIVISAS
// ==============================================================
if ($metodo === 'GET' && ($url === 'tasas-cambio/resumen' || $url === 'api/tasas-cambio/resumen')) {
    $ctrlTasa->resumen();
    exit;
}
if ($metodo === 'POST' && ($url === 'tasas-cambio/sincronizar' || $url === 'api/tasas-cambio/sincronizar')) {
    $ctrlTasa->sincronizar();
    exit;
}
if ($metodo === 'GET' && preg_match('#^(?:api/)?tasas-cambio/([0-9]+)$#', $url, $m)) {
    $ctrlTasa->mostrar((int) $m[1]);
    exit;
}
if ($metodo === 'GET' && ($url === 'tasas-cambio' || $url === 'api/tasas-cambio')) {
    $ctrlTasa->listar();
    exit;
}
if ($metodo === 'POST' && ($url === 'tasas-cambio' || $url === 'api/tasas-cambio')) {
    $ctrlTasa->crear();
    exit;
}
if ($metodo === 'PUT' && preg_match('#^(?:api/)?tasas-cambio/([0-9]+)$#', $url, $m)) {
    $ctrlTasa->actualizar((int) $m[1]);
    exit;
}
if ($metodo === 'DELETE' && preg_match('#^(?:api/)?tasas-cambio/([0-9]+)$#', $url, $m)) {
    $ctrlTasa->eliminar((int) $m[1]);
    exit;
}

// ==============================================================
// 10. RUTA NO ENCONTRADA (404)
// ==============================================================
responder(false, "Ruta no encontrada: [{$metodo}] {$url}", 404);
