# Reestruturação 2026-08-21 — Specs

Documento de referência das mudanças aprovadas em 2026-08-21 (feedback da apresentação para a agência: "site sem brilho"). Fonte visual: pasta `MATERIAS DA MARCA/` + artes enviadas pelo cliente. Todos os tokens novos entram em `css/style.css` sob `:root`; nada de framework, nada de build.

Convenções deste doc: cada bloco tem **Escopo**, **Comportamento**, **HTML/estrutura** e **CSS/tokens**. Nada aqui é código pronto — é contrato do que a implementação precisa entregar.

---

## §9. Camada gráfica global (base pra todo o resto)

### Escopo
Componentes reutilizáveis de identidade visual, inspirados nas artes da agência PRATEN. Ficam disponíveis como classes utilitárias no CSS pra serem aplicadas em qualquer seção — nova ou existente.

### Componentes
1. **`.moldura-janela`** — wrapper estilo "janela de browser" verde-neon. Borda de 2px `var(--verde-neon)`, três pontinhos no topo esquerdo (via `::before` com 3 círculos em SVG inline ou pseudo-elementos), fundo `var(--verde-escuro)`, radius `var(--raio-grande)`. Aceita `<img>` ou `.img-ph` dentro.
2. **`.cantos-neon`** — moldura de 4 cantoneiras neon sobre a foto (via `::before` e `::after` com `border-top`/`border-left` etc.), sem borda contínua. Usada em fotos-chave (hero secundário, split-imagem).
3. **`.pill-neon`** — pill amarela/neon estilo "Aprender +", "Destacar +". Fundo `var(--verde-neon)`, texto `var(--verde-escuro)`, `padding: 6px 14px`, radius 999px, fonte PolySans 600 0.82rem.
4. **`.selo-flutuante`** — círculo com borda dupla neon (estilo selo N1/NPS). Reaproveita `assets/img/elemento-nps.png` como PNG absoluto.
5. **`.titulo-contorno`** — variante de H1/H2 com efeito "outline neon": text-fill branco, `-webkit-text-stroke: 1.5px var(--verde-neon)`, `text-shadow: 3px 3px 0 rgba(0,0,0,.25)`. Aplicada só em hero e faixas institucionais.
6. **Decoração ambiente**: mais ocorrências de `elemento-asterisco`, `elemento-estrelas`, `elemento-confete`, `elemento-balao` distribuídas nas seções, com `opacity: .18–.35`, tamanhos entre 40px e 120px, animação `.deco-float`.

### CSS/tokens novos
```css
:root {
  --neon-glow: 0 0 0 3px rgba(206, 237, 45, .18);
  --moldura-borda: 2px solid var(--verde-neon);
}
```

### Aceite
- Molduras e pills funcionam isoladas de qualquer seção específica.
- `prefers-reduced-motion` continua desligando animações.

---

## §1. Hero — banner "Você na nossa história"

### Escopo
Substituir o hero atual (placeholder + gradiente + título/CTA sobre a arte) por o **banner cheio, sem texto sobreposto**.

### Comportamento
- Imagem: `assets/img/banner-home.png` (renomear a partir de `image-1787339574080.png`).
- `min-height: 68vh` desktop · `48vh` mobile. `object-fit: cover; object-position: center`.
- **Sem overlay verde, sem gradiente, sem H1/CTA por cima**. A arte já traz a mensagem.
- Logo abaixo do banner, faixa branca curta (`padding: 32px 0`) com os 2 CTAs (Matricule-se / Agende uma visita) centralizados e um subtítulo curto opcional.

### HTML
```html
<section class="hero-banner">
  <img src="assets/img/banner-home.png" alt="Coopex Colégio Boa Ideia — Você na nossa história" />
</section>
<section class="hero-acoes-faixa">
  <div class="container">
    <a href="matriculas.html" class="btn btn-primario">Matricule-se</a>
    <a href="contato.html" class="btn btn-linha">Agende uma visita</a>
  </div>
</section>
```

### CSS
- Nova classe `.hero-banner` — remove tudo que hoje está em `.hero`, `.hero-fundo`, `.hero-fundo::after`. O antigo `.hero` continua existindo pra páginas internas via `.topo-pagina`.
- `.hero-acoes-faixa` com fundo `var(--branco)`, borda inferior sutil.

