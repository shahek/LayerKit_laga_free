import type { Values } from '../lib/types';

export type FilterState = {
  preset: string;
  brightness: number; // 100 = normal
  contrast: number;
  saturation: number;
  hue: number; // degrees
  blur: number; // px at 1080p
  intensity: number; // 0..100, how strongly the preset applies
};

export const DEFAULT_FILTER: FilterState = { preset: 'none', brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, intensity: 100 };

export type TransitionId = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'pop' | 'blur' | 'spin' | 'wipe';

export type ClipKind = 'template' | 'text' | 'media';

export type Clip = {
  id: string;
  kind: ClipKind;
  name: string;
  track: number; // 0 = bottom row
  start: number; // frames
  duration: number; // frames
  // content
  templateId?: string;
  values?: Values;
  text?: string;
  textFont?: 'heading' | 'body';
  textSize?: number;
  textColor?: string;
  textWeight?: number;
  textBg?: string | null;
  src?: string;
  mediaType?: 'image' | 'video';
  fit?: 'cover' | 'contain';
  volume?: number; // 0..100
  trim?: number; // frames skipped at the start of a video (after split)
  // transform (percent of frame for x/y)
  x: number;
  y: number;
  scale: number; // 100 = 1x
  rotation: number;
  opacity: number; // 0..100
  // looks
  filter: FilterState;
  effects: string[];
  inAnim: TransitionId;
  outAnim: TransitionId;
  animFrames: number;
};

export type Background = {
  type: 'none' | 'color' | 'image' | 'video';
  color: string;
  src: string | null;
  srcType?: 'image' | 'video';
  filter: FilterState;
  volume: number;
};

export type Studio = {
  clips: Clip[];
  duration: number; // frames
  background: Background;
  overlays: string[]; // global overlay effects
};

export const DEFAULT_STUDIO: Studio = {
  clips: [],
  duration: 300,
  background: { type: 'none', color: '#101114', src: null, filter: { ...DEFAULT_FILTER }, volume: 100 },
  overlays: [],
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const baseClip = (partial: Partial<Clip> & Pick<Clip, 'kind' | 'name'>): Clip => ({
  id: uid(),
  track: 0,
  start: 0,
  duration: 150,
  x: 0,
  y: 0,
  scale: 100,
  rotation: 0,
  opacity: 100,
  filter: { ...DEFAULT_FILTER },
  effects: [],
  inAnim: partial.kind === 'template' ? 'none' : 'fade',
  outAnim: partial.kind === 'template' ? 'none' : 'fade',
  animFrames: 12,
  ...partial,
});
