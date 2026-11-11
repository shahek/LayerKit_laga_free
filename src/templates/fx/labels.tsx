import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { fontStack, useCustomFonts } from '../../lib/fonts';
import { lerp, useStage } from '../../lib/motion';
import type { Brand, CompProps, Field, TemplateDef, Values } from '../../lib/types';
import { FxText, hexA, type FxName } from './textFx';

/* A label = layout (the graphic around the text) + text effects (how the words move). */

type LayoutId =
  | 'bar-panel'
  | 'underline'
  | 'pill'
  | 'tag-stack'
  | 'brackets'
  | 'split-block'
  | 'ribbon'
  | 'outline-box'
  | 'news-strap'
  | 'dot-line'
  | 'glass'
  | 'side-line'
  | 'badge'
  | 'double-bar'
  | 'stamp';

type LabelPreset = {
  id: string;
  name: string;
  description: string;
  layout: LayoutId;
  nameFx: FxName;
  titleFx: FxName;
  uppercaseTitle?: boolean;
  tag?: string; // default tag text for layouts that show one
};

type Ctx = {
  u: number;
  brand: Brand;
  values: Values;
  name: ReactNode;
  title: ReactNode;
  hasTitle: boolean;
  nameSize: number;
  titleSize: number;
  enter: (d?: number, damping?: number, len?: number) => number;
  out: number;
  align: 'left' | 'center' | 'right';
};

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const col = (gap: number, align: Ctx['align']): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap,
  alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
  textAlign: align,
});

/* ──────────────────────────  Layouts  ────────────────────────── */

