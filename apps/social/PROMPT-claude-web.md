# Prompt pour claude.ai : vidéo de présentation de Lokky (≈ 40 s)

## Pièces jointes à ajouter au message

Claude ne peut pas insérer tes fichiers dans la vidéo : il les **regarde** pour redessiner
fidèlement en code. Joins :

1. **Le logo** : `apps/mobile/assets/icon.png`
2. **Trois captures d'écran de l'app** (sur ton téléphone) : l'écran Découvrir (liste de
   sorties), la fiche d'une sortie avec le bouton « Je viens ! », et un chat de groupe.
3. **L'ambiance de marque** : `apps/web/public/og-image.jpg`
4. **Le héros** : `apps/social/public/paints/hero.png` (le garçon au sweat orange)

## Le prompt (à copier tel quel)

```text
Tu es motion designer et développeur créatif. Crée une vidéo verticale de 40 secondes qui présente mon application mobile Lokky.

## L'app
Lokky est une app sénégalaise, à Dakar, pour trouver des sorties près de chez toi et y aller même si tu ne connais personne : plage, foot, ataya (thé), ciné, concerts, balades sur la Corniche… On voit les sorties autour de soi, on appuie sur « Je viens ! », un chat de groupe s'ouvre avec les participants, et on se retrouve sur place. C'est gratuit, ou chacun paie sa part. Âge minimum 18 ans, profils avec avis et présence, possibilité de signaler ou bloquer : on se sent en confiance. Slogan : « Des sorties, de vraies rencontres. » Public : 18–30 ans à Dakar, étudiants, jeunes actifs, nouveaux arrivants. Ton : chaleureux, complice, un peu drôle, jamais institutionnel. Langue : français, avec une touche dakaroise (« Nanu dem ! » = « On y va ! »).

## Direction artistique : pixel art moderne, pas trop pixelisé
- Style « pixel art haute définition » façon jeux indés récents (Eastward, Sea of Stars, HD-2D d'Octopath Traveler) : formes lisibles en gros pixels, MAIS lumière douce, dégradés, halos, profondeur et mouvements fluides par-dessus.
- Concrètement : dessine décors et personnages sur une toile basse résolution de 270 × 480 (pixels nets, sans lissage, `image-rendering: pixelated`), agrandie × 4 en 1080 × 1920. Par-dessus, en pleine résolution : lumières, lueurs, particules, textes et interface, pour que l'ensemble reste propre et moderne, pas « rétro 8 bits ».
- Personnages : jeunes Sénégalais, peaux brunes variées, cheveux naturels (afro, tresses, dégradé), streetwear moderne. Le héros porte un sweat orange (#FF6B3D), un jean indigo et des baskets blanches (voir pièce jointe). Ambiance amicale uniquement, pas de couple.
- Décors réels de Dakar : la Corniche au coucher du soleil, le Monument de la Renaissance au loin, palmiers, mer turquoise.

## Code couleur (obligatoire, ce sont les couleurs de l'app)
- Orange Corniche #FF6B3D (marque, accents, héros) ; orange profond #C8441C (boutons d'action)
- Turquoise océan #00B4A6 ; turquoise profond #007F75 ; turquoise clair #2DD4BF
- Jaune soleil #FFC857
- Sable #FAF9F6 (fonds clairs, cartes) ; ivoire #F5F1EA
- Charbon #1F2937 (textes) ; nuit #141A23 (fonds sombres)
Polices : titres en Fredoka (600), textes en Inter (500–600), chargées depuis Google Fonts si possible, sinon une police arrondie système en repli. Aucun emoji : uniquement des formes dessinées.

## Le logo (à redessiner en code d'après la pièce jointe)
Carré aux coins très arrondis, fond orange #FF6B3D ; un demi-soleil jaune #FFC857 posé sur un horizon ; devant, trois silhouettes de personnes (têtes rondes et épaules) blanc cassé, celle du milieu plus grande ; en dessous, deux vagues turquoise #00B4A6. Version pixel pour les scènes, version lisse pour la fin.

## Scénario, seconde par seconde (30 images/s, 1 200 images)
Chaque texte doit rester à l'écran assez longtemps pour être lu tranquillement (au moins 1,5 s), et chaque scène doit avoir le temps de respirer : pas de défilement précipité.
1. 0 – 3 s · HOOK. Plein écran nuit (#141A23), une grille de petites fenêtres d'immeubles qui s'allument une à une, et un compteur qui défile très vite jusqu'à « 3 000 000 ». Texte en grand, qui claque mot par mot : « 3 MILLIONS DE GENS À DAKAR… » puis, avec un impact (zoom brusque, tremblement de caméra, flash) : « …ET T'AS PERSONNE POUR SORTIR ? ». Les deux premières secondes doivent arrêter le scroll.
2. 3 – 8 s · LE PROBLÈME. Le héros seul sur son lit un samedi soir, visage éclairé par son téléphone, la ville qui vit derrière la fenêtre. Trois bulles de messages apparaissent l'une après l'autre puis se barrent avec un petit « pop » : « Dispo ce soir ? » → « Vu », « On fait un truc ? » → « Annulé », « Le groupe est mort… ». Il soupire, se laisse tomber en arrière sur le lit. Ton drôle, pas triste.
3. 8 – 11 s · LE DÉCLIC. Son téléphone vibre : une notification Lokky tombe (logo + « Une sortie pour toi : coucher de soleil à la Corniche, 18 h 30 »). Son « bip ». Il se redresse d'un coup ; zoom sur l'écran, le téléphone remplit le cadre.
4. 11 – 25 s · CE QUE L'APP APPORTE. Démo de l'interface (en vectoriel net, fidèle aux captures jointes, fond sable #FAF9F6, cartes blanches arrondies), en quatre temps, chacun avec un titre court en surimpression :
   - 11 – 15 s : la liste « Découvrir » défile, des cartes de sorties illustrées en pixel art (Plage à Ngor, Foot à Yoff, Ataya à Mermoz, Ciné en plein air) avec distance, heure et nombre de places ; un filtre « Ce week-end » s'active. Titre : « Des sorties près de toi ».
   - 15 – 19 s : il ouvre la fiche « Coucher de soleil à la Corniche » (photo pixel art, lieu, heure, « 3 participants », « 4 places »), un doigt appuie sur le bouton orange « Je viens ! » → confettis orange, jaune et turquoise, le bouton devient « C'est noté ! ». Titre : « Viens, même seul ».
   - 19 – 23 s : le chat de groupe s'ouvre, trois messages arrivent un par un avec l'indicateur « en train d'écrire » (« Awa : on se retrouve à 18 h au phare ? », « Moussa : je ramène le thé », « Fatou : Nanu dem ! »). Titre : « Le groupe t'attend ».
   - 23 – 25 s : trois pastilles arrivent l'une après l'autre : « Gratuit ou chacun paie sa part », « 18 ans et plus », « Avis et présence sur chaque profil ». Titre : « En toute confiance ».
5. 25 – 34 s · LA PROMESSE. Retour au pixel art : la Corniche au coucher du soleil, travelling avec effet de profondeur (au moins 4 plans qui défilent à des vitesses différentes : ciel et soleil, mer et Monument au loin, muret et palmiers qui ondulent, premier plan flou), particules de lumière et de sable portées par le vent.
   - 25 – 29 s : le héros marche le long de la promenade et rejoint 5 jeunes assis de dos sur le muret ; l'une se retourne et lui fait signe, il s'assoit avec eux.
   - 29 – 34 s : plan de dos sur les six face au soleil, ils rient (petits sauts d'épaules). Texte : « 18 h : des inconnus. » puis le ciel bascule en accéléré vers la nuit, le soleil se couche, les étoiles et les lumières de la ville s'allument, une horloge défile de 18:00 à 20:00 ; impact : « 20 h : tes potes. »
6. 34 – 40 s · APPEL À L'ACTION. Flash, fond orange #FF6B3D avec rayons de lumière qui tournent, le logo arrive en claquant (rebond), puis « Lokky », « Des sorties, de vraies rencontres. », une pastille charbon « Dispo sur iOS & Android », et « lokky.app ». Garder cet écran final lisible au moins 3 secondes.

## Mise en scène
- Caméra vivante en permanence : zooms lents, travellings, effets de profondeur, tremblements courts sur les impacts.
- Transitions entre les scènes : passage rapide avec flou de mouvement (whip pan), fondu au blanc ou balayage en pixels ; jamais de coupe sèche sans effet.
- Textes : gros, en majuscules pour les titres, contour sombre épais et ombre portée pour rester lisibles sur tous les fonds ; animation « tampon » (ils arrivent grands et flous puis claquent à leur taille avec un rebond).
- Zones sûres TikTok : aucun texte important à moins de 250 px du haut, à moins de 420 px du bas, ni à moins de 140 px du bord droit.

## Son (Web Audio, synthétisé dans le code, aucun fichier)
Whoosh sur chaque transition, « pop » sur les bulles et les boutons, « bip » de notification, impact grave sur le hook et sur « tes potes », petit scintillement sur les confettis et sur le logo, ambiance douce (vent, vagues) sur la Corniche. Pas de voix, pas de musique (j'ajouterai un son sur TikTok). Volume maîtrisé, sans saturation.

## Exigences techniques
- Un seul fichier HTML : `<canvas>` 1080 × 1920 affiché réduit pour tenir dans la fenêtre (en gardant le format 9:16).
- Animation pilotée par une horloge de temps (fonction de rendu `draw(t)`), pas par des animations CSS, pour que l'export soit exact et rejouable.
- Boutons : Lecture / Pause, Rejouer, une barre de défilement du temps, et **« Exporter la vidéo »** : enregistre le canvas en 1080 × 1920, 30 i/s, avec le son (`canvas.captureStream(30)` + `MediaRecorder`, piste audio branchée depuis le `AudioContext`), débit élevé (≈ 10 Mb/s), puis télécharge le fichier (MP4 si le navigateur le permet, sinon WebM).
- Code propre et commenté : une fonction par scène, les couleurs et le minutage regroupés en constantes en haut du fichier pour que je puisse les modifier facilement.
- Avant de livrer, vérifie toi-même : aucune scène vide, textes lisibles, couleurs respectées, durée totale de 40 s exactement, aucune erreur dans la console.
```

## Après la génération

- Clique sur **« Exporter la vidéo »** dans l'artefact et laisse la vidéo se jouer en entier
  (l'export se fait en temps réel, environ 40 s).
- Si le fichier sort en **WebM**, convertis-le en MP4 avant de le publier sur TikTok
  (CapCut l'accepte directement, ou HandBrake, gratuit).
- Pour retoucher : demande dans la même conversation, par exemple « raccourcis la scène 2 »,
  « le hook doit être plus gros », « change le texte de la fin ».
