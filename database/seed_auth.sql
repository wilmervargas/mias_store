-- ============================================================
-- Mia's Store - Datos iniciales de autenticacion y accesos
-- Base de datos: mias_store
--
-- Ejecutar SIEMPRE despues de schema_auth.sql.
-- Es idempotente: puede ejecutarse varias veces.
--
-- Superusuario inicial:
--   Correo:     wilmere.vargas@gmail.com
--   Contrasena: Admin2026*
--   (La clave se guarda hasheada con Argon2id)
-- ============================================================

SET NAMES utf8mb4;
USE mias_store;

START TRANSACTION;

-- ------------------------------------------------------------
-- 1. Roles base
-- ------------------------------------------------------------
INSERT IGNORE INTO roles (name, description) VALUES
('ADMIN',    'Acceso total al panel administrativo, usuarios y seguridad.'),
('OPERADOR', 'Gestion operativa completa: catalogo, almacenes, inventario y movimientos.'),
('VENTAS',   'Lectura operativa para consulta de catalogo, inventario y reportes.'),
('LECTOR',   'Consulta general del sistema sin acceso al centro de claves.');

-- ------------------------------------------------------------
-- 2. Catalogo de permisos por modulo (modulo.accion)
-- ------------------------------------------------------------
INSERT IGNORE INTO permissions (code, module, description) VALUES
-- Productos
('productos.ver',          'productos',  'Ver el catalogo de productos y variantes'),
('productos.crear',        'productos',  'Crear productos y variantes'),
('productos.editar',       'productos',  'Editar productos, precios y estado'),
('productos.eliminar',     'productos',  'Eliminar o desactivar productos'),
-- Inventario
('inventario.ver',         'inventario', 'Ver existencias por almacen y ubicacion'),
('inventario.editar',      'inventario', 'Ajustar existencias de inventario'),
-- Movimientos
('movimientos.ver',        'movimientos','Ver el historial de movimientos'),
('movimientos.crear',      'movimientos','Registrar entradas, salidas, traslados y ajustes'),
-- Almacenes
('almacenes.ver',          'almacenes',  'Ver almacenes'),
('almacenes.crear',        'almacenes',  'Crear almacenes'),
('almacenes.editar',       'almacenes',  'Editar almacenes'),
('almacenes.eliminar',     'almacenes',  'Eliminar o desactivar almacenes'),
-- Ubicaciones
('ubicaciones.ver',        'ubicaciones','Ver ubicaciones fisicas'),
('ubicaciones.crear',      'ubicaciones','Crear ubicaciones'),
('ubicaciones.editar',     'ubicaciones','Editar ubicaciones'),
('ubicaciones.eliminar',   'ubicaciones','Eliminar o desactivar ubicaciones'),
-- Categorias
('categorias.ver',         'categorias', 'Ver categorias'),
('categorias.crear',       'categorias', 'Crear categorias'),
('categorias.editar',      'categorias', 'Editar categorias'),
('categorias.eliminar',    'categorias', 'Eliminar o desactivar categorias'),
-- Marcas
('marcas.ver',             'marcas',     'Ver marcas'),
('marcas.crear',           'marcas',     'Crear marcas'),
('marcas.editar',          'marcas',     'Editar marcas'),
('marcas.eliminar',        'marcas',     'Eliminar o desactivar marcas'),
-- Catalogos auxiliares
('catalogos.ver',          'catalogos',  'Ver modelos, colores, tallas y unidades'),
('catalogos.crear',        'catalogos',  'Crear modelos, colores, tallas y unidades'),
('catalogos.editar',       'catalogos',  'Editar modelos, colores, tallas y unidades'),
('catalogos.eliminar',     'catalogos',  'Eliminar modelos, colores, tallas y unidades'),
-- Unidades de medida
('unidades.ver',           'unidades',   'Ver unidades de medida'),
('unidades.crear',         'unidades',   'Crear unidades de medida'),
('unidades.editar',        'unidades',   'Editar unidades de medida'),
('unidades.eliminar',      'unidades',   'Eliminar o desactivar unidades de medida'),
-- Reportes
('reportes.ver',           'reportes',   'Ver reportes e indicadores'),
-- WhatsApp
('whatsapp.ver',           'whatsapp',   'Ver el estado de la conexion de WhatsApp'),
('whatsapp.crear',         'whatsapp',   'Enviar mensajes por WhatsApp'),
('whatsapp.editar',        'whatsapp',   'Conectar, reiniciar o cerrar sesion de WhatsApp'),
-- Usuarios
('usuarios.ver',           'usuarios',   'Ver usuarios y cuentas'),
('usuarios.crear',         'usuarios',   'Crear usuarios'),
('usuarios.editar',        'usuarios',   'Editar usuarios y asignar roles'),
('usuarios.eliminar',      'usuarios',   'Eliminar usuarios'),
-- Roles
('roles.ver',              'roles',      'Ver roles y sus permisos'),
('roles.crear',            'roles',      'Crear roles'),
('roles.editar',           'roles',      'Editar nombre y descripcion de roles'),
('roles.eliminar',         'roles',      'Eliminar roles sin usuarios asignados'),
('roles.gestionar',        'roles',      'Gestionar la matriz de permisos de los roles'),
-- Seguridad
('seguridad.ver',          'seguridad',  'Ver el centro de claves y seguridad'),
('seguridad.claves',       'seguridad',  'Restablecer claves de otros usuarios');

-- ------------------------------------------------------------
-- 3. Asignacion de permisos a roles base
-- ------------------------------------------------------------

-- ADMIN: todos los permisos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN';

-- OPERADOR: todo menos administracion de usuarios, roles y seguridad
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'OPERADOR'
  AND p.module NOT IN ('usuarios', 'roles', 'seguridad');

-- VENTAS: solo lectura operativa
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'VENTAS'
  AND p.code LIKE '%.ver'
  AND p.module IN (
      'productos', 'inventario', 'movimientos', 'almacenes', 'ubicaciones',
      'categorias', 'marcas', 'catalogos', 'unidades', 'reportes', 'whatsapp'
  );

-- LECTOR: todos los .ver excepto el centro de seguridad
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'LECTOR'
  AND p.code LIKE '%.ver'
  AND p.module <> 'seguridad';

-- ------------------------------------------------------------
-- 4. Superusuario inicial
--    Hash Argon2id de: Admin2026*
-- ------------------------------------------------------------
INSERT IGNORE INTO users
    (full_name, email, password_hash, is_active, is_staff, is_superuser)
VALUES
    (
        'Wilmer Vargas',
        'wilmere.vargas@gmail.com',
        '$argon2id$v=19$m=65536,t=4,p=1$c1IycC9zT1FNYVk0enBoMg$HBEkDsojk+g8K4Zc+hXsw562R748kLid+dFptY0N3Zg',
        1,
        1,
        1
    );

-- Rol ADMIN para el superusuario inicial
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'ADMIN'
WHERE u.email = 'wilmere.vargas@gmail.com';

COMMIT;
