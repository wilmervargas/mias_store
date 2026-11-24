# Inicia el servicio WhatsApp Web (Baileys) de Mia's Store
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'dashboard')
if (!(Test-Path 'node_modules')) {
  Write-Host 'Instalando dependencias para dashboard (npm install)...'
  npm install
}
npm run dev
