# Publica este projeto no seu GitHub (Windows / PowerShell).
# Uso: .\push-to-github.ps1 https://github.com/SEU-USUARIO/finance-dashboard.git
param([Parameter(Mandatory = $true)][string]$RepoUrl)

if (-not (Test-Path .git)) { git init -b main }
git add .
git commit -m "feat: finance dashboard (api + web + postgres)"
git remote remove origin 2>$null
git remote add origin $RepoUrl
git push -u origin main
Write-Host "Pronto! Código enviado para o GitHub."
