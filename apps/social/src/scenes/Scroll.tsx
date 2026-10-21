import type { ReactNode } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Bands, C, Disc, rand } from '../pixel/core';
import { Camera, clamp, easeInOut, easeOut, FREDOKA, PIXEL, Whip } from '../ui/fx';

// Scène 2 — « Tes potes sont partis, t'es nouveau en ville… et le week-end, tu scrolles. »
// Les stories des autres défilent (plage, foot, ataya, concert) ; chaque carte se retourne.

const CARD_W = 60;
const CARD_H = 84;

function CardArt({ children }: { children: ReactNode }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </svg>
  );
}

// Petit personnage (3 × 6) pour les vignettes.
function Tiny({
  x,
  y,
  top,
  frame = 0,
  phase = 0,
}: {
  x: number;
  y: number;
  top: string;
  frame?: number;
  phase?: number;
}) {
  const bob = Math.sin((frame + phase * 10) / 4) > 0.6 ? -1 : 0;
  return (
    <g transform={`translate(${x} ${y + bob})`}>
      <rect x={1} y={0} width={2} height={2} fill={C.hair} />
      <rect x={1} y={1} width={2} height={1} fill={C.skin} />
      <rect x={0} y={2} width={4} height={3} fill={top} />
      <rect x={1} y={5} width={1} height={2} fill={C.indigo} />
      <rect x={2} y={5} width={1} height={2} fill={C.indigo} />
    </g>
  );
}

function Beach({ frame }: { frame: number }) {
  return (
    <CardArt>
      <Bands
        colors={['#ff8a5c', '#ffa25e', '#ffbf69', '#ffd98e']}
        y={0}
        height={38}
        x={0}
        width={60}
      />
      <Disc cx={40} cy={33} r={6} fill={C.sunLight} />
      <Bands colors={[C.tealLight, C.teal, C.tealDark]} y={38} height={20} x={0} width={60} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={i}
          x={((i * 13 + frame * 0.6) % 70) - 5}
          y={42 + (i % 3) * 5}
          width={4}
          height={1}
          fill={C.cream}
          opacity={0.7}
        />
      ))}
      <rect x={0} y={58} width={60} height={26} fill="#f2cf98" />
      <rect x={0} y={58} width={60} height={2} fill="#ffe6b8" />
      <rect x={12} y={50} width={1} height={14} fill={C.trunk} />
      <rect x={6} y={48} width={13} height={3} fill={C.orange} />
      <rect x={8} y={47} width={9} height={1} fill={C.orange} />
      <Tiny x={22} y={58} top={C.teal} frame={frame} />
      <Tiny x={28} y={58} top={C.cream} frame={frame} phase={1} />
      <Tiny x={34} y={58} top={C.orange} frame={frame} phase={2} />
      <Tiny x={44} y={60} top="#e04a3a" frame={frame} phase={3} />
    </CardArt>
  );
}

function Football({ frame }: { frame: number }) {
  const ball = { x: 14 + ((frame * 0.9) % 34), y: 60 - Math.abs(Math.sin(frame / 6)) * 10 };
  return (
    <CardArt>
      <Bands colors={['#6ec6ff', '#8fd3ff', '#b5e3ff']} y={0} height={34} x={0} width={60} />
      <rect x={0} y={28} width={60} height={6} fill="#c8a978" />
      <Bands
        colors={['#3f9a4c', '#4caf5a', '#3f9a4c', '#4caf5a', '#3f9a4c']}
        y={34}
        height={50}
        x={0}
        width={60}
        dither={false}
      />
      <rect x={4} y={40} width={1} height={10} fill={C.cream} />
      <rect x={4} y={40} width={8} height={1} fill={C.cream} />
      <rect x={11} y={40} width={1} height={10} fill={C.cream} />
      <rect x={0} y={66} width={60} height={1} fill={C.cream} opacity={0.6} />
      <Tiny x={20} y={58} top={C.orange} frame={frame} />
      <Tiny x={34} y={54} top={C.teal} frame={frame} phase={2} />
      <Tiny x={44} y={62} top={C.orange} frame={frame} phase={1} />
      <Tiny x={10} y={52} top={C.teal} frame={frame} phase={3} />
      <rect x={Math.round(ball.x)} y={Math.round(ball.y)} width={2} height={2} fill={C.white} />
    </CardArt>
  );
}

