# Guía de seguridad, roles y accesos — Mia's Store

Esta guía describe la implementación del inicio de sesión, los roles, la matriz de
permisos, la protección de superusuarios y el centro de claves del panel
administrativo de **Mia's Store**.

La solución está construida con **PHP 8 + PDO + MySQL** y un frontend **React + Vite +
Tailwind CSS**. No requiere Laravel ni frameworks pesados.

---

## 1. Requisitos

- PHP 8.1 o superior (probado con PHP 8.3).
  - Extensiones: `pdo_mysql`, `mbstring`, `json`, `openssl`.
- MySQL 8.x o MariaDB compatible.
- Node.js 20 o superior para el dashboard.
- El dashboard y la API deben ejecutarse en `localhost` o `127.0.0.1`.

---

## 2. Instalación de la base de datos

Los scripts están en `database/` y son idempotentes: se pueden ejecutar más de una
vez sin duplicar datos.

### 2.1 Crear la base de datos

```sql
CREATE DATABASE IF NOT EXISTS mias_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2.2 Ejecutar el esquema y los datos iniciales

Linux/macOS:

```bash
mysql -u root -p < database/schema_auth.sql
mysql -u root -p < database/seed_auth.sql
```

Windows PowerShell (Laragon):

```powershell
$mysql = "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe"
& $mysql -uroot -e "source C:/py/websystemdev/mias_store/database/schema_auth.sql"
& $mysql -uroot -e "source C:/py/websystemdev/mias_store/database/seed_auth.sql"
```

También puede usarse el cliente de MySQL de forma interactiva:

```sql
SOURCE C:/ruta/al/proyecto/database/schema_auth.sql;
SOURCE C:/ruta/al/proyecto/database/seed_auth.sql;
```

> `seed_auth.sql` debe ejecutarse **después** de `schema_auth.sql`.

### 2.3 Credenciales iniciales

| Campo | Valor |
|---|---|
| Nombre | Wilmer Vargas |
| Correo | `wilmere.vargas@gmail.com` |
| Contraseña | `Admin2026*` |
| Superusuario | Sí |
| Staff | Sí |
| Activo | Sí |

La contraseña se almacena con **Argon2id**. Cambie esta clave después del primer
inicio de sesión desde el menú de perfil → **Cambiar mi contraseña**.

---

## 3. Arranque del proyecto

Backend (desde la raíz del proyecto):

```bash
php -S localhost:8000 -t backend
```

Frontend:

```bash
cd dashboard
npm install
npm run dev
```

La API queda en `http://localhost:8000/index.php?url=<recurso>` y el dashboard en
`http://localhost:5173` (puerto habitual de Vite).

La URL de la API se calcula automáticamente usando el host actual del navegador y el
puerto `8000` (`dashboard/src/services/api.js`). Por eso el frontend debe abrirse con
`localhost` o `127.0.0.1`, igual que la API.

---

## 4. Modelo de datos

| Tabla | Propósito |
|---|---|
| `users` | Cuentas de acceso. Reemplaza a la tabla legacy `usuarios` sin modificarla. |
| `roles` | Grupos de permisos. Incluye `ADMIN`, `OPERADOR`, `VENTAS` y `LECTOR`. |
| `permissions` | Catálogo de permisos en formato `modulo.accion`. |
| `user_roles` | Relación N:N entre usuarios y roles. |
| `role_permissions` | Relación N:N entre roles y permisos. |
| `user_permissions` | Overrides individuales: `allowed = 1` permite y `allowed = 0` deniega. |

La tabla legacy `usuarios` **no se utiliza** para autenticación y no fue modificada.

### Campos relevantes de `users`

- `email`: único y normalizado a minúsculas.
- `password_hash`: Argon2id o bcrypt según disponibilidad de PHP.
- `is_active`: una cuenta inactiva no puede iniciar sesión.
- `is_staff`: marca de personal del panel.
- `is_superuser`: acceso total, independiente de roles y overrides.
- `last_login`: se actualiza en cada inicio de sesión exitoso.

---

## 5. Autenticación

### 5.1 Inicio de sesión

1. El usuario envía correo y contraseña a `POST auth/login`.
2. El correo se normaliza con `mb_strtolower(trim($email))`.
3. Se busca la cuenta por correo y se valida con `password_verify()`.
4. Si la cuenta no existe, está inactiva o la clave es incorrecta, la respuesta es
   siempre el mismo mensaje genérico:

   > Correo electrónico o contraseña incorrectos.

