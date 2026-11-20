<#
  Backup de todos os bancos da Valtrea a partir do seu computador (Windows, com o Docker Desktop aberto).
  Serve enquanto o GitHub Actions estiver parado e como segunda cópia, fora do GitHub.

  1. Copie scripts/backup-local.env.exemplo para scripts/backup-local.env (esse arquivo nunca vai para o Git)
     e cole a URL de cada banco (a mesma do segredo BACKUP_DATABASE_URL de cada repositório).
  2. No PowerShell, na pasta do projeto:   .\scripts\backup-local.ps1
     Para também testar a restauração:      .\scripts\backup-local.ps1 -Testar
  3. A senha pedida criptografa os arquivos (AES-256, GPG). Use a mesma do segredo BACKUP_PASSPHRASE
     e guarde-a num gerenciador de senhas: sem ela, o backup não abre.

  Os arquivos ficam em .\backups\AAAA-MM-DD\<nome>.dump.gpg, no mesmo formato do backup do GitHub
  (docs/BACKUP.md explica como restaurar). Copie a pasta para um lugar fora do computador (Google Drive, pendrive).
#>
param(
    [switch]$Testar,
    [string]$Arquivo = (Join-Path $PSScriptRoot 'backup-local.env'),
    [string]$Destino = (Join-Path (Split-Path $PSScriptRoot -Parent) 'backups')
)
$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker não encontrado. Abra o Docker Desktop e tente de novo.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'O Docker Desktop não está rodando. Abra-o e tente de novo.' }
if (-not (Test-Path $Arquivo)) { throw "Crie $Arquivo a partir de backup-local.env.exemplo (uma linha NOME=URL por banco)." }

$bancos = Get-Content $Arquivo | Where-Object { $_ -match '^\s*[A-Za-z0-9_-]+\s*=\s*postgres(ql)?://' } | ForEach-Object {
    $nome, $url = $_ -split '=', 2
    [pscustomobject]@{ Nome = $nome.Trim(); Url = $url.Trim() }
}
if (-not $bancos) { throw "Nenhuma URL de banco em $Arquivo." }

$senhaSegura = Read-Host 'Senha para criptografar (a mesma do BACKUP_PASSPHRASE)' -AsSecureString
$senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura))
if ($senha.Length -lt 12) { throw 'Use uma senha com pelo menos 12 caracteres.' }

$pasta = Join-Path $Destino (Get-Date -Format 'yyyy-MM-dd')
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$resultado = @()

foreach ($b in $bancos) {
    Write-Host "`n== $($b.Nome)" -ForegroundColor Cyan
    $dump = "$($b.Nome).dump"
    # 1) cópia completa do banco (formato custom do pg_dump, igual ao do GitHub)
    docker run --rm -e DATABASE_URL="$($b.Url)" -v "${pasta}:/out" postgres:18 `
        sh -c "pg_dump `"`$DATABASE_URL`" --format=custom --no-owner --no-acl --file=/out/$dump"
    if ($LASTEXITCODE -ne 0) { $resultado += "$($b.Nome): FALHOU no pg_dump"; continue }
    $tamanho = (Get-Item (Join-Path $pasta $dump)).Length
    if ($tamanho -lt 1000) { $resultado += "$($b.Nome): FALHOU (arquivo vazio)"; continue }

    # 2) teste de restauração num banco temporário, antes de criptografar
    if ($Testar) {
        $c = "valtrea-teste-$($b.Nome.ToLower())"
        docker rm -f $c *> $null
        docker run -d --name $c -e POSTGRES_PASSWORD=teste -v "${pasta}:/out" postgres:18 | Out-Null
        Start-Sleep -Seconds 6
        docker exec $c pg_restore -U postgres -d postgres --no-owner "/out/$dump" *> $null
        $tabelas = (docker exec $c psql -U postgres -tA -c "select count(*) from information_schema.tables where table_schema='public'").Trim()
        docker rm -f $c *> $null
        $resultado += "$($b.Nome): restauração testada, $tabelas tabelas"
    }

    # 3) criptografia AES-256 com GPG (abre com: gpg --decrypt arquivo.dump.gpg > backup.dump)
    docker run --rm -e PASSPHRASE="$senha" -v "${pasta}:/out" alpine:3 `
        sh -c "apk add --no-cache gnupg >/dev/null && gpg --batch --yes --pinentry-mode loopback --passphrase `"`$PASSPHRASE`" --symmetric --cipher-algo AES256 --output /out/$dump.gpg /out/$dump && rm /out/$dump"
    if ($LASTEXITCODE -ne 0) { $resultado += "$($b.Nome): FALHOU na criptografia"; continue }
    $resultado += "$($b.Nome): ok, $([math]::Round($tamanho / 1KB)) KB"
}

$senha = $null
Write-Host "`nResumo ($pasta):" -ForegroundColor Green
$resultado | ForEach-Object { Write-Host "  $_" }
Write-Host "`nCopie a pasta para fora do computador (Google Drive, pendrive) e apague backups com mais de 30 dias."