function Ataya({ frame }: { frame: number }) {
  return (
    <CardArt>
      <rect x={0} y={0} width={60} height={84} fill="#3a2440" />
      <Bands colors={['#4b2f5e', '#6d3b5e', '#8a4a5a']} y={0} height={40} x={0} width={60} />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <rect
            x={i * 6 + 2}
            y={10 + Math.round(Math.sin(i / 1.5) * 2)}
            width={1}
            height={1}
            fill={C.cream}
            opacity={0.4}
          />
          <rect
            x={i * 6 + 2}
            y={11 + Math.round(Math.sin(i / 1.5) * 2)}
            width={2}
            height={2}
            fill={C.sun}
            opacity={rand(i + Math.floor(frame / 8)) > 0.3 ? 1 : 0.45}
          />
        </g>
      ))}
      <rect x={0} y={56} width={60} height={28} fill="#5a3b22" />
      <rect x={0} y={56} width={60} height={2} fill="#7a5232" />
      <rect x={10} y={46} width={6} height={10} fill={C.black} />
      <rect x={11} y={44} width={4} height={2} fill={C.black} />
      <rect x={16} y={48} width={3} height={1} fill={C.black} />
      {[24, 30, 36, 42].map((x, i) => (
        <g key={x}>
          <rect x={x} y={50} width={3} height={6} fill="#f6efe4" opacity={0.8} />
          <rect x={x} y={52} width={3} height={4} fill="#b35b2a" />
          <rect
            x={x}
            y={50 - ((frame + i * 7) % 14) / 3}
            width={1}
            height={1}
            fill={C.cream}
            opacity={0.5}
          />
        </g>
      ))}
      <Tiny x={6} y={62} top={C.teal} frame={frame} />
      <Tiny x={22} y={64} top={C.orange} frame={frame} phase={2} />
      <Tiny x={40} y={62} top={C.cream} frame={frame} phase={1} />
    </CardArt>
  );
}

function Concert({ frame }: { frame: number }) {
  const swing = Math.sin(frame / 8) * 10;
  return (
    <CardArt>
      <rect x={0} y={0} width={60} height={84} fill="#120e22" />
      <polygon
        points={`12,0 18,0 ${30 + swing},60 ${18 + swing},60`}
        fill={C.orange}
        opacity={0.35}
      />
      <polygon
        points={`42,0 48,0 ${42 - swing},60 ${30 - swing},60`}
        fill={C.teal}
        opacity={0.35}
      />
      <rect x={6} y={40} width={48} height={4} fill="#2b2a40" />
      <Tiny x={28} y={33} top={C.sun} frame={frame} />
      {Array.from({ length: 12 }, (_, i) => {
        const jump = Math.sin(frame / 3 + i) > 0.5 ? -2 : 0;
        return (
          <rect
            key={i}
            x={i * 5}
            y={62 + jump + (i % 2) * 2}
            width={4}
            height={22}
            fill="#05030c"
          />
        );
      })}
      {Array.from({ length: 14 }, (_, i) => (
        <rect
          key={`c${i}`}
          x={Math.floor(rand(i) * 58)}
          y={Math.floor(rand(i + 9) * 40)}
          width={1}
          height={1}
          fill={[C.orange, C.teal, C.sun][i % 3]}
          opacity={rand(i + Math.floor(frame / 4)) > 0.5 ? 1 : 0.2}
        />
      ))}
    </CardArt>
  );
}

