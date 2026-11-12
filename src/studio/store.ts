import { useEffect, useRef, useState } from 'react';
import { DEFAULT_STUDIO, type Clip, type Studio } from './types';

export type MediaItem = { id: string; name: string; src: string; type: 'image' | 'video'; frames?: number };

const KEY = 'layerkit.studio.v1';

/** blob: URLs die with the tab — drop anything that used them when restoring. */
const restore = (): { studio: Studio; media: MediaItem[] } => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { studio: DEFAULT_STUDIO, media: [] };
    const saved = JSON.parse(raw) as { studio: Studio; media: MediaItem[] };
    const alive = (s?: string | null) => !!s && !s.startsWith('blob:');
    const clips = saved.studio.clips.filter((c) => c.kind !== 'media' || alive(c.src));
    const bg = saved.studio.background;
    return {
      studio: {
        ...DEFAULT_STUDIO,
        ...saved.studio,
        clips,
        background: bg.type === 'video' || (bg.type === 'image' && !alive(bg.src)) ? { ...bg, type: 'none', src: null } : bg,
      },
      media: (saved.media ?? []).filter((m) => alive(m.src)),
    };
  } catch {
    return { studio: DEFAULT_STUDIO, media: [] };
  }
};

export function useStudio() {
  const [init] = useState(restore);
  const [studio, setStudio] = useState<Studio>(init.studio);
  const [media, setMedia] = useState<MediaItem[]>(init.media);
  const history = useRef<Studio[]>([]);
  const future = useRef<Studio[]>([]);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ studio, media }));
      } catch {
        /* storage full or unavailable */
      }
    }, 500);
    return () => clearTimeout(id);
  }, [studio, media]);

  /** Every edit goes through here so it can be undone. */
  const commit = (fn: (s: Studio) => Studio) =>
    setStudio((s) => {
      const next = fn(s);
      if (next !== s) {
        history.current = [...history.current.slice(-60), s];
        future.current = [];
      }
      return next;
    });

  const undo = () =>
    setStudio((s) => {
      const prev = history.current.pop();
      if (!prev) return s;
      future.current.push(s);
      return prev;
    });
  const redo = () =>
    setStudio((s) => {
      const nxt = future.current.pop();
      if (!nxt) return s;
      history.current.push(s);
      return nxt;
    });

  const updateClip = (id: string, patch: Partial<Clip>) =>
    commit((s) => ({ ...s, clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  /** Live drag updates — not pushed to history on every pixel. */
  const dragClip = (id: string, patch: Partial<Clip>) =>
    setStudio((s) => ({ ...s, clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const snapshot = () => {
    history.current = [...history.current.slice(-60), studio];
    future.current = [];
  };

  return { studio, setStudio, commit, updateClip, dragClip, snapshot, undo, redo, media, setMedia };
}
