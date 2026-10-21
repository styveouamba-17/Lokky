# Vidéo « Corniche », version peinte : images à générer

Même script, même minutage et mêmes sons que la version pixel art ; seules les images changent.
Style : celui de l'app et du site (styleboard « Dakar Adventures », `docs/illustrations.md`).

## Avant de commencer

**Où les déposer** : `apps/social/public/paint/` avec le **nom de fichier exact** indiqué.

**Taille** : la vidéo est en 1080 × 1920 et la caméra zoome jusqu'à × 1,5. Génère au plus
grand format possible, puis **agrandis × 2** (outil d'upscale de ton générateur, ou Upscayl,
gratuit). Minimum utile : 2160 px sur le grand côté.

**Calques** (pour l'effet de profondeur) : les décors sont générés **sans personnages**, et les
personnages **à part**, détourés. Pour les personnages :
- si ton générateur sait faire un fond transparent (ChatGPT Images, par exemple), demande un PNG
  transparent ;
- sinon, demande un **fond vert uni #00FF00** : je le retire moi-même (fin du prompt :
  « isolated on a flat pure green #00FF00 background, no shadow on the background »).

**Même héros d'une image à l'autre** : génère d'abord la fiche personnage (image 0), puis
donne-la **en image de référence** pour toutes les images où il apparaît (référence de
personnage dans Midjourney, image jointe dans ChatGPT, etc.). Même chose pour le groupe
(image 0 b).

**Bloc de style** à coller **à la fin de chaque prompt** (identique à celui de l'app) :

> Warm hand-painted digital gouache illustration, soft brush texture, clean readable shapes, gentle golden-hour light. Color palette: sunset orange #FF6B3D, warm sun yellow #FFC857, ocean turquoise #00B4A6, deep charcoal #1F2937, sand cream #FAF9F6. Young West African characters (Senegal), varied skin tones, natural hair, modern casual streetwear, friendly and relaxed. Friendship vibe only: no couples, no romance, no hearts. Contemporary Dakar setting, subtle and authentic, no folklore clichés. No text, no letters, no logo, no watermark.

---

## 0. Fiches personnages (références, non montées dans la vidéo)

### `ref-hero.png` — le héros · 16:9

> Character reference sheet of the same young Senegalese man, about 22 years old, slim, short black hair with a clean fade, warm dark skin, friendly face. He wears a plain sunset-orange hoodie (#FF6B3D), dark indigo jeans and white sneakers. Three full-body views side by side on a plain cream background: front view, side view walking to the right, back view. Same proportions and outfit in every view, neutral standing pose, soft even lighting.

### `ref-group.png` — les cinq inconnus · 16:9

> Character reference sheet of five young Senegalese friends, full body, standing side by side on a plain cream background, then the same five seen from behind sitting on a low wall. From left to right: a young man with a big round afro in a black t-shirt; a young woman with long box braids in a cream hoodie; a young man in a black cap and an olive-green t-shirt with beige trousers; a young woman with a high bun in a red top; a young man in a khaki bucket hat and a navy sweatshirt carrying a beige backpack. Same outfits in both views, soft even lighting.

---

## 1. La chambre, la nuit (0–6 s, l'accroche)

### `bedroom-plate.png` — décor · 9:16 vertical

> Vertical 9:16 interior of a small modest bedroom in Dakar at night, seen from the side. A large window in the upper half shows the Dakar city skyline at night with scattered warm lit windows, a crescent moon and a few stars. Below the window, a simple bed with a turquoise blanket and a cream pillow, a round analog wall clock showing about a quarter to ten, a small plant on the windowsill, a poster of a sunset on the wall. Cool blue moonlight, deep indigo and purple shadows, calm and a bit lonely mood. Empty room, no people.

### `bedroom-hero.png` — personnage, détouré

> The young man from the reference (orange hoodie, indigo jeans, white sneakers), sitting alone on the edge of a bed, seen from the side facing right, shoulders slightly hunched, looking down at his phone held in both hands. The phone screen lights his face with a cool blue glow. Bored, a bit lonely expression. Full body, isolated (transparent background or flat pure green #00FF00), no bed, no room.

---

## 2. Les stories des autres (6–11 s)

Quatre images **9:16 verticales**, comme des stories que le héros fait défiler : cadrage
« pris au téléphone », vivant, un peu de mouvement.

### `story-beach.png` — Plage de Ngor

> Vertical 9:16 phone-story style scene: four young friends laughing in the shallow turquoise waves at Ngor beach in Dakar, splashing water, the small Ngor island and colorful pirogues in the background, bright late-afternoon sun. Candid, joyful, energetic.

### `story-football.png` — Foot à Yoff

> Vertical 9:16 phone-story style scene: young friends playing a pickup football match on the sand at Yoff beach in Dakar, one player mid-kick, goals made of sticks, golden dust in the air, ocean behind. Candid, dynamic, joyful.

### `story-ataya.png` — Ataya à Mermoz

> Vertical 9:16 phone-story style scene: young friends sitting on low stools on a Dakar rooftop terrace in the evening, sharing attaya tea, one pouring tea from high above into small glasses, string lights overhead, warm cozy light, laughter.

### `story-concert.png` — Concert au Plateau

> Vertical 9:16 phone-story style scene: a small live concert in Dakar at night seen from the crowd, young people raising their hands, a singer on a small stage, purple and orange stage lights cutting through light haze. Energetic, festive.

---

## 3. La notification et « Je viens ! » (11–17 s)

**Pas d'image à générer** : cette scène utilise les **vrais écrans de l'app**. À fournir :

- `screen-notification.png` : capture de l'écran verrouillé avec une notification Lokky
  « Une sortie pour toi » (tu peux la déclencher depuis l'admin ou la reconstituer, je la
  recompose sinon) ;
- `screen-activity.mp4` : **enregistrement d'écran** de la fiche d'une sortie
  « Coucher de soleil à la Corniche », jusqu'à l'appui sur « Je viens ! » (5 à 8 s suffisent).
  Sur iPhone : Centre de contrôle › Enregistrement de l'écran ; sur Android : réglages rapides
  › Enregistrer l'écran.

---

## 4. L'arrivée sur la Corniche (17–23 s)

La caméra fait un travelling de gauche à droite : décors **en format paysage 16:9**, très
larges, que je fais défiler dans le cadre vertical.

### `walk-sky.png` — plan lointain · 16:9

> Wide 16:9 panoramic view from the Corniche of Dakar at sunset, looking out to the Atlantic Ocean: a huge orange and yellow sunset sky with soft purple clouds, a big low sun touching the horizon, golden reflection on the turquoise sea, the African Renaissance Monument on its hill and a few buildings far away on the right. Only sky, sea and distant coastline: no wall, no promenade, no people, no palm trees in the foreground.

### `walk-promenade.png` — plan moyen · 16:9 · détouré au-dessus du muret

> Wide 16:9 side view of the Corniche promenade in Dakar at sunset: a long low sandstone sea wall running horizontally across the whole image at mid-height, a wide pale stone-tiled walkway in front of it, two palm trees and three dark street lamps along the walk, warm golden side light and long shadows. No people. Everything above the top of the wall and the palm trees is empty (transparent background or flat pure green #00FF00), so the sky and the sea can be added behind.

### `walk-hero.png` — personnage, détouré

> The young man from the reference (orange hoodie, indigo jeans, white sneakers), full body, seen exactly from the side walking to the right with a relaxed confident stride, one arm swinging forward, warm sunset light on his right side. Isolated (transparent background or flat pure green #00FF00), no ground, no shadow.

*Facultatif, pour un salut* : `walk-hero-wave.png`, même prompt avec « standing, raising his right hand to wave hello with a big smile ».

### `walk-group.png` — le groupe, détouré

> The five friends from the reference, seen from behind, sitting side by side on top of a low wall (the wall itself not drawn), facing away toward the sea, relaxed postures, one of them half-turning to wave toward the left with a smile. Warm sunset backlight outlining their hair and shoulders. Isolated (transparent background or flat pure green #00FF00).

---

## 5. Le coucher de soleil, de 18 h à 20 h (23–29 s)

Même cadrage pour les trois images : la deuxième se génère **à partir de la première**
(variation de l'image, ou image jointe avec « same composition, same framing ») pour que le
fondu de l'une à l'autre soit propre.

### `sunset-plate-18h.png` — décor 18 h · 9:16 vertical

> Vertical 9:16 view from behind a low sandstone wall on the Corniche of Dakar, facing the Atlantic Ocean at sunset: the top of the wall runs across the lower third of the image, the turquoise sea above it with a golden path of reflected light, a huge orange sun just above the horizon in the center, glowing orange and yellow sky with soft purple clouds, a palm tree on each edge, the African Renaissance Monument small on the far left coastline. A thermos and small tea glasses resting on the wall on the right. No people.

### `sunset-plate-20h.png` — décor 20 h, même cadrage

> Same composition and framing as the reference image, two hours later at nightfall: the sun has set, deep indigo and violet sky with the first stars, a last thin glow of orange on the horizon, the sea dark blue with silver reflections, warm lights of the city coastline and street lamps turned on, the palm trees as dark silhouettes. No people.

### `sunset-group.png` — les six, de dos, détourés

> Six young friends seen from behind, sitting close together side by side on a low wall (the wall itself not drawn), facing away: from left to right the young man with the big afro in black, the young woman with long braids in a cream hoodie, the young man in the sunset-orange hoodie in the middle, the young man in a black cap and olive t-shirt, the young woman with a high bun in red, the young man in a khaki bucket hat and navy sweatshirt. Two of them are laughing, heads tilted back, one has an arm around the shoulder of the orange-hoodie young man. Warm backlight on hair and shoulders. Isolated (transparent background or flat pure green #00FF00).

*Facultatif* : `sunset-group-night.png`, même prompt avec « cool blue night light, a warm glow from a street lamp on the right side of the group », pour l'éclairage de 20 h (sinon je l'assombris moi-même).

---

## 6. La fin (29–34 s)

**Pas d'image à générer** : fond orange, logo, slogan et « Dispo sur iOS & Android »,
comme dans la version pixel art (avec le vrai logo, non pixelisé).

---

## Récapitulatif

| # | Fichier | Format | Rôle |
|---|---|---|---|
| 1 | `ref-hero.png` | 16:9 | Référence du héros (non montée) |
| 2 | `ref-group.png` | 16:9 | Référence du groupe (non montée) |
| 3 | `bedroom-plate.png` | 9:16 | Chambre, décor |
| 4 | `bedroom-hero.png` | détouré | Héros assis au téléphone |
| 5 | `story-beach.png` | 9:16 | Story plage |
| 6 | `story-football.png` | 9:16 | Story foot |
| 7 | `story-ataya.png` | 9:16 | Story ataya |
| 8 | `story-concert.png` | 9:16 | Story concert |
| 9 | `walk-sky.png` | 16:9 | Corniche, plan lointain |
| 10 | `walk-promenade.png` | 16:9 détouré | Corniche, plan moyen |
| 11 | `walk-hero.png` | détouré | Héros qui marche |
| 12 | `walk-group.png` | détouré | Groupe sur le muret |
| 13 | `sunset-plate-18h.png` | 9:16 | Coucher de soleil |
| 14 | `sunset-plate-20h.png` | 9:16 | Même plan, à la nuit |
| 15 | `sunset-group.png` | détouré | Les six, de dos |
| — | `screen-notification.png`, `screen-activity.mp4` | captures | Vrais écrans de l'app |

Facultatifs : `walk-hero-wave.png`, `sunset-group-night.png`.

**Ordre conseillé** : 1 et 2 (références), puis 13, 14 et 15 (le moment fort de la vidéo), puis
9 à 12, puis la chambre, puis les stories. Tu peux m'envoyer les images au fur et à mesure :
je monte chaque scène dès qu'elle est complète, les autres gardent la version pixel art en
attendant.
