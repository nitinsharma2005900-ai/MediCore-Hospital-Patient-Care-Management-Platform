param([switch]$Development)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (!(Test-Path -LiteralPath '.env')) { throw 'Run setup-local.ps1 or create .env first.' }
foreach($line in Get-Content -LiteralPath '.env') {
 if($line -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1],$matches[2].Trim('"'),'Process') }
}
$env:NODE_ENV=if($Development){'development'}else{'production'}
$runtime=Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$servicesPath=Join-Path $runtime 'services.json'
$services=if(Test-Path -LiteralPath $servicesPath){@(Get-Content -LiteralPath $servicesPath -Raw | ConvertFrom-Json)}else{@()}
function Start-MediCoreService($serviceName,$port,$executable,$arguments) {
 if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { Write-Output "$serviceName already listening on $port"; return }
 $process=Start-Process -FilePath $executable -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime "$serviceName.log") -RedirectStandardError (Join-Path $runtime "$serviceName-error.log")
 $script:services=@($script:services | Where-Object {$_.name -ne $serviceName})+@{name=$serviceName;pid=$process.Id;port=$port}
}
$node=(Get-Command node.exe).Source
Start-MediCoreService 'backend' 4010 $node @('apps/backend/dist/server.js')
$python=if(Get-Command py.exe -ErrorAction SilentlyContinue){(& py.exe -3.13 -c 'import sys; print(sys.executable)').Trim()}else{(Get-Command python.exe).Source}
if(!$python -or !(Test-Path -LiteralPath $python)){throw 'Python 3.13 is required. Install it and the analytics dependencies first.'}
Start-MediCoreService 'analytics' 8010 $python @('-m','uvicorn','main:app','--app-dir','apps/analytics-service','--host','127.0.0.1','--port','8010')
if($Development){
 Start-MediCoreService 'frontend' 3010 $node @('node_modules/next/dist/bin/next','dev','apps/frontend','-p','3010')
}else{
 Start-MediCoreService 'frontend' 3010 $node @('scripts/start-frontend.cjs','--port','3010')
}
$services|ConvertTo-Json|Set-Content -LiteralPath $servicesPath
Write-Output 'Frontend http://localhost:3010 | API http://localhost:4010/api/v1 | Analytics http://localhost:8010 | Swagger http://localhost:4010/api-docs/'
