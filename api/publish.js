/* POST /api/publish — grava, no repositório GitHub, UMA imagem e/ou o
   manifesto (content/banners.json ou content/eventos.json) de uma vez.

   Corpo aceito (pelo menos um dos dois campos):
   {
     "file": { "path": "assets/img/eventos/...", "contentBase64": "..." },
     "manifestType": "banners" | "eventos",
     "manifest": [ ... ]
   }

   O painel (admin/admin.js) envia uma requisição por imagem nova/alterada
   e, por fim, uma requisição só com o manifesto — mantendo cada
   requisição pequena (a Vercel tem um limite fixo de ~4,5MB por
   requisição) e cada gravação como um commit separado e rastreável. */
var auth = require("./_lib/auth");
var github = require("./_lib/github");

var MANIFESTOS = {
  banners: "content/banners.json",
  eventos: "content/eventos.json",
};

// Só permite gravar exatamente onde o painel deveria gravar: os 3 banners
// fixos, ou uma foto nova dentro de assets/img/eventos/. Bloqueia qualquer
// tentativa de sobrescrever outro arquivo do repositório.
var CAMINHO_BANNER = /^assets\/img\/banner-[123]\.(png|jpg|jpeg)$/i;
var CAMINHO_EVENTO = /^assets\/img\/eventos\/[a-z0-9][a-z0-9._-]{0,120}\.(jpg|jpeg|png|webp)$/i;

var TAMANHO_MAX_BASE64 = 4 * 1024 * 1024; // ~4MB, com folga sob o limite da Vercel

function caminhoPermitido(path) {
  if (typeof path !== "string" || path.indexOf("..") !== -1) return false;
  return CAMINHO_BANNER.test(path) || CAMINHO_EVENTO.test(path);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  var sessao = auth.lerSessao(req);
  if (!sessao) {
    return res.status(401).json({ ok: false, error: "Sessão expirada. Faça login novamente." });
  }

  var body = req.body || {};

  if (!body.file && !body.manifestType) {
    return res.status(400).json({ ok: false, error: "Nada para publicar." });
  }

  try {
    if (body.file) {
      var arquivo = body.file;
      if (!caminhoPermitido(arquivo.path)) {
        return res.status(400).json({ ok: false, error: "Caminho de arquivo não permitido." });
      }
      if (!arquivo.contentBase64 || typeof arquivo.contentBase64 !== "string") {
        return res.status(400).json({ ok: false, error: "Conteúdo do arquivo ausente." });
      }
      if (arquivo.contentBase64.length > TAMANHO_MAX_BASE64) {
        return res.status(413).json({ ok: false, error: "Imagem muito grande. Reduza o tamanho e tente novamente." });
      }
      await github.gravarArquivo(
        arquivo.path,
        arquivo.contentBase64,
        "admin: atualiza " + arquivo.path + " (por " + sessao.u + ")"
      );
    }

    if (body.manifestType) {
      var caminhoManifesto = MANIFESTOS[body.manifestType];
      if (!caminhoManifesto) {
        return res.status(400).json({ ok: false, error: "Tipo de manifesto inválido." });
      }
      if (!Array.isArray(body.manifest)) {
        return res.status(400).json({ ok: false, error: "Manifesto inválido." });
      }
      var conteudo = Buffer.from(JSON.stringify(body.manifest, null, 2) + "\n", "utf8").toString("base64");
      await github.gravarArquivo(
        caminhoManifesto,
        conteudo,
        "admin: atualiza " + body.manifestType + " (por " + sessao.u + ")"
      );
    }

    return res.status(200).json({ ok: true });
  } catch (erro) {
    console.error(erro);
    return res.status(502).json({ ok: false, error: "Falha ao publicar no GitHub: " + erro.message });
  }
};
