import {
  Bank,
  Bicycle,
  Boat,
  Briefcase,
  Couch,
  FilmSlate,
  FlagCheckered,
  GraduationCap,
  House,
  MapTrifold,
  Motorcycle,
  Mountains,
  SoccerBall,
  TennisBall,
  UsersThree,
  Wallet,
  type Icon,
} from '@phosphor-icons/react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  getStaticFiles,
  Img,
  interpolate,
  interpolateColors,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { timeWords } from '../ui/Captions';
import { clamp, DMSANS, easeOut, Fade, FREDOKA } from '../ui/fx';
import { Avatar } from './Avatar';
import { ACTIVITIES, type Cue, FPS, type Line, SCENES, VOICE } from './script';

const INK = '#1b1220';
const ORANGE = '#ff6b3d';
const TEAL = '#00a99d';
const PAPER = '#fbf5ea';

const ICONS: Record<(typeof ACTIVITIES)[number]['icon'], Icon> = {
  Bicycle,
  Motorcycle,
  FlagCheckered,
  Boat,
  TennisBall,
  Bank,
  SoccerBall,
  Mountains,
  FilmSlate,
};

const line = (id: string) => VOICE.find((l) => l.id === id)!;
const wordsOf = (id: string) => timeWords(line(id));
// Instant (image absolue) où commence le n-ième mot d'une réplique.
const wordAt = (id: string, n: number) => wordsOf(id)[n]!.start;

const voiceFiles = new Set(getStaticFiles().map((f) => f.name));
const voiceSrc = (id: string) =>
  ['mp3', 'wav'].map((ext) => `vo/weekend/${id}.${ext}`).find((name) => voiceFiles.has(name));

// ——— Instants clés ———
const DAY_TICKS = [0, 1, 2, 3, 4].map((i) => Math.round(8 + i * 30));
const SATURDAY = SCENES.weekend.from + 6;
const ROWS = [line('w4').from, line('w5').from, line('w6').from];
const ENCORE = wordAt('w7', 6);
const TILES = [
  ...[0, 1, 2, 3, 4, 5].map((i) => wordAt('w9', i)),
  ...[1, 2, 3].map((i) => line('w9').from + line('w9').duration + i * 4),
];
const FREE = wordAt('w10', 2);
const CREATE = wordAt('w11', 5);
const JOINS = [0, 1, 2, 3].map((i) => line('w12').from + 6 + i * 9);

const CUES: readonly Cue[] = [
  ...DAY_TICKS.map((at) => ({ sfx: 'tick', at, volume: 0.5 })),
  { sfx: 'whoosh', at: SCENES.weekend.from - 4, volume: 0.6 },
  { sfx: 'stamp', at: SATURDAY, volume: 0.8 },
  { sfx: 'sparkle', at: SATURDAY + 3, volume: 0.6 },
  { sfx: 'whoosh', at: SCENES.obstacles.from - 4, volume: 0.5 },
  ...ROWS.map((at) => ({ sfx: 'pop', at, volume: 0.7 })),
  { sfx: 'whoosh', at: SCENES.couch.from - 4, volume: 0.5 },
  ...[0, 1, 2].map((i) => ({ sfx: 'tick', at: SCENES.couch.from + 14 + i * 22, volume: 0.45 })),
  { sfx: 'stamp', at: ENCORE, volume: 0.8 },
  { sfx: 'riser', at: SCENES.activities.from - 26, volume: 0.5 },
  { sfx: 'impact', at: SCENES.activities.from, volume: 0.8 },
  ...TILES.map((at) => ({ sfx: 'pop', at, volume: 0.55 })),
  { sfx: 'stamp', at: FREE, volume: 0.8 },
  { sfx: 'whoosh', at: SCENES.create.from - 4, volume: 0.5 },
  { sfx: 'stamp', at: CREATE, volume: 0.7 },
  ...JOINS.map((at) => ({ sfx: 'bip', at, volume: 0.5 })),
  { sfx: 'riser', at: SCENES.outro.from - 26, volume: 0.5 },
  { sfx: 'impact', at: SCENES.outro.from, volume: 0.9 },
  { sfx: 'sparkle', at: SCENES.outro.from + 4, volume: 0.6 },
];

