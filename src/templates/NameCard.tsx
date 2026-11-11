import { AbsoluteFill, Img } from 'remotion';
import { fontStack, useCustomFonts } from '../lib/fonts';
import { lerp, useStage } from '../lib/motion';
import type { CompProps, TemplateDef } from '../lib/types';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const NameCard: React.FC<CompProps> = ({ values, brand, fonts }) => {
  useCustomFonts(fonts);
  const stage = useStage();
  const { vertical, height, enter, exit } = stage;
  const unit = stage.unit * (vertical ? 1.4 : 1);

  const name = String(values.name ?? '');
  const role = String(values.role ?? '');
  const handle = String(values.handle ?? '');
  const photo = (values.photo as string | null) || null;
  const pos = vertical ? 'center' : String(values.position ?? 'bottom-left');
  const dark = values.theme !== 'light';

  const card = enter(0, 14, 34);
  const ph = enter(6, 12, 34);
  const l1 = enter(10);
  const l2 = enter(15);
  const l3 = enter(20);

  const bg = dark ? brand.surface : '#ffffff';
  const fg = dark ? brand.text : brand.surface;
  const avatar = 150 * unit;

  const justify = pos === 'center' && !vertical ? 'center' : 'flex-end';
  const align = pos === 'bottom-right' ? 'flex-end' : pos === 'center' ? 'center' : 'flex-start';

  const line = (t: number): React.CSSProperties => ({
    opacity: t,
    transform: `translateX(${lerp(t, -24 * unit, 0)}px)`,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: justify,
        alignItems: align,
        padding: vertical ? `0 0 ${height * 0.24}px` : `${90 * unit}px ${110 * unit}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32 * unit,
          padding: `${28 * unit}px ${48 * unit}px ${28 * unit}px ${28 * unit}px`,
          background: bg,
          borderRadius: 32 * unit,
          boxShadow: `0 ${20 * unit}px ${60 * unit}px rgba(0,0,0,.28)`,
          transform: `scale(${lerp(card, 0.82, 1) * lerp(exit, 1, 0.9)})`,
          opacity: Math.min(1, card * 1.4) * (1 - exit),
          transformOrigin: pos === 'bottom-right' ? 'right center' : pos === 'center' ? 'center' : 'left center',
        }}
      >
        <div
          style={{
            width: avatar,
            height: avatar,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: brand.primary,
            border: `${5 * unit}px solid ${brand.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${ph}) rotate(${lerp(ph, -25, 0)}deg)`,
          }}
        >
          {photo ? (
            <Img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span
              style={{
                fontFamily: fontStack(brand.headingFont),
                fontSize: avatar * 0.38,
                fontWeight: 700,
                color: brand.surface === brand.primary ? brand.text : '#fff',
              }}
            >
              {initials(name)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 * unit }}>
          <div
            style={{
              ...line(l1),
              fontFamily: fontStack(brand.headingFont),
              fontSize: 60 * unit,
              fontWeight: 700,
              lineHeight: 1.05,
              color: fg,
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          {role && (
            <div
              style={{
                ...line(l2),
                fontFamily: fontStack(brand.bodyFont),
                fontSize: 28 * unit,
                fontWeight: 500,
                color: brand.accent,
                whiteSpace: 'nowrap',
              }}
            >
              {role}
            </div>
          )}
          {handle && (
            <div style={line(l3)}>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: fontStack(brand.bodyFont),
                  fontSize: 22 * unit,
                  fontWeight: 600,
                  padding: `${6 * unit}px ${16 * unit}px`,
                  borderRadius: 999,
                  background: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.07)',
                  color: fg,
                }}
              >
                {handle}
              </span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const nameCard: TemplateDef = {
  id: 'name-card',
  name: 'Name Card',
  category: 'Labels',
  description: 'Profile card with photo, name, role and social handle.',
  component: NameCard,
  fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'handle', label: 'Handle / link', type: 'text', placeholder: '@username' },
    { key: 'photo', label: 'Photo', type: 'image' },
    {
      key: 'position',
      label: 'Position',
      type: 'select',
      options: [
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-right', label: 'Bottom right' },
        { value: 'center', label: 'Center' },
      ],
    },
    {
      key: 'theme',
      label: 'Card theme',
      type: 'select',
      options: [
        { value: 'dark', label: 'Brand surface' },
        { value: 'light', label: 'Light' },
      ],
    },
    { key: 'duration', label: 'Duration', type: 'number', min: 2, max: 20, step: 0.5, suffix: 's' },
  ],
  defaults: {
    name: 'Alex Morgan',
    role: 'Creative Director',
    handle: '@alexmakes',
    photo: null,
    position: 'bottom-left',
    theme: 'dark',
    duration: 5,
  },
};
