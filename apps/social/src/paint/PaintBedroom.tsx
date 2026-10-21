import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Camera, clamp, easeInOut, Flash, FREDOKA, Stamp } from '../ui/fx';
import { Depth, Dust, Glow, Pic, Plate } from './layers';

// Scène 1, version peinte — seul dans sa chambre, la nuit ; « C'est avec qui. » (impact).

// Héros assis au bord du lit (calque détouré 940 × 1672) : assise à 62 % de la hauteur.
const HERO = { left: 300, top: 600, width: 690 };
const PHONE = { x: 815, y: 1095 };
const ORIGIN = { x: '68%', y: '55%' };

export function PaintBedroom({ impactAt }: { impactAt: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = interpolate(frame, [0, impactAt], [1.04, 1.16], { ...clamp, easing: easeInOut });
  const punch =
    frame >= impactAt
      ? spring({ frame: frame - impactAt, fps, config: { damping: 12, stiffness: 180 } }) * 0.2
      : 0;
  // Le héros, plus proche, avance plus vite que le décor : effet de profondeur.
  const room = push + punch;
  const hero = 1 + (room - 1) * 1.45;
  const glow = 0.75 + 0.25 * Math.sin(frame / 5) * Math.sin(frame / 13);

  return (
    <AbsoluteFill style={{ background: '#0d1030' }}>
      <Camera impacts={[{ at: impactAt, strength: 26, duration: 16 }]}>
        <Depth zoom={room} originX={ORIGIN.x} originY={ORIGIN.y}>
          <Plate name="bedroom-plate" />
          {/* Lumières de la ville qui scintillent derrière la vitre */}
          <Glow
            x={300}
            y={720}
            radius={380}
            color="rgba(255,190,110,0.25)"
            opacity={0.6 + 0.4 * Math.sin(frame / 9)}
          />
        </Depth>
        <Depth zoom={hero} originX={ORIGIN.x} originY={ORIGIN.y}>
          <Pic name="bedroom-hero" left={HERO.left} top={HERO.top} width={HERO.width} />
          <Glow x={PHONE.x} y={PHONE.y} radius={260} color={`rgba(150,215,255,${0.45 * glow})`} />
        </Depth>
        <Dust count={18} color="rgba(190,210,255,0.7)" area={{ top: 300, height: 900 }} />
      </Camera>

      <Stamp
        at={6}
        top={160}
        size={86}
        color="#fff6ea"
        rotate={-2}
        until={impactAt - 4}
        style={{ fontFamily: FREDOKA, fontWeight: 700, letterSpacing: 0 }}
      >
        LE VRAI PROBLÈME
        <br />À DAKAR ?
      </Stamp>
      <Stamp
        at={impactAt}
        top={560}
        size={150}
        color="#ff6b3d"
        rotate={-5}
        style={{ fontFamily: FREDOKA, fontWeight: 700, letterSpacing: 0 }}
      >
        AVEC QUI ?
      </Stamp>
      <Flash at={impactAt} peak={0.6} />
    </AbsoluteFill>
  );
}
