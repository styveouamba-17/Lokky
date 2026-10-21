import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Bands, C, Disc, Layer, PX, rand, Sprite } from '../pixel/core';
import { HERO_SITTING_PHONE, MOON } from '../pixel/sprites';
import { Camera, clamp, easeInOut, Flash, Stamp } from '../ui/fx';

// Scène 1 — l'accroche. La nuit, seul dans sa chambre, le visage éclairé par le téléphone.
// « Le problème à Dakar, c'est pas qu'il y a rien à faire. » … « C'est avec qui. » (impact)

const FLOOR = 150;
const MATTRESS = 136;
const HERO = { x: 74, y: MATTRESS - 17 };
const PHONE = { x: HERO.x + 13.5, y: HERO.y + 13.5 };
// Cadrage : centré entre la fenêtre et le héros.
const ORIGIN = { x: `${((HERO.x + 4) / 135) * 100}%`, y: `${(96 / 240) * 100}%` };
const IMPACTS = (at: number) => [{ at, strength: 26, duration: 16 }];

// Immeubles vus par la fenêtre : [x, largeur, hauteur].
const CITY: readonly [number, number, number][] = [
  [30, 9, 16],
  [39, 6, 24],
  [45, 10, 13],
  [55, 7, 30],
  [62, 8, 19],
  [70, 6, 26],
  [76, 11, 15],
  [87, 7, 22],
  [94, 13, 12],
];

