# KnowFlags — cle CARTO Basemaps
# Usage : cd C:\Users\david\knowflags ; powershell -ExecutionPolicy Bypass -File .\carto-key.ps1

$ErrorActionPreference = 'Stop'
$KEY = 'cb1_2gq9_1_a6a8b0d08a525706ebed33d2'

# --- 1. .env.local ---
$env_path = Join-Path (Get-Location) '.env.local'
if (-not (Test-Path -LiteralPath $env_path)) { [IO.File]::WriteAllText($env_path, '', [Text.UTF8Encoding]::new($false)) }
$env_txt = [IO.File]::ReadAllText($env_path)
if ($env_txt -match 'NEXT_PUBLIC_CARTO_KEY') {
  Write-Host "env : deja present" -ForegroundColor Yellow
} else {
  if ($env_txt.Length -gt 0 -and -not $env_txt.EndsWith("`n")) { $env_txt += "`r`n" }
  $env_txt += "NEXT_PUBLIC_CARTO_KEY=$KEY`r`n"
  [IO.File]::WriteAllText($env_path, $env_txt, [Text.UTF8Encoding]::new($false))
  Write-Host "env : ajoute" -ForegroundColor Green
}

# --- 2. TrueSizeMap.js ---
$map_path = Join-Path (Get-Location) 'components\TrueSizeMap.js'
if (-not (Test-Path -LiteralPath $map_path)) { throw "Introuvable : $map_path" }
$src = [IO.File]::ReadAllText($map_path)

if ($src.Contains('NEXT_PUBLIC_CARTO_KEY')) {
  Write-Host "TrueSizeMap : deja patche" -ForegroundColor Yellow
} else {
  $old = "      Lf.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {"
  $n = ([regex]::Matches($src, [regex]::Escape($old))).Count
  if ($n -ne 1) { throw "Ancre tileLayer trouvee $n fois (attendu 1). Abandon." }

  $new = @'
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_KEY
      const cartoUrl = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
        + (cartoKey ? '?key=' + cartoKey : '')

      Lf.tileLayer(cartoUrl, {
'@
  $new = ($new -replace "`r?`n", "`r`n").TrimEnd("`r", "`n")
  $src = $src.Replace($old, $new)
  Copy-Item -LiteralPath $map_path -Destination "$map_path.bak" -Force
  [IO.File]::WriteAllText($map_path, $src, [Text.UTF8Encoding]::new($false))
  Write-Host "TrueSizeMap : patche" -ForegroundColor Green
}

# --- 3. autres usages eventuels ---
Write-Host ""
Write-Host "Occurrences cartocdn restantes sans cle :" -ForegroundColor Cyan
Get-ChildItem -Path components -Recurse -Filter *.js |
  Select-String -Pattern 'cartocdn' |
  Where-Object { $_.Line -notmatch 'cartoUrl|cartoKey' } |
  Select-Object Path, LineNumber
