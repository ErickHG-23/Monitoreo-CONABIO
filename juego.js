/* =====================================================================
   juego.js · Juego de revelación de videos

   Lee la lista de videos de manifiesto.js (que genera
   generar_manifiesto.py), arma el tablero y controla el juego.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- CONFIGURACIÓN (editable) ---------- */
const CONFIG = {
  columnas: 3,  // columnas del tablero
  filas: 3      // filas del tablero  (3 x 3 = 9 paneles)
};
  /* ---------------------------------------------- */

  const TOTAL = CONFIG.columnas * CONFIG.filas;

  const $ = (id) => document.getElementById(id);
  const el = {
    tablero: $("tablero"),
    lista: $("lista-especies"),
    listaVacia: $("lista-vacia"),
    contador: $("contador"),
    nota: $("nota"),
    btnReiniciar: $("btn-reiniciar"),
    visor: $("visor"),
    video: $("video"),
    btnCerrar: $("btn-cerrar"),
    aviso: $("aviso"),
    avisoTitulo: $("aviso-titulo"),
    avisoTexto: $("aviso-texto")
  };

  let carpetaVideos = "videosMP4";
  let carpetaMiniaturas = "miniaturas";
  let videos = [];          // todos los videos del manifiesto
  let cartas = [];          // un objeto por panel del tablero
  let disponibles = 0;      // cuántos paneles tienen video en esta ronda
  let bloqueado = false;    // evita clics mientras gira una carta o se ve un video
  let cartaAbierta = null;  // carta cuyo video está en pantalla
  let temporizador = null;  // espera entre el giro y la apertura del video

  /* ---------- Utilidades ---------- */

  // Baraja una copia de la lista (Fisher-Yates)
  function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Ruta segura (acentos, espacios, ñ…) para un archivo dentro de una carpeta
  function ruta(carpeta, archivo) {
    return carpeta + "/" + encodeURIComponent(archivo);
  }

  // Duración del giro: se lee de --duracion-volteo en estilos.css
  function duracionVolteoMs() {
    const valor = getComputedStyle(document.documentElement)
      .getPropertyValue("--duracion-volteo").trim();
    const n = parseFloat(valor);
    if (Number.isNaN(n)) return 700;
    return valor.endsWith("ms") ? n : n * 1000;
  }

  function mostrarAviso(titulo, texto) {
    el.avisoTitulo.textContent = titulo;
    el.avisoTexto.textContent = texto;
    el.aviso.classList.add("visible");
  }

  /* ---------- Tablero ---------- */

  function construirTablero() {
    el.tablero.style.setProperty("--columnas", CONFIG.columnas);
    el.tablero.style.setProperty("--filas", CONFIG.filas);
    // Cada panel con proporción 16:9, igual que los videos
    el.tablero.style.aspectRatio = (CONFIG.columnas * 16) + " / " + (CONFIG.filas * 9);

    for (let i = 0; i < TOTAL; i++) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "carta";
      boton.setAttribute("aria-label", "Panel " + (i + 1));
      boton.innerHTML =
        '<span class="carta-interior">' +
          '<span class="cara cara-frente">' + (i + 1) + "</span>" +
          '<span class="cara cara-dorso"></span>' +
        "</span>";

      const carta = {
        numero: i + 1,
        boton: boton,
        dorso: boton.querySelector(".cara-dorso"),
        datos: null,       // video asignado a este panel
        volteada: false,
        enLista: false
      };
      boton.addEventListener("click", () => alHacerClic(carta));
      el.tablero.appendChild(boton);
      cartas.push(carta);
    }
  }

  // Miniatura (o primer cuadro del video si no hay imagen) + numerito + play
  function crearReverso(carta) {
    const d = carta.datos;
    let medio;
    if (d.miniatura) {
      medio = document.createElement("img");
      medio.src = ruta(carpetaMiniaturas, d.miniatura);
      medio.alt = "";
      medio.draggable = false;
    } else {
      medio = document.createElement("video");
      medio.src = ruta(carpetaVideos, d.archivo) + "#t=0.5";
      medio.muted = true;
      medio.playsInline = true;
      medio.preload = "metadata";
    }

    const insignia = document.createElement("span");
    insignia.className = "insignia";
    insignia.textContent = carta.numero;

    const play = document.createElement("span");
    play.className = "icono-play";

    return [medio, insignia, play];
  }

  // Reparte al azar los videos entre los paneles (se llama al inicio y al reiniciar)
  function asignarVideos() {
    const elegidos = mezclar(videos).slice(0, TOTAL);
    disponibles = elegidos.length;

    cartas.forEach((carta, i) => {
      carta.datos = elegidos[i] || null;
      carta.volteada = false;
      carta.enLista = false;
      carta.boton.classList.remove("volteada");
      carta.boton.disabled = !carta.datos;
      carta.dorso.replaceChildren();
      if (carta.datos) carta.dorso.append(...crearReverso(carta));
    });

    actualizarContador();
  }

  /* ---------- Interacción ---------- */

  function alHacerClic(carta) {
    if (bloqueado || !carta.datos) return;
    bloqueado = true;

    // Empieza a cargar el video ya, mientras la carta gira
    prepararVideo(carta.datos);

    if (carta.volteada) {            // ya revelada: solo se vuelve a ver
      abrirVisor(carta);
      return;
    }

    carta.volteada = true;
    carta.boton.classList.add("volteada");
    temporizador = setTimeout(() => {
      temporizador = null;
      abrirVisor(carta);
    }, duracionVolteoMs() + 150);
  }

  function prepararVideo(datos) {
    el.video.src = ruta(carpetaVideos, datos.archivo);
    el.video.load();
  }

  function abrirVisor(carta) {
    cartaAbierta = carta;
    el.visor.classList.add("abierto");
    el.visor.setAttribute("aria-hidden", "false");
    el.video.currentTime = 0;

    const promesa = el.video.play();
    if (promesa && typeof promesa.catch === "function") {
      // Si el navegador bloquea el autoplay, quedan los controles para dar play
      promesa.catch(() => {});
    }
    el.video.focus({ preventScroll: true });
  }

  function cerrarVisor() {
    if (!cartaAbierta) return;
    const carta = cartaAbierta;
    cartaAbierta = null;

    el.video.pause();
    el.visor.classList.remove("abierto");
    el.visor.setAttribute("aria-hidden", "true");
    el.video.removeAttribute("src");
    el.video.load();

    agregarALista(carta);   // la especie aparece en la lista al cerrar el video
    bloqueado = false;
    carta.boton.focus({ preventScroll: true });
  }

  /* ---------- Lista de especies ---------- */

  function agregarALista(carta) {
    if (carta.enLista) return;
    carta.enLista = true;

    const li = document.createElement("li");
    li.textContent = carta.datos.nombre;
    li.className = "nuevo";
    el.lista.appendChild(li);
    el.listaVacia.hidden = true;
    actualizarContador();
    li.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function actualizarContador() {
    el.contador.textContent = el.lista.children.length + " / " + disponibles;
  }

  /* ---------- Reinicio ---------- */

  function reiniciar() {
    if (cartaAbierta) return;

    clearTimeout(temporizador);
    temporizador = null;
    el.video.removeAttribute("src");
    el.video.load();

    const habiaVolteadas = cartas.some((c) => c.volteada);
    bloqueado = true;

    // 1) Voltear todo boca abajo y vaciar la lista
    cartas.forEach((c) => {
      c.volteada = false;
      c.boton.classList.remove("volteada");
    });
    el.lista.replaceChildren();
    el.listaVacia.hidden = false;
    actualizarContador();

    // 2) Cuando terminó el giro, se vuelve a repartir al azar.
    //    (Se espera para que nadie alcance a ver las miniaturas nuevas.)
    setTimeout(() => {
      asignarVideos();
      bloqueado = false;
    }, habiaVolteadas ? duracionVolteoMs() + 80 : 0);
  }

  /* ---------- Arranque ---------- */

  function iniciar() {
    construirTablero();

    el.btnReiniciar.addEventListener("click", reiniciar);
    el.btnCerrar.addEventListener("click", cerrarVisor);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && cartaAbierta) {
        e.preventDefault();
        cerrarVisor();
      }
    });

    const m = window.MANIFIESTO;
    if (!m || !Array.isArray(m.videos)) {
      mostrarAviso(
        "No se encontró la lista de videos",
        "Falta el archivo manifiesto.js. Ejecuta generar_manifiesto.py y recarga esta página."
      );
      return;
    }

    carpetaVideos = m.carpetaVideos || carpetaVideos;
    carpetaMiniaturas = m.carpetaMiniaturas || carpetaMiniaturas;
    videos = m.videos;

    if (videos.length === 0) {
      mostrarAviso(
        "No hay videos",
        "La carpeta " + carpetaVideos + " está vacía o el manifiesto no se ha actualizado."
      );
      return;
    }

    if (videos.length < TOTAL) {
      el.nota.hidden = false;
      el.nota.textContent =
        "Solo hay " + videos.length + " video(s) en la carpeta: los paneles restantes quedan vacíos.";
    }

    asignarVideos();
  }

  iniciar();
})();
