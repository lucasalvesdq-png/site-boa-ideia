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
  });

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