// ——— Briques ———

function usePop(at: number, config = { damping: 12, stiffness: 220, mass: 0.6 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
}

// Papier ligné, comme un cahier : terne pendant la routine, chaud ensuite, sombre sur le canapé.
function Paper() {
  const frame = useCurrentFrame();
  const bg = interpolateColors(
    frame,
    [0, SCENES.weekend.from, SCENES.weekend.from + 8],
    ['#e6e1d8', '#e6e1d8', PAPER],
  );
  const dim = interpolate(
    frame,
    [SCENES.couch.from, SCENES.couch.from + 80, SCENES.activities.from - 4, SCENES.activities.from],
    [0, 0.42, 0.42, 0],
    clamp,
  );
  return (
    <>
      <AbsoluteFill
        style={{
          background: bg,
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0 62px, rgba(27,18,32,0.07) 62px 64px)',
        }}
      />
      <AbsoluteFill style={{ background: '#140f22', opacity: dim }} />
    </>
  );
}

// Titre du haut : la réplique en cours, mot important surligné en orange. Coupé sur les espaces
// ordinaires seulement : une espace insécable garde « dem ! » d'un seul bloc.
function Title({ lines }: { lines: readonly Line[] }) {
  const frame = useCurrentFrame();
  let current: Line | undefined;
  for (const l of lines) if (frame >= l.from - 2) current = l;
  const pop = usePop(current ? current.from - 2 : 0, { damping: 13, stiffness: 260, mass: 0.5 });
  if (!current) return null;
  const emphasis = new Set(current.emphasis ?? []);
  return (
    <div
      style={{
        position: 'absolute',
        top: 190,
        left: 50,
        right: 50,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])}) translateY(${interpolate(pop, [0, 1], [-20, 0])}px)`,
        opacity: Math.min(1, pop * 2),
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 28,
          padding: '22px 34px',
          boxShadow: '0 10px 30px rgba(27,18,32,0.12)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px 16px',
          maxWidth: 980,
        }}
      >
        {current.text.split(/ +/).map((w, i) => {
          const strong = emphasis.has(w);
          return (
            <span
              key={i}
              style={{
                fontFamily: FREDOKA,
                fontWeight: 600,
                fontSize: 62,
                lineHeight: 1.1,
                color: strong ? '#fff' : INK,
                background: strong ? ORANGE : 'transparent',
                borderRadius: 14,
                padding: strong ? '0 14px 4px' : 0,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Entrée et sortie d'un bloc de scène (local à la Sequence).
function Stage({ duration, children }: { duration: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const enter = usePop(0, { damping: 14, stiffness: 200, mass: 0.6 });
  const out = interpolate(frame, [duration - 7, duration], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(1, enter * 1.5) * out,
        transform: `scale(${interpolate(enter, [0, 1], [0.9, 1]) * interpolate(out, [0, 1], [0.94, 1])})`,
        transformOrigin: '50% 35%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function Card({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: '#fff',
        borderRadius: 32,
        border: `5px solid ${INK}`,
        boxShadow: `0 10px 0 ${INK}`,
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stamp({
  at,
  children,
  top,
  color,
  rotate = -6,
  size = 120,
}: {
  at: number;
  children: ReactNode;
  top: number;
  color: string;
  rotate?: number;
  size?: number;
}) {
  const frame = useCurrentFrame();
  const pop = usePop(at, { damping: 10, stiffness: 260, mass: 0.6 });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${interpolate(pop, [0, 1], [2.2, 1])}) rotate(${rotate}deg)`,
        opacity: Math.min(1, (frame - at) / 3),
      }}
    >
      <div
        style={{
          fontFamily: FREDOKA,
          fontWeight: 700,
          fontSize: size,
          color: '#fff',
          background: color,
          border: `6px solid ${INK}`,
          boxShadow: `0 12px 0 ${INK}`,
          borderRadius: 30,
          padding: '6px 44px 14px',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ——— Scènes (images locales à leur Sequence) ———

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

// Semaine en cases à cocher : les jours de routine se cochent, samedi tombe en orange.
function Week({ ticks, saturday }: { ticks: readonly number[]; saturday?: number }) {
  const frame = useCurrentFrame();
  const sat = usePop(saturday ?? 1e6, { damping: 9, stiffness: 260, mass: 0.6 });
  return (
    <div
      style={{
        position: 'absolute',
        top: 440,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {DAYS.map((d, i) => {
        const done = ticks[i] !== undefined && frame >= ticks[i]!;
        const isSat = i === 5 && saturday !== undefined && frame >= saturday;
        return (
          <div
            key={d}
            style={{
              width: 118,
              height: 118,
              borderRadius: 22,
              border: `5px solid ${INK}`,
              background: isSat ? ORANGE : done ? '#9a958c' : '#fff',
              color: isSat || done ? '#fff' : INK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FREDOKA,
              fontWeight: 700,
              fontSize: 38,
              transform: isSat
                ? `scale(${interpolate(sat, [0, 1], [1.8, 1.12])}) rotate(-6deg)`
                : undefined,
              boxShadow: isSat ? `0 10px 0 ${INK}` : undefined,
              zIndex: isSat ? 2 : 1,
            }}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

function Routine({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Tuile active : suit les mots (maison / boulot / maison), puis la boucle s'emballe.
  const w1 = wordsOf('w1');
  const w2 = wordsOf('w2').slice(1); // « Ou » ne compte pas
  const marks = [...w1, ...w2].map((w) => w.start);
  let step = marks.filter((m) => frame >= m).length - 1;
  const afterLast = line('w2').from + line('w2').duration;
  if (frame > afterLast) step = 3 + Math.floor((frame - afterLast) / 3);
  const school = frame >= line('w2').from;
  const tiles: [Icon, string][] = [
    [House, 'Maison'],
    [school ? GraduationCap : Briefcase, school ? 'École' : 'Boulot'],
    [House, 'Maison'],
  ];
  const active = step < 0 ? -1 : step % 3;
  return (
    <Stage duration={duration}>
      <Week ticks={DAY_TICKS} />
      <div
        style={{
          position: 'absolute',
          top: 660,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
        }}
      >
        {tiles.map(([TileIcon, label], i) => {
          const on = i === active;
          const bump = spring({
            frame: frame - (marks[step] ?? 0),
            fps,
            config: { damping: 10, stiffness: 300, mass: 0.5 },
          });
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <div
                style={{
                  width: 250,
                  height: 250,
                  borderRadius: 40,
                  border: `5px solid ${INK}`,
                  background: on ? '#fff' : '#d6d0c6',
                  boxShadow: on ? `0 12px 0 ${INK}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transform: on
                    ? `translateY(${interpolate(bump, [0, 1], [-30, -10])}px)`
                    : undefined,
                }}
              >
                <TileIcon size={130} weight="fill" color={on ? INK : '#8a847a'} />
                <span
                  style={{
                    fontFamily: FREDOKA,
                    fontWeight: 600,
                    fontSize: 40,
                    color: on ? INK : '#8a847a',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < 2 && (
                <span
                  style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 70, color: '#8a847a' }}
                >
                  ›
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Stage>
  );
}

function Weekend({ duration }: { duration: number }) {
  const from = SCENES.weekend.from;
  return (
    <Stage duration={duration}>
      <Week ticks={DAY_TICKS.map((t) => t - from - 200)} saturday={SATURDAY - from} />
      <Stamp at={SATURDAY - from + 6} top={680} color={ORANGE} size={130}>
        Week-end
      </Stamp>
      <Sparks at={SATURDAY - from + 4} x={540} y={760} />
    </Stage>
  );
}

function Sparks({ at, x, y }: { at: number; x: number; y: number }) {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 30) return null;
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = interpolate(t, [0, 24], [60, 360 + (i % 3) * 60], {
          ...clamp,
          easing: easeOut,
        });
        const size = 16 + (i % 3) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(angle) * dist - size / 2,
              top: y + Math.sin(angle) * dist * 0.7 - size / 2,
              width: size,
              height: size,
              borderRadius: size,
              background: i % 2 ? '#ffc857' : ORANGE,
              opacity: interpolate(t, [0, 30], [1, 0], clamp),
            }}
          />
        );
      })}
    </>
  );
}

function Obstacles({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const from = SCENES.obstacles.from;
  const rows: [Icon, string][] = [
    [Wallet, 'Petit budget'],
    [MapTrifold, 'Où aller ?'],
    [UsersThree, 'Avec qui ?'],
  ];
  return (
    <Stage duration={duration}>
      {rows.map(([RowIcon, label], i) => {
        const at = ROWS[i]! - from;
        if (frame < at) return null;
        const pop = spring({
          frame: frame - at,
          fps: FPS,
          config: { damping: 12, stiffness: 220, mass: 0.6 },
        });
        return (
          <Card
            key={label}
            style={{
              top: 430 + i * 185,
              left: 60,
              right: 60,
              height: 150,
              padding: '0 30px',
              gap: 28,
              transform: `translateX(${interpolate(pop, [0, 1], [-700, 0])}px) rotate(${i % 2 ? 1.2 : -1.2}deg)`,
            }}
          >
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: 86,
                background: ORANGE,
                color: '#fff',
                fontFamily: FREDOKA,
                fontWeight: 700,
                fontSize: 54,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <span
              style={{ flex: 1, fontFamily: FREDOKA, fontWeight: 600, fontSize: 66, color: INK }}
            >
              {label}
            </span>
            <RowIcon size={96} weight="fill" color={INK} />
          </Card>
        );
      })}
    </Stage>
  );
}

function CouchScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const hours = ['15h', '18h', '22h'];
  const hour = hours[Math.min(2, Math.max(0, Math.floor((frame - 14) / 22)))]!;
  const hand = frame * 22;
  return (
    <Stage duration={duration}>
      <div style={{ position: 'absolute', top: 470, left: 120 }}>
        <Couch size={360} weight="fill" color="#c8bfb2" />
      </div>
      {/* Horloge qui file */}
      <div
        style={{
          position: 'absolute',
          top: 440,
          right: 110,
          width: 260,
          height: 260,
          borderRadius: 260,
          background: '#fff',
          border: `8px solid ${INK}`,
        }}
      >
        {[
          { len: 80, w: 12, rot: hand / 12 },
          { len: 105, w: 8, rot: hand },
        ].map((h, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 122 - h.w / 2,
              top: 122 - h.len,
              width: h.w,
              height: h.len,
              borderRadius: h.w,
              background: i ? ORANGE : INK,
              transformOrigin: '50% 100%',
              transform: `rotate(${h.rot}deg)`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 730,
          right: 110,
          width: 260,
          textAlign: 'center',
          fontFamily: FREDOKA,
          fontWeight: 700,
          fontSize: 80,
          color: '#fff',
        }}
      >
        {hour}
      </div>
      <Stamp at={ENCORE - SCENES.couch.from} top={860} color="#e5484d" rotate={5} size={100}>
        Encore.
      </Stamp>
    </Stage>
  );
}

function Activities({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const from = SCENES.activities.from;
  const gridAt = line('w9').from - from;
  // Avant la grille : le logo Lokky qui « pulse » comme un repère sur une carte.
  const logoPop = usePop(4, { damping: 10, stiffness: 200, mass: 0.6 });
  const logoOut = interpolate(frame, [gridAt - 8, gridAt], [1, 0], clamp);
  return (
    <Stage duration={duration}>
      {frame < gridAt && (
        <div
          style={{
            position: 'absolute',
            top: 470,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: logoOut,
          }}
        >
          {[0, 1, 2].map((i) => {
            const t = ((frame + i * 18) % 54) / 54;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 150 - 150 * (1 + t * 1.6),
                  width: 300 * (1 + t * 1.6),
                  height: 300 * (1 + t * 1.6),
                  borderRadius: 1000,
                  border: `6px solid ${ORANGE}`,
                  opacity: 1 - t,
                }}
              />
            );
          })}
          <Img
            src={staticFile('icon.webp')}
            style={{
              width: 300,
              height: 300,
              borderRadius: 70,
              border: `6px solid ${INK}`,
              boxShadow: `0 14px 0 ${INK}`,
              transform: `scale(${interpolate(logoPop, [0, 1], [0.3, 1])})`,
            }}
          />
        </div>
      )}
      {ACTIVITIES.map((a, i) => {
        const at = TILES[i]! - from;
        if (frame < at) return null;
        const pop = spring({
          frame: frame - at,
          fps: FPS,
          config: { damping: 10, stiffness: 260, mass: 0.5 },
        });
        const TileIcon = ICONS[a.icon];
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <div
            key={a.label}
            style={{
              position: 'absolute',
              left: 75 + col * 320,
              top: 410 + row * 196,
              width: 290,
              height: 172,
              borderRadius: 30,
              background: a.color,
              border: `5px solid ${INK}`,
              boxShadow: `0 9px 0 ${INK}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              opacity: interpolate(frame, [FREE - from, FREE - from + 6], [1, 0.35], clamp),
              transform: `scale(${interpolate(pop, [0, 1], [0.2, 1])}) rotate(${(i % 2 ? 2 : -2) * (1 - pop) * 4}deg)`,
            }}
          >
            <TileIcon size={78} weight="fill" color="#fff" />
            <span style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 46, color: '#fff' }}>
              {a.label}
            </span>
          </div>
        );
      })}
      <Stamp at={FREE - from} top={600} color={TEAL} rotate={-8} size={110}>
        Gratuit
      </Stamp>
      {frame >= FREE - from + 8 && (
        <div
          style={{
            position: 'absolute',
            top: 790,
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: interpolate(frame, [FREE - from + 8, FREE - from + 16], [0, 1], clamp),
          }}
        >
          <span
            style={{
              fontFamily: FREDOKA,
              fontWeight: 600,
              fontSize: 46,
              color: INK,
              background: '#ffc857',
              border: `5px solid ${INK}`,
              borderRadius: 22,
              padding: '6px 26px 10px',
            }}
          >
            ou chacun paie sa part
          </span>
        </div>
      )}
    </Stage>
  );
}

const JOINERS = [
  { initial: 'A', color: TEAL },
  { initial: 'K', color: '#8e5bd6' },
  { initial: 'M', color: '#2f80ed' },
  { initial: 'F', color: '#e5484d' },
];

function Create({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const from = SCENES.create.from;
  const card = usePop(CREATE - from, { damping: 11, stiffness: 220, mass: 0.6 });
  const joined = JOINS.filter((j) => frame >= j - from).length;
  return (
    <Stage duration={duration}>
      {frame >= CREATE - from && (
        <Card
          style={{
            top: 430,
            left: 90,
            right: 90,
            height: 300,
            padding: '0 36px',
            gap: 34,
            borderLeft: `26px solid ${ORANGE}`,
            transform: `translateY(${interpolate(card, [0, 1], [-260, 0])}px) rotate(${interpolate(card, [0, 1], [-10, -2])}deg)`,
            opacity: Math.min(1, card * 2),
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              background: '#7cb518',
              border: `5px solid ${INK}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TennisBall size={110} weight="fill" color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 64, color: INK }}>
              Tennis entre potes
            </span>
            <span style={{ fontFamily: DMSANS, fontWeight: 600, fontSize: 40, color: '#5b5560' }}>
              Samedi · 10h
            </span>
            <span
              style={{
                alignSelf: 'flex-start',
                fontFamily: FREDOKA,
                fontWeight: 600,
                fontSize: 34,
                color: '#fff',
                background: TEAL,
                borderRadius: 16,
                padding: '2px 18px 6px',
              }}
            >
              Gratuit
            </span>
          </div>
        </Card>
      )}
      {/* Ceux qui rejoignent */}
      <div
        style={{
          position: 'absolute',
          top: 790,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {JOINERS.map((j, i) => {
          const at = JOINS[i]! - from;
          if (frame < at) return null;
          const pop = spring({
            frame: frame - at,
            fps: FPS,
            config: { damping: 9, stiffness: 280, mass: 0.5 },
          });
          const plusY = interpolate(frame - at, [0, 24], [0, -110], { ...clamp, easing: easeOut });
          return (
            <div key={j.initial} style={{ position: 'relative' }}>
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 130,
                  background: j.color,
                  border: `6px solid ${INK}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FREDOKA,
                  fontWeight: 700,
                  fontSize: 64,
                  color: '#fff',
                  transform: `scale(${interpolate(pop, [0, 1], [0, 1])})`,
                }}
              >
                {j.initial}
              </div>
              <span
                style={{
                  position: 'absolute',
                  top: -20 + plusY,
                  left: 30,
                  fontFamily: FREDOKA,
                  fontWeight: 700,
                  fontSize: 52,
                  color: ORANGE,
                  opacity: interpolate(frame - at, [12, 24], [1, 0], clamp),
                }}
              >
                +1
              </span>
            </div>
          );
        })}
      </div>
      {joined > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 945,
            right: 90,
            fontFamily: FREDOKA,
            fontWeight: 700,
            fontSize: 46,
            color: INK,
          }}
        >
          {joined} {joined > 1 ? 'participants' : 'participant'}
        </div>
      )}
    </Stage>
  );
}

function Outro({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const logo = usePop(0, { damping: 9, stiffness: 220, mass: 0.7 });
  const name = usePop(8);
  const cta = usePop(20);
  return (
    <Stage duration={duration + 20}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${frame * 0.6}deg at 50% 33%, rgba(255,107,61,0.12) 0deg 10deg, transparent 10deg 24deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 430,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('icon.webp')}
          style={{
            width: 270,
            height: 270,
            borderRadius: 64,
            border: `6px solid ${INK}`,
            boxShadow: `0 14px 0 ${INK}`,
            transform: `scale(${interpolate(logo, [0, 1], [2.6, 1])}) rotate(${(1 - logo) * -12}deg)`,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 720,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FREDOKA,
          fontWeight: 700,
          fontSize: 150,
          color: INK,
          letterSpacing: -3,
          opacity: name,
          transform: `translateY(${(1 - name) * 50}px)`,
        }}
      >
        Lokky
      </div>
      <div
        style={{
          position: 'absolute',
          top: 905,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: cta,
          transform: `scale(${interpolate(cta, [0, 1], [0.8, 1])})`,
        }}
      >
        <span
          style={{
            fontFamily: FREDOKA,
            fontWeight: 700,
            fontSize: 44,
            color: '#fff',
            background: INK,
            borderRadius: 50,
            padding: '18px 44px 22px',
          }}
        >
          Dispo sur iOS & Android
        </span>
      </div>
      <Sparks at={2} x={540} y={515} />
    </Stage>
  );
}

// ——— Composition ———

export function LokkyWeekend() {
  const scene = (key: keyof typeof SCENES, node: (duration: number) => ReactNode) => (
    <Sequence from={SCENES[key].from} durationInFrames={SCENES[key].duration}>
      {node(SCENES[key].duration)}
    </Sequence>
  );
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
      <Paper />
      {scene('routine', (d) => (
        <Routine duration={d} />
      ))}
      {scene('weekend', (d) => (
        <Weekend duration={d} />
      ))}
      {scene('obstacles', (d) => (
        <Obstacles duration={d} />
      ))}
      {scene('couch', (d) => (
        <CouchScene duration={d} />
      ))}
      {scene('activities', (d) => (
        <Activities duration={d} />
      ))}
      {scene('create', (d) => (
        <Create duration={d} />
      ))}
      {scene('outro', (d) => (
        <Outro duration={d} />
      ))}
      <Avatar lines={VOICE} />
      <Title lines={VOICE} />
      <Fade from={1} to={0} start={0} end={6} />

      {CUES.map((cue, i) => (
        <Sequence key={i} from={cue.at} layout="none">
          <Audio src={staticFile(`sfx/${cue.sfx}.wav`)} volume={cue.volume ?? 1} />
        </Sequence>
      ))}
      {VOICE.map((l) => {
        const src = voiceSrc(l.id);
        return src ? (
          <Sequence key={l.id} from={l.from} layout="none">
            <Audio src={staticFile(src)} />
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
}
