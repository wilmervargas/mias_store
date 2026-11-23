<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Almacen
{
    /**
     * Almacenes con metricas. Filtros: q, estatus.
     */
    public static function obtenerTodos(bool $soloActivos = true, array $f = []): array
    {
        $db     = Database::conectar();
        $where  = [];
        $params = [];

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]            = 'a.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivos) {
            $where[] = 'a.idestatus = 1';
        }

        if (!empty($f['q'])) {
            $where[]       = '(a.codigo LIKE :q1 OR a.nombre LIKE :q2 OR a.direccion LIKE :q3)';
            $busqueda      = '%' . trim((string) $f['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
            $params[':q3'] = $busqueda;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT a.*,
                       (SELECT COUNT(*) FROM ubicaciones u WHERE u.almacen_id = a.id AND u.idestatus = 1) AS total_ubicaciones,
                       (SELECT COUNT(DISTINCT pa.producto_id) FROM producto_almacen pa WHERE pa.almacen_id = a.id) AS total_productos,
                       (SELECT COALESCE(SUM(i.cantidad), 0)
                          FROM inventario i JOIN ubicaciones u2 ON u2.id = i.ubicacion_id
                         WHERE u2.almacen_id = a.id) AS total_unidades,
                       (SELECT COUNT(*)
                          FROM inventario i3 JOIN ubicaciones u3 ON u3.id = i3.ubicacion_id
                         WHERE u3.almacen_id = a.id) AS total_inventario
                FROM almacenes a
                {$whereSql}
                ORDER BY a.nombre";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$fila) {
            $fila['total_productos']   = (int) ($fila['total_productos'] ?? 0);
            $fila['total_inventario']   = (int) ($fila['total_inventario'] ?? 0);
            $fila['puede_desactivar']   = $fila['total_productos'] === 0
                                        && $fila['total_inventario'] === 0;
            $fila['puede_eliminar']     = $fila['total_productos'] === 0
                                        && $fila['total_inventario'] === 0;
        }

        return $filas;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM almacenes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO almacenes (codigo, nombre, direccion, telefono, idestatus)
             VALUES (:codigo, :nombre, :direccion, :telefono, 1)"
        );
        $stmt->execute([
            ':codigo'    => strtoupper(trim((string) $d['codigo'])),
            ':nombre'    => $d['nombre'],
            ':direccion' => $d['direccion'] ?? null,
            ':telefono'  => $d['telefono'] ?? null,
        ]);
        $id = (int) $db->lastInsertId();

        // Todo almacen nace con una ubicacion General para poder recibir stock.
        $stmt = $db->prepare(
            "INSERT INTO ubicaciones (almacen_id, padre_id, idtipo_ubicacion, codigo, nombre, ruta, profundidad, idestatus)
             VALUES (:almacen, NULL, 1, 'GEN', 'General', 'GEN', 0, 1)"
        );
        $stmt->execute([':almacen' => $id]);

        return $id;
    }

    public static function actualizar(int $id, array $d): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE almacenes SET codigo = :codigo, nombre = :nombre, direccion = :direccion,
                    telefono = :telefono, idestatus = :idestatus
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id'        => $id,
            ':codigo'    => strtoupper(trim((string) $d['codigo'])),
            ':nombre'    => $d['nombre'],
            ':direccion' => $d['direccion'] ?? null,
            ':telefono'  => $d['telefono'] ?? null,
            ':idestatus' => (int) ($d['idestatus'] ?? 1),
        ]);
    }

    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT
                (SELECT COUNT(*) FROM producto_almacen WHERE almacen_id = :a1) AS asignaciones,
                (SELECT COUNT(*)
                   FROM inventario i JOIN ubicaciones u ON u.id = i.ubicacion_id
                  WHERE u.almacen_id = :a2) AS inventario"
        );
        $stmt->execute([':a1' => $id, ':a2' => $id]);
        $vinculos = $stmt->fetch();

        $asignaciones = (int) ($vinculos['asignaciones'] ?? 0);
        $inventario   = (int) ($vinculos['inventario'] ?? 0);

        if ($asignaciones > 0 || $inventario > 0) {
            throw new RuntimeException(
                "No se puede desactivar el almacen: tiene {$asignaciones} producto(s) asignado(s) y {$inventario} registro(s) de inventario."
            );
        }

        $stmt = $db->prepare("UPDATE almacenes SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si no tiene productos asignados ni filas de inventario. */
    public static function eliminarFisico(int $id): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Almacen #{$id} no encontrado"];
            }

            $stmt = $db->prepare(
                "SELECT
                    (SELECT COUNT(*) FROM producto_almacen WHERE almacen_id = :a1) AS asignaciones,
                    (SELECT COUNT(*)
                       FROM inventario i JOIN ubicaciones u ON u.id = i.ubicacion_id
                      WHERE u.almacen_id = :a2) AS inventario"
            );
            $stmt->execute([':a1' => $id, ':a2' => $id]);
            $vinculos = $stmt->fetch();

            $asignaciones = (int) ($vinculos['asignaciones'] ?? 0);
            $inventario   = (int) ($vinculos['inventario'] ?? 0);

            if ($asignaciones > 0 || $inventario > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar el almacen: {$asignaciones} producto(s) asignado(s) y {$inventario} registro(s) de inventario.",
                ];
            }

            // Las ubicaciones del almacen se eliminan en cascada.
            $stmt = $db->prepare("DELETE FROM almacenes WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $db->commit();

            return ['ok' => true];
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return [
                'ok'     => false,
                'codigo' => 409,
                'error'  => 'No se pudo eliminar el almacen porque tiene registros vinculados.',
            ];
        }
    }
}
