// Sprites dessinés à la main, une lettre par pixel (palette PEOPLE dans core.tsx, « . » = vide).
// T/D = haut (couleur/ombre), H = cheveux, P/p = bas, A/a = accessoire : remplaçables par
// instance pour varier les personnages.

// ── Héros vu de profil (vers la droite), sweat orange Lokky ─────────────────────────────────
const HERO_TOP = [
  '.....HHHH.....',
  '....HHHHHH....',
  '...HHHHHHHH...',
  '...HHHhHHHH...',
  '...HHHSSSSS...',
  '...HHSSSSES...',
  '....SSSSSSSS..',
  '....sSSSSSS...',
  '.....sSSSS....',
  '......sSS.....',
  '....OOOOOO....',
  '...OOOOOOOO...',
  '...OOoOOOOO...',
  '...OOoOOOOO...',
  '...OOoOOOOO...',
];

// Bras le long du corps / bras en avant (balancier de la marche).
const ARM_DOWN = ['...OOoOOOOO...', '...OOoOOOOO...', '....OOOOOO....', '....SOOOOO....'];
const ARM_FORWARD = ['...OOoOOOOOS..', '...OOoOOOOSS..', '....OOOOOO....', '....OOOOOO....'];

const HIPS = ['....PPPPPP....', '....PPPPPP....'];
const LEGS_STRIDE = ['...PPP..PPP...', '..PPP....PPP..', '..PP......PP..', '.WWW......WWW.'];
const LEGS_PASS = ['.....PPPP.....', '.....PPPp.....', '.....PPP......', '.....WWWW.....'];

// 4 images : appui, passage, appui, passage (le corps monte d'un pixel au passage).
export const HERO_WALK: readonly (readonly string[])[] = [
  [...HERO_TOP, ...ARM_FORWARD, ...HIPS, ...LEGS_STRIDE],
  [...HERO_TOP, ...ARM_DOWN, ...HIPS, ...LEGS_PASS],
  [...HERO_TOP, ...ARM_DOWN, ...HIPS, ...LEGS_STRIDE],
  [...HERO_TOP, ...ARM_FORWARD, ...HIPS, ...LEGS_PASS],
];
export const HERO_WALK_BOB = [0, -1, 0, -1];

// Le héros salue le groupe (bras levé).
export const HERO_WAVE: readonly string[] = [
  '.............SS',
  '.....HHHH....SS',
  '....HHHHHH...OO',
  '...HHHHHHHH..OO',
  '...HHHhHHHH.OO.',
  '...HHHSSSSS.OO.',
  '...HHSSSSES.OO.',
  '....SSSSSSSSOO.',
  '....sSSSSSSOO..',
  '.....sSSSSOO...',
  '......sSSOO....',
  '....OOOOOOO....',
  '...OOOOOOOO....',
  '...OOoOOOOO....',
  '...OOoOOOOO....',
  '...OOoOOOOO....',
  '...OOoOOOOO....',
  '...OOoOOOOO....',
  '....OOOOOO.....',
  '....SOOOOO.....',
  ...HIPS,
  ...LEGS_PASS,
];

// Assis au bord du lit, téléphone allumé dans les mains, tête penchée.
export const HERO_SITTING_PHONE: readonly string[] = [
  '......HHHH......',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHHhHHHH....',
  '....HHHSSSSS....',
  '....HHSSSSES....',
  '.....SSSSSSSS...',
  '.....sSSSSSS....',
  '......sSSSS.....',
  '.......sSS......',
  '.....OOOOOO.....',
  '....OOOOOOOO....',
  '....OOOOOOOOO...',
  '....OoOOOOOSSF..',
  '....OoOOOOOSSF..',
  '....OoOOOOOO....',
  '....OOOOOOOO....',
  '....PPPPPPPPPP..',
  '....pPPPPPPPPP..',
  '..........PPP...',
  '..........PPP...',
  '..........PPP...',
  '..........PPP...',
  '..........PPP...',
  '..........PPP...',
  '..........PPP...',
  '..........pPP...',
  '.........WWWWW..',
];

