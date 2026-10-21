import { Composition } from 'remotion';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './script';
import { LokkyCorniche } from './Video';
import { TOTAL_FRAMES as WEEKEND_FRAMES } from './weekend/script';
import { LokkyWeekend } from './weekend/Weekend';

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="LokkyCorniche"
        component={LokkyCorniche}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ look: 'pixel' as const }}
      />
      <Composition
        id="LokkyCornichePeint"
        component={LokkyCorniche}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ look: 'paint' as const }}
      />
      <Composition
        id="LokkyWeekend"
        component={LokkyWeekend}
        durationInFrames={WEEKEND_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
}
