<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Arbol de ubicaciones fisicas dentro de un almacen.
 * Cada ubicacion conoce su padre, su ruta completa y su profundidad.
 */
class Ubicacion
{
    /**
     * Arbol de ubicaciones con filtros: q, tipo, estatus.
     */
    public static function obtenerTodas(?int $almacenId = null, bool $soloActivas = true, array $f = []): array
    {
        $db     = Database::conectar();
        $where  = ['1 = 1'];
        $params = [];

        if ($almacenId !== null && $almacenId > 0) {
            $where[]        = 'u.almacen_id = :alm';
            $params[':alm'] = $almacenId;
        }

        if (isset($f['estatus']) && $f['estatus'] !== '') {
            $where[]            = 'u.idestatus = :estatus';
            $params[':estatus'] = (int) $f['estatus'];
        } elseif ($soloActivas) {
            $where[] = 'u.idestatus = 1';
        }

        if (!empty($f['tipo'])) {
            $where[]        = 'u.idtipo_ubicacion = :tipo';
            $params[':tipo'] = (int) $f['tipo'];
        }

        if (!empty($f['q'])) {
            $where[]       = '(u.codigo LIKE :q1 OR u.nombre LIKE :q2 OR u.ruta LIKE :q3)';
            $busqueda      = '%' . trim((string) $f['q']) . '%';
            $params[':q1'] = $busqueda;
            $params[':q2'] = $busqueda;
            $params[':q3'] = $busqueda;
        }

        $whereSql = implode(' AND ', $where);
        $sql = "SELECT u.*, a.codigo AS almacen_codigo, a.nombre AS almacen,
                       t.nombre AS tipo_ubicacion,
                       p.codigo AS padre_codigo,
                       (SELECT COALESCE(SUM(i.cantidad), 0) FROM inventario i WHERE i.ubicacion_id = u.id) AS unidades,
                       (SELECT COUNT(*) FROM ubicaciones h WHERE h.padre_id = u.id) AS total_hijos,
                       (SELECT COUNT(*) FROM inventario i2 WHERE i2.ubicacion_id = u.id) AS total_inventario,
                       (SELECT COUNT(*) FROM producto_almacen pa WHERE pa.ubicacion_preferida_id = u.id) AS total_preferida
                FROM ubicaciones u
                JOIN almacenes a ON a.id = u.almacen_id
                JOIN tipos_ubicacion t ON t.id = u.idtipo_ubicacion
                LEFT JOIN ubicaciones p ON p.id = u.padre_id
                WHERE {$whereSql}
                ORDER BY a.nombre, u.profundidad, u.ruta";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$fila) {
            $fila['total_hijos']      = (int) ($fila['total_hijos'] ?? 0);
            $fila['total_inventario'] = (int) ($fila['total_inventario'] ?? 0);
            $fila['total_preferida']  = (int) ($fila['total_preferida'] ?? 0);
            $fila['puede_eliminar']   = $fila['total_hijos'] === 0
                                        && $fila['total_inventario'] === 0
                                        && $fila['total_preferida'] === 0;
        }

        return $filas;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT * FROM ubicaciones WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function tipos(): array
    {
        $db = Database::conectar();
        return $db->query("SELECT * FROM tipos_ubicacion WHERE idestatus = 1 ORDER BY id")->fetchAll();
    }

