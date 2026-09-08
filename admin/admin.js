/* admin.js — painel de gerenciamento de imagens (banners + Cobertura de
   Eventos). Vanilla JS, sem dependências, igual ao resto do site.

   Fluxo:
   1. Confere sessão (GET /api/session) -> mostra login ou painel.
   2. Carrega o conteúdo atual de /content/banners.json e /content/eventos.json.
   3. Toda edição fica só na memória do navegador até clicar em "Publicar":
      aí sim as imagens novas são otimizadas (redimensionadas/comprimidas)
      e enviadas para /api/publish, uma de cada vez, e por fim o manifesto
      final é gravado — cada gravação vira um commit no GitHub e a Vercel
      republica o site sozinha. */
(function () {
  "use strict";

  var BANNER_MAX_LADO = 1920;
  var EVENTO_MAX_LADO = 1600;
  var EVENTO_QUALIDADE = 0.82;

  var telaLogin = document.getElementById("tela-login");
  var telaPainel = document.getElementById("tela-painel");
  var formLogin = document.getElementById("form-login");
  var loginErro = document.getElementById("login-erro");
  var adminUsuario = document.getElementById("admin-usuario");
  var btnSair = document.getElementById("btn-sair");

  var listaBanners = document.getElementById("lista-banners");
  var listaEventos = document.getElementById("lista-eventos");
  var inputNovaFoto = document.getElementById("input-nova-foto");

  var barraPublicar = document.getElementById("barra-publicar");
  var publicarStatus = document.getElementById("publicar-status");
  var btnPublicar = document.getElementById("btn-publicar");
  var btnDescartar = document.getElementById("btn-descartar");
  var toast = document.getElementById("admin-toast");

  var estado = {
    banners: [null, null, null], // { img, alt, link, blobPendente, previewUrl }
    eventos: [], // { id, img, legenda, blobPendente, previewUrl, novo }
    sujo: false,
  };

  var proximoIdTemporario = 1;

  // ---------- utilidades ----------

  function mostrarToast(mensagem, tipo) {
    toast.textContent = mensagem;
    toast.className = "admin-toast" + (tipo ? " " + tipo : "");
    toast.hidden = false;
    clearTimeout(mostrarToast._timer);
    mostrarToast._timer = setTimeout(function () {
      toast.hidden = true;
    }, 4200);
  }

  function marcarSujo() {
    estado.sujo = true;
    barraPublicar.hidden = false;
    publicarStatus.textContent = "Há alterações não publicadas.";
  }

  function limparSujo() {
    estado.sujo = false;
    barraPublicar.hidden = true;
  }

  window.addEventListener("beforeunload", function (evento) {
    if (estado.sujo) {
      evento.preventDefault();
      evento.returnValue = "";
    }
  });

  function base64SemPrefixo(dataUrl) {
    var i = dataUrl.indexOf(",");
    return i === -1 ? dataUrl : dataUrl.slice(i + 1);
  }

  function blobParaBase64(blob) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onload = function () {
        resolve(base64SemPrefixo(leitor.result));
      };
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  }

  function carregarImagem(arquivo) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () {
        resolve(img);
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível ler a imagem."));
      };
      img.src = url;
    });
  }

  // Redimensiona (mantendo proporção, sem ampliar) e reexporta a imagem —
  // isto que mantém o repositório leve mesmo com fotos grandes enviadas
  // direto do celular.
  function otimizarImagem(arquivo, ladoMaximo, mime, qualidade) {
    return carregarImagem(arquivo).then(function (img) {
      var largura = img.naturalWidth;
      var altura = img.naturalHeight;
      var maior = Math.max(largura, altura);
      if (maior > ladoMaximo) {
        var fator = ladoMaximo / maior;
        largura = Math.round(largura * fator);
        altura = Math.round(altura * fator);
      }
      var canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, largura, altura);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(
          function (blob) {
            if (!blob) return reject(new Error("Falha ao processar a imagem."));
            resolve(blob);
          },
          mime,
          qualidade
        );
      });
    });
  }

  function chamarApi(caminho, opcoes) {
    opcoes = opcoes || {};
    opcoes.credentials = "same-origin";
    if (opcoes.body && !opcoes.headers) {
      opcoes.headers = { "Content-Type": "application/json" };
    }
    return fetch(caminho, opcoes).then(function (res) {
      return res.json().then(function (dados) {
        return { status: res.status, ok: res.ok, dados: dados };
      });
    });
  }

  // ---------- login / sessão ----------

  function mostrarLogin() {
    telaLogin.hidden = false;
    telaPainel.hidden = true;
  }

  function mostrarPainel(username) {
    telaLogin.hidden = true;
    telaPainel.hidden = false;
    adminUsuario.textContent = username ? "Olá, " + username : "";
  }

  function conferirSessao() {
    return chamarApi("/api/session")
      .then(function (resp) {
        if (resp.ok && resp.dados.authenticated) {
          mostrarPainel(resp.dados.username);
          carregarConteudo();
        } else {
          mostrarLogin();
        }
      })
      .catch(function () {
        mostrarLogin();
      });
  }

  formLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    loginErro.hidden = true;
    var dados = new FormData(formLogin);
    var botao = formLogin.querySelector("button[type=submit]");
    botao.disabled = true;
    botao.textContent = "Entrando...";

    chamarApi("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: dados.get("username"),
        password: dados.get("password"),
      }),
    })
      .then(function (resp) {
        if (resp.ok && resp.dados.ok) {
          formLogin.reset();
          mostrarPainel(resp.dados.username);
          carregarConteudo();
        } else {
          loginErro.textContent = (resp.dados && resp.dados.error) || "Não foi possível entrar.";
          loginErro.hidden = false;
        }
      })
      .catch(function () {
        loginErro.textContent = "Falha de conexão. Tente novamente.";
        loginErro.hidden = false;
      })
      .finally(function () {
        botao.disabled = false;
        botao.textContent = "Entrar";
      });
  });

  btnSair.addEventListener("click", function () {
    if (estado.sujo && !confirm("Há alterações não publicadas. Sair mesmo assim?")) return;
    chamarApi("/api/logout", { method: "POST" }).finally(function () {
      window.location.reload();
    });
  });

  // ---------- abas ----------

  document.querySelectorAll(".admin-tab").forEach(function (botao) {
    botao.addEventListener("click", function () {
      document.querySelectorAll(".admin-tab").forEach(function (b) {
        b.classList.toggle("ativo", b === botao);
      });
      var secao = botao.dataset.secao;
      document.querySelectorAll("[data-secao-painel]").forEach(function (painel) {
        painel.classList.toggle("ativo", painel.dataset.secaoPainel === secao);
      });
    });
  });

  // ---------- carregar conteúdo atual ----------

  function carregarConteudo() {
    Promise.all([
      fetch("/content/banners.json", { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : [];
      }),
      fetch("/content/eventos.json", { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : [];
      }),
    ])
      .then(function (resultados) {
        var banners = resultados[0] || [];
        var eventos = resultados[1] || [];

        estado.banners = [0, 1, 2].map(function (i) {
          var b = banners[i] || {};
          return { img: b.img || "", alt: b.alt || "", link: b.link || "", blobPendente: null, previewUrl: b.img || "" };
        });

        estado.eventos = eventos.map(function (e) {
          return {
            id: proximoIdTemporario++,
            img: e.img || "",
            legenda: e.legenda || "",
            blobPendente: null,
            previewUrl: e.img || "",
            novo: false,
          };
        });

        limparSujo();
        renderBanners();
        renderEventos();
      })
      .catch(function () {
        mostrarToast("Não foi possível carregar o conteúdo atual do site.", "erro");
      });
  }

  // ---------- render: banners ----------

  function renderBanners() {
    listaBanners.innerHTML = "";
    estado.banners.forEach(function (banner, indice) {
      var card = document.createElement("div");
      card.className = "admin-banner-card";

      var preview = document.createElement("div");
      preview.className = "admin-banner-preview";

      if (banner.previewUrl) {
        var img = document.createElement("img");
        img.src = banner.previewUrl;
        img.alt = "";
        preview.appendChild(img);
      } else {
        var vazio = document.createElement("div");
        vazio.className = "admin-banner-preview-vazio";
        vazio.textContent = "Clique para escolher uma imagem";
        preview.appendChild(vazio);
      }

      var overlay = document.createElement("div");
      overlay.className = "admin-banner-overlay";
      overlay.textContent = "Clique para trocar";
      preview.appendChild(overlay);

      var inputArquivo = document.createElement("input");
      inputArquivo.type = "file";
      inputArquivo.accept = "image/*";
      inputArquivo.hidden = true;
      inputArquivo.addEventListener("change", function () {
        var arquivo = inputArquivo.files && inputArquivo.files[0];
        if (!arquivo) return;
        banner.blobPendente = arquivo;
        banner.previewUrl = URL.createObjectURL(arquivo);
        marcarSujo();
        renderBanners();
      });

      preview.addEventListener("click", function () {
        inputArquivo.click();
      });
      preview.appendChild(inputArquivo);

      var corpo = document.createElement("div");
      corpo.className = "admin-banner-body";

      var slot = document.createElement("span");
      slot.className = "admin-banner-slot";
      slot.textContent = "Banner " + (indice + 1);
      corpo.appendChild(slot);

      var labelAlt = document.createElement("label");
      labelAlt.innerHTML = "<span>Texto alternativo (acessibilidade)</span>";
      var inputAlt = document.createElement("input");
      inputAlt.type = "text";
      inputAlt.value = banner.alt;
      inputAlt.placeholder = "Descreva a imagem em poucas palavras";
      inputAlt.addEventListener("input", function () {
        banner.alt = inputAlt.value;
        marcarSujo();
      });
      labelAlt.appendChild(inputAlt);
      corpo.appendChild(labelAlt);

      var labelLink = document.createElement("label");
      labelLink.innerHTML = "<span>Link ao clicar (opcional)</span>";
      var inputLink = document.createElement("input");
      inputLink.type = "text";
      inputLink.value = banner.link;
      inputLink.placeholder = "ex.: matriculas.html";
      inputLink.addEventListener("input", function () {
        banner.link = inputLink.value.trim();
        marcarSujo();
      });
      labelLink.appendChild(inputLink);
      corpo.appendChild(labelLink);

      card.appendChild(preview);
      card.appendChild(corpo);
      listaBanners.appendChild(card);
    });
  }

  // ---------- render: eventos ----------

  function renderEventos() {
    listaEventos.innerHTML = "";
    estado.eventos.forEach(function (evento, indice) {
      var card = document.createElement("div");
      card.className = "admin-evento-card";
      card.draggable = true;
      card.dataset.indice = String(indice);

      card.addEventListener("dragstart", function () {
        card.classList.add("arrastando");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("arrastando");
      });
      card.addEventListener("dragover", function (e) {
        e.preventDefault();
      });
      card.addEventListener("drop", function (e) {
        e.preventDefault();
        var origem = document.querySelector(".admin-evento-card.arrastando");
        if (!origem || origem === card) return;
        var indiceOrigem = Number(origem.dataset.indice);
        var indiceDestino = Number(card.dataset.indice);
        var item = estado.eventos.splice(indiceOrigem, 1)[0];
        estado.eventos.splice(indiceDestino, 0, item);
        marcarSujo();
        renderEventos();
      });

      var thumb = document.createElement("div");
      thumb.className = "admin-evento-thumb";
      var img = document.createElement("img");
      img.src = evento.previewUrl;
      img.alt = "";
      thumb.appendChild(img);

      var corpo = document.createElement("div");
      corpo.className = "admin-evento-body";

      var textarea = document.createElement("textarea");
      textarea.placeholder = "Legenda da foto";
      textarea.value = evento.legenda;
      textarea.addEventListener("input", function () {
        evento.legenda = textarea.value;
        marcarSujo();
      });

      var remover = document.createElement("button");
      remover.type = "button";
      remover.className = "admin-evento-remover";
      remover.textContent = "Remover";
      remover.addEventListener("click", function () {
        estado.eventos.splice(indice, 1);
        marcarSujo();
        renderEventos();
      });

      corpo.appendChild(textarea);
      corpo.appendChild(remover);

      card.appendChild(thumb);
      card.appendChild(corpo);
      listaEventos.appendChild(card);
    });
  }

  inputNovaFoto.addEventListener("change", function () {
    var arquivos = Array.prototype.slice.call(inputNovaFoto.files || []);
    if (!arquivos.length) return;
    arquivos.forEach(function (arquivo) {
      estado.eventos.push({
        id: proximoIdTemporario++,
        img: "",
        legenda: "",
        blobPendente: arquivo,
        previewUrl: URL.createObjectURL(arquivo),
        novo: true,
      });
    });
    inputNovaFoto.value = "";
    marcarSujo();
    renderEventos();
  });

  // ---------- publicar ----------

  function nomeArquivoEvento(indice) {
    return "assets/img/eventos/" + Date.now() + "-" + indice + ".jpg";
  }

  function publicar() {
    btnPublicar.disabled = true;
    btnDescartar.disabled = true;

    var totalEnvios =
      estado.banners.filter(function (b) {
        return b.blobPendente;
      }).length +
      estado.eventos.filter(function (e) {
        return e.blobPendente;
      }).length;
    var enviados = 0;

    function atualizarProgresso() {
      if (totalEnvios > 0) {
        publicarStatus.textContent = "Publicando imagens... (" + enviados + "/" + totalEnvios + ")";
      } else {
        publicarStatus.textContent = "Publicando...";
      }
    }
    atualizarProgresso();

    // 1) envia as imagens de banner alteradas
    var cadeia = Promise.resolve();
    estado.banners.forEach(function (banner, indice) {
      if (!banner.blobPendente) return;
      cadeia = cadeia
        .then(function () {
          return otimizarImagem(banner.blobPendente, BANNER_MAX_LADO, "image/png");
        })
        .then(function (blobOtimizado) {
          return blobParaBase64(blobOtimizado);
        })
        .then(function (base64) {
          var caminho = "assets/img/banner-" + (indice + 1) + ".png";
          return chamarApi("/api/publish", {
            method: "POST",
            body: JSON.stringify({ file: { path: caminho, contentBase64: base64 } }),
          }).then(function (resp) {
            if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao enviar banner.");
            banner.img = caminho;
            banner.blobPendente = null;
            enviados++;
            atualizarProgresso();
          });
        });
    });

    // 2) envia as fotos novas da galeria de eventos
    estado.eventos.forEach(function (evento, indice) {
      if (!evento.blobPendente) return;
      cadeia = cadeia
        .then(function () {
          return otimizarImagem(evento.blobPendente, EVENTO_MAX_LADO, "image/jpeg", EVENTO_QUALIDADE);
        })
        .then(function (blobOtimizado) {
          return blobParaBase64(blobOtimizado);
        })
        .then(function (base64) {
          var caminho = nomeArquivoEvento(indice);
          return chamarApi("/api/publish", {
            method: "POST",
            body: JSON.stringify({ file: { path: caminho, contentBase64: base64 } }),
          }).then(function (resp) {
            if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao enviar foto.");
            evento.img = caminho;
            evento.blobPendente = null;
            evento.novo = false;
            enviados++;
            atualizarProgresso();
          });
        });
    });

    // 3) grava os dois manifestos por último
    cadeia = cadeia
      .then(function () {
        publicarStatus.textContent = "Salvando lista de banners...";
        var manifestoBanners = estado.banners.map(function (b) {
          return { img: b.img, alt: b.alt, link: b.link || "" };
        });
        return chamarApi("/api/publish", {
          method: "POST",
          body: JSON.stringify({ manifestType: "banners", manifest: manifestoBanners }),
        }).then(function (resp) {
          if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao salvar banners.");
        });
      })
      .then(function () {
        publicarStatus.textContent = "Salvando galeria de eventos...";
        var manifestoEventos = estado.eventos.map(function (e) {
          return { img: e.img, legenda: e.legenda || "" };
        });
        return chamarApi("/api/publish", {
          method: "POST",
          body: JSON.stringify({ manifestType: "eventos", manifest: manifestoEventos }),
        }).then(function (resp) {
          if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao salvar a galeria.");
        });
      });

    cadeia
      .then(function () {
        limparSujo();
        mostrarToast("Publicado! O site atualiza em alguns segundos.", "sucesso");
        renderBanners();
        renderEventos();
      })
      .catch(function (erro) {
        mostrarToast(erro.message || "Falha ao publicar.", "erro");
        marcarSujo();
      })
      .finally(function () {
        btnPublicar.disabled = false;
        btnDescartar.disabled = false;
      });
  }

  btnPublicar.addEventListener("click", publicar);

  btnDescartar.addEventListener("click", function () {
    if (!confirm("Descartar todas as alterações não publicadas?")) return;
    window.location.reload();
  });

  // ---------- início ----------
  conferirSessao();
})();
