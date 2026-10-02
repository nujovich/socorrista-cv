# Simulador de socorrismo acuático · Comunitat Valenciana

App web para practicar situaciones de primeros auxilios y salvamento acuático, basada en el temario del curso de la FSSCV (manual RFESS de Primeros Auxilios y *Técnicas de rescate y lesión medular en el medio acuático*). Castellano y valenciano.

## Qué incluye

- **Casos**: 12 escenarios (piscina, playa, parque acuático, aguas abiertas) con fase de rescate y de primeros auxilios. En cada paso eliges la acción; la corrección cita la unidad del temario. Feedback con banderas: verde, amarilla y roja (una acción que causa daño invalida el caso, como en el examen de la FSSCV).
- **Examen**: test de 10 o 20 preguntas de un banco de 52, corrección al final.
- **Simulación 3D en primera persona** (piscina y playa con corriente de retorno): ves tus brazos y el material; señal, tubo, entrada, nado con la cabeza fuera, control y remolque en tiempo real; extracción animada (con compañero, sola o arrastre en playa) y primeros auxilios con tus manos sobre la víctima: consciencia, vía aérea, VOS, insuflaciones con mascarilla, RCP a ritmo, parches del DESA y descarga, PLS y manta.
- **Diálogo**: simulacro conversacional con IA (víctima, testigos y entorno), con dictado y lectura en voz alta.
- **Progreso**: notas por caso, historial de exámenes, errores críticos, exportar/importar.

## Publicación

Es un único `index.html`; solo carga Three.js r128 desde cdnjs y las fuentes de Google Fonts. Sirve para GitHub Pages tal cual: *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

### Diálogo con IA fuera de claude.ai

En GitHub Pages el modo Diálogo necesita una clave de API de Anthropic, que se pega en la propia pestaña *Diálogo*. Se guarda únicamente en el `localStorage` de ese navegador y las llamadas van directas a `api.anthropic.com` (cabecera `anthropic-dangerous-direct-browser-access`). El coste corre a cargo de esa cuenta de API. **No pongas nunca la clave en el código ni en el repositorio.**

El progreso en GitHub Pages se guarda en el navegador; usa *Exportar/Importar progreso* para pasarlo entre dispositivos.

## Desarrollo

```
src/
  content-shared.js   cadenas de interfaz (ES/VA) y pasos reutilizables
  content-cases.js    los 12 casos
  content-exam.js     banco de preguntas
  game3d.js           simulación 3D en primera persona y mini-juegos
  app.js              lógica
  styles.css
build.py              genera index.html
tools/validate.js     comprueba que todo el contenido tiene ES y VA
```

```
python3 build.py        # regenera index.html
node tools/validate.js  # valida el contenido
```

## Fuentes

Temario del curso de socorrismo acuático FSSCV 11/26AL; RFESS, *Manual de Primeros Auxilios* (2017); García Sanz, A. (coord.), *Técnicas de rescate y lesión medular en el medio acuático*, RFESS 2015. Donde el temario se contradice, el punto aparece como nota y no se evalúa.
