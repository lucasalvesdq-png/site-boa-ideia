# Guia de componentes HTML/CSS

Inventário do que já existe em `css/style.css` e no HTML das páginas atuais. Ao construir uma seção ou página nova, procure aqui um componente equivalente antes de criar CSS novo — o objetivo é manter todas as páginas visualmente consistentes.

## Fundamentos (design tokens)

Definidos em `:root` no topo de `css/style.css`:

| Token | Valor | Uso |
|---|---|---|
| `--verde` | `#106454` | Cor primária da marca (fundo de header, títulos, texto de destaque) |
| `--verde-neon` | `#CEED2D` | Cor de destaque/CTA — usar com moderação, nunca como cor de fundo dominante |
| `--verde-escuro` | `#0b4a3f` | Hover/contraste, footer, faixas escuras |
| `--branco` | `#ffffff` | Fundo padrão |
| `--amarelo` | `#ffc900` | **Fora de uso ativo** — mantido só como referência histórica, não usar sem confirmar com o usuário |
| `--texto` | `#12241f` | Texto padrão sobre fundo claro |
| `--texto-claro` | `#eef7f3` | Texto sobre fundo verde/escuro |
| `--cinza-borda` | `#d8e3df` | Bordas de cards |
| `--fundo-secao` | `#f4f9f6` | Fundo de seções alternadas (`.secao-alt`) |
| `--fonte-titulo` | PolySans → Neue Haas Display → sans-serif | `h1`–`h4`, botões, labels de destaque |
| `--fonte-corpo` | Neue Haas Display → sans-serif | Texto corrido |
| `--raio` | `16px` | Border-radius padrão de cards/blocos |
| `--container` | `1160px` | Largura máxima do conteúdo (`.container`) |

Não hardcode cores/fontes/raios — sempre referencie a variável.

## Layout base

- `.container` — largura máxima `1160px`, centralizado, padding lateral 24px. Todo bloco de conteúdo fica dentro de um `.container`.
- `.secao` — seção de página com padding vertical de 96px. Variante `.secao-alt` adiciona fundo pontilhado claro (`--fundo-secao`) para alternar contraste entre seções consecutivas.
- `.secao-cabecalho` — título de seção centralizado (max-width 640px) com um traço verde-neon de 44px abaixo do `h2`. Use em todo início de seção com título.
- `.pagina-topo` — faixa de topo das páginas internas (todas exceto Início), fundo em gradiente verde, com `.breadcrumb` + `h1`. Ver `quem-somos.html` como referência.
- `.breadcrumb` — trilha "Início / Página Atual", só aparece dentro de `.pagina-topo`.

## Header, navegação e footer

Duplicados em todas as páginas (ver [AGENT.md](../AGENT.md)). Não criar variações — o header/nav/footer devem ser idênticos byte-a-byte entre páginas, exceto pelo link com `aria-current="page"` marcando a página atual.

- `.header` — fixo no topo (`position: sticky`), fundo verde; ganha `.header--scrolled` via JS ao rolar a página (blur + sombra).
- `.nav-toggle` / `.nav-overlay` — menu mobile (abaixo de 860px), controlado por `js/main.js`.
- `.footer` — fundo verde-escuro com onda SVG no topo (`.footer-wave`), grid de colunas (`repeat(auto-fit, minmax(200px, 1fr))`): endereço, contato, redes sociais, selo da mantenedora (`.footer-selo`).

## Botões

Classe base `.btn` (pill, min-height 44px, fonte de título) + um modificador:

- `.btn-primario` — fundo verde-neon em gradiente, texto verde-escuro. Uso: CTA principal (ex.: "Matrículas" no hero).
- `.btn-secundario` — contorno, transparente, inverte para fundo branco no hover. Uso: CTA secundário (ex.: "Fale conosco").
- `.btn-matriculas` — variante do primário com borda tracejada e um tooltip `.aviso-pendente` que aparece no hover/focus (usado enquanto o destino do botão de matrículas não é confirmado). **Remover a borda tracejada e o aviso assim que o link de matrículas for definido** — nesse momento ele deve virar um `.btn-primario` normal.

## Cards e grids

- `.grid-cards` — grid responsivo (`repeat(auto-fit, minmax(240px, 1fr))`), usado para qualquer conjunto de cards (níveis, projetos, missão/visão/valores etc.).
- `.card` — fundo branco, borda cinza, sombra sutil, barra verde-neon no topo que aparece no hover (`::before` com `scaleX`). Contém opcionalmente `img.icone` (36×36px) + `h3` + texto.
- `.grid-niveis` — variante de `.grid-cards` onde a barra de cor do `::before` fica sempre visível (não só no hover) e alterna entre 4 tons verdes/neon por posição — usada especificamente na prévia de Níveis de Ensino da Home.

