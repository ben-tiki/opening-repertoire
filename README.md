# Repertorio de aperturas · Londres / Caro-Kann / Eslava

Guía interactiva de preparación de aperturas, en español: **Sistema Londres** con
blancas, **Caro-Kann** y **Eslava** con negras. 34 fichas, cada una con un tablero
que se recorre jugada a jugada, la idea del rival, la respuesta recomendada y el
plan que sigue. Recorre los planes centrales de cada apertura, las defensas más
habituales y las líneas afiladas que conviene tener vistas.

## Ver la guía

Sitio estático, sin build ni dependencias: abrí `index.html` en el navegador.

## Cómo se usa

- Los tableros se navegan con los botones, haciendo clic en cualquier jugada o
  con las flechas <kbd>←</kbd> <kbd>→</kbd> (con el tablero seleccionado).
- Jugadas en rojo: errores. Círculo rojo: casilla crítica. Flecha verde: plan.
- **Seguir en Lichess** abre la posición actual en un tablero con motor.
  **Copiar FEN** la lleva al portapapeles.
- El botón **Índice** salta a cualquier ficha.

## Estructura

```
index.html              La guía entera: texto, fichas e índice.
assets/css/styles.css   Estilos. Paleta clara/oscura en variables CSS.
assets/js/lines.js      Datos: 31 líneas, 449 jugadas.
assets/js/board.js      El tablero interactivo de cada ficha.
assets/js/ui.js         Índice flotante y cambio de tema.
tools/                  Generador de estadísticas y referencia para extender
                        el repertorio — ver tools/README.md.
```

Para **agregar una apertura**, la referencia completa (formato de las líneas,
plantilla de ficha, tags y bloques disponibles) está en
[tools/README.md](tools/README.md).

## Credenciales

No hay ninguna en el repositorio. El único servicio autenticado es el explorador
de Lichess que usa `tools/fetch-stats.js`; su token se lee de `LICHESS_TOKEN` o
de `~/.lichess-token`, fuera del proyecto.

## Créditos

Piezas: set **cburnett**, el mismo de Lichess y Wikipedia, bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) — los vectores
están en `assets/js/board.js`. Estadísticas: explorador de aperturas de Lichess.
