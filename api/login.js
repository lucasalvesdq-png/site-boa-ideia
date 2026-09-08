/* POST /api/login — { username, password } -> cookie de sessão HttpOnly */
var auth = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  var body = req.body || {};
  var username = String(body.username || "").trim();
  var senha = String(body.password || "");

  if (!username || !senha) {
    return res.status(400).json({ ok: false, error: "Informe usuário e senha." });
  }

  var usuarios = auth.listaUsuarios();
  var usuario = null;
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i] && usuarios[i].username === username) {
      usuario = usuarios[i];
      break;
    }
  }

  // Mesmo se o usuário não existir, confere um hash "falso" com o mesmo
  // custo computacional — evita vazar por tempo de resposta se o usuário
  // existe ou não.
  var salt = usuario ? usuario.salt : auth.SALT_FALSO;
  var hash = usuario ? usuario.hash : auth.HASH_FALSO;

  var ok = false;
  try {
    ok = auth.conferirSenha(senha, salt, hash);
  } catch (erro) {
    ok = false;
  }
  ok = ok && !!usuario;

  if (!ok) {
    return res.status(401).json({ ok: false, error: "Usuário ou senha inválidos." });
  }

  var token;
  try {
    token = auth.criarSessao(username);
  } catch (erro) {
    return res.status(500).json({ ok: false, error: "Sessão não configurada no servidor (SESSION_SECRET ausente)." });
  }

  res.setHeader("Set-Cookie", auth.sessionCookieHeader(token, auth.SESSION_MAX_AGE_SEGUNDOS));
  return res.status(200).json({ ok: true, username: username });
};
