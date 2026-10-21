import type { CSSProperties, ReactNode } from 'react';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Polices en local (public/fonts, licence OFL) : aucun téléchargement pendant le rendu.
export const FREDOKA = 'LokkyFredoka';
export const PIXEL = 'LokkyPixel';
export const DMSANS = 'LokkyDMSans';

const FONTS: readonly [string, string][] = [
  [FREDOKA, 'fonts/Fredoka.ttf'],
  [PIXEL, 'fonts/PixelifySans.ttf'],
  [DMSANS, 'fonts/DMSans.ttf'],
];
if (typeof document !== 'undefined') {
  const handle = delayRender('Polices locales');
  Promise.all(
    FONTS.map(async ([family, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, { weight: '100 900' });
      document.fonts.add(await face.load());
    }),
  )
    .then(() => continueRender(handle))
    .catch((error: unknown) => {
      console.error(error);
      continueRender(handle);
    });
}

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

// Tremblement de caméra déterministe, qui s'amortit après un impact.
export function shake(frame: number, at: number, strength = 18, duration = 14) {
  const t = frame - at;
  if (t < 0 || t > duration) return { x: 0, y: 0, r: 0 };
  const damp = Math.pow(1 - t / duration, 2) * strength;
  return {
    x: Math.sin(t * 2.7) * damp,
    y: Math.cos(t * 3.3) * damp * 0.8,
    r: Math.sin(t * 1.9) * damp * 0.04,
  };
}

// Caméra : zoom, déplacement, rotation et tremblements cumulés, appliqués à toute la scène.
export function Camera({
  zoom = 1,
  x = 0,
  y = 0,
  rotate = 0,
  impacts = [],
  originX = '50%',
  originY = '50%',
  children,
}: {
  zoom?: number;
  x?: number;
  y?: number;
  rotate?: number;
  impacts?: readonly { at: number; strength?: number; duration?: number }[];
  originX?: string;
  originY?: string;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const s = impacts.reduce(
    (acc, i) => {
      const k = shake(frame, i.at, i.strength, i.duration);
      return { x: acc.x + k.x, y: acc.y + k.y, r: acc.r + k.r };
    },
    { x: 0, y: 0, r: 0 },
  );
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x + s.x}px, ${y + s.y}px) scale(${zoom}) rotate(${rotate + s.r}deg)`,
        transformOrigin: `${originX} ${originY}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

// Flash blanc (ou coloré) bref, sur un impact ou une coupe.
export function Flash({
  at,
  color = '#fff',
  duration = 8,
  peak = 0.85,
}: {
  at: number;
  color?: string;
  duration?: number;
  peak?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + 1, at + duration], [0, peak, 0], clamp);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity, pointerEvents: 'none' }} />;
}

// Vignette et grain léger : donnent de la matière et recentrent le regard.
export function Finish({ vignette = 0.55 }: { vignette?: number }) {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,6,20,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id={`grain${frame % 4}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 4} />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain${frame % 4})`} />
        </svg>
      </AbsoluteFill>
    </>
  );
}

// Titre « tampon » : arrive grand et flou, claque à sa taille avec un léger rebond.
export function Stamp({
  at,
  children,
  top,
  size = 120,
  color = '#fff',
  shadow = '#1b1220',
  rotate = -4,
  until,
  style,
}: {
  at: number;
  children: ReactNode;
  top: number;
  size?: number;
  color?: string;
  shadow?: string;
  rotate?: number;
  until?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || (until !== undefined && frame > until + 6)) return null;
  const pop = spring({
    frame: frame - at,
    fps,
    config: { damping: 11, stiffness: 260, mass: 0.6 },
  });
  const scale = interpolate(pop, [0, 1], [2.4, 1]);
  const blur = interpolate(frame - at, [0, 4], [12, 0], clamp);
  const out = until === undefined ? 1 : interpolate(frame, [until, until + 6], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: PIXEL,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: 2,
        color,
        opacity: Math.min(1, (frame - at) / 2) * out,
        filter: `blur(${blur}px)`,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        textShadow: `0 8px 0 ${shadow}, 8px 8px 0 ${shadow}, -4px 4px 0 ${shadow}, 4px -4px 0 ${shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Entrée et sortie de scène en « whip pan » : glissement rapide avec flou de mouvement.
export function Whip({
  children,
  duration,
  enter = true,
  exit = true,
  direction = 1,
  length = 9,
}: {
  children: ReactNode;
  duration: number;
  enter?: boolean;
  exit?: boolean;
  direction?: 1 | -1;
  length?: number;
}) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  let x = 0;
  let blur = 0;
  if (enter && frame < length) {
    const k = interpolate(frame, [0, length], [1, 0], { ...clamp, easing: easeOut });
    x = k * width * 0.9 * direction;
    blur = k * 40;
  }
  if (exit && frame > duration - length) {
    const k = interpolate(frame, [duration - length, duration], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    });
    x = -k * width * 0.9 * direction;
    blur = k * 40;
  }
  return (
    <AbsoluteFill
      style={{ transform: `translateX(${x}px)`, filter: blur ? `blur(${blur}px)` : undefined }}
    >
      {children}
    </AbsoluteFill>
  );
}

// Fondu au noir d'entrée (début de vidéo) ou de sortie.
export function Fade({
  from = 0,
  to = 1,
  start,
  end,
}: {
  from?: number;
  to?: number;
  start: number;
  end: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, end], [from, to], clamp);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ background: '#000', opacity }} />;
}
