# Estadísticas de Lichess (archivado, no se renderiza)

El repertorio tiene un pipeline completo para mostrar, debajo de cada tablero,
qué tan frecuente y qué tan bien le va en la práctica a la jugada que define la
ficha. Está **construido y con datos descargados, pero desconectado de la
página**: `data/stats.js` no se carga en `index.html`.

Se archivó así a propósito: el bloque agregaría un elemento visual nuevo a las 34
fichas, y el contenido actual ya está cerrado. Retomarlo es cuestión de
reconectar las tres piezas de abajo.

## Piezas

| Pieza | Estado |
|---|---|
| `tools/fetch-stats.js` | Generador. Funciona; se corre a mano. |
| `data/stats.js` | Datos descargados (2026-01 a 2026-06, +1800, blitz/rapid/classical). |
| El widget y su CSS | Removidos de `assets/`. El código está más abajo. |

## Regenerar los datos

El explorador de Lichess responde `401` sin credencial. El token se lee de la
variable `LICHESS_TOKEN` o del archivo `~/.lichess-token` — **nunca del repo**.

```sh
# crear el token en https://lichess.org/account/oauth/token/create
# (no hace falta marcar ningún permiso)
echo "TU_TOKEN" > ~/.lichess-token

node tools/fetch-stats.js

# variantes
DRY=1 node tools/fetch-stats.js                      # sólo imprime las URLs
SPEEDS=blitz,rapid RATINGS=2000,2200,2500 \
  SINCE=2026-01 UNTIL=2026-06 node tools/fetch-stats.js
```

El mapa `CLAVE` dentro del generador define, para cada línea, el índice de la
jugada que se quiere medir. Si se agregan líneas a `assets/js/lines.js` hay que
agregarlas también ahí.

## Cómo volver a conectarlo

1. Cargar los datos en `index.html`, antes de `board.js`:
   ```html
   <script src="assets/js/lines.js"></script>
   <script src="data/stats.js"></script>
   <script src="assets/js/board.js"></script>
   ```
2. Restaurar el CSS (ver más abajo) en `assets/css/styles.css`.
3. Pegar el widget en `board.js` y llamarlo al final de `build()`, después de
   crear la nota:
   ```js
   var stats = statsPara(container.getAttribute("data-line"));
   if (stats) container.appendChild(stats);
   ```

### Widget

Lichess devuelve SAN en inglés y el resto de la guía usa notación española, de
ahí la traducción de `sanEs`.