## Abas (tabs)

**Padrão obrigatório de navegação para todas as páginas internas** (todas exceto a Home) que tenham mais de um bloco de conteúdo depois do `.topo-pagina`: cada bloco vira uma aba, em vez de seções empilhadas com scroll. Hoje em uso em `quem-somos.html`, `niveis-de-ensino.html`, `saiba-mais.html`, `matriculas.html` e `contato.html`. A Home (`index.html`) é a única exceção — continua com seções em scroll normal.

`portal-educacional.html` é a única página interna que **não** usa abas, porque tem apenas um bloco de conteúdo (a escolha entre Portal do Aluno/Professor) — abas só fazem sentido a partir de 2+ blocos.

Estrutura HTML (ver `niveis-de-ensino.html` ou `quem-somos.html`):

```html
<section class="secao">
  <div class="container">
    <div class="tabs">
      <ul class="tab-lista" role="tablist">
        <li><button class="tab-btn" role="tab" data-tab="id-a" aria-selected="true">Aba A</button></li>
        <li><button class="tab-btn" role="tab" data-tab="id-b" aria-selected="false">Aba B</button></li>
      </ul>
      <div class="tab-painel" role="tabpanel" data-tab-painel="id-a" data-ativo="true">...</div>
      <div class="tab-painel" role="tabpanel" data-tab-painel="id-b" data-ativo="false">...</div>
    </div>
  </div>
</section>
```

Toda a página (exceto `.topo-pagina` no início e `.faixa-cta` no fim) fica dentro de uma única `<section class="secao">` envolvendo o `.tabs` — não uma `<section>` por bloco. Cada bloco antigo vira um `.tab-painel`, mantendo seu layout interno original (`.grid-cards`, `.split`, `.galeria`, `.acordeao`, `.linha-tempo` etc.) e seu próprio `.secao-cabecalho` ou `.eyebrow`/`h2`. Como só um painel fica visível por vez, não use `.secao-alt` dentro de painel — a alternância de fundo entre blocos deixa de fazer sentido.

O comportamento (trocar aba, atualizar `aria-selected`/`data-ativo`) é genérico em `js/main.js` — não precisa de JS novo, só seguir os atributos `data-tab` / `data-tab-painel` combinando entre botão e painel.

## Placeholder de conteúdo pendente

Dois níveis, conforme o tamanho do espaço:

- **Bloco** — `<div class="pendente">` com `<strong>Pendente — Título</strong>` seguido de uma frase explicando o que falta. Renderiza como caixa tracejada verde com fundo listrado.
- **Inline** — `<span class="aviso-pendente">` dentro de um botão/link, aparece como tooltip no hover (ver `.btn-matriculas`).

Ao receber o conteúdo real do colégio, o bloco `.pendente` é **substituído** pelo markup definitivo (texto, `.grid-cards`, imagens etc.) — não deixar o wrapper por perto do conteúdo real.

## Elementos decorativos de marca

Imagens `assets/img/elemento-*.png` (asterisco, asterisco traçado, estrelas, confete, balão, círculo, lâmpada), posicionadas de forma absoluta dentro de uma seção com `position`, `opacity` e rotação (`--rot`) definidos inline via `style=""`, usando uma das duas classes:

- `.deco-float` — flutua suavemente para cima/baixo (`--atraso` controla o delay de início, para dessincronizar elementos).
- `.deco-girar` — rotação contínua lenta (22s).

Ficam ocultos em telas ≤640px dentro de `.hero`/`.pagina-topo` (`@media (max-width: 640px)`). Ao adicionar uma seção nova, é aceitável reaproveitar os mesmos PNGs com posições/opacidades novas — não é necessário criar elementos gráficos novos.

## Animação de entrada no scroll

Qualquer elemento com classe `.animar` começa invisível/deslocado e ganha `.visivel` (fade + slide-up) quando entra na viewport, via `IntersectionObserver` em `js/main.js`. Dentro de `.grid-cards`, os 4 primeiros filhos têm delays escalonados predefinidos (`0s, .1s, .15s, .2s`). Use `.animar` em qualquer bloco novo que deva animar ao rolar a página — não precisa de JS adicional.

Respeita `prefers-reduced-motion: reduce` (desliga todas as animações/decorações automaticamente).

## Breakpoints responsivos usados hoje

- `860px` — menu mobile (nav vira drawer lateral), hero empilha em coluna única.
- `640px` — some com elementos decorativos (`.deco`) no hero/topo de página interna.

Reaproveite esses dois breakpoints em vez de introduzir novos, a menos que um componente novo realmente precise de um ponto de quebra diferente.
