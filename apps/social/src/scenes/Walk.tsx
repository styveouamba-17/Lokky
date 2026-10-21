import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, Layer, rand, Sprite } from '../pixel/core';
import { BIRD, HERO_WALK, HERO_WALK_BOB, HERO_WAVE, sittingBack } from '../pixel/sprites';
import { Camera, clamp, easeInOut, PIXEL, Stamp, Whip } from '../ui/fx';
import { Clouds, Coast, FRIENDS, Palm, Sea, Sky, Sun, Wall } from './corniche';

// Scène 4 — « Sur place : cinq inconnus. Zéro malaise. » « Un thé, des fous rires… »
// Travelling de profil le long de la Corniche ; chaque plan défile à sa vitesse (profondeur).

const HORIZON = 92;
const WALL_TOP = 136;
const FEET = 184;
const GROUP_X = 214;
const STOP = 140;

export function Walk({ duration, stampAt }: { duration: number; stampAt: number }) {
  const frame = useCurrentFrame();
  const heroX = interpolate(frame, [0, STOP], [8, 196], {
    ...clamp,
    easing: Easing.bezier(0.2, 0.2, 0.45, 1),
  });
  const camX = interpolate(heroX, [8, 196], [0, 160], clamp);
  const walking = frame < STOP;
  const step = Math.floor(heroX / 5) % 4;
  const waving = frame >= STOP + 4 && frame < STOP + 30;
  const heroRows = waving ? HERO_WAVE : walking ? HERO_WALK[step]! : HERO_WALK[1]!;
  const heroY = FEET - heroRows.length + (walking ? HERO_WALK_BOB[step]! : 0);
  const zoom = interpolate(frame, [0, duration], [1.08, 1.0], { ...clamp, easing: easeInOut });

  return (
    <Whip duration={duration}>
      <AbsoluteFill style={{ background: '#3b2a5c' }}>
        <Camera zoom={zoom} originY="60%" y={-110}>
          {/* Ciel, soleil, nuages, côte : très lointains, défilent à peine */}
          <Layer>
            <Sky tod={0} horizon={HORIZON} frame={frame} />
            <Sun x={92 - camX * 0.04} y={HORIZON - 6} r={11} tod={0} />
            <Clouds offset={camX * 0.1 + frame * 0.05} tod={0} />
            <Coast x={150 - camX * 0.3} horizon={HORIZON} tod={0} frame={frame} />
            {[0, 1, 2].map((i) => {
              const bx = ((i * 60 + frame * 0.5 - camX * 0.15) % 200) - 30;
              return (
                <Sprite
                  key={i}
                  rows={BIRD[Math.floor((frame + i * 3) / 6) % 2]!}
                  x={bx}
                  y={34 + i * 9 + Math.sin(frame / 10 + i) * 2}
                  colors={{ N: '#3a2440' }}
                />
              );
            })}
            <Sea top={HORIZON} bottom={WALL_TOP} tod={0} frame={frame} sunX={92 - camX * 0.04} />
          </Layer>

          {/* Premier plan « monde » : muret, groupe, palmiers, promenade, héros */}
          <Layer>
            <g transform={`translate(${-camX} 0)`}>
              {FRIENDS.map((f, i) => (
                <Sprite
                  key={i}
                  rows={sittingBack(f.head)}
                  x={GROUP_X + i * 14}
                  y={WALL_TOP - 16}
                  colors={f.colors}
                />
              ))}
            </g>
            <g transform={`translate(${-camX} 0)`}>
              <Wall top={WALL_TOP} height={18} offset={0} tod={0} />
              {/* Promenade */}
              <rect x={-60} y={WALL_TOP + 18} width={600} height={50} fill={C.stoneLight} />
              {Array.from({ length: 45 }, (_, i) => (
                <rect
                  key={i}
                  x={i * 12 - 60}
                  y={WALL_TOP + 18}
                  width={1}
                  height={50}
                  fill="#d4b088"
                />
              ))}
              <rect x={-60} y={WALL_TOP + 34} width={600} height={1} fill="#d4b088" />
              <rect x={-60} y={WALL_TOP + 52} width={600} height={1} fill="#d4b088" />
              {/* Lampadaires */}
              {[70, 170, 270].map((lx) => (
                <g key={lx}>
                  <rect x={lx} y={WALL_TOP - 34} width={2} height={54} fill="#2b2233" />
                  <rect x={lx - 2} y={WALL_TOP - 37} width={6} height={3} fill="#2b2233" />
                  <rect x={lx - 1} y={WALL_TOP - 34} width={4} height={1} fill={C.sunLight} />
                </g>
              ))}
              <Palm x={40} base={WALL_TOP + 20} frame={frame} tod={0} />
              <Palm x={128} base={WALL_TOP + 20} frame={frame} phase={2} tod={0} />
              <Palm x={300} base={WALL_TOP + 20} frame={frame} phase={4} tod={0} />
              {/* Ombre et héros */}
              <rect x={heroX + 2} y={FEET} width={10} height={1} fill="#b8946a" />
              <Sprite rows={heroRows} x={heroX} y={heroY} />
              {/* Bordure et sol au premier plan */}
              <rect x={-60} y={WALL_TOP + 68} width={600} height={4} fill={C.stoneDark} />
              <rect x={-60} y={WALL_TOP + 72} width={600} height={90} fill="#5a3b4a" />
            </g>
          </Layer>

          {/* Très proche : feuillage flou qui passe vite (profondeur de champ) */}
          <Layer style={{ filter: 'blur(7px)' }}>
            <g transform={`translate(${-camX * 1.7} 0)`}>
              {[30, 150, 260, 380].map((fx, i) => (
                <g key={fx}>
                  <rect x={fx} y={198 - (i % 2) * 6} width={26} height={60} fill="#1f3a26" />
                  <rect x={fx - 6} y={206 - (i % 2) * 6} width={38} height={60} fill="#244530" />
                  <rect x={fx + 4} y={192 - (i % 2) * 6} width={12} height={8} fill="#2f5d3a" />
                </g>
              ))}
            </g>
          </Layer>
        </Camera>

        {/* Lumière chaude du couchant */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(circle at 70% 38%, rgba(255,200,120,0.35), transparent 55%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Vent : traînées et grains de sable */}
        {Array.from({ length: 14 }, (_, i) => {
          const speed = 26 + rand(i) * 30;
          const x = 1300 - ((frame * speed + rand(i + 5) * 1600) % 1800);
          const y = 200 + rand(i + 11) * 1500;
          const sand = i % 2 === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y + Math.sin((frame + i * 10) / 8) * 12,
                width: sand ? 8 : 120 + rand(i + 2) * 160,
                height: sand ? 8 : 4,
                background: sand ? '#f2cf98' : 'rgba(255,246,234,0.35)',
                borderRadius: 2,
              }}
            />
          );
        })}

        {/* Le groupe répond au salut */}
        {frame >= STOP + 10 && frame < STOP + 40 ? (
          <div
            style={{
              position: 'absolute',
              left: 560,
              top: 760 - (frame - STOP - 10) * 1.5,
              fontFamily: PIXEL,
              fontWeight: 700,
              fontSize: 64,
              color: '#fff6ea',
              textShadow: '0 6px 0 #1b1220',
              opacity: interpolate(
                frame,
                [STOP + 10, STOP + 14, STOP + 34, STOP + 40],
                [0, 1, 1, 0],
              ),
              transform: 'rotate(-5deg)',
            }}
          >
            SALUT !
          </div>
        ) : null}

        <Stamp at={stampAt} until={stampAt + 70} top={250} size={128} color="#ffc857" rotate={-4}>
          ZÉRO
          <br />
          MALAISE
        </Stamp>
      </AbsoluteFill>
    </Whip>
  );
}