// ── Personnages vus de dos, assis (face à la mer) ──────────────────────────────────────────
const HEADS = {
  afro: [
    '...HHHHHH...',
    '..HHHHHHHH..',
    '.HHHHhHHHHH.',
    '.HHHHHHHhHH.',
    '.HHhHHHHHHH.',
    '..HHHHHHHH..',
    '...HHHHHH...',
    '....sSSs....',
  ],
  short: [
    '............',
    '....HHHH....',
    '...HHHHHH...',
    '...HHhHHH...',
    '...HHHHHH...',
    '...SHHHHS...',
    '....HHHH....',
    '....sSSs....',
  ],
  braids: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHhHHhHH..',
    '..HHHHHHHH..',
    '..HHhHHhHH..',
    '..HHHHHHHH..',
    '..HhHSShHH..',
    '..Hh.sS.hH..',
  ],
  cap: [
    '............',
    '....NNNN....',
    '...NNNNNN...',
    '..NNNNNNNN..',
    '..NNNWWNNN..',
    '...HHHHHH...',
    '...SHHHHS...',
    '....sSSs....',
  ],
  bucket: [
    '............',
    '....AAAA....',
    '...AAAAAA...',
    '...AAAAAA...',
    '.aAAAAAAAAa.',
    '...HHHHHH...',
    '...SHHHHS...',
    '....sSSs....',
  ],
  bun: [
    '.....HH.....',
    '....HHHH....',
    '...HHHHHH...',
    '...HHhHHH...',
    '...HHHHHH...',
    '...SHHHHS...',
    '....HHHH....',
    '....sSSs....',
  ],
} as const;

const TORSO = [
  '..TTTTTTTT..',
  '.TTTTTTTTTT.',
  'TTTTTTTTTTTT',
  'TTTTTDDTTTTT',
  'TTTTTDDTTTTT',
  'TTTTTTTTTTTT',
  'DTTTTTTTTTTD',
  'DTTTTTTTTTTD',
  'PPPPPPPPPPPP',
  'pPPPPPPPPPPp',
];

// Tresses qui tombent dans le dos.
const BRAIDS_OVER = [
  '..Hh....hH..',
  '..Hh....hH..',
  '..Hh....hH..',
  '..Hh....hH..',
  '...h....h...',
];

export type HeadStyle = keyof typeof HEADS;

export function sittingBack(head: HeadStyle): readonly string[] {
  const torso = TORSO.map((row, i) => {
    if (head !== 'braids' || i >= BRAIDS_OVER.length) return row;
    const over = BRAIDS_OVER[i]!;
    return [...row].map((c, x) => (over[x] !== '.' ? over[x] : c)).join('');
  });
  return [...HEADS[head], ...torso];
}

// Sac à dos posé à côté.
export const BACKPACK: readonly string[] = [
  '..aaaa..',
  '.aAAAAa.',
  'aAAAAAAa',
  'aAaaaaAa',
  'aAAAAAAa',
  'aAAAAAAa',
  'aAaAAaAa',
  '.aaaaaa.',
];

// Thermos et verres de thé (le thé à la sénégalaise, l'ataya).
export const TEA: readonly string[] = [
  '.NN.......',
  'NNNN......',
  'NnNN......',
  'NnNN..W..W',
  'NnNN..w..w',
  'NNNN..R..R',
];

// ── Décor ──────────────────────────────────────────────────────────────────────────────────
// Palmier (tronc + palmes) ; les palmes sont un sprite à part pour se balancer au vent.
export const PALM_FRONDS: readonly string[] = [
  '.........gg..........',
  '...ggg..gGGg...ggg...',
  '..gGGGg.gGGg..gGGGg..',
  '.gG..GGgGGGGgGG..Gg..',
  'gG.....GGGGGG.....Gg.',
  'G....gGGGGGGGGg....G.',
  '....gG..GGGG..Gg.....',
  '...gG...GTTG...Gg....',
  '..gG.....TT.....Gg...',
  '.gG......TT......G...',
  '.G.......TT.......G..',
];

export const PALM_TRUNK: readonly string[] = Array.from({ length: 34 }, (_, i) =>
  i % 3 === 0 ? 'aTTa' : '.TT.',
);

// Croissant de lune.
export const MOON: readonly string[] = [
  '...WWW...',
  '..WWW....',
  '.WWW.....',
  'WWW......',
  'WWW......',
  'WWW......',
  '.WWW.....',
  '..WWW....',
  '...WWW...',
];

// Mouette (deux images de battement).
export const BIRD: readonly (readonly string[])[] = [
  ['N.....N', '.N...N.', '..NNN..'],
  ['.......', 'NNN.NNN', '...N...'],
];

// Main pixel (doigt qui appuie), pour l'écran de l'app.
export const HAND: readonly string[] = [
  '...KK.......',
  '..KSSK......',
  '..KSSK......',
  '..KSSK......',
  '..KSSKKK....',
  '..KSSKSSKKK.',
  'KKKSSKSSKSSK',
  'KSKSSSSSSSSK',
  'KSSSSSSSSSsK',
  'KSSSSSSSSSsK',
  '.KSSSSSSSssK',
  '..KSSSSSssK.',
  '..KOOOOOOOK.',
  '..KOOOOOOOK.',
  '..KOoOOOOOK.',
];
