/* content.js — busca content/banners.json e content/eventos.json e renderiza
   o carrossel do hero e os cards de Cobertura de Eventos a partir deles.

   Roda ANTES de main.js. Se a busca falhar ou demorar demais, o markup
   estático que já está no HTML (idêntico ao conteúdo padrão) continua
   funcionando normalmente — a página nunca fica quebrada por causa disto.

   main.js aguarda `window.__boaIdeiaContentPromise` antes de inicializar o
   carrossel do hero, os cards de eventos e o observador de animações, para
   que tudo funcione tanto no conteúdo padrão quanto no conteúdo já trocado
   pelo painel administrativo (/admin).

   Estrutura de dados (ver docs/sistema-de-imagens-plano.md):
   - banners.json: cada banner tem imagem para "desktop" e para "mobile"
     (a mais estreita que 640px, mesmo ponto de corte usado no resto do
     site) — trocam sozinhas se a tela for redimensionada/rotacionada.
   - eventos.json: cada evento tem capa + título + descrição; ao clicar,
     abre evento.html?id=<id> com todas as fotos daquele evento. */
(function () {
  "use strict";

  var PONTO_CORTE_MOBILE = "(max-width: 640px)";

  function aguardarNoMaximo(ms) {
    return new Promise(function (resolver) {
      setTimeout(resolver, ms);
    });
  }

  // ---------- banners (home) ----------

  function renderBanners(banners) {
    if (!Array.isArray(banners) || !banners.length) return;
    var trilho = document.querySelector("#hero-carrossel .carrossel-trilho");
    var pontosWrap = document.querySelector("#hero-carrossel .carrossel-pontos");
    if (!trilho || !pontosWrap) return;

    var mql = window.matchMedia ? window.matchMedia(PONTO_CORTE_MOBILE) : null;

    function imagemDoBanner(banner) {
      var mobile = mql && mql.matches;
      return (mobile && banner.mobile) || banner.desktop || banner.mobile || banner.img || "";
    }

    function desenhar() {
      trilho.innerHTML = "";
      pontosWrap.innerHTML = "";

      banners.forEach(function (banner, indice) {
        var src = imagemDoBanner(banner);
        if (!banner || !src) return;

        var img = document.createElement("img");
        img.alt = banner.alt || "";
        img.src = src;

        if (banner.link) {
          var link = document.createElement("a");
          link.className = "carrossel-slide-link" + (indice === 0 ? " ativo" : "");
          link.href = banner.link;
          img.className = "carrossel-slide-img";
          link.appendChild(img);
          trilho.appendChild(link);
        } else {
          img.className = "carrossel-slide" + (indice === 0 ? " ativo" : "");
          trilho.appendChild(img);
        }

        var ponto = document.createElement("span");
        ponto.className = "carrossel-ponto" + (indice === 0 ? " ativo" : "");
        pontosWrap.appendChild(ponto);
      });
    }

    desenhar();

    // Se a pessoa girar o celular ou redimensionar a janela cruzando o
    // ponto de corte, troca para o conjunto de imagem certo sozinho.
    if (mql) {
      var trocarConjunto = function () {
        desenhar();
      };
      if (mql.addEventListener) mql.addEventListener("change", trocarConjunto);
      else if (mql.addListener) mql.addListener(trocarConjunto);
    }
  }

  // ---------- cards de eventos (Saiba Mais) ----------

  function escaparHtml(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function renderEventos(eventos) {
    if (!Array.isArray(eventos) || !eventos.length) return;
    var grade = document.querySelector("[data-eventos-grade]");
    if (!grade) return;

    grade.innerHTML = "";

    eventos.forEach(function (evento) {
      if (!evento || !evento.id) return;
      var href = "evento.html?id=" + encodeURIComponent(evento.id);

      var card = document.createElement("div");
      card.className = "card-foto evento-card animar";
      card.tabIndex = 0;

      var img = document.createElement("img");
      img.className = "img-ph";
      img.loading = "lazy";
      img.src = evento.capa || "";
      img.alt = evento.titulo || "";
      card.appendChild(img);

      var corpo = document.createElement("div");
      corpo.className = "card-foto-corpo";

      var h3 = document.createElement("h3");
      h3.textContent = evento.titulo || "Evento";
      corpo.appendChild(h3);

      if (evento.descricao) {
        var p = document.createElement("p");
        p.textContent = evento.descricao;
        corpo.appendChild(p);
      }

      var qtdFotos = Array.isArray(evento.fotos) ? evento.fotos.length : 0;
      var link = document.createElement("a");
      link.className = "card-foto-link";
      link.href = href;
      link.textContent = qtdFotos ? "Ver " + qtdFotos + " fotos →" : "Ver fotos →";
      corpo.appendChild(link);

      card.appendChild(corpo);

      // Card inteiro clicável (o link interno já cobre teclado/leitor de tela).
      card.addEventListener("click", function (evt) {
        if (evt.target.closest("a")) return;
        window.location.href = href;
      });
      card.addEventListener("keydown", function (evt) {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          window.location.href = href;
        }
      });

      grade.appendChild(card);
    });
  }

  function buscarJson(caminho) {
    return fetch(caminho, { cache: "no-store" })
      .then(function (resposta) {
        return resposta.ok ? resposta.json() : null;
      })
      .catch(function () {
        return null;
      });
  }

  var tarefas = [];

  if (document.querySelector("#hero-carrossel")) {
    tarefas.push(buscarJson("content/banners.json").then(renderBanners));
  }

  if (document.querySelector("[data-eventos-grade]")) {
    tarefas.push(buscarJson("content/eventos.json").then(renderEventos));
  }

  window.__boaIdeiaContentPromise = tarefas.length
    ? Promise.race([Promise.all(tarefas).catch(function () {}), aguardarNoMaximo(1500)])
    : Promise.resolve();
})();
