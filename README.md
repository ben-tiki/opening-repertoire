# Repertorio de aperturas · Londres / Caro-Kann / Eslava

Guía interactiva de preparación de aperturas, en español. Un repertorio completo
—**Sistema Londres** con blancas, **Caro-Kann** y **Eslava** con negras— con foco
en lo que más cuesta estudiar solo: los gambitos, celadas y sistemas agresivos
con los que el rival intenta sacarte de tu terreno.

Son 34 fichas autónomas. Cada una trae un tablero que se recorre jugada a jugada,
la idea del rival, la respuesta recomendada y el plan que sigue.

## Ver la guía

Es un sitio estático sin build ni dependencias: alcanza con abrir `index.html`
en el navegador. Funciona igual servido por HTTP:

```sh
python -m http.server 8000     # http://localhost:8000
```

Para publicarlo en GitHub Pages: *Settings → Pages → Deploy from a branch*,
rama `main`, carpeta `/ (root)`.

## Cómo se usa

- Los tableros se navegan con los botones, haciendo clic en cualquier jugada o
  con las flechas <kbd>←</kbd> <kbd>→</kbd> (con el tablero seleccionado).
- Jugadas en rojo: errores. Círculo rojo: casilla crítica. Flecha verde: plan.
- **Seguir en Lichess** abre la posición actual en un tablero de análisis con
  motor real. **Copiar FEN** la lleva al portapapeles.
- El botón **Índice** salta a cualquier ficha; en pantallas de 1800px o más el
  índice queda fijo a la derecha.

## Estructura

```
index.html              La guía entera: texto, fichas e índice.
assets/
  css/styles.css        Estilos, con paleta clara/oscura en variables CSS.
  js/lines.js           Datos: las 31 líneas, jugada por jugada.
  js/board.js           El tablero interactivo de cada ficha.
  js/ui.js              Índice flotante y cambio de tema.
data/stats.js           Estadísticas de Lichess. Generadas, hoy sin usar.
docs/stats.md           Cómo regenerarlas y cómo reconectar el bloque.
tools/fetch-stats.js    Generador de data/stats.js.
```

### Formato de las líneas

Cada línea de `assets/js/lines.js` es una secuencia de jugadas (*plies*):

```js
[san, [[desde, hasta], …], nota, { mala:1, hl:[casillas], arr:[[de, a], …] }]
```

- `san` — la jugada en notación española (`4.c3`, `4...Cc6`).
- El segundo campo lista los movimientos de piezas; son varios en el enroque.
- `nota` — el texto que aparece bajo el tablero al llegar a esa jugada.
- El cuarto campo es opcional: `mala` pinta la jugada de rojo, `hl` dibuja
  círculos en casillas críticas y `arr` dibuja flechas de plan.

`flip:1` en una línea muestra el tablero desde las negras.

## Credenciales

No hay ninguna en el repositorio. El único servicio que requiere autenticación
es el explorador de Lichess que usa `tools/fetch-stats.js`, y su token se lee de
la variable de entorno `LICHESS_TOKEN` o del archivo `~/.lichess-token`, fuera
del proyecto. Ver [docs/stats.md](docs/stats.md).

## Créditos y licencia

Las piezas son el set **cburnett**, el mismo que usan Lichess y Wikipedia, bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Los vectores
están incrustados en `assets/js/board.js`.

Las estadísticas de `data/stats.js` provienen del
[explorador de aperturas de Lichess](https://lichess.org/analysis), sobre la base
de datos abierta de partidas de Lichess.