    public static function crear(array $d): int
    {
        $db = Database::conectar();
        $almacenId = (int) $d['almacen_id'];
        $padreId = !empty($d['padre_id']) ? (int) $d['padre_id'] : null;

        $ruta = strtoupper(trim((string) $d['codigo']));
        $profundidad = 0;
        if ($padreId !== null) {
            $padre = self::obtenerPorId($padreId);
            if (!$padre) {
                throw new InvalidArgumentException('La ubicacion padre no existe');
            }
            if ((int) $padre['almacen_id'] !== $almacenId) {
                throw new InvalidArgumentException('La ubicacion padre pertenece a otro almacen');
            }
            $ruta = $padre['ruta'] . '/' . $ruta;
            $profundidad = (int) $padre['profundidad'] + 1;
        }

        $stmt = $db->prepare(
            "INSERT INTO ubicaciones
                (almacen_id, padre_id, idtipo_ubicacion, codigo, nombre, ruta, profundidad, idestatus)
             VALUES (:almacen, :padre, :tipo, :codigo, :nombre, :ruta, :prof, 1)"
        );
        $stmt->execute([
            ':almacen' => $almacenId,
            ':padre'   => $padreId,
            ':tipo'    => (int) $d['idtipo_ubicacion'],
            ':codigo'  => strtoupper(trim((string) $d['codigo'])),
            ':nombre'  => $d['nombre'],
            ':ruta'    => $ruta,
            ':prof'    => $profundidad,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $d): bool
    {
        $db = Database::conectar();
        $actual = self::obtenerPorId($id);
        if (!$actual) {
            throw new InvalidArgumentException('Ubicacion no encontrada');
        }

        $padreId = !empty($d['padre_id']) ? (int) $d['padre_id'] : null;
        if ($padreId === $id) {
            throw new InvalidArgumentException('Una ubicacion no puede ser su propio padre');
        }

        $codigo = strtoupper(trim((string) $d['codigo']));
        $ruta = $codigo;
        $profundidad = 0;
        if ($padreId !== null) {
            $padre = self::obtenerPorId($padreId);
            if (!$padre) {
                throw new InvalidArgumentException('La ubicacion padre no existe');
            }
            $ruta = $padre['ruta'] . '/' . $codigo;
            $profundidad = (int) $padre['profundidad'] + 1;
        }

        $stmt = $db->prepare(
            "UPDATE ubicaciones SET padre_id = :padre, idtipo_ubicacion = :tipo, codigo = :codigo,
                    nombre = :nombre, ruta = :ruta, profundidad = :prof, idestatus = :estatus
             WHERE id = :id"
        );
        $ok = $stmt->execute([
            ':id'      => $id,
            ':padre'   => $padreId,
            ':tipo'    => (int) $d['idtipo_ubicacion'],
            ':codigo'  => $codigo,
            ':nombre'  => $d['nombre'],
            ':ruta'    => $ruta,
            ':prof'    => $profundidad,
            ':estatus' => (int) ($d['idestatus'] ?? 1),
        ]);

        // Recalcular rutas de los descendientes.
        if ($ruta !== $actual['ruta']) {
            self::recalcularHijos($id, $ruta, $profundidad);
        }

        return $ok;
    }

    private static function recalcularHijos(int $padreId, string $rutaPadre, int $profundidadPadre): void
    {
        $db = Database::conectar();
        $stmt = $db->prepare("SELECT id, codigo FROM ubicaciones WHERE padre_id = :p");
        $stmt->execute([':p' => $padreId]);
        $hijos = $stmt->fetchAll();

        $upd = $db->prepare("UPDATE ubicaciones SET ruta = :ruta, profundidad = :prof WHERE id = :id");
        foreach ($hijos as $h) {
            $ruta = $rutaPadre . '/' . $h['codigo'];
            $prof = $profundidadPadre + 1;
            $upd->execute([':ruta' => $ruta, ':prof' => $prof, ':id' => (int) $h['id']]);
            self::recalcularHijos((int) $h['id'], $ruta, $prof);
        }
    }

    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT
                (SELECT COUNT(*) FROM ubicaciones     WHERE padre_id = :u1) AS hijos,
                (SELECT COUNT(*) FROM inventario      WHERE ubicacion_id = :u2) AS inventario,
                (SELECT COUNT(*) FROM producto_almacen WHERE ubicacion_preferida_id = :u3) AS preferida"
        );
        $stmt->execute([':u1' => $id, ':u2' => $id, ':u3' => $id]);
        $vinculos = $stmt->fetch();

        $hijos      = (int) ($vinculos['hijos'] ?? 0);
        $inventario = (int) ($vinculos['inventario'] ?? 0);
        $preferida  = (int) ($vinculos['preferida'] ?? 0);

        if ($hijos > 0 || $inventario > 0 || $preferida > 0) {
            throw new RuntimeException(
                "No se puede desactivar la ubicacion: tiene {$hijos} sububicacion(es), {$inventario} registro(s) de inventario y {$preferida} referencia(s) como ubicacion preferida."
            );
        }

        $stmt = $db->prepare("UPDATE ubicaciones SET idestatus = 2 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /** Borrado fisico: solo si no tiene hijos, inventario ni es ubicacion preferida. */
    public static function eliminarFisico(int $id): array
    {
        $db = Database::conectar();
        $db->beginTransaction();

        try {
            $actual = self::obtenerPorId($id);
            if (!$actual) {
                $db->rollBack();
                return ['ok' => false, 'codigo' => 404, 'error' => "Ubicacion #{$id} no encontrada"];
            }

            $stmt = $db->prepare(
                "SELECT
                    (SELECT COUNT(*) FROM ubicaciones     WHERE padre_id = :u1) AS hijos,
                    (SELECT COUNT(*) FROM inventario      WHERE ubicacion_id = :u2) AS inventario,
                    (SELECT COUNT(*) FROM producto_almacen WHERE ubicacion_preferida_id = :u3) AS preferida"
            );
            $stmt->execute([':u1' => $id, ':u2' => $id, ':u3' => $id]);
            $vinculos = $stmt->fetch();

            $hijos      = (int) ($vinculos['hijos'] ?? 0);
            $inventario = (int) ($vinculos['inventario'] ?? 0);
            $preferida  = (int) ($vinculos['preferida'] ?? 0);

            if ($hijos > 0 || $inventario > 0 || $preferida > 0) {
                $db->rollBack();
                return [
                    'ok'     => false,
                    'codigo' => 409,
                    'error'  => "No se puede eliminar la ubicacion: {$hijos} sububicacion(es), {$inventario} registro(s) de inventario y {$preferida} referencia(s) como ubicacion preferida.",
                ];
            }

            $stmt = $db->prepare("DELETE FROM ubicaciones WHERE id = :id");
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
                'error'  => 'No se pudo eliminar la ubicacion porque tiene registros vinculados.',
            ];
        }
    }
}
