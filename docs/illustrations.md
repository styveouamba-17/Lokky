# Lokky — Illustrations : inventaire et prompts

Toutes les illustrations peintes de l'app v1, avec un prompt prêt à coller dans ton générateur d'images. Référence de style : `Lokky_ Dakar Adventures Styleboard.png` (sections 1 à 3).

## Comment les intégrer

1. Génère l'image, puis exporte-la au format indiqué.
2. Enregistre-la sous le **nom de fichier exact** dans `apps/mobile/src/assets/illustrations/`.
3. Dans `apps/mobile/src/assets/illustrations/index.ts`, décommente la ligne correspondante.

Tant qu'une ligne reste commentée, l'écran garde son visuel de remplacement (icône dans une pastille, ou composition du design system) : rien ne casse.

## Formats

| Type | Taille | Fond | Cadrage |
|---|---|---|---|
| Bienvenue (`welcome-*`) | 1200 × 900 px (4:3) | Scène complète, sans transparence | Sujet centré, marges confortables : l'image est affichée aux coins arrondis |
| États vides et moments (`empty-*`, etc.) | 1200 × 900 px (4:3) | **Transparent** (PNG) | Personnage et objets détourés, comme dans la section 3 du styleboard : quelques éléments de décor flottants (plante, feuilles, petites étoiles), pas de cadre |
| Catégories (`category-*`) | 1600 × 1000 px (16:10) | Scène complète | Le sujet tient dans la **bande centrale** : l'image est recadrée en bandeau (≈ 3:1) dans les cartes, en ≈ 1,6:1 dans le détail |

PNG (ou WebP) en sRGB, sans texte, sans logo, sans filigrane.

## Bloc de style commun

À ajouter **à la fin de chaque prompt** pour garder une série cohérente :

> Warm hand-painted digital gouache illustration, soft brush texture, clean readable shapes, gentle golden-hour light. Color palette: sunset orange #FF6B3D, warm sun yellow #FFC857, ocean turquoise #00B4A6, deep charcoal #1F2937, sand cream #FAF9F6. Young West African characters (Senegal), varied skin tones, natural hair, modern casual streetwear, friendly and relaxed. Friendship vibe only: no couples, no romance, no hearts. Contemporary Dakar setting, subtle and authentic, no folklore clichés. No text, no letters, no logo, no watermark.

Pour les états vides, ajoute en plus :

> Isolated character and props on a fully transparent background, a few floating decorative elements (small plant, leaves, tiny sparkles), generous empty margins, no frame, no background scene.

---

## 1. Bienvenue

La slide 2 (« Viens, même si tu ne connais personne ») garde sa composition en chat, faite avec le design system.

### `welcome-tonight.png` — Slide 1, « Tu fais quoi ce soir ? »
**Moment** : premier écran de l'app, il donne le ton.
> A young Senegalese man in a dark green hoodie sitting on a sofa in a cozy Dakar bedroom at dusk, smiling while looking at his phone. Floating next to the phone, a small rounded app card shows a beach football scene with tiny avatar circles, suggesting a fun outing tonight. Warm lamp light inside, sunset glow through the window, plants and books on shelves. Inviting, curious, hopeful mood.

### `welcome-together.png` — Slide 3, « Gratuit, ou chacun paie sa part »
**Moment** : dernière slide, juste avant « Nanu dem ! ».
> A group of six young friends seen from behind, sitting side by side on the low wall of the Corniche in Dakar, watching a huge orange sunset over the Atlantic Ocean. Palm trees, the silhouette of the African Renaissance Monument in the distance, backpacks and a thermos of tea between them. Warm, peaceful, togetherness mood, wide cinematic composition.

## 2. Onboarding

### `onboarding-permissions.png` — Étape 4, Autorisations
**Moment** : on demande la position et les notifications ; l'image doit rassurer, pas inquiéter.
> A young woman with braids, wearing a turquoise top, holding her phone; above it float a soft map pin and a small notification bell, both friendly and rounded. She smiles confidently. A small potted plant at her feet.

## 3. États vides et moments clés

### `empty-no-activity.png` — Découvrir, aucune sortie
**Texte** : « Aucune sortie pour ces filtres… Et si tu en créais une ? » · bouton « Créer une activité ».
> A young Senegalese woman with a patterned headband sitting cross-legged on cushions, scrolling her phone with a slightly bored but amused face. Next to her floats a blank notepad and a pencil, as if inviting her to plan something. A small plant and a cup of tea nearby.

### `empty-offline.png` — Erreur réseau
**Texte** : « Impossible de charger les sorties. Vérifie ta connexion et réessaie. » · bouton « Réessayer ».
> A young man lying relaxed on a beanbag, holding his phone up with a patient half-smile. Above him floats a wifi symbol with a small red cross badge. Calm, humorous mood, not stressful. A plant and a few leaves around.

### `empty-upcoming.png` — Mes activités › À venir
**Texte** : « Rien de prévu pour l'instant » · bouton « Découvrir des sorties ».
> A young student with a backpack standing next to a large wall calendar with empty days, holding a pen and looking up thoughtfully, ready to fill it. A small sun and sparkles float near the calendar.