5. En caso exitoso:
   - Se ejecuta `session_regenerate_id(true)`.
   - Se guarda únicamente `user_id` en la sesión.
   - Se actualiza `last_login`.
   - Se devuelve el perfil público, los permisos efectivos y `puede_seguridad`.

### 5.2 Sesión

- Nombre de cookie: `mias_store_sid`.
- `HttpOnly: true` (JavaScript no puede leerla).
- `SameSite=Lax`.
- `Secure` se activa automáticamente cuando la petición llega por HTTPS.
- La sesión PHP se valida contra la base de datos en cada petición: si la cuenta fue
  desactivada o eliminada, la sesión se invalida.

### 5.3 CORS con credenciales

El backend refleja el `Origin` cuando el host es local (`localhost`, `127.0.0.1`,
`::1`), en cualquier puerto, y responde con:

```
Access-Control-Allow-Credentials: true
```

El frontend envía todas las peticiones con `credentials: 'include'`. Esto permite
compartir la cookie de sesión entre Vite (`:5173`) y PHP (`:8000`).

### 5.4 Fin de sesión

`POST auth/logout` destruye la sesión y elimina la cookie. El dashboard vuelve
automáticamente al login.

Si una petición devuelve `401`, el frontend dispara el evento
`mias:sesion-expirada` y limpia el estado de autenticación.

---

## 6. Autorización

### 6.1 Regla de evaluación (`Authz::puede`)

1. Sin sesión o cuenta inactiva → `false`.
2. `is_superuser = 1` → `true`.
3. Si existe un override en `user_permissions`, ese valor manda.
4. Si el permiso está en alguno de sus roles → `true`.
5. En cualquier otro caso → `false`.

### 6.2 Permisos disponibles

Formato: `modulo.accion`.

| Módulo | Acciones |
|---|---|
| productos | ver, crear, editar, eliminar |
| inventario | ver, editar |
| movimientos | ver, crear |
| almacenes | ver, crear, editar, eliminar |
| ubicaciones | ver, crear, editar, eliminar |
| categorias | ver, crear, editar, eliminar |
| marcas | ver, crear, editar, eliminar |
| catalogos | ver, crear, editar, eliminar |
| reportes | ver |
| whatsapp | ver, crear, editar |
| usuarios | ver, crear, editar, eliminar |
| roles | ver, crear, editar, eliminar, gestionar |
| seguridad | ver, claves |

Total inicial: **43 permisos**.

### 6.3 Roles iniciales

| Rol | Permisos | Uso previsto |
|---|---|---|
| `ADMIN` | 43 | Acceso total. No se puede renombrar ni eliminar. |
| `OPERADOR` | 32 | Operación de catálogo, almacenes, inventario y movimientos. |
| `VENTAS` | 10 | Consulta operativa del catálogo, inventario y reportes. |
| `LECTOR` | 12 | Consulta general, sin restablecer claves de otros usuarios. |

### 6.4 Acceso a “Seguridad y Accesos”

La sección se muestra cuando:

- El usuario es superusuario, o
- Tiene alguno de estos permisos:
  - `usuarios.ver`, `usuarios.crear`, `usuarios.editar` o `usuarios.eliminar`
  - `roles.ver` o `roles.gestionar`
  - `seguridad.ver` o `seguridad.claves`

Cada endpoint valida sus propios permisos y responde `403` cuando corresponde, por lo
que ocultar la sección en el frontend no es la única protección.

Las pestañas también se condicionan:

- **Usuarios y Cuentas**: permisos de usuarios o `seguridad.claves`.
- **Roles y Permisos**: permisos de roles.
- **Centro de Claves y Seguridad**: disponible para cualquier usuario autenticado,
  porque siempre puede cambiar su propia clave.

---

## 7. Sección “Seguridad y Accesos”

### 7.1 Usuarios y Cuentas

- Lista con búsqueda por nombre/correo y filtro por estado.
- Muestra nombre, correo, etiqueta **Superusuario** o roles asignados, estado y último
  acceso.
- Permite crear, editar, activar/desactivar y eliminar cuentas según permisos.
- La creación asigna una contraseña inicial y uno o varios roles.
- Solo un superusuario puede:
  - Crear o modificar superusuarios.
  - Asignar el rol `ADMIN`.
  - Cambiar `is_superuser`.
  - Restablecer la clave de otro superusuario.
- Nadie puede desactivar ni eliminar su propia cuenta.
- Nadie puede quitarse su propio estado de superusuario.

### 7.2 Roles y Permisos

- Lista lateral de roles con cantidad de permisos y usuarios asignados.
- Matriz agrupada por módulo y acción.
- Acciones rápidas: marcar todos los permisos de un módulo, marcar todo, limpiar,
  descartar cambios y guardar.
