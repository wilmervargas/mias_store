# Inicia el servicio WhatsApp Web (Baileys) de Mia's Store
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'backend')
php -S localhost:8000
