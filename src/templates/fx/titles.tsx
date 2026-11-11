import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { fontStack, useCustomFonts } from '../../lib/fonts';
import { lerp, useStage } from '../../lib/motion';
import type { Brand, CompProps, Field, TemplateDef, Values } from '../../lib/types';
import { FxText, type FxName } from './textFx';

type LayoutId = 'center' | 'kicker-left' | 'block' | 'two-tone' | 'framed' | 'kicker-lines' | 'highlight' | 'echo' | 'giant' | 'underline';

type TitlePreset = {
  id: string;
  name: string;
  description: string;
  layout: LayoutId;
  fx: FxName;
  subFx?: FxName;
  uppercase?: boolean;
  title?: string;
};

type Ctx = {
  u: number;
  brand: Brand;
  values: Values;
  title: (extra?: Partial<Parameters<typeof FxText>[0]>) => ReactNode;
  sub: ReactNode;
  hasSub: boolean;
  size: number;
  enter: (d?: number, damping?: number, len?: number) => number;
  out: number;
  align: 'left' | 'center';
  words: number;
  hi: number;
};

const stack = (align: Ctx['align'], gap: number): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: align === 'left' ? 'flex-start' : 'center',
  textAlign: align,
  gap,
});

const LAYOUTS: Record<LayoutId, (c: Ctx) => ReactNode> = {
  center: ({ title, sub, hasSub, align, size }) => (
    <div style={stack(align, size * 0.28)}>
      {title()}
      {hasSub && sub}
    </div>
  ),
  'kicker-left': ({ u, brand, title, sub, hasSub, enter, out, size }) => {
    const b = enter(0) * (1 - out);
    return (
      <div style={stack('left', size * 0.2)}>
        {hasSub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 * u }}>
            <div style={{ width: 54 * u, height: 5 * u, background: brand.accent, transform: `scaleX(${b})`, transformOrigin: 'left' }} />
            {sub}
          </div>
        )}
        {title({ style: { textAlign: 'left' } })}
      </div>
    );
  },
  block: ({ u, brand, title, sub, hasSub, enter, out, align, size }) => {
    const b = enter(0, 200, 28) * (1 - out);
    return (
      <div style={stack(align, size * 0.25)}>
        <div style={{ position: 'relative', padding: `${size * 0.12}px ${size * 0.3}px ${size * 0.2}px` }}>
          <div style={{ position: 'absolute', inset: 0, background: brand.primary, transform: `scaleX(${b})`, transformOrigin: 'left', borderRadius: 8 * u }} />
          <div style={{ position: 'relative' }}>{title({ style: { textShadow: 'none' } })}</div>
        </div>
        {hasSub && sub}
      </div>
    );
  },
  'two-tone': ({ brand, title, sub, hasSub, align, size, words }) => (
    <div style={stack(align, size * 0.28)}>
      {title({ wordStyle: (i) => (i >= Math.ceil(words / 2) ? { color: brand.accent } : undefined) })}
      {hasSub && sub}
    </div>
  ),
  framed: ({ u, brand, title, sub, hasSub, enter, out, align, size }) => {
    const a = enter(0, 200, 34) * (1 - out);
    const b = enter(10, 200, 34) * (1 - out);
    const border = `${5 * u}px solid ${brand.accent}`;
    return (
      <div style={{ position: 'relative', padding: `${size * 0.35}px ${size * 0.5}px`, ...stack(align, size * 0.25) }}>
        <div style={{ position: 'absolute', inset: 0, border, clipPath: `inset(0 ${lerp(a, 100, 0)}% ${lerp(b, 100, 0)}% 0)` }} />
        <div style={{ position: 'absolute', inset: 0, border, clipPath: `inset(${lerp(b, 100, 0)}% 0 0 ${lerp(a, 100, 0)}%)` }} />
        {title()}
        {hasSub && sub}
      </div>
    );
  },
  'kicker-lines': ({ u, brand, title, sub, hasSub, enter, out, size }) => {
    const l = enter(4) * (1 - out);
    const line = (origin: string) => <div style={{ width: 120 * u, height: 3 * u, background: brand.accent, transform: `scaleX(${l})`, transformOrigin: origin }} />;
    return (
      <div style={stack('center', size * 0.22)}>
        {hasSub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 * u }}>
            {line('right')}
            {sub}
            {line('left')}
          </div>
        )}
        {title()}
      </div>
    );
  },
  highlight: ({ u, brand, title, sub, hasSub, enter, out, align, size, hi }) => {
    const m = enter(18, 200, 22) * (1 - out);
    return (
      <div style={stack(align, size * 0.28)}>
        {title({
          wordStyle: (i) => (i === hi ? { color: brand.surface, textShadow: 'none' } : undefined),
          wordBehind: (i) =>
            i === hi ? (
              <span style={{ position: 'absolute', left: -0.08 * size, right: -0.08 * size, top: size * 0.08, bottom: -size * 0.02, background: brand.accent, borderRadius: 10 * u, transform: `scaleX(${m})`, transformOrigin: 'left' }} />
            ) : null,
        })}
        {hasSub && sub}
      </div>
    );
  },
  echo: ({ u, brand, title, sub, hasSub, enter, out, align, size }) => {
    const layers = [3, 2, 1];
    return (
      <div style={stack(align, size * 0.28)}>
        <div style={{ position: 'relative' }}>
          {layers.map((k) => {
            const t = enter(10 + k * 4, 200, 24) * (1 - out);
            return (
              <div key={k} style={{ position: 'absolute', inset: 0, transform: `translateY(${-k * size * 0.92 * t}px)`, opacity: t * (0.75 - k * 0.2) }}>
                {title({ fx: 'rise', delay: 0, style: { color: 'transparent', WebkitTextStroke: `${2 * u}px ${brand.accent}`, textShadow: 'none' } })}
              </div>
            );
          })}
          <div style={{ position: 'relative' }}>{title()}</div>
        </div>
        {hasSub && sub}
      </div>
    );
  },
  giant: ({ u, brand, title, sub, hasSub, enter, out, align, size }) => {
    const p = enter(16, 12) * (1 - out);
    return (
      <div style={stack(align, size * 0.15)}>
        {title({ style: { fontSize: size * 1.55, lineHeight: 0.92, letterSpacing: '-0.035em' } })}
        {hasSub && (
          <div style={{ background: brand.accent, padding: `${8 * u}px ${24 * u}px`, borderRadius: 999, transform: `scale(${Math.max(0, p)})` }}>
            <div style={{ color: brand.surface }}>{sub}</div>
          </div>
        )}
      </div>
    );
  },
  underline: ({ brand, title, sub, hasSub, enter, out, align, size }) => {
    const l = enter(14, 200, 30) * (1 - out);
    return (
      <div style={stack(align, size * 0.22)}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'center', gap: size * 0.12 }}>
          {title()}
          <div style={{ height: size * 0.09, width: '100%', background: brand.accent, borderRadius: 99, transform: `scaleX(${l})`, transformOrigin: align === 'left' ? 'left' : 'center' }} />
        </div>
        {hasSub && sub}
      </div>
    );
  },
};

