/* api/_lib/github.js — grava arquivos no repositório GitHub via API de
   conteúdo, usando um token guardado só em variável de ambiente da Vercel
   (GITHUB_TOKEN). Cada gravação vira um commit no repositório, então tudo
   fica versionado e reversível pelo histórico do Git. Sem dependências
   externas — usa o "fetch" nativo do runtime Node da Vercel. */

var API_BASE = "https://api.github.com";

function encodePath(path) {
  return path
    .split("/")
    .map(function (parte) {
      return encodeURIComponent(parte);
    })
    .join("/");
}

function repoPartes() {
  var repo = process.env.GITHUB_REPO;
  if (!repo || repo.indexOf("/") === -1) {
    throw new Error("GITHUB_REPO não configurado corretamente (formato esperado: 'usuario/repositorio').");
  }
  var partes = repo.split("/");
  return { owner: partes[0], repo: partes[1] };
}

function headers() {
  var token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN não configurado.");
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "boaideia-admin",
  };
}

async function obterSha(path) {
  var branch = process.env.GITHUB_BRANCH || "main";
  var repoInfo = repoPartes();
  var url =
    API_BASE + "/repos/" + repoInfo.owner + "/" + repoInfo.repo + "/contents/" + encodePath(path) +
    "?ref=" + encodeURIComponent(branch);
  var res = await fetch(url, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Falha ao consultar '" + path + "' no GitHub (" + res.status + "): " + (await res.text()));
  }
  var dados = await res.json();
  return dados.sha;
}

async function gravarArquivo(path, conteudoBase64, mensagem) {
  var branch = process.env.GITHUB_BRANCH || "main";
  var repoInfo = repoPartes();
  var sha = await obterSha(path);
  var url = API_BASE + "/repos/" + repoInfo.owner + "/" + repoInfo.repo + "/contents/" + encodePath(path);

  var body = {
    message: mensagem,
    content: conteudoBase64,
    branch: branch,
  };
  if (sha) body.sha = sha;

  var res = await fetch(url, {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, headers()),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Falha ao gravar '" + path + "' no GitHub (" + res.status + "): " + (await res.text()));
  }
  return res.json();
}

module.exports = { gravarArquivo: gravarArquivo, obterSha: obterSha };
