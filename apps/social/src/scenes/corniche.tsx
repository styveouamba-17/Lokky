import { interpolateColors } from 'remotion';
import { C, Disc, rand, Sprite } from '../pixel/core';
import { PALM_FRONDS, PALM_TRUNK, type HeadStyle } from '../pixel/sprites';

// Les cinq « inconnus » assis sur le muret (vus de dos), puis le héros parmi eux.
export const FRIENDS: readonly { head: HeadStyle; colors: Record<string, string> }[] = [
  { head: 'afro', colors: { T: C.black, D: C.blackDark } },
  { head: 'braids', colors: { T: C.cream, D: C.creamDark } },
  { head: 'cap', colors: { T: '#2f5d3a', D: '#24482d', P: '#c9b48a', p: '#a8926a' } },
  { head: 'bun', colors: { T: '#e04a3a', D: '#b8382b' } },
  { head: 'bucket', colors: { T: '#3a3f6b', D: '#2a2f52', A: C.khaki, a: C.khakiDark } },
];
export const HERO_BACK = { head: 'short' as HeadStyle, colors: { T: C.orange, D: C.orangeDark } };

// Décor de la Corniche, partagé par la marche (profil) et le plan de dos. `tod` (time of day) :
// 0 = coucher de soleil (18 h), 1 = nuit tombée (20 h). Coordonnées en pixels logiques.

const SKY_SUNSET = [
  '#3b2a5c',
  '#6d3b5e',
  '#b5475a',
  '#e8594a',
  '#ff7a45',
  '#ff9a52',
  '#ffb85e',
  '#ffd27a',
];
const SKY_NIGHT = [
  '#0d1030',
  '#121640',
  '#19194a',
  '#221c52',
  '#2e2158',
  '#3d2660',
  '#55306a',
  '#6d3b6e',
];
const SEA_SUNSET = [
  '#f6b07a',
  '#7fd0c4',
  '#3fbfb3',
  C.teal,
  '#00958b',
  C.tealDark,
  '#005c55',
  '#004e48',
];
const SEA_NIGHT = [
  '#5a3f78',
  '#2a3f66',
  '#1d3a5a',
  '#173352',
  '#122b48',
  '#0e233d',
  '#0a1b30',
  '#08162a',
];

const mix = (tod: number, a: readonly string[], b: readonly string[]) =>
  a.map((c, i) => interpolateColors(tod, [0, 1], [c, b[i]!]));

export function Sky({ tod, horizon, frame }: { tod: number; horizon: number; frame: number }) {
  const colors = mix(tod, SKY_SUNSET, SKY_NIGHT);
  const band = horizon / colors.length;
  return (
    <g>
      {colors.map((c, i) => (
        <rect
          key={i}
          x={-200}
          y={Math.round(i * band)}
          width={600}
          height={Math.ceil(band) + 1}
          fill={c}
        />
      ))}
      {colors.slice(1).map((c, i) => (
        <g key={`d${i}`}>
          {Array.from({ length: 300 }, (_, k) => (
            <rect
              key={k}
              x={-200 + k * 2 + (i % 2)}
              y={Math.round((i + 1) * band) - 1}
              width={1}
              height={1}
              fill={c}
            />
          ))}
        </g>
      ))}
      {/* Étoiles qui apparaissent avec la nuit */}
      {tod > 0.2
        ? Array.from({ length: 40 }, (_, i) => (
            <rect
              key={`s${i}`}
              x={Math.floor(rand(i) * 135)}
              y={Math.floor(rand(i + 40) * horizon * 0.7)}
              width={1}
              height={1}
              fill={C.cream}
              opacity={
                Math.min(1, (tod - 0.2) * 1.6) * (rand(i + Math.floor(frame / 7)) > 0.8 ? 0.4 : 1)
              }
            />
          ))
        : null}
    </g>
  );
}

