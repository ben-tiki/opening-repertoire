/*
  fetch-stats.js — descarga estadísticas reales del explorador de Lichess
  para cada línea del repertorio y escribe stats.js, acá al lado.

  Los datos generados NO se muestran hoy en la página; quedan versionados para
  retomarlos. Ver tools/README.md.

  Uso:   node tools/fetch-stats.js
  (sin dependencias; requiere Node 18+ y salida a internet hacia explorer.lichess.ovh)

  Filtros por defecto: ver CONFIG. Se pueden cambiar por variable de entorno, ej:
    SPEEDS=blitz,rapid RATINGS=2000,2200,2500 SINCE=2026-01 UNTIL=2026-06 node tools/fetch-stats.js
*/
var https = require("https");
var fs = require("fs");
var os = require("os");
var path = require("path");

/* El explorador responde 401 sin token. Se lee de la variable LICHESS_TOKEN o,
   si no está, del archivo ~/.lichess-token (fuera del proyecto, para no versionarlo).
   Crear el token en https://lichess.org/account/oauth/token/create — sin permisos marcados. */
function leerToken() {
  if (process.env.LICHESS_TOKEN) return process.env.LICHESS_TOKEN.trim();
  var p = process.env.LICHESS_TOKEN_FILE || path.join(os.homedir(), ".lichess-token");
  try { return fs.readFileSync(p, "utf8").trim() || null; } catch (e) { return null; }
}
var TOKEN = leerToken();

var CONFIG = {
  speeds:  process.env.SPEEDS  || "blitz,rapid,classical",
  ratings: process.env.RATINGS || "1800,2000,2200,2500", // = 1800 en adelante
  since:   process.env.SINCE   || "2026-01",
  until:   process.env.UNTIL   || "2026-06",
  pausaMs: Number(process.env.PAUSA || 1300)             // el explorador limita ~1 req/s
};

var ROOT = path.join(__dirname, "..");
var LINES_JS = path.join(ROOT, "assets", "js", "lines.js");
var SALIDA = path.join(__dirname, "stats.js");

/* lines.js es un script clásico (declara `var LINES`), no un módulo: se evalúa
   en este scope para leer las líneas sin duplicar los datos. */
eval(fs.readFileSync(LINES_JS, "utf8"));

/* Para cada línea: índice (base 0) de la jugada que define la ficha.
   Es la jugada cuya frecuencia y rendimiento queremos medir. */
