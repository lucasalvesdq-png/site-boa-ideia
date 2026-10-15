<?php
/* api/_lib/auth.php — sessão de login e conferência de senha do painel /admin
   na HostGator (PHP puro, sem dependências).

   É a tradução de api/_lib/auth.js (que rodava como Vercel Function) para o
   PHP da hospedagem compartilhada. O desenho é o mesmo:

   1. A senha de cada usuário do painel é guardada só como hash (PBKDF2-SHA256
      com salt por usuário), nunca em texto puro — em api/config.php, que fica
      fora do repositório (ver api/config.example.php).
   2. Ao logar, o servidor emite um cookie de sessão HttpOnly assinado
      (HMAC-SHA256 com SESSION_SECRET). O navegador não lê nem altera esse
      cookie por JavaScript, e o servidor confere a assinatura em toda
      requisição antes de aceitar qualquer publicação.

   Diferença em relação à versão Node: lá o hash era scrypt (nativo do Node);
   aqui é PBKDF2-SHA256, que existe nativamente nos dois lados — o mesmo hash
   é gerado por scripts/gerar-credenciais-php.mjs e conferido aqui. */

const SESSION_COOKIE = 'boaideia_session';
const SESSION_MAX_AGE_SEGUNDOS = 60 * 60 * 8; // 8 horas
const PBKDF2_ITERACOES = 210000;
const PBKDF2_TAMANHO = 32; // bytes

function carregarConfig() {
    static $config = null;
    if ($config !== null) return $config;

    $caminho = __DIR__ . '/../config.php';
    if (!is_file($caminho)) {
        $config = [];
        return $config;
    }
    $lido = require $caminho;
    $config = is_array($lido) ? $lido : [];
    return $config;
}

function configValor($chave, $padrao = null) {
    $config = carregarConfig();
    return array_key_exists($chave, $config) ? $config[$chave] : $padrao;
}

function responderJson($status, array $dados) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/* Lê o corpo JSON da requisição. Devolve [] se vier vazio ou inválido. */
function lerCorpoJson() {
    $bruto = file_get_contents('php://input');
    if ($bruto === false || $bruto === '') return [];
    $dados = json_decode($bruto, true);
    return is_array($dados) ? $dados : [];
}

function base64url($texto) {
    return rtrim(strtr(base64_encode($texto), '+/', '-_'), '=');
}

function base64urlDecode($valor) {
    $normalizado = strtr($valor, '-_', '+/');
    $resto = strlen($normalizado) % 4;
    if ($resto) $normalizado .= str_repeat('=', 4 - $resto);
    $saida = base64_decode($normalizado, true);
    return $saida === false ? '' : $saida;
}

function segredoSessao() {
    $secret = configValor('SESSION_SECRET', '');
    if (!is_string($secret) || strlen($secret) < 16) {
        throw new RuntimeException('SESSION_SECRET ausente ou curto demais em api/config.php.');
    }
    return $secret;
}

function assinarPayload(array $payload) {
    $corpo = base64url(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $assinatura = hash_hmac('sha256', $corpo, segredoSessao());
    return $corpo . '.' . $assinatura;
}

function verificarToken($token) {
    if (!is_string($token) || strpos($token, '.') === false) return null;

    $partes = explode('.', $token);
    if (count($partes) !== 2) return null;
    list($corpo, $assinatura) = $partes;

    try {
        $esperado = hash_hmac('sha256', $corpo, segredoSessao());
    } catch (RuntimeException $erro) {
        return null;
    }
    if (!hash_equals($esperado, (string) $assinatura)) return null;

    $dados = json_decode(base64urlDecode($corpo), true);
    if (!is_array($dados) || empty($dados['exp'])) return null;
    // "exp" é gravado em milissegundos, como na versão Node.
    if (round(microtime(true) * 1000) > (float) $dados['exp']) return null;
    return $dados;
}

function httpsAtivo() {
    if (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off') return true;
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') return true;
    if (!empty($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) return true;
    return false;
}

function enviarCookieSessao($token, $maxAgeSegundos) {
    $partes = [
        SESSION_COOKIE . '=' . rawurlencode($token),
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=' . (int) $maxAgeSegundos,
    ];
    if (httpsAtivo()) $partes[] = 'Secure';
    header('Set-Cookie: ' . implode('; ', $partes), false);
}

function limparCookieSessao() {
    header('Set-Cookie: ' . SESSION_COOKIE . '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0', false);
}

function criarSessao($username) {
    $exp = round(microtime(true) * 1000) + SESSION_MAX_AGE_SEGUNDOS * 1000;
    return assinarPayload(['u' => $username, 'exp' => $exp]);
}

function lerSessao() {
    $token = isset($_COOKIE[SESSION_COOKIE]) ? $_COOKIE[SESSION_COOKIE] : null;
    return verificarToken($token);
}

function listaUsuarios() {
    $usuarios = configValor('ADMIN_USERS', []);
    return is_array($usuarios) ? $usuarios : [];
}

function hashPbkdf2($senha, $saltHex, $iteracoes = PBKDF2_ITERACOES) {
    $salt = hex2bin($saltHex);
    if ($salt === false) return '';
    return bin2hex(hash_pbkdf2('sha256', $senha, $salt, (int) $iteracoes, PBKDF2_TAMANHO, true));
}

/* Salt e hash "de mentira", só para o login gastar o mesmo tempo de cálculo
   quando o usuário não existe — evita vazar, pelo tempo de resposta, se um
   nome de usuário está cadastrado ou não. */
const SALT_FALSO = '00000000000000000000000000000000';
const HASH_FALSO = '0000000000000000000000000000000000000000000000000000000000000000';

function conferirSenha($senha, $saltHex, $hashHex, $iteracoes = PBKDF2_ITERACOES) {
    $calculado = hashPbkdf2($senha, $saltHex, $iteracoes);
    if ($calculado === '') return false;
    return hash_equals((string) $hashHex, $calculado);
}
