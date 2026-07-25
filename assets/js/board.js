/*
  board.js — el tablero interactivo de cada ficha.

  Monta un widget sobre cada <div class="panel-board" data-line="…">, tomando la
  línea correspondiente de LINES (assets/js/lines.js). Cada widget dibuja la
  posición en SVG, permite recorrer la línea jugada a jugada y enlaza la posición
  actual con el tablero de análisis de Lichess.

  Sin dependencias ni build: se carga como script clásico y no expone globales.
*/
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Geometría del tablero
     --------------------------------------------------------------------- */

  var FILES = "abcdefgh";
  var SQ = 52;              /* lado de casilla */
  var M = 26;               /* margen para las coordenadas */
  var W = M * 2 + SQ * 8;   /* lado total del viewBox */
  var PIECE_SCALE = 0.9;    /* las piezas vienen en un viewBox de 45x45 */

  var COLOR = {
    claro: "#EBECD0",
    oscuro: "#739552",
    ultima: "#F5F04A",      /* resaltado de la última jugada */
    critica: "#d1373c",     /* círculo de casilla crítica */
    plan: "#15781B",        /* flechas de plan */
    blanca: "#FFFFFF",
    negra: "#1B1512",
    trazoBlanca: "#2B2B2B",
    trazoNegra: "#EDE8DE"
  };

  var uid = 0;              /* ids únicos para los marcadores de flecha */

  /* ---------------------------------------------------------------------
     Piezas (set "cburnett", el mismo de Lichess/Wikipedia, CC BY-SA 3.0)

     fill: "main"   = color de la pieza (blanca/negra)
           "none"   = sólo trazo
           "accent" = detalle interior de contraste (p. ej. el ojo del caballo)

     Se usan vectores en vez de glyphs Unicode porque la fuente del sistema puede
     traer glyphs de color para alguna pieza (visto con la dama en Windows) que
     ignoran el color aplicado por CSS.
     --------------------------------------------------------------------- */

  var PIECE_PATHS = {
    k: [
      { d: "M22.5 11.63V6M20 8h5", fill: "none" },
      { d: "M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5", fill: "main" },
      { d: "M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z", fill: "main" },
      { d: "M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0", fill: "none" }
    ],
    q: [
      { d: "M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0", fill: "main" },
      { d: "M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14z", fill: "main" },
      { d: "M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z", fill: "main" },
      { d: "M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0", fill: "none" }
    ],
    r: [
      { d: "M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5", fill: "main" },
      { d: "m34 14-3 3H14l-3-3", fill: "main" },
      { d: "M31 17v12.5H14V17", fill: "main" },
      { d: "m31 29.5 1.5 2.5h-20l1.5-2.5", fill: "main" },
      { d: "M11 14h23", fill: "none" }
    ],
    b: [
      { d: "M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z", fill: "main" },
      { d: "M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z", fill: "main" },
      { d: "M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z", fill: "main" },
      { d: "M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5", fill: "none" }
    ],
    n: [
      { d: "M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21", fill: "main" },
      { d: "M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3", fill: "main" },
      { d: "M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5", fill: "accent" }
    ],
    p: [
      { d: "M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z", fill: "main" }
    ]
  };

  /* ---------------------------------------------------------------------
     Posición: mapa { casilla -> pieza }, mayúscula = blanca
     --------------------------------------------------------------------- */

  function startPos() {
    var pos = {};
    var back = "rnbqkbnr";
    for (var f = 0; f < 8; f++) {
      pos[FILES[f] + "8"] = back[f];
      pos[FILES[f] + "7"] = "p";
      pos[FILES[f] + "2"] = "P";
      pos[FILES[f] + "1"] = back[f].toUpperCase();
    }
    return pos;
  }

  /* FEN de la posición. El repertorio no incluye capturas al paso ni pérdida de
     enroque por mover rey/torre y volver, así que los derechos de enroque se
     deducen de que rey y torre sigan en su casilla inicial. */
  function fenFrom(pos, turnoBlancas, fullmove) {
    var rows = [];
    for (var r = 8; r >= 1; r--) {
      var row = "", empty = 0;
      for (var f = 0; f < 8; f++) {
        var pc = pos[FILES[f] + r];
        if (pc) {
          if (empty) { row += empty; empty = 0; }
          row += pc;
        } else empty++;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    var castle = "";
    if (pos.e1 === "K") { if (pos.h1 === "R") castle += "K"; if (pos.a1 === "R") castle += "Q"; }
    if (pos.e8 === "k") { if (pos.h8 === "r") castle += "k"; if (pos.a8 === "r") castle += "q"; }
    return rows.join("/") + " " + (turnoBlancas ? "w" : "b") + " " + (castle || "-") + " - 0 " + (fullmove || 1);
  }

  /* ---------------------------------------------------------------------
     Dibujo SVG
     --------------------------------------------------------------------- */

  function renderSVG(pos, flip, desde, hasta, criticas, flechas) {
    uid++;
    var marker = "ah" + uid;
    var svg = '<svg class="board-svg" viewBox="0 0 ' + W + " " + W + '" xmlns="http://www.w3.org/2000/svg">';

    svg += '<defs><marker id="' + marker + '" viewBox="0 0 10 10" refX="6.5" refY="5"' +
           ' markerWidth="3.6" markerHeight="3.6" orient="auto">' +
           '<path d="M0 0L10 5L0 10Z" fill="' + COLOR.plan + '"/></marker></defs>';

    function x(file) { return M + (flip ? 7 - file : file) * SQ; }
    function y(rank) { return M + (flip ? rank - 1 : 8 - rank) * SQ; }
    function centro(sq) {
      return [x(FILES.indexOf(sq[0])) + SQ / 2, y(parseInt(sq[1], 10)) + SQ / 2];
    }

    /* casillas */
    for (var r = 1; r <= 8; r++) {
      for (var f = 0; f < 8; f++) {
        var oscura = (f + r) % 2 === 1;
        svg += '<rect x="' + x(f) + '" y="' + y(r) + '" width="' + SQ + '" height="' + SQ +
               '" fill="' + (oscura ? COLOR.oscuro : COLOR.claro) + '"/>';
      }
    }

    /* origen y destino de la última jugada */
    [desde, hasta].forEach(function (sq) {
      if (!sq) return;
      svg += '<rect x="' + x(FILES.indexOf(sq[0])) + '" y="' + y(parseInt(sq[1], 10)) +
             '" width="' + SQ + '" height="' + SQ + '" fill="' + COLOR.ultima + '" opacity="0.5"/>';
    });

    /* casillas críticas */
    (criticas || []).forEach(function (sq) {
      var c = centro(sq);
      svg += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (SQ / 2 - 4) +
             '" fill="none" stroke="' + COLOR.critica + '" stroke-width="3.4"/>';
    });

    /* piezas */
    for (var sq2 in pos) {
      var pieza = pos[sq2];
      var blanca = pieza === pieza.toUpperCase();
      var relleno = blanca ? COLOR.blanca : COLOR.negra;
      var trazo = blanca ? COLOR.trazoBlanca : COLOR.trazoNegra;
      var off = 45 * PIECE_SCALE / 2;
      var cx = x(FILES.indexOf(sq2[0])) + SQ / 2 - off;
      var cy = y(parseInt(sq2[1], 10)) + SQ / 2 - off;
      svg += '<g transform="translate(' + cx + " " + cy + ") scale(" + PIECE_SCALE + ')"' +
             ' stroke="' + trazo + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">';
      PIECE_PATHS[pieza.toLowerCase()].forEach(function (seg) {
        var f = seg.fill === "main" ? relleno : (seg.fill === "accent" ? trazo : "none");
        svg += '<path d="' + seg.d + '" fill="' + f + '"/>';
      });
      svg += "</g>";
    }

    /* flechas de plan */
    (flechas || []).forEach(function (a) {
      if (a[0] === a[1]) return;
      var p1 = centro(a[0]), p2 = centro(a[1]);
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      var len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      svg += '<line x1="' + (p1[0] + ux * 13) + '" y1="' + (p1[1] + uy * 13) +
             '" x2="' + (p2[0] - ux * 14) + '" y2="' + (p2[1] - uy * 14) +
             '" stroke="' + COLOR.plan + '" stroke-width="7" stroke-linecap="round"' +
             ' opacity="0.72" marker-end="url(#' + marker + ')"/>';
    });

    /* Coordenadas. Van en el margen transparente del SVG, sobre el fondo de la
       ficha, así que el color lo pone el CSS (.board-svg .coord) para que siga
       al tema; acá sólo se posicionan. */
    for (var f2 = 0; f2 < 8; f2++) {
      svg += '<text class="coord" x="' + (M + f2 * SQ + SQ / 2) + '" y="' + (M + SQ * 8 + 16) +
             '" text-anchor="middle">' + (flip ? FILES[7 - f2] : FILES[f2]) + "</text>";
    }
    for (var r2 = 0; r2 < 8; r2++) {
      svg += '<text class="coord" x="' + (M - 11) + '" y="' + (M + r2 * SQ + SQ / 2) +
             '" text-anchor="middle" dominant-baseline="central">' +
             (flip ? r2 + 1 : 8 - r2) + "</text>";
    }

    return svg + "</svg>";
  }

  /* ---------------------------------------------------------------------
     Widget: tablero + controles + lista de jugadas + nota
     --------------------------------------------------------------------- */

  function build(container, line) {
    var total = line.plies.length;
    var idx = 0;

    function mkBtn(texto, etiqueta) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      b.setAttribute("aria-label", etiqueta);
      b.title = etiqueta;
      return b;
    }

    /* tablero */
    var wrap = document.createElement("div");
    wrap.className = "board-wrap";
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Tablero de la línea. Usá las flechas del teclado o los botones para navegar.");
    var boardEl = document.createElement("div");
    wrap.appendChild(boardEl);
    container.appendChild(wrap);

    /* controles de navegación */
    var controls = document.createElement("div");
    controls.className = "controls";
    var bStart = mkBtn("⏮", "Ir al inicio de la línea");
    var bPrev = mkBtn("◀", "Jugada anterior / deshacer");
    var bNext = mkBtn("▶", "Jugada siguiente / volver a la línea");
    var bEnd = mkBtn("⏭", "Ir al final de la línea");
    [bStart, bPrev, bNext, bEnd].forEach(function (b) { controls.appendChild(b); });
    container.appendChild(controls);

    /* enlace a Lichess + copiar FEN */
    var lichess = document.createElement("a");
    lichess.className = "lichess-link";
    lichess.target = "_blank";
    lichess.rel = "noopener";
    lichess.innerHTML = '<span class="ico">↗</span>Seguir en Lichess';
    lichess.title = "Abrir esta posición en el tablero de análisis de Lichess, con su propio motor";

    var btnFen = mkBtn("", "Copiar la posición actual en formato FEN");
    btnFen.className = "lichess-link";
    btnFen.innerHTML = '<span class="ico">⧉</span>Copiar FEN';
    btnFen.addEventListener("click", function () {
      var fen = currentFen();
      var original = btnFen.innerHTML;
      function ok() {
        btnFen.innerHTML = '<span class="ico">✓</span>¡Copiado!';
        setTimeout(function () { btnFen.innerHTML = original; }, 1200);
      }
      function manual() { window.prompt("FEN:", fen); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fen).then(ok, manual);
      } else manual();
    });

    var linkRow = document.createElement("div");
    linkRow.className = "linkrow";
    linkRow.appendChild(lichess);
    linkRow.appendChild(btnFen);
    container.appendChild(linkRow);

    /* jugadas clicables */
    var moves = document.createElement("div");
    moves.className = "moves";
    var chips = line.plies.map(function (ply, i) {
      var c = document.createElement("button");
      c.type = "button";
      c.textContent = ply[0];
      if (ply[3] && ply[3].mala) c.classList.add("mala");
      c.addEventListener("click", function () { goTo(i + 1); });
      moves.appendChild(c);
      return c;
    });
    container.appendChild(moves);

    /* nota de la jugada actual */
    var nota = document.createElement("div");
    nota.className = "nota";
    container.appendChild(nota);

    function posAt(k) {
      var pos = startPos();
      for (var i = 0; i < k; i++) {
        line.plies[i][1].forEach(function (mv) {
          var pieza = pos[mv[0]];
          delete pos[mv[0]];
          pos[mv[1]] = pieza;
        });
      }
      return pos;
    }

    function currentFen() {
      return fenFrom(posAt(idx), idx % 2 === 0, Math.floor(idx / 2) + 1);
    }

    function paint() {
      var pos = posAt(idx);
      var desde = null, hasta = null, criticas = null, flechas = null, texto;

      if (idx > 0) {
        var ply = line.plies[idx - 1];
        var opts = ply[3] || {};
        desde = ply[1][0][0];
        hasta = ply[1][0][1];
        criticas = opts.hl || null;
        flechas = opts.arr || null;
        texto = '<span class="san">' + ply[0] + "</span>" + (ply[2] ? " — " + ply[2] : "");
      } else {
        texto = line.intro;
      }

      boardEl.innerHTML = renderSVG(pos, line.flip === 1, desde, hasta, criticas, flechas);
      nota.innerHTML = texto;
      lichess.href = "https://lichess.org/analysis/" + currentFen().split(" ").join("_") +
                     "?color=" + (line.flip === 1 ? "black" : "white");

      chips.forEach(function (c, i) { c.classList.toggle("on", i === idx - 1); });
      bStart.disabled = bPrev.disabled = (idx === 0);
      bNext.disabled = bEnd.disabled = (idx === total);
    }

    function goTo(k) {
      idx = Math.max(0, Math.min(total, k));
      paint();
    }

    bStart.addEventListener("click", function () { goTo(0); });
    bPrev.addEventListener("click", function () { goTo(idx - 1); });
    bNext.addEventListener("click", function () { goTo(idx + 1); });
    bEnd.addEventListener("click", function () { goTo(total); });

    wrap.addEventListener("keydown", function (e) {
      var salto = { ArrowRight: idx + 1, ArrowLeft: idx - 1, Home: 0, End: total };
      if (!(e.key in salto)) return;
      e.preventDefault();
      goTo(salto[e.key]);
    });

    goTo(0);
  }

  /* ---------------------------------------------------------------------
     Arranque
     --------------------------------------------------------------------- */

  document.querySelectorAll(".panel-board[data-line]").forEach(function (el) {
    var key = el.getAttribute("data-line");
    var line = typeof LINES !== "undefined" && LINES[key];
    if (!line) return;
    try {
      build(el, line);
    } catch (err) {
      console.error("No se pudo montar el tablero " + key, err);
      el.innerHTML = '<p class="board-error">No se pudo cargar este tablero.</p>';
    }
  });
})();