// Soleil avec halo ; `y` descend pendant l'accéléré.
export function Sun({ x, y, r, tod }: { x: number; y: number; r: number; tod: number }) {
  const halo = 1 - tod;
  return (
    <g>
      <g opacity={0.16 * halo}>
        <Disc cx={x} cy={y} r={r + 20} fill={C.sun} />
      </g>
      <g opacity={0.28 * halo}>
        <Disc cx={x} cy={y} r={r + 10} fill={C.sunLight} />
      </g>
      <Disc cx={x} cy={y} r={r + 3} fill={interpolateColors(tod, [0, 1], ['#ffd98e', '#c4566a'])} />
      <Disc cx={x} cy={y} r={r} fill={interpolateColors(tod, [0, 1], ['#fff1c4', '#e86a5a'])} />
    </g>
  );
}

// Nuages en amas de pixels, avec le dessous éclairé par le soleil.
export function Clouds({ offset, tod, y = 30 }: { offset: number; tod: number; y?: number }) {
  const body = interpolateColors(tod, [0, 1], ['#8a4a6a', '#2a2050']);
  const lit = interpolateColors(tod, [0, 1], ['#ffb07a', '#4a3060']);
  const clouds = [
    { x: 4, y, w: 26 },
    { x: 58, y: y + 10, w: 34 },
    { x: 110, y: y - 6, w: 22 },
    { x: 160, y: y + 4, w: 30 },
    { x: 215, y: y + 12, w: 24 },
  ];
  return (
    <g transform={`translate(${-offset} 0)`}>
      {clouds.map((c, i) => (
        <g key={i}>
          <rect x={c.x + 4} y={c.y} width={c.w - 10} height={3} fill={body} />
          <rect x={c.x} y={c.y + 3} width={c.w} height={3} fill={body} />
          <rect x={c.x + 2} y={c.y + 6} width={c.w - 3} height={2} fill={lit} />
        </g>
      ))}
    </g>
  );
}

// Monument de la Renaissance (silhouette).
const MONUMENT = [
  '.....N.....',
  '....NN.....',
  '....NNN....',
  '...NNNN.N..',
  '...NNNNNN..',
  '..NNNNNN...',
  '...NNNNN...',
  '...NNNNN...',
  '..NNNNNNN..',
  '..NNNNNNN..',
  '.NNNNNNNNN.',
  'NNNNNNNNNNN',
];

// Côte au loin : colline, monument et immeubles, avec leurs lumières à la nuit.
export function Coast({
  x,
  horizon,
  tod,
  frame,
}: {
  x: number;
  horizon: number;
  tod: number;
  frame: number;
}) {
  const fill = interpolateColors(tod, [0, 1], ['#7a3d5e', '#1c1638']);
  const far = interpolateColors(tod, [0, 1], ['#9a4a62', '#241a44']);
  const buildings: [number, number, number][] = [
    [30, 6, 7],
    [37, 4, 10],
    [42, 7, 5],
    [50, 5, 8],
    [56, 8, 4],
    [-12, 5, 6],
    [-6, 6, 9],
  ];
  return (
    <g transform={`translate(${x} 0)`}>
      {buildings.map(([bx, w, h], i) => (
        <g key={i}>
          <rect x={bx} y={horizon - h} width={w} height={h} fill={far} />
          {tod > 0.4
            ? Array.from({ length: Math.floor(h / 3) }, (_, k) => (
                <rect
                  key={k}
                  x={bx + 1 + (k % 2) * 2}
                  y={horizon - h + 1 + k * 3}
                  width={1}
                  height={1}
                  fill={C.sun}
                  opacity={rand(i * 7 + k + Math.floor(frame / 30)) > 0.3 ? (tod - 0.4) * 1.6 : 0}
                />
              ))
            : null}
        </g>
      ))}
      <path
        d={`M0 ${horizon} L6 ${horizon - 5} L12 ${horizon - 9} L18 ${horizon - 12} L24 ${horizon - 10} L30 ${horizon - 4} L36 ${horizon} Z`}
        fill={fill}
      />
      <Sprite rows={MONUMENT} x={12} y={horizon - 24} colors={{ N: fill }} />
    </g>
  );
}

