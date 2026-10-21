import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, FREDOKA, Stamp, Whip } from '../ui/fx';
import { Dust, Glow, Pic } from './layers';

// Scène 4, version peinte — travelling le long de la Corniche. Trois profondeurs : ciel et mer
// (lents), promenade et groupe (vitesse normale), particules de vent (devant).

// Décors 1672 × 940 mis à la hauteur de la vidéo : × 2,043 → 3416 px de large.
const SCALE = 1920 / 940;
const WIDE = Math.round(1672 * SCALE);
const SKY_Y = -250; // remonte l'horizon : plus de mer visible au-dessus du muret
const WALL_TOP = Math.round(0.655 * 1920);
// Le groupe (calque 1672 × 940) assis sur le muret, entre le premier lampadaire et le palmier.
const GROUP = { x: 1520, width: 780 };
const GROUP_H = (GROUP.width / 1672) * 940;
// Le héros (calque 1024 × 1536) : pieds à 96,6 % de l'image, posés sur la promenade.
const HERO_W = 540;
const HERO_H = (HERO_W / 1024) * 1536;
const FEET = 1710;
const STOP = 140;

export function PaintWalk({ duration, stampAt }: { duration: number; stampAt: number }) {
  const frame = useCurrentFrame();
  const walk = interpolate(frame, [0, STOP], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.25, 0.1, 0.4, 1),
  });
  const pan = -1150 * walk;
  const heroScreenX = interpolate(walk, [0, 1], [-300, -30]);
  // Pas : petit rebond et balancement réguliers tant qu'il marche.
  const stepPhase = (frame / 7.5) * Math.PI;
  const moving = frame < STOP;
  const bob = moving ? Math.abs(Math.sin(stepPhase)) * -14 : 0;
  const sway = moving ? Math.sin(stepPhase) * 1.2 : 0;
  const zoom = interpolate(frame, [0, duration], [1.1, 1.0], { ...clamp, easing: easeInOut });

  return (
    <Whip duration={duration}>
      <AbsoluteFill style={{ background: '#f08a3c', overflow: 'hidden' }}>
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: '50% 62%' }}>
          {/* Ciel, mer, côte : très lointains */}
          <Pic name="walk-sky" left={pan * 0.35 - 200} top={SKY_Y} width={WIDE} />
          {/* Promenade, muret, palmiers et lampadaires */}
          <Pic name="walk-promenade" left={pan} top={0} width={WIDE} />
          {/* Les cinq, assis sur le muret */}
          <Pic
            name="walk-group"
            left={pan + GROUP.x}
            top={WALL_TOP + 12 - GROUP_H * 0.845}
            width={GROUP.width}
          />
          {/* Ombre au sol et héros */}
          <div
            style={{
              position: 'absolute',
              left: heroScreenX + HERO_W * 0.3,
              top: FEET - 14,
              width: HERO_W * 0.45,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(80,40,20,0.35)',
              filter: 'blur(6px)',
            }}
          />
          <Pic
            name="walk-hero"
            left={heroScreenX}
            top={FEET - HERO_H * 0.966 + bob}
            width={HERO_W}
            style={{ transform: `rotate(${sway}deg)`, transformOrigin: '50% 95%' }}
          />
        </AbsoluteFill>

        {/* Soleil rasant et vent */}
        <Glow x={300} y={760} radius={900} color="rgba(255,190,110,0.35)" />
        <Dust count={30} color="rgba(255,220,170,0.9)" wind={9} area={{ top: 500, height: 1300 }} />
        {Array.from({ length: 8 }, (_, i) => {
          const x = 1300 - ((frame * (30 + i * 4) + i * 260) % 1800);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: 280 + i * 170,
                width: 180 + (i % 3) * 80,
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,246,234,0.3)',
              }}
            />
          );
        })}

        <Stamp
          at={stampAt}
          until={stampAt + 70}
          top={230}
          size={128}
          color="#ffc857"
          rotate={-4}
          style={{ fontFamily: FREDOKA, fontWeight: 700, letterSpacing: 0 }}
        >
          ZÉRO
          <br />
          MALAISE
        </Stamp>
      </AbsoluteFill>
    </Whip>
  );
}
