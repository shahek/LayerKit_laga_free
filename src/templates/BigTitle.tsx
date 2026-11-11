import { AbsoluteFill } from 'remotion';
import { fontStack, useCustomFonts } from '../lib/fonts';
import { lerp, useStage } from '../lib/motion';
import type { CompProps, TemplateDef } from '../lib/types';

const BigTitle: React.FC<CompProps> = ({ values, brand, fonts }) => {
  useCustomFonts(fonts);
  const { unit, width, enter, exit } = useStage();

  const words = String(values.title ?? '').split(/\s+/).filter(Boolean);
  const subtitle = String(values.subtitle ?? '');
  const hi = Number(values.highlight ?? 0) - 1; // 1-based in the UI, 0 = none
  const size = Number(values.size ?? 140) * unit;
  const align = String(values.align ?? 'center');
  const stagger = 4;

  const subT = enter(words.length * stagger + 6);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: align === 'left' ? 'flex-start' : 'center',
        padding: `0 ${width * 0.075}px`,
        opacity: 1 - exit,
        transform: `scale(${lerp(exit, 1, 1.06)})`,
        filter: `blur(${exit * 12 * unit}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: align === 'left' ? 'flex-start' : 'center',
          columnGap: size * 0.26,
          rowGap: size * 0.02,
          maxWidth: width * 0.85,
        }}
      >
        {words.map((w, i) => {
          const t = enter(i * stagger, 16, 30);
          const isHi = i === hi;
          const bar = enter(i * stagger + 10, 200, 20);
          return (
            <span key={i} style={{ overflow: 'hidden', display: 'inline-block', padding: `0 ${size * 0.04}px ${size * 0.08}px` }}>
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontFamily: fontStack(brand.headingFont),
                  fontSize: size,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  textTransform: values.uppercase ? 'uppercase' : 'none',
                  color: isHi ? brand.surface : brand.text,
                  transform: `translateY(${lerp(t, 105, 0)}%) rotate(${lerp(t, 8, 0)}deg)`,
                  textShadow: isHi ? 'none' : `0 ${4 * unit}px ${30 * unit}px rgba(0,0,0,.35)`,
                  zIndex: 1,
                }}
              >
                {isHi && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: `${size * 0.04}px -${size * 0.08}px -${size * 0.02}px`,
                      background: brand.accent,
                      borderRadius: size * 0.08,
                      transform: `scaleX(${bar})`,
                      transformOrigin: 'left',
                      zIndex: -1,
                    }}
                  />
                )}
                {w}
              </span>
            </span>
          );
        })}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: size * 0.3,
            fontFamily: fontStack(brand.bodyFont),
            fontSize: size * 0.24,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: brand.text,
            opacity: subT * 0.85,
            transform: `translateY(${lerp(subT, 20 * unit, 0)}px)`,
            textAlign: align === 'left' ? 'left' : 'center',
            textShadow: `0 ${2 * unit}px ${16 * unit}px rgba(0,0,0,.4)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const bigTitle: TemplateDef = {
  id: 'big-title',
  name: 'Big Title',
  category: 'Titles',
  description: 'Kinetic headline that builds word by word, with one highlighted word.',
  component: BigTitle,
  fields: [
    { key: 'title', label: 'Headline', type: 'textarea' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'highlight', label: 'Highlight word # (0 = none)', type: 'number', min: 0, max: 12, step: 1 },
    { key: 'size', label: 'Text size', type: 'number', min: 60, max: 260, step: 5, suffix: 'px' },
    {
      key: 'align',
      label: 'Alignment',
      type: 'select',
      options: [
        { value: 'center', label: 'Center' },
        { value: 'left', label: 'Left' },
      ],
    },
    { key: 'uppercase', label: 'Uppercase', type: 'toggle' },
    { key: 'duration', label: 'Duration', type: 'number', min: 2, max: 20, step: 0.5, suffix: 's' },
  ],
  defaults: {
    title: 'Design that moves people',
    subtitle: 'Episode 01 · The Process',
    highlight: 4,
    size: 140,
    align: 'center',
    uppercase: false,
    duration: 5,
  },
};
