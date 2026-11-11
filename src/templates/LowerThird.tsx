import { AbsoluteFill, Img } from 'remotion';
import { fontStack, useCustomFonts } from '../lib/fonts';
import { lerp, useStage } from '../lib/motion';
import type { CompProps, TemplateDef } from '../lib/types';

const LowerThird: React.FC<CompProps> = ({ values, brand, fonts }) => {
  useCustomFonts(fonts);
  const stage = useStage();
  const { vertical, height, enter, exit } = stage;
  const unit = stage.unit * (vertical ? 1.3 : 1);

  const style = String(values.style ?? 'solid');
  const centered = values.align === 'center' || vertical;
  const showLogo = Boolean(values.showLogo) && !!brand.logo;

  const bar = enter(0);
  const panel = enter(5);
  const name = enter(9);
  const title = enter(14);
  const out = exit;

  const pad = 28 * unit;
  const nameSize = Number(values.nameSize ?? 64) * unit;
  const titleSize = nameSize * 0.46;

  const isPill = style === 'pill';
  const panelBg = style === 'minimal' ? 'transparent' : isPill ? brand.primary : brand.surface;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: centered ? 'center' : 'flex-start',
        padding: vertical ? `0 0 ${height * 0.24}px 0` : `0 ${110 * unit}px ${96 * unit}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 18 * unit,
          opacity: 1 - out,
          transform: `translateY(${out * 30 * unit}px)`,
        }}
      >
        {/* accent bar */}
        {!isPill && (
          <div
            style={{
              width: 10 * unit,
              background: brand.accent,
              borderRadius: 4 * unit,
              transform: `scaleY(${bar})`,
              transformOrigin: 'bottom',
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22 * unit,
            background: panelBg,
            padding: style === 'minimal' ? 0 : `${pad * 0.8}px ${pad * 1.4}px`,
            borderRadius: isPill ? 999 : 10 * unit,
            clipPath: `inset(0 ${lerp(panel, 100, 0)}% 0 0 round ${isPill ? 999 : 10 * unit}px)`,
            boxShadow: style === 'minimal' ? 'none' : `0 ${12 * unit}px ${40 * unit}px rgba(0,0,0,.25)`,
          }}
        >
          {showLogo && (
            <Img
              src={brand.logo!}
              style={{
                height: nameSize * 1.35,
                width: nameSize * 1.35,
                objectFit: 'contain',
                borderRadius: 8 * unit,
                transform: `scale(${panel})`,
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * unit, textAlign: centered && !showLogo ? 'center' : 'left' }}>
            <div style={{ overflow: 'hidden', paddingBottom: 4 * unit }}>
              <div
                style={{
                  fontFamily: fontStack(brand.headingFont),
                  fontSize: nameSize,
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: isPill ? brand.surface : brand.text,
                  transform: `translateY(${lerp(name, 110, 0)}%)`,
                  whiteSpace: 'nowrap',
                  textShadow: style === 'minimal' ? `0 ${2 * unit}px ${16 * unit}px rgba(0,0,0,.5)` : 'none',
                }}
              >
                {String(values.name ?? '')}
              </div>
            </div>
            {String(values.title ?? '') && (
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontFamily: fontStack(brand.bodyFont),
                    fontSize: titleSize,
                    fontWeight: 500,
                    letterSpacing: values.uppercase ? '0.14em' : '0.01em',
                    textTransform: values.uppercase ? 'uppercase' : 'none',
                    color: isPill ? brand.surface : brand.accent,
                    transform: `translateY(${lerp(title, 110, 0)}%)`,
                    whiteSpace: 'nowrap',
                    textShadow: style === 'minimal' ? `0 ${2 * unit}px ${12 * unit}px rgba(0,0,0,.5)` : 'none',
                  }}
                >
                  {String(values.title)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const lowerThird: TemplateDef = {
  id: 'lower-third',
  name: 'Lower Third',
  category: 'Labels',
  description: 'Name and title bar that wipes in at the bottom of the frame.',
  component: LowerThird,
  fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'title', label: 'Title / role', type: 'text' },
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'solid', label: 'Solid panel' },
        { value: 'minimal', label: 'Minimal (no panel)' },
        { value: 'pill', label: 'Pill' },
      ],
    },
    {
      key: 'align',
      label: 'Position',
      type: 'select',
      options: [
        { value: 'left', label: 'Bottom left' },
        { value: 'center', label: 'Bottom center' },
      ],
    },
    { key: 'nameSize', label: 'Text size', type: 'number', min: 32, max: 120, step: 2, suffix: 'px' },
    { key: 'uppercase', label: 'Uppercase title', type: 'toggle' },
    { key: 'showLogo', label: 'Show brand logo', type: 'toggle' },
    { key: 'duration', label: 'Duration', type: 'number', min: 2, max: 20, step: 0.5, suffix: 's' },
  ],
  defaults: {
    name: 'Alex Morgan',
    title: 'Creative Director',
    style: 'solid',
    align: 'left',
    nameSize: 64,
    uppercase: true,
    showLogo: false,
    duration: 5,
  },
};
