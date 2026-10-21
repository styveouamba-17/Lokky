import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

// Toile en « pixels logiques » : 135 × 240, affichée en 1080 × 1920 (1 pixel = 8 × 8).
export const PX = 8;
export const COLS = 135;
export const ROWS = 240;

export type Palette = Readonly<Record<string, string>>;

// Couleurs de Lokky et de la scène (partagées par tous les sprites).
export const C = {
  orange: '#ff6b3d',
  orangeDark: '#d94f25',
  orangeLight: '#ff9a6b',
  sun: '#ffc857',
  sunLight: '#ffe3a1',
  teal: '#00a99d',
  tealDark: '#00756d',
  tealLight: '#4fd1c5',
  cream: '#fff6ea',
  creamDark: '#e8d9c4',
  ink: '#1b1220',
  night: '#141a3a',
  dusk: '#2e2a5c',
  purple: '#4b2f5e',
  plum: '#6d3b5e',
  skin: '#7a4a2c',
  skinDark: '#5e371f',
  hair: '#20160f',
  hairLight: '#3a2a1e',
  indigo: '#39406b',
  indigoDark: '#2a2f52',
  khaki: '#b08a5a',
  khakiDark: '#8c6a40',
  stone: '#c9a27a',
  stoneDark: '#a07d5a',
  stoneLight: '#e2c29b',
  leaf: '#2f5d3a',
  leafLight: '#4f8a52',
  trunk: '#5a3b22',
  black: '#2b2a33',
  blackDark: '#1f1e26',
  white: '#ffffff',
} as const;

// Palette par défaut des personnages : chaque instance peut remplacer T/D (haut), H (cheveux),
// P/p (bas), A (accessoire).
export const PEOPLE: Palette = {
  K: C.ink,
  H: C.hair,
  h: C.hairLight,
  S: C.skin,
  s: C.skinDark,
  E: C.ink,
  O: C.orange,
  o: C.orangeDark,
  T: C.teal,
  D: C.tealDark,
  P: C.indigo,
  p: C.indigoDark,
  W: C.cream,
  w: C.creamDark,
  A: C.khaki,
  a: C.khakiDark,
  F: '#dff7ff', // écran de téléphone allumé
  f: '#7fd3ff',
  Y: C.sun,
  R: '#e04a3a',
  G: C.leaf,
  g: C.leafLight,
  N: C.black,
  n: C.blackDark,
};

// Regroupe les pixels voisins de même couleur en rectangles : beaucoup moins d'éléments SVG.
function runs(rows: readonly string[]) {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x]!;
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w += 1;
      if (c !== '.' && c !== ' ') out.push({ x, y, w, c });
      x += w;
    }
  });
  return out;
}

// Sprite dans une scène SVG (coordonnées logiques). flip : miroir horizontal.
export function Sprite({
  rows,
  x = 0,
  y = 0,
  palette = PEOPLE,
  colors,
  flip = false,
  opacity,
}: {
  rows: readonly string[];
  x?: number;
  y?: number;
  palette?: Palette;
  colors?: Palette;
  flip?: boolean;
  opacity?: number;
}) {
  const cells = useMemo(() => runs(rows), [rows]);
  const width = Math.max(...rows.map((r) => r.length));
  const pal = colors ? { ...palette, ...colors } : palette;
  const transform = flip ? `translate(${x + width} ${y}) scale(-1 1)` : `translate(${x} ${y})`;
  return (
    <g transform={transform} opacity={opacity}>
      {cells.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={pal[r.c] ?? '#ff00ff'} />
      ))}
    </g>
  );
}

// Calque plein écran en pixels logiques. Plusieurs calques empilés font la profondeur.
export function Layer({
  children,
  style,
  viewBox = `0 0 ${COLS} ${ROWS}`,
}: {
  children: ReactNode;
  style?: CSSProperties;
  viewBox?: string;
}) {
  return (
    <AbsoluteFill style={style}>
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        shapeRendering="crispEdges"
        style={{ overflow: 'visible' }}
      >
        {children}
      </svg>
    </AbsoluteFill>
  );
}

// Dégradé en bandes (ciel, mer), avec une ligne de tramage entre deux bandes.
export function Bands({
  colors,
  y,
  height,
  x = -40,
  width = COLS + 80,
  dither = true,
}: {
  colors: readonly string[];
  y: number;
  height: number;
  x?: number;
  width?: number;
  dither?: boolean;
}) {
  const band = height / colors.length;
  return (
    <g>
      {colors.map((c, i) => (
        <rect
          key={i}
          x={x}
          y={y + Math.round(i * band)}
          width={width}
          height={Math.ceil(band) + 1}
          fill={c}
        />
      ))}
      {dither
        ? colors.slice(1).map((c, i) => {
            const by = y + Math.round((i + 1) * band) - 1;
            return (
              <g key={`d${i}`}>
                {Array.from({ length: Math.ceil(width / 2) }, (_, k) => (
                  <rect key={k} x={x + k * 2 + (i % 2)} y={by} width={1} height={1} fill={c} />
                ))}
              </g>
            );
          })
        : null}
    </g>
  );
}

// Disque pixelisé (soleil, lune, têtes).
export function Disc({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const lines = [];
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    lines.push(
      <rect
        key={dy}
        x={Math.round(cx - half)}
        y={Math.round(cy + dy)}
        width={half * 2 + 1}
        height={1}
        fill={fill}
      />,
    );
  }
  return <g>{lines}</g>;
}

// Bruit déterministe : mêmes étoiles, mêmes particules à chaque rendu.
export function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453;
  return x - Math.floor(x);
}
