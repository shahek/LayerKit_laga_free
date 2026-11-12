import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import type { TransitionId } from './types';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ─────────────  Clip effects (loop while the clip is on screen)  ───────────── */

type FxOut = { transform?: string; filter?: string; opacity?: number };
type FxArgs = { f: number; d: number; u: number; accent: string };

export const CLIP_EFFECTS: { id: string; name: string; icon: string; fn: (a: FxArgs) => FxOut }[] = [
  { id: 'shake', name: 'Shake', icon: '〰', fn: ({ f, u }) => ({ transform: `translate(${(random(`sx${f}`) - 0.5) * 18 * u}px, ${(random(`sy${f}`) - 0.5) * 18 * u}px)` }) },
  { id: 'pulse', name: 'Pulse', icon: '◉', fn: ({ f }) => ({ transform: `scale(${1 + Math.sin(f / 6) * 0.05})` }) },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    icon: '♥',
    fn: ({ f }) => {
      const p = f % 30;
      const s = p < 4 ? 1 + p * 0.025 : p < 8 ? 1.1 - (p - 4) * 0.025 : p < 11 ? 1 + (p - 8) * 0.02 : p < 14 ? 1.06 - (p - 11) * 0.02 : 1;
      return { transform: `scale(${s})` };
    },
  },
  { id: 'float', name: 'Float', icon: '☁', fn: ({ f, u }) => ({ transform: `translateY(${Math.sin(f / 14) * 18 * u}px)` }) },
  { id: 'swing', name: 'Swing', icon: '⤾', fn: ({ f }) => ({ transform: `rotate(${Math.sin(f / 10) * 5}deg)` }) },
  { id: 'spin', name: 'Spin', icon: '↻', fn: ({ f }) => ({ transform: `rotate(${f * 4}deg)` }) },
  { id: 'wiggle', name: 'Wiggle', icon: '≈', fn: ({ f }) => ({ transform: `rotate(${(random(`w${Math.floor(f / 3)}`) - 0.5) * 8}deg)` }) },
  { id: 'zoom-in', name: 'Ken Burns In', icon: '⊕', fn: ({ f, d }) => ({ transform: `scale(${interpolate(f, [0, d], [1, 1.2], clamp)})` }) },
  { id: 'zoom-out', name: 'Ken Burns Out', icon: '⊖', fn: ({ f, d }) => ({ transform: `scale(${interpolate(f, [0, d], [1.2, 1], clamp)})` }) },
  {
    id: 'glitch',
    name: 'Glitch',
    icon: '▚',
    fn: ({ f, u }) => {
      const on = random(`gl${Math.floor(f / 3)}`) > 0.72;
      if (!on) return {};
      const j = (random(`gj${f}`) - 0.5) * 40 * u;
      return { transform: `translateX(${j}px) skewX(${j * 0.25}deg)`, filter: `hue-rotate(${random(`gh${f}`) * 180}deg) saturate(2)` };
    },
  },
  { id: 'flicker', name: 'Flicker', icon: '✦', fn: ({ f }) => ({ opacity: random(`fl${Math.floor(f / 2)}`) > 0.18 ? 1 : 0.35 }) },
  { id: 'strobe', name: 'Strobe', icon: '⚡', fn: ({ f }) => ({ filter: `brightness(${Math.floor(f / 4) % 2 ? 1.6 : 1})` }) },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', fn: ({ f }) => ({ filter: `hue-rotate(${(f * 6) % 360}deg) saturate(1.4)` }) },
  { id: 'blur-pulse', name: 'Blur Pulse', icon: '◌', fn: ({ f, u }) => ({ filter: `blur(${(Math.sin(f / 8) * 0.5 + 0.5) * 6 * u}px)` }) },
  { id: 'glow', name: 'Glow', icon: '☀', fn: ({ u, accent }) => ({ filter: `drop-shadow(0 0 ${14 * u}px ${accent}) drop-shadow(0 0 ${30 * u}px ${accent})` }) },
  { id: 'shadow', name: 'Drop Shadow', icon: '▣', fn: ({ u }) => ({ filter: `drop-shadow(0 ${18 * u}px ${30 * u}px rgba(0,0,0,0.55))` }) },
];

export function clipEffectStyle(ids: string[], a: FxArgs): CSSProperties {
  const t: string[] = [];
  const fl: string[] = [];
  let op = 1;
  for (const id of ids) {
    const fx = CLIP_EFFECTS.find((e) => e.id === id);
    if (!fx) continue;
    const o = fx.fn(a);
    if (o.transform) t.push(o.transform);
    if (o.filter) fl.push(o.filter);
    if (o.opacity !== undefined) op *= o.opacity;
  }
  return { transform: t.join(' ') || undefined, filter: fl.join(' ') || undefined, opacity: op };
}

