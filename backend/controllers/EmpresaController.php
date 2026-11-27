<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../core/Authz.php';
require_once __DIR__ . '/../models/Empresa.php';

class EmpresaController
{
    /** GET /?url=empresa */
    public function mostrar(): void
    {
        try {
            $empresa = Empresa::obtener();
            $empresa = $this->enriquecerLogo($empresa);
            responder(true, $empresa, 200);
        } catch (Throwable $e) {
            responder(false, 'Error al obtener empresa: ' . $e->getMessage(), 500);
        }
    }

    /** PUT/POST /?url=empresa */
    public function guardar(): void
    {
        try {
            Authz::requiere('empresa.editar');
            $datos = cuerpoJson();
            if (empty($datos)) {
                // Permitir form-data simple
                $datos = $_POST;
            }
            $empresa = Empresa::guardar(is_array($datos) ? $datos : []);
            $empresa = $this->enriquecerLogo($empresa);
            responder(true, $empresa, 200);
        } catch (InvalidArgumentException $e) {
            responder(false, $e->getMessage(), 422);
        } catch (Throwable $e) {
            responder(false, 'Error al guardar empresa: ' . $e->getMessage(), 500);
        }
    }

    /** POST /?url=empresa/logo */
    public function subirLogo(): void
    {
        try {
            Authz::requiere('empresa.editar');
            if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
                responder(false, 'No se recibió ningún logo válido.', 400);
            }
            $archivo = $_FILES['logo'];

            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = (string) $finfo->file($archivo['tmp_name']);
            if (strpos($mime, 'image/') !== 0) {
                responder(false, 'El archivo seleccionado debe ser una imagen.', 400);
            }
            if ($archivo['size'] > 5 * 1024 * 1024) {
                responder(false, 'El logo supera el límite de 5 MB.', 400);
            }

            $extPorMime = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                'image/svg+xml' => 'svg',
                'image/bmp' => 'bmp',
                'image/x-icon' => 'ico',
                'image/vnd.microsoft.icon' => 'ico',
                'image/avif' => 'avif',
            ];
            $extension = $extPorMime[$mime] ?? '';
            if ($extension === '') {
                $nombreOriginal = (string) ($archivo['name'] ?? '');
                $ext = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
                $extension = preg_match('/^[a-z0-9]{2,5}$/', $ext) ? $ext : 'img';
            }
            $nombreUnico = 'empresa_logo_' . bin2hex(random_bytes(6)) . '.' . $extension;
            $dir = __DIR__ . '/../imagenes/';
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
            $destino = $dir . $nombreUnico;
            if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
                responder(false, 'No se pudo guardar el logo en el servidor.', 500);
            }

            $actual = Empresa::obtener();
            $anterior = trim((string) ($actual['logo'] ?? ''));
            $empresa = Empresa::guardar(['logo' => $nombreUnico]);
            $this::eliminarArchivoLogo($anterior, $nombreUnico);

            $empresa = $this->enriquecerLogo($empresa);
            responder(true, $empresa, 200);
        } catch (InvalidArgumentException $e) {
            responder(false, $e->getMessage(), 422);
        } catch (Throwable $e) {
            responder(false, 'Error al subir logo: ' . $e->getMessage(), 500);
        }
    }

    /** DELETE /?url=empresa/logo */
    public function eliminarLogo(): void
    {
        try {
            Authz::requiere('empresa.editar');
            $actual = Empresa::obtener();
            $anterior = trim((string) ($actual['logo'] ?? ''));
            $empresa = Empresa::guardar(['logo' => '']);
            $this::eliminarArchivoLogo($anterior, '');
            $empresa = $this->enriquecerLogo($empresa);
            responder(true, $empresa, 200);
        } catch (Throwable $e) {
            responder(false, 'Error al eliminar logo: ' . $e->getMessage(), 500);
        }
    }

    private function logoUrl(string $logo): ?string
    {
        $logo = trim($logo);
        if ($logo === '') return null;
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        return $scheme . '://' . $host . '/imagenes/' . rawurlencode($logo);
    }

    private function logoDataUrl(string $logo): ?string
    {
        $logo = trim($logo);
        if ($logo === '') return null;
        $path = __DIR__ . '/../imagenes/' . basename($logo);
        if (!is_file($path)) return null;
        $data = @file_get_contents($path);
        if ($data === false || $data === '') return null;
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($path);
        if (strpos($mime, 'image/') !== 0) $mime = 'image/png';
        return 'data:' . $mime . ';base64,' . base64_encode($data);
    }

    private function enriquecerLogo(array $empresa): array
    {
        $logo = (string) ($empresa['logo'] ?? '');
        $empresa['logo_url'] = $this->logoUrl($logo);
        $empresa['logo_data_url'] = $this->logoDataUrl($logo);
        return $empresa;
    }

    private static function eliminarArchivoLogo(string $anterior, string $nuevo): void
    {
        $anterior = trim($anterior);
        $nuevo = trim($nuevo);
        if ($anterior === '' || $anterior === $nuevo) return;
        if (!preg_match('/^empresa_logo_[a-zA-Z0-9_.-]+$/', $anterior)) return;
        $ruta = __DIR__ . '/../imagenes/' . $anterior;
        if (is_file($ruta)) {
            @unlink($ruta);
        }
    }
}