const STORIES = [
  { who: 'Awa', where: 'Plage de Ngor', Art: Beach, paint: 'story-beach' },
  { who: 'Moussa', where: 'Foot à Yoff', Art: Football, paint: 'story-football' },
  { who: 'Fatou', where: 'Ataya à Mermoz', Art: Ataya, paint: 'story-ataya' },
  { who: 'Ibou', where: 'Concert au Plateau', Art: Concert, paint: 'story-concert' },
] as const;

// Version peinte : la peinture de la story, avec un lent zoom (effet « Ken Burns »).
function Painted({ name, frame }: { name: string; frame: number }) {
  return (
    <Img
      src={staticFile(`paint/${name}.png`)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${1.04 + frame * 0.0025})`,
      }}
    />
  );
}

export function Scroll({
  flips,
  duration,
  style = 'pixel',
}: {
  flips: readonly number[];
  duration: number;
  style?: 'pixel' | 'paint';
}) {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, duration], [1.02, 1.12], { ...clamp, easing: easeInOut });

  return (
    <Whip duration={duration}>
      <AbsoluteFill style={{ background: 'linear-gradient(#1d1830, #2b2246)' }}>
        <Camera zoom={zoom}>
          {/* Téléphone */}
          <div
            style={{
              position: 'absolute',
              left: 150,
              top: 140,
              width: 780,
              height: 1270,
              borderRadius: 64,
              background: '#0f0b1a',
              border: '14px solid #3a3150',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6), inset 0 0 0 4px #4f4468',
              overflow: 'hidden',
            }}
          >
            {/* Barres de progression des stories */}
            <div
              style={{
                position: 'absolute',
                top: 34,
                left: 34,
                right: 34,
                display: 'flex',
                gap: 10,
              }}
            >
              {STORIES.map((_, i) => {
                const start = flips[i]!;
                const end = flips[i + 1] ?? duration;
                const p = interpolate(frame, [start, end], [0, 1], clamp);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <div
                      style={{
                        width: `${p * 100}%`,
                        height: '100%',
                        borderRadius: 4,
                        background: '#fff',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ position: 'absolute', inset: '70px 24px 24px', perspective: 1600 }}>
              {STORIES.map(({ who, where, Art, paint }, i) => {
                const start = flips[i]!;
                const end = flips[i + 1] ?? duration + 20;
                if (frame < start - 1 || frame > end + 7) return null;
                const flipIn = interpolate(frame, [start, start + 7], [90, 0], {
                  ...clamp,
                  easing: easeOut,
                });
                const flipOut = interpolate(frame, [end, end + 6], [0, -90], clamp);
                const angle = frame >= end ? flipOut : flipIn;
                return (
                  <div
                    key={who}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 36,
                      overflow: 'hidden',
                      transform: `rotateY(${angle}deg)`,
                      transformOrigin: frame >= end ? 'left center' : 'right center',
                      backfaceVisibility: 'hidden',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                    }}
                  >
                    {style === 'paint' ? (
                      <Painted name={paint} frame={frame - start} />
                    ) : (
                      <Art frame={frame - start} />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: 30,
                        left: 30,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                      }}
                    >
                      <div
                        style={{
                          width: 74,
                          height: 74,
                          borderRadius: 37,
                          background: C.cream,
                          border: `6px solid ${C.orange}`,
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: style === 'paint' ? FREDOKA : PIXEL,
                          fontWeight: 700,
                          fontSize: 38,
                          color: C.ink,
                        }}
                      >
                        {who[0]}
                      </div>
                      <div
                        style={{
                          fontFamily: FREDOKA,
                          fontWeight: 700,
                          color: '#fff',
                          fontSize: 40,
                          textShadow: '0 3px 0 rgba(0,0,0,0.5)',
                        }}
                      >
                        {who}
                        <div style={{ fontWeight: 600, fontSize: 30, opacity: 0.9 }}>{where}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Camera>
      </AbsoluteFill>
    </Whip>
  );
}
