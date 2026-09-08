#!/usr/bin/env node
/* scripts/gerar-senha.mjs — gera o hash de uma senha do painel /admin, para
 * colar na variável de ambiente ADMIN_USERS da Vercel. A senha em texto
 * puro NUNCA é salva em lugar nenhum — só o hash (scrypt) sai deste script.
 *
 * Uso:
 *   node scripts/gerar-senha.mjs "nome.usuario" "a-senha-escolhida"
 *
 * Rode de novo para cada pessoa que vai usar o painel, e junte todas as
 * entradas geradas num único array JSON — é esse array que vai na variável
 * de ambiente ADMIN_USERS (ver docs/sistema-de-imagens-setup.md).
 */
import { scryptSync, randomBytes } from "node:crypto";

const [, , usuario, senha] = process.argv;

if (!usuario || !senha) {
  console.error("Uso: node scripts/gerar-senha.mjs \"usuario\" \"senha\"");
  process.exit(1);
}

if (senha.length < 8) {
  console.error("Escolha uma senha com pelo menos 8 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(senha, salt, 64);

const entrada = {
  username: usuario,
  salt: salt.toString("hex"),
  hash: hash.toString("hex"),
};

console.log("\nAdicione esta entrada ao array ADMIN_USERS (variável de ambiente na Vercel):\n");
console.log(JSON.stringify(entrada, null, 2));
console.log("\nExemplo de ADMIN_USERS com uma ou mais pessoas:\n");
console.log(JSON.stringify([entrada], null, 2));
console.log("");
