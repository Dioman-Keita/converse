# Starts Converse with a Quick Tunnel and prints its public address.
#   .\start.ps1            start (or restart) the stack
#   .\start.ps1 -Build     rebuild the app image first (after a git pull)
param([switch]$Build)

# Not "Stop": Windows PowerShell 5.1 would treat Docker's normal progress output
# on stderr as a fatal error. Failures are checked through exit codes instead.
Set-Location $PSScriptRoot

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Start Docker Desktop, then run this script again." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example: set DB_PASSWORD in it, then run this script again." -ForegroundColor Yellow
    exit 1
}

$upArgs = @("compose", "--profile", "quick-tunnel", "up", "-d")
if ($Build) { $upArgs += "--build" }
& docker @upArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Waiting for the public address..." -ForegroundColor DarkGray
$url = $null
for ($i = 0; $i -lt 60 -and -not $url; $i++) {
    # Ask cloudflared (through the app container) for the current address.
    $json = docker compose exec -T app node -e "fetch('http://quick-tunnel:20241/quicktunnel').then(r=>r.text()).then(console.log).catch(()=>{})" 2>$null
    if ($json -match '"hostname":"([^"]+)"') { $url = "https://$($Matches[1])" }
    else { Start-Sleep -Seconds 2 }
}

if (-not $url) {
    Write-Host "The tunnel didn't report an address yet. Check: docker compose logs quick-tunnel" -ForegroundColor Yellow
    exit 1
}

$line = "=" * ($url.Length + 6)
Write-Host ""
Write-Host "  $line" -ForegroundColor Green
Write-Host "     $url" -ForegroundColor Green
Write-Host "  $line" -ForegroundColor Green
Write-Host ""
Write-Host "  Converse is online. Share this address, or paste it into the Android app."
Write-Host "  Local: http://localhost:3000   Logs: docker compose logs -f app"
Write-Host ""
