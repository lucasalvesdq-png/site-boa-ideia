<?php
/* POST /api/logout — encerra a sessão do painel */
require __DIR__ . '/_lib/auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    responderJson(405, ['ok' => false, 'error' => 'Método não permitido.']);
    exit;
}

limparCookieSessao();
responderJson(200, ['ok' => true]);