// Mer : bandes, reflet du soleil qui scintille, écume qui défile.
export function Sea({
  top,
  bottom,
  tod,
  frame,
  sunX,
}: {
  top: number;
  bottom: number;
  tod: number;
  frame: number;
  sunX: number;
}) {
  const colors = mix(tod, SEA_SUNSET, SEA_NIGHT);
  const band = (bottom - top) / colors.length;
  const glint = interpolateColors(tod, [0, 1], ['#fff1c4', '#c9b0e0']);
  return (
    <g>
      {colors.map((c, i) => (
        <rect
          key={i}
          x={-200}
          y={top + Math.round(i * band)}
          width={600}
          height={Math.ceil(band) + 1}
          fill={c}
        />
      ))}
      {/* Reflet : traits horizontaux qui scintillent sous le soleil */}
      {Array.from({ length: 14 }, (_, i) => {
        const y = top + 1 + i * ((bottom - top - 2) / 14);
        const w = Math.max(2, 12 - i * 0.6 + Math.sin((frame + i * 9) / 5) * 3);
        const on = rand(i + Math.floor(frame / 4)) > 0.25;
        return on ? (
          <rect
            key={i}
            x={Math.round(sunX - w / 2 + Math.sin((frame + i * 13) / 7) * 2)}
            y={Math.round(y)}
            width={Math.round(w)}
            height={1}
            fill={glint}
            opacity={(1 - i / 16) * (1 - tod * 0.6)}
          />
        ) : null;
      })}
      {/* Écume */}
      {Array.from({ length: 16 }, (_, i) => {
        const y = top + 4 + (i % 6) * ((bottom - top - 6) / 6);
        const x = ((((rand(i) * 260 - frame * (0.15 + (i % 3) * 0.08)) % 260) + 260) % 260) - 60;
        return (
          <rect
            key={`f${i}`}
            x={Math.round(x)}
            y={Math.round(y)}
            width={3 + (i % 3)}
            height={1}
            fill={C.cream}
            opacity={0.35}
          />
        );
      })}
    </g>
  );
}

// Palmier dont les palmes se balancent au vent (rotation autour du haut du tronc).
export function Palm({
  x,
  base,
  frame,
  phase = 0,
  tod,
}: {
  x: number;
  base: number;
  frame: number;
  phase?: number;
  tod: number;
}) {
  const sway = Math.sin(frame / 14 + phase) * 4 + Math.sin(frame / 5 + phase) * 1.2;
  const leaf = interpolateColors(tod, [0, 1], [C.leaf, '#16241e']);
  const leafLight = interpolateColors(tod, [0, 1], [C.leafLight, '#22362a']);
  const trunk = interpolateColors(tod, [0, 1], ['#6a4426', '#2a1d16']);
  const top = base - PALM_TRUNK.length;
  return (
    <g>
      <Sprite rows={PALM_TRUNK} x={x} y={top} colors={{ T: trunk, a: '#4a2e18' }} />
      <g transform={`rotate(${sway} ${x + 2} ${top + 1})`}>
        <Sprite
          rows={PALM_FRONDS}
          x={x - 8}
          y={top - 8}
          colors={{ G: leaf, g: leafLight, T: trunk }}
        />
      </g>
    </g>
  );
}

// Muret de la Corniche (pierre), avec joints.
export function Wall({
  top,
  height,
  offset,
  tod,
}: {
  top: number;
  height: number;
  offset: number;
  tod: number;
}) {
  const face = interpolateColors(tod, [0, 1], [C.stone, '#4a3a4a']);
  const cap = interpolateColors(tod, [0, 1], [C.stoneLight, '#6a5468']);
  const joint = interpolateColors(tod, [0, 1], [C.stoneDark, '#3a2c3a']);
  return (
    <g>
      <rect x={-200} y={top} width={800} height={3} fill={cap} />
      <rect x={-200} y={top + 3} width={800} height={height - 3} fill={face} />
      {Array.from({ length: 50 }, (_, i) => (
        <rect
          key={i}
          x={i * 14 - (offset % 14) - 14}
          y={top + 3}
          width={1}
          height={height - 3}
          fill={joint}
        />
      ))}
      <rect
        x={-200}
        y={top + 3 + Math.floor((height - 3) / 2)}
        width={800}
        height={1}
        fill={joint}
      />
    </g>
  );
}