### `empty-past.png` — Mes activités › Passées
**Texte** : « Tes souvenirs de sorties apparaîtront ici. »
> An open photo album with empty polaroid frames floating slightly, a few loose polaroids showing only soft sunset colors, a small seashell and a ticket stub nearby. Nostalgic, warm, inviting mood. No people.

### `empty-created.png` — Mes activités › Créées par moi
**Texte** : « Tu n'as encore rien organisé. Lance ta première sortie ! » · bouton « Créer une activité ».
> A young man holding a megaphone made of rolled paper, smiling and gesturing as if inviting friends, with a small blank flag on a stick planted next to him. Energetic but friendly mood.

### `empty-messages.png` — Messages
**Texte** : « Pas encore de discussion. Rejoins une sortie : le chat du groupe apparaîtra ici. » · bouton « Découvrir des sorties ».
> Two large rounded speech bubbles in turquoise and sand tones floating together, one slightly overlapping the other, with a small paper plane flying between them and tiny motion lines. Clean, minimal, no people.

### `chat-first-message.png` — Chat de groupe sans message
**Moment** : on vient de rejoindre une sortie, le chat est vide. **Texte prévu** : « Brise la glace : dis bonjour au groupe ! »
> Three young friends of different styles each holding a phone, waving hello toward the viewer, with a small speech bubble containing only a waving hand shape above them. Cheerful, welcoming, first-meeting energy.

### `dm-locked.png` — Message privé impossible
**Moment** : on essaie d'écrire à quelqu'un sans avoir partagé de sortie (règle de sécurité). **Texte prévu** : « Partage une sortie avec cette personne pour pouvoir lui écrire. »
> A speech bubble gently held closed by a small padlock shaped like a friendly round shield, with two small activity tickets floating next to it as the key. Reassuring, protective, not punitive. No people.

### `activity-gone.png` — Sortie introuvable ou annulée
**Texte** : « Cette sortie n'existe plus. » · bouton « Retour ».
> A folded paper map with a map pin that has fallen over, a few footprints in sand leading away, and a small palm leaf. Gentle, slightly whimsical mood. No people.

### `create-published.png` — Sortie publiée
**Moment** : juste après avoir publié une activité. **Texte prévu** : « C'est en ligne ! Nanu dem ! »
> A young woman jumping joyfully with one arm raised, confetti in orange, yellow and turquoise bursting around her, a small rounded activity card floating beside her. Celebratory, proud mood.

### `review-thanks.png` — Avis envoyé
**Moment** : après avoir laissé un avis. **Texte prévu** : « Merci ! Ton avis aide toute la communauté. »
> A hand holding up a big rounded star, with two smaller stars and sparkles floating around, a small thumbs-up badge nearby. Grateful, warm mood. Only a hand, no full character.

### `empty-blocked.png` — Réglages › Personnes bloquées
**Texte prévu** : « Tu n'as bloqué personne. »
> A calm round shield in turquoise with a small checkmark, surrounded by a few leaves and a little plant pot. Peaceful, safe mood. No people.

### `moderation-suspended.png` — Compte suspendu
**Texte prévu** : « Ton compte est suspendu jusqu'au … » — ton ferme mais respectueux.
> A small hourglass with sand flowing, next to a closed door with a soft sunset light behind it, a single plant. Calm, serious but kind mood. No people.

### `moderation-banned.png` — Compte banni
**Texte prévu** : « Ton compte a été fermé suite à des manquements aux règles. »
> A closed garden gate with a small round sign hanging on it (blank, no text), evening light, a few fallen leaves. Sober, neutral, respectful mood. No people.

### `error-generic.png` — Erreur inattendue (« Oups »)
**Texte prévu** : « Oups, quelque chose s'est mal passé. » · bouton « Réessayer ».
> A young man scratching his head with a sheepish smile, looking at a phone whose screen shows a few scattered puzzle pieces. Light, humorous mood.

### `account-deleted.png` — Compte supprimé
**Texte prévu** : « Ton compte a été supprimé. À bientôt, peut-être ! »
> A young woman seen from behind walking away along the Corniche at sunset, turning slightly to wave goodbye, a small backpack on her shoulder. Bittersweet but warm mood.

## 4. Couvertures de catégorie

Couverture de chaque activité (les utilisateurs ne fournissent pas de photo en v1). Scène complète, sujet dans la bande centrale. Ces prompts n'utilisent pas le complément « états vides ».

**Variantes** : chaque catégorie peut avoir plusieurs images, pour que trois sorties sport à la suite n'aient pas la même couverture. Nomme-les `category-sport.png`, `category-sport-2.png`, `category-sport-3.png`… puis décommente (ou ajoute) leur ligne dans `CATEGORY_COVERS` (`index.ts`). Une activité garde toujours la même variante. Une seule image par catégorie suffit pour commencer.

Tant qu'une catégorie n'a aucune image, ses cartes s'affichent **sans bandeau** (catégorie en puce, titre, date, lieu) : rien ne casse.

