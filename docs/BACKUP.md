# Backup do banco do Valtrea

## Como funciona

- O workflow `.github/workflows/backup.yml` roda todo dia às 03:00 (horário de Brasília).
- Ele faz uma cópia completa do banco do Neon (`pg_dump`) e criptografa com AES-256 usando a senha do segredo `BACKUP_PASSPHRASE`.
- Os backups ficam na aba **Actions** do GitHub por 30 dias.
- Para rodar na hora: **Actions > Backup diário do banco > Run workflow**.

**Guarde a senha `BACKUP_PASSPHRASE` em um lugar seguro (gerenciador de senhas).** Sem ela, os backups não podem ser abertos.

## Como restaurar

### 1. Baixar o backup

1. GitHub > **Actions** > **Backup diário do banco**.
2. Abra a execução do dia desejado e baixe o arquivo em **Artifacts**.
3. Extraia o `.zip`. Dentro dele está o `valtrea-backup-AAAA-MM-DD.dump.gpg`.

### 2. Descriptografar (PowerShell, com o Docker Desktop aberto)

Na pasta onde está o arquivo:

```powershell
docker run --rm -it -v "${PWD}:/w" -w /w alpine sh -c "apk add -q gnupg && gpg --pinentry-mode loopback -o backup.dump -d valtrea-backup-AAAA-MM-DD.dump.gpg"
```

O comando pede a senha do backup e gera o arquivo `backup.dump`.

### 3. Restaurar

**Sempre teste primeiro num banco separado**, nunca direto no banco de produção.

No Neon, crie uma **branch** nova (Branches > Create branch) e copie a connection string dela. Então:

```powershell
docker run --rm -v "${PWD}:/w" postgres:18 pg_restore --no-owner --no-acl --clean --if-exists -d "COLE_AQUI_A_CONNECTION_STRING_DA_BRANCH" /w/backup.dump
```

Depois de conferir que os dados estão certos na branch, você pode apontar o `DATABASE_URL` do Render para ela ou restaurar no banco principal da mesma forma.

### 4. Apagar os arquivos

Depois de restaurar, apague `backup.dump` e o `.gpg` do seu computador: eles contêm os dados de todos os usuários.
