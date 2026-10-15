<?php
/* GET /api/session — diz ao painel se o login ainda é válido */
require __DIR__ . '/_lib/auth.php';

$sessao = lerSessao();
if (!$sessao) {
    responderJson(200, ['authenticated' => false]);
    exit;
}
responderJson(200, ['authenticated' => true, 'username' => $sessao['u']]);