---

## §2. Menu cascata (dropdowns)

### Escopo
Adicionar submenus por item, abrindo em hover (desktop) e acordeão (mobile).

### Estrutura de itens
- **Início** (sem submenu)
- **Quem Somos** → História · Missão, visão e valores · Nosso time · Estrutura
- **Níveis de Ensino** → Educação Infantil · Fundamental Anos Iniciais · Fundamental Anos Finais · Ensino Médio
- **Saiba Mais** → SAS Enem · Provinha SAS · Método Pleno · Robótica · Musicalização · Programa Bilíngue · Cobertura de eventos
- **Matrículas** (sem submenu)
- **Contato** (sem submenu)

Links de submenu levam à página correspondente com `#id` que ativa a aba certa (o `js/main.js` já processa `.tabs`; ajuste no JS pra ler `location.hash` e ativar).

### HTML (padrão por item com submenu)
```html
<li class="nav-item nav-item--tem-sub">
  <a href="quem-somos.html">Quem Somos <span class="nav-caret" aria-hidden="true">▾</span></a>
  <ul class="nav-sub">
    <li><a href="quem-somos.html#historia">História</a></li>
    <li><a href="quem-somos.html#missao">Missão, visão e valores</a></li>
    <li><a href="quem-somos.html#time">Nosso time</a></li>
    <li><a href="quem-somos.html#estrutura">Estrutura</a></li>
  </ul>
</li>
```

### CSS
- `.nav-sub`: `position: absolute; top: 100%; background: var(--verde-escuro); border-top: 2px solid var(--verde-neon); min-width: 240px; padding: 12px 0;`
- Aberto via `.nav-item--tem-sub:hover .nav-sub` (desktop) e `.nav-item.aberto .nav-sub` (mobile, controlado pelo JS).
- Mobile: submenu vira acordeão dentro do drawer, com toggle no `<a>` do item pai.

### JS (`js/main.js`)
- Handler novo `submenusMobile()`: intercepta tap no item pai (mobile), toggla `.aberto`.
- Handler novo `ativarAbaPorHash()`: no load, se `location.hash` corresponder a um `data-tab-painel`, aciona a aba certa.

### Replicação
Header e submenus se repetem nos **6 HTMLs**. Ao alterar, aplicar em todos.

---

## §8. Saiba Mais — grid 3×2 robusto

### Escopo
Redesenhar cards da seção "Saiba Mais" na home e da lista principal em `saiba-mais.html`.

### Comportamento
- Grid fixo: **3 colunas × 2 linhas** desktop · **2 colunas** tablet (`≤980px`) · **1 coluna** mobile (`≤640px`).
- Altura uniforme (`align-items: stretch`).
- Card: fundo branco, borda `var(--cinza-borda)`, radius `var(--raio-grande)`, padding 32px 28px 28px, `min-height: 260px`.
- **Ícone** no topo: círculo 56×56 com fundo `var(--verde-neon)` e o PNG da marca dentro (30×30, `filter: none`).
- **Título** PolySans 600 1.25rem, verde profundo.
- **Descrição** Neue Haas 0.95rem, cor `--texto-suave`.
- **Filete** neon 3px acima do link "Saiba mais →" (rodapé do card).
- **Hover**: `translateY(-4px)`, sombra maior, borda vira `var(--verde-neon)`.

### HTML
```html
<div class="grid-saiba-mais">
  <article class="card-saiba animar">
    <span class="card-saiba-icone"><img src="assets/img/elemento-lampada.png" alt="" /></span>
    <h3>SAS Enem</h3>
    <p>...</p>
    <a href="saiba-mais.html#sas-enem" class="card-saiba-link">Saiba mais →</a>
  </article>
  <!-- 5 outros -->
</div>
```

### CSS
Substitui o uso de `.grid-cards` + `.card` só para essa seção. Classes novas: `.grid-saiba-mais`, `.card-saiba`, `.card-saiba-icone`, `.card-saiba-link`.

---

## §7. "Vem conhecer o Boa Ideia de perto" — reformulada

