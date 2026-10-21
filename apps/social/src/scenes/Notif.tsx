import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Bands, C, Disc, PEOPLE, rand, Sprite } from '../pixel/core';
import { HAND } from '../pixel/sprites';
import { Camera, clamp, DMSANS, easeInOut, easeOut, Flash, FREDOKA, PIXEL, Whip } from '../ui/fx';

// Scène 3 — « Puis un soir, une notif. » (bip) … « Une sortie à la Corniche. Il appuie sur
// « Je viens ! ». » L'écran reprend la fiche d'une sortie de l'app, en plus simple.

const DM = DMSANS;

type Look = 'pixel' | 'paint';

function AppIcon({ size, look }: { size: number; look: Look }) {
  return (
    <Img
      src={staticFile(look === 'pixel' ? 'icon-pixel.png' : 'icon.webp')}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        imageRendering: look === 'pixel' ? 'pixelated' : 'auto',
      }}
    />
  );
}

// Version peinte : avatar à initiale, comme un profil sans photo dans l'app.
function Initial({ letter, color }: { letter: string; color: string }) {
  return (
    <div
      style={{
        width: 86,
        height: 86,
        borderRadius: 43,
        border: '5px solid #fff6ea',
        background: color,
        marginLeft: -18,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontFamily: FREDOKA,
        fontWeight: 700,
        fontSize: 40,
      }}
    >
      {letter}
    </div>
  );
}

// Visuel de la sortie (Corniche au coucher du soleil, version vignette).
function Cover({ frame }: { frame: number }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 90 50"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid slice"
    >
      <Bands
        colors={['#ff7a4a', '#ff9a52', '#ffb85e', '#ffd27a']}
        y={0}
        height={30}
        x={0}
        width={90}
      />
      <Disc cx={60} cy={29} r={7} fill={C.sunLight} />
      <path d="M70 30 L74 22 L76 24 L78 18 L80 24 L84 30 Z" fill="#6d3b5e" />
      <Bands colors={[C.tealLight, C.teal, C.tealDark]} y={30} height={12} x={0} width={90} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x={56 + (i % 3) * 3 + Math.round(Math.sin((frame + i * 5) / 4))}
          y={32 + i * 1.5}
          width={4 - (i % 2)}
          height={1}
          fill={C.sunLight}
          opacity={0.8}
        />
      ))}
      <rect x={0} y={42} width={90} height={8} fill={C.stone} />
      <rect x={0} y={42} width={90} height={1} fill={C.stoneLight} />
    </svg>
  );
}

// Têtes des participants (style pixel), pour la ligne « qui vient ».
function Face({ hair, top }: { hair: string; top: string }) {
  return (
    <svg
      width={86}
      height={86}
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      style={{
        borderRadius: 43,
        border: '5px solid #fff6ea',
        background: '#ffe3c8',
        marginLeft: -18,
      }}
    >
      <rect x={2} y={1} width={6} height={3} fill={hair} />
      <rect x={3} y={3} width={4} height={4} fill={C.skin} />
      <rect x={4} y={4} width={1} height={1} fill={C.ink} />
      <rect x={6} y={4} width={1} height={1} fill={C.ink} />
      <rect x={1} y={7} width={8} height={3} fill={top} />
    </svg>
  );
}

