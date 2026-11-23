<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';

class WhatsAppController
{
    private function baseUrl(): string
    {
        $url = getenv('WHATSAPP_WS_URL');
        if (!$url || trim($url) === '') {
            $url = 'http://127.0.0.1:3000';
        }
        return rtrim(trim($url), '/');
    }

    private function timeout(): int
    {
        $t = getenv('WHATSAPP_TIMEOUT');
        if ($t === false || $t === '' || !is_numeric($t)) {
            return 20;
        }
        $n = (int) $t;
        return $n > 0 ? $n : 20;
    }

    private function request(string $path, string $method = 'GET', ?array $payload = null): array
    {
        $base = $this->baseUrl();
        $url = $base . $path;
        $method = strtoupper($method);

        $ch = curl_init($url);
        $headers = ['Accept: application/json'];
        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => $this->timeout(),
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER => $headers,
        ];

        if ($payload !== null) {
            $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                $json = '{}';
            }
            $options[CURLOPT_POSTFIELDS] = $json;
            $headers[] = 'Content-Type: application/json';
            $options[CURLOPT_HTTPHEADER] = $headers;
        }

        curl_setopt_array($ch, $options);
        $body = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0 || $body === false) {
            throw new RuntimeException(
                'No se pudo conectar con el servidor de WhatsApp. Verifica que el servicio ws/ esté en ejecución. ' .
                ($error ? "Detalle: {$error}" : '')
            );
        }

        $decoded = json_decode((string) $body, true);
        if (!is_array($decoded)) {
            $decoded = ['raw' => (string) $body];
        }

        return ['status' => $status, 'data' => $decoded];
    }

    public function estado(): void
    {
        try {
            $res = $this->request('/api/whatsapp/status', 'GET');
            if ($res['status'] >= 400) {
                $msg = $res['data']['error'] ?? ('Error HTTP ' . $res['status']);
                responder(false, $msg, $res['status']);
            }
            responder(true, $res['data'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 503);
        }
    }

    public function enviar(): void
    {
        try {
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!is_array($datos)) {
                responder(false, 'Cuerpo de petición inválido. Se espera JSON', 400);
            }
            $to = isset($datos['to']) ? trim((string) $datos['to']) : '';
            $message = isset($datos['message']) ? (string) $datos['message'] : '';
            if ($to === '' || trim($message) === '') {
                responder(false, 'Debes indicar "to" y "message"', 400);
            }
            $res = $this->request('/api/whatsapp/send', 'POST', ['to' => $to, 'message' => $message]);
            $ok = ($res['status'] >= 200 && $res['status'] < 300) && (!isset($res['data']['success']) || $res['data']['success'] === true);
            if (!$ok) {
                $msg = $res['data']['error'] ?? ('Error HTTP ' . $res['status']);
                responder(false, $msg, $res['status'] >= 400 ? $res['status'] : 400);
            }
            responder(true, $res['data'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 503);
        }
    }

    public function reiniciar(): void
    {
        try {
            $res = $this->request('/api/whatsapp/restart', 'POST');
            if ($res['status'] >= 400) {
                $msg = $res['data']['error'] ?? ('Error HTTP ' . $res['status']);
                responder(false, $msg, $res['status']);
            }
            responder(true, $res['data'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 503);
        }
    }

    public function cerrarSesion(): void
    {
        try {
            $res = $this->request('/api/whatsapp/logout', 'POST');
            if ($res['status'] >= 400) {
                $msg = $res['data']['error'] ?? ('Error HTTP ' . $res['status']);
                responder(false, $msg, $res['status']);
            }
            responder(true, $res['data'], 200);
        } catch (Throwable $e) {
            responder(false, $e->getMessage(), 503);
        }
    }
}
