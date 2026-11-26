<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class TasaCambio
{
    private const MONEDAS_RESUMEN = ['USD', 'EUR', 'USDT', 'AJU'];

    public static function obtenerTodas(array $f = []): array
    {
        $db = Database::conectar();
        $where = [];
        $params = [];

        if (!empty($f['moneda_base'])) {
            $where[] = 't.moneda_base = :moneda_base';
            $params[':moneda_base'] = strtoupper(trim((string) $f['moneda_base']));
        }
        if (!empty($f['fuente'])) {
            $where[] = 't.fuente = :fuente';
            $params[':fuente'] = trim((string) $f['fuente']);
        }
        if (!empty($f['desde'])) {
            $where[] = 'DATE(t.vigente_desde) >= :desde';
            $params[':desde'] = $f['desde'];
        }
        if (!empty($f['hasta'])) {
            $where[] = 'DATE(t.vigente_desde) <= :hasta';
            $params[':hasta'] = $f['hasta'];
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT t.id, t.moneda, t.moneda_base, t.tasa, t.fuente, t.vigente_desde, t.created_at, t.updated_at
                FROM tasas_cambio t
                {$whereSql}
                ORDER BY t.vigente_desde DESC, t.id DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function resumen(): array
    {
        $db = Database::conectar();
        $hoy = (new DateTime('now'))->format('Y-m-d');
        $resultado = [];

        foreach (self::MONEDAS_RESUMEN as $monedaBase) {
            $stmt = $db->prepare(
                "SELECT id, moneda, moneda_base, tasa, fuente, vigente_desde, created_at
                 FROM tasas_cambio
                 WHERE moneda = 'VES' AND moneda_base = :base
                 ORDER BY vigente_desde DESC, id DESC
                 LIMIT 1"
            );
            $stmt->execute([':base' => $monedaBase]);
            $fila = $stmt->fetch();

            if ($fila) {
                $fechaVigente = substr((string) $fila['vigente_desde'], 0, 10);
                $resultado[] = [
                    'moneda' => $fila['moneda_base'],
                    'tasa' => (float) $fila['tasa'],
                    'fuente' => $fila['fuente'],
                    'vigente_desde' => $fila['vigente_desde'],
                    'es_del_dia' => $fechaVigente === $hoy,
                ];
            } else {
                $resultado[] = [
                    'moneda' => $monedaBase,
                    'tasa' => null,
                    'fuente' => null,
                    'vigente_desde' => null,
                    'es_del_dia' => false,
                ];
            }
        }

        return $resultado;
    }

    public static function obtenerPorId(int $id): ?array
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT id, moneda, moneda_base, tasa, fuente, vigente_desde, created_at, updated_at
             FROM tasas_cambio WHERE id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public static function crear(array $datos): int
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "INSERT INTO tasas_cambio (moneda, moneda_base, tasa, fuente, vigente_desde)
             VALUES (:moneda, :moneda_base, :tasa, :fuente, :vigente_desde)"
        );
        $stmt->execute([
            ':moneda' => strtoupper(trim((string) ($datos['moneda'] ?? 'VES'))),
            ':moneda_base' => strtoupper(trim((string) $datos['moneda_base'])),
            ':tasa' => (float) $datos['tasa'],
            ':fuente' => trim((string) ($datos['fuente'] ?? 'manual')),
            ':vigente_desde' => $datos['vigente_desde'],
        ]);
        return (int) $db->lastInsertId();
    }

    public static function actualizar(int $id, array $datos): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "UPDATE tasas_cambio
             SET moneda = :moneda, moneda_base = :moneda_base, tasa = :tasa, fuente = :fuente, vigente_desde = :vigente_desde
             WHERE id = :id"
        );
        return $stmt->execute([
            ':id' => $id,
            ':moneda' => strtoupper(trim((string) ($datos['moneda'] ?? 'VES'))),
            ':moneda_base' => strtoupper(trim((string) $datos['moneda_base'])),
            ':tasa' => (float) $datos['tasa'],
            ':fuente' => trim((string) ($datos['fuente'] ?? 'manual')),
            ':vigente_desde' => $datos['vigente_desde'],
        ]);
    }

    public static function eliminar(int $id): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare("DELETE FROM tasas_cambio WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    private static function tieneTasaDelDia(string $base, string $fecha): bool
    {
        $db = Database::conectar();
        $stmt = $db->prepare(
            "SELECT 1 FROM tasas_cambio WHERE moneda='VES' AND moneda_base=:base AND DATE(vigente_desde)=:f LIMIT 1"
        );
        $stmt->execute([':base' => $base, ':f' => $fecha]);
        return (bool) $stmt->fetchColumn();
    }

    private static function crearSiFalta(string $base, float $tasa, string $fuente, string $fecha): string
    {
        if (self::tieneTasaDelDia($base, $fecha)) return 'omitida';
        self::crear([
            'moneda' => 'VES',
            'moneda_base' => $base,
            'tasa' => $tasa,
            'fuente' => $fuente,
            'vigente_desde' => $fecha . ' 00:00:00',
        ]);
        return 'creada';
    }

    private static function fetchJson(string $url): array
    {
        $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true, 'header' => "Accept: application/json\r\n"]]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false && function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
            $raw = curl_exec($ch);
            curl_close($ch);
        }
        if ($raw === false || $raw === null || $raw === '') throw new RuntimeException('No se pudo consultar ' . $url);
        $data = json_decode($raw, true);
        if (!is_array($data)) throw new RuntimeException('Respuesta inválida de ' . $url);
        return $data;
    }

    private static function sincronizarBcv(string $fecha): array
    {
        $res = ['fuente' => 'bcv', 'creadas' => [], 'omitidas' => [], 'errores' => []];
        try {
            $data = self::fetchJson('https://bcv.today/api/v1/rate.json');
        } catch (Throwable $e) {
            $res['errores'][] = 'bcv: ' . $e->getMessage();
            return $res;
        }
        $effective = substr((string) ($data['effective_date'] ?? ''), 0, 10);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $effective)) {
            $res['errores'][] = 'bcv: effective_date inválida';
            return $res;
        }
        if ($effective !== $fecha) {
            $res['omitidas'][] = "USD/EUR: fecha fuente $effective != $fecha";
            return $res;
        }
        foreach (['USD', 'EUR'] as $base) {
            $raw = $data[$base] ?? null;
            if ($raw === null || $raw === '') { $res['errores'][] = "bcv: falta $base"; continue; }
            $tasa = round((float) $raw, 2);
            if ($tasa <= 0) { $res['errores'][] = "bcv: $base inválida"; continue; }
            $estado = self::crearSiFalta($base, $tasa, 'bcv', $effective);
            $res[$estado === 'creada' ? 'creadas' : 'omitidas'][] = $base;
        }
        return $res;
    }

    private static function sincronizarAlCambio(string $fecha): array
    {
        $res = ['fuente' => 'alcambio', 'creadas' => [], 'omitidas' => [], 'errores' => []];
        try {
            $body = json_encode([
                'query' => 'query { getCountryConversions(payload:{countryCode:"VE"}) { baseCurrency{code} conversionRates { baseValue rateValue official type rateCurrency{code} } } }'
            ], JSON_UNESCAPED_UNICODE);
            $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 8, 'ignore_errors' => true, 'header' => "Content-Type: application/json\r\nAccept: application/json\r\n", 'content' => $body]]);
            $raw = @file_get_contents('https://api.alcambio.app/graphql', false, $ctx);
            if ($raw === false && function_exists('curl_init')) {
                $ch = curl_init('https://api.alcambio.app/graphql');
                curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_TIMEOUT => 8, CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json']]);
                $raw = curl_exec($ch);
                curl_close($ch);
            }
            if ($raw === false || $raw === '') throw new RuntimeException('Sin respuesta de Al Cambio');
            $data = json_decode($raw, true);
            $rates = $data['data']['getCountryConversions']['conversionRates'] ?? null;
            if (!is_array($rates)) throw new RuntimeException('Respuesta inválida de Al Cambio');
        } catch (Throwable $e) {
            $res['errores'][] = 'alcambio: ' . $e->getMessage();
            return $res;
        }

        $encontrados = ['USD' => null, 'EUR' => null];
        foreach ($rates as $r) {
            $code = strtoupper((string) ($r['rateCurrency']['code'] ?? ''));
            $type = strtoupper((string) ($r['type'] ?? ''));
            $official = (bool) ($r['official'] ?? false);
            $baseValue = (float) ($r['baseValue'] ?? 0);
            $rateValue = (float) ($r['rateValue'] ?? 0);
            $valor = $baseValue > 0 ? $baseValue : ($rateValue > 0 ? $rateValue : 0);
            if ($valor <= 0) continue;

            // USD BCV = OTHER/USD oficial; EUR = OTHER/EUR oficial. USDT se toma de usdt.com.ve (fuente paez).
            if ($code === 'USD' && $type === 'OTHER' && $official) {
                $encontrados['USD'] = $valor;
            } elseif ($code === 'EUR' && $type === 'OTHER' && $official) {
                $encontrados['EUR'] = $valor;
            }
        }

        foreach (['USD', 'EUR'] as $base) {
            if (self::tieneTasaDelDia($base, $fecha)) { $res['omitidas'][] = $base; continue; }
            $valor = $encontrados[$base] ?? null;
            if (!$valor) { $res['errores'][] = "alcambio: no se encontró $base"; continue; }
            $tasa = round((float) $valor, 2);
            if ($tasa <= 0) { $res['errores'][] = "alcambio: $base inválida"; continue; }
            $estado = self::crearSiFalta($base, $tasa, 'bcv', $fecha);
            $res[$estado === 'creada' ? 'creadas' : 'omitidas'][] = $base;
        }
        return $res;
    }

    private static function sincronizarUsdt(string $fecha): array
    {
        // Misma fuente que usa paez: usdt.com.ve
        $res = ['fuente' => 'usdt', 'creadas' => [], 'omitidas' => [], 'errores' => []];
        if (self::tieneTasaDelDia('USDT', $fecha)) { $res['omitidas'][] = 'USDT'; return $res; }
        try {
            $data = self::fetchJson('https://www.usdt.com.ve/api/v1/rates/current');
        } catch (Throwable $e) {
            $res['errores'][] = 'usdt.com.ve: ' . $e->getMessage();
            return $res;
        }
        $payload = is_array($data['data'] ?? null) ? $data['data'] : [];
        $captured = (string) ($payload['captured_at'] ?? $data['captured_at'] ?? '');
        $fechaCaptura = substr($captured, 0, 10);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaCaptura)) {
            $res['errores'][] = 'usdt.com.ve: captured_at inválida';
            return $res;
        }
        if ($fechaCaptura !== $fecha) {
            $res['omitidas'][] = "USDT: fecha fuente $fechaCaptura != $fecha";
            return $res;
        }
        $best = is_array($payload['best'] ?? null) ? $payload['best'] : [];
        $binance = is_array($payload['binance'] ?? null) ? $payload['binance'] : [];
        $raw = $best['buy_rate'] ?? $binance['buy_rate'] ?? null;
        $tasa = round((float) ($raw ?? 0), 2);
        if ($tasa <= 0) { $res['errores'][] = 'usdt.com.ve: tasa USDT inválida'; return $res; }
        $estado = self::crearSiFalta('USDT', $tasa, 'usdt', $fechaCaptura);
        $res[$estado === 'creada' ? 'creadas' : 'omitidas'][] = 'USDT';
        return $res;
    }

    private static function asegurarAjuDelDia(string $fecha): string
    {
        if (self::tieneTasaDelDia('AJU', $fecha)) return 'existente';
        $db = Database::conectar();

        // Primera vez en el día: tomar valor del Euro.
        $stmt = $db->prepare(
            "SELECT tasa FROM tasas_cambio WHERE moneda='VES' AND moneda_base='EUR' AND DATE(vigente_desde) <= :f ORDER BY vigente_desde DESC, id DESC LIMIT 1"
        );
        $stmt->execute([':f' => $fecha]);
        $eur = $stmt->fetchColumn();
        if ($eur) {
            self::crearSiFalta('AJU', (float) $eur, 'ajustada', $fecha);
            return 'creada_desde_eur';
        }

        // Respaldo: si no hay EUR, usar USD.
        $stmt = $db->prepare(
            "SELECT tasa FROM tasas_cambio WHERE moneda='VES' AND moneda_base='USD' AND DATE(vigente_desde) <= :f ORDER BY vigente_desde DESC, id DESC LIMIT 1"
        );
        $stmt->execute([':f' => $fecha]);
        $usd = $stmt->fetchColumn();
        if ($usd) {
            self::crearSiFalta('AJU', (float) $usd, 'ajustada', $fecha);
            return 'creada_desde_usd';
        }
        return 'omitida';
    }

    public static function sincronizar(?string $fecha = null): array
    {
        $fecha = $fecha ?: (new DateTime('now'))->format('Y-m-d');
        $fuentes = [];

        // Primero BCV para USD/EUR
        $bcv = self::sincronizarBcv($fecha);
        $fuentes[] = $bcv;

        $faltan = [];
        foreach (['USD', 'EUR', 'USDT'] as $b) {
            if (!self::tieneTasaDelDia($b, $fecha)) $faltan[] = $b;
        }
        // USDT desde fuente paez (usdt.com.ve)
        if (!self::tieneTasaDelDia('USDT', $fecha)) {
            $fuentes[] = self::sincronizarUsdt($fecha);
        }
        // Si aún falta algo, intentar Al Cambio
        $faltan = [];
        foreach (['USD', 'EUR', 'USDT'] as $b) {
            if (!self::tieneTasaDelDia($b, $fecha)) $faltan[] = $b;
        }
        if (!empty($faltan)) {
            $fuentes[] = self::sincronizarAlCambio($fecha);
        }

        $resultado = ['fecha' => $fecha, 'fuentes' => $fuentes];
        $resultado['aju'] = self::asegurarAjuDelDia($fecha);
        return $resultado;
    }

    public static function asegurarDelDia(?string $fecha = null, bool $forzar = false): ?array
    {
        $fecha = $fecha ?: (new DateTime('now'))->format('Y-m-d');
        $hoy = (new DateTime('now'))->format('Y-m-d');
        $faltantesExt = [];
        foreach (['USD', 'EUR', 'USDT'] as $b) {
            if (!self::tieneTasaDelDia($b, $fecha)) $faltantesExt[] = $b;
        }
        $faltaAju = !self::tieneTasaDelDia('AJU', $fecha);
        if (!$faltantesExt && !$faltaAju) return null;

        $cacheFile = sys_get_temp_dir() . '/mias_tasas_sync_' . $fecha . '.flag';
        $yaIntentado = is_file($cacheFile);
        $puedeSyncExt = !empty($faltantesExt) && ($forzar || $fecha !== $hoy || !$yaIntentado);
        if (!$puedeSyncExt && !$faltaAju) return null;

        $resultado = ['fecha' => $fecha, 'fuentes' => []];
        if ($puedeSyncExt) {
            $resultado['fuentes'][] = self::sincronizarBcv($fecha);
            if (!self::tieneTasaDelDia('USDT', $fecha)) {
                $resultado['fuentes'][] = self::sincronizarUsdt($fecha);
            }
            $faltan = [];
            foreach (['USD', 'EUR', 'USDT'] as $b) {
                if (!self::tieneTasaDelDia($b, $fecha)) $faltan[] = $b;
            }
            if (!empty($faltan)) {
                $resultado['fuentes'][] = self::sincronizarAlCambio($fecha);
            }
            if (!$forzar && $fecha === $hoy) @file_put_contents($cacheFile, (string) time());
        }
        $resultado['aju'] = self::asegurarAjuDelDia($fecha);
        return $resultado;
    }
}
