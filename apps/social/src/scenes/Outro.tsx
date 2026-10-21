import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, rand } from '../pixel/core';
import { Camera, clamp, easeOut, Flash, FREDOKA, PIXEL } from '../ui/fx';

// Scène 6 — « Lokky. Des sorties, de vraies rencontres. Télécharge l'app. »

export function Outro({ look = 'pixel' }: { look?: 'pixel' | 'paint' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220, mass: 0.7 } });
  const logoScale = interpolate(slam, [0, 1], [3.2, 1]);
  const appear = (at: number) =>
    spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180 } });
  const name = appear(8);
  const tagline = appear(16);
  const cta = appear(26);

  return (
    <AbsoluteFill style={{ background: C.orange, overflow: 'hidden' }}>
      {/* Rayons qui tournent lentement */}
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${frame * 0.6}deg at 50% 36%, rgba(255,200,87,0.28) 0deg 10deg, transparent 10deg 24deg)`,
          opacity: interpolate(frame, [0, 10], [0, 1], clamp),
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 36%, rgba(255,246,234,0.55), transparent 45%)',
        }}
      />

      <Camera impacts={[{ at: 0, strength: 30, duration: 16 }]}>
        <div
          style={{
            position: 'absolute',
            top: 360,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Img
            src={staticFile(look === 'pixel' ? 'icon-pixel.png' : 'icon.webp')}
            style={{
              width: 380,
              height: 380,
              borderRadius: 84,
              imageRendering: look === 'pixel' ? 'pixelated' : 'auto',
              transform: `scale(${logoScale}) rotate(${(1 - slam) * -12}deg)`,
              boxShadow: '0 30px 0 rgba(27,18,32,0.25), 0 0 0 14px #fff6ea',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 800,
            width: '100%',
            textAlign: 'center',
            fontFamily: FREDOKA,
            fontWeight: 700,
            fontSize: 190,
            color: '#fff6ea',
            letterSpacing: -4,
            textShadow: '0 12px 0 rgba(27,18,32,0.3)',
            opacity: name,
            transform: `translateY(${(1 - name) * 60}px)`,
          }}
        >
          Lokky
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1010,
            width: '100%',
            textAlign: 'center',
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: 62,
            color: C.ink,
            opacity: tagline,
            transform: `translateY(${(1 - tagline) * 40}px)`,
          }}
        >
          Des sorties, de vraies rencontres.
        </div>
      </Camera>

      <div
        style={{
          position: 'absolute',
          top: 1150,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: cta,
          transform: `scale(${interpolate(cta, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            background: C.ink,
            color: '#fff6ea',
            borderRadius: 60,
            padding: '26px 54px',
            fontFamily: look === 'pixel' ? PIXEL : FREDOKA,
            fontWeight: 700,
            fontSize: 50,
            letterSpacing: 1,
            boxShadow: '0 10px 0 rgba(27,18,32,0.35)',
          }}
        >
          DISPO SUR iOS & ANDROID
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1290,
          width: '100%',
          textAlign: 'center',
          fontFamily: FREDOKA,
          fontWeight: 700,
          fontSize: 54,
          color: '#fff6ea',
          opacity: cta,
        }}
      >
        lokky.app
      </div>

      {/* Étincelles pixel */}
      {Array.from({ length: 22 }, (_, i) => {
        const t = frame - 2 - (i % 6);
        if (t < 0) return null;
        const angle = rand(i) * Math.PI * 2;
        const dist = interpolate(t, [0, 26], [80, 420 + rand(i + 4) * 240], {
          ...clamp,
          easing: easeOut,
        });
        const size = 14 + (i % 3) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 + Math.cos(angle) * dist - size / 2,
              top: 550 + Math.sin(angle) * dist - size / 2,
              width: size,
              height: size,
              background: i % 2 ? '#fff6ea' : C.sun,
              opacity: interpolate(t, [0, 30], [1, 0], clamp),
            }}
          />
        );
      })}
      <Flash at={0} peak={0.9} duration={10} />
    </AbsoluteFill>
  );
}
