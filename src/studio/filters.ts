import type { FilterState } from './types';

/** Colour-grade presets. Each is a list of CSS filter functions at full strength. */
export const FILTER_PRESETS: { id: string; name: string; fns: Record<string, number> }[] = [
  { id: 'none', name: 'Original', fns: {} },
  { id: 'bw', name: 'B&W', fns: { grayscale: 1, contrast: 1.1 } },
  { id: 'noir', name: 'Noir', fns: { grayscale: 1, contrast: 1.45, brightness: 0.9 } },
  { id: 'sepia', name: 'Sepia', fns: { sepia: 0.85, contrast: 1.05 } },
  { id: 'vintage', name: 'Vintage', fns: { sepia: 0.45, saturate: 0.75, contrast: 0.92, brightness: 1.06 } },
  { id: 'warm', name: 'Warm', fns: { sepia: 0.28, saturate: 1.3, hue: -10, brightness: 1.03 } },
  { id: 'cool', name: 'Cool', fns: { saturate: 1.1, hue: 18, brightness: 1.02, contrast: 1.05 } },
  { id: 'vivid', name: 'Vivid', fns: { saturate: 1.7, contrast: 1.15 } },
  { id: 'fade', name: 'Fade', fns: { contrast: 0.78, brightness: 1.12, saturate: 0.8 } },
  { id: 'dreamy', name: 'Dreamy', fns: { brightness: 1.12, saturate: 1.2, contrast: 0.9, blur: 0.6 } },
  { id: 'drama', name: 'Drama', fns: { contrast: 1.5, saturate: 0.85, brightness: 0.92 } },
  { id: 'cyber', name: 'Cyber', fns: { hue: 190, saturate: 1.6, contrast: 1.2 } },
  { id: 'golden', name: 'Golden', fns: { sepia: 0.55, saturate: 1.6, hue: -15, contrast: 1.08 } },
  { id: 'teal', name: 'Teal & Orange', fns: { saturate: 1.35, hue: -8, contrast: 1.18 } },
  { id: 'invert', name: 'Negative', fns: { invert: 1 } },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Build a CSS filter string. `unit` scales blur to the render size. */
export function filterCss(f: FilterState | undefined, unit = 1): string | undefined {
  if (!f) return undefined;
  const p = FILTER_PRESETS.find((x) => x.id === f.preset)?.fns ?? {};
  const t = f.intensity / 100;
  const parts: string[] = [];
  const add = (name: string, def: number, mult = 1, suffix = '') => {
    if (p[name] === undefined) return;
    parts.push(`${name === 'hue' ? 'hue-rotate' : name === 'saturate' ? 'saturate' : name}(${lerp(def, p[name], t) * mult}${suffix})`);
  };
  add('grayscale', 0);
  add('sepia', 0);
  add('invert', 0);
  add('saturate', 1);
  add('contrast', 1);
  add('brightness', 1);
  add('hue', 0, 1, 'deg');
  if (p.blur) parts.push(`blur(${p.blur * t * unit}px)`);
  // manual adjustments
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness / 100})`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast / 100})`);
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation / 100})`);
  if (f.hue !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  if (f.blur > 0) parts.push(`blur(${f.blur * unit}px)`);
  return parts.length ? parts.join(' ') : undefined;
}
