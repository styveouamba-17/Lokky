// Vidéo « Corniche » (≈ 34 s, 1080×1920, 30 i/s) : script de la voix off et minutage.
// Chaque réplique est un fichier séparé dans public/vo/ (vo1.mp3 … vo9.mp3), généré sur
// ElevenLabs avec ce texte exact. Tant qu'un fichier manque, la vidéo se rend sans lui ; les
// sous-titres s'affichent quand même, calés sur le minutage ci-dessous.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const s = (seconds: number) => Math.round(seconds * FPS);

// Scènes (début, durée) en images.
export const SCENES = {
  bedroom: { from: 0, duration: s(6.5) },
  scroll: { from: s(6.5), duration: s(5) },
  notif: { from: s(11.5), duration: s(5.5) },
  walk: { from: s(17), duration: s(6) },
  sunset: { from: s(23), duration: s(6.5) },
  outro: { from: s(29.5), duration: s(4.5) },
} as const;

export const TOTAL_FRAMES = SCENES.outro.from + SCENES.outro.duration;

// Instants clés (images absolues) : les scènes et les effets sonores s'y calent.
export const MOMENTS = {
  withWhom: s(3.9), // « C'est avec qui. » : impact
  flips: [s(7.2), s(8.3), s(9.4), s(10.4)], // stories qui se retournent
  notif: s(11.9), // la notification tombe
  open: s(13.5), // la sortie s'ouvre
  tap: s(15.9), // « Je viens ! »
  noAwkward: s(19.3), // « Zéro malaise »
  strangers: s(23.7), // « 18 h · des inconnus »
  lapseFrom: s(25.0), // début de l'accéléré
  friends: s(26.2), // « 20 h · des potes » : impact
} as const;

export interface VoiceLine {
  id: string; // fichier public/vo/<id>.mp3
  text: string; // texte exact à faire lire (et sous-titres)
  from: number; // image de début
  duration: number; // durée visée, en images
  // Mots mis en valeur dans les sous-titres (couleur Lokky).
  emphasis?: readonly string[];
}

export const VOICE: readonly VoiceLine[] = [
  {
    id: 'vo1',
    text: 'Le problème à Dakar, c’est pas qu’il y a rien à faire.',
    from: s(0.3),
    duration: s(3.3),
    emphasis: ['Dakar,'],
  },
  { id: 'vo2', text: 'C’est avec qui.', from: s(3.9), duration: s(1.7), emphasis: ['qui.'] },
  {
    id: 'vo3',
    text: 'Tes potes sont partis, t’es nouveau en ville… et le week-end, tu scrolles.',
    from: s(6.7),
    duration: s(4.5),
    emphasis: ['scrolles.'],
  },
  {
    id: 'vo4',
    text: 'Puis un soir, une notif.',
    from: s(11.7),
    duration: s(1.8),
    emphasis: ['notif.'],
  },
  {
    id: 'vo5',
    text: 'Une sortie à la Corniche. Il appuie sur « Je viens ! ».',
    from: s(13.7),
    duration: s(3.1),
    emphasis: ['Corniche.', '«', 'Je', 'viens', '!', '».'],
  },
  {
    id: 'vo6',
    text: 'Sur place : cinq inconnus. Zéro malaise.',
    from: s(17.4),
    duration: s(3),
    emphasis: ['Zéro', 'malaise.'],
  },
  {
    id: 'vo7',
    text: 'Un thé, des fous rires, le coucher de soleil…',
    from: s(20.6),
    duration: s(2.3),
    emphasis: ['fous', 'rires,'],
  },
  {
    id: 'vo8',
    text: 'À 18 h, c’étaient des inconnus. À 20 h, c’étaient ses potes.',
    from: s(23.3),
    duration: s(4.6),
    emphasis: ['potes.'],
  },
  {
    id: 'vo9',
    text: 'Lokky. Des sorties, de vraies rencontres. Télécharge l’app.',
    from: s(29.9),
    duration: s(3.7),
    emphasis: ['Lokky.'],
  },
];

// Effets sonores (public/sfx), en images absolues.
export interface Cue {
  sfx: string;
  at: number;
  volume?: number;
}

const M = MOMENTS;
export const CUES: readonly Cue[] = [
  { sfx: 'impact', at: M.withWhom, volume: 0.9 },
  { sfx: 'stamp', at: M.withWhom + 2, volume: 0.6 },
  { sfx: 'whoosh', at: SCENES.scroll.from - 5, volume: 0.7 },
  ...M.flips.map((at) => ({ sfx: 'flip', at, volume: 0.7 })),
  { sfx: 'whoosh', at: SCENES.notif.from - 5, volume: 0.6 },
  { sfx: 'bip', at: M.notif, volume: 0.8 },
  { sfx: 'pop', at: M.open, volume: 0.6 },
  { sfx: 'pop', at: M.tap, volume: 0.9 },
  { sfx: 'sparkle', at: M.tap + 3, volume: 0.6 },
  { sfx: 'whoosh', at: SCENES.walk.from - 7, volume: 0.8 },
  { sfx: 'stamp', at: M.noAwkward, volume: 0.7 },
  { sfx: 'whoosh', at: SCENES.sunset.from - 6, volume: 0.6 },
  { sfx: 'stamp', at: M.strangers + 2, volume: 0.7 },
  ...[0, 1, 2, 3, 4].map((i) => ({ sfx: 'tick', at: M.lapseFrom + i * 8, volume: 0.5 })),
  { sfx: 'impact', at: M.friends, volume: 0.8 },
  { sfx: 'stamp', at: M.friends + 2, volume: 0.6 },
  { sfx: 'riser', at: SCENES.outro.from - s(1), volume: 0.6 },
  { sfx: 'impact', at: SCENES.outro.from, volume: 1 },
  { sfx: 'sparkle', at: SCENES.outro.from + 4, volume: 0.6 },
];

// Ambiances en boucle : [son, début, fin, volume].
export const BEDS: readonly [string, number, number, number][] = [
  ['night', 0, s(6.5), 0.35],
  ['wind', s(17), s(29.5), 0.25],
  ['waves', s(17), s(29.5), 0.4],
];