const LAYOUTS: Record<LayoutId, (c: Ctx) => ReactNode> = {
  'bar-panel': ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const bar = enter(0) * (1 - out);
    const p = enter(4) * (1 - out);
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 16 * u }}>
        <div style={{ width: 10 * u, background: brand.accent, borderRadius: 4 * u, transform: `scaleY(${bar})`, transformOrigin: 'bottom' }} />
        <div style={{ background: brand.surface, padding: `${20 * u}px ${36 * u}px`, borderRadius: 10 * u, clipPath: `inset(0 ${lerp(p, 100, 0)}% 0 0 round ${10 * u}px)`, ...col(6 * u, align) }}>
          {name}
          {hasTitle && title}
        </div>
      </div>
    );
  },
  underline: ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const l = enter(6) * (1 - out);
    return (
      <div style={col(10 * u, align)}>
        {name}
        <div style={{ height: 6 * u, width: '100%', background: brand.accent, borderRadius: 6 * u, transform: `scaleX(${l})`, transformOrigin: align === 'right' ? 'right' : align === 'center' ? 'center' : 'left' }} />
        {hasTitle && title}
      </div>
    );
  },
  pill: ({ u, brand, name, title, hasTitle, enter, out }) => {
    const p = enter(0, 16, 30) * (1 - out);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22 * u,
          background: brand.primary,
          padding: `${18 * u}px ${44 * u}px`,
          borderRadius: 999,
          transform: `scale(${lerp(Math.min(p, 1.2), 0.6, 1)})`,
          opacity: Math.min(1, p * 2),
          boxShadow: `0 ${14 * u}px ${40 * u}px ${hexA(brand.primary, 0.45)}`,
        }}
      >
        {name}
        {hasTitle && <span style={{ width: 10 * u, height: 10 * u, borderRadius: 99, background: brand.accent, transform: `scale(${enter(10, 10)})` }} />}
        {hasTitle && title}
      </div>
    );
  },
  'tag-stack': ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const a = enter(0) * (1 - out);
    const b = enter(7) * (1 - out);
    return (
      <div style={col(0, align)}>
        <div style={{ background: brand.primary, padding: `${14 * u}px ${30 * u}px`, clipPath: `inset(0 ${lerp(a, 100, 0)}% 0 0)` }}>{name}</div>
        {hasTitle && (
          <div style={{ background: brand.accent, padding: `${10 * u}px ${24 * u}px`, marginLeft: align === 'left' ? 46 * u : 0, marginRight: align === 'right' ? 46 * u : 0, clipPath: `inset(0 ${lerp(b, 100, 0)}% 0 0)` }}>
            {title}
          </div>
        )}
      </div>
    );
  },
  brackets: ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const t = enter(0, 14, 30) * (1 - out);
    const s = 34 * u;
    const w = 6 * u;
    const off = lerp(Math.min(t, 1.1), 60 * u, 0);
    const corner = (pos: CSSProperties, b: CSSProperties, dx: number, dy: number) => (
      <div style={{ position: 'absolute', width: s, height: s, ...pos, ...b, borderColor: brand.accent, borderStyle: 'solid', borderWidth: 0, opacity: Math.min(1, t * 2), transform: `translate(${dx * off}px, ${dy * off}px)` }} />
    );
    return (
      <div style={{ position: 'relative', padding: `${26 * u}px ${44 * u}px`, ...col(6 * u, align) }}>
        {corner({ left: 0, top: 0 }, { borderLeftWidth: w, borderTopWidth: w }, -1, -1)}
        {corner({ right: 0, top: 0 }, { borderRightWidth: w, borderTopWidth: w }, 1, -1)}
        {corner({ left: 0, bottom: 0 }, { borderLeftWidth: w, borderBottomWidth: w }, -1, 1)}
        {corner({ right: 0, bottom: 0 }, { borderRightWidth: w, borderBottomWidth: w }, 1, 1)}
        {name}
        {hasTitle && title}
      </div>
    );
  },
  'split-block': ({ u, brand, name, title, hasTitle, enter, out }) => {
    const a = enter(0) * (1 - out);
    const b = enter(8, 18) * (1 - out);
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', clipPath: `inset(-50% ${lerp(a, 100, 0)}% -50% 0)` }}>
        <div style={{ background: brand.surface, padding: `${20 * u}px ${34 * u}px`, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>{name}</div>
        {hasTitle && (
          <div style={{ overflow: 'hidden', display: 'flex' }}>
            <div style={{ background: brand.accent, padding: `${0}px ${30 * u}px`, display: 'flex', alignItems: 'center', transform: `translateX(${lerp(b, -100, 0)}%)` }}>{title}</div>
          </div>
        )}
      </div>
    );
  },
  ribbon: ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const a = enter(0) * (1 - out);
    const b = enter(9, 12) * (1 - out);
    const cut = 40 * u;
    return (
      <div style={col(0, align)}>
        {hasTitle && (
          <div style={{ background: brand.accent, padding: `${6 * u}px ${22 * u}px`, transform: `skewX(-14deg) translateY(${lerp(b, 100, 0)}%)`, opacity: Math.min(1, b * 2), marginLeft: 18 * u, position: 'relative', zIndex: 0 }}>
            <div style={{ transform: 'skewX(14deg)' }}>{title}</div>
          </div>
        )}
        <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <div style={{ background: brand.primary, padding: `${16 * u}px ${70 * u}px ${16 * u}px ${32 * u}px`, clipPath: `polygon(0 0, 100% 0, calc(100% - ${cut}px) 100%, 0 100%)`, transform: `translateX(${lerp(a, -105, 0)}%)` }}>{name}</div>
        </div>
      </div>
    );
  },
  'outline-box': ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const a = enter(0, 200, 30) * (1 - out);
    const b = enter(10, 200, 30) * (1 - out);
    return (
      <div style={{ position: 'relative', padding: `${22 * u}px ${40 * u}px`, ...col(6 * u, align) }}>
        <div style={{ position: 'absolute', inset: 0, border: `${4 * u}px solid ${brand.accent}`, clipPath: `inset(0 ${lerp(a, 100, 0)}% ${lerp(b, 100, 0)}% 0)`, borderRadius: 6 * u }} />
        <div style={{ position: 'absolute', inset: 0, border: `${4 * u}px solid ${brand.accent}`, clipPath: `inset(${lerp(b, 100, 0)}% 0 0 ${lerp(a, 100, 0)}%)`, borderRadius: 6 * u }} />
        {name}
        {hasTitle && title}
      </div>
    );
  },
  'news-strap': ({ u, brand, values, name, title, hasTitle, enter, out }) => {
    const a = enter(0) * (1 - out);
    const b = enter(5, 14) * (1 - out);
    const tag = String(values.tag ?? 'LIVE');
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
        {tag && (
          <div style={{ background: brand.accent, color: brand.surface, fontWeight: 800, letterSpacing: '0.12em', padding: `0 ${28 * u}px`, display: 'flex', alignItems: 'center', fontSize: 30 * u, fontFamily: fontStack(brand.bodyFont), transform: `scale(${b})`, position: 'relative', zIndex: 2 }}>
            {tag}
          </div>
        )}
        <div style={{ flex: 1, background: brand.surface, padding: `${16 * u}px ${32 * u}px`, display: 'flex', alignItems: 'baseline', gap: 26 * u, clipPath: `inset(0 ${lerp(a, 100, 0)}% 0 0)`, borderTop: `${4 * u}px solid ${brand.primary}` }}>
          {name}
          {hasTitle && title}
        </div>
      </div>
    );
  },
  'dot-line': ({ u, brand, name, title, hasTitle, enter, out }) => {
    const d = enter(0, 9, 26) * (1 - out);
    const l = enter(6) * (1 - out);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 22 * u, height: 22 * u, borderRadius: 99, background: brand.accent, transform: `scale(${Math.max(0, d)})`, boxShadow: `0 0 0 ${8 * u}px ${hexA(brand.accent, 0.25)}` }} />
          <div style={{ width: 90 * u, height: 3 * u, background: brand.accent, transform: `scaleX(${l})`, transformOrigin: 'left' }} />
        </div>
        <div style={col(6 * u, 'left')}>
          {name}
          {hasTitle && title}
        </div>
      </div>
    );
  },
  glass: ({ u, name, title, hasTitle, enter, out, align }) => {
    const p = enter(0, 18, 30) * (1 - out);
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.14)',
          border: `${1.5 * u}px solid rgba(255,255,255,0.35)`,
          borderRadius: 26 * u,
          padding: `${22 * u}px ${40 * u}px`,
          boxShadow: `0 ${20 * u}px ${50 * u}px rgba(0,0,0,0.25), inset 0 ${1 * u}px 0 rgba(255,255,255,0.4)`,
          transform: `scale(${lerp(Math.min(p, 1.1), 0.88, 1)}) translateY(${lerp(Math.min(p, 1), 30 * u, 0)}px)`,
          opacity: Math.min(1, p * 1.5),
          ...col(6 * u, align),
        }}
      >
        {name}
        {hasTitle && title}
      </div>
    );
  },
  'side-line': ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const l = enter(0, 200, 30) * (1 - out);
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 26 * u, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
        <div style={{ width: 4 * u, background: brand.accent, transform: `scaleY(${l})`, transformOrigin: 'top' }} />
        <div style={col(4 * u, align === 'right' ? 'right' : 'left')}>
          {hasTitle && title}
          {name}
        </div>
      </div>
    );
  },
  badge: ({ u, brand, values, name, title, hasTitle, enter, out, nameSize }) => {
    const b = enter(0, 9, 30) * (1 - out);
    const size = nameSize * 1.7;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 * u }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: `scale(${Math.max(0, b)}) rotate(${lerp(Math.min(b, 1), -90, 0)}deg)`,
            flexShrink: 0,
          }}
        >
          {brand.logo ? (
            <Img src={brand.logo} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.38, fontFamily: fontStack(brand.headingFont) }}>{initials(String(values.name ?? ''))}</span>
          )}
        </div>
        <div style={col(6 * u, 'left')}>
          {name}
          {hasTitle && title}
        </div>
      </div>
    );
  },
  'double-bar': ({ u, brand, name, title, hasTitle, enter, out, align }) => {
    const a = enter(0) * (1 - out);
    const b = enter(4) * (1 - out);
    const origin = align === 'right' ? 'right' : align === 'center' ? 'center' : 'left';
    return (
      <div style={col(12 * u, align)}>
        <div style={{ height: 3 * u, width: '100%', background: brand.accent, transform: `scaleX(${a})`, transformOrigin: origin }} />
        {name}
        {hasTitle && title}
        <div style={{ height: 3 * u, width: '100%', background: brand.accent, transform: `scaleX(${b})`, transformOrigin: origin === 'left' ? 'right' : origin === 'right' ? 'left' : 'center' }} />
      </div>
    );
  },
  stamp: ({ u, brand, values, name, title, hasTitle, enter, out, align }) => {
    const s = enter(0, 12, 26) * (1 - out);
    const tag = String(values.tag ?? '');
    return (
      <div
        style={{
          border: `${6 * u}px solid ${brand.accent}`,
          outline: `${2 * u}px solid ${brand.accent}`,
          outlineOffset: 6 * u,
          padding: `${16 * u}px ${36 * u}px`,
          transform: `rotate(-4deg) scale(${lerp(Math.min(s, 1.05), 2.4, 1)})`,
          opacity: Math.min(1, s * 2),
          ...col(4 * u, align),
        }}
      >
        {tag && <div style={{ color: brand.accent, fontWeight: 800, letterSpacing: '0.3em', fontSize: 22 * u, fontFamily: fontStack(brand.bodyFont) }}>{tag}</div>}
        {name}
        {hasTitle && title}
      </div>
    );
  },
};

