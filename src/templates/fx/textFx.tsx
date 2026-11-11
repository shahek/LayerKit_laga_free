import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/** Context an effect can read while styling a unit (char / word / line). */
export type FxCtx = { u: number; frame: number; accent: string; primary: string; text: string };

export type TextFx = {
  unit: 'char' | 'word' | 'line';
  /** frames between units */
  stagger: number;
  /** spring length in frames */
  len?: number;
  /** lower = bouncier */
  damping?: number;
  /** clip each unit to its own box (for rise / fall reveals) */
  mask?: boolean;
  style: (t: number, i: number, c: FxCtx) => CSSProperties;
  /** replace the visible character (scramble, typewriter cursor…) */
  glyph?: (t: number, i: number, ch: string, c: FxCtx) => string;
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const L = (t: number, a: number, b: number) => a + (b - a) * t;
const pos = (t: number) => Math.max(0, t);
/** #rrggbb + alpha → rgba() */
export const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=?';

/* ──────────────────────────────  Effect library  ────────────────────────────── */

export const FX = {
  rise: { unit: 'word', stagger: 3, mask: true, style: (t) => ({ transform: `translateY(${L(t, 110, 0)}%)` }) },
  fall: { unit: 'word', stagger: 3, mask: true, style: (t) => ({ transform: `translateY(${L(t, -110, 0)}%)` }) },
  charRise: { unit: 'char', stagger: 1.2, mask: true, style: (t) => ({ transform: `translateY(${L(t, 115, 0)}%)` }) },
  blurIn: {
    unit: 'word',
    stagger: 3,
    len: 28,
    style: (t, _i, c) => ({ opacity: pos(t), filter: `blur(${L(t, 18, 0) * c.u}px)`, transform: `translateY(${L(t, 20, 0) * c.u}px)` }),
  },
  charBlur: {
    unit: 'char',
    stagger: 1,
    len: 24,
    style: (t, _i, c) => ({ opacity: pos(t), filter: `blur(${L(t, 14, 0) * c.u}px)`, transform: `scale(${L(t, 1.5, 1)})` }),
  },
  pop: { unit: 'char', stagger: 1.4, damping: 9, len: 30, style: (t) => ({ opacity: Math.min(1, pos(t) * 3), transform: `scale(${pos(t)})` }) },
  typewriter: {
    unit: 'char',
    stagger: 1.6,
    len: 2,
    style: (t) => ({ opacity: t > 0.5 ? 1 : 0 }),
  },
  wave: {
    unit: 'char',
    stagger: 1.5,
    len: 26,
    damping: 12,
    style: (t, i, c) => ({
      opacity: Math.min(1, pos(t) * 2),
      transform: `translateY(${L(t, 80, 0) * c.u + Math.sin(c.frame / 7 + i * 0.55) * 7 * c.u * Math.min(1, pos(t))}px)`,
    }),
  },
  flip: {
    unit: 'char',
    stagger: 1.6,
    len: 26,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 2), transform: `perspective(600px) rotateX(${L(t, -95, 0)}deg)`, transformOrigin: '50% 100%' }),
  },
  slideIn: {
    unit: 'word',
    stagger: 3,
    style: (t, _i, c) => ({ opacity: pos(t), transform: `translateX(${L(t, -70, 0) * c.u}px)` }),
  },
  tracking: {
    unit: 'line',
    stagger: 0,
    len: 40,
    style: (t, _i, c) => ({ opacity: pos(t), letterSpacing: `${L(t, 0.55, 0.02)}em`, filter: `blur(${L(t, 8, 0) * c.u}px)` }),
  },
  scramble: {
    unit: 'char',
    stagger: 1.4,
    len: 14,
    style: (t) => ({ opacity: t > 0.02 ? 1 : 0 }),
    glyph: (t, i, ch, c) => (t > 0.92 || ch === ' ' ? ch : GLYPHS[Math.floor(random(`s${i}-${Math.floor(c.frame / 2)}`) * GLYPHS.length)]),
  },
  glitch: {
    unit: 'line',
    stagger: 0,
    len: 22,
    style: (t, _i, c) => {
      const k = 1 - Math.min(1, pos(t));
      const j = (random(`g${Math.floor(c.frame / 2)}`) - 0.5) * 40 * k * c.u;
      return {
        opacity: k > 0.85 ? (random(`o${c.frame}`) > 0.5 ? 1 : 0.2) : 1,
        transform: `translateX(${j}px) skewX(${j * 0.3}deg)`,
        textShadow: k > 0.01 ? `${-10 * k * c.u}px 0 #ff2bd6, ${10 * k * c.u}px 0 #00e5ff` : undefined,
      };
    },
  },
  bounce: { unit: 'char', stagger: 1.6, damping: 7, len: 36, style: (t) => ({ opacity: t > 0 ? 1 : 0, transform: `translateY(${L(t, -160, 0)}%)` }) },
  spin: {
    unit: 'char',
    stagger: 1.4,
    damping: 14,
    len: 30,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 2), transform: `rotate(${L(t, -200, 0)}deg) scale(${pos(t)})` }),
  },
  stretch: {
    unit: 'char',
    stagger: 1.2,
    damping: 12,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 2), transform: `scale(${L(t, 0.2, 1)}, ${L(t, 3.5, 1)})`, transformOrigin: '50% 100%' }),
  },
  zoom: {
    unit: 'word',
    stagger: 4,
    len: 26,
    style: (t, _i, c) => ({ opacity: pos(t), transform: `scale(${L(t, 3, 1)})`, filter: `blur(${L(t, 24, 0) * c.u}px)` }),
  },
  skew: {
    unit: 'word',
    stagger: 3,
    style: (t, _i, c) => ({ opacity: pos(t), transform: `translateX(${L(t, 120, 0) * c.u}px) skewX(${L(t, -35, 0)}deg)` }),
  },
  neon: {
    unit: 'line',
    stagger: 0,
    len: 30,
    style: (t, _i, c) => {
      const on = t > 0.95 || random(`n${Math.floor(c.frame / 2)}`) < pos(t) * 0.8;
      return {
        opacity: on ? 1 : 0.15,
        textShadow: on ? `0 0 ${10 * c.u}px ${c.accent}, 0 0 ${28 * c.u}px ${c.accent}, 0 0 ${56 * c.u}px ${c.accent}` : 'none',
      };
    },
  },
  wipe: { unit: 'line', stagger: 0, len: 28, style: (t) => ({ clipPath: `inset(-20% ${L(Math.min(1, pos(t)), 100, 0)}% -20% 0)` }) },
  elastic: {
    unit: 'word',
    stagger: 4,
    damping: 7,
    len: 40,
    style: (t, _i, c) => ({ opacity: t > 0 ? 1 : 0, transform: `translateX(${L(t, -260, 0) * c.u}px)` }),
  },
  shuffle: {
    unit: 'char',
    stagger: 0.8,
    len: 30,
    style: (t, i) => ({
      opacity: pos(t),
      transform: `translateY(${(random(`y${i}`) - 0.5) * 300 * (1 - t)}%) rotate(${(random(`r${i}`) - 0.5) * 90 * (1 - t)}deg)`,
    }),
  },
  door: {
    unit: 'word',
    stagger: 4,
    len: 30,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 2), transform: `perspective(800px) rotateY(${L(t, 90, 0)}deg)`, transformOrigin: '0% 50%' }),
  },
  outlineFill: {
    unit: 'line',
    stagger: 0,
    len: 45,
    style: (t, _i, c) => {
      const fill = interpolate(t, [0.45, 1], [0, 1], clamp);
      return {
        opacity: Math.min(1, pos(t) * 3),
        WebkitTextStroke: `${2 * c.u}px ${c.text}`,
        color: hexA(c.text, fill),
        transform: `translateY(${L(Math.min(1, pos(t) * 1.6), 30, 0) * c.u}px)`,
      };
    },
  },
  swing: {
    unit: 'word',
    stagger: 4,
    damping: 8,
    len: 40,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 3), transform: `rotate(${L(t, -35, 0)}deg)`, transformOrigin: '0% 0%' }),
  },
  squeeze: {
    unit: 'line',
    stagger: 0,
    damping: 11,
    len: 30,
    style: (t) => ({ opacity: Math.min(1, pos(t) * 2), transform: `scaleX(${pos(t)})`, transformOrigin: '50% 50%' }),
  },
} satisfies Record<string, TextFx>;

