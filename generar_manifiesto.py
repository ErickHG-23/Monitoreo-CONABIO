#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generar_manifiesto.py

Escanea las carpetas videosMP4/ y miniaturas/ y escribe manifiesto.js,
que es la lista que lee el juego. Solo usa la biblioteca estándar de Python 3.

  - El nombre de la especie sale del nombre del archivo, sin la extensión y
    cambiando los guiones bajos por espacios:  Zorra_gris.mp4 -> "Zorra gris"
  - La miniatura de un video es la imagen (.jpg, .jpeg, .png o .webp) que
    tenga el mismo nombre en miniaturas/:  Zorra_gris.mp4 <-> Zorra_gris.jpg

Uso (desde la carpeta del proyecto):

    python3 generar_manifiesto.py        (en Windows: python generar_manifiesto.py)
"""

import json
import sys
import unicodedata
from pathlib import Path

# ---------- Configuración (editable) ----------
CARPETA_VIDEOS = "videosMP4"
CARPETA_MINIATURAS = "miniaturas"
EXTENSIONES_VIDEO = {".mp4", ".m4v", ".webm"}
EXTENSIONES_IMAGEN = {".jpg", ".jpeg", ".png", ".webp"}
PANELES = 9   # solo se usa para avisar si hay más o menos videos
# ----------------------------------------------

RAIZ = Path(__file__).resolve().parent
SALIDA = RAIZ / "manifiesto.js"


def normalizar(texto):
    """NFC + minúsculas, para comparar nombres sin importar acentos compuestos ni mayúsculas."""
    return unicodedata.normalize("NFC", texto).casefold()


def nombre_visible(stem):
    """'Venado_cola_blanca' -> 'Venado cola blanca'."""
    texto = unicodedata.normalize("NFC", stem).replace("_", " ")
    return " ".join(texto.split())


def listar(carpeta, extensiones):
    if not carpeta.is_dir():
        return []
    archivos = [
        p for p in carpeta.iterdir()
        if p.is_file()
        and not p.name.startswith(".")          # ignora .DS_Store, ._archivo, etc.
        and p.suffix.lower() in extensiones
    ]
    return sorted(archivos, key=lambda p: normalizar(p.name))


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    dir_videos = RAIZ / CARPETA_VIDEOS
    dir_minis = RAIZ / CARPETA_MINIATURAS

    if not dir_videos.is_dir():
        print("[ERROR] No existe la carpeta '%s' junto a este script." % CARPETA_VIDEOS)
        return 1

    videos = listar(dir_videos, EXTENSIONES_VIDEO)
    imagenes = listar(dir_minis, EXTENSIONES_IMAGEN)
    if not dir_minis.is_dir():
        print("[AVISO] No existe la carpeta '%s'." % CARPETA_MINIATURAS)

    # nombre-sin-extensión (normalizado) -> archivo de imagen
    miniaturas = {}
    for img in imagenes:
        miniaturas.setdefault(normalizar(img.stem), img.name)

    entradas = []
    avisos = []
    usadas = set()
    for v in videos:
        clave = normalizar(v.stem)
        mini = miniaturas.get(clave)
        if mini:
            usadas.add(clave)
        else:
            avisos.append("'%s' no tiene miniatura: se usará el primer cuadro del video." % v.name)
        entradas.append({
            "archivo": v.name,
            "nombre": nombre_visible(v.stem),
            "miniatura": mini,
        })

    for clave, nombre in miniaturas.items():
        if clave not in usadas:
            avisos.append("La miniatura '%s' no corresponde a ningún video." % nombre)

    datos = {
        "carpetaVideos": CARPETA_VIDEOS,
        "carpetaMiniaturas": CARPETA_MINIATURAS,
        "videos": entradas,
    }
    contenido = (
        "// Archivo generado automáticamente por generar_manifiesto.py. No lo edites a mano.\n"
        "window.MANIFIESTO = "
        + json.dumps(datos, ensure_ascii=True, indent=2)
        + ";\n"
    )
    SALIDA.write_text(contenido, encoding="utf-8")

    print("[OK] manifiesto.js generado con %d video(s):" % len(entradas))
    for i, e in enumerate(entradas, 1):
        marca = "miniatura OK" if e["miniatura"] else "SIN miniatura"
        print("  %2d. %-30s  %s  (%s)" % (i, e["nombre"], marca, e["archivo"]))

    if len(entradas) == 0:
        avisos.append("La carpeta '%s' no tiene videos (%s)." %
                      (CARPETA_VIDEOS, ", ".join(sorted(EXTENSIONES_VIDEO))))
    elif len(entradas) < PANELES:
        avisos.append("Hay %d videos y el tablero tiene %d paneles: los sobrantes quedarán vacíos."
                      % (len(entradas), PANELES))
    elif len(entradas) > PANELES:
        avisos.append("Hay %d videos y el tablero tiene %d paneles: en cada ronda se eligen %d al azar."
                      % (len(entradas), PANELES, PANELES))

    for a in avisos:
        print("[AVISO] " + a)
    return 0


if __name__ == "__main__":
    sys.exit(main())
