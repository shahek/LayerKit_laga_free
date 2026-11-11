import { useEffect, useState } from 'react';
import { registerFont } from '../lib/fonts';
import type { Brand, CustomFont, FormatId, ImageAsset, Values } from '../lib/types';
import { DEFAULT_BRAND, TEMPLATES } from '../templates/registry';

export type Backdrop = 'checker' | 'footage' | 'dark' | 'light';

export type Project = {
  templateId: string;
  format: FormatId;
  backdrop: Backdrop;
  values: Record<string, Values>; // per template, so switching keeps your edits
  brand: Brand;
  fonts: CustomFont[];
  images: ImageAsset[];
};

const KEY = 'layerkit.project.v1';

const initial = (): Project => {
  const base: Project = {
    templateId: TEMPLATES[0].id,
    format: '16:9',
    backdrop: 'footage',
    values: Object.fromEntries(TEMPLATES.map((t) => [t.id, { ...t.defaults }])),
    brand: { ...DEFAULT_BRAND },
    fonts: [],
    images: [],
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Project>;
    return {
      ...base,
      ...saved,
      values: { ...base.values, ...(saved.values ?? {}) },
      brand: { ...base.brand, ...(saved.brand ?? {}) },
    };
  } catch {
    return base;
  }
};

export function useProject() {
  const [project, setProject] = useState<Project>(initial);

  // Uploaded fonts must be registered with the browser after a reload too.
  useEffect(() => {
    project.fonts.forEach(registerFont);
  }, [project.fonts]);

  // Remember the project in this browser (best effort — big uploads may not fit).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(project));
      } catch {
        try {
          localStorage.setItem(KEY, JSON.stringify({ ...project, images: [], fonts: [] }));
        } catch {
          /* storage unavailable */
        }
      }
    }, 400);
    return () => clearTimeout(id);
  }, [project]);

  const update = (patch: Partial<Project>) => setProject((p) => ({ ...p, ...patch }));
  const setValue = (key: string, value: Values[string]) =>
    setProject((p) => ({
      ...p,
      values: { ...p.values, [p.templateId]: { ...p.values[p.templateId], [key]: value } },
    }));
  const setBrand = (patch: Partial<Brand>) => setProject((p) => ({ ...p, brand: { ...p.brand, ...patch } }));
  const resetTemplate = () =>
    setProject((p) => {
      const t = TEMPLATES.find((x) => x.id === p.templateId)!;
      return { ...p, values: { ...p.values, [p.templateId]: { ...t.defaults } } };
    });

  return { project, update, setValue, setBrand, resetTemplate, setProject };
}

export const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export const isFontFile = (f: File) => /\.(ttf|otf|woff2?)$/i.test(f.name);
export const isImageFile = (f: File) => f.type.startsWith('image/');
