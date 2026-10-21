"""Prépare les peintures de public/paints (originaux) dans public/paint (noms du montage) :
fond vert retiré, faux damier retiré, opacité corrigée. Relancer après avoir remplacé un original."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / 'public'
SRC, OUT = ROOT / 'paints', ROOT / 'paint'
OUT.mkdir(exist_ok=True)

# Original → nom utilisé dans le montage, et traitement.
FILES = {
    'bed.png': ('bedroom-plate.png', None),
    'hero-bed.png': ('bedroom-hero.png', 'alpha'),
    'beach.png': ('story-beach.png', None),
    'Golden Hour Beach Soccer.png': ('story-football.png', None),
    'Sunset Rooftop Tea Gathering.png': ('story-ataya.png', None),
    'Dakar Nights_ Rooftop Concert Energy.png': ('story-concert.png', None),
    'Sunset Over a Statue-Crowned Coastal City.png': ('walk-sky.png', None),
    'Golden Promenade Green Screen.png': ('walk-promenade.png', 'green'),
    'Walking Young Man in Orange Hoodie.png': ('walk-hero.png', 'alpha'),
    'Five Friends Against Green.png': ('walk-group.png', 'green'),
    'Tropical Sunset Tea by the Sea.png': ('sunset-plate-18h.png', None),
    'Twilight Tea by the Sea.png': ('sunset-plate-20h.png', None),
    'Six Friends Sharing a Laugh.png': ('sunset-group.png', 'checker'),
}


def solid_alpha(img: Image.Image) -> Image.Image:
    """Opacité 99 % → 100 % (le générateur ne met jamais 255)."""
    rgba = np.array(img.convert('RGBA')).astype(np.int32)
    a = rgba[..., 3]
    rgba[..., 3] = np.where(a >= 245, 255, a)
    return Image.fromarray(rgba.astype(np.uint8))


def key_green(img: Image.Image) -> Image.Image:
    """Fond vert retiré, avec un bord adouci et la teinte verte des contours neutralisée."""
    rgb = np.array(img.convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    greenness = g - np.maximum(r, b)  # ≈ 250 sur le fond, ≤ 0 sur les personnages
    alpha = np.clip(1 - (greenness - 40) / 110, 0, 1)
    # Débordement de vert sur les contours : on ramène le vert au niveau du rouge et du bleu.
    spill = greenness > 0
    rgb[..., 1] = np.where(spill, np.maximum(r, b) + np.minimum(greenness, 0), g)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def remove_checker(img: Image.Image) -> Image.Image:
    """Faux damier peint (gris/blanc neutres) : remplissage depuis les bords, puis bord adouci."""
    rgb = np.array(img.convert('RGB')).astype(np.int32)
    h, w, _ = rgb.shape
    neutral = (rgb.max(axis=2) - rgb.min(axis=2) < 9) & (rgb.min(axis=2) > 218)
    bg = np.zeros((h, w), bool)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if neutral[y, x]:
                bg[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if neutral[y, x] and not bg[y, x]:
                bg[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and neutral[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                queue.append((ny, nx))
    mask = Image.fromarray(((~bg) * 255).astype(np.uint8))
    # Mange le liseré clair d'anticrénelage, puis adoucit le bord.
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


for src, (dest, mode) in FILES.items():
    path = SRC / src
    if not path.exists():
        print(f'absent : {src}')
        continue
    img = Image.open(path)
    if mode == 'alpha':
        img = solid_alpha(img)
    elif mode == 'green':
        img = key_green(img)
    elif mode == 'checker':
        img = remove_checker(img)
    else:
        img = img.convert('RGB')
    img.save(OUT / dest, optimize=True)
    print(f'{dest:24} {img.size[0]}×{img.size[1]}  {img.mode}')