### Variante 1

| Fichier | Catégorie | Prompt |
|---|---|---|
| `category-sport.png` | Sport | Close-up of a football resting on a sandy beach pitch in Dakar at golden hour, a player's sneaker next to it, goal posts made of sticks in the soft background, ocean behind. |
| `category-beach.png` | Plage | Wide view of a lively Dakar beach in the afternoon, turquoise water, colorful pirogues on the sand, palm trees, a few friends playing in the waves in the distance. |
| `category-cinema.png` | Ciné | An open-air cinema at night, a white screen glowing between palm trees, rows of plastic chairs and cushions, string lights, a few silhouettes of friends seated. |
| `category-study.png` | Études | Three students around a wooden table in a sunny library, laptops and notebooks, one explaining something with a pen, warm focused mood. |
| `category-music.png` | Musique et sorties | A small live concert stage at night with warm purple and orange lights, a crowd of young people seen from behind raising their hands, energetic but friendly. |
| `category-games.png` | Jeux | A table seen from above with playing cards, dice, a board game and glasses of attaya tea, hands of friends reaching in, cozy evening light. |
| `category-food.png` | Food et thé | A table with a plate of thieboudienne, a bowl of fataya and a small glass of attaya tea with mint leaves, warm afternoon light, colorful tablecloth. |
| `category-culture.png` | Culture | A historic colonial-style building with arches in Dakar (Gorée or the Plateau), bright sky, bougainvillea, a few visitors walking in front. |
| `category-walk.png` | Balade | The Corniche walkway in Dakar at sunset, friends walking and chatting, the ocean on one side, palm trees, the coastline curving into the distance. |

### Variante 2

Même cadrage, une autre scène de la même catégorie.

| Fichier | Catégorie | Prompt |
|---|---|---|
| `category-sport-2.png` | Sport | A group of friends playing basketball on an outdoor city court in Dakar in the late afternoon, one player mid-jump toward the hoop, long warm shadows on the ground. |
| `category-beach-2.png` | Plage | Friends sitting on colorful towels on the sand at Ngor at sunset, a small island visible across the water, a beach ball and a cooler between them. |
| `category-cinema-2.png` | Ciné | A cozy small cinema room seen from the back rows, friends sharing a big bowl of popcorn, the glow of the screen lighting their faces. |
| `category-study-2.png` | Études | Two students revising on a shaded bench on a university campus, open notebooks and highlighters, a flame tree in bloom above them. |
| `category-music-2.png` | Musique et sorties | A rooftop evening in Dakar with friends dancing to a sabar drummer, string lights, the city lights in the background. |
| `category-games-2.png` | Jeux | Friends around a low table on a terrace playing a lively game of cards, one laughing with a winning hand, attaya teapot on a small burner. |
| `category-food-2.png` | Food et thé | A small street-food stall at dusk with dibi grilled meat and onions, friends waiting with smiles, smoke rising in warm light. |
| `category-culture-2.png` | Culture | The African Renaissance Monument seen from a distance at golden hour, a small group of friends walking up the wide stairs. |
| `category-walk-2.png` | Balade | Friends walking through a colorful Dakar market street, fabrics and fruit stalls on both sides, soft afternoon light, relaxed pace. |

## Récapitulatif

| # | Fichier | Écran | Branché dans le code |
|---|---|---|---|
| 1 | `welcome-tonight.png` | Bienvenue, slide 1 | Oui |
| 2 | `welcome-together.png` | Bienvenue, slide 3 | Oui |
| 3 | `onboarding-permissions.png` | Onboarding, étape 4 | Oui |
| 4 | `empty-no-activity.png` | Découvrir | Oui |
| 5 | `empty-offline.png` | Découvrir (erreur) | Oui |
| 6 | `empty-upcoming.png` | Mes activités › À venir | Oui |
| 7 | `empty-past.png` | Mes activités › Passées | Oui |
| 8 | `empty-created.png` | Mes activités › Créées | Oui |
| 9 | `empty-messages.png` | Messages | Oui |
| 10 | `chat-first-message.png` | Chat de groupe | Oui |
| 11 | `dm-locked.png` | Profil › « Écrire » impossible | Oui |
| 12 | `activity-gone.png` | Détail d'activité | Oui |
| 13 | `create-published.png` | Création | Jalon 4 |
| 14 | `review-thanks.png` | Avis | Oui |
| 15 | `empty-blocked.png` | Réglages › Bloqués | Oui |
| 16 | `moderation-suspended.png` | Compte suspendu | Jalon 7 |
| 17 | `moderation-banned.png` | Compte banni | Jalon 7 |
| 18 | `error-generic.png` | Erreur inattendue | Jalon 8 |
| 19 | `account-deleted.png` | Suppression de compte | Oui |
| 20–37 | `category-*.png` (9 × 2 variantes) | Couvertures d'activité | Oui (`CATEGORY_COVERS`) |

**Priorité** si tu veux commencer petit : 1, 4, 9, puis les 9 catégories (variante 1), puis les variantes 2. Ce sont les images vues par tout le monde dès la première ouverture.
