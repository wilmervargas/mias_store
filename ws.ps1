# Inicia el servicio WhatsApp Web (Baileys) de Mia's Store
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'ws\server')
if (!(Test-Path 'node_modules')) {
  Write-Host 'Instalando dependencias de ws/server (npm install)...'
  npm install
}
npm start
