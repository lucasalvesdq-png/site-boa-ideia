# Sistema de gerenciamento de imagens — Plano de implementação

> **Status:** aprovado e implementado (08/09/2026, [PR #1](https://github.com/lucasalvesdq-png/site-boa-ideia/pull/1), mesclado no `main`). Em produção na Vercel.
>
> **Atualização v2 (08/09/2026):** o escopo original abaixo descreve a v1 (banner único por slot; galeria de eventos como fotos soltas). Depois de testado em produção, o usuário pediu duas mudanças, já implementadas:
> - **Banners com versão desktop e mobile** — cada um dos 3 banners agora tem 2 imagens (`content/banners.json`: `{desktop, mobile, alt, link}`), e o site escolhe qual mostrar pelo tamanho da tela (ponto de corte 640px).
> - **Cobertura de Eventos por evento**, não por foto solta — `content/eventos.json` passou a ser uma lista de eventos (`{id, titulo, descricao, data, capa, fotos[]}`). A aba "Cobertura de Eventos" mostra um card por evento (capa + título + descrição); ao clicar, abre `evento.html?id=<id>` — uma página-modelo única que lê o evento certo pela URL e mostra a galeria completa daquele evento. O painel ganhou um editor de eventos (capa, título, descrição, data) com uma sub-galeria de fotos por evento (adicionar/remover/reordenar/legendar), tudo arrastável.
>
> O restante deste documento (arquitetura, custo, riscos) permanece válido — só o formato dos dois manifestos JSON e a UI do painel mudaram.

## 1. Objetivo

Permitir que **você e a equipe da escola** (secretaria/marketing, sem conhecimento técnico) troquem e adicionem imagens no site **sem mexer em código**, por um painel com **login próprio (usuário e senha)**. Escopo das imagens gerenciáveis:

1. **Os 3 banners** do topo da home (`index.html`, hoje fixos: `banner-1/2/3.png`).
2. **A galeria de "Cobertura de Eventos"** (`saiba-mais.html`, hoje ~30 fotos fixas, cada uma com legenda) — trocar, **adicionar**, remover, reordenar e legendar.

**Restrição inegociável:** custo **R$ 0,00**, permanente, sem serviço que possa pausar/expirar/sumir.

## 2. A decisão de arquitetura (o "estudo")

O site é **estático**, hospedado na **Vercel** e conectado ao **GitHub** (`lucasalvesdq-png/site-boa-ideia`). Todo push no `main` já republica sozinho. Sobre isso, comparei os caminhos gratuitos:

| Caminho | Custo | Pausa/expira sozinho? | Login usuário+senha p/ leigos | Serviços novos | Veredito |
|---|---|---|---|---|---|
| **Painel próprio (Vercel Functions) + imagens no GitHub** | R$ 0 permanente | Não | ✅ Sim | Nenhum | ✅ **Escolhido** |
| CMS via Git (Sveltia/Decap) | R$ 0 | Não | ❌ Exige conta GitHub p/ cada pessoa | Nenhum | Reprovado no requisito de login |
| Supabase (storage+banco grátis) | R$ 0 | ⚠️ Pausa após ~1 semana sem acesso → galeria quebra | ✅ | Sim | Arriscado p/ site de escola |
| Cloudinary / outro storage externo | R$ 0 (limitado) | Não | ✅ | Sim | Serviço extra desnecessário na escala atual |

### Arquitetura escolhida — "painel próprio + GitHub como cofre das imagens"

```
┌───────────────────┐        login (usuário/senha)        ┌──────────────────────────┐
│  Equipe da escola │ ─────────────────────────────────▶ │  /admin (painel no site)  │
│  (navegador)      │ ◀───────────────────────────────── │  tela visual de upload    │
└───────────────────┘                                     └──────────┬───────────────┘
                                                                      │ chama funções seguras
                                                                      ▼
                                                        ┌──────────────────────────────┐
                                                        │  Vercel Functions (/api/*)    │
                                                        │  • confere senha (sessão)     │
                                                        │  • recebe imagem otimizada    │
                                                        │  • grava no GitHub via token  │
                                                        └──────────────┬───────────────┘
                                                                       │ commit (imagem + manifesto)
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │  GitHub (repositório)         │──▶ Vercel
                                                        │  imagens + arquivos de dados  │    republica
                                                        └──────────────────────────────┘    o site
```

**Por que essa é a melhor forma:**

- **Grátis pra sempre e sem pegadinhas:** usa só o que você já tem (GitHub + Vercel). Sem banco de dados que pausa, sem cota que estoura, sem serviço de terceiro que pode virar pago.
- **Login usuário+senha de verdade:** a equipe entra com usuário e senha no *nosso* painel. Ninguém precisa de conta GitHub. Nos bastidores, o servidor usa **um único token secreto** (que fica guardado na Vercel, nunca aparece pro usuário nem no site público) para gravar as imagens no repositório.
- **Conteúdo separado do código:** as páginas passam a ler as imagens de um **arquivo de dados** (manifesto). Você nunca mais edita HTML pra trocar foto.
- **Histórico e recuperação:** como tudo vira commit no GitHub, dá pra ver o que mudou e voltar atrás se subir a imagem errada.
- **Publicação automática:** salvou no painel → Vercel republica o site em segundos.

**Único trade-off:** as imagens ficam versionadas no repositório (cresce com o tempo). Mitigação: **otimização automática no upload** (redimensiona + comprime antes de salvar). Na escala de uma escola isso mantém o repo tranquilo por muitos anos. Se um dia a galeria ficar gigante, a evolução natural é mover as imagens para o **Cloudflare R2** (10 GB grátis, sem custo de tráfego) — sem trocar o painel, só o destino do arquivo.

## 3. Como fica para quem usa (experiência final)

1. Acessa `site-boa-ideia.vercel.app/admin` (ou o domínio próprio, quando houver).
2. Faz login com **usuário e senha**.
3. Vê duas seções:
   - **Banners do topo:** os 3 quadros. Clica em um, escolhe/arrasta a nova imagem, ajusta o texto alternativo (acessibilidade) e o link opcional. Salva.
   - **Cobertura de Eventos:** grade de fotos. Botão "Adicionar foto", campo de legenda em cada uma, arrastar para reordenar, remover. Salva.
4. Mensagem "Publicado! O site atualiza em alguns segundos." Pronto.

## 4. Modelo de dados (os "manifestos")

Dois arquivos JSON versionados no repositório, editados pelo painel e lidos pelo site:

`content/banners.json`
```json
[
  { "img": "assets/img/banner-1.png", "alt": "Você na nossa história", "link": "" },
  { "img": "assets/img/banner-2.png", "alt": "Sua história começa aqui", "link": "" },
  { "img": "assets/img/banner-3.png", "alt": "Matrículas abertas", "link": "matriculas.html" }
]
```

`content/eventos.json`
```json
[
  { "img": "assets/img/eventos/foto-2026-06-festa-junina.jpg", "legenda": "Festa Junina: apresentação no palco." }
]
```

Serão **pré-preenchidos com o conteúdo atual** do site, para nada mudar visualmente ao ligar o sistema.

## 5. Componentes a construir

**Frontend público (adaptação do site atual):**
- `index.html` — o hero passa a renderizar os slides a partir de `content/banners.json` (via JS). Comportamento do carrossel atual é mantido.
- `saiba-mais.html` — a galeria passa a renderizar as fotos a partir de `content/eventos.json`.
- `js/main.js` — pequeno renderizador que lê os manifestos antes de os carrosséis iniciarem. Com *fallback*: se falhar, mantém um conteúdo mínimo (não quebra a página).

**Painel administrativo (novo):**
- `admin/index.html` + `admin/admin.css` + `admin/admin.js` — tela de login e o gerenciador visual (banners + eventos), com upload por arrastar-e-soltar e **otimização da imagem no próprio navegador** (redimensiona/comprime antes de enviar — deixa as funções leves e o repo enxuto).

**Backend (Vercel Functions, sem nenhuma dependência externa — só recursos nativos do Node):**
- `api/login.js` — confere usuário/senha (comparação segura com hash) e emite um **cookie de sessão assinado**.
- `api/logout.js` — encerra a sessão.
- `api/publish.js` — confere a sessão, recebe as imagens já otimizadas + o manifesto e **grava no GitHub** (API de conteúdo) usando o token secreto. Um commit por publicação.
- `api/session.js` — informa ao painel se o login ainda é válido.

**Segurança:**
- Senhas guardadas como **hash** (scrypt nativo), nunca em texto puro.
- Segredos (token do GitHub, chave de assinatura da sessão, usuários) **só em variáveis de ambiente da Vercel** — nunca no repositório (que é público).
- Sessão via cookie **HttpOnly** assinado, com expiração.
- Todas as funções conferem a sessão antes de gravar qualquer coisa.

## 6. O que **você** vai precisar fazer (uma vez só — eu te guio passo a passo)

Eu não posso (por segurança) criar credenciais ou digitá-las por você. No fim da implementação, você fará 2 coisas rápidas, com um guia que vou deixar pronto (`docs/sistema-de-imagens-setup.md`):

1. **Gerar 1 token no GitHub** (fine-grained, só com permissão de "Contents" neste repositório) e definir **usuário(s)/senha(s)** do painel.
2. **Colar essas informações como variáveis de ambiente na Vercel** (`GITHUB_TOKEN`, `SESSION_SECRET`, `ADMIN_USERS`, `GITHUB_REPO`, `GITHUB_BRANCH`). Um comando/formulário — sem programar.

Vou preparar um script que gera o hash das senhas pra você, pra nem isso você precisar fazer na mão.

## 7. Plano de implementação (fases e tasks)

### Fase 0 — Preparação (sem risco ao site no ar)
- [x] **T0.1** Criar `content/banners.json` e `content/eventos.json` já preenchidos com o conteúdo atual.
- [x] **T0.2** Criar a pasta `assets/img/eventos/` e (opcional) reorganizar as fotos de evento para lá.

### Fase 1 — Deixar o site público "data-driven" (dirigido por dados)
- [x] **T1.1** Home: renderizar os 3 banners a partir de `banners.json`, mantendo o carrossel de 3s.
- [x] **T1.2** Saiba mais: renderizar a galeria a partir de `eventos.json`, mantendo legendas, lazy-load e o "ampliar imagem".
- [x] **T1.3** *Fallback* e verificação: página não quebra se o JSON faltar; testar no preview.

### Fase 2 — Backend seguro (Vercel Functions)
- [x] **T2.1** `api/login.js` + `api/session.js` + `api/logout.js` (sessão assinada, hash de senha).
- [x] **T2.2** `api/publish.js` (grava imagem + manifesto no GitHub via token).
- [x] **T2.3** Utilitário de sessão/segurança compartilhado, sem dependências.

### Fase 3 — Painel administrativo
- [x] **T3.1** Tela de login (`admin/`).
- [x] **T3.2** Gerenciador de **Banners** (trocar imagem, alt, link).
- [x] **T3.3** Gerenciador de **Cobertura de Eventos** (adicionar, remover, reordenar, legendar).
- [x] **T3.4** Otimização de imagem no navegador (resize + compressão) antes do envio.
- [x] **T3.5** Estados de carregando/sucesso/erro e proteção contra envio duplicado.

### Fase 4 — Configuração, guia e verificação
- [x] **T4.1** `docs/sistema-de-imagens-setup.md` — guia ilustrado do que configurar (token + variáveis).
- [x] **T4.2** Script gerador de hash de senha (`scripts/gerar-senha.mjs`).
- [x] **T4.3** Teste ponta a ponta no preview da Vercel (subir uma foto de verdade e ver publicar).
- [x] **T4.4** Ajustes finais de UX do painel.

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Repositório crescer com muitas fotos | Otimização automática no upload; caminho de evolução para Cloudflare R2 sem trocar o painel |
| Vazamento de senha/token | Segredos só em env vars da Vercel; hash de senha; cookie HttpOnly assinado; repo nunca guarda segredo |
| Envio de imagem enorme | Limite de tamanho + redimensionamento no navegador antes do upload |
| Publicar imagem errada | Histórico no Git permite reverter; confirmação antes de remover |
| Termos do plano Hobby da Vercel | Situação já existente do site; se necessário no futuro, migração para Cloudflare Pages (também grátis) é simples |

## 9. Custo

**R$ 0,00** de setup e **R$ 0,00** recorrente. Nenhuma assinatura, nenhum cartão, nenhum serviço pago. Depende apenas das contas gratuitas que você já usa (GitHub + Vercel).

## 10. Migração futura: quando o site em produção for pra HostGator

Combinado em 08/09/2026: quando o domínio definitivo do colégio for hospedado na **HostGator** (hospedagem compartilhada, cPanel), o painel `/admin` e as funções de backend (`api/*.js`) **não** vão junto — hospedagem compartilhada comum da HostGator não roda Node.js (só PHP), então essas funções não sobem lá como estão.

**Decisão registrada — Caminho A, arquitetura híbrida:**

- A **HostGator** passa a hospedar só o site visível ao público: as páginas HTML/CSS/JS e as imagens fixas (logos, elementos decorativos, fotos de níveis de ensino, etc.), via FTP ou o "Git Version Control" do cPanel, se o plano tiver.
- O **painel `/admin` e as 4 funções continuam na Vercel** (permanece grátis — só a escola acessa esse endereço, o público nunca precisa dele), gravando as imagens/manifestos no GitHub exatamente como hoje.
- `js/content.js` passa a buscar `content/banners.json` e `content/eventos.json` (e as imagens neles referenciadas) de um **endereço fixo** apontando para a Vercel/GitHub, em vez de um caminho relativo ao próprio domínio — com CORS liberado nesse endereço. Assim, uma publicação feita no painel aparece no site hospedado na HostGator automaticamente, sem nenhuma integração adicional.
- Segredos (token do GitHub, senhas) continuam nunca chegando perto da HostGator — mais seguro, já que hospedagem compartilhada tem menos isolamento entre sites que a Vercel.

**Por que esse caminho e não reescrever tudo em PHP para rodar 100% na HostGator:** o Caminho A não exige nenhuma mudança no que já foi testado e aprovado, mantém o histórico/reversão de imagens via Git, e continua R$ 0,00. Reescrever em PHP (Caminho B) foi considerado e descartado por enquanto — mais trabalho, perde o histórico de commits, e não traz benefício real dado que a Vercel free tier não tem custo nem depende do domínio final do site.

**Quando a migração acontecer**, o ajuste é pequeno: mudar o endereço buscado em `js/content.js` (2 arquivos: `index.html` e `saiba-mais.html` usam o mesmo script) e liberar CORS na Vercel — sem tocar no painel, no backend ou nos manifestos.
