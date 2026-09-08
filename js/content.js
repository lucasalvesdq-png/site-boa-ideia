/* content.js — busca content/banners.json e content/eventos.json e renderiza
   o carrossel do hero e a galeria de Cobertura de Eventos a partir deles.

   Roda ANTES de main.js. Se a busca falhar ou demorar demais, o markup
   estático que já está no HTML (idêntico ao conteúdo padrão) continua
   funcionando normalmente — a página nunca fica quebrada por causa disto.

   main.js aguarda `window.__boaIdeiaContentPromise` antes de inicializar o
   carrossel do hero, a galeria e o observador de animações, para que tudo
   funcione tanto no conteúdo padrão quanto no conteúdo já trocado pelo
   painel administrativo (/admin). */
(function () {
  "use strict";

  function aguardarNoMaximo(ms) {
    return new Promise(function (resolver) {
      setTimeout(resolver, ms);
    });
  }

  function renderBanners(banners) {
    if (!Array.isArray(banners) || !banners.length) return;
    var trilho = document.querySelector("#hero-carrossel .carrossel-trilho");
    var pontosWrap = document.querySelector("#hero-carrossel .carrossel-pontos");
    if (!trilho || !pontosWrap) return;

    trilho.innerHTML = "";
    pontosWrap.innerHTML = "";

    banners.forEach(function (banner, indice) {
      if (!banner || !banner.img) return;
      var img = document.createElement("img");
      img.className = "carrossel-slide" + (indice === 0 ? " ativo" : "");
      img.src = banner.img;
      img.alt = banner.alt || "";

      if (banner.link) {
        var link = document.createElement("a");
        link.className = "carrossel-slide-link" + (indice === 0 ? " ativo" : "");
        link.href = banner.link;
        img.className = "carrossel-slide-img";
        link.appendChild(img);
        trilho.appendChild(link);
      } else {
        trilho.appendChild(img);
      }

      var ponto = document.createElement("span");
      ponto.className = "carrossel-ponto" + (indice === 0 ? " ativo" : "");
      pontosWrap.appendChild(ponto);
    });
  }

  function renderEventos(eventos) {
    if (!Array.isArray(eventos) || !eventos.length) return;
    var galeria = document.querySelector(".galeria");
    if (!galeria) return;

    galeria.innerHTML = "";

    eventos.forEach(function (evento) {
      if (!evento || !evento.img) return;
      var figure = document.createElement("figure");
      figure.className = "animar";

      var img = document.createElement("img");
      img.className = "img-ph";
      img.loading = "lazy";
      img.src = evento.img;
      img.alt = evento.legenda || "";
      figure.appendChild(img);

      if (evento.legenda) {
        var figcaption = document.createElement("figcaption");
        figcaption.textContent = evento.legenda;
        figure.appendChild(figcaption);
      }

      galeria.appendChild(figure);
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

  if (document.querySelector(".galeria")) {
    tarefas.push(buscarJson("content/eventos.json").then(renderEventos));
  }

  window.__boaIdeiaContentPromise = tarefas.length
    ? Promise.race([Promise.all(tarefas).catch(function () {}), aguardarNoMaximo(1500)])
    : Promise.resolve();
})();
