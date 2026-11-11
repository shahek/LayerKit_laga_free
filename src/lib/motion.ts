import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Shared in/out timing used by every template. */
export function useStage() {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const unit = Math.min(width, height) / 1080; // 1 at 1080p, scales for every format
  const vertical = height > width;
  const outLen = Math.min(18, Math.floor(durationInFrames / 4));

  /** Spring 0→1 starting at `delay` frames. */
  const enter = (delay = 0, damping = 200, len = 26) =>
    spring({ frame: frame - delay, fps, config: { damping }, durationInFrames: len });

  /** 0 until the out-animation starts, then →1 at the last frame. */
  const exit = interpolate(frame, [durationInFrames - outLen, durationInFrames - 1], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  return { frame, fps, width, height, unit, vertical, enter, exit, durationInFrames };
}

export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
export { clamp };