export type FxName = keyof typeof FX;

/* ──────────────────────────────  Renderer  ────────────────────────────── */

export const FxText = ({
  text,
  fx: fxName,
  delay = 0,
  style,
  c,
  wordStyle,
  wordBehind,
}: {
  text: string;
  fx: FxName;
  delay?: number;
  style?: CSSProperties;
  c: Omit<FxCtx, 'frame'>;
  /** extra style per word (for two-tone / highlight) */
  wordStyle?: (wordIndex: number, wordCount: number) => CSSProperties | undefined;
  /** element drawn behind a word (marker highlight) */
  wordBehind?: (wordIndex: number) => ReactNode;
}) => {
  const fx: TextFx = FX[fxName];
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ctx: FxCtx = { ...c, frame };

  const words = text.split(/\s+/).filter(Boolean);
  const unitCount = fx.unit === 'line' ? 1 : fx.unit === 'word' ? words.length : words.join('').length;
  const outLen = 12;
  const exStag = unitCount > 1 ? Math.min(fx.stagger * 0.5, 10 / unitCount) : 0;
  const exitStart = durationInFrames - outLen - exStag * (unitCount - 1) - 3;

  const tFor = (i: number) => {
    const s = spring({
      frame: frame - delay - i * fx.stagger,
      fps,
      config: { damping: fx.damping ?? 200 },
      durationInFrames: fx.len ?? 22,
    });
    const e = interpolate(frame, [exitStart + i * exStag, exitStart + i * exStag + outLen], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    });
    return e > 0 ? Math.min(s, 1) * (1 - e) : s;
  };

  const maskWrap = (key: string | number, child: ReactNode) =>
    fx.mask ? (
      <span key={key} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.06em 0.05em 0.14em', margin: '-0.06em -0.05em -0.14em' }}>
        {child}
      </span>
    ) : (
      <span key={key} style={{ display: 'inline-block' }}>
        {child}
      </span>
    );

  if (fx.unit === 'line') {
    const t = tFor(0);
    return (
      <span style={{ display: 'inline-block', ...style }}>
        {maskWrap(
          0,
          <span style={{ display: 'inline-block', ...fx.style(t, 0, ctx) }}>
            {wordStyle || wordBehind
              ? words.map((w, wi) => (
                  <span key={wi}>
                    <span style={{ position: 'relative', display: 'inline-block', ...wordStyle?.(wi, words.length) }}>
                      {wordBehind?.(wi)}
                      <span style={{ position: 'relative' }}>{w}</span>
                    </span>
                    {wi < words.length - 1 ? ' ' : ''}
                  </span>
                ))
              : text}
          </span>,
        )}
      </span>
    );
  }

  let ci = 0;
  return (
    <span style={style}>
      {words.map((w, wi) => {
        const inner =
          fx.unit === 'word'
            ? maskWrap(wi, <span style={{ display: 'inline-block', ...fx.style(tFor(wi), wi, ctx) }}>{w}</span>)
            : [...w].map((ch) => {
                const i = ci++;
                const t = tFor(i);
                return maskWrap(
                  i,
                  <span style={{ display: 'inline-block', ...fx.style(t, i, ctx) }}>{fx.glyph ? fx.glyph(t, i, ch, ctx) : ch}</span>,
                );
              });
        return (
          <span key={wi}>
            <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap', ...wordStyle?.(wi, words.length) }}>
              {wordBehind?.(wi)}
              <span style={{ position: 'relative' }}>{inner}</span>
            </span>
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
};