- Crear y editar nombre/descripción de roles.
- El rol `ADMIN` no se puede renombrar ni eliminar.
- No se puede eliminar un rol con usuarios asignados.
- La matriz es de solo lectura si el usuario no tiene `roles.gestionar`.

### 7.3 Centro de Claves y Seguridad

- Resumen de la sesión: nombre, correo, rol, último acceso y recomendaciones.
- Cambio de la propia contraseña solicitando la clave actual.
- Generador de claves seguras de 14 caracteres.
- Si el usuario tiene `seguridad.claves`:
  - Busca cuentas y restablece su clave.
  - Puede generar una clave temporal o escribir una propia.
  - Al finalizar muestra las credenciales y permite copiarlas.
  - No puede restablecer su propia clave desde esta sección (usa el formulario
    “Mi contraseña”).
  - Un usuario que no es superusuario no puede restablecer la clave de un
    superusuario.

---

## 8. Endpoints de la API

Base: `http://localhost:8000/index.php?url=<recurso>`

### 8.1 Autenticación

| Método | Recurso | Permiso | Descripción |
|---|---|---|---|
| POST | `auth/login` | público | Inicia sesión. Body: `{ email, password }`. |
| GET | `auth/me` | autenticado | Devuelve perfil, permisos y `puede_seguridad`. |
| POST | `auth/logout` | autenticado | Cierra la sesión. |

### 8.2 Usuarios

| Método | Recurso | Permiso |
|---|---|---|
| GET | `usuarios` | `usuarios.ver` o similar |
| GET | `usuarios/{id}` | `usuarios.ver` o similar |
| POST | `usuarios` | `usuarios.crear` |
| PUT | `usuarios/{id}` | `usuarios.editar` |
| DELETE | `usuarios/{id}` | `usuarios.eliminar` |

Crear usuario:

```json
{
  "full_name": "Ana Pérez",
  "email": "ana@ejemplo.com",
  "password": "ClaveSegura2026*",
  "is_active": 1,
  "is_superuser": 0,
  "roles": [2, 4]
}
```

Actualizar usuario (solo se modifican los campos enviados):

```json
{
  "full_name": "Ana Pérez",
  "email": "ana@ejemplo.com",
  "password": "NuevaClave2026*",
  "is_active": 1,
  "is_superuser": 0,
  "roles": [4]
}
```

### 8.3 Roles y permisos

| Método | Recurso | Permiso |
|---|---|---|
| GET | `roles` | `roles.ver`/`roles.crear`/`roles.editar`/`roles.eliminar`/`roles.gestionar`/usuarios/seguridad.claves |
| GET | `roles/{id}` | `roles.ver`, `roles.gestionar`, usuarios o `seguridad.claves` |
| POST | `roles` | `roles.crear` o `roles.gestionar` |
| PUT | `roles/{id}` | `roles.editar` o `roles.gestionar` |
| DELETE | `roles/{id}` | `roles.eliminar` |
| GET | `permisos` | `roles.ver`, `roles.gestionar` o similar |

Crear rol con matriz:

```json
{
  "name": "SUPERVISOR",
  "description": "Supervisión de inventario y reportes",
  "permisos": [1, 2, 5, 9, 29]
}
```

Actualizar solo la matriz:

```json
{
  "permisos": [1, 2, 3, 5, 9, 29]
}
```

> Para enviar `permisos` se necesita `roles.gestionar` (o ser superusuario).

### 8.4 Claves y seguridad

| Método | Recurso | Permiso | Descripción |
|---|---|---|---|
| POST | `seguridad/cambiar-password` | autenticado | Cambia la clave propia. |
| POST | `seguridad/restablecer-password` | `seguridad.claves` | Restablece la clave de otro usuario. |

Cambiar la clave propia:

```json
{
  "password_actual": "ClaveActual2026*",
  "password_nueva": "NuevaClave2026*",
  "password_confirmacion": "NuevaClave2026*"
}
```

Restablecer la clave de otro usuario:

```json
{
  "user_id": 5,
  "password": "Temporal2026*"
}
```

Si se omite `password` o se envía vacío, el backend genera una clave temporal y la
devuelve en `datos.password_temporal`.

---

## 9. Códigos de respuesta

| Código | Significado |
|---|---|
| 200 | Operación correcta. |
| 201 | Recurso creado. |
| 400 | Datos inválidos o regla de negocio incumplida. |
| 401 | Sesión ausente/expirada o credenciales incorrectas. |
| 403 | Autenticado, pero sin permisos. |
| 404 | Recurso no encontrado. |
| 500 | Error interno o de base de datos. |

