import type { Brand, TemplateDef } from '../lib/types';
import { bigTitle } from './BigTitle';
import { lowerThird } from './LowerThird';
import { nameCard } from './NameCard';
import { LABEL_FX } from './fx/labels';
import { TITLE_FX } from './fx/titles';

/**
 * Every template lives here. To add a new one:
 *   1. create src/templates/MyTemplate.tsx exporting a TemplateDef
 *   2. add it to this array — the editor, thumbnails and CLI render pick it up automatically.
 */
export const TEMPLATES: TemplateDef[] = [lowerThird, nameCard, ...LABEL_FX, bigTitle, ...TITLE_FX];

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export const DEFAULT_BRAND: Brand = {
  headingFont: 'Space Grotesk',
  bodyFont: 'Inter',
  primary: '#3B5BFF',
  accent: '#C6F432',
  text: '#FFFFFF',
  surface: '#111216',
  logo: null,
};