/* ─────────────  In / out animations  ───────────── */

export const TRANSITIONS: { id: TransitionId; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide-left', name: 'Slide ←' },
  { id: 'slide-right', name: 'Slide →' },
  { id: 'slide-up', name: 'Slide ↑' },
  { id: 'slide-down', name: 'Slide ↓' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'pop', name: 'Pop' },
  { id: 'blur', name: 'Blur' },
  { id: 'spin', name: 'Spin' },
  { id: 'wipe', name: 'Wipe' },
];

/** p: 0 = hidden, 1 = fully shown. `dir` = 1 entering, -1 leaving (mirrors slides). */
export function transitionStyle(id: TransitionId, p: number, dir: 1 | -1, u: number): CSSProperties {
  if (id === 'none' || p >= 1) return {};
  const q = 1 - p;
  switch (id) {
    case 'fade':
      return { opacity: p };
    case 'slide-left':
      return { transform: `translateX(${q * 60 * dir}%)`, opacity: Math.min(1, p * 2) };
    case 'slide-right':
      return { transform: `translateX(${-q * 60 * dir}%)`, opacity: Math.min(1, p * 2) };
    case 'slide-up':
      return { transform: `translateY(${q * 50 * dir}%)`, opacity: Math.min(1, p * 2) };
    case 'slide-down':
      return { transform: `translateY(${-q * 50 * dir}%)`, opacity: Math.min(1, p * 2) };
    case 'zoom':
      return { transform: `scale(${0.4 + 0.6 * p})`, opacity: p };
    case 'pop': {
      const s = p < 0.7 ? (p / 0.7) * 1.12 : 1.12 - ((p - 0.7) / 0.3) * 0.12;
      return { transform: `scale(${s})`, opacity: Math.min(1, p * 3) };
    }
    case 'blur':
      return { filter: `blur(${q * 30 * u}px)`, opacity: p };
    case 'spin':
      return { transform: `rotate(${q * 180 * dir}deg) scale(${p})`, opacity: p };
    case 'wipe':
      return { clipPath: `inset(0 ${q * 100}% 0 0)` };
  }
  return {};
}

export function useTransition(inId: TransitionId, outId: TransitionId, len: number, u: number): CSSProperties {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = Math.max(1, Math.min(len, Math.floor(durationInFrames / 2)));
  const pin = interpolate(frame, [0, L], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pout = interpolate(frame, [durationInFrames - L, durationInFrames], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (frame < L) return transitionStyle(inId, pin, 1, u);
  if (frame >= durationInFrames - L) return transitionStyle(outId, pout, -1, u);
  return {};
}

/* ─────────────  Global overlays (sit on top of everything)  ───────────── */

export const OVERLAYS: { id: string; name: string }[] = [
  { id: 'vignette', name: 'Vignette' },
  { id: 'grain', name: 'Film Grain' },
  { id: 'letterbox', name: 'Cinema Bars' },
  { id: 'light-leak', name: 'Light Leak' },
  { id: 'scanlines', name: 'Scanlines' },
  { id: 'frame', name: 'Accent Frame' },
];

const Grain = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(c.width, c.height);
    let s = (frame + 1) * 9301;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const v = s & 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 38;
    }
    ctx.putImageData(img, 0, 0);
  }, [frame]);
  return <canvas ref={ref} width={480} height={270} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
};

export const Overlays = ({ ids, accent }: { ids: string[]; accent: string }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {ids.includes('light-leak') && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 50% at ${30 + Math.sin(frame / 40) * 25}% ${30 + Math.cos(frame / 55) * 20}%, rgba(255,140,60,0.45), transparent 70%), radial-gradient(50% 40% at ${80 + Math.cos(frame / 35) * 15}% 75%, rgba(255,60,120,0.3), transparent 70%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {ids.includes('scanlines') && (
        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) ${2 * u}px, transparent ${2 * u}px, transparent ${5 * u}px)` }} />
      )}
      {ids.includes('grain') && <Grain />}
      {ids.includes('vignette') && <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />}
      {ids.includes('frame') && <AbsoluteFill style={{ border: `${10 * u}px solid ${accent}`, margin: 28 * u, borderRadius: 18 * u }} />}
      {ids.includes('letterbox') && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height * 0.11, background: '#000' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.11, background: '#000' }} />
        </>
      )}
    </AbsoluteFill>
  );
};
