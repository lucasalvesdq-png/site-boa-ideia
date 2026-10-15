<?php
/* api/_lib/arquivos.php — grava as imagens e os manifestos do painel direto
   na pasta do site na HostGator.

   Substitui api/_lib/github.js: na Vercel cada publicação virava um commit no
   repositório (porque o sistema de arquivos lá é só leitura); na hospedagem
   compartilhada o PHP escreve no próprio public_html, que é o que o Apache
   serve. A gravação é feita em arquivo temporário + rename(), que é atômico
   no mesmo volume — assim o site nunca serve um JSON ou um JPG pela metade. */

/* Raiz do site (public_html): este arquivo fica em <raiz>/api/_lib/. */
function raizSite() {
    return dirname(__DIR__, 2);
}

/* Só permite gravar exatamente onde o painel deveria gravar: os 3 banners
   (versão desktop ou mobile), ou a capa/uma foto dentro da pasta de um evento
   (assets/img/eventos/<id-do-evento>/...). Bloqueia qualquer tentativa de
   sobrescrever outro arquivo do site. Mesmas regras da versão Vercel. */
const CAMINHO_BANNER = '#^assets/img/banner-[123](-(desktop|mobile))?\.(png|jpg|jpeg)$#i';
const CAMINHO_EVENTO_ARQUIVO = '#^assets/img/eventos/[a-z0-9][a-z0-9-]{0,78}/[a-z0-9][a-z0-9._-]{0,120}\.(jpg|jpeg|png|webp)$#i';
/* Formato legado (v1, antes dos eventos terem pasta própria) — mantido para
   não invalidar publicações antigas que ainda apontem para ele. */
const CAMINHO_EVENTO_LEGADO = '#^assets/img/eventos/[a-z0-9][a-z0-9._-]{0,120}\.(jpg|jpeg|png|webp)$#i';

function caminhoPermitido($path) {
    if (!is_string($path) || $path === '' || strpos($path, '..') !== false) return false;
    if (strpos($path, "\0") !== false) return false;
    return preg_match(CAMINHO_BANNER, $path) === 1
        || preg_match(CAMINHO_EVENTO_ARQUIVO, $path) === 1
        || preg_match(CAMINHO_EVENTO_LEGADO, $path) === 1;
}

/* Grava conteúdo binário em <raiz>/<pathRelativo>, criando as pastas que
   faltarem. Lança RuntimeException com uma mensagem legível em qualquer
   falha — quem chama transforma isso na resposta de erro do painel. */
function gravarArquivo($pathRelativo, $conteudo) {
    $destino = raizSite() . '/' . $pathRelativo;
    $pasta = dirname($destino);

    if (!is_dir($pasta) && !@mkdir($pasta, 0755, true) && !is_dir($pasta)) {
        throw new RuntimeException('Não foi possível criar a pasta "' . dirname($pathRelativo) . '" no servidor.');
    }
    if (!is_writable($pasta)) {
        throw new RuntimeException('A pasta "' . dirname($pathRelativo) . '" não tem permissão de escrita no servidor.');
    }
    if (is_file($destino) && !is_writable($destino)) {
        throw new RuntimeException('O arquivo "' . $pathRelativo . '" não tem permissão de escrita no servidor.');
    }

    $temporario = @tempnam($pasta, '.pub');
    if ($temporario === false) {
        throw new RuntimeException('Não foi possível criar arquivo temporário em "' . dirname($pathRelativo) . '".');
    }

    $bytes = @file_put_contents($temporario, $conteudo);
    if ($bytes === false || $bytes !== strlen($conteudo)) {
        @unlink($temporario);
        throw new RuntimeException('Falha ao escrever "' . $pathRelativo . '" no servidor.');
    }

    @chmod($temporario, 0644);
    if (!@rename($temporario, $destino)) {
        @unlink($temporario);
        throw new RuntimeException('Falha ao finalizar a gravação de "' . $pathRelativo . '".');
    }
    return true;
}
