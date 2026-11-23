<?php
declare(strict_types=1);

/**
 * Agrupa variantes existentes (mismo articulo en distinto color) asignando
 * productos.producto_base_id. Pensado para la migracion V2.
 *
 * Uso:
 *   php backend/scripts/agrupar_variantes.php            -> simulacion (no escribe)
 *   php backend/scripts/agrupar_variantes.php --apply    -> aplica los cambios
 *
 * Reglas de seguridad:
 *   - Solo agrupa productos con color real (idcolor <> 1).
 *   - Exige misma marca, categoria y modelo.
 *   - Compara el nombre quitando la palabra del color y su variante de genero.
 *   - Si el grupo repite un color, se omite completo (posibles duplicados).
 *   - El producto base conserva producto_base_id = NULL; las variantes apuntan a el.
 */

require_once __DIR__ . '/../config/Database.php';

$aplicar = in_array('--apply', $argv, true);

$db = Database::conectar();

$sql = "SELECT p.id, p.nombre, p.idmarca, p.idcategoria, p.idmodelo, p.idcolor,
               p.producto_base_id, c.nombre AS color
        FROM productos p
        JOIN colores c ON c.id = p.idcolor
        WHERE p.idcolor <> 1
        ORDER BY p.id";
$productos = $db->query($sql)->fetchAll();

/** Normaliza un texto: minusculas, sin acentos, espacios simples. */
function normalizar(string $texto): string
{
    $texto = mb_strtolower(trim($texto), 'UTF-8');
    $texto = strtr($texto, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
    ]);
    return preg_replace('/\s+/u', ' ', $texto) ?? $texto;
}

/** Devuelve las formas en que puede aparecer un color en el nombre. */
function variantesColor(string $color): array
{
    $base = normalizar($color);
    $formas = [$base];

    // Blanco/Blanca, Negro/Negra, Rosado/Rosada, Plateado/Plateada...
    if (str_ends_with($base, 'o')) {
        $formas[] = substr($base, 0, -1) . 'a';
    } elseif (str_ends_with($base, 'a')) {
        $formas[] = substr($base, 0, -1) . 'o';
    }

    return array_unique($formas);
}

/** Quita del nombre las apariciones del color y normaliza el resto. */
function claveNombre(string $nombre, string $color): string
{
    $texto = normalizar($nombre);
    foreach (variantesColor($color) as $forma) {
        $texto = preg_replace('/\b' . preg_quote($forma, '/') . '\b/u', ' ', $texto) ?? $texto;
    }
    $texto = preg_replace('/\s+/u', ' ', $texto) ?? $texto;
    return trim($texto, " \t.-_");
}

$grupos = [];
foreach ($productos as $p) {
    $clave = claveNombre((string) $p['nombre'], (string) $p['color'])
        . '|' . $p['idmarca']
        . '|' . $p['idcategoria']
        . '|' . $p['idmodelo'];

    if (!isset($grupos[$clave])) {
        $grupos[$clave] = [];
    }
    $grupos[$clave][] = $p;
}

$planes = [];
$omitidos = [];

foreach ($grupos as $clave => $miembros) {
    if (count($miembros) < 2) {
        continue;
    }

    $colores = [];
    $yaAgrupado = false;
    foreach ($miembros as $m) {
        $colores[(int) $m['idcolor']] = true;
        if ($m['producto_base_id'] !== null) {
            $yaAgrupado = true;
        }
    }

    if (count($colores) !== count($miembros) || $yaAgrupado) {
        $omitidos[$clave] = $miembros;
        continue;
    }

    $baseId = (int) $miembros[0]['id'];
    foreach ($miembros as $m) {
        $planes[] = [
            'id'    => (int) $m['id'],
            'base'  => $baseId,
            'nombre'=> $m['nombre'],
            'color' => $m['color'],
        ];
    }
}

$totalVariantes = 0;
foreach ($planes as $plan) {
    if ($plan['id'] !== $plan['base']) {
        $totalVariantes++;
    }
}

echo $aplicar ? "== APLICANDO ==\n" : "== SIMULACION (usa --apply para escribir) ==\n";
echo "Grupos detectados: " . count($planes) . " productos en " . (count($planes) - $totalVariantes) . " grupos\n";
echo "Variantes a enlazar: {$totalVariantes}\n\n";

foreach ($planes as $plan) {
    $rol = $plan['id'] === $plan['base'] ? 'BASE ' : 'VARI ';
    echo sprintf(
        "%s #%-5d %-45s color=%-12s base=%d\n",
        $rol,
        $plan['id'],
        mb_substr((string) $plan['nombre'], 0, 45),
        (string) $plan['color'],
        $plan['base']
    );
}

if ($omitidos) {
    echo "\nGrupos omitidos (colores repetidos o ya agrupados): " . count($omitidos) . "\n";
    foreach ($omitidos as $clave => $miembros) {
        echo "  - {$clave}: " . implode(', ', array_map(
            static fn(array $m): string => '#' . $m['id'] . ' ' . $m['nombre'],
            $miembros
        )) . "\n";
    }
}

if (!$aplicar) {
    echo "\nSin cambios. Ejecuta con --apply para guardar.\n";
    exit(0);
}

$upd = $db->prepare("UPDATE productos SET producto_base_id = :base WHERE id = :id AND producto_base_id IS NULL");
$db->beginTransaction();
try {
    $cambios = 0;
    foreach ($planes as $plan) {
        if ($plan['id'] === $plan['base']) {
            continue;
        }
        $upd->execute([':base' => $plan['base'], ':id' => $plan['id']]);
        $cambios += $upd->rowCount();
    }
    $db->commit();
    echo "\nFilas actualizadas: {$cambios}\n";
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