export function Bedroom({ impactAt }: { impactAt: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const push = interpolate(frame, [0, impactAt], [1.3, 1.45], { ...clamp, easing: easeInOut });
  const punch = spring({ frame: frame - impactAt, fps, config: { damping: 12, stiffness: 180 } });
  const zoom = push + (frame >= impactAt ? punch * 0.22 : 0);
  const glow = 0.75 + 0.25 * Math.sin(frame / 5) * Math.sin(frame / 13);

  return (
    <AbsoluteFill style={{ background: '#1d1830' }}>
      <Camera zoom={zoom} originX={ORIGIN.x} originY={ORIGIN.y} impacts={IMPACTS(impactAt)}>
        {/* Mur, fenêtre et ville */}
        <Layer>
          <rect x={-20} y={-20} width={175} height={FLOOR + 20} fill="#2a2440" />
          <Bands colors={['#221d36', '#2a2440']} y={0} height={24} />
          {/* Fenêtre */}
          <rect x={26} y={14} width={83} height={66} fill="#4b2f5e" />
          <rect x={28} y={16} width={79} height={62} fill={C.night} />
          <Bands
            colors={[C.night, '#1b2148', '#232756', C.dusk]}
            x={28}
            width={79}
            y={16}
            height={62}
          />
          {Array.from({ length: 26 }, (_, i) => {
            const twinkle = rand(i + Math.floor(frame / 9)) > 0.75 ? 0.35 : 1;
            return (
              <rect
                key={i}
                x={29 + Math.floor(rand(i) * 77)}
                y={17 + Math.floor(rand(i + 50) * 34)}
                width={1}
                height={1}
                fill={C.cream}
                opacity={twinkle}
              />
            );
          })}
          <Sprite rows={MOON} x={88} y={22} colors={{ W: C.sunLight }} />
          {CITY.map(([x, w, h], i) => (
            <g key={i}>
              <rect x={x} y={78 - h} width={w} height={h} fill="#15122a" />
              {Array.from({ length: Math.floor(h / 4) * Math.floor(w / 3) }, (_, k) => {
                const cols = Math.floor(w / 3);
                const wx = x + 1 + (k % cols) * 3;
                const wy = 78 - h + 2 + Math.floor(k / cols) * 4;
                const on = rand(i * 31 + k + Math.floor(frame / 40) * (k % 3 === 0 ? 1 : 0)) > 0.55;
                return on ? (
                  <rect key={k} x={wx} y={wy} width={1} height={2} fill={C.sun} opacity={0.85} />
                ) : null;
              })}
            </g>
          ))}
          {/* Croisillons et rebord */}
          <rect x={66} y={16} width={2} height={62} fill="#4b2f5e" />
          <rect x={28} y={46} width={79} height={2} fill="#4b2f5e" />
          <rect x={24} y={80} width={87} height={3} fill="#6d3b5e" />
          {/* Plante sur le rebord */}
          <rect x={98} y={74} width={6} height={6} fill={C.orangeDark} />
          <rect x={97} y={68} width={3} height={6} fill={C.leafLight} />
          <rect x={101} y={65} width={3} height={9} fill={C.leaf} />
          {/* Horloge murale : 21 h 47, comme sur le téléphone */}
          <Disc cx={44} cy={104} r={7} fill="#4b2f5e" />
          <Disc cx={44} cy={104} r={6} fill={C.cream} />
          <rect x={44} y={99} width={1} height={5} fill={C.ink} />
          <rect x={40} y={104} width={4} height={1} fill={C.ink} />
          <rect x={44} y={104} width={1} height={1} fill={C.orange} />
          {/* Affiche au mur */}
          <rect x={8} y={36} width={13} height={18} fill={C.creamDark} />
          <rect x={9} y={37} width={11} height={10} fill={C.orange} />
          <Disc cx={14} cy={44} r={3} fill={C.sun} />
          <rect x={9} y={45} width={11} height={2} fill={C.teal} />
        </Layer>

        {/* Sol, lit et héros */}
        <Layer>
          <rect x={-20} y={FLOOR} width={175} height={120} fill="#2d2236" />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={-20} y={FLOOR + 6 + i * 9} width={175} height={1} fill="#251c2d" />
          ))}
          {/* Lumière de la lune au sol */}
          <polygon points="40,150 98,150 120,240 20,240" fill="#7f86d6" opacity={0.07} />
          {/* Lit */}
          <rect x={10} y={112} width={6} height={FLOOR - 112} fill="#5a3b22" />
          <rect x={12} y={MATTRESS} width={78} height={8} fill={C.cream} />
          <rect x={12} y={MATTRESS + 8} width={78} height={6} fill="#5a3b22" />
          <rect x={14} y={MATTRESS + 14} width={3} height={FLOOR - MATTRESS - 14} fill="#4a2f1b" />
          <rect x={85} y={MATTRESS + 14} width={3} height={FLOOR - MATTRESS - 14} fill="#4a2f1b" />
          <rect x={17} y={MATTRESS - 6} width={16} height={6} fill={C.creamDark} />
          <rect x={34} y={MATTRESS - 3} width={46} height={11} fill={C.tealDark} />
          <rect x={34} y={MATTRESS - 3} width={46} height={2} fill={C.teal} />
          <rect x={52} y={MATTRESS - 1} width={1} height={9} fill="#005c55" />
          <Sprite rows={HERO_SITTING_PHONE} x={HERO.x} y={HERO.y} />
        </Layer>
      </Camera>

      {/* Lueur du téléphone sur le visage (hors calque pixel : douce) */}
      <Camera zoom={zoom} originX={ORIGIN.x} originY={ORIGIN.y} impacts={IMPACTS(impactAt)}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${PHONE.x * PX}px ${PHONE.y * PX}px, rgba(160,220,255,${0.4 * glow}) 0px, rgba(120,190,255,${0.12 * glow}) 90px, transparent 220px)`,
            mixBlendMode: 'screen',
          }}
        />
      </Camera>

      <Stamp at={6} top={170} size={86} color="#fff6ea" rotate={-2} until={impactAt - 4}>
        LE VRAI PROBLÈME
        <br />À DAKAR ?
      </Stamp>
      <Stamp at={impactAt} top={560} size={150} color="#ff6b3d" shadow="#1b1220" rotate={-5}>
        AVEC QUI ?
      </Stamp>
      <Flash at={impactAt} peak={0.6} />
    </AbsoluteFill>
  );
}
