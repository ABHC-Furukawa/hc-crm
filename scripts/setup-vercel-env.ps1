# Vercel 環境変数一括設定（要: npx vercel login && npx vercel link）
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root "vercel-import.env"

if (-not (Test-Path $envFile)) {
  Write-Error "Missing $envFile"
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $idx = $_.IndexOf('=')
  if ($idx -lt 1) { return }
  $name = $_.Substring(0, $idx).Trim()
  $value = $_.Substring($idx + 1)
  Write-Host "Setting $name ..."
  npx vercel env add $name --value $value --yes --force 2>&1 | Out-Host
}

Write-Host "Done. Run: npx vercel env ls"
