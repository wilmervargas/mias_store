# Base de datos — Mia's Store

## Archivos

| Archivo | Contenido |
|---|---|
| `mias_store_v2.sql` | Esquema base de la tienda e inventario. |
| `migracion_v2.sql` | Migraciones incrementales del esquema de la tienda. |
| `schema_auth.sql` | Tablas de autenticación, roles, permisos y overrides. |
| `seed_auth.sql` | Roles, catálogo de 43 permisos, asignaciones y superusuario inicial. |

## Orden de ejecución

1. Crear la base de datos `mias_store` (utf8mb4 / utf8mb4_unicode_ci).
2. Ejecutar el esquema de la tienda (`mias_store_v2.sql` y, si aplica,
   `migracion_v2.sql`).
3. Ejecutar `schema_auth.sql`.
4. Ejecutar `seed_auth.sql`.

Los scripts de autenticación son idempotentes: usan `CREATE TABLE IF NOT EXISTS` e
`INSERT IGNORE`. Se pueden ejecutar varias veces sin duplicar datos.

## Tablas de autenticación

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_permissions`

La tabla legacy `usuarios` se conserva sin cambios y no se utiliza para el login.

## Credenciales iniciales

- Correo: `wilmere.vargas@gmail.com`
- Contraseña: `Admin2026*`
- Superusuario: sí
- Hash: Argon2id

Cambie la contraseña después del primer acceso.

## Más información

Consulte `GUIA_SEGURIDAD_MIAS_STORE.md` en la raíz del proyecto para el flujo de
autenticación, la matriz de permisos, los endpoints y las reglas de protección.