/* ──────────────────────────  Factory  ────────────────────────── */


const TITLE_ON_ACCENT: LayoutId[] = ['tag-stack', 'split-block', 'ribbon'];

function makeLabel(p: LabelPreset): TemplateDef {
  const Comp: React.FC<CompProps> = ({ values, brand, fonts }) => {
    useCustomFonts(fonts);
    const st = useStage();
    const u = st.unit * (st.vertical ? 1.3 : 1);
    const align = (st.vertical && values.align === 'left' ? 'center' : String(values.align ?? 'left')) as Ctx['align'];
    const nameSize = Number(values.size ?? 60) * u;
    const titleSize = nameSize * 0.46;
    const upper = Boolean(values.uppercase);
    const fxc = { u, accent: brand.accent, primary: brand.primary, text: brand.text };
    const nameStr = String(values.name ?? '');
    const titleStr = String(values.title ?? '');
    const onAccent = TITLE_ON_ACCENT.includes(p.layout);

    const name = (
      <FxText
        text={nameStr}
        fx={p.nameFx}
        c={fxc}
        delay={4}
        style={{
          fontFamily: fontStack(brand.headingFont),
          fontSize: nameSize,
          fontWeight: 700,
          lineHeight: 1.05,
          color: brand.text,
          whiteSpace: 'nowrap',
          textShadow: ['underline', 'brackets', 'dot-line', 'side-line', 'badge', 'double-bar', 'outline-box', 'stamp'].includes(p.layout)
            ? `0 ${2 * u}px ${18 * u}px rgba(0,0,0,.45)`
            : undefined,
        }}
      />
    );
    const title = (
      <FxText
        text={titleStr}
        fx={p.titleFx}
        c={{ ...fxc, text: onAccent ? brand.surface : brand.accent }}
        delay={11}
        style={{
          fontFamily: fontStack(brand.bodyFont),
          fontSize: titleSize,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: upper ? '0.14em' : '0.01em',
          textTransform: upper ? 'uppercase' : 'none',
          color: onAccent ? brand.surface : p.layout === 'pill' ? brand.text : brand.accent,
          opacity: p.layout === 'pill' ? 0.85 : 1,
          whiteSpace: 'nowrap',
        }}
      />
    );

    const strap = p.layout === 'news-strap';
    return (
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: strap ? 'stretch' : align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          padding: strap ? `0 0 ${(st.vertical ? st.height * 0.22 : 70 * u)}px` : st.vertical ? `0 ${70 * u}px ${st.height * 0.24}px` : `0 ${110 * u}px ${96 * u}px`,
        }}
      >
        {LAYOUTS[p.layout]({ u, brand, values, name, title, hasTitle: !!titleStr, nameSize, titleSize, enter: st.enter, out: st.exit, align })}
      </AbsoluteFill>
    );
  };

  const fields: Field[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'title', label: 'Title / role', type: 'text' },
    ...(p.tag !== undefined ? [{ key: 'tag', label: 'Tag text', type: 'text' } as Field] : []),
    {
      key: 'align',
      label: 'Position',
      type: 'select',
      options: [
        { value: 'left', label: 'Bottom left' },
        { value: 'center', label: 'Bottom center' },
        { value: 'right', label: 'Bottom right' },
      ],
    },
    { key: 'size', label: 'Text size', type: 'number', min: 32, max: 120, step: 2, suffix: 'px' },
    { key: 'uppercase', label: 'Uppercase title', type: 'toggle' },
    { key: 'duration', label: 'Duration', type: 'number', min: 2, max: 20, step: 0.5, suffix: 's' },
  ];

  return {
    id: `label-${p.id}`,
    name: p.name,
    category: 'Labels',
    description: p.description,
    component: Comp,
    fields,
    defaults: {
      name: 'Alex Morgan',
      title: 'Creative Director',
      ...(p.tag !== undefined ? { tag: p.tag } : {}),
      align: p.layout === 'news-strap' ? 'left' : 'left',
      size: 60,
      uppercase: p.uppercaseTitle ?? true,
      duration: 5,
    },
  };
}

