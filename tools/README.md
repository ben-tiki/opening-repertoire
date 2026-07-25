# Referencia para extender el repertorio

Todo lo necesario para agregar una apertura nueva a la guía. Los archivos de
esta carpeta no los usa la página: son el generador de estadísticas y sus datos.

| Archivo | Qué es |
|---|---|
| `fetch-stats.js` | Baja estadísticas del explorador de Lichess y escribe `stats.js`. |
| `stats.js` | Datos ya descargados. **Hoy no se cargan en `index.html`.** |

---

## Agregar una apertura

Hacen falta tres ediciones, siempre con la misma clave (`l1a`, `l2c`, …). La
letra tras el número identifica la ficha dentro de la sección.

### 1. La línea — `assets/js/lines.js`

```js
l1n:{flip:0,intro:"Posición inicial. Descripción corta de qué se va a ver.",plies:[
  ["1.d4",[["d2","d4"]]],
  ["1...d5",[["d7","d5"]]],
  ["2.Af4",[["c1","f4"]],"Nota que aparece bajo el tablero al llegar acá."],
  ["3...Db6?!",[["d8","b6"]],"El error típico.",{mala:1}],
  ["4.Cc3!",[["b1","c3"]],"La respuesta.",{hl:["b5"],arr:[["c3","b5"]]}]
]},
```

Cada jugada (*ply*) es un array de hasta cuatro campos:

| # | Campo | Detalle |
|---|---|---|
| 0 | `san` | Notación **española**: R D T A C (rey, dama, torre, alfil, caballo). Enroque `0-0`. |
| 1 | movimientos | `[[desde,hasta], …]`. Son dos en el enroque: rey y torre. |
| 2 | nota | Opcional. Texto bajo el tablero. Admite `<code>`, `<strong>`. |
| 3 | opciones | Opcional. `mala:1` pinta la jugada de rojo, `hl:[casillas]` dibuja círculos rojos, `arr:[[de,a]]` dibuja flechas verdes. |

En la línea: `flip:1` muestra el tablero desde las negras (usalo para el
repertorio de negras), `intro` es el texto que se ve antes de la primera jugada.

> Las jugadas se aplican tal cual, sin validación: un `[["e2","e4"]]` mal escrito
> mueve la pieza igual. Conviene verificar la línea con **Copiar FEN** en el
> navegador, o con Lichess.
>
> La captura al paso y la promoción no están implementadas — ninguna línea del
> repertorio las necesita. Los derechos de enroque del FEN se deducen de que rey
> y torre sigan en su casilla, así que tampoco contempla mover la torre y volver.

### 2. La ficha — `index.html`

Va dentro de la `<section class="cap">` que corresponda. El `data-line` tiene que
coincidir con la clave de `lines.js`, y el `id` es el ancla del índice.

```html
<article class="ficha" id="v1n">
  <header>
    <span class="num">1N</span>
    <h3>Título de la ficha</h3>
    <span class="tag gambito">Gambito</span>
  </header>
  <div class="grid">
    <div class="panel-board" data-line="l1n"></div>
    <div class="panel-text">
      <div class="bloque maligno"><p class="rot"><span class="g">?!</span> La idea del rival</p>
        <p>Qué busca.</p></div>
      <div class="bloque antidoto"><p class="rot"><span class="g">★</span> La respuesta</p>
        <p>Qué jugar y por qué.</p></div>
      <div class="bloque plan"><p class="rot"><span class="g">⚑</span> Plan de mediojuego</p>
        <p>Cómo sigue.</p></div>
    </div>
  </div>
</article>
```

Variantes disponibles:

- **Tags** — `tactica` (rojo), `gambito` (naranja), `sistema` (azul),
  `defensa`/`arma` (violeta), `modelo` (verde).
- **Bloques** — `maligno` (rojo, la amenaza), `antidoto` (verde, la respuesta),
  `concepto` (azul, la idea de fondo), `plan` (violeta, el mediojuego).
- **Ficha** — `class="ficha modelo"` o `class="ficha arma"` le cambian el borde.

### 3. El índice — `index.html`

Al final del archivo, en `<nav class="toc-panel">`, en el orden de las fichas:

```html
<a href="#v1n"><span class="n">1N</span>Título corto</a>
```

Nada más: los tableros se montan solos al cargar la página y el resaltado del
índice se calcula por `IntersectionObserver`.

---

## Regenerar las estadísticas

El explorador de Lichess responde `401` sin credencial. El token se lee de la
variable `LICHESS_TOKEN` o de `~/.lichess-token` — **nunca del repositorio**.

```sh
# crear el token en https://lichess.org/account/oauth/token/create
# (no hace falta marcar ningún permiso)
echo "TU_TOKEN" > ~/.lichess-token

node tools/fetch-stats.js
DRY=1 node tools/fetch-stats.js     # sólo imprime las URLs, no escribe nada
SPEEDS=blitz,rapid RATINGS=2000,2200,2500 SINCE=2026-01 UNTIL=2026-06 node tools/fetch-stats.js
```

El mapa `CLAVE` dentro de `fetch-stats.js` define, para cada línea, el índice
(base 0) de la jugada que se quiere medir. Si agregás una línea nueva, agregala
también ahí o el generador la saltea.

Los datos están descargados pero **no se muestran**: se archivaron así a
propósito para no sumarle un bloque visual a las 34 fichas. El widget que los
renderizaba —con su CSS— quedó en el historial:

```sh
git show 592eff6:docs/stats.md
```