function makeTitle(p: TitlePreset): TemplateDef {
  const Comp: React.FC<CompProps> = ({ values, brand, fonts }) => {
    useCustomFonts(fonts);
    const st = useStage();
    const u = st.unit;
    const size = Number(values.size ?? 130) * u;
    const align = (p.layout === 'kicker-left' ? 'left' : p.layout === 'kicker-lines' ? 'center' : String(values.align ?? 'center')) as Ctx['align'];
    const fxc = { u, accent: brand.accent, primary: brand.primary, text: brand.text };
    const titleStr = String(values.title ?? '');
    const subStr = String(values.subtitle ?? '');
    const upper = Boolean(values.uppercase);
    const words = titleStr.split(/\s+/).filter(Boolean).length;

    const baseTitle: CSSProperties = {
      fontFamily: fontStack(brand.headingFont),
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.02,
      letterSpacing: '-0.02em',
      color: brand.text,
      textTransform: upper ? 'uppercase' : 'none',
      textShadow: `0 ${4 * u}px ${30 * u}px rgba(0,0,0,.35)`,
      maxWidth: st.width * 0.86,
      textAlign: align,
    };

    const title = (extra: Partial<Parameters<typeof FxText>[0]> = {}) => (
      <FxText text={titleStr} fx={p.fx} c={fxc} delay={2} {...extra} style={{ ...baseTitle, ...(extra.style ?? {}) }} />
    );

    const sub = (
      <FxText
        text={subStr}
        fx={p.subFx ?? 'blurIn'}
        c={fxc}
        delay={14}
        style={{
          fontFamily: fontStack(brand.bodyFont),
          fontSize: size * 0.22,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: p.layout === 'giant' ? brand.surface : p.layout === 'kicker-left' || p.layout === 'kicker-lines' ? brand.accent : brand.text,
          opacity: 0.92,
          textShadow: p.layout === 'giant' ? 'none' : `0 ${2 * u}px ${14 * u}px rgba(0,0,0,.4)`,
          whiteSpace: 'nowrap',
        }}
      />
    );

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: align === 'left' ? 'flex-start' : 'center', padding: `0 ${st.width * 0.07}px` }}>
        {LAYOUTS[p.layout]({
          u,
          brand,
          values,
          title,
          sub,
          hasSub: !!subStr,
          size,
          enter: st.enter,
          out: st.exit,
          align,
          words,
          hi: Number(values.highlight ?? 0) - 1,
        })}
      </AbsoluteFill>
    );
  };

  const fields: Field[] = [
    { key: 'title', label: 'Headline', type: 'textarea' },
    { key: 'subtitle', label: p.layout === 'kicker-left' || p.layout === 'kicker-lines' ? 'Kicker' : 'Subtitle', type: 'text' },
    ...(p.layout === 'highlight' ? [{ key: 'highlight', label: 'Highlight word # (0 = none)', type: 'number', min: 0, max: 12, step: 1 } as Field] : []),
    { key: 'size', label: 'Text size', type: 'number', min: 60, max: 240, step: 5, suffix: 'px' },
    ...(p.layout === 'kicker-left' || p.layout === 'kicker-lines'
      ? []
      : [
          {
            key: 'align',
            label: 'Alignment',
            type: 'select',
            options: [
              { value: 'center', label: 'Center' },
              { value: 'left', label: 'Left' },
            ],
          } as Field,
        ]),
    { key: 'uppercase', label: 'Uppercase', type: 'toggle' },
    { key: 'duration', label: 'Duration', type: 'number', min: 2, max: 20, step: 0.5, suffix: 's' },
  ];

  return {
    id: `title-${p.id}`,
    name: p.name,
    category: 'Titles',
    description: p.description,
    component: Comp,
    fields,
    defaults: {
      title: p.title ?? 'Design that moves people',
      subtitle: 'Episode 01 · The Process',
      ...(p.layout === 'highlight' ? { highlight: 4 } : {}),
      size: p.layout === 'giant' ? 120 : 130,
      align: 'center',
      uppercase: p.uppercase ?? false,
      duration: 5,
    },
  };
}