### Escopo
Transformar a faixa CTA fria em bloco split com identidade visual forte.

### Layout
- Fundo `var(--verde)` full-width, padding 96px 0.
- **Esquerda (50%)**: `.moldura-janela` com foto real do colégio + `.selo-flutuante` N1 sobreposto no canto superior direito, decorações `estrelas` + `confete`.
- **Direita (50%)**: eyebrow "Vem viver um dia com a gente" (neon), H2 grande "Conheça o Boa Ideia por dentro", parágrafo curto, 2 CTAs (`Agendar visita` primário branco / `Falar no WhatsApp` linha neon), e lista `<ul class="beneficios-visita">` com 3 itens (ícone SVG + texto):
  - ⏱ Visita de ~1h
  - 👥 Tour com a coordenação
  - 📅 Agenda flexível (manhã ou tarde)

### CSS
- `.venha-visitar` — grid `1fr 1fr`, gap 64px, `align-items: center`.
- `.beneficios-visita li` — flex, gap 10px, ícone em círculo neon 32×32.
- Mobile (≤860px): 1 coluna, moldura vai pro topo com altura reduzida.

### Copy (rascunho — cliente pode ajustar)
> **Vem viver um dia com a gente**
> Conheça o Boa Ideia por dentro
> Aula-visita, tour pela estrutura e uma conversa com a coordenação — sem compromisso. É a melhor forma de sentir como é estudar aqui.

---

## §5. Cobertura de eventos — nova seção na Home

### Escopo
Bloco novo entre "Saiba Mais" e "Depoimentos" mostrando 3 coberturas recentes.

### Layout
- `.secao-alt` (fundo `--fundo-secao`).
- Cabeçalho: eyebrow "O que rolou por aqui" · H2 "Coberturas & Bastidores" · link "Ver todas →" alinhado à direita no desktop.
- Grid 3 colunas de `.card-cobertura`:
  - Foto de capa 4/3 com `.cantos-neon`.
  - Pill neon com **data** (ex.: "15/06").
  - Título do evento (PolySans 600).
  - Resumo 2 linhas.
  - Link "Ver cobertura →".

### HTML
```html
<article class="card-cobertura animar">
  <div class="card-cobertura-foto cantos-neon">
    <div class="img-ph" style="--prop:4/3;"></div>
    <span class="pill-neon card-cobertura-data">Pendente</span>
  </div>
  <h3>Pendente — nome do evento</h3>
  <p class="pendente"><strong>Pendente</strong> — resumo curto (2 linhas).</p>
  <a href="#" class="card-foto-link">Ver cobertura →</a>
</article>
```

### CSS novo
`.grid-coberturas` (grid 3 col desktop / 2 tablet / 1 mobile), `.card-cobertura`, `.card-cobertura-foto`, `.card-cobertura-data` (posicionamento absoluto no canto sup-esq da foto).

---

## §6. Carrossel "O Boa Ideia por dentro"

### Escopo
Carrossel horizontal com 6-8 fotos do colégio, formato retrato, snap-scroll, sem lib externa.

### Layout
- Seção nova antes do CTA final ("Faixa institucional").
- Cabeçalho: eyebrow "Nossa casa" · H2 "O Boa Ideia por dentro".
- Trilho: `overflow-x: auto; scroll-snap-type: x mandatory;` — cada slide `flex: 0 0 clamp(240px, 28vw, 320px)`, `aspect-ratio: 3/4`, com `.cantos-neon`.
- Controles: setas circulares neon (esq/dir), ficam sobre o trilho; dots abaixo.
- Auto-play **desligado**. `prefers-reduced-motion` esconde setas e mantém só scroll manual.

### JS
Handler novo `carrossel()`:
- Botões `<button data-carrossel-prev>` / `<button data-carrossel-next>` chamam `scrollBy({left: ±slideWidth, behavior: 'smooth'})`.
- Dots: um por slide, `IntersectionObserver` no trilho marca o ativo.

