"""Genera index.html a partir de src/ (CSS y JS inline, sin dependencias).
Uso: python3 build.py
"""
import pathlib

root = pathlib.Path(__file__).resolve().parent
src = root / 'src'
css = (src / 'styles.css').read_text(encoding='utf-8')
js = '\n'.join((src / f).read_text(encoding='utf-8') for f in ['content-shared.js', 'content-cases.js', 'content-exam.js', 'game-bjs.js', 'app.js'])
assert '</script' not in js.lower(), 'script tag inside JS'

html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Simulador de socorrismo acuático · Comunitat Valenciana</title>
<meta name="description" content="Simulador de situaciones de primeros auxilios y salvamento acuático basado en el temario FSSCV/RFESS.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Big+Shoulders+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<header id="top"></header>
<main id="app"></main>
<script>
{js}
</script>
</body>
</html>
'''
out = root / 'index.html'
out.write_text(html, encoding='utf-8')
print('written', out, len(html.encode('utf-8')), 'bytes')
