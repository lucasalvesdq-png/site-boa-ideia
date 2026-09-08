# Painel de imagens (/admin) — Guia de configuração

> Leia isto depois de aprovar o [plano](sistema-de-imagens-plano.md). São 2 passos, feitos **uma única vez**, direto no site do GitHub e no site da Vercel (sem programar nada). Leva uns 10 minutos.

## O que você vai configurar

O painel em `/admin` precisa de **5 variáveis de ambiente** guardadas na Vercel (nunca no repositório, que é público):

| Variável | O que é |
|---|---|
| `GITHUB_TOKEN` | Uma "senha de robô" que autoriza o painel a gravar arquivos no seu repositório |
| `GITHUB_REPO` | `lucasalvesdq-png/site-boa-ideia` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | Uma chave aleatória, só para assinar o cookie de login |
| `ADMIN_USERS` | A lista de usuário(s)/senha(s) de quem pode entrar no painel |

---

## Passo 1 — Criar o token do GitHub

Esse token dá ao painel permissão **apenas** para gravar conteúdo neste repositório (nada mais — não dá acesso à sua conta, outros repositórios, configurações, etc.).

1. Acesse: **https://github.com/settings/personal-access-tokens/new**
2. Preencha:
   - **Token name:** `boaideia-admin`
   - **Expiration:** escolha "No expiration" (ou o prazo mais longo disponível — se expirar, é só gerar outro token e trocar a variável na Vercel)
   - **Resource owner:** sua conta (`lucasalvesdq-png`)
   - **Repository access:** "Only select repositories" → selecione **`site-boa-ideia`**
   - **Permissions → Repository permissions:** clique em "Contents" e mude para **"Read and write"** (é a única permissão necessária)
3. Clique em **"Generate token"**.
4. Copie o token gerado (começa com `github_pat_...`) — o GitHub só mostra ele **uma vez**. Cole num lugar seguro por enquanto (você vai colar na Vercel no Passo 3).

## Passo 2 — Gerar a senha de cada pessoa que vai usar o painel

No seu computador, dentro da pasta do projeto, rode (troque o usuário e a senha pelos que quiser):

```bash
node scripts/gerar-senha.mjs "secretaria" "escolha-uma-senha-forte-aqui"
```

Isso mostra algo assim no terminal:

```json
{
  "username": "secretaria",
  "salt": "f79220f7d1710efa84debf86210b73d5",
  "hash": "169ae342380ca6fa7e2e5c666caf7eddd4..."
}
```

**Repita o comando para cada pessoa** que vai ter login próprio (ex.: você e alguém da secretaria), e junte todas as entradas num único array. Exemplo com duas pessoas:

```json
[
  { "username": "lucas", "salt": "...", "hash": "..." },
  { "username": "secretaria", "salt": "...", "hash": "..." }
]
```

Esse array completo é o valor da variável `ADMIN_USERS` (Passo 3). A senha em texto puro **não fica salva em nenhum arquivo** — só esse hash, que não pode ser revertido para descobrir a senha original.

## Passo 3 — Colar as variáveis na Vercel

1. Acesse o projeto na Vercel: **https://vercel.com** → o projeto `site-boa-ideia`.
2. Vá em **Settings → Environment Variables**.
3. Adicione uma de cada vez (marque os 3 ambientes: Production, Preview e Development):

   | Name | Value |
   |---|---|
   | `GITHUB_TOKEN` | o token gerado no Passo 1 (`github_pat_...`) |
   | `GITHUB_REPO` | `lucasalvesdq-png/site-boa-ideia` |
   | `GITHUB_BRANCH` | `main` |
   | `SESSION_SECRET` | qualquer texto longo e aleatório — pode gerar um rodando `openssl rand -hex 32` no terminal, ou apenas digitar uma frase longa e única |
   | `ADMIN_USERS` | o array JSON completo gerado no Passo 2 (copie e cole tudo, incluindo os colchetes `[` `]`) |

4. Clique em **Save** em cada uma.
5. Vá em **Deployments** → nos "..." do último deploy → **Redeploy** (para as novas variáveis valerem).

## Passo 4 — Testar

1. Acesse `https://site-boa-ideia.vercel.app/admin`.
2. Entre com o usuário/senha que você definiu no Passo 2.
3. Troque um banner ou adicione uma foto de evento, escreva a legenda, clique em **Publicar no site**.
4. Espere a mensagem "Publicado! O site atualiza em alguns segundos." e confira o site — a mudança aparece sozinha em ~30-60s (tempo da Vercel republicar).

Se algo der erro na publicação, a mensagem que aparece já diz o motivo mais provável (sessão expirada → faça login de novo; variável não configurada → revise o Passo 3).

## Adicionando ou removendo uma pessoa depois

- **Adicionar:** rode o `gerar-senha.mjs` para a nova pessoa, pegue a entrada gerada e acrescente ao array de `ADMIN_USERS` na Vercel (Settings → Environment Variables → editar) → Redeploy.
- **Remover/trocar senha:** edite a mesma variável removendo a entrada, ou gere uma nova senha para a mesma pessoa e substitua a entrada dela → Redeploy.

## Segurança — o que fica onde

- O **token do GitHub** e a **chave de sessão** ficam só na Vercel — nunca aparecem no código, no navegador ou em qualquer lugar público.
- As **senhas** ficam guardadas como hash (não reversível) — nem você mais tarde consegue "ver" a senha original, só redefinir uma nova.
- Cada publicação vira um **commit no GitHub**, com o nome de quem publicou — então dá para ver o histórico completo em `github.com/lucasalvesdq-png/site-boa-ideia/commits/main` e reverter qualquer troca indesejada.