var CLAVE = {
  l0:  { ply: 16, quien: "w" },  // 9.Ce5   — el esquema completo
  l1a: { ply: 7,  quien: "b" },  // 4...Ad6  (el cambio en f4)
  l1b: { ply: 5,  quien: "b" },  // 3...Af5  (esquema espejo)
  l1c: { ply: 5,  quien: "b" },  // 3...Db6  (temprano)
  l1d: { ply: 9,  quien: "b" },  // 5...Db6  (estructura completa)
  l1e: { ply: 5,  quien: "b" },  // 3...Ch5
  l1f: { ply: 3,  quien: "b" },  // 2...e5
  l1g: { ply: 1,  quien: "b" },  // 1...e5  (Englund)
  l1h: { ply: 7,  quien: "b" },  // 4...d6  (señal de India de Rey)
  l1i: { ply: 1,  quien: "b" },  // 1...g6  (Moderna)
  l1j: { ply: 2,  quien: "w" },  // 2.Cc3   (Jobava: jugada del blanco)
  l1k: { ply: 3,  quien: "b" },  // 2...c5
  l1l: { ply: 1,  quien: "b" },  // 1...c5  (Vieja Benoni)
  l1m: { ply: 1,  quien: "b" },  // 1...f5  (Holandesa)

  /* Caro-Kann (repertorio de negras): se mide la jugada que define la ficha,
     casi siempre la del blanco — es "el rival" desde este lado. El front voltea
     el puntaje a la perspectiva de las negras. */
  l2a: { ply: 6,  quien: "w" },  // 4.Cf3   (Avance, Sistema Short)
  l2b: { ply: 6,  quien: "w" },  // 4.g4    (Bayoneta del Avance)
  l2c: { ply: 7,  quien: "b" },  // 4...Cd7 (Clásica, Variante Karpov)
  l2d: { ply: 8,  quien: "w" },  // 5.Cg5   (Alien Gambit)
  l2e: { ply: 6,  quien: "w" },  // 4.Ad3   (Cambio)
  l2f: { ply: 6,  quien: "w" },  // 4.c4    (Ataque Panov)
  l2g: { ply: 4,  quien: "w" },  // 3.f3    (Variante Fantasía)
  l2h: { ply: 2,  quien: "w" },  // 2.Ac4   (Ataque Hillbilly)
  l2i: { ply: 2,  quien: "w" },  // 2.d3    (Ataque Indio de Rey)

  /* Eslava. En el modelo (l30) y en 3A se mide el propio ...Af5 para poder
     contrastar el mismo alfil en dos órdenes de jugadas distintos. */
  l30: { ply: 7,  quien: "b" },  // 4...Af5  (plan modelo)
  l3a: { ply: 7,  quien: "b" },  // 4...Af5?! (orden prematuro)
  l3b: { ply: 6,  quien: "w" },  // 4.Ag5    (clavada temprana)
  l3c: { ply: 4,  quien: "w" },  // 3.cxd5   (Cambio activo)
  l3d: { ply: 8,  quien: "w" },  // 5.e4     (Gambito Geller)
  l3e: { ply: 6,  quien: "w" },  // 4.e4     (Gambito Marshall)
  l3f: { ply: 8,  quien: "w" },  // 5.Af4    (Londres invertido contra ...Af5)
  l3g: { ply: 8,  quien: "w" }   // 5.Db3    (Db3 directa, sin cxd5)
};

function uciDe(ply) { return ply[1][0][0] + ply[1][0][1]; }
function jugadas(linea, hasta) {
  var out = [];
  for (var i = 0; i < hasta; i++) out.push(uciDe(linea.plies[i]));
  return out;
}

function armarUrl(play) {
  var qs = "variant=standard&speeds=" + CONFIG.speeds + "&ratings=" + CONFIG.ratings +
           "&since=" + CONFIG.since + "&until=" + CONFIG.until +
           "&topGames=0&recentGames=0&moves=30" + (play.length ? "&play=" + play.join(",") : "");
  return "https://explorer.lichess.ovh/lichess?" + qs;
}

