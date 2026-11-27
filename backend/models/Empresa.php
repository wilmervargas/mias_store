<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class Empresa
{
    private const ID = 1;

    public static function obtener(): array
    {
        $db = Database::conectar();
        self::asegurarTabla($db);
        $stmt = $db->prepare('SELECT * FROM empresa WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => self::ID]);
        $fila = $stmt->fetch();

        if (!$fila) {
            return self::defaults();
        }

        return self::normalizarFila($fila);
    }

    public static function guardar(array $datos): array
    {
        $db = Database::conectar();
        self::asegurarTabla($db);

        $actual = self::obtener();
        $entrada = array_merge($actual, $datos);

        $razon = trim((string) ($entrada['razon_social'] ?? ''));
        $nombreComercial = trim((string) ($entrada['nombre_comercial'] ?? ''));
        $rif = trim((string) ($entrada['rif'] ?? ''));
        $representante = trim((string) ($entrada['representante'] ?? ''));
        $direccion = trim((string) ($entrada['direccion'] ?? ''));
        $email = trim((string) ($entrada['email'] ?? ''));
        $eslogan = trim((string) ($entrada['eslogan'] ?? ''));
        $logo = trim((string) ($entrada['logo'] ?? $actual['logo'] ?? ''));
        $monedaBase = strtoupper(trim((string) ($entrada['moneda_base'] ?? 'USD')));
        $iva = self::decimal($entrada['iva_rate'] ?? 16.00);
        $igtf = self::decimal($entrada['igtf_rate'] ?? 0.00);

        if ($razon === '') {
            throw new InvalidArgumentException('La razón social es obligatoria.');
        }
        if ($monedaBase === '' || !preg_match('/^[A-Z]{3}$/', $monedaBase)) {
            throw new InvalidArgumentException('La moneda base debe ser un código ISO de 3 letras (ej. USD).');
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('El correo de la empresa no tiene un formato válido.');
        }
        if ($iva < 0 || $iva > 100) {
            throw new InvalidArgumentException('El IVA debe estar entre 0 y 100.');
        }
        if ($igtf < 0 || $igtf > 100) {
            throw new InvalidArgumentException('El IGTF debe estar entre 0 y 100.');
        }

        $telefonos = self::normalizarTelefonos($entrada['telefonos'] ?? $actual['telefonos'] ?? []);
        // Se capturan hasta 2 teléfonos de contacto de la empresa.
        $telefonos = array_slice(array_values($telefonos), 0, 2);
        $telefonoPrincipal = $telefonos[0] ?? '';

        $sql = "INSERT INTO empresa
            (id, razon_social, nombre_comercial, rif, representante, direccion, telefono, telefonos, email, eslogan, logo, moneda_base, iva_rate, igtf_rate)
            VALUES
            (:id, :razon_social, :nombre_comercial, :rif, :representante, :direccion, :telefono, :telefonos, :email, :eslogan, :logo, :moneda_base, :iva_rate, :igtf_rate)
            ON DUPLICATE KEY UPDATE
            razon_social = VALUES(razon_social),
            nombre_comercial = VALUES(nombre_comercial),
            rif = VALUES(rif),
            representante = VALUES(representante),
            direccion = VALUES(direccion),
            telefono = VALUES(telefono),
            telefonos = VALUES(telefonos),
            email = VALUES(email),
            eslogan = VALUES(eslogan),
            logo = VALUES(logo),
            moneda_base = VALUES(moneda_base),
            iva_rate = VALUES(iva_rate),
            igtf_rate = VALUES(igtf_rate)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => self::ID,
            ':razon_social' => $razon,
            ':nombre_comercial' => $nombreComercial,
            ':rif' => $rif,
            ':representante' => $representante,
            ':direccion' => $direccion,
            ':telefono' => $telefonoPrincipal,
            ':telefonos' => json_encode(array_values($telefonos), JSON_UNESCAPED_UNICODE),
            ':email' => $email,
            ':eslogan' => $eslogan,
            ':logo' => $logo,
            ':moneda_base' => $monedaBase,
            ':iva_rate' => $iva,
            ':igtf_rate' => $igtf,
        ]);

        return self::obtener();
    }

    public static function obtenerWhatsappDefault(): string
    {
        $empresa = self::obtener();
        $telefonos = $empresa['telefonos'] ?? [];
        if (is_array($telefonos) && !empty($telefonos[0])) {
            return (string) $telefonos[0];
        }
        return (string) ($empresa['telefono'] ?? '');
    }

    private static function defaults(): array
    {
        return self::normalizarFila([
            'id' => self::ID,
            'razon_social' => '',
            'nombre_comercial' => '',
            'rif' => '',
            'representante' => '',
            'direccion' => '',
            'telefono' => '',
            'telefonos' => '[]',
            'email' => '',
            'eslogan' => '',
            'logo' => '',
            'moneda_base' => 'USD',
            'iva_rate' => '16.00',
            'igtf_rate' => '0.00',
            'created_at' => null,
            'updated_at' => null,
        ]);
    }

    private static function normalizarFila(array $fila): array
    {
        $telefonos = self::decodificarTelefonos($fila['telefonos'] ?? null);
        if (!$telefonos && !empty($fila['telefono'])) {
            $tel = self::normalizarTelefono((string) $fila['telefono']);
            if ($tel !== '') $telefonos = [$tel];
        }

        $fila['id'] = (int) ($fila['id'] ?? self::ID);
        $fila['telefonos'] = array_values($telefonos);
        $fila['telefono'] = $fila['telefonos'][0] ?? '';
        $fila['whatsapp'] = $fila['telefono']; // primer teléfono = WhatsApp por defecto
        $fila['iva_rate'] = number_format((float) ($fila['iva_rate'] ?? 16), 2, '.', '');
        $fila['igtf_rate'] = number_format((float) ($fila['igtf_rate'] ?? 0), 2, '.', '');
        $fila['moneda_base'] = strtoupper(trim((string) ($fila['moneda_base'] ?? 'USD'))) ?: 'USD';
        return $fila;
    }

    private static function normalizarTelefonos(mixed $valor): array
    {
        $items = [];
        if (is_string($valor)) {
            $dec = json_decode($valor, true);
            if (is_array($dec)) $items = $dec;
            elseif (trim($valor) !== '') $items = preg_split('/[\n,;]+/', $valor) ?: [];
        } elseif (is_array($valor)) {
            $items = $valor;
        }

        $limpios = [];
        $vistos = [];
        foreach ($items as $item) {
            $tel = self::normalizarTelefono(is_scalar($item) ? (string) $item : '');
            if ($tel === '') continue;
            if (isset($vistos[$tel])) continue;
            $vistos[$tel] = true;
            $limpios[] = $tel;
        }

        if (!empty($items) && empty($limpios)) {
            throw new InvalidArgumentException('Debes indicar teléfonos válidos con nomenclatura 58XXXXXXXXXX (ej. 584244032682).');
        }

        foreach ($limpios as $tel) {
            if (!self::esTelefonoValido($tel)) {
                throw new InvalidArgumentException("El teléfono {$tel} no cumple la nomenclatura 58XXXXXXXXXX (ej. 584244032682).");
            }
        }

        return $limpios;
    }

    private static function decodificarTelefonos(mixed $valor): array
    {
        if (is_array($valor)) return self::sanearListaTelefonos($valor);
        if (!is_string($valor) || trim($valor) === '') return [];
        $dec = json_decode($valor, true);
        if (is_array($dec)) return self::sanearListaTelefonos($dec);
        return [];
    }

    private static function sanearListaTelefonos(array $items): array
    {
        $out = [];
        foreach ($items as $item) {
            $tel = self::normalizarTelefono(is_scalar($item) ? (string) $item : '');
            if ($tel !== '' && self::esTelefonoValido($tel)) $out[] = $tel;
        }
        return array_values(array_unique($out));
    }

    private static function normalizarTelefono(string $tel): string
    {
        $tel = trim($tel);
        if ($tel === '') return '';
        // Permitir +, espacios, guiones, paréntesis en entrada; guardar solo dígitos.
        $d = preg_replace('/\D+/', '', $tel) ?? '';
        if ($d === '') return '';

        // Nomenclatura normal: 04244032682 / 0424 4032682 -> 584244032682
        if (preg_match('/^0\d{10}$/', $d)) {
            return '58' . substr($d, 1);
        }
        // Ya viene en formato internacional venezolano: 584244032682
        if (preg_match('/^58\d{10}$/', $d)) {
            return $d;
        }
        // 10 dígitos locales (4244032682) -> anteponer 58
        if (preg_match('/^\d{10}$/', $d)) {
            return '58' . $d;
        }
        return $d;
    }

    private static function esTelefonoValido(string $tel): bool
    {
        // Nomenclatura remitente/WhatsApp: 58 + 10 dígitos (ej. 584244032682)
        return (bool) preg_match('/^58\d{10}$/', $tel);
    }

    private static function decimal(mixed $valor): string
    {
        $n = is_numeric($valor) ? (float) $valor : 0.0;
        return number_format($n, 2, '.', '');
    }

    private static function asegurarTabla(PDO $db): void
    {
        $db->exec(
            "CREATE TABLE IF NOT EXISTS empresa (
                id int(11) NOT NULL DEFAULT 1,
                razon_social varchar(200) NOT NULL DEFAULT '',
                nombre_comercial varchar(200) NOT NULL DEFAULT '',
                rif varchar(30) NOT NULL DEFAULT '',
                representante varchar(150) NOT NULL DEFAULT '',
                direccion text DEFAULT NULL,
                telefono varchar(30) NOT NULL DEFAULT '',
                telefonos text DEFAULT NULL,
                email varchar(190) NOT NULL DEFAULT '',
                eslogan varchar(200) NOT NULL DEFAULT '',
                logo varchar(255) NOT NULL DEFAULT '',
                moneda_base varchar(3) NOT NULL DEFAULT 'USD',
                iva_rate decimal(5,2) NOT NULL DEFAULT 16.00,
                igtf_rate decimal(5,2) NOT NULL DEFAULT 0.00,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"
        );
    }
}
