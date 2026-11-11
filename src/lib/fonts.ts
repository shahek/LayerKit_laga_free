import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import type { CustomFont } from './types';

/** Google fonts bundled with the tool (loaded by src/fonts.css). */
export const PRESET_FONTS = [
  'Inter',
  'Space Grotesk',
  'Montserrat',
  'Poppins',
  'Bebas Neue',
  'Anton',
  'Archivo Black',
  'Playfair Display',
  'DM Serif Display',
  'Hind Siliguri',
  'Noto Sans Bengali',
];

const loaded = new Map<string, Promise<void>>();

/** Register a font (data: URL) with the document. Safe to call many times. */
export function registerFont(font: CustomFont): Promise<void> {
  const key = font.family;
  const existing = loaded.get(key);
  if (existing) return existing;
  const p = new FontFace(font.family, `url(${font.src})`)
    .load()
    .then((face) => {
      document.fonts.add(face);
    })
    .catch((err) => {
      console.warn('Font failed to load', font.family, err);
    });
  loaded.set(key, p);
  return p;
}

/**
 * Inside a composition: make sure uploaded fonts (and the preset Google fonts)
 * are ready before a frame is captured. Works in the Player and in CLI renders.
 */
export function useCustomFonts(fonts: CustomFont[]) {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const sig = fonts.map((f) => f.family).join('|');
  useEffect(() => {
    let done = false;
    Promise.all([...fonts.map(registerFont), document.fonts.ready]).finally(() => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, handle]);
}

/** Make a clean family name from an uploaded file name. */
export function familyFromFile(name: string) {
  return (
    name
      .replace(/\.(ttf|otf|woff2?|eot)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .trim() || 'Custom Font'
  );
}

export const fontStack = (family: string) => `"${family}", Inter, system-ui, sans-serif`;