El formato de respuesta es:

```json
{
  "success": true,
  "datos": {}
}
```

o

```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

Los errores de validación pueden devolver `error` como una lista de mensajes.

---

## 10. Integración en el frontend

### Archivos principales

| Archivo | Función |
|---|---|
| `dashboard/src/context/AuthContext.jsx` | Sesión, `puede()`, `puedeSeguridad`, login/logout y recarga. |
| `dashboard/src/services/api.js` | Cliente HTTP con `credentials: 'include'`. |
| `dashboard/src/config/navegacion.js` | Grupos del menú y permiso `.ver` de cada módulo. |
| `dashboard/src/App.jsx` | Muestra login, pantalla de carga o dashboard según la sesión. |
| `dashboard/src/components/auth/Login.jsx` | Login centrado, sin panel lateral. |
| `dashboard/src/components/layout/Header.jsx` | Perfil, rol, cambio de clave y cierre de sesión. |
| `dashboard/src/components/layout/Sidebar.jsx` | Menú filtrado por permisos. |
| `dashboard/src/components/seguridad/ModuloSeguridad.jsx` | Pestañas condicionadas por permisos. |
| `dashboard/src/components/seguridad/TabUsuarios.jsx` | CRUD de cuentas y asignación de roles. |
| `dashboard/src/components/seguridad/TabRolesPermisos.jsx` | Roles y matriz de permisos. |
| `dashboard/src/components/seguridad/TabCentroClaves.jsx` | Clave propia y restablecimiento de claves. |

### Comportamiento del menú

Cada módulo se muestra si el usuario tiene su permiso `.ver`:

- productos → `productos.ver`
- inventario → `inventario.ver`
- movimientos → `movimientos.ver`
- almacenes → `almacenes.ver`
- ubicaciones → `ubicaciones.ver`
- categorias → `categorias.ver`
- marcas → `marcas.ver`
- catalogos → `catalogos.ver`
- reportes → `reportes.ver`
- whatsapp → `whatsapp.ver`
- seguridad → regla especial de la sección de seguridad

Si un usuario pierde acceso al módulo activo, el dashboard selecciona automáticamente
el primer módulo permitido. Si no tiene ninguno, muestra un aviso y deja disponible el
cambio de clave y el cierre de sesión.

### Tema claro/oscuro

El cambio de tema se guarda en `localStorage` (`mias_store_dashboard_theme`). El
dashboard mantiene la identidad visual morado/rosa y adapta tarjetas, tablas y
formularios al modo oscuro.

---

## 11. Operaciones habituales

### Crear un usuario con rol VENTAS

1. Entre a **Seguridad y Accesos → Usuarios y Cuentas**.
2. Pulse **Nuevo usuario**.
3. Complete nombre, correo y contraseña.
4. Marque el rol `VENTAS`.
5. Guarde. El usuario ya puede iniciar sesión.

### Restablecer una clave olvidada

1. Entre a **Seguridad y Accesos → Centro de Claves y Seguridad**.
2. Busque la cuenta.
3. Pulse **Restablecer**.
4. Genere o escriba una clave temporal.
5. Copie las credenciales y entréguelas por un medio seguro.
6. Pida a la persona que cambie la clave al iniciar sesión.

### Crear un rol y asignarle permisos

1. En **Roles y Permisos**, pulse **Nuevo rol**.
2. Escriba el nombre y la descripción.
3. Seleccione el rol creado en la lista.
4. Marque los permisos por módulo o use **Marcar todo**.
5. Pulse **Guardar permisos**.

### Aplicar un permiso individual (override)

La interfaz no incluye todavía un editor de overrides. Puede hacerse por SQL:

```sql
-- Permitir un permiso puntual
INSERT INTO user_permissions (user_id, permission_id, allowed)
SELECT 5, id, 1 FROM permissions WHERE code = 'reportes.ver';

