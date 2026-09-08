/* POST /api/logout — encerra a sessão do painel */
var auth = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }
  res.setHeader("Set-Cookie", auth.clearCookieHeader());
  return res.status(200).json({ ok: true });
};
