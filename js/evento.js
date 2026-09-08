/* evento.js — carrega evento.html?id=<id>, busca content/eventos.json,
   encontra o evento pedido e renderiza título, descrição e a galeria
   completa de fotos daquele evento (reaproveitando o mesmo padrão visual
   de figure/figcaption + lightbox usado no resto do site).

   Roda ANTES de main.js, no mesmo padrão de js/content.js: define
   window.__boaIdeiaContentPromise para que o carrossel/galeria/observador
   de animação só iniciem depois que o conteúdo dinâmico já estiver na
   página. Se o id não existir na URL, ou o evento não for encontrado, ou
   a busca falhar, mostra uma mensagem amigável em vez de quebrar a página. */
(function () {
  "use strict";

  function aguardarNoMaximo(ms) {
    return new Promise(function (resolver) {
      setTimeout(resolver, ms);
    });
  }

  function formatarData(iso) {
    if (!iso) return "";
    var partes = iso.split("-");
    if (partes.length !== 3) return iso;
    var meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    var mes = meses[parseInt(partes[1], 10) - 1];
    if (!mes) return iso;
    return partes[2] + " de " + mes + " de " + partes[0];
  }

  function mostrarErro() {
    var erro = document.querySelector("[data-evento-erro]");
    var cabecalho = document.querySelector("[data-evento-cabecalho]");
    if (erro) erro.hidden = false;
    if (cabecalho) cabecalho.hidden = true;
    document.title = "Evento não encontrado — Coopex Colégio Boa Ideia";
    var h1 = document.querySelector("[data-evento-titulo]");
    if (h1) h1.textContent = "Evento não encontrado";
  }

  function renderEvento(evento) {
    if (!evento) {
      mostrarErro();
      return;
    }

    document.title = (evento.titulo || "Evento") + " — Coopex Colégio Boa Ideia";

    var h1 = document.querySelector("[data-evento-titulo]");
    if (h1) h1.textContent = evento.titulo || "Evento";

    var breadcrumbAtual = document.querySelector("[data-evento-breadcrumb]");
    if (breadcrumbAtual) breadcrumbAtual.textContent = evento.titulo || "Evento";

    var capaFundo = document.querySelector("[data-evento-capa]");
    if (capaFundo && evento.capa) {
      capaFundo.src = evento.capa;
      capaFundo.alt = evento.titulo || "";
    }

    var dataEl = document.querySelector("[data-evento-data]");
    if (dataEl) {
      var dataFormatada = formatarData(evento.data);
      if (dataFormatada) {
        dataEl.textContent = dataFormatada;
        dataEl.hidden = false;
      } else {
        dataEl.hidden = true;
      }
    }

    var descricaoEl = document.querySelector("[data-evento-descricao]");
    if (descricaoEl) {
      if (evento.descricao) {
        descricaoEl.textContent = evento.descricao;
        descricaoEl.hidden = false;
      } else {
        descricaoEl.hidden = true;
      }
    }

    var galeria = document.querySelector("[data-evento-galeria]");
    var fotos = Array.isArray(evento.fotos) ? evento.fotos : [];
    if (galeria) {
      galeria.innerHTML = "";
      fotos.forEach(function (foto) {
        if (!foto || !foto.img) return;
        var figure = document.createElement("figure");
        figure.className = "animar";

        var img = document.createElement("img");
        img.className = "img-ph";
        img.loading = "lazy";
        img.src = foto.img;
        img.alt = foto.legenda || evento.titulo || "";
        figure.appendChild(img);

        if (foto.legenda) {
          var figcaption = document.createElement("figcaption");
          figcaption.textContent = foto.legenda;
          figure.appendChild(figcaption);
        }

        galeria.appendChild(figure);
      });
    }

    var cabecalho = document.querySelector("[data-evento-cabecalho]");
    if (cabecalho) cabecalho.hidden = false;
  }

  function idDaUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  var id = idDaUrl();

  window.__boaIdeiaContentPromise = !id
    ? (mostrarErro(), Promise.resolve())
    : Promise.race([
        fetch("content/eventos.json", { cache: "no-store" })
          .then(function (resposta) {
            return resposta.ok ? resposta.json() : [];
          })
          .then(function (eventos) {
            var lista = Array.isArray(eventos) ? eventos : [];
            var encontrado = null;
            for (var i = 0; i < lista.length; i++) {
              if (lista[i] && lista[i].id === id) {
                encontrado = lista[i];
                break;
              }
            }
            renderEvento(encontrado);
          })
          .catch(function () {
            mostrarErro();
          }),
        aguardarNoMaximo(4000),
      ]);
})();