export function Notif({
  notifAt,
  openAt,
  tapAt,
  duration,
  look = 'pixel',
}: {
  notifAt: number;
  openAt: number;
  tapAt: number;
  duration: number;
  look?: Look;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drop = spring({ frame: frame - notifAt, fps, config: { damping: 13, stiffness: 170 } });
  const open = interpolate(frame, [openAt, openAt + 12], [0, 1], { ...clamp, easing: easeInOut });
  const zoom =
    interpolate(frame, [0, openAt], [1, 1.08], { ...clamp, easing: easeInOut }) - open * 0.08;

  // Doigt : arrive vers le bouton, appuie, repart.
  const handIn = interpolate(frame, [tapAt - 22, tapAt - 2], [0, 1], { ...clamp, easing: easeOut });
  const press = interpolate(frame, [tapAt - 2, tapAt, tapAt + 5], [0, 1, 0], clamp);
  const handOut = interpolate(frame, [tapAt + 8, tapAt + 22], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const joined = frame >= tapAt;
  const buttonScale =
    1 -
    press * 0.08 +
    (joined ? spring({ frame: frame - tapAt, fps, config: { damping: 9 } }) * 0.04 - 0.04 : 0);

  return (
    <Whip duration={duration} enter exit>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #3a2a55, #140f22)' }}>
        <Camera
          zoom={zoom}
          impacts={[
            { at: notifAt, strength: 8, duration: 10 },
            { at: tapAt, strength: 10, duration: 10 },
          ]}
        >
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 110,
              width: 840,
              height: 1300,
              borderRadius: 72,
              border: '16px solid #2c2440',
              background: '#0f0b1a',
              overflow: 'hidden',
              boxShadow: '0 50px 140px rgba(0,0,0,0.65), inset 0 0 0 4px #4f4468',
            }}
          >
            {/* Écran verrouillé */}
            <AbsoluteFill
              style={{
                background: 'linear-gradient(#2b2350, #5a3560 55%, #c45a4a)',
                opacity: 1 - open,
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 84 132"
                shapeRendering="crispEdges"
                style={{ position: 'absolute', opacity: 0.55 }}
              >
                {Array.from({ length: 30 }, (_, i) => (
                  <rect
                    key={i}
                    x={Math.floor(rand(i) * 84)}
                    y={Math.floor(rand(i + 7) * 70)}
                    width={1}
                    height={1}
                    fill={C.cream}
                    opacity={rand(i + Math.floor(frame / 10)) > 0.3 ? 1 : 0.3}
                  />
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 120,
                  width: '100%',
                  textAlign: 'center',
                  color: '#fff',
                }}
              >
                <div style={{ fontFamily: DM, fontSize: 40, fontWeight: 500, opacity: 0.85 }}>
                  samedi 18 octobre
                </div>
                <div
                  style={{ fontFamily: FREDOKA, fontSize: 210, fontWeight: 600, lineHeight: 1.05 }}
                >
                  21:47
                </div>
              </div>
              {/* Notification */}
              <div
                style={{
                  position: 'absolute',
                  left: 36,
                  right: 36,
                  top: 500,
                  transform: `translateY(${interpolate(drop, [0, 1], [-640, 0])}px) scale(${interpolate(drop, [0, 1], [0.9, 1])})`,
                  opacity: frame >= notifAt ? 1 : 0,
                  background: 'rgba(255,250,244,0.96)',
                  borderRadius: 44,
                  padding: '30px 32px',
                  display: 'flex',
                  gap: 26,
                  alignItems: 'flex-start',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                }}
              >
                <AppIcon size={104} look={look} />
                <div style={{ flex: 1, color: C.ink }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: DM,
                      fontSize: 30,
                      color: '#746e68',
                      fontWeight: 600,
                    }}
                  >
                    <span>LOKKY</span>
                    <span>maintenant</span>
                  </div>
                  <div style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 44, marginTop: 6 }}>
                    Une sortie pour toi
                  </div>
                  <div style={{ fontFamily: DM, fontSize: 34, lineHeight: 1.3, marginTop: 6 }}>
                    Coucher de soleil à la Corniche · demain 18 h 30 · 4 places
                  </div>
                </div>
              </div>
            </AbsoluteFill>

            {/* Fiche de la sortie */}
            <AbsoluteFill
              style={{ background: '#fffaf4', transform: `translateY(${(1 - open) * 1320}px)` }}
            >
              <div style={{ height: 520, position: 'relative' }}>
                {look === 'pixel' ? (
                  <Cover frame={frame} />
                ) : (
                  <Img
                    src={staticFile('paint/walk-sky.png')}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: '62% 50%',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    left: 40,
                    top: 40,
                    background: 'rgba(255,250,244,0.95)',
                    borderRadius: 40,
                    padding: '12px 26px',
                    fontFamily: DM,
                    fontWeight: 700,
                    fontSize: 30,
                    color: C.orangeDark,
                  }}
                >
                  Plage · coucher de soleil
                </div>
              </div>
              <div style={{ padding: '40px 48px', color: C.ink }}>
                <div
                  style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 64, lineHeight: 1.08 }}
                >
                  Coucher de soleil à la Corniche
                </div>
                <div style={{ fontFamily: DM, fontSize: 36, marginTop: 22, color: '#4a4440' }}>
                  Demain · 18 h 30
                </div>
                <div style={{ fontFamily: DM, fontSize: 36, marginTop: 8, color: '#4a4440' }}>
                  Corniche Ouest · Fann
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', marginTop: 38, paddingLeft: 18 }}
                >
                  {look === 'pixel' ? (
                    <>
                      <Face hair={C.hair} top={C.teal} />
                      <Face hair={C.hairLight} top={C.cream} />
                      <Face hair={C.hair} top="#e04a3a" />
                      {joined ? <Face hair={C.hair} top={C.orange} /> : null}
                    </>
                  ) : (
                    <>
                      <Initial letter="A" color={C.teal} />
                      <Initial letter="F" color="#e04a3a" />
                      <Initial letter="M" color={C.indigo} />
                      {joined ? <Initial letter="M" color={C.orange} /> : null}
                    </>
                  )}
                  <div
                    style={{
                      fontFamily: DM,
                      fontWeight: 700,
                      fontSize: 32,
                      marginLeft: 24,
                      color: C.tealDark,
                    }}
                  >
                    {joined ? '3 places restantes' : '4 places restantes'}
                  </div>
                </div>
              </div>
              {/* Bouton */}
              <div
                style={{
                  position: 'absolute',
                  left: 48,
                  right: 48,
                  bottom: 64,
                  height: 150,
                  borderRadius: 75,
                  background: joined ? C.teal : C.orange,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: FREDOKA,
                  fontWeight: 700,
                  fontSize: 58,
                  transform: `scale(${buttonScale})`,
                  boxShadow: `0 18px 40px ${joined ? 'rgba(0,169,157,0.45)' : 'rgba(255,107,61,0.45)'}`,
                }}
              >
                {joined ? 'C’est noté !' : 'Je viens !'}
              </div>
              {/* Onde de l'appui */}
              {frame >= tapAt && frame < tapAt + 18 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: 404 - 20,
                    bottom: 139 - 20,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    border: '6px solid rgba(255,255,255,0.9)',
                    transform: `scale(${interpolate(frame - tapAt, [0, 18], [1, 14])})`,
                    opacity: interpolate(frame - tapAt, [0, 18], [0.9, 0]),
                  }}
                />
              ) : null}
            </AbsoluteFill>
          </div>

          {/* Confettis pixel */}
          {joined
            ? Array.from({ length: 28 }, (_, i) => {
                const t = (frame - tapAt) / fps;
                const angle = rand(i) * Math.PI * 2;
                const speed = 500 + rand(i + 3) * 700;
                const x = 540 + Math.cos(angle) * speed * t;
                const y = 1250 + Math.sin(angle) * speed * t * 0.8 - 900 * t + 1400 * t * t;
                if (t > 1.2) return null;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: 18,
                      height: 18,
                      background: [C.orange, C.teal, C.sun, C.cream][i % 4],
                      opacity: 1 - t / 1.2,
                    }}
                  />
                );
              })
            : null}

          {/* Doigt */}
          {look === 'paint' && frame >= tapAt - 22 && frame < tapAt + 22 ? (
            // Indicateur de toucher (démo d'app) à la place du doigt pixel.
            <div
              style={{
                position: 'absolute',
                left: 540 - 60 + (1 - handIn) * 260 + handOut * 300,
                top: 1250 - 60 + (1 - handIn) * 420 + handOut * 500,
                width: 120,
                height: 120,
                borderRadius: 60,
                background: 'rgba(255,255,255,0.75)',
                border: '6px solid rgba(255,255,255,0.95)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                transform: `scale(${1 - press * 0.25})`,
              }}
            />
          ) : null}
          {look === 'pixel' && frame >= tapAt - 22 && frame < tapAt + 22 ? (
            <svg
              width={216}
              height={270}
              viewBox="0 0 12 15"
              shapeRendering="crispEdges"
              style={{
                position: 'absolute',
                left: 456 + (1 - handIn) * 320 + handOut * 340,
                top: 1240 + (1 - handIn) * 520 + handOut * 600 + press * 18,
              }}
            >
              <Sprite rows={HAND} palette={PEOPLE} />
            </svg>
          ) : null}
        </Camera>
        <Flash at={notifAt} peak={0.25} duration={6} />
        <div
          style={{
            position: 'absolute',
            top: 70,
            width: '100%',
            textAlign: 'center',
            fontFamily: look === 'pixel' ? PIXEL : FREDOKA,
            fontWeight: 700,
            fontSize: 64,
            color: '#fff6ea',
            opacity: interpolate(
              frame,
              [notifAt, notifAt + 6, openAt, openAt + 6],
              [0, 1, 1, 0],
              clamp,
            ),
            textShadow: '0 6px 0 #1b1220',
          }}
        >
          BIP BIP !
        </div>
      </AbsoluteFill>
    </Whip>
  );
}
