# Prompt pour claude.ai : vidéo promotionnelle de Lokky, carte blanche

## Pièces jointes à ajouter au message

Claude s'en sert comme références (il redessine tout en code, il n'insère pas tes fichiers) :

1. **Le logo** : `apps/mobile/assets/icon.png`
2. **Trois captures d'écran de l'app** (sur ton téléphone) : l'écran Découvrir, la fiche
   d'une sortie avec le bouton « Je viens ! », et un chat de groupe.
3. **L'ambiance de marque** : `apps/web/public/og-image.jpg`

## Le prompt (à copier tel quel)

```text
Tu es directeur artistique et motion designer, spécialiste des vidéos courtes qui performent sur TikTok et Instagram Reels. Je te donne carte blanche pour créer la vidéo promotionnelle verticale de mon application mobile Lokky.

## L'app
Lokky est une app sénégalaise, à Dakar, pour trouver des sorties près de chez toi et y aller même si tu ne connais personne : plage, foot, ataya (thé), ciné, concerts, jeux, balades sur la Corniche… On voit les sorties autour de soi, on appuie sur « Je viens ! », un chat de groupe s'ouvre avec les participants, et on se retrouve sur place. On peut aussi créer sa propre sortie en une minute. C'est gratuit, ou chacun paie sa part. Âge minimum 18 ans, profils avec avis et présence, possibilité de signaler ou bloquer : on se sent en confiance. Slogan : « Des sorties, de vraies rencontres. »
Public : 18–30 ans à Dakar, étudiants, jeunes actifs, nouveaux arrivants en ville. Ton : chaleureux, complice, un peu drôle, jamais institutionnel. Langue : français, avec une touche dakaroise si elle tombe juste (« Nanu dem ! » = « On y va ! »).

## Ce que je te laisse décider
Le concept, le style visuel, le scénario, le hook, le rythme, les transitions et la durée (entre 30 et 50 secondes : prends le temps d'installer l'histoire, sans temps mort). Surprends-moi. Seule contrainte de style : **pas de pixel art** (j'en ai déjà une). Tout le reste est ouvert : motion design, typographie animée, illustration, 3D stylisée, collage, faux « écran de téléphone », format tendance TikTok (POV, avant/après, liste, question face caméra illustrée…), ce que tu juges le plus efficace pour ce public.

Avant le code, présente en quelques lignes : le concept retenu, le hook et pourquoi il arrête le scroll, puis le déroulé seconde par seconde. Ensuite, réalise-le directement, sans attendre ma validation.

## Ce que la vidéo doit faire
- Arrêter le scroll dans les 2 premières secondes (hook visuel ET texte, lisible sans le son).
- Faire comprendre en une fois ce qu'est Lokky : trouver une sortie près de chez soi et y aller même seul.
- Montrer au moins une fois l'interface de l'app, fidèle aux captures jointes, et le geste clé : appuyer sur « Je viens ! ».
- Donner envie et rassurer (vraie rencontre, groupe, confiance), sans liste de fonctionnalités récitée.
- Finir sur le logo, « Lokky », « Des sorties, de vraies rencontres. », « Dispo sur iOS & Android » et « lokky.app ».

## Identité de marque (à respecter)
Couleurs de l'app :
- Orange Corniche #FF6B3D (couleur de marque) ; orange profond #C8441C (boutons d'action)
- Turquoise océan #00B4A6 ; turquoise profond #007F75 ; turquoise clair #2DD4BF
- Jaune soleil #FFC857
- Sable #FAF9F6 ; ivoire #F5F1EA
- Charbon #1F2937 (textes) ; nuit #141A23 (fonds sombres)
Polices : Fredoka (600) pour les titres, Inter (500–600) pour les textes, chargées depuis Google Fonts si possible, sinon une police arrondie système en repli. Aucun emoji : uniquement des formes dessinées.
Logo (à redessiner d'après la pièce jointe) : carré aux coins très arrondis, fond orange #FF6B3D, demi-soleil jaune #FFC857 sur l'horizon, trois silhouettes de personnes blanc cassé devant (celle du milieu plus grande), deux vagues turquoise #00B4A6 en dessous.
Personnages éventuels : jeunes Sénégalais, peaux brunes variées, cheveux naturels, streetwear moderne ; ambiance amicale uniquement, pas de couple ni de romance. Décors de Dakar réels et contemporains (Corniche, plages, rooftops, rues animées), sans clichés folkloriques.

## Qualité attendue
- Rendu soigné et professionnel, digne d'une pub d'app récente : mouvements fluides avec des courbes d'accélération, caméra vivante, profondeur, lumière, transitions travaillées, rythme qui ne laisse aucun temps mort.
- Textes très lisibles sur mobile, sans faute d'orthographe.
- Zones sûres TikTok : aucun texte important à moins de 250 px du haut, à moins de 420 px du bas, ni à moins de 140 px du bord droit.
- Son synthétisé en Web Audio (aucun fichier) : effets calés sur l'image (transitions, pops, notifications, impacts). Pas de voix, pas de musique (j'ajouterai un son sur TikTok). Volume maîtrisé, sans saturation.

## Exigences techniques
- Un seul fichier HTML autonome : `<canvas>` 1080 × 1920 (9:16), affiché réduit pour tenir dans la fenêtre.
- Animation pilotée par une horloge de temps (fonction de rendu `draw(t)`), pas par des animations CSS, pour que l'export soit exact et rejouable.
- Boutons : Lecture / Pause, Rejouer, une barre de défilement du temps, et « Exporter la vidéo » : enregistre le canvas en 1080 × 1920, 30 i/s, avec le son (`canvas.captureStream(30)` + `MediaRecorder`, piste audio branchée depuis le `AudioContext`), débit élevé (≈ 10 Mb/s), puis télécharge le fichier (MP4 si le navigateur le permet, sinon WebM).
- Code propre et commenté : une fonction par scène, les couleurs, les textes et le minutage regroupés en constantes en haut du fichier pour que je puisse les modifier facilement.
- Avant de livrer, vérifie toi-même : aucune scène vide, textes lisibles, couleurs respectées, durée annoncée respectée, aucune erreur dans la console.
```

## Après la génération

- Clique sur **« Exporter la vidéo »** et laisse-la se jouer en entier (export en temps réel).
- Si le fichier sort en **WebM**, convertis-le en MP4 (CapCut ou HandBrake) avant de publier.
- Si le concept ne te plaît pas : « propose-moi deux autres concepts radicalement différents,
  puis réalise celui que tu trouves le plus fort ».
