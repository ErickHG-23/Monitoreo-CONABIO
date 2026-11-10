# Juego de revelación de videos

Tablero de 3 × 5 paneles numerados. Al hacer clic en un panel, gira como carta y revela un video de cámara trampa a pantalla completa. Al cerrarlo, el panel queda volteado con la miniatura y la especie se suma a la lista de la derecha.

## Estructura

```
index.html              página del juego
estilos.css             colores y tamaños (zona editable al inicio del archivo)
juego.js                lógica del juego
generar_manifiesto.py   escanea las carpetas y escribe manifiesto.js
manifiesto.js           lista de videos (se genera solo, no se edita a mano)
videosMP4/              los videos, uno por especie
miniaturas/             una imagen por video, con el mismo nombre
.github/workflows/      Action que regenera manifiesto.js al subir videos
```

## Cambiar los videos

1. Mete los videos (MP4, H.264) en `videosMP4/` y las miniaturas en `miniaturas/`.
2. El nombre del archivo es el nombre de la especie, con guiones bajos en lugar de espacios:
   `Venado_cola_blanca.mp4` aparece como **Venado cola blanca**.
3. La miniatura debe llamarse igual que su video: `Venado_cola_blanca.jpg` (también `.jpeg`, `.png` o `.webp`).
4. Actualiza la lista de videos de **una** de estas formas:
   - **En tu computadora:** `python3 generar_manifiesto.py` (en Windows: `python generar_manifiesto.py`). Te imprime qué videos encontró y avisa si falta alguna miniatura.
   - **En GitHub:** al subir los archivos, la Action `Actualizar manifiesto de videos` regenera `manifiesto.js` y lo guarda en el repositorio. También puedes lanzarla a mano desde la pestaña *Actions*.

Si hay más de 15 videos, en cada ronda se eligen 15 al azar. Si hay menos, los paneles sobrantes quedan vacíos y se avisa arriba.

## Usarlo

- **Sin internet:** basta con abrir `index.html` con doble clic (Chrome, Edge o Firefox).
- **Con GitHub Pages:** en el repositorio, *Settings → Pages → Deploy from a branch → main / (root)*. La dirección queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Controles: clic en un panel para revelar · `Esc` o la **✕** para cerrar el video · clic en un panel ya volteado para volver a verlo · **Reiniciar** para voltear todo y repartir los videos de nuevo al azar.

## Personalizar

Todo lo visual está en la **ZONA EDITABLE** al inicio de `estilos.css`: color de fondo, de letra, de los paneles, de los botones, tamaños de letra y velocidad del giro. El título de arriba se cambia en `index.html` (busca `EDITA AQUÍ EL TÍTULO`). Las columnas y filas del tablero están al inicio de `juego.js`.

## Notas

- GitHub rechaza archivos de más de 100 MB; conviene comprimir los videos antes de subirlos.
- Los navegadores pueden bloquear el autoplay en algunos casos (sobre todo Safari). Si pasa, el video abre pausado y se inicia con el botón de play.
- Está pensado para pantallas horizontales (proyector o laptop), no para celular.