/* ──────────────────────────  25 presets  ────────────────────────── */

const PRESETS: LabelPreset[] = [
  { id: 'classic-bar', name: 'Classic Bar', layout: 'bar-panel', nameFx: 'rise', titleFx: 'rise', description: 'Accent bar grows, panel wipes, words rise from a mask.' },
  { id: 'soft-focus', name: 'Soft Focus', layout: 'glass', nameFx: 'blurIn', titleFx: 'blurIn', uppercaseTitle: false, description: 'Frosted glass card with words drifting out of blur.' },
  { id: 'typewriter-tag', name: 'Typewriter Tag', layout: 'tag-stack', nameFx: 'typewriter', titleFx: 'typewriter', description: 'Two stacked tags that type themselves letter by letter.' },
  { id: 'pop-pill', name: 'Pop Pill', layout: 'pill', nameFx: 'pop', titleFx: 'blurIn', uppercaseTitle: false, description: 'Bouncy pill with letters popping in one by one.' },
  { id: 'frame-lock', name: 'Frame Lock', layout: 'brackets', nameFx: 'tracking', titleFx: 'tracking', description: 'Corner brackets snap in while the letter-spacing closes up.' },
  { id: 'split-duo', name: 'Split Duo', layout: 'split-block', nameFx: 'slideIn', titleFx: 'slideIn', description: 'Name block with the role sliding out from behind it.' },
  { id: 'ribbon-run', name: 'Ribbon Run', layout: 'ribbon', nameFx: 'skew', titleFx: 'rise', description: 'Angled ribbon with a skewed tag on top.' },
  { id: 'ink-underline', name: 'Ink Underline', layout: 'underline', nameFx: 'charRise', titleFx: 'rise', description: 'Letters rise one by one over a drawn underline.' },
  { id: 'breaking-strap', name: 'Breaking Strap', layout: 'news-strap', nameFx: 'wipe', titleFx: 'slideIn', tag: 'LIVE', description: 'Full-width news strap with a LIVE tag.' },
  { id: 'dot-connect', name: 'Dot Connect', layout: 'dot-line', nameFx: 'slideIn', titleFx: 'blurIn', description: 'A dot pops, a line extends, the text follows.' },
  { id: 'kicker-line', name: 'Kicker Line', layout: 'side-line', nameFx: 'fall', titleFx: 'tracking', description: 'Vertical rule with a small kicker above the name.' },
  { id: 'profile-badge', name: 'Profile Badge', layout: 'badge', nameFx: 'elastic', titleFx: 'slideIn', uppercaseTitle: false, description: 'Gradient avatar badge (uses your logo) with elastic text.' },
  { id: 'double-rule', name: 'Double Rule', layout: 'double-bar', nameFx: 'squeeze', titleFx: 'blurIn', description: 'Two hairlines draw in opposite directions around the text.' },
  { id: 'rubber-stamp', name: 'Rubber Stamp', layout: 'stamp', nameFx: 'zoom', titleFx: 'zoom', tag: 'APPROVED', description: 'Slams down like a stamp, slightly rotated.' },
  { id: 'neon-sign', name: 'Neon Sign', layout: 'outline-box', nameFx: 'neon', titleFx: 'neon', description: 'Glowing box that draws itself while the text flickers on.' },
  { id: 'glitch-id', name: 'Glitch ID', layout: 'side-line', nameFx: 'glitch', titleFx: 'glitch', description: 'RGB-split glitch that settles into clean type.' },
  { id: 'scrambler', name: 'Scrambler', layout: 'tag-stack', nameFx: 'scramble', titleFx: 'scramble', description: 'Random characters decode into your text.' },
  { id: 'wave-hello', name: 'Wave Hello', layout: 'pill', nameFx: 'wave', titleFx: 'fall', uppercaseTitle: false, description: 'Letters keep floating in a gentle wave.' },
  { id: 'flip-card', name: 'Flip Card', layout: 'outline-box', nameFx: 'flip', titleFx: 'flip', description: 'Each letter flips up like a departure board.' },
  { id: 'bounce-in', name: 'Bounce In', layout: 'badge', nameFx: 'bounce', titleFx: 'fall', uppercaseTitle: false, description: 'Letters drop and bounce into place.' },
  { id: 'spin-letters', name: 'Spin Letters', layout: 'double-bar', nameFx: 'spin', titleFx: 'charBlur', description: 'Characters spin in from nothing.' },
  { id: 'stretch-mark', name: 'Stretch Mark', layout: 'underline', nameFx: 'stretch', titleFx: 'squeeze', description: 'Tall stretched letters snap back to shape.' },
  { id: 'shuffle-deck', name: 'Shuffle Deck', layout: 'brackets', nameFx: 'shuffle', titleFx: 'blurIn', description: 'Scattered letters shuffle into the right order.' },
  { id: 'swing-sign', name: 'Swing Sign', layout: 'ribbon', nameFx: 'swing', titleFx: 'swing', description: 'Words swing down like a hanging sign.' },
  { id: 'outline-fill', name: 'Outline Fill', layout: 'split-block', nameFx: 'outlineFill', titleFx: 'door', description: 'Name draws as an outline, then fills solid.' },
];

export const LABEL_FX: TemplateDef[] = PRESETS.map(makeLabel);
