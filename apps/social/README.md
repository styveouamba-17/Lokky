# @lokky/social

Vidéos courtes pour TikTok, Reels et Shorts, en pixel art, faites en code avec
[Remotion](https://www.remotion.dev/) : 1080 × 1920, 30 images/s.

Première vidéo : **« Corniche »** (34 s). Un soir, seul dans sa chambre, il ouvre Lokky. Le
lendemain, il rejoint cinq inconnus sur la Corniche. À 20 h, ce sont ses potes.

Deux versions du même film (même script, mêmes sons, même minutage) :

- `LokkyCorniche` : pixel art dessiné en code ;
- `LokkyCornichePeint` : peintures « Dakar Adventures » animées en profondeur (calques qui
  bougent à des vitesses différentes), vrai logo, écran de l'app recomposé.

## Commandes

```bash
npm run studio -w @lokky/social        # aperçu interactif dans le navigateur
npm run render -w @lokky/social        # → out/lokky-corniche.mp4 (pixel art)
npm run render:peint -w @lokky/social  # → out/lokky-corniche-peint.mp4 (peint)
npm run paint -w @lokky/social         # prépare les peintures (public/paints → public/paint)
npm run sfx -w @lokky/social           # régénère les effets sonores (public/sfx)
```

## Peintures

Les originaux générés vont dans `public/paints/` ; `scripts/prepare-paint.py` (Python avec
Pillow et NumPy) les copie dans `public/paint/` sous les noms du montage, en retirant le fond
vert, le faux damier et l'opacité incomplète. Pour remplacer une image : remplacer l'original,
relancer `npm run paint`, puis le rendu. Liste et prompts : `IMAGES.md`.

## Voix off (ElevenLabs)

Une réplique = un fichier. Générer chaque ligne **séparément**, avec le texte exact, et
l'enregistrer dans `public/vo/` sous le nom indiqué (`.mp3` ou `.wav`). La vidéo l'intègre
automatiquement au prochain rendu ; tant qu'un fichier manque, la vidéo se rend sans lui.

| Fichier | Texte | Durée visée |
|---|---|---|
| `vo1` | Le problème à Dakar, c'est pas qu'il y a rien à faire. | 3,3 s |
| `vo2` | C'est avec qui. | 1,7 s |
| `vo3` | Tes potes sont partis, t'es nouveau en ville… et le week-end, tu scrolles. | 4,5 s |
| `vo4` | Puis un soir, une notif. | 1,8 s |
| `vo5` | Une sortie à la Corniche. Il appuie sur « Je viens ! ». | 3,1 s |
| `vo6` | Sur place : cinq inconnus. Zéro malaise. | 3 s |
| `vo7` | Un thé, des fous rires, le coucher de soleil… | 2,3 s |
| `vo8` | À 18 h, c'étaient des inconnus. À 20 h, c'étaient ses potes. | 4,6 s |
| `vo9` | Lokky. Des sorties, de vraies rencontres. Télécharge l'app. | 3,7 s |

Conseils :

- Voix masculine ou féminine jeune, posée, un peu complice (un pote qui raconte, pas une pub).
  Si possible une voix française d'Afrique de l'Ouest.
- Réglages de départ : stabilité ≈ 40 %, similarité ≈ 75 %, style ≈ 20 %, modèle
  multilingue v2 (ou plus récent).
- `vo2` (« C'est avec qui. ») tombe sur l'impact : à dire sec, avec une petite pause avant.
- Une réplique trop longue déborde sur la suivante : régénérer un peu plus vite, ou
  m'envoyer les durées réelles pour que j'ajuste le minutage (`src/script.ts`).

Les sous-titres sont incrustés et suivent le minutage de `src/script.ts` (mots répartis selon
leur longueur). Pour un calage au mot près, exporter aussi la transcription horodatée
d'ElevenLabs : on pourra la brancher sur les sous-titres.

## Organisation

- `src/script.ts` : texte, minutage, instants clés, effets sonores et ambiances.
- `src/scenes/` : les six scènes (chambre, stories, notification, marche, coucher de soleil, fin).
- `src/paint/` : scènes de la version peinte (chambre, marche, coucher de soleil) et calques.
- `src/pixel/` : moteur pixel art (toile 135 × 240, 1 pixel = 8 × 8) et sprites dessinés à la main.
- `src/ui/` : caméra, tremblements, flashs, tampons, transitions, sous-titres.
- `public/sfx/` : effets sonores synthétisés par `scripts/make-sfx.mjs` (aucune licence tierce).
- `public/fonts/` : Fredoka, DM Sans et Pixelify Sans (licence OFL, `OFL.txt`).

Pas de musique dans le fichier : sur TikTok, ajouter un son de la bibliothèque à faible volume
(les sons tendance aident la diffusion).

Remotion est gratuit pour un particulier ou une entreprise de 3 personnes au plus
(au-delà, licence payante).
