#!/usr/bin/env node
/* scripts/gerar-credenciais-php.mjs — gera o conteúdo de api/config.php (o
 * arquivo de configuração do painel /admin na HostGator): a chave que assina
 * o cookie de sessão e o hash da senha de cada pessoa com acesso.
 *
 * A senha em texto puro NUNCA é salva em lugar nenhum — só o hash
 * (PBKDF2-SHA256, o mesmo algoritmo conferido por api/_lib/auth.php) sai
 * daqui.
 *
 * Uso:
 *   node scripts/gerar-credenciais-php.mjs "nome.usuario" "a-senha-escolhida"
 *
 * Rode de novo para cada pessoa que vai usar o painel e junte as entradas
 * geradas dentro do array 'ADMIN_USERS' de api/config.php.
 *
 * (A versão equivalente para a Vercel, com scrypt, é scripts/gerar-senha.mjs.)
 */
import { pbkdf2Sync, randomBytes } from "node:crypto";

const ITERACOES = 210000; // igual a PBKDF2_ITERACOES em api/_lib/auth.php
const TAMANHO = 32;

const [, , usuario, senha] = process.argv;

if (!usuario || !senha) {
  console.error('Uso: node scripts/gerar-credenciais-php.mjs "usuario" "senha"');
  process.exit(1);
}

if (senha.length < 8) {
  console.error("Escolha uma senha com pelo menos 8 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(senha, salt, ITERACOES, TAMANHO, "sha256");
const sessionSecret = randomBytes(32).toString("hex");

const entrada =
  `        [\n` +
  `            'username' => '${usuario.replace(/'/g, "\\'")}',\n` +
  `            'salt' => '${salt.toString("hex")}',\n` +
  `            'hash' => '${hash.toString("hex")}',\n` +
  `            'iter' => ${ITERACOES},\n` +
  `        ],`;

console.log("\n=== api/config.php (arquivo completo, pronto para salvar) ===\n");
console.log(`<?php
return [
    'SESSION_SECRET' => '${sessionSecret}',
    'ADMIN_USERS' => [
${entrada}
    ],
];`);
console.log(`
=== Para adicionar OUTRA pessoa ===

Mantenha o SESSION_SECRET que já está no api/config.php (trocá-lo derruba as
sessões abertas) e acrescente só este bloco dentro de 'ADMIN_USERS':

${entrada}
`);
