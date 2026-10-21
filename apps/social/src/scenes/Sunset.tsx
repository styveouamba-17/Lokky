import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, Layer, rand, Sprite } from '../pixel/core';
import { BACKPACK, BIRD, sittingBack, TEA } from '../pixel/sprites';
import { Camera, clamp, easeInOut, Flash, PIXEL, Stamp } from '../ui/fx';
import { Clouds, Coast, FRIENDS, HERO_BACK, Palm, Sea, Sky, Sun, Wall } from './corniche';

// Scène 5 — plan de dos, face au coucher de soleil. Accéléré 18 h → 20 h :
// « À 18 h, c'étaient des inconnus. À 20 h, c'étaient ses potes. »

const HORIZON = 110;
const WALL_TOP = 150;
// Ordre sur le muret : le héros (sweat orange) au milieu du groupe.
const ROW = [FRIENDS[0]!, FRIENDS[1]!, HERO_BACK, FRIENDS[2]!, FRIENDS[3]!, FRIENDS[4]!];
const X0 = 25;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function Sunset({
  first,
  lapseFrom,
  lapseTo,
  duration,
}: {
  first: number; // « 18 h · des inconnus »
  lapseFrom: number;
  lapseTo: number; // « 20 h · des potes » (impact)
  duration: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tod = interpolate(frame, [lapseFrom, lapseTo], [0, 1], { ...clamp, easing: easeInOut });
  const sunY = interpolate(frame, [0, lapseTo], [98, 126], clamp);

  const punch = spring({ frame: frame - lapseTo, fps, config: { damping: 12, stiffness: 200 } });
  const exit = interpolate(frame, [duration - 14, duration], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const zoom =
    interpolate(frame, [0, lapseTo], [1.32, 1.2], { ...clamp, easing: easeInOut }) +
    (frame >= lapseTo ? punch * 0.06 : 0) +
    exit * 0.9;

  // Heure affichée : de 18:00 à 20:00 par pas de 5 minutes.
  const minutes = Math.round(interpolate(frame, [lapseFrom, lapseTo], [0, 120], clamp) / 5) * 5;
  const clock = `${pad(18 + Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const clockIn = interpolate(frame, [first, first + 5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: '#1b1530' }}>
      <Camera zoom={zoom} originY="62%" impacts={[{ at: lapseTo, strength: 22, duration: 14 }]}>
        <Layer>
          <Sky tod={tod} horizon={HORIZON} frame={frame} />
          <Clouds offset={frame * 0.12} tod={tod} y={52} />
          <Sun x={70} y={sunY} r={13} tod={tod} />
          <Coast x={-14} horizon={HORIZON} tod={tod} frame={frame} />
          {[0, 1].map((i) => (
            <Sprite
              key={i}
              rows={BIRD[Math.floor((frame + i * 4) / 6) % 2]!}
              x={150 - ((frame * (0.45 + i * 0.1) + i * 40) % 190)}
              y={60 + i * 8}
              colors={{ N: '#3a2440' }}
              opacity={1 - tod * 0.7}
            />
          ))}
          <Sea top={HORIZON} bottom={WALL_TOP} tod={tod} frame={frame} sunX={70} />
          <Palm x={4} base={WALL_TOP + 2} frame={frame} tod={tod} />
          <Palm x={124} base={WALL_TOP + 4} frame={frame} phase={3} tod={tod} />
          {/* Le groupe : petits sauts de rire, décalés */}
          {ROW.map((f, i) => {
            const laughing = frame > 20 && rand(i * 13 + Math.floor((frame + i * 5) / 7)) > 0.72;
            return (
              <Sprite
                key={i}
                rows={sittingBack(f.head)}
                x={X0 + i * 14}
                y={WALL_TOP - 16 - (laughing ? 1 : 0)}
                colors={f.colors}
              />
            );
          })}
          <Sprite rows={BACKPACK} x={13} y={WALL_TOP - 8} />
          <Sprite rows={TEA} x={112} y={WALL_TOP - 6} />
          <Wall top={WALL_TOP} height={22} offset={0} tod={tod} />
          <rect x={-40} y={WALL_TOP + 22} width={220} height={80} fill={'#3a2a3a'} />
          <rect x={-40} y={WALL_TOP + 22} width={220} height={2} fill={'#2a1e2a'} />
        </Layer>
        {/* La nuit tombe aussi sur les personnages */}
        <AbsoluteFill
          style={{ background: '#1a1650', opacity: tod * 0.38, mixBlendMode: 'multiply' }}
        />
      </Camera>

      {/* Lumière du couchant, qui s'éteint */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 44%, rgba(255,190,110,0.4), transparent 55%)',
          mixBlendMode: 'screen',
          opacity: 1 - tod,
        }}
      />

      {/* « HA HA » au-dessus du groupe */}
      {[
        { at: 26, x: 250 },
        { at: 44, x: 690 },
        { at: 118, x: 420 },
        { at: 140, x: 760 },
      ].map(({ at, x }, i) => {
        const t = frame - at;
        if (t < 0 || t > 22) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: 900 - t * 4,
              fontFamily: PIXEL,
              fontSize: 54,
              color: '#fff6ea',
              opacity: interpolate(t, [0, 3, 16, 22], [0, 1, 1, 0]),
              textShadow: '0 5px 0 #1b1220',
              transform: `rotate(${i % 2 ? 6 : -6}deg)`,
            }}
          >
            HA HA
          </div>
        );
      })}

      {/* Horloge */}
      {frame >= first ? (
        <div
          style={{
            position: 'absolute',
            top: 190,
            width: '100%',
            textAlign: 'center',
            fontFamily: PIXEL,
            fontWeight: 700,
            fontSize: 190,
            lineHeight: 1,
            color: '#fff6ea',
            textShadow: '0 12px 0 #1b1220, 10px 12px 0 #1b1220',
            opacity: clockIn * (1 - exit),
            transform: `scale(${1 + (1 - clockIn) * 0.6})`,
          }}
        >
          {clock}
        </div>
      ) : null}
      <Stamp at={first + 2} until={lapseFrom - 4} top={400} size={92} color="#ffc857" rotate={-3}>
        DES INCONNUS
      </Stamp>
      <Stamp at={lapseTo} until={duration - 12} top={400} size={118} color="#ff6b3d" rotate={-4}>
        DES POTES
      </Stamp>
      <Flash at={lapseTo} peak={0.5} />
      <AbsoluteFill
        style={{
          background: '#fff',
          opacity: interpolate(frame, [duration - 6, duration], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
}
