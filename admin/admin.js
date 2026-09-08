/* admin.js — painel de gerenciamento de imagens (banners desktop/mobile +
   Cobertura de Eventos, com evento = capa + descrição + galeria própria).
   Vanilla JS, sem dependências, igual ao resto do site.

   Fluxo:
   1. Confere sessão (GET /api/session) -> mostra login ou painel.
   2. Carrega o conteúdo atual de /content/banners.json e /content/eventos.json.
   3. Toda edição fica só na memória do navegador até clicar em "Publicar":
      aí sim as imagens novas são otimizadas (redimensionadas/comprimidas)
      e enviadas para /api/publish, uma de cada vez, e por fim os dois
      manifestos finais são gravados — cada gravação vira um commit no
      GitHub e a Vercel republica o site sozinha. */
(function () {
  "use strict";

  var BANNER_MAX_LADO = 1920;
  var CAPA_MAX_LADO = 1600;
  var CAPA_QUALIDADE = 0.85;
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
  var btnNovoEvento = document.getElementById("btn-novo-evento");

  var barraPublicar = document.getElementById("barra-publicar");
  var publicarStatus = document.getElementById("publicar-status");
  var btnPublicar = document.getElementById("btn-publicar");
  var btnDescartar = document.getElementById("btn-descartar");
  var toast = document.getElementById("admin-toast");

  var estado = {
    banners: [null, null, null],
    eventos: [],
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

  function semAcentos(texto) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function slugificar(texto) {
    var slug = semAcentos(texto)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "evento";
  }

  function gerarIdEvento(titulo) {
    var base = slugificar(titulo);
    var idsExistentes = estado.eventos.map(function (e) {
      return e.id;
    });
    var id = base;
    var sufixo = 2;
    while (idsExistentes.indexOf(id) !== -1) {
      id = base + "-" + sufixo;
      sufixo++;
    }
    return id;
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
          var desktop = b.desktop || b.img || "";
          var mobile = b.mobile || b.img || desktop;
          return {
            alt: b.alt || "",
            link: b.link || "",
            desktop: desktop,
            desktopBlobPendente: null,
            desktopPreviewUrl: desktop,
            mobile: mobile,
            mobileBlobPendente: null,
            mobilePreviewUrl: mobile,
          };
        });

        estado.eventos = eventos.map(function (e) {
          return {
            tempId: proximoIdTemporario++,
            id: e.id || slugificar(e.titulo),
            titulo: e.titulo || "",
            descricao: e.descricao || "",
            data: e.data || "",
            capa: e.capa || "",
            capaBlobPendente: null,
            capaPreviewUrl: e.capa || "",
            expandido: false,
            fotos: Array.isArray(e.fotos)
              ? e.fotos.map(function (f) {
                  return {
                    tempId: proximoIdTemporario++,
                    img: f.img || "",
                    legenda: f.legenda || "",
                    blobPendente: null,
                    previewUrl: f.img || "",
                  };
                })
              : [],
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

  function criarPreviewBanner(rotulo, previewUrl, classeExtra, aoEscolher) {
    var item = document.createElement("div");
    item.className = "admin-banner-preview-item";

    var rotuloEl = document.createElement("div");
    rotuloEl.className = "admin-banner-preview-rotulo";
    rotuloEl.textContent = rotulo;
    item.appendChild(rotuloEl);

    var preview = document.createElement("div");
    preview.className = "admin-banner-preview" + (classeExtra ? " " + classeExtra : "");

    if (previewUrl) {
      var img = document.createElement("img");
      img.src = previewUrl;
      img.alt = "";
      preview.appendChild(img);
    } else {
      var vazio = document.createElement("div");
      vazio.className = "admin-banner-preview-vazio";
      vazio.textContent = "Clique para escolher";
      preview.appendChild(vazio);
    }

    var overlay = document.createElement("div");
    overlay.className = "admin-banner-overlay";
    overlay.textContent = "Trocar";
    preview.appendChild(overlay);

    var inputArquivo = document.createElement("input");
    inputArquivo.type = "file";
    inputArquivo.accept = "image/*";
    inputArquivo.hidden = true;
    inputArquivo.addEventListener("change", function () {
      var arquivo = inputArquivo.files && inputArquivo.files[0];
      if (!arquivo) return;
      aoEscolher(arquivo);
    });
    preview.appendChild(inputArquivo);

    preview.addEventListener("click", function () {
      inputArquivo.click();
    });

    item.appendChild(preview);
    return item;
  }

  function renderBanners() {
    listaBanners.innerHTML = "";
    estado.banners.forEach(function (banner, indice) {
      var card = document.createElement("div");
      card.className = "admin-banner-card";

      var previews = document.createElement("div");
      previews.className = "admin-banner-previews";

      previews.appendChild(
        criarPreviewBanner("Desktop", banner.desktopPreviewUrl, "", function (arquivo) {
          banner.desktopBlobPendente = arquivo;
          banner.desktopPreviewUrl = URL.createObjectURL(arquivo);
          marcarSujo();
          renderBanners();
        })
      );
      previews.appendChild(
        criarPreviewBanner("Mobile", banner.mobilePreviewUrl, "admin-banner-preview--mobile", function (arquivo) {
          banner.mobileBlobPendente = arquivo;
          banner.mobilePreviewUrl = URL.createObjectURL(arquivo);
          marcarSujo();
          renderBanners();
        })
      );

      card.appendChild(previews);

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

      card.appendChild(corpo);
      listaBanners.appendChild(card);
    });
  }

  // ---------- render: eventos ----------

  function renderFotosDoEvento(evento, container) {
    container.innerHTML = "";
    evento.fotos.forEach(function (foto, indice) {
      var card = document.createElement("div");
      card.className = "admin-evento-card";
      card.draggable = true;
      card.dataset.indice = String(indice);

      card.addEventListener("dragstart", function (e) {
        e.stopPropagation();
        card.classList.add("arrastando");
      });
      card.addEventListener("dragend", function (e) {
        e.stopPropagation();
        card.classList.remove("arrastando");
      });
      card.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      card.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var origem = container.querySelector(".admin-evento-card.arrastando");
        if (!origem || origem === card) return;
        var indiceOrigem = Number(origem.dataset.indice);
        var indiceDestino = Number(card.dataset.indice);
        var item = evento.fotos.splice(indiceOrigem, 1)[0];
        evento.fotos.splice(indiceDestino, 0, item);
        marcarSujo();
        renderFotosDoEvento(evento, container);
      });

      var thumb = document.createElement("div");
      thumb.className = "admin-evento-thumb";
      var img = document.createElement("img");
      img.src = foto.previewUrl;
      img.alt = "";
      thumb.appendChild(img);

      var corpo = document.createElement("div");
      corpo.className = "admin-evento-body";

      var textarea = document.createElement("textarea");
      textarea.placeholder = "Legenda da foto";
      textarea.value = foto.legenda;
      textarea.addEventListener("input", function () {
        foto.legenda = textarea.value;
        marcarSujo();
      });

      var remover = document.createElement("button");
      remover.type = "button";
      remover.className = "admin-evento-remover";
      remover.textContent = "Remover";
      remover.addEventListener("click", function () {
        evento.fotos.splice(indice, 1);
        marcarSujo();
        renderFotosDoEvento(evento, container);
        renderEventos();
      });

      corpo.appendChild(textarea);
      corpo.appendChild(remover);

      card.appendChild(thumb);
      card.appendChild(corpo);
      container.appendChild(card);
    });
  }

  function renderEventos() {
    listaEventos.innerHTML = "";

    estado.eventos.forEach(function (evento, indice) {
      var item = document.createElement("div");
      item.className = "admin-evento-item";
      item.dataset.indice = String(indice);

      // ---- cabeçalho (arrastável para reordenar os eventos) ----
      var cabecalho = document.createElement("div");
      cabecalho.className = "admin-evento-item-cabecalho";
      cabecalho.draggable = true;

      cabecalho.addEventListener("dragstart", function () {
        item.classList.add("arrastando");
      });
      cabecalho.addEventListener("dragend", function () {
        item.classList.remove("arrastando");
      });
      cabecalho.addEventListener("dragover", function (e) {
        e.preventDefault();
      });
      cabecalho.addEventListener("drop", function (e) {
        e.preventDefault();
        var origem = listaEventos.querySelector(".admin-evento-item.arrastando");
        if (!origem || origem === item) return;
        var indiceOrigem = Number(origem.dataset.indice);
        var indiceDestino = Number(item.dataset.indice);
        var ev = estado.eventos.splice(indiceOrigem, 1)[0];
        estado.eventos.splice(indiceDestino, 0, ev);
        marcarSujo();
        renderEventos();
      });

      // capa
      var capa = document.createElement("div");
      capa.className = "admin-evento-capa";
      if (evento.capaPreviewUrl) {
        var imgCapa = document.createElement("img");
        imgCapa.src = evento.capaPreviewUrl;
        imgCapa.alt = "";
        capa.appendChild(imgCapa);
      } else {
        var capaVazia = document.createElement("div");
        capaVazia.className = "admin-evento-capa-vazia";
        capaVazia.textContent = "Clique para escolher a capa";
        capa.appendChild(capaVazia);
      }
      var capaOverlay = document.createElement("div");
      capaOverlay.className = "admin-evento-capa-overlay";
      capaOverlay.textContent = "Trocar capa";
      capa.appendChild(capaOverlay);

      var inputCapa = document.createElement("input");
      inputCapa.type = "file";
      inputCapa.accept = "image/*";
      inputCapa.hidden = true;
      inputCapa.addEventListener("change", function () {
        var arquivo = inputCapa.files && inputCapa.files[0];
        if (!arquivo) return;
        evento.capaBlobPendente = arquivo;
        evento.capaPreviewUrl = URL.createObjectURL(arquivo);
        marcarSujo();
        renderEventos();
      });
      capa.appendChild(inputCapa);
      capa.addEventListener("click", function () {
        inputCapa.click();
      });
      cabecalho.appendChild(capa);

      // campos
      var campos = document.createElement("div");
      campos.className = "admin-evento-campos";

      var labelTitulo = document.createElement("label");
      labelTitulo.innerHTML = "<span>Título do evento</span>";
      var inputTitulo = document.createElement("input");
      inputTitulo.type = "text";
      inputTitulo.value = evento.titulo;
      inputTitulo.placeholder = "ex.: Festa Junina 2026";
      inputTitulo.addEventListener("input", function () {
        evento.titulo = inputTitulo.value;
        marcarSujo();
      });
      labelTitulo.appendChild(inputTitulo);
      campos.appendChild(labelTitulo);

      var labelDescricao = document.createElement("label");
      labelDescricao.innerHTML = "<span>Descrição</span>";
      var textareaDescricao = document.createElement("textarea");
      textareaDescricao.value = evento.descricao;
      textareaDescricao.placeholder = "Um resumo curto do evento";
      textareaDescricao.addEventListener("input", function () {
        evento.descricao = textareaDescricao.value;
        marcarSujo();
      });
      labelDescricao.appendChild(textareaDescricao);
      campos.appendChild(labelDescricao);

      var labelData = document.createElement("label");
      labelData.innerHTML = "<span>Data (opcional)</span>";
      var inputData = document.createElement("input");
      inputData.type = "date";
      inputData.value = evento.data;
      inputData.addEventListener("input", function () {
        evento.data = inputData.value;
        marcarSujo();
      });
      labelData.appendChild(inputData);
      campos.appendChild(labelData);

      cabecalho.appendChild(campos);

      // ações
      var acoes = document.createElement("div");
      acoes.className = "admin-evento-item-acoes";

      var btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "admin-evento-toggle-fotos";
      btnToggle.textContent = (evento.expandido ? "Fechar fotos" : "Gerenciar fotos") + " (" + evento.fotos.length + ")";
      btnToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        evento.expandido = !evento.expandido;
        renderEventos();
      });
      acoes.appendChild(btnToggle);

      var btnRemoverEvento = document.createElement("button");
      btnRemoverEvento.type = "button";
      btnRemoverEvento.className = "admin-evento-item-remover";
      btnRemoverEvento.textContent = "Remover evento";
      btnRemoverEvento.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!confirm('Remover o evento "' + (evento.titulo || "sem título") + '"? As fotos dele saem do site.')) return;
        estado.eventos.splice(indice, 1);
        marcarSujo();
        renderEventos();
      });
      acoes.appendChild(btnRemoverEvento);

      cabecalho.appendChild(acoes);
      item.appendChild(cabecalho);

      // ---- corpo: galeria de fotos do evento (colapsável) ----
      if (evento.expandido) {
        var corpoEvento = document.createElement("div");
        corpoEvento.className = "admin-evento-item-corpo";

        var toolbar = document.createElement("div");
        toolbar.className = "admin-evento-fotos-toolbar";

        var labelUpload = document.createElement("label");
        labelUpload.className = "btn btn-primario admin-upload-btn";
        labelUpload.textContent = "+ Adicionar fotos";
        var inputFotos = document.createElement("input");
        inputFotos.type = "file";
        inputFotos.accept = "image/*";
        inputFotos.multiple = true;
        inputFotos.hidden = true;
        inputFotos.addEventListener("change", function () {
          var arquivos = Array.prototype.slice.call(inputFotos.files || []);
          if (!arquivos.length) return;
          arquivos.forEach(function (arquivo) {
            evento.fotos.push({
              tempId: proximoIdTemporario++,
              img: "",
              legenda: "",
              blobPendente: arquivo,
              previewUrl: URL.createObjectURL(arquivo),
            });
          });
          inputFotos.value = "";
          marcarSujo();
          renderEventos();
        });
        labelUpload.appendChild(inputFotos);
        toolbar.appendChild(labelUpload);

        var dica = document.createElement("span");
        dica.className = "admin-dica";
        dica.textContent = "Arraste os cartões para reordenar.";
        toolbar.appendChild(dica);

        corpoEvento.appendChild(toolbar);

        var grade = document.createElement("div");
        grade.className = "admin-eventos-grade";
        renderFotosDoEvento(evento, grade);
        corpoEvento.appendChild(grade);

        item.appendChild(corpoEvento);
      }

      listaEventos.appendChild(item);
    });
  }

  btnNovoEvento.addEventListener("click", function () {
    var titulo = "";
    estado.eventos.push({
      tempId: proximoIdTemporario++,
      id: gerarIdEvento(titulo || "evento-" + Date.now()),
      titulo: titulo,
      descricao: "",
      data: "",
      capa: "",
      capaBlobPendente: null,
      capaPreviewUrl: "",
      expandido: true,
      fotos: [],
    });
    marcarSujo();
    renderEventos();
  });

  // ---------- publicar ----------

  function publicar() {
    // Eventos sem título viram "Evento <posição>" para não publicar cards vazios.
    estado.eventos.forEach(function (evento, indice) {
      if (!evento.titulo || !evento.titulo.trim()) {
        evento.titulo = "Evento " + (indice + 1);
      }
    });

    btnPublicar.disabled = true;
    btnDescartar.disabled = true;

    var totalEnvios = 0;
    estado.banners.forEach(function (b) {
      if (b.desktopBlobPendente) totalEnvios++;
      if (b.mobileBlobPendente) totalEnvios++;
    });
    estado.eventos.forEach(function (e) {
      if (e.capaBlobPendente) totalEnvios++;
      e.fotos.forEach(function (f) {
        if (f.blobPendente) totalEnvios++;
      });
    });
    var enviados = 0;

    function atualizarProgresso() {
      publicarStatus.textContent = totalEnvios > 0
        ? "Publicando imagens... (" + enviados + "/" + totalEnvios + ")"
        : "Publicando...";
    }
    atualizarProgresso();

    function enviarArquivo(caminho, blob) {
      return blobParaBase64(blob).then(function (base64) {
        return chamarApi("/api/publish", {
          method: "POST",
          body: JSON.stringify({ file: { path: caminho, contentBase64: base64 } }),
        }).then(function (resp) {
          if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao enviar imagem.");
          enviados++;
          atualizarProgresso();
        });
      });
    }

    var cadeia = Promise.resolve();

    // 1) banners (desktop + mobile alterados)
    estado.banners.forEach(function (banner, indice) {
      if (banner.desktopBlobPendente) {
        cadeia = cadeia
          .then(function () {
            return otimizarImagem(banner.desktopBlobPendente, BANNER_MAX_LADO, "image/png");
          })
          .then(function (blob) {
            var caminho = "assets/img/banner-" + (indice + 1) + "-desktop.png";
            return enviarArquivo(caminho, blob).then(function () {
              banner.desktop = caminho;
              banner.desktopBlobPendente = null;
            });
          });
      }
      if (banner.mobileBlobPendente) {
        cadeia = cadeia
          .then(function () {
            return otimizarImagem(banner.mobileBlobPendente, BANNER_MAX_LADO, "image/png");
          })
          .then(function (blob) {
            var caminho = "assets/img/banner-" + (indice + 1) + "-mobile.png";
            return enviarArquivo(caminho, blob).then(function () {
              banner.mobile = caminho;
              banner.mobileBlobPendente = null;
            });
          });
      }
    });

    // 2) eventos: capa + fotos novas de cada evento
    estado.eventos.forEach(function (evento) {
      if (evento.capaBlobPendente) {
        cadeia = cadeia
          .then(function () {
            return otimizarImagem(evento.capaBlobPendente, CAPA_MAX_LADO, "image/jpeg", CAPA_QUALIDADE);
          })
          .then(function (blob) {
            var caminho = "assets/img/eventos/" + evento.id + "/capa.jpg";
            return enviarArquivo(caminho, blob).then(function () {
              evento.capa = caminho;
              evento.capaBlobPendente = null;
            });
          });
      }
      evento.fotos.forEach(function (foto, indiceFoto) {
        if (!foto.blobPendente) return;
        cadeia = cadeia
          .then(function () {
            return otimizarImagem(foto.blobPendente, EVENTO_MAX_LADO, "image/jpeg", EVENTO_QUALIDADE);
          })
          .then(function (blob) {
            var caminho = "assets/img/eventos/" + evento.id + "/" + Date.now() + "-" + indiceFoto + ".jpg";
            return enviarArquivo(caminho, blob).then(function () {
              foto.img = caminho;
              foto.blobPendente = null;
            });
          });
      });
    });

    // 3) grava os dois manifestos por último
    cadeia = cadeia
      .then(function () {
        publicarStatus.textContent = "Salvando lista de banners...";
        var manifestoBanners = estado.banners.map(function (b) {
          return { desktop: b.desktop, mobile: b.mobile, alt: b.alt, link: b.link || "" };
        });
        return chamarApi("/api/publish", {
          method: "POST",
          body: JSON.stringify({ manifestType: "banners", manifest: manifestoBanners }),
        }).then(function (resp) {
          if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao salvar banners.");
        });
      })
      .then(function () {
        publicarStatus.textContent = "Salvando eventos...";
        var manifestoEventos = estado.eventos.map(function (e) {
          return {
            id: e.id,
            titulo: e.titulo,
            descricao: e.descricao || "",
            data: e.data || "",
            capa: e.capa,
            fotos: e.fotos.map(function (f) {
              return { img: f.img, legenda: f.legenda || "" };
            }),
          };
        });
        return chamarApi("/api/publish", {
          method: "POST",
          body: JSON.stringify({ manifestType: "eventos", manifest: manifestoEventos }),
        }).then(function (resp) {
          if (!resp.ok || !resp.dados.ok) throw new Error((resp.dados && resp.dados.error) || "Falha ao salvar os eventos.");
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
