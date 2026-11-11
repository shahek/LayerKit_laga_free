import type { ComponentType } from 'react';

/** A single editable control. The editor builds its form from these. */
export type Field =
  | { key: string; label: string; type: 'text' | 'textarea'; placeholder?: string }
  | { key: string; label: string; type: 'color' }
  | { key: string; label: string; type: 'number'; min: number; max: number; step?: number; suffix?: string }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'image' };

export type Value = string | number | boolean | null;
export type Values = Record<string, Value>;

/** Brand kit — applied to every template. */
export type Brand = {
  headingFont: string;
  bodyFont: string;
  primary: string;
  accent: string;
  text: string;
  surface: string;
  logo: string | null;
};

/** A font the user uploaded. `src` is a data: URL so it travels with the project. */
export type CustomFont = { family: string; src: string };
export type ImageAsset = { id: string; name: string; src: string };

/** Props every template composition receives. */
export type CompProps = {
  values: Values;
  brand: Brand;
  fonts: CustomFont[];
};

export type TemplateDef = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: Field[];
  defaults: Values;
  component: ComponentType<CompProps>;
};

export type FormatId = '16:9' | '9:16' | '1:1';
export const FORMATS: Record<FormatId, { width: number; height: number; label: string }> = {
  '16:9': { width: 1920, height: 1080, label: 'Landscape' },
  '9:16': { width: 1080, height: 1920, label: 'Shorts / Reels' },
  '1:1': { width: 1080, height: 1080, label: 'Square' },
};

export const FPS = 30;

/** Every template has a `duration` field in seconds. */
export const durationInFrames = (values: Values) =>
  Math.max(30, Math.round(Number(values.duration ?? 5) * FPS));
