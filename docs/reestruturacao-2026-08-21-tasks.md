# Reestruturação 2026-08-21 — Tasks

Checklist de execução, na ordem em que devem ser feitas. Cada item referencia a spec correspondente em [reestruturacao-2026-08-21-specs.md](reestruturacao-2026-08-21-specs.md).

Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado (aguardando cliente).

---

## Fase 1 — Camada gráfica global (§9)
- [ ] **T1.1** — Adicionar tokens novos em `:root` (`--neon-glow`, `--moldura-borda`).
- [ ] **T1.2** — Criar `.moldura-janela` (com 3 pontinhos no topo via `::before`).
- [ ] **T1.3** — Criar `.cantos-neon` (4 cantoneiras via `::before` + `::after` + duas âncoras).
- [ ] **T1.4** — Criar `.pill-neon` (badges "Aprender +", data, etc.).
- [ ] **T1.5** — Criar `.selo-flutuante` (círculo com borda dupla neon, aceita PNG dentro).
- [ ] **T1.6** — Criar `.titulo-contorno` (text-stroke + shadow).

## Fase 2 — Hero + Menu cascata (§1, §2)
- [ ] **T2.1** — Renomear `assets/img/image-1787339574080.png` → `assets/img/banner-home.png`.
- [ ] **T2.2** — Substituir `.hero` da home por `.hero-banner` + `.hero-acoes-faixa` (arquivo `index.html`).
- [ ] **T2.3** — Adicionar CSS de `.hero-banner` e `.hero-acoes-faixa`. Manter `.topo-pagina` intacto (páginas internas).
- [ ] **T2.4** — Reescrever `<ul class="nav-links">` nas **6 páginas** com `.nav-item--tem-sub` + `.nav-sub`.
- [ ] **T2.5** — CSS do dropdown desktop (hover + foco por teclado com `:focus-within`).
- [ ] **T2.6** — CSS do dropdown mobile (acordeão no drawer).
- [ ] **T2.7** — JS: handler `submenusMobile()` em `js/main.js`.
- [ ] **T2.8** — JS: handler `ativarAbaPorHash()` — ao carregar, se `location.hash` bate com um `data-tab-painel`, ativa a aba certa.
- [ ] **T2.9** — Garantir que âncoras (`#historia`, `#missao`, etc.) existam nas páginas internas correspondentes; ajustar `id` das abas se necessário.

## Fase 3 — Saiba Mais 3×2 + "Vem conhecer" (§8, §7)
- [ ] **T3.1** — Substituir `.grid-cards` da seção Saiba Mais na home por `.grid-saiba-mais` + `.card-saiba` (6 cards).
- [ ] **T3.2** — Aplicar mesmo padrão em `saiba-mais.html` (lista principal).
- [ ] **T3.3** — CSS de `.grid-saiba-mais`, `.card-saiba`, `.card-saiba-icone`, `.card-saiba-link`.
- [ ] **T3.4** — Substituir `.faixa-cta` "Vem conhecer o Boa Ideia" da home por seção `.venha-visitar` (split com `.moldura-janela` + `.beneficios-visita`).
- [ ] **T3.5** — CSS de `.venha-visitar`, `.beneficios-visita`, ícones SVG inline.
- [ ] **T3.6** — Marcar foto e selo com `.pendente` até chegar arquivo real; CTA WhatsApp fica `.pendente` até o número chegar.

## Fase 4 — Cobertura + Carrossel (§5, §6)
- [ ] **T4.1** — Adicionar seção `.grid-coberturas` na home entre "Saiba Mais" e "Depoimentos".
- [ ] **T4.2** — CSS de `.grid-coberturas`, `.card-cobertura`, `.card-cobertura-foto`, `.card-cobertura-data`.
- [ ] **T4.3** — Marcar as 3 coberturas como `.pendente` (aguardando 3 eventos: foto + data + resumo).
- [ ] **T4.4** — Adicionar seção `.carrossel-secao` antes da faixa institucional na home.
- [ ] **T4.5** — CSS do carrossel (`.carrossel`, `.carrossel-trilho`, `.carrossel-slide`, `.carrossel-btn`, `.carrossel-dots`) com scroll-snap.
- [ ] **T4.6** — JS: handler `carrossel()` — botões prev/next + dots + `IntersectionObserver` pra marcar ativo.
- [ ] **T4.7** — Slides como `.pendente` (aguardando 6-8 fotos reais).

## Fase 5 — Nosso Time (§3)
- [ ] **T5.1** — Substituir grid de fotos em `quem-somos.html` aba "Nosso Time" por 5 grupos com `.grid-time-texto` + `.card-time-texto`.
- [ ] **T5.2** — CSS de `.grupo-time`, `.grid-time-texto`, `.card-time-texto`.
- [ ] **T5.3** — Verificar se `.card-pessoa` ainda é usado em outras páginas antes de remover do CSS.

## Fase 6 — Redes sociais + dados de contato (§4)
- [ ] **T6.1** — Criar componente `.redes-sociais` + `.rede-btn` com SVGs inline (Instagram, Facebook, YouTube, WhatsApp, TikTok).
- [ ] **T6.2** — Adicionar bloco `.redes-sociais` mini na `.barra-topo` (Instagram + WhatsApp) nas **6 páginas**.
- [ ] **T6.3** — Substituir bloco "Redes Sociais" do footer nas **6 páginas** pelo componente completo (4 ativas + TikTok comentado).
- [ ] **T6.4** — Substituir o `.aviso-bloqueio` de contato no footer por dados reais: e-mail (mailto), horário. Telefone segue `.pendente`.
- [ ] **T6.5** — Página `contato.html` — atualizar bloco de redes com versão grande + labels.
- [ ] **T6.6** — Página `contato.html` — atualizar e-mail e horário.

## Fase 7 — Revisão final
- [ ] **T7.1** — Rodar `python3 -m http.server 8000` e testar as 6 páginas nos breakpoints 640 / 780 / 860 / 980 / 1200.
- [ ] **T7.2** — Verificar `prefers-reduced-motion` (desligar animações no OS e checar).
- [ ] **T7.3** — Verificar navegação por teclado (dropdown com Tab/Enter, carrossel com setas).
- [ ] **T7.4** — Revisar contraste (verde neon sobre verde escuro; texto branco sobre neon deve ser evitado — usar verde escuro).
- [ ] **T7.5** — Passar `git status` antes de qualquer commit (repo git na pasta pai — cuidado com `git add .`).

---

## Bloqueadores conhecidos (esperando cliente)
- **Telefone / WhatsApp** — barra-topo, footer, CTA "Falar no WhatsApp".
- **Confirmação TikTok** — deixa ativado?
- **Foto real** pra bloco "Vem conhecer" (§7).
- **3 coberturas** de eventos com foto + data + resumo (§5).
- **6–8 fotos** do colégio pro carrossel (§6).
- **Copy real** de cada item de "Saiba Mais" (hoje é lorem ipsum).

Nenhum bloqueador impede começar — tudo entra como `.pendente` marcado, o cliente troca depois.
