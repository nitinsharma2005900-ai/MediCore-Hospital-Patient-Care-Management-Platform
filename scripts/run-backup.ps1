param([string]$OutputFile = '.runtime\medicore-backup.dump', [string]$PostgresBin = 'C:\Users\amits\Documents\FinCore\.tools\pgsql\bin')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$line=Get-Content -LiteralPath (Join-Path $projectRoot '.env') | Where-Object { $_ -like 'DATABASE_URL=*' }
$databaseUri=[uri]($line -replace '^DATABASE_URL=','')
$env:PGPASSWORD=($databaseUri.UserInfo -split ':',2)[1]
try {
 & (Join-Path $PostgresBin 'pg_dump.exe') -h $databaseUri.Host -p $databaseUri.Port -U ($databaseUri.UserInfo -split ':',2)[0] -Fc --no-owner --no-acl -f $OutputFile $databaseUri.AbsolutePath.Trim('/')
 if($LASTEXITCODE -ne 0){throw 'pg_dump failed'}
 (Get-FileHash -LiteralPath $OutputFile -Algorithm SHA256).Hash | Set-Content -LiteralPath ($OutputFile+'.sha256')
 Write-Output "Backup created: $OutputFile"
} finally {Remove-Item Env:PGPASSWORD}