-- Denegar un permiso aunque venga de un rol
INSERT INTO user_permissions (user_id, permission_id, allowed)
SELECT 5, id, 0 FROM permissions WHERE code = 'productos.eliminar';
```

El override siempre manda sobre los roles, salvo que el usuario sea superusuario.

---

## 12. Reglas de protección implementadas

1. **Último superusuario activo**
   - No se puede desactivar.
   - No se le puede quitar `is_superuser`.
   - No se puede eliminar.

2. **Cuenta propia**
   - No se puede desactivar.
   - No se puede eliminar.
   - No se puede quitar el estado de superusuario a sí mismo.

3. **Rol ADMIN**
   - No se puede renombrar.
   - No se puede eliminar.
   - Solo un superusuario puede asignarlo.

4. **Superusuarios**
   - Solo otro superusuario puede modificarlos, eliminarlos o restablecer su clave.

5. **Roles con usuarios**
   - No se pueden eliminar mientras tengan cuentas asignadas.

6. **Sesión**
   - Se regenera al iniciar sesión y al cambiar la clave.
   - Se invalida si la cuenta se desactiva o se elimina.

---

## 13. Lista de verificación para producción

- [ ] Cambiar la contraseña inicial del superusuario.
- [ ] Cambiar las credenciales de MySQL en `backend/config/Database.php`.
- [ ] Servir la aplicación por HTTPS (la cookie `Secure` se activa sola).
- [ ] Revisar `session.save_path` y los permisos del servidor PHP.
- [ ] Restringir CORS al dominio real; el código actual solo permite hosts locales.
- [ ] Configurar un usuario MySQL con permisos mínimos (no `root`).
- [ ] Programar copias de seguridad de `users`, `roles`, `permissions` y sus relaciones.
- [ ] Definir una política de contraseñas y rotación.
- [ ] Revisar los endpoints antiguos de negocio antes de exponer el panel a Internet.
- [ ] Configurar registros de auditoría y limitación de intentos de login (no incluidos).

---

## 14. Limitaciones conocidas

- Los endpoints CRUD existentes de productos, inventario, almacenes, etc. **no fueron
  modificados** para no romper la tienda pública ni los flujos actuales. La sección de
  seguridad y sus endpoints sí están protegidos. Antes de exponer el panel en
  producción conviene aplicar los mismos guards a esos CRUD.
- No hay recuperación de contraseña por correo; un usuario con `seguridad.claves` debe
  restablecerla.
- No hay autenticación de dos factores (2FA).
- No hay bitácora de auditoría de cambios de roles o claves.
- Los overrides por usuario se administran por SQL, no desde la interfaz.
- La tabla legacy `usuarios` se conserva intacta y no participa en la autenticación.

---

## 15. Solución de problemas

### El login responde 401 con credenciales correctas

- Verifique que el correo exista en `users` y que `is_active = 1`.
- Confirme que la contraseña coincide con el hash guardado.
- Revise que el cuerpo JSON llegue completo (sin BOM ni comillas problemáticas).

### El navegador no conserva la sesión

- Abra el dashboard y la API con el mismo host (`localhost` en ambos, o `127.0.0.1`
  en ambos).
- Confirme que las peticiones usan `credentials: 'include'`.
- Verifique que el backend responda con `Access-Control-Allow-Credentials: true` y un
  `Access-Control-Allow-Origin` que coincida exactamente con el origen del navegador.
- Si usa HTTPS, confirme que la cookie no esté bloqueada por políticas del navegador.

### Error 403 al guardar la matriz de permisos

- El usuario necesita `roles.gestionar`.
- Si intenta asignar el rol `ADMIN`, necesita ser superusuario.

### Error “No puedes desactivar ni quitar el estado de superusuario al último superusuario activo”

- Cree o active otro superusuario antes de modificar al actual.

### El menú no muestra un módulo

- Revise que el rol tenga el permiso `.ver` correspondiente.
- Cierre sesión y vuelva a entrar, o recargue la página, para refrescar los permisos.

### Error de conexión a la base de datos

- Confirme que MySQL esté activo.
- Revise host, base, usuario y contraseña en `backend/config/Database.php`.
- Verifique que la base `mias_store` exista y que los scripts se hayan ejecutado.

---

## 16. Archivos entregados

```text
database/schema_auth.sql                  Estructura de las 6 tablas
database/seed_auth.sql                    Roles, permisos y superusuario inicial
backend/core/Auth.php                     Sesión, login y perfil
backend/core/Authz.php                    Evaluación de permisos y guards
backend/models/Usuario.php                Consultas de usuarios
backend/models/Rol.php                    Consultas y matriz de roles
backend/models/Permiso.php                Catálogo y permisos efectivos
backend/controllers/AuthController.php    Login, sesión y logout
backend/controllers/UsuarioController.php CRUD de cuentas
backend/controllers/RolController.php     CRUD de roles y matriz
backend/controllers/PermisoController.php Catálogo de permisos
backend/controllers/SeguridadController.php Cambio y restablecimiento de claves
backend/routes/api.php                    Rutas de autenticación y seguridad
backend/index.php                         CORS con credenciales y sesión
dashboard/src/...                         Login, layout, seguridad y contexto
GUIA_SEGURIDAD_MIAS_STORE.md              Esta guía
```