const PRESETS: TitlePreset[] = [
  { id: 'rise-up', name: 'Rise Up', layout: 'center', fx: 'rise', description: 'Words rise from behind an invisible line.' },
  { id: 'blur-reveal', name: 'Blur Reveal', layout: 'center', fx: 'blurIn', subFx: 'tracking', description: 'Soft cinematic focus pull, word by word.' },
  { id: 'letter-pop', name: 'Letter Pop', layout: 'two-tone', fx: 'pop', subFx: 'fall', title: 'Make it pop today', description: 'Bouncy letters, second half in your accent color.' },
  { id: 'type-on', name: 'Type On', layout: 'kicker-left', fx: 'typewriter', subFx: 'typewriter', description: 'Classic typewriter with a kicker line above.' },
  { id: 'tracking-wide', name: 'Tracking Wide', layout: 'kicker-lines', fx: 'tracking', subFx: 'blurIn', uppercase: true, title: 'The new standard', description: 'Wide letter-spacing closes in — very cinematic.' },
  { id: 'block-build', name: 'Block Build', layout: 'block', fx: 'slideIn', title: 'Built different', description: 'A color block wipes in and the words slide on top.' },
  { id: 'flip-board', name: 'Flip Board', layout: 'framed', fx: 'flip', uppercase: true, title: 'Now boarding', description: 'Split-flap letters inside a drawn frame.' },
  { id: 'glitch-headline', name: 'Glitch Headline', layout: 'center', fx: 'glitch', subFx: 'glitch', uppercase: true, title: 'System override', description: 'Digital glitch with RGB split.' },
  { id: 'decoder', name: 'Decoder', layout: 'kicker-left', fx: 'scramble', subFx: 'scramble', uppercase: true, title: 'Access granted', description: 'Random characters decode into the headline.' },
  { id: 'ocean-wave', name: 'Ocean Wave', layout: 'center', fx: 'wave', title: 'Ride the wave', description: 'Letters float on a continuous wave.' },
  { id: 'neon-night', name: 'Neon Night', layout: 'framed', fx: 'neon', subFx: 'neon', uppercase: true, title: 'Open late', description: 'Flickering neon tube in a glowing frame.' },
  { id: 'drop-bounce', name: 'Drop Bounce', layout: 'two-tone', fx: 'bounce', title: 'Drop the beat', description: 'Letters fall and bounce, two-tone color.' },
  { id: 'spin-cycle', name: 'Spin Cycle', layout: 'underline', fx: 'spin', title: 'Full circle', description: 'Characters spin into place over a growing underline.' },
  { id: 'stretch-out', name: 'Stretch Out', layout: 'giant', fx: 'stretch', uppercase: true, title: 'Big energy', description: 'Huge condensed letters stretch back to shape.' },
  { id: 'zoom-burst', name: 'Zoom Burst', layout: 'center', fx: 'zoom', subFx: 'blurIn', title: 'Breaking through', description: 'Words zoom from the camera with motion blur.' },
  { id: 'skew-slide', name: 'Skew Slide', layout: 'block', fx: 'skew', uppercase: true, title: 'Full speed', description: 'Fast skewed slide on a color block.' },
  { id: 'marker-pen', name: 'Marker Pen', layout: 'highlight', fx: 'charRise', description: 'Letters rise and a marker highlights one word.' },
  { id: 'echo-stack', name: 'Echo Stack', layout: 'echo', fx: 'fall', uppercase: true, title: 'Repeat after me', description: 'Outlined echoes stack above the headline.' },
  { id: 'elastic-snap', name: 'Elastic Snap', layout: 'kicker-left', fx: 'elastic', title: 'Snap into place', description: 'Words fly in and snap with elastic overshoot.' },
  { id: 'shuffle-words', name: 'Shuffle', layout: 'highlight', fx: 'shuffle', description: 'Scattered letters shuffle into order, one word highlighted.' },
  { id: 'door-swing', name: 'Door Swing', layout: 'kicker-lines', fx: 'door', subFx: 'tracking', title: 'Come on in', description: 'Words open like doors in 3D.' },
  { id: 'wipe-clean', name: 'Wipe Clean', layout: 'underline', fx: 'wipe', subFx: 'rise', title: 'Clean slate', description: 'A hard wipe reveal with an underline accent.' },
  { id: 'swing-set', name: 'Swing Set', layout: 'two-tone', fx: 'swing', title: 'Hang in there', description: 'Words swing down from their corner.' },
  { id: 'squeeze-play', name: 'Squeeze Play', layout: 'giant', fx: 'squeeze', uppercase: true, title: 'Game on', description: 'Giant type springs open horizontally.' },
  { id: 'hollow-fill', name: 'Hollow Fill', layout: 'center', fx: 'outlineFill', subFx: 'tracking', uppercase: true, title: 'Fill the gap', description: 'Outlined headline fills in solid.' },
];

export const TITLE_FX: TemplateDef[] = PRESETS.map(makeTitle);