### HTML
```html
<section class="secao carrossel-secao">
  <div class="container">
    <div class="secao-cabecalho"><span class="eyebrow">Nossa casa</span><h2>O Boa Ideia por dentro</h2></div>
    <div class="carrossel" data-carrossel>
      <button class="carrossel-btn carrossel-btn--prev" data-carrossel-prev aria-label="Anterior">‹</button>
      <div class="carrossel-trilho">
        <figure class="carrossel-slide cantos-neon"><div class="img-ph" style="--prop:3/4;"></div></figure>
        <!-- repetir 6-8x -->
      </div>
      <button class="carrossel-btn carrossel-btn--next" data-carrossel-next aria-label="Próximo">›</button>
      <div class="carrossel-dots" data-carrossel-dots></div>
    </div>
    <p class="pendente"><strong>Pendente</strong> — 6 a 8 fotos reais do colégio (formato retrato ideal 900×1200).</p>
  </div>
</section>
```

---

## §3. Nosso Time — só texto

### Escopo
Substituir cards com foto em `quem-somos.html` (aba "Nosso Time") por **grid de cards de texto agrupados por área**.

### Estrutura
5 grupos, cada um em `<section class="grupo-time">` com título de grupo (H3 verde neon) e grid de cards:

- **Direção** — Patrícia Alves Lima de Morais (Diretora) · Arleide Gomes dos Santos Firmino (Vice-Diretora)
- **Coordenação Pedagógica** — Maria de Fatima Aragão (Infantil) · Fabiola Raquel Barbosa (Fund. Anos Iniciais) · Carla Érica Lima (Fund. Anos Finais) · Maria de Fátima Montenegro (Ensino Médio)
- **Apoio ao aluno** — Adriana Aragão (Psicóloga Escolar)
- **Secretaria** — Animere Texeira (Secretária) · Sioneide (Auxiliar de Secretaria)
- **Financeiro** — Ivaldete (Coordenadora Financeira) · Mirele Santana (Auxiliar Financeira)

### Card
- `.card-time-texto` — fundo `var(--branco)`, borda `1px solid var(--cinza-borda)`, radius `var(--raio)`, padding 22px 24px.
- Filete 3px `var(--verde-neon)` no topo (via `::before`).
- Nome: PolySans 600 1.05rem, `var(--verde-escuro)`.
- Cargo: Neue Haas 400 0.88rem, `var(--texto-suave)`, `margin-top: 2px`.

### CSS
`.grid-time-texto` — `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px;`.

Remover as classes `.card-pessoa` desta página (podem sobrar em outras se ainda usadas — verificar).

---

## §4. Redes sociais em todos os lugares

### Redes ativas agora
- **Instagram** — https://www.instagram.com/colegioboaideia
- **Facebook** — https://www.facebook.com/coopex.colegioboaideia/
- **YouTube** — https://www.youtube.com/@colegioboaideia
- **WhatsApp** — `.pendente` até o número chegar
- **TikTok** — comentado no HTML (`<!-- TikTok pendente -->`)

### Componente
`.redes-sociais` — flex, gap 12px, cada item `.rede-btn` é um `<a>` circular 44×44 com SVG inline (não usar font-icon). Cor: `var(--verde-neon)` sobre `transparent` em fundo escuro; invertido em hover (`background: var(--verde-neon); color: var(--verde-escuro)`).

### Locais
1. **Barra-topo** — versão mini (Instagram + WhatsApp).
2. **Footer** — bloco "Redes Sociais" completo (4 ativas + TikTok pendente).
3. **Página Contato** — versão grande (56×56), com label do @ ao lado.

### Contato / Footer — dados novos
- E-mail: `secretaria@colegioboaideia.com.br` (mailto).
- Horário: "Seg. a sex., 7h–11h30 · 13h–17h30".
- Telefone: `.pendente` até chegar.

---

## Aceite geral
- Nenhum quebra de `AGENT.md` (sem framework, sem build).
- Amarelo `#FFC900` continua **fora de uso** (decisão do cliente).
- Todos os placeholders sem conteúdo real continuam marcados com `.pendente` ou `.aviso-bloqueio`.
- Menu e footer atualizados nos **6 HTMLs**.
- Mobile testado nos breakpoints 640 / 780 / 860 / 980.
- `prefers-reduced-motion` respeitado em todas as animações novas (carrossel, floats, decorações).
