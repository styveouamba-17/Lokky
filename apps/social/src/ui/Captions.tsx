import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VoiceLine } from '../script';
import { clamp, FREDOKA } from './fx';

interface Word {
  text: string;
  start: number; // image absolue
  end: number;
}

// Répartit les mots d'une réplique sur sa durée, au prorata de leur longueur, avec une petite
// pause après la ponctuation (proche du débit d'une voix ElevenLabs).
export function timeWords(line: VoiceLine): Word[] {
  const words = line.text.split(/\s+/).filter(Boolean);
  const weight = (w: string) => w.length + 2 + (/[.,…!?:;]$/.test(w) ? 4 : 0);
  const total = words.reduce((sum, w) => sum + weight(w), 0);
  let cursor = line.from;
  return words.map((text) => {
    const span = (weight(text) / total) * line.duration;
    const word = { text, start: cursor, end: cursor + span };
    cursor += span;
    return word;
  });
}

// Groupes de 1 à 3 mots, coupés après la ponctuation : lisibles d'un coup d'œil.
function chunk(words: Word[]): Word[][] {
  const groups: Word[][] = [];
  let current: Word[] = [];
  for (const w of words) {
    current.push(w);
    const chars = current.reduce((n, x) => n + x.text.length, 0);
    if (current.length === 3 || chars > 14 || /[.,…!?:]$/.test(w.text)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  // « ! » ou « ». » isolés : rattachés au groupe précédent.
  return groups.reduce<Word[][]>((acc, g) => {
    if (acc.length && g.every((w) => /^[!?»«.]+$/.test(w.text.replace('».', '»')))) {
      acc[acc.length - 1]!.push(...g);
    } else acc.push(g);
    return acc;
  }, []);
}

export function Captions({ lines, top = 1500 }: { lines: readonly VoiceLine[]; top?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = lines.find((l) => frame >= l.from && frame < l.from + l.duration + 6);
  if (!line) return null;
  const groups = chunk(timeWords(line));
  const lineEnd = line.from + line.duration;
  const index = groups.findIndex((g, i) => {
    const next = groups[i + 1];
    return frame >= g[0]!.start && (next ? frame < next[0]!.start : frame < lineEnd + 6);
  });
  const group = groups[index];
  if (!group) return null;

  const enter = spring({
    frame: frame - group[0]!.start,
    fps,
    config: { damping: 14, stiffness: 320, mass: 0.5 },
  });
  const fadeOut = interpolate(frame, [lineEnd, lineEnd + 6], [1, 0], clamp);
  const emphasis = new Set(line.emphasis ?? []);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 70,
        right: 70,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px 36px',
        transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])}) translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
        opacity: Math.min(1, enter * 2) * fadeOut,
      }}
    >
      {group.map((w, i) => {
        const active = frame >= w.start && frame < w.end + 2;
        const strong = emphasis.has(w.text);
        return (
          <span
            key={i}
            style={{
              fontFamily: FREDOKA,
              fontWeight: 700,
              fontSize: 84,
              lineHeight: 1.15,
              textTransform: 'uppercase',
              color: strong ? '#ffc857' : '#ffffff',
              WebkitTextStroke: '12px #1b1220',
              paintOrder: 'stroke fill',
              textShadow: '0 10px 0 rgba(27,18,32,0.55)',
              display: 'inline-block',
              transform: `scale(${active ? 1.1 : 1}) rotate(${active ? -2 : 0}deg)`,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
