# Colocar o site no ar na HostGator

Passo a passo para publicar o site do Coopex Colégio Boa Ideia numa conta de
hospedagem compartilhada da HostGator (cPanel), com o painel `/admin`
funcionando.

O site é estático (HTML/CSS/JS) e o painel passou a rodar em **PHP** — que é o
que a hospedagem compartilhada oferece. Não é preciso Node, build nem GitHub no
servidor.

---

## O que mudou em relação à Vercel

| | Vercel (antes) | HostGator (agora) |
|---|---|---|
| Páginas do site | arquivos estáticos | iguais, sem alteração |
| Endpoints do painel | `api/*.js` (Vercel Functions, Node) | `api/*.php` |
| Onde o painel grava | commit no repositório GitHub | direto na pasta do site (`public_html`) |
| Segredos | variáveis de ambiente na Vercel | arquivo `api/config.php`, fora do repositório |
| Rotas e cache | `vercel.json` | `.htaccess` na raiz |

Os arquivos `api/*.js` e o `vercel.json` continuam no repositório (a Vercel
segue funcionando enquanto você quiser), mas **não são enviados** para a
HostGator — o script de deploy já os exclui.

Consequência importante: na HostGator, a imagem publicada pelo painel fica
**só no servidor**. Ela não volta para o repositório como acontecia na Vercel.
Para ter uma cópia local do que a escola publicou, baixe `content/` e
`assets/img/` pelo FTP de tempos em tempos.

---

## 1. Gerar as credenciais do painel

Na sua máquina, dentro da pasta do projeto:

```bash
node scripts/gerar-credenciais-php.mjs "escola" "a-senha-escolhida"
```

O script imprime um arquivo `config.php` completo. Salve essa saída em
`api/config.php`:

- a senha em texto puro **não** é gravada em lugar nenhum — só o hash;
- `api/config.php` está no `.gitignore` e nunca vai para o repositório;
- para adicionar outra pessoa depois, rode o script de novo e copie só o
  bloco do usuário para dentro de `ADMIN_USERS`, mantendo o `SESSION_SECRET`
  que já existe.

## 2. Montar o pacote de upload

```bash
bash scripts/deploy-hostgator.sh
```

Isso cria `.deploy/hostgator/` com exatamente o que vai para o ar — sem a pasta
`MATERIAS DA MARCA`, sem `docs/`, sem `scripts/`, sem `.git`, sem os arquivos da
Vercel. São ~975 arquivos, ~292 MB (a maior parte: fotos de eventos e os 3
vídeos de depoimentos).

O script confirma no final se o `api/config.php` entrou no pacote.

## 3. Criar o acesso FTP no cPanel

1. Entre no cPanel da HostGator.
2. **Arquivos → Contas de FTP**.
3. Use a conta principal ou crie uma só para o deploy, com diretório
   `/public_html`.
4. Anote: servidor (`ftp.seudominio.com.br`), usuário, senha, porta 21.

## 4. Enviar pelo FileZilla

1. Baixe o FileZilla (filezilla-project.org) e conecte com os dados acima.
2. No lado direito (servidor), entre em `public_html`.
3. Se já houver um site antigo ali (`default.html`, `cgi-bin`, instalações
   anteriores), **faça backup antes** — cPanel → Backup → baixar o home
   directory — e só então limpe a pasta.
4. No lado esquerdo (sua máquina), abra `.deploy/hostgator/`.
5. Selecione **todo o conteúdo** da pasta (não a pasta em si) e arraste para
   `public_html`.
6. Confirme que o `.htaccess` foi junto: no FileZilla, **Servidor → Forçar
   exibição de arquivos ocultos**. Deve existir `public_html/.htaccess` e
   `public_html/api/.htaccess`.

O upload de ~292 MB leva de 30 min a algumas horas, dependendo da sua internet.
Se cair, é só reconectar e arrastar de novo: o FileZilla pergunta o que fazer
com os arquivos já enviados (escolha "sobrescrever se diferente").

## 5. Conferir no ar

Com o domínio já apontando para a HostGator:

- `seudominio.com.br` → a home carrega, o carrossel do topo gira;
- `seudominio.com.br/saiba-mais.html` → a Cobertura de Eventos lista os eventos;
- `seudominio.com.br/admin` → tela de login do painel;
- entre no painel, troque uma imagem, publique, e recarregue a home: a imagem
  nova precisa aparecer na hora.

## 6. Ativar o HTTPS

1. cPanel → **SSL/TLS Status** → confirme que o domínio tem certificado
   (a HostGator emite um gratuito automaticamente; pode levar algumas horas
   após o domínio apontar para o servidor).
2. Com o cadeado funcionando em `https://seudominio.com.br`, edite o
   `.htaccess` da raiz e **descomente** as duas linhas do bloco `---- HTTPS ----`.
3. Teste de novo. Só depois disso o cookie de sessão do painel passa a ser
   enviado com a marca `Secure`.

---

## Resolução de problemas

**"Internal Server Error" em todo o site**
O `.htaccess` usa um módulo que a conta não tem. Renomeie-o para `.htaccess.bak`
pelo Gerenciador de Arquivos: se o site voltar, reponha os blocos aos poucos
para descobrir qual é.

**O painel abre, mas o login dá "Falha de conexão"**
A chamada `/api/login` não está virando `api/login.php`. Verifique se o
`.htaccess` da raiz subiu (arquivos ocultos no FileZilla) e se o `mod_rewrite`
está ativo na conta.

**Login retorna "Sessão não configurada no servidor"**
Falta o `api/config.php` no servidor, ou o `SESSION_SECRET` está vazio.

**Publicar uma imagem dá erro de permissão**
As pastas precisam ser graváveis pelo usuário do PHP. No Gerenciador de
Arquivos, confira `assets/img/`, `assets/img/eventos/` e `content/`: pastas
`755`, arquivos `644`, dono igual ao da conta.

**Publicar imagem grande falha com erro de tamanho**
O `post_max_size` do PHP da conta é menor que a imagem enviada. cPanel →
**Selecionar versão do PHP → Options** e aumente `post_max_size` e
`upload_max_filesize` para 16M. O painel já recusa acima de ~3 MB por imagem.

**A home mostra o banner antigo depois de publicar**
Dê um refresh forçado (Cmd/Ctrl + Shift + R). Se persistir, confirme que o
bloco `no-store` do `.htaccess` está ativo para `banners.json`/`eventos.json`.

---

## Atualizações seguintes

Mudou HTML/CSS/JS na sua máquina:

```bash
bash scripts/deploy-hostgator.sh
```

e, no FileZilla, arraste só os arquivos alterados (ou a pasta toda — o
FileZilla sobrescreve só o que mudou, se você escolher "sobrescrever se
diferente").

Cuidado para **não sobrescrever `content/banners.json`, `content/eventos.json`
e `assets/img/eventos/`** com as versões da sua máquina se a escola já tiver
publicado coisas pelo painel — esses são os arquivos que o painel edita no
servidor. Baixe-os antes pelo FTP e substitua os locais pelos do servidor.
