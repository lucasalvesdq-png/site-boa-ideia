# Rodada 2 — ajustes e "mais vida" (2026-08-21)

Plano de implementação para o feedback do cliente após a primeira entrega da reestruturação. Complementa [reestruturacao-2026-08-21-specs.md](reestruturacao-2026-08-21-specs.md).

## Feedback recebido (resumo)

1. Banner deve preencher a tela toda (100vh), sem os 2 CTAs logo abaixo — é o primeiro de futuramente 3 banners (slider), por ora só este.
2. Menu cascata desalinhado verticalmente em relação aos itens sem submenu.
3. Site ainda "sem vida" — usar mais os elementos/gradientes/animações das artes da marca, mais interatividade.
4. Footer "com coisas muito ruins" — redesenhar de forma profissional.
5. Bug: clicar num item do submenu (ex. "Missão, visão e valores", depois "Nosso time") não troca de aba quando já se está na página — só funciona na primeira navegação vinda de outra página.
6. Número de WhatsApp fornecido: **75 98865-5286** — ativar em todos os botões/CTAs pendentes.

## 1. Banner full-screen

- `.hero-banner` e a imagem interna passam de `68vh`/`48vh` para `min-height: 100vh` em todos os breakpoints.
- Remove a seção `.hero-acoes-faixa` (CTAs "Matricule-se" / "Agende uma visita" abaixo do banner) — o banner fica sozinho, sem texto nem botão por cima, como pedido.
- Adiciona um indicador de scroll (seta animada, `.hero-scroll-cue`) centralizado na base do banner — dá vida e sinaliza que há mais conteúdo abaixo, já que agora não há CTA visível.
- Estrutura deixada pronta para virar slider quando os outros 2 banners chegarem (comentário HTML indicando o ponto de extensão), sem construir o carrossel agora (não há assets ainda).

## 2. Alinhamento do menu cascata

Causa raiz: o link do item com submenu usa `display:inline-flex` (por causa do `.nav-caret`), enquanto os itens sem submenu ficam com o `<a>` inline padrão — isso muda o alinhamento vertical entre eles dentro do `<nav>` flex.

Correção: unificar `display:inline-flex; align-items:center;` em **todos** os links de primeiro nível do menu (`.nav-links > li > a`), com ou sem seta, e padronizar `line-height`/tamanho do `.nav-caret` para não alterar a altura da linha.

## 3. Bug do submenu (âncora não ativa aba na mesma página)

Causa raiz: `ativarAbaPorHash()` só roda uma vez, no `DOMContentLoaded`. Ao clicar num link de submenu para uma âncora da **mesma página** (ex. já estar em `quem-somos.html` e clicar em "Nosso time" → `#equipe`), o navegador dispara apenas o evento `hashchange`, não recarrega a página — então a função nunca roda de novo e a aba não troca.

Correção: registrar `window.addEventListener("hashchange", ativarAbaPorHash)` além da chamada inicial, para que a troca de aba funcione tanto na primeira navegação quanto em cliques subsequentes já dentro da página.

## 4. Footer profissional

Estrutura atual (4 blocos soltos: instituição / contato pendente / redes sociais / selo) trocada por um footer em 2 camadas:

- **Topo** (`.footer-topo`): grid de 4 colunas —
  1. Marca: logo + slogan + redes sociais (ícones em destaque).
  2. Navegação rápida: links para as páginas principais, com seta animada no hover.
  3. Contato: endereço, e-mail, horário e WhatsApp, cada um com ícone próprio (SVG inline, sem dependência externa).
  4. Selo da mantenedora (COOPEX).
- **Base** (`.footer-base`): copyright, centralizado, separador sutil.
- Elemento decorativo da marca (asterisco) no fundo, opacidade baixa, para não ficar um bloco "morto".
- Ícones (pin, e-mail, relógio, WhatsApp) desenhados como SVG inline no mesmo estilo dos ícones de rede social já usados — mantém a política de "sem dependência externa" do projeto.
- Replicado nas 7 páginas (6 páginas + portal-educacional).

## 5. "Mais vida" — camada de vitalidade visual

Usar mais os elementos e o clima das artes da marca (`MATERIAS DA MARCA/`) em seções que ainda estavam "secas":

- **Faixa de números**: fundo passa de cor sólida para gradiente diagonal (verde-escuro → verde), com elementos decorativos (asterisco, estrelas) flutuando.
- **Nossa história**: mais 1-2 elementos decorativos (confete, estrelas) além do círculo que já existia.
- **Níveis de Ensino (grid)**: elementos decorativos no fundo da seção; cards ganham leve "tilt" no hover (rotação sutil + escala), além do já existente `translateY`.
- **Saiba Mais**: ícone dos cards passa de círculo neon sólido para gradiente (`--verde-neon` → tom mais claro), com leve animação de "pulso" no hover.
- **Venha visitar**: bullets de benefício trocam emoji por ícones SVG inline num círculo com gradiente (mais consistente com o resto do site).
- **Novo componente — Cartão de Conquista**: inspirado direto na arte "Conquista" enviada (moldura tracejada neon, estrelas nas laterais, texto centralizado). Inserido como um respiro entre "Coberturas" e o carrossel, com uma frase institucional de impacto.
- **Depoimentos**: leve pulso no botão de play dos cards de vídeo.
- **Faixa institucional**: gradiente diagonal em vez de cor sólida, reforçando o padrão usado na faixa de números.
- Todas as novas animações respeitam `prefers-reduced-motion`.

## 6. WhatsApp — ativação

Número fornecido: **(75) 98865-5286** → link `https://wa.me/5575988655286` com mensagem pré-preenchida.

Substituir em todos os pontos hoje marcados como pendente/`aria-disabled`:
- Botão mini na `barra-topo` (7 páginas).
- Bloco "Redes Sociais" do footer (7 páginas).
- Cartão "Redes Sociais" da aba "Informações de Contato" em `contato.html`.
- CTA "Falar no WhatsApp" na seção "Venha visitar" da home.

Fora do escopo desta rodada (não confirmado pelo cliente): usar esse número como canal oficial de matrícula ou do formulário de contato — esses avisos de "canal ainda não definido" permanecem como estão até confirmação explícita.

## Ordem de execução

1. Bug do submenu (hashchange) — corrige a experiência de navegação primeiro.
2. Alinhamento do menu.
3. Banner full-screen + remoção da faixa de CTAs + scroll cue.
4. WhatsApp em todos os pontos pendentes.
5. Footer profissional (replicado nas 7 páginas).
6. Camada de "mais vida" (gradientes, decorações extras, cartão de conquista, ícones SVG nos benefícios).
