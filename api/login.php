<?php
/* POST /api/login — { username, password } -> cookie de sessão HttpOnly */
require __DIR__ . '/_lib/auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    responderJson(405, ['ok' => false, 'error' => 'Método não permitido.']);
    exit;
}

$corpo = lerCorpoJson();
$username = trim((string) ($corpo['username'] ?? ''));
$senha = (string) ($corpo['password'] ?? '');

if ($username === '' || $senha === '') {
    responderJson(400, ['ok' => false, 'error' => 'Informe usuário e senha.']);
    exit;
}

$usuario = null;
foreach (listaUsuarios() as $candidato) {
    if (is_array($candidato) && ($candidato['username'] ?? null) === $username) {
        $usuario = $candidato;
        break;
    }
}

/* Mesmo se o usuário não existir, confere um hash "falso" com o mesmo custo
   computacional — evita vazar por tempo de resposta se o usuário existe. */
$salt = $usuario ? (string) ($usuario['salt'] ?? '') : SALT_FALSO;
$hash = $usuario ? (string) ($usuario['hash'] ?? '') : HASH_FALSO;
$iteracoes = $usuario && !empty($usuario['iter']) ? (int) $usuario['iter'] : PBKDF2_ITERACOES;

$ok = conferirSenha($senha, $salt, $hash, $iteracoes) && $usuario !== null;

if (!$ok) {
    responderJson(401, ['ok' => false, 'error' => 'Usuário ou senha inválidos.']);
    exit;
}

try {
    $token = criarSessao($username);
} catch (RuntimeException $erro) {
    responderJson(500, ['ok' => false, 'error' => 'Sessão não configurada no servidor (SESSION_SECRET ausente).']);
    exit;
}

enviarCookieSessao($token, SESSION_MAX_AGE_SEGUNDOS);
responderJson(200, ['ok' => true, 'username' => $username]);
