<?php
/* POST /api/publish — grava UMA imagem e/ou o manifesto
   (content/banners.json ou content/eventos.json) por requisição.

   Corpo aceito (pelo menos um dos dois campos):
   {
     "file": { "path": "assets/img/eventos/...", "contentBase64": "..." },
     "manifestType": "banners" | "eventos",
     "manifest": [ ... ]
   }

   O painel (admin/admin.js) envia uma requisição por imagem nova/alterada e,
   ao final, uma requisição só com o manifesto — mantendo cada requisição
   pequena (aqui o limite é o post_max_size do PHP da hospedagem, por padrão
   bem menor que o de uma conta dedicada) e cada gravação independente. */
require __DIR__ . '/_lib/auth.php';
require __DIR__ . '/_lib/arquivos.php';

const MANIFESTOS = [
    'banners' => 'content/banners.json',
    'eventos' => 'content/eventos.json',
];

/* ~4MB de base64 (≈3MB de imagem). O painel já reduz as imagens antes de
   enviar; este é o teto de segurança do servidor. */
const TAMANHO_MAX_BASE64 = 4 * 1024 * 1024;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    responderJson(405, ['ok' => false, 'error' => 'Método não permitido.']);
    exit;
}

$sessao = lerSessao();
if (!$sessao) {
    responderJson(401, ['ok' => false, 'error' => 'Sessão expirada. Faça login novamente.']);
    exit;
}

$bruto = file_get_contents('php://input');
/* Corpo vazio num POST normalmente é o post_max_size do PHP estourado: o
   Apache descarta o corpo e o PHP não acusa erro sozinho. */
if ($bruto === false || $bruto === '') {
    responderJson(413, ['ok' => false, 'error' => 'O servidor recusou o envio por tamanho (post_max_size do PHP). Envie uma imagem menor.']);
    exit;
}

$corpo = json_decode($bruto, true);
if (!is_array($corpo)) {
    responderJson(400, ['ok' => false, 'error' => 'Requisição inválida.']);
    exit;
}

$temArquivo = isset($corpo['file']) && is_array($corpo['file']);
$tipoManifesto = isset($corpo['manifestType']) ? (string) $corpo['manifestType'] : '';

if (!$temArquivo && $tipoManifesto === '') {
    responderJson(400, ['ok' => false, 'error' => 'Nada para publicar.']);
    exit;
}

try {
    if ($temArquivo) {
        $arquivo = $corpo['file'];
        $path = isset($arquivo['path']) ? (string) $arquivo['path'] : '';
        $base64 = isset($arquivo['contentBase64']) ? $arquivo['contentBase64'] : null;

        if (!caminhoPermitido($path)) {
            responderJson(400, ['ok' => false, 'error' => 'Caminho de arquivo não permitido.']);
            exit;
        }
        if (!is_string($base64) || $base64 === '') {
            responderJson(400, ['ok' => false, 'error' => 'Conteúdo do arquivo ausente.']);
            exit;
        }
        if (strlen($base64) > TAMANHO_MAX_BASE64) {
            responderJson(413, ['ok' => false, 'error' => 'Imagem muito grande. Reduza o tamanho e tente novamente.']);
            exit;
        }

        $conteudo = base64_decode($base64, true);
        if ($conteudo === false || $conteudo === '') {
            responderJson(400, ['ok' => false, 'error' => 'Conteúdo do arquivo inválido.']);
            exit;
        }

        gravarArquivo($path, $conteudo);
    }

    if ($tipoManifesto !== '') {
        if (!isset(MANIFESTOS[$tipoManifesto])) {
            responderJson(400, ['ok' => false, 'error' => 'Tipo de manifesto inválido.']);
            exit;
        }
        if (!isset($corpo['manifest']) || !is_array($corpo['manifest'])) {
            responderJson(400, ['ok' => false, 'error' => 'Manifesto inválido.']);
            exit;
        }
        /* O manifesto é sempre um array (lista de banners ou de eventos);
           json_decode devolve array associativo para objetos, então um
           objeto solto aqui seria um erro do painel. */
        if ($corpo['manifest'] !== [] && array_keys($corpo['manifest']) !== range(0, count($corpo['manifest']) - 1)) {
            responderJson(400, ['ok' => false, 'error' => 'Manifesto inválido.']);
            exit;
        }

        $json = json_encode(
            $corpo['manifest'],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        if ($json === false) {
            responderJson(400, ['ok' => false, 'error' => 'Manifesto inválido.']);
            exit;
        }
        gravarArquivo(MANIFESTOS[$tipoManifesto], $json . "\n");
    }

    responderJson(200, ['ok' => true]);
} catch (RuntimeException $erro) {
    error_log('[publish] ' . $erro->getMessage());
    responderJson(500, ['ok' => false, 'error' => 'Falha ao publicar: ' . $erro->getMessage()]);
}
