import { PRESET_FONTS, fontStack } from '../lib/fonts';
import type { Brand, CustomFont, ImageAsset } from '../lib/types';
import { DEFAULT_BRAND } from '../templates/registry';
import { ImagePicker } from './ImagePicker';
import { Button, ColorInput, Row, SectionTitle, Select } from './ui';

const PALETTES: { name: string; brand: Partial<Brand> }[] = [
  { name: 'Volt', brand: { primary: '#3B5BFF', accent: '#C6F432', text: '#FFFFFF', surface: '#111216' } },
  { name: 'Ember', brand: { primary: '#FF5A1F', accent: '#FFC53D', text: '#FFFFFF', surface: '#1A0F0A' } },
  { name: 'Paper', brand: { primary: '#111111', accent: '#E8402A', text: '#FFFFFF', surface: '#F4F1EA' } },
  { name: 'Mint', brand: { primary: '#0F766E', accent: '#5EEAD4', text: '#FFFFFF', surface: '#0B1F1D' } },
  { name: 'Royal', brand: { primary: '#6D28D9', accent: '#F0ABFC', text: '#FFFFFF', surface: '#140B26' } },
];

export const BrandPanel = ({
  brand,
  setBrand,
  fonts,
  images,
  onUpload,
  onFontUpload,
}: {
  brand: Brand;
  setBrand: (b: Partial<Brand>) => void;
  fonts: CustomFont[];
  images: ImageAsset[];
  onUpload: (files: File[]) => Promise<ImageAsset[]>;
  onFontUpload: () => void;
}) => {
  const fontOptions = [
    ...fonts.map((f) => ({ value: f.family, label: `${f.family}  · uploaded` })),
    ...PRESET_FONTS.map((f) => ({ value: f, label: f })),
  ];

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-ink-800/60 px-3 py-2.5 text-xs leading-relaxed text-ink-300">
        Brand kit applies to <span className="text-ink-100">every template</span>. Set it once, then switch templates freely.
      </p>

      <section>
        <SectionTitle
          action={
            <button type="button" onClick={onFontUpload} className="text-xs font-medium text-lime hover:underline">
              + Upload font
            </button>
          }
        >
          Typography
        </SectionTitle>
        <div className="space-y-4">
          <Row label="Heading font">
            <Select value={brand.headingFont} options={fontOptions} onChange={(v) => setBrand({ headingFont: v })} style={{ fontFamily: fontStack(brand.headingFont) }} />
          </Row>
          <Row label="Body font">
            <Select value={brand.bodyFont} options={fontOptions} onChange={(v) => setBrand({ bodyFont: v })} style={{ fontFamily: fontStack(brand.bodyFont) }} />
          </Row>
          <div className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
            <div className="truncate text-2xl font-bold" style={{ fontFamily: fontStack(brand.headingFont) }}>
              Aa Bb 123 অআক
            </div>
            <div className="truncate text-sm text-ink-300" style={{ fontFamily: fontStack(brand.bodyFont) }}>
              The quick brown fox jumps over
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Colors</SectionTitle>
        <div className="mb-4 flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              type="button"
              key={p.name}
              onClick={() => setBrand(p.brand)}
              className="group flex items-center gap-1.5 rounded-full border border-ink-700 py-1 pl-1 pr-2.5 text-xs text-ink-300 hover:border-ink-600 hover:text-ink-100"
            >
              <span className="flex -space-x-1">
                {[p.brand.surface, p.brand.primary, p.brand.accent].map((c, i) => (
                  <span key={i} className="h-4 w-4 rounded-full border border-ink-950" style={{ background: c }} />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Primary">
            <ColorInput value={brand.primary} onChange={(v) => setBrand({ primary: v })} />
          </Row>
          <Row label="Accent">
            <ColorInput value={brand.accent} onChange={(v) => setBrand({ accent: v })} />
          </Row>
          <Row label="Text">
            <ColorInput value={brand.text} onChange={(v) => setBrand({ text: v })} />
          </Row>
          <Row label="Surface">
            <ColorInput value={brand.surface} onChange={(v) => setBrand({ surface: v })} />
          </Row>
        </div>
      </section>

      <section>
        <SectionTitle>Logo</SectionTitle>
        <ImagePicker value={brand.logo} images={images} onChange={(src) => setBrand({ logo: src })} onUpload={onUpload} />
      </section>

      <Button variant="subtle" className="w-full" onClick={() => setBrand({ ...DEFAULT_BRAND })}>
        Reset brand kit
      </Button>
    </div>
  );
};
