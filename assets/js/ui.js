/*
  ui.js — cromo de la página: índice flotante y cambio de tema.

  El tema se aplica antes del primer pintado con el script inline del <head>
  de index.html; acá sólo vive el botón que lo alterna. La clave de
  localStorage tiene que coincidir con la de ese script.
*/
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Índice flotante: abrir/cerrar y resaltar la ficha visible
     --------------------------------------------------------------------- */

  (function () {
    var toggle = document.getElementById("tocToggle");
    var panel = document.getElementById("tocPanel");
    if (!toggle || !panel) return;

    function cerrar() {
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var abierto = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    });

    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", cerrar);
    });

    document.addEventListener("click", function (e) {
      if (panel.classList.contains("open") && !panel.contains(e.target) && e.target !== toggle) cerrar();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) cerrar();
    });

    /* Resaltar en el índice la ficha que está en pantalla. */
    if (typeof IntersectionObserver !== "function") return;

    var enlaces = {};
    panel.querySelectorAll("a[href^='#']").forEach(function (a) {
      enlaces[a.getAttribute("href").slice(1)] = a;
    });

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = enlaces[en.target.id];
        if (a) a.classList.toggle("on", en.isIntersecting);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    document.querySelectorAll("article.ficha[id]").forEach(function (ficha) {
      io.observe(ficha);
    });
  })();

  /* ---------------------------------------------------------------------
     Tema claro / oscuro
     --------------------------------------------------------------------- */

  (function () {
    var KEY = "repertorio-theme";   /* mismo valor que en el <head> de index.html */
    var btn = document.getElementById("themeToggle");
    if (!btn) return;

    function aplicar(oscuro) {
      document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
      btn.textContent = oscuro ? "☀️" : "🌙";
      btn.setAttribute("aria-label", oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }

    /* El <head> ya fijó data-theme; acá sólo se sincroniza el ícono del botón. */
    aplicar(document.documentElement.getAttribute("data-theme") === "dark");

    btn.addEventListener("click", function () {
      var oscuro = document.documentElement.getAttribute("data-theme") !== "dark";
      try { localStorage.setItem(KEY, oscuro ? "dark" : "light"); } catch (e) { /* modo privado */ }
      aplicar(oscuro);
    });
  })();
})();