```js
var SAN_ES = { K:"R", Q:"D", R:"T", B:"A", N:"C" };

function sanEs(san){
  if(!san) return san;
  if(/^O-O/.test(san)) return san.replace(/O/g,"0");
  return SAN_ES[san[0]] ? SAN_ES[san[0]] + san.slice(1) : san;
}

function statsPara(key){
  if(typeof STATS==="undefined" || !STATS) return null;
  var d = STATS.lineas && STATS.lineas[key];
  var el = document.createElement("div");
  el.className = "stats";

  if(!d) return null;
  if(d.sinDatos){
    el.className += " pendiente";
    el.innerHTML = "Sin partidas suficientes para esta línea con los filtros aplicados.";
    return el;
  }

  var m = STATS.meta || {};
  var num = function(n){ return (n||0).toLocaleString("es-AR") };
  var pct = function(x,dec){ return ((x||0)*100).toFixed(dec===undefined?1:dec).replace(".",",")+"%" };
  var negras = /^l[23]/.test(key);
  var score = negras ? (1-d.scoreW) : d.scoreW;
  var n=d.n||0, w=d.w||0, dr=d.d||0, b=d.b||0;
  var cab = (m.desde && m.hasta) ? (m.desde+" a "+m.hasta) : "";

  /* Comparación contra la media de la muestra completa (todas las partidas que
     empiezan con 1.d4 en el mismo período y rango de rating): un 51% aislado no
     dice nada, un -1,5 sí. */
  var delta = function(sc, esNegras){
    if(!m.scoreBase) return "";
    var base = esNegras ? (1-m.scoreBase) : m.scoreBase;
    var dd = (sc-base)*100;
    if(Math.abs(dd) < 0.3) return " · en la media general";
    return " · " + (dd>0?"+":"−") + Math.abs(dd).toFixed(1).replace(".",",") + " sobre la media general";
  };

  var s = '<div class="s-head"><span class="s-src">Lichess</span> <span>'+
          (m.ratingMin?("+"+m.ratingMin+" · "):"")+cab+'</span>'+
          (d.san?('<span class="s-san">'+d.san+'</span>'):"")+'</div>'+
    '<div class="s-row">'+
      '<div class="s-cell"><b>'+num(n)+'</b><span>partidas</span></div>'+
      '<div class="s-cell"><b>'+pct(d.share)+'</b><span>de las respuestas en esta posición</span></div>'+
      '<div class="s-cell"><b>'+pct(score)+'</b><span>puntaje '+(negras?"negras":"blancas")+delta(score,negras)+'</span></div>'+
    '</div>'+
    '<div class="s-bar" title="Blancas '+pct(n?w/n:0)+' · tablas '+pct(n?dr/n:0)+' · negras '+pct(n?b/n:0)+'">'+
      '<i class="w" style="width:'+(n?w/n*100:0).toFixed(1)+'%"></i>'+
      '<i class="d" style="width:'+(n?dr/n*100:0).toFixed(1)+'%"></i>'+
      '<i class="b" style="width:'+(n?b/n*100:0).toFixed(1)+'%"></i>'+
    '</div>';

  var pie = [];
  if(d.shareD4) pie.push((d.shareD4<0.0001?"menos del 0,01%":pct(d.shareD4,2))+" del total de partidas con 1.d4");
  if(d.respuestas && d.respuestas.length){
    pie.push("continuaciones más jugadas: "+d.respuestas.slice(0,3).map(function(r){
      return sanEs(r.san)+" ("+num(r.n)+", "+pct(negras?1-r.scoreW:r.scoreW,0)+")";
    }).join(" · "));
  }
  if(pie.length) s += '<div class="s-foot">'+pie.join(" — ")+'</div>';

  el.innerHTML = s;
  return el;
}
```

### CSS

```css
  /* Estadísticas del explorador de Lichess (data/stats.js) */
  .stats{
    margin-top:12px;background:var(--bg);border:1px solid var(--border-soft);
    border-radius:8px;padding:10px 13px 11px;
  }
  .stats.pendiente{font-size:12.5px;color:var(--muted);line-height:1.5}
  .stats.pendiente code{
    font-family:'JetBrains Mono',monospace;font-size:.92em;
    background:var(--code-bg);color:var(--code-fg);border-radius:4px;padding:1px 5px;
  }
  .stats .s-head{
    display:flex;align-items:center;gap:7px;flex-wrap:wrap;
    font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
    color:var(--muted);margin-bottom:9px;
  }
  .stats .s-src{background:var(--info-soft);color:var(--info);border-radius:4px;padding:1px 6px}
  .stats .s-san{
    margin-left:auto;text-transform:none;letter-spacing:0;
    font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--text);
  }
  .stats .s-row{display:flex;gap:6px}
  .stats .s-cell{flex:1;min-width:0}
  .stats .s-cell b{display:block;font-size:16.5px;font-weight:700;color:var(--text);line-height:1.2}
  .stats .s-cell span{display:block;font-size:11px;color:var(--muted);line-height:1.35;margin-top:2px}
  .stats .s-bar{display:flex;height:7px;border-radius:4px;overflow:hidden;margin-top:10px;background:var(--border-soft)}
  .stats .s-bar i{display:block;height:100%}
  .stats .s-bar .w{background:#c9d1d9}
  .stats .s-bar .d{background:#8b949e}
  .stats .s-bar .b{background:#3d444d}
  .stats .s-foot{margin-top:8px;font-size:11.5px;color:var(--muted);line-height:1.5}
```
