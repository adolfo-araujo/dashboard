#!/usr/bin/env bash
# Publica este projeto no seu GitHub.
# Uso:
#   ./push-to-github.sh https://github.com/SEU-USUARIO/finance-dashboard.git
# ou, com o GitHub CLI instalado e logado (gh auth login), sem precisar criar o repo antes:
#   ./push-to-github.sh --gh finance-dashboard
set -e

if [ -z "$1" ]; then
  echo "Informe a URL do repositório ou use: --gh NOME-DO-REPO"
  exit 1
fi

if [ ! -d .git ]; then
  git init -b main
fi
git add .
git commit -m "feat: finance dashboard (api + web + postgres)" || true

if [ "$1" = "--gh" ]; then
  gh repo create "${2:-finance-dashboard}" --private --source=. --remote=origin --push
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "$1"
  git push -u origin main
fi

echo "Pronto! Código enviado para o GitHub."
