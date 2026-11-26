param(
  [string]$PostgresBin = 'C:\Users\amits\Documents\FinCore\.tools\pgsql\bin',
  [string]$RedisExe = 'C:\Users\amits\Documents\FinCore\.tools\redis\Redis-8.10.3-Windows-x64-cygwin-with-Service\redis-server.exe'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$runtime = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
if (!(Test-Path -LiteralPath '.env')) {
  $dbSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  $accessSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  $refreshSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  @"
NODE_ENV=development
PORT=4010
DATABASE_URL=postgresql://medicore:$dbSecret@127.0.0.1:5546/medicore
REDIS_URL=redis://127.0.0.1:6386
JWT_ACCESS_SECRET=$accessSecret
JWT_REFRESH_SECRET=$refreshSecret
CORS_ORIGIN=http://localhost:3010,http://127.0.0.1:3010
BACKEND_BASE_URL=http://127.0.0.1:4010
ANALYTICS_SERVICE_URL=http://127.0.0.1:8010
SEED_DEMO=true
RUN_WORKER=true
"@ | Set-Content -LiteralPath '.env' -Encoding UTF8
}
$dbLine = Get-Content -LiteralPath '.env' | Where-Object { $_ -like 'DATABASE_URL=*' }
$dbUri = [uri]($dbLine -replace '^DATABASE_URL=', '')
$dbPassword = ($dbUri.UserInfo -split ':', 2)[1]
$dataPath = Join-Path $runtime 'postgres'
if (!(Test-Path -LiteralPath (Join-Path $dataPath 'PG_VERSION'))) {
  $passwordPath = Join-Path $runtime 'init-password'
  try {
    [System.IO.File]::WriteAllText($passwordPath, $dbPassword)
    & (Join-Path $PostgresBin 'initdb.exe') -D $dataPath -U medicore -A scram-sha-256 --pwfile=$passwordPath --encoding=UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  } finally { if (Test-Path -LiteralPath $passwordPath) { Remove-Item -LiteralPath $passwordPath } }
}
if (!(Get-NetTCPConnection -State Listen -LocalPort 5546 -ErrorAction SilentlyContinue)) {
  & (Join-Path $PostgresBin 'pg_ctl.exe') start -D $dataPath -l (Join-Path $runtime 'postgres.log') -o '-h 127.0.0.1 -p 5546' -w
}
$env:PGPASSWORD = $dbPassword
try {
  $exists = & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p 5546 -U medicore -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='medicore'"
  if ($exists -ne '1') { & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p 5546 -U medicore medicore }
} finally { Remove-Item Env:PGPASSWORD }
if (!(Get-NetTCPConnection -State Listen -LocalPort 6386 -ErrorAction SilentlyContinue)) {
  $redisDir = Join-Path $runtime 'redis'
  New-Item -ItemType Directory -Path $redisDir -Force | Out-Null
  Start-Process -FilePath $RedisExe -ArgumentList @('--bind','127.0.0.1','--port','6386','--appendonly','yes','--dir',('"' + $redisDir + '"')) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'redis.log') -RedirectStandardError (Join-Path $runtime 'redis-error.log')
}
Write-Output 'MediCore PostgreSQL: 127.0.0.1:5546; Redis: 127.0.0.1:6386. Secrets are stored only in ignored .env.'
