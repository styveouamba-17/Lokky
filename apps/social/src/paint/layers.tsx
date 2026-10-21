import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { rand } from '../pixel/core';

// Briques des scènes peintes : images placées en pixels de la vidéo (1080 × 1920).

export function Pic({
  name,
  left,
  top,
  width,
  style,
}: {
  name: string;
  left: number;
  top: number;
  width: number;
  style?: CSSProperties;
}) {
  return (
    <Img
      src={staticFile(`paint/${name}.png`)}
      style={{ position: 'absolute', left, top, width, height: 'auto', ...style }}
    />
  );
}

// Décor plein cadre (format 9:16), recadré au centre.
export function Plate({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <Img
      src={staticFile(`paint/${name}.png`)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  );
}

// Calque avec sa propre profondeur : un zoom plus fort = plus proche de la caméra.
export function Depth({
  zoom,
  x = 0,
  y = 0,
  originX = '50%',
  originY = '50%',
  children,
}: {
  zoom: number;
  x?: number;
  y?: number;
  originX?: string;
  originY?: string;
  children: React.ReactNode;
}) {
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: `${originX} ${originY}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

// Poussière / particules lumineuses qui flottent dans l'air (vent vers la gauche si wind > 0).
export function Dust({
  count = 26,
  color = 'rgba(255,230,180,0.85)',
  wind = 0,
  area = { top: 0, height: 1920 },
  seed = 1,
}: {
  count?: number;
  color?: string;
  wind?: number;
  area?: { top: number; height: number };
  seed?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 7 + seed * 101 + k);
        const size = 3 + r(1) * 7;
        const x =
          ((((r(2) * 1300 - frame * (wind * (0.6 + r(3)) + 0.15)) % 1300) + 1300) % 1300) - 110;
        const y = area.top + r(4) * area.height + Math.sin(frame / (18 + r(5) * 20) + i) * 26;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame / (10 + r(6) * 14) + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: color,
              opacity: twinkle,
              filter: 'blur(1px)',
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </>
  );
}

// Lumière (halo coloré en mode « screen »).
export function Glow({
  x,
  y,
  radius,
  color,
  opacity = 1,
}: {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity?: number;
}) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x}px ${y}px, ${color}, transparent ${radius}px)`,
        mixBlendMode: 'screen',
        opacity,
      }}
    />
  );
}
