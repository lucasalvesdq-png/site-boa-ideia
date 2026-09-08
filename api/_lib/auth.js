/* api/_lib/auth.js — sessão de login e hashing de senha, sem dependências
   externas (só o módulo nativo "crypto" do Node).

   Login funciona assim:
   1. A senha de cada usuário do painel é guardada como hash (scrypt), nunca
      em texto puro — na variável de ambiente ADMIN_USERS (JSON), configurada
      só na Vercel, nunca no repositório (que é público).
   2. Ao logar com sucesso, o servidor emite um cookie de sessão HttpOnly
      assinado (HMAC com SESSION_SECRET) — o navegador não consegue ler nem
      alterar esse cookie via JavaScript, e o servidor confere a assinatura
      a cada requisição antes de aceitar qualquer publicação. */

var crypto = require("crypto");

var SESSION_COOKIE = "boaideia_session";
var SESSION_MAX_AGE_SEGUNDOS = 60 * 60 * 8; // 8 horas

function base64url(texto) {
  return Buffer.from(texto, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(valor) {
  var normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  while (normalizado.length % 4) normalizado += "=";
  return Buffer.from(normalizado, "base64").toString("utf8");
}

function getSecret() {
  var secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado no ambiente.");
  return secret;
}

function assinar(payloadObj) {
  var payload = base64url(JSON.stringify(payloadObj));
  var hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return payload + "." + hmac;
}

function verificar(token) {
  if (!token || token.indexOf(".") === -1) return null;
  var partes = token.split(".");
  var payload = partes[0];
  var assinatura = partes[1];

  var esperado;
  try {
    esperado = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  } catch (erro) {
    return null;
  }

  var a = Buffer.from(assinatura || "", "hex");
  var b = Buffer.from(esperado, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  var dados;
  try {
    dados = JSON.parse(base64urlDecode(payload));
  } catch (erro) {
    return null;
  }
  if (!dados || !dados.exp || Date.now() > dados.exp) return null;
  return dados;
}

function parseCookies(header) {
  var out = {};
  if (!header) return out;
  header.split(";").forEach(function (parte) {
    var i = parte.indexOf("=");
    if (i === -1) return;
    var chave = parte.slice(0, i).trim();
    var valor = parte.slice(i + 1).trim();
    try {
      out[chave] = decodeURIComponent(valor);
    } catch (erro) {
      out[chave] = valor;
    }
  });
  return out;
}

function sessionCookieHeader(token, maxAgeSegundos) {
  var partes = [
    SESSION_COOKIE + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=" + maxAgeSegundos,
  ];
  // "Secure" exige HTTPS — a Vercel serve tudo em HTTPS em produção/preview.
  if (process.env.VERCEL_ENV) partes.push("Secure");
  return partes.join("; ");
}

function clearCookieHeader() {
  return SESSION_COOKIE + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
}

function criarSessao(username) {
  var exp = Date.now() + SESSION_MAX_AGE_SEGUNDOS * 1000;
  return assinar({ u: username, exp: exp });
}

function lerSessao(req) {
  var cookies = parseCookies(req.headers.cookie);
  return verificar(cookies[SESSION_COOKIE]);
}

function hashSenha(senha, saltHex) {
  var salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  var hash = crypto.scryptSync(senha, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

// Salt (16 bytes) e hash (64 bytes) "de mentira", só para o login rodar o
// mesmo cálculo de scrypt quando o usuário não existe — evita vazar, pelo
// tempo de resposta, se um nome de usuário existe ou não.
var SALT_FALSO = Buffer.alloc(16, 0).toString("hex");
var HASH_FALSO = Buffer.alloc(64, 0).toString("hex");

function conferirSenha(senha, saltHex, hashHex) {
  var calculado = crypto.scryptSync(senha, Buffer.from(saltHex, "hex"), 64);
  var esperado = Buffer.from(hashHex, "hex");
  if (calculado.length !== esperado.length) return false;
  return crypto.timingSafeEqual(calculado, esperado);
}

function listaUsuarios() {
  var raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  try {
    var arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (erro) {
    return [];
  }
}

module.exports = {
  SESSION_COOKIE: SESSION_COOKIE,
  SESSION_MAX_AGE_SEGUNDOS: SESSION_MAX_AGE_SEGUNDOS,
  SALT_FALSO: SALT_FALSO,
  HASH_FALSO: HASH_FALSO,
  parseCookies: parseCookies,
  sessionCookieHeader: sessionCookieHeader,
  clearCookieHeader: clearCookieHeader,
  criarSessao: criarSessao,
  lerSessao: lerSessao,
  hashSenha: hashSenha,
  conferirSenha: conferirSenha,
  listaUsuarios: listaUsuarios,
};
