document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  var overlay = document.querySelector(".nav-overlay");

  function fecharMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove("aberto");
    toggle.classList.remove("aberto");
    toggle.setAttribute("aria-expanded", "false");
    if (overlay) overlay.classList.remove("visivel");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      toggle.classList.toggle("aberto", aberto);
      toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
      if (overlay) overlay.classList.toggle("visivel", aberto);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      var ehLinkPaiComSub =
        link.parentElement &&
        link.parentElement.classList.contains("nav-item--tem-sub") &&
        link.parentElement.querySelector(":scope > a") === link;
      if (ehLinkPaiComSub) return;
      link.addEventListener("click", fecharMenu);
    });

    if (overlay) {
      overlay.addEventListener("click", fecharMenu);
    }
  }

  document.querySelectorAll(".tabs").forEach(function (grupo) {
    var botoes = grupo.querySelectorAll(".tab-btn");
    var paineis = grupo.querySelectorAll(".tab-painel");

    function ativar(nomeAba) {
      botoes.forEach(function (b) {
        var ativo = b.dataset.tab === nomeAba;
        b.setAttribute("aria-selected", ativo ? "true" : "false");
      });
      paineis.forEach(function (p) {
        var ativo = p.dataset.tabPainel === nomeAba;
        p.dataset.ativo = ativo ? "true" : "false";
      });
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        ativar(botao.dataset.tab);
      });
    });

    grupo.dataset.ativar = "1";
    grupo.ativarAba = ativar;
  });

  /* Menu cascata — submenus em acordeão dentro do drawer mobile */
  function submenusMobile() {
    document.querySelectorAll(".nav-item--tem-sub > a").forEach(function (link) {
      link.addEventListener("click", function (evento) {
        if (window.innerWidth > 860) return;
        var item = link.closest(".nav-item--tem-sub");
        if (!item) return;
        evento.preventDefault();
        var estavaAberto = item.classList.contains("aberto");
        document.querySelectorAll(".nav-item--tem-sub.aberto").forEach(function (outro) {
          if (outro !== item) outro.classList.remove("aberto");
        });
        item.classList.toggle("aberto", !estavaAberto);
      });
    });
  }
  submenusMobile();

  /* Ativa a aba certa ao abrir uma página vinda de um link com #âncora do menu cascata */
  function ativarAbaPorHash() {
    var hash = window.location.hash.replace("#", "");
    if (!hash) return;
    document.querySelectorAll(".tabs[data-ativar]").forEach(function (grupo) {
      var painel = grupo.querySelector('.tab-painel[data-tab-painel="' + hash + '"]');
      if (painel && typeof grupo.ativarAba === "function") {
        grupo.ativarAba(hash);
        painel.scrollIntoView({ block: "start" });
      }
    });
  }
  ativarAbaPorHash();
  window.addEventListener("hashchange", ativarAbaPorHash);

  /* Carrossel "O Boa Ideia por dentro" — snap-scroll com setas e dots */
  document.querySelectorAll("[data-carrossel]").forEach(function (carrossel) {
    var trilho = carrossel.querySelector(".carrossel-trilho");
    var prev = carrossel.querySelector("[data-carrossel-prev]");
    var next = carrossel.querySelector("[data-carrossel-next]");
    var dotsContainer = carrossel.querySelector("[data-carrossel-dots]");
    var slides = Array.prototype.slice.call(carrossel.querySelectorAll(".carrossel-slide"));
    if (!trilho || !slides.length) return;

    var dots = [];
    if (dotsContainer) {
      slides.forEach(function (_, indice) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir para foto " + (indice + 1));
        dot.setAttribute("aria-current", indice === 0 ? "true" : "false");
        dot.addEventListener("click", function () {
          slides[indice].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function rolar(direcao) {
      var largura = slides[0].getBoundingClientRect().width + 20;
      trilho.scrollBy({ left: direcao * largura, behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { rolar(-1); });
    if (next) next.addEventListener("click", function () { rolar(1); });

    if ("IntersectionObserver" in window && dots.length) {
      var observadorSlides = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (entrada) {
            var indice = slides.indexOf(entrada.target);
            if (indice === -1) return;
            if (entrada.isIntersecting) {
              dots.forEach(function (d, i) {
                d.setAttribute("aria-current", i === indice ? "true" : "false");
              });
            }
          });
        },
        { root: trilho, threshold: 0.6 }
      );
      slides.forEach(function (slide) { observadorSlides.observe(slide); });
    }
  });

  /* Indicador de scroll no banner cheio — desce para a seção seguinte */
  var scrollCue = document.querySelector("[data-scroll-cue]");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var proxima = scrollCue.closest("section");
      var alvo = proxima && proxima.nextElementSibling;
      if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  var header = document.querySelector(".header");
  if (header) {
    var atualizarHeader = function () {
      header.classList.toggle("header--scrolled", window.scrollY > 12);
    };
    atualizarHeader();
    window.addEventListener("scroll", atualizarHeader, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visivel");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".animar").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll(".animar").forEach(function (el) {
      el.classList.add("visivel");
    });
  }

  /* Alternância de revisão: mostra o que ainda é texto provisório (lorem ipsum).
     Só existe para facilitar a revisão interna antes de publicar — não afeta
     o visitante comum, que nunca vê o botão ativado. */
  if (document.querySelector("[data-lorem]")) {
    var botaoProvisorio = document.createElement("button");
    botaoProvisorio.type = "button";
    botaoProvisorio.className = "alterna-provisorio";
    botaoProvisorio.textContent = "Ver textos provisórios";

    var ligado = false;
    try {
      ligado = window.localStorage.getItem("boaideia-ver-provisorio") === "1";
    } catch (e) {}

    function aplicarEstado() {
      document.documentElement.classList.toggle("ver-provisorio", ligado);
      botaoProvisorio.textContent = ligado
        ? "Ocultar textos provisórios"
        : "Ver textos provisórios";
    }

    botaoProvisorio.addEventListener("click", function () {
      ligado = !ligado;
      try {
        window.localStorage.setItem("boaideia-ver-provisorio", ligado ? "1" : "0");
      } catch (e) {}
      aplicarEstado();
    });

    aplicarEstado();
    document.body.appendChild(botaoProvisorio);
  }
});
