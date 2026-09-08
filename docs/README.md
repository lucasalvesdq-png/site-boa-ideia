# Documentação do projeto — Site Boa Ideia

Esta pasta reúne os documentos de referência para manter consistência entre todas as páginas do site do Coopex Colégio Boa Ideia — tanto no **tom de voz/conteúdo** quanto nos **componentes visuais (HTML/CSS)**.

## Documentos

1. **[01-briefing-do-site.md](01-briefing-do-site.md)** — o que é o projeto: objetivo, público, escopo, dados institucionais confirmados e o que ainda está pendente do cliente. Ponto de partida para entender o "porquê" do site.
2. **[02-plano-de-copy.md](02-plano-de-copy.md)** — tom de voz, pilares de mensagem e estrutura de conteúdo por página. **Status: rascunho para discussão**, ainda não aprovado — ver seção de status no topo do documento.
3. **[03-guia-de-componentes.md](03-guia-de-componentes.md)** — inventário dos componentes HTML/CSS já existentes (botões, cards, abas, seções, placeholder "pendente", elementos decorativos) para reutilizar ao construir novas páginas/seções, em vez de criar padrões novos.
4. **[sistema-de-imagens-plano.md](sistema-de-imagens-plano.md)** — estudo e plano do painel `/admin` que gerencia os banners do topo e a galeria de Cobertura de Eventos (arquitetura, custo, fases e tasks).
5. **[sistema-de-imagens-setup.md](sistema-de-imagens-setup.md)** — guia passo a passo para configurar o painel `/admin` (token do GitHub, senhas de acesso, variáveis de ambiente na Vercel).

## Como usar

Ao criar ou revisar uma página:

- Consulte o **guia de componentes** antes de escrever HTML/CSS novo — a ideia é reaproveitar o que já existe.
- Consulte o **plano de copy** (depois de aprovado) antes de escrever textos novos — para manter o mesmo tom de voz e a mesma estrutura de seções entre páginas.
- Use o **briefing** como referência de fatos do colégio (endereço, redes sociais, níveis de ensino, etc.) para não inventar informação.

Este fluxo (briefing → plano de copy aprovado → plano visual aprovado → implementação) segue o processo combinado com o usuário — ver [AGENT.md](../AGENT.md) na raiz do projeto.
