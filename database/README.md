# Fase 1 - Inventario multialmacén

Base de datos: **mias_store**  
Motor: **MySQL 8.4.3** (Laragon)  
Cliente usado: `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`

## Backup

Antes de ejecutar cualquier script se creó:

```
database/backups/mias_store_antes_inventario.sql
```

Para restaurar completamente:

```powershell
# 1. Crear una base limpia (o eliminar y recrear mias_store)
& 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe' -u root -e "DROP DATABASE IF EXISTS mias_store; CREATE DATABASE mias_store CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

# 2. Importar el backup
& 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe' -u root --default-character-set=utf8mb4 mias_store -e "source C:/py/websystemdev/mias_store/database/backups/mias_store_antes_inventario.sql"
```

## Orden de ejecución

```powershell
$mysql = 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe'
$base  = 'C:\py\websystemdev\mias_store\database'

& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/01_schema_inventario.sql"
& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/02_seed_catalogos.sql"
& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/03_migracion_datos.sql"
& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/04_triggers_vistas.sql"
& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/05_verificacion.sql"
& $mysql -u root --default-character-set=utf8mb4 mias_store -e "source $base/06_soporte_backend.sql"
```

Usa rutas con `/` dentro de `source`. El cliente de XAMPP puede fallar con MySQL 8.4 por `caching_sha2_password`; usa el cliente de Laragon.

## Qué crea cada script

| Script | Contenido |
|---|---|
| `01_schema_inventario.sql` | Tablas `almacenes`, `ubicaciones`, `tallas`, `colores`, `modelos`, `producto_variantes`, `inventario_stock`, `movimientos_inventario`; columnas nuevas en `productos`, `items_carrito` e `items_pedido`. |
| `02_seed_catalogos.sql` | Almacén principal, tienda y depósito; ubicaciones base; catálogo de tallas y colores. |
| `03_migracion_datos.sql` | Variante base para cada producto, inventario inicial, movimiento inicial, backfill de carrito/pedidos y clasificación automática de color/talla. |
| `04_triggers_vistas.sql` | Triggers de inmutabilidad del inventario inicial, sincronización de `productos.stock` y vistas de consulta. |
| `05_verificacion.sql` | Conteos, descuadres, duplicados y pruebas de inmutabilidad. |
| `06_soporte_backend.sql` | Índices únicos para un carrito por cliente y una línea por variante; índice de kardex por referencia. |

## Reglas importantes

- `productos.costo`, `productos.precio` y `productos.preciofull` son `DECIMAL(12,2)`.
- El **SKU vive en `producto_variantes`**, no en `productos`.
- Todo producto tiene una **variante base** (`es_base = 1`).
- `productos.stock` es un **cache** que se mantiene igual a la suma de `inventario_stock.stock_actual - stock_reservado`.
- `inventario_inicial` y `fecha_inventario_inicial` son **inmutables** después de crear la fila.
- No se pueden borrar filas de `inventario_stock`; se desactivan con `idestatus = 2`.
- Todo cambio de stock debe registrar un movimiento en `movimientos_inventario`.

## Vistas útiles

- `vw_inventario_detalle`: producto, SKU, talla, color, modelo, almacén, pasillo, estante, sector, nivel y stock.
- `vw_producto_stock`: stock total, costo, precio, margen y valor.
- `vw_stock_por_almacen`: stock por producto y almacén.
- `vw_kardex`: movimientos legibles.
- `vw_stock_critico`: ubicaciones por debajo del stock mínimo.
- `vw_clasificacion_pendiente`: productos sin color/modelo/talla real.

## Notas sobre clasificación

- Los colores se detectan por palabras del nombre del producto: Negro, Blanco, Gris, Plata, Azul, Celeste, Verde, Rojo, Rosado, Morado, Dorado, Beige, Marrón, Naranja, Amarillo, Transparente, Multicolor.
- Las tallas de cama (Twin, Full, Queen, King) y las tallas de ropa (XS a XXXL) se detectan solo cuando aparecen como palabra completa.
- Los productos sin una talla aplicable quedan con `UNICA`.
- Los modelos quedan pendientes de revisión en `vw_clasificacion_pendiente`; no se inventan modelos automáticamente.

## API del backend

Base: `http://localhost:8000/index.php?url=<recurso>` (los parámetros extra se separan con `&`).

### Productos y variantes

| Método | Recurso | Descripción |
|---|---|---|
| GET | `productos?todos=1&q=...&idcategoria=...&idmarca=...&talla_id=...&color_id=...&con_stock=1` | Lista productos con `variantes` y `skus`. |
| GET | `productos/{id}` | Detalle con `variantes[]` e `inventario[]`. |
| POST | `productos` | Crea producto + variante base + inventario inicial en una transacción. |
| PUT | `productos/{id}` | Actualiza; si cambia `stock`, se registra un `ajuste`. |
| DELETE | `productos/{id}` | Borrado lógico del producto y sus variantes. |
| GET | `productos/{id}/variantes` | Variantes con stock disponible. |
| POST | `productos/{id}/variantes` | Crea variante con SKU automático y fila de inventario en cero. |
| GET/PUT/DELETE | `variantes/{id}` | Consulta, edita o desactiva (la base no se desactiva). |

### Catálogos

| Método | Recurso | Descripción |
|---|---|---|
| GET/POST | `almacenes`, `tallas`, `colores`, `modelos` | Listar o crear. |
| GET/POST | `ubicaciones?almacen_id=1` | Listar por almacén o crear. |
| PUT/DELETE | `<catalogo>/{id}` | Editar o desactivar lógicamente. |

### Inventario

| Método | Recurso | Descripción |
|---|---|---|
| GET | `inventario?q=...&almacen_id=...&bajo_minimo=1` | Stock por ubicación desde `vw_inventario_detalle`. |
| GET | `inventario/resumen` | Totales generales y por almacén. |
| GET | `inventario/kardex?producto_id=...&tipo=...&desde=...&hasta=...` | Movimientos paginados. |
| GET | `inventario/critico` | Ubicaciones bajo stock mínimo. |
| GET | `inventario/clasificacion` | Productos con talla/color/modelo pendiente. |
| GET | `inventario/stock/{varianteId}` | Stock disponible total de la variante. |
| POST | `inventario/movimientos` | `{ variante_id, ubicacion_id, tipo, cantidad, motivo }`. |
| POST | `inventario/transferencias` | `{ variante_id, origen_inventario_id, destino_ubicacion_id, cantidad, motivo }`. |

Tipos de movimiento aceptados: `entrada`, `salida`, `ajuste`, `devolucion`, `baja`. En `ajuste`, una cantidad negativa resta.

### Carrito y pedidos

- `GET carrito?cliente_id=1`
- `POST carrito/items` → `{ cliente_id, producto_id, variante_id, cantidad }`
- `PUT carrito/items/{id}` → `{ cantidad }`
- `DELETE carrito/items/{id}`
- `POST pedidos` → crea el pedido, descuenta inventario y registra kardex en una sola transacción.

### Variables de entorno del backend

`MIAS_DB_HOST`, `MIAS_DB_NAME`, `MIAS_DB_USER`, `MIAS_DB_PASS` permiten apuntar a otra base (por ejemplo `mias_store_test`) sin editar código.
