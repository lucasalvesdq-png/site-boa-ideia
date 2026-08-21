# AGENT.md

Este arquivo fornece orientação para agentes de IA (Claude Code, e outros) ao trabalhar com código neste repositório.

## O que é este projeto

Site institucional estático do **Coopex Colégio Boa Ideia**, escola em Paulo Afonso, BA. HTML/CSS/JS puro — sem framework, sem build, sem gerenciador de pacotes, sem testes.

Páginas (todas na raiz do repositório): `index.html`, `quem-somos.html`, `niveis-de-ensino.html`, `saiba-mais.html`, `portal-educacional.html`, `contato.html`.

## Rodando localmente

Não há build/dev-server. Abra os arquivos `.html` direto no navegador, ou sirva o diretório para os caminhos relativos funcionarem corretamente, ex.:

```bash
python3 -m http.server 8000
```

Não existem comandos de lint, teste ou build neste repositório.

## Arquitetura

- **Multi-página, sem sistema de templates.** Cada arquivo `.html` é um documento completo e independente. O header, o nav e o footer são duplicados literalmente nas seis páginas — ao alterar links do menu, dados de contato no rodapé ou o markup do menu mobile, é preciso atualizar os seis arquivos juntos (não há sincronização automática).
- **Um único CSS compartilhado**: `css/style.css` (~900 linhas). Cores, fontes, espaçamentos e sombras da marca são custom properties no `:root` (`--verde`, `--verde-neon`, `--branco`, `--fonte-titulo`, `--fonte-corpo`, `--raio`, `--container`, etc.) — use essas variáveis em vez de hardcodar valores.
- **Um único JS compartilhado**: `js/main.js`, vanilla, sem dependências. Cuida de: toggle do menu mobile (`.nav-toggle` / `.nav-overlay`), um widget genérico de abas (`.tabs` / `.tab-btn` / `.tab-painel`, controlado pelos atributos `data-tab` / `data-tab-painel`), estado de scroll do header (`.header--scrolled`), e animações de entrada via `IntersectionObserver` (elementos com classe `.animar` recebem `.visivel` ao entrarem na viewport).
- **Elementos decorativos da marca**: imagens em `assets/img/elemento-*.png` (asterisco, estrelas, confete, balão, círculo, lâmpada) são posicionadas de forma absoluta e inserida inline por seção via `style="top:...; left:...; --rot:...; --atraso:..."`, animadas com as classes CSS `.deco-float` / `.deco-girar`. O posicionamento é feito manualmente em cada ocorrência, não é sistematizado.
- **Padrão de conteúdo pendente**: seções/campos que ainda aguardam conteúdo real da escola usam `class="pendente"` (caixa com borda tracejada e fundo listrado) com um `<strong>Pendente — ...</strong>` descrevendo o que falta, ou `class="aviso-pendente"` para avisos menores inline (ex.: o CTA desabilitado de "Matrículas"). Quando o cliente enviar o conteúdo real, substitua o bloco `.pendente` pelo markup definitivo — não deixe o wrapper.
- **Fonte da identidade visual**: `MATERIAS DA MARCA/` contém os arquivos originais da agência **PRATEN**: PDF de identidade visual, referência oficial de cores (`CORES/CORES BOA IDEIA.txt`) e os PNGs de origem de logos/elementos. A variável `--amarelo: #ffc900` existe em `style.css` mas está intencionalmente fora de uso (decisão do cliente) — não reintroduzir amarelo na UI ativa sem confirmar com o usuário.

## Fluxo de trabalho de conteúdo

A escola (cliente) fornece o conteúdo real aos poucos, então boa parte do texto ainda está `.pendente`. O processo preferido pelo usuário neste projeto é em etapas e conversacional, não implementação direta:

1. Rascunhar copy/placeholder e discutir tom de voz e estrutura de uma seção — chegar a um plano combinado explicitamente com o usuário primeiro.
2. Só depois desse plano aprovado, discutir o redesign visual/layout da mesma área, e obter aprovação também.
3. Só então implementar as mudanças em HTML/CSS.

Não parta direto para editar markup de conteúdo ou layout sem um plano já aprovado na conversa, a menos que o usuário peça explicitamente para pular a etapa.

A pasta [docs/](docs/README.md) reúne os documentos de referência desse processo: briefing do site, plano de copy (tom de voz) e guia de componentes HTML/CSS. Consulte-os antes de escrever copy ou markup novo.

## Observação sobre o repositório

Este diretório **não é um repositório git próprio** — o `.git` mais próximo fica em `/Users/macos/Documents` (pasta pai deste diretório), e contém histórico de um projeto não relacionado (`briefing-form`). Nada dentro desta pasta "Site - Boa Ideia" está atualmente rastreado/commitado. Tenha cuidado com `git add`/`git commit` aqui: a working tree inclui várias pastas irmãs não relacionadas dentro de `~/Documents`, então evite `git add -A`/`git add .` a partir da raiz do repositório.
