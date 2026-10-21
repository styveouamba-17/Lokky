// Vidéo « Week-end » (≈ 37 s, 1080×1920, 30 i/s) : l'avatar présente le problème (routine,
// petit budget, personne avec qui sortir) puis Lokky. Aucune interface de l'app.
// Chaque réplique est un fichier séparé dans public/vo/weekend/ (w1.mp3 … w13.mp3), à générer
// sur ElevenLabs avec ce texte exact. Tant qu'un fichier manque, la vidéo se rend sans lui.

import type { VoiceLine } from '../script';

export const FPS = 30;
const s = (seconds: number) => Math.round(seconds * FPS);

// Expressions disponibles (public/avatar/<nom>.png). « neutre » parle et cligne des yeux.
export type Mood = 'neutre' | 'sourire' | 'rire' | 'surpris' | 'blase' | 'pointe' | 'telephone';

export interface Line extends VoiceLine {
  mood: Mood;
}

export const SCENES = {
  routine: { from: 0, duration: s(5.4) },
  weekend: { from: s(5.4), duration: s(2.8) },
  obstacles: { from: s(8.2), duration: s(6) },
  couch: { from: s(14.2), duration: s(3.9) },
  activities: { from: s(18.1), duration: s(9) },
  create: { from: s(27.1), duration: s(5.9) },
  outro: { from: s(33), duration: s(4.5) },
} as const;

export const TOTAL_FRAMES = SCENES.outro.from + SCENES.outro.duration;

export const VOICE: readonly Line[] = [
  {
    id: 'w1',
    text: 'Maison, boulot, maison.',
    from: s(0.3),
    duration: s(2),
    emphasis: ['boulot,'],
    mood: 'blase',
  },
  {
    id: 'w2',
    text: 'Ou maison, école, maison.',
    from: s(2.7),
    duration: s(2.2),
    emphasis: ['école,'],
    mood: 'blase',
  },
  {
    id: 'w3',
    text: 'Puis le week-end arrive. T’as envie de sortir.',
    from: s(5.6),
    duration: s(2.5),
    emphasis: ['week-end'],
    mood: 'sourire',
  },
  {
    id: 'w4',
    text: 'Mais petit budget…',
    from: s(8.4),
    duration: s(1.5),
    emphasis: ['budget…'],
    mood: 'neutre',
  },
  {
    id: 'w5',
    text: 'tu sais pas où aller…',
    from: s(10.2),
    duration: s(1.6),
    emphasis: ['où'],
    mood: 'neutre',
  },
  {
    id: 'w6',
    text: 'ni avec qui.',
    from: s(12.2),
    duration: s(1.4),
    emphasis: ['qui.'],
    mood: 'surpris',
  },
  {
    id: 'w7',
    text: 'Résultat : tu restes chez toi. Encore.',
    from: s(14.4),
    duration: s(3.3),
    emphasis: ['Encore.'],
    mood: 'blase',
  },
  {
    id: 'w8',
    text: 'Alors qu’avec Lokky, y a plein de sorties près de chez toi.',
    from: s(18.3),
    duration: s(3.4),
    emphasis: ['Lokky,'],
    mood: 'rire',
  },
  {
    id: 'w9',
    text: 'Vélo, quad, karting, kayak, tennis, musée…',
    from: s(21.9),
    duration: s(3.2),
    emphasis: [],
    mood: 'pointe',
  },
  {
    id: 'w10',
    text: 'Et souvent gratuites.',
    from: s(25.4),
    duration: s(1.5),
    emphasis: ['gratuites.'],
    mood: 'sourire',
  },
  {
    id: 'w11',
    text: 'Rien ne te tente ? Crée ta sortie.',
    from: s(27.3),
    duration: s(2.4),
    emphasis: ['Crée'],
    mood: 'telephone',
  },
  {
    id: 'w12',
    text: 'Et des gens te rejoignent.',
    from: s(30),
    duration: s(1.8),
    emphasis: ['rejoignent.'],
    mood: 'telephone',
  },
  {
    id: 'w13',
    text: 'Ce week-end, tu sors. Nanu dem !',
    from: s(33.3),
    duration: s(2.6),
    emphasis: ['Nanu', 'dem !'],
    mood: 'rire',
  },
];

// Activités de la scène 5, les six premières calées sur leur mot dans w9 (TILES, Weekend.tsx).
export const ACTIVITIES = [
  { label: 'Vélo', icon: 'Bicycle', color: '#ff6b3d' },
  { label: 'Quad', icon: 'Motorcycle', color: '#00a99d' },
  { label: 'Karting', icon: 'FlagCheckered', color: '#1b1220' },
  { label: 'Kayak', icon: 'Boat', color: '#2f80ed' },
  { label: 'Tennis', icon: 'TennisBall', color: '#7cb518' },
  { label: 'Musée', icon: 'Bank', color: '#8e5bd6' },
  { label: 'Foot', icon: 'SoccerBall', color: '#e5484d' },
  { label: 'Rando', icon: 'Mountains', color: '#00756d' },
  { label: 'Ciné', icon: 'FilmSlate', color: '#d94f25' },
] as const;

// Effets sonores (public/sfx), en images absolues.
export interface Cue {
  sfx: string;
  at: number;
  volume?: number;
}
