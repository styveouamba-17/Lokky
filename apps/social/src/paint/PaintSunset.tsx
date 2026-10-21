import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { rand } from '../pixel/core';
import { Camera, clamp, easeInOut, Flash, FREDOKA, Stamp } from '../ui/fx';
import { Depth, Dust, Glow, Pic, Plate } from './layers';

// Scène 5, version peinte — les six de dos face au coucher de soleil, puis accéléré
// 18 h → 20 h (fondu entre les deux décors) : « À 18 h, des inconnus. À 20 h, ses potes. »

const WALL_TOP = Math.round(0.67 * 1920);
const SUN = { x: 572, y: 902 };
// Calque du groupe (1672 × 941) : bas des jeans à 86,7 % de l'image, posé sur le muret.
const GROUP_W = 820;
const GROUP_H = (GROUP_W / 1672) * 941;
const GROUP = { left: 40, top: WALL_TOP + 16 - GROUP_H * 0.867 };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function PaintSunset({
  first,
  lapseFrom,
  lapseTo,
  duration,
}: {
  first: number;
  lapseFrom: number;
  lapseTo: number;
  duration: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tod = interpolate(frame, [lapseFrom, lapseTo], [0, 1], { ...clamp, easing: easeInOut });
  const punch =
    frame >= lapseTo
      ? spring({ frame: frame - lapseTo, fps, config: { damping: 12, stiffness: 200 } }) * 0.05
      : 0;
  const exit = interpolate(frame, [duration - 14, duration], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const plate =
    interpolate(frame, [0, duration], [1.12, 1.02], { ...clamp, easing: easeInOut }) +
    punch +
    exit * 0.6;
  const people = 1 + (plate - 1) * 1.6;
  // Rires : le groupe « respire » et sautille un peu.
  const laugh = Math.max(0, Math.sin(frame / 3.2)) * Math.max(0, Math.sin(frame / 23)) * 8;

  const minutes = Math.round(interpolate(frame, [lapseFrom, lapseTo], [0, 120], clamp) / 5) * 5;
  const clock = `${pad(18 + Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const clockIn = interpolate(frame, [first, first + 5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: '#1b1530' }}>
      <Camera impacts={[{ at: lapseTo, strength: 22, duration: 14 }]}>
        <Depth zoom={plate} originY="60%">
          <Plate name="sunset-plate-18h" />
          <Plate name="sunset-plate-20h" style={{ opacity: tod }} />
          {/* Le soleil brille encore plus fort avant de disparaître */}
          <Glow x={SUN.x} y={SUN.y} radius={520} color="rgba(255,200,120,0.55)" opacity={1 - tod} />
          {/* Étoiles qui apparaissent avec la nuit */}
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: rand(i) * 1080,
                top: rand(i + 50) * 760,
                width: 4,
                height: 4,
                borderRadius: 2,
                background: '#fff6ea',
                opacity: tod * (rand(i + Math.floor(frame / 6)) > 0.8 ? 0.4 : 0.95),
                boxShadow: '0 0 8px #fff6ea',
              }}
            />
          ))}
        </Depth>
        <Depth zoom={people} originY="60%" y={-laugh}>
          <Pic name="sunset-group" left={GROUP.left} top={GROUP.top} width={GROUP_W} />
          {/* La nuit tombe aussi sur eux */}
          <AbsoluteFill
            style={{ background: '#1a1650', opacity: tod * 0.4, mixBlendMode: 'multiply' }}
          />
        </Depth>
        <Dust count={20} color="rgba(255,225,170,0.8)" wind={2} area={{ top: 600, height: 900 }} />
      </Camera>

      {[
        { at: 26, x: 160 },
        { at: 44, x: 690 },
        { at: 118, x: 420 },
        { at: 140, x: 720 },
      ].map(({ at, x }, i) => {
        const t = frame - at;
        if (t < 0 || t > 22) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: 1010 - t * 4,
              fontFamily: FREDOKA,
              fontWeight: 700,
              fontSize: 58,
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

      {frame >= first ? (
        <div
          style={{
            position: 'absolute',
            top: 170,
            width: '100%',
            textAlign: 'center',
            fontFamily: FREDOKA,
            fontWeight: 700,
            fontSize: 200,
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
      <Stamp
        at={first + 2}
        until={lapseFrom - 4}
        top={390}
        size={96}
        color="#ffc857"
        rotate={-3}
        style={{ fontFamily: FREDOKA, fontWeight: 700, letterSpacing: 0 }}
      >
        DES INCONNUS
      </Stamp>
      <Stamp
        at={lapseTo}
        until={duration - 12}
        top={390}
        size={124}
        color="#ff6b3d"
        rotate={-4}
        style={{ fontFamily: FREDOKA, fontWeight: 700, letterSpacing: 0 }}
      >
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
