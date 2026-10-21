import { AbsoluteFill, Audio, getStaticFiles, interpolate, Sequence, staticFile } from 'remotion';
import { PaintBedroom } from './paint/PaintBedroom';
import { PaintSunset } from './paint/PaintSunset';
import { PaintWalk } from './paint/PaintWalk';
import { Bedroom } from './scenes/Bedroom';
import { Notif } from './scenes/Notif';
import { Outro } from './scenes/Outro';
import { Scroll } from './scenes/Scroll';
import { Sunset } from './scenes/Sunset';
import { Walk } from './scenes/Walk';
import { BEDS, CUES, MOMENTS, SCENES, VOICE } from './script';
import { Captions } from './ui/Captions';
import { Fade, Finish } from './ui/fx';

// Voix off : chaque réplique présente dans public/vo/ est jouée à son minutage.
const voiceFiles = new Set(getStaticFiles().map((f) => f.name));
const voiceSrc = (id: string) =>
  ['mp3', 'wav'].map((ext) => `vo/${id}.${ext}`).find((name) => voiceFiles.has(name));

// Ambiance en boucle avec fondus d'entrée et de sortie.
function Bed({ sfx, from, to, volume }: { sfx: string; from: number; to: number; volume: number }) {
  const length = to - from;
  return (
    <Sequence from={from} durationInFrames={length}>
      <Audio
        src={staticFile(`sfx/${sfx}.wav`)}
        loop
        volume={(f) =>
          interpolate(f, [0, 12, length - 12, length], [0, volume, volume, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
    </Sequence>
  );
}

export type Look = 'pixel' | 'paint';

// Même script, mêmes sons, même minutage : seul le style des images change.
export function LokkyCorniche({ look }: { look: Look }) {
  const local = (scene: keyof typeof SCENES, at: number) => at - SCENES[scene].from;
  const paint = look === 'paint';

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence from={SCENES.bedroom.from} durationInFrames={SCENES.bedroom.duration}>
        {paint ? (
          <PaintBedroom impactAt={MOMENTS.withWhom} />
        ) : (
          <Bedroom impactAt={MOMENTS.withWhom} />
        )}
      </Sequence>
      <Sequence from={SCENES.scroll.from} durationInFrames={SCENES.scroll.duration}>
        <Scroll
          flips={MOMENTS.flips.map((f) => local('scroll', f))}
          duration={SCENES.scroll.duration}
          style={look}
        />
      </Sequence>
      <Sequence from={SCENES.notif.from} durationInFrames={SCENES.notif.duration}>
        <Notif
          notifAt={local('notif', MOMENTS.notif)}
          openAt={local('notif', MOMENTS.open)}
          tapAt={local('notif', MOMENTS.tap)}
          duration={SCENES.notif.duration}
          look={look}
        />
      </Sequence>
      <Sequence from={SCENES.walk.from} durationInFrames={SCENES.walk.duration}>
        {paint ? (
          <PaintWalk duration={SCENES.walk.duration} stampAt={local('walk', MOMENTS.noAwkward)} />
        ) : (
          <Walk duration={SCENES.walk.duration} stampAt={local('walk', MOMENTS.noAwkward)} />
        )}
      </Sequence>
      <Sequence from={SCENES.sunset.from} durationInFrames={SCENES.sunset.duration}>
        {paint ? (
          <PaintSunset
            first={local('sunset', MOMENTS.strangers)}
            lapseFrom={local('sunset', MOMENTS.lapseFrom)}
            lapseTo={local('sunset', MOMENTS.friends)}
            duration={SCENES.sunset.duration}
          />
        ) : (
          <Sunset
            first={local('sunset', MOMENTS.strangers)}
            lapseFrom={local('sunset', MOMENTS.lapseFrom)}
            lapseTo={local('sunset', MOMENTS.friends)}
            duration={SCENES.sunset.duration}
          />
        )}
      </Sequence>
      <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.duration}>
        <Outro look={look} />
      </Sequence>

      <Finish />
      <Fade from={1} to={0} start={0} end={8} />
      <Captions lines={VOICE} />

      {/* Son */}
      {BEDS.map(([sfx, from, to, volume]) => (
        <Bed key={`${sfx}${from}`} sfx={sfx} from={from} to={to} volume={volume} />
      ))}
      {CUES.map((cue, i) => (
        <Sequence key={i} from={cue.at} layout="none">
          <Audio src={staticFile(`sfx/${cue.sfx}.wav`)} volume={cue.volume ?? 1} />
        </Sequence>
      ))}
      {VOICE.map((line) => {
        const src = voiceSrc(line.id);
        return src ? (
          <Sequence key={line.id} from={line.from} layout="none">
            <Audio src={staticFile(src)} />
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
}
