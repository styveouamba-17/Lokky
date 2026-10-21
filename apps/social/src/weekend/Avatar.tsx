import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { timeWords } from '../ui/Captions';
import type { Line, Mood } from './script';

// Avatar de Styve (public/avatar, généré une fois sur ChatGPT) : on ne dessine rien, on choisit
// l'image du moment. Bouche ouverte et fermée en alternance sur chaque mot, clignements quand il
// se tait, petit rebond à chaque changement d'expression.

// Image « bouche ouverte » de chaque expression (sourire et rire alternent entre elles).
const TALK: Record<Mood, string> = {
  neutre: 'parle',
  blase: 'blase-parle',
  pointe: 'pointe-parle',
  telephone: 'telephone-parle',
  sourire: 'rire',
  rire: 'sourire',
  surpris: 'surpris',
};

const FILES = [
  'neutre',
  'parle',
  'cligne',
  'sourire',
  'rire',
  'surpris',
  'blase',
  'blase-parle',
  'pointe',
  'pointe-parle',
  'telephone',
  'telephone-parle',
] as const;

const BLINK_EVERY = 96;
const BLINK_LENGTH = 4;

function current(lines: readonly Line[], frame: number) {
  let line: Line | undefined;
  for (const l of lines) if (frame >= l.from) line = l;
  return line;
}

export function Avatar({
  lines,
  top = 1010,
  left = -40,
  width = 700,
}: {
  lines: readonly Line[];
  top?: number;
  left?: number;
  width?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = current(lines, frame);
  const mood: Mood = line?.mood ?? lines[0]?.mood ?? 'neutre';

  // Bouche : ouverte une demi-période sur deux pendant un mot, fermée entre les mots.
  const word = line
    ? timeWords(line).find((w) => frame >= w.start && frame < w.end - 1)
    : undefined;
  const talking = word !== undefined && Math.floor((frame - word.start) / 4) % 2 === 0;

  const blinking = mood === 'neutre' && !word && frame % BLINK_EVERY >= BLINK_EVERY - BLINK_LENGTH;

  const shown = blinking ? 'cligne' : talking ? TALK[mood] : mood;

  // Rebond quand l'expression change (début d'une réplique avec une autre humeur).
  const index = line ? lines.indexOf(line) : -1;
  const changedAt =
    line && (index === 0 || lines[index - 1]?.mood !== line.mood) ? line.from : -1000;
  const pop = spring({
    frame: frame - changedAt,
    fps,
    config: { damping: 9, stiffness: 240, mass: 0.6 },
  });
  const enter = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 120 } });
  const breathe = Math.sin(frame / 18) * 0.006;

  return (
    <div
      style={{
        position: 'absolute',
        top: top + interpolate(enter, [0, 1], [500, 0]) + interpolate(pop, [0, 1], [26, 0]),
        left,
        width,
        aspectRatio: '1024 / 1536',
        transformOrigin: '50% 100%',
        transform: `scale(${1 + breathe + interpolate(pop, [0, 1], [0.04, 0])}, ${1 - breathe + interpolate(pop, [0, 1], [-0.03, 0])})`,
        filter: 'drop-shadow(0 18px 0 rgba(27,18,32,0.12))',
      }}
    >
      {FILES.map((name) => (
        <Img
          key={name}
          src={staticFile(`avatar/${name}.png`)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: name === shown ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}
