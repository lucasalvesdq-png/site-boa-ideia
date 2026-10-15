#!/usr/bin/env bash
# scripts/deploy-hostgator.sh — monta em .deploy/hostgator/ exatamente o que
# deve ir para o public_html da HostGator.
#
# O repositório tem coisas que NÃO são o site (a pasta MATERIAS DA MARCA, a
# documentação, os arquivos .js da versão Vercel, o histórico do git). Este
# script copia só o site, para você arrastar a pasta inteira no FileZilla sem
# ter que decidir arquivo por arquivo.
#
#   bash scripts/deploy-hostgator.sh
#
# Rode de novo sempre que mudar algo: a cópia é incremental (só o que mudou)
# e .deploy/ está no .gitignore.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINO="$RAIZ/.deploy/hostgator"

cd "$RAIZ"
mkdir -p "$DESTINO"

echo "Montando o pacote em .deploy/hostgator/ ..."

rsync -a --delete \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.claude/' \
  --exclude '.vercel/' \
  --exclude '.deploy/' \
  --exclude '.env*' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  --exclude 'MATERIAS DA MARCA/' \
  --exclude 'docs/' \
  --exclude 'scripts/' \
  --exclude 'api/*.js' \
  --exclude 'api/_lib/*.js' \
  --exclude 'api/config.example.php' \
  --exclude 'vercel.json' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  --exclude 'AGENT.md' \
  --exclude 'CLAUDE.md' \
  --exclude 'README.md' \
  ./ "$DESTINO/"

# Permissões como a HostGator espera: 755 nas pastas, 644 nos arquivos.
find "$DESTINO" -type d -exec chmod 755 {} +
find "$DESTINO" -type f -exec chmod 644 {} +

echo
if [ -f "$DESTINO/api/config.php" ]; then
  echo "  ✓ api/config.php incluído (painel /admin vai funcionar)"
else
  echo "  ! api/config.php NÃO existe — o site funciona, mas o painel /admin não."
  echo "    Gere com: node scripts/gerar-credenciais-php.mjs \"usuario\" \"senha\""
  echo "    e salve a saída em api/config.php."
fi

echo "  ✓ $(find "$DESTINO" -type f | wc -l | tr -d ' ') arquivos, $(du -sh "$DESTINO" | cut -f1) no total"
echo
echo "Agora, no FileZilla: envie o CONTEÚDO de"
echo "  $DESTINO/"
echo "para a pasta public_html da HostGator (ver docs/deploy-hostgator.md)."
