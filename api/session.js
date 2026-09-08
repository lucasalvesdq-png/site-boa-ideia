/* GET /api/session — diz ao painel se o login ainda é válido */
var auth = require("./_lib/auth");

module.exports = async function handler(req, res) {
  var sessao = auth.lerSessao(req);
  if (!sessao) {
    return res.status(200).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true, username: sessao.u });
};
