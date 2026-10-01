$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

function Test-ApiHealth {
  try {
    Invoke-RestMethod -Uri 'http://localhost:4000/api/health' -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

# Atlas does not need MongoDB Compass or the local MongoDB Windows service.
# Start the local service only when backend/.env explicitly uses a local URI.
$backendEnvPath = Join-Path $backendPath '.env'
$mongoUriLine = Get-Content -LiteralPath $backendEnvPath | Where-Object { $_ -match '^\s*MONGODB_URI\s*=' } | Select-Object -First 1
$mongoUri = if ($mongoUriLine) { ($mongoUriLine -split '=', 2)[1].Trim() } else { '' }
$usesLocalMongo = $mongoUri -match '^mongodb://(localhost|127\.0\.0\.1)'
if ($usesLocalMongo) {
  $mongoService = Get-Service -Name 'MongoDB' -ErrorAction Stop
  if ($mongoService.Status -ne 'Running') {
    Start-Service -Name 'MongoDB'
    $mongoService.WaitForStatus('Running', [TimeSpan]::FromSeconds(15))
  }
}

# Prefer a private Wi-Fi/LAN address. This is the address used by Expo Go on a phone.
$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and $_.IPAddress -ne '127.0.0.1' } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $lanIp) {
  throw 'Không tìm thấy địa chỉ IPv4 mạng nội bộ. Hãy kết nối máy tính và điện thoại vào cùng Wi-Fi.'
}

Set-Content -LiteralPath (Join-Path $frontendPath '.env') -Value "EXPO_PUBLIC_API_URL=http://$lanIp`:4000/api" -Encoding utf8

if (-not (Test-ApiHealth)) {
  Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory $backendPath -WindowStyle Hidden
  $apiReady = $false
  for ($attempt = 1; $attempt -le 10; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-ApiHealth) { $apiReady = $true; break }
  }
  if (-not $apiReady) {
    throw 'Backend không khởi động được. Kiểm tra backend/.env và MongoDB service.'
  }
}

$databaseLabel = if ($usesLocalMongo) { 'MongoDB local' } else { 'MongoDB Atlas' }
Write-Host "$databaseLabel và PSIFU API đang sẵn sàng. QR sẽ dùng API: http://$lanIp`:4000/api" -ForegroundColor Green
Set-Location $frontendPath
npx expo start --lan -c