function pedir(play) {
  var url = armarUrl(play);
  if (process.env.DRY) { console.log("   " + url); return Promise.resolve({ white: 0, draws: 0, black: 0, moves: [] }); }
  var headers = { "User-Agent": "repertorio-local-script" };
  if (TOKEN) headers.Authorization = "Bearer " + TOKEN;
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: headers }, function (res) {
      var body = "";
      res.on("data", function (d) { body += d; });
      res.on("end", function () {
        if (res.statusCode === 429) return reject(new Error("429 rate limit"));
        if (res.statusCode === 401) return reject(new Error(
          "401 — el explorador rechazó la credencial. " +
          (TOKEN ? "El token existe pero no sirve (¿vencido o mal copiado?)."
                 : "No hay token: creá uno en https://lichess.org/account/oauth/token/create y guardalo en ~/.lichess-token")));
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " — " + body.slice(0, 200)));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function dormir(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function pedirConReintento(play, intentos) {
  intentos = intentos || 4;
  for (var i = 0; i < intentos; i++) {
    try { return await pedir(play); }
    catch (e) {
      if (i === intentos - 1) throw e;
      var espera = 4000 * (i + 1);
      console.log("   reintento en " + (espera / 1000) + "s (" + e.message + ")");
      await dormir(espera);
    }
  }
}

function total(o) { return o.white + o.draws + o.black; }
function puntajeBlancas(o) { var n = total(o); return n ? (o.white + o.draws / 2) / n : 0; }
function r3(x) { return Math.round(x * 1000) / 1000; }

(async function () {
  console.log("Filtros: " + CONFIG.speeds + " | rating " + CONFIG.ratings.split(",")[0] +
              "+ | " + CONFIG.since + " a " + CONFIG.until);
  console.log("Token: " + (TOKEN ? "presente (" + TOKEN.length + " caracteres)" : "AUSENTE — el explorador va a devolver 401") + "\n");

  var out = {};
  console.log("· raíz 1.d4");
  var raiz = await pedirConReintento(["d2d4"]);
  var nD4 = total(raiz);
  console.log("  " + nD4.toLocaleString("es-AR") + " partidas con 1.d4\n");
  await dormir(CONFIG.pausaMs);

  var claves = Object.keys(CLAVE);
  for (var i = 0; i < claves.length; i++) {
    var key = claves[i];
    var linea = LINES[key];
    if (!linea) { console.log("!! no existe la línea " + key); continue; }
    var cfg = CLAVE[key];
    var ply = linea.plies[cfg.ply];
    var uci = uciDe(ply);
    process.stdout.write("· " + key + "  " + ply[0] + " ... ");

    var padre = await pedirConReintento(jugadas(linea, cfg.ply));
    await dormir(CONFIG.pausaMs);
    var nPadre = total(padre);
    var mv = padre.moves.filter(function (m) { return m.uci === uci; })[0];

    if (!mv) {
      console.log("sin datos (la jugada no figura entre las " + padre.moves.length + " más jugadas)");
      out[key] = { san: ply[0], n: 0, nPadre: nPadre, sinDatos: true };
      continue;
    }

    var hijo = await pedirConReintento(jugadas(linea, cfg.ply + 1));
    await dormir(CONFIG.pausaMs);

    var n = total(mv);
    out[key] = {
      san: ply[0],
      quien: cfg.quien,
      n: n,
      nPadre: nPadre,
      share: r3(nPadre ? n / nPadre : 0),      // cuota entre las respuestas de esa posición
      shareD4: Math.round((nD4 ? n / nD4 : 0) * 1e6) / 1e6,  // cuota sobre el total de partidas con 1.d4 de la muestra
      w: mv.white, d: mv.draws, b: mv.black,
      scoreW: r3(puntajeBlancas(mv)),          // puntaje de las blancas desde esa posición
      respuestas: hijo.moves.slice(0, 4).map(function (m) {
        return { san: m.san, n: total(m), scoreW: r3(puntajeBlancas(m)) };
      })
    };
    console.log(n.toLocaleString("es-AR") + " part. · " + Math.round(out[key].share * 1000) / 10 +
                "% del nodo · blancas " + Math.round(out[key].scoreW * 1000) / 10 + "%");
  }

  var meta = {
    fuente: "Lichess opening explorer",
    speeds: CONFIG.speeds,
    ratingMin: Number(CONFIG.ratings.split(",")[0]),
    desde: CONFIG.since,
    hasta: CONFIG.until,
    generado: new Date().toISOString().slice(0, 10),
    partidas1d4: nD4,
    /* rendimiento base: cómo le va a las blancas en el total de partidas con 1.d4,
       para poder comparar cada línea contra el promedio del propio repertorio */
    scoreBase: r3(puntajeBlancas(raiz))
  };

  var js = "/* Generado por tools/fetch-stats.js — no editar a mano.\n" +
           "   Fuente: explorador de Lichess · " + meta.speeds + " · rating " + meta.ratingMin +
           "+ · " + meta.desde + " a " + meta.hasta + " */\n" +
           "var STATS=" + JSON.stringify({ meta: meta, lineas: out }, null, 1) + ";\n";
  if (process.env.DRY) { console.log("\n(DRY: no se escribió tools/stats.js)"); return; }
  fs.writeFileSync(SALIDA, js, "utf8");
  console.log("\nEscrito tools/stats.js (" + Object.keys(out).length + " líneas).");
})().catch(function (e) {
  console.error("\nFalló: " + e.message);
  process.exit(1);
});
