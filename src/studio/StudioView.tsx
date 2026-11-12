import { Player, type PlayerRef } from '@remotion/player';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readAsDataURL } from '../editor/store';
import type { Backdrop } from '../editor/store';
import type { Brand, CustomFont, FormatId, ImageAsset } from '../lib/types';
import { FORMATS, FPS, durationInFrames } from '../lib/types';
import { getTemplate } from '../templates/registry';
import { ClipInspector, ProjectInspector } from './Inspector';
import { LeftPanel, TEXT_PRESETS, type LeftTab, type TextPreset } from './LeftPanel';
import type { MediaItem, useStudio } from './store';
import { StudioComp, type StudioProps } from './StudioComp';
import { Timeline, fmtTime } from './Timeline';
import { baseClip, uid, type Clip } from './types';

const BACKDROP_CLS: Record<Backdrop, string> = { checker: 'checker', footage: 'bg-footage', dark: 'bg-black', light: 'bg-white' };

const videoFrames = (src: string) =>
  new Promise<number>((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => resolve(Math.max(15, Math.round((isFinite(v.duration) ? v.duration : 5) * FPS)));
    v.onerror = () => resolve(150);
    v.src = src;
  });

const IconBtn = ({ title, onClick, children, disabled }: { title: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <button type="button" title={title} onClick={onClick} disabled={disabled} className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-ink-300 transition hover:bg-ink-800 hover:text-ink-100 disabled:pointer-events-none disabled:opacity-35">
    {children}
  </button>
);

export const StudioView = ({
  st,
  brand,
  fonts,
  images,
  onUploadImages,
  format,
  backdrop,
}: {
  st: ReturnType<typeof useStudio>;
  brand: Brand;
  fonts: CustomFont[];
  images: ImageAsset[];
  onUploadImages: (files: File[]) => Promise<ImageAsset[]>;
  format: FormatId;
  backdrop: Backdrop;
}) => {
  const { studio, commit, updateClip, dragClip, snapshot, undo, redo, media, setMedia } = st;
  const player = useRef<PlayerRef | null>(null);
  const [playerEl, setPlayerEl] = useState<PlayerRef | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>('templates');
  const importRef = useRef<HTMLInputElement>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pxpf, setPxpf] = useState(3);
  const selected = studio.clips.find((c) => c.id === selectedId) ?? null;
  const f = FORMATS[format];

  const props: StudioProps = useMemo(() => ({ studio, brand, fonts }), [studio, brand, fonts]);

  // keep our playhead in sync with the player
  useEffect(() => {
    const p = playerEl;
    if (!p) return;
    setFrame(p.getCurrentFrame());
    setPlaying(p.isPlaying());
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
    };
  }, [playerEl]);

  const seek = useCallback((fr: number) => {
    player.current?.seekTo(fr);
    setFrame(fr);
  }, []);
  const toggle = () => {
    const p = player.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else {
      if (frame >= studio.duration - 1) p.seekTo(0);
      p.play();
    }
  };

  /* ── adding things ── */
  const place = (clip: Clip) => {
    commit((s) => {
      const top = s.clips.length ? Math.max(...s.clips.map((c) => c.track)) + 1 : 0;
      const start = Math.min(frame, Math.max(0, s.duration - 15));
      const c = { ...clip, track: clip.track ?? top, start };
      c.track = top;
      return { ...s, clips: [...s.clips, c], duration: Math.max(s.duration, start + c.duration) };
    });
    setSelectedId(clip.id);
  };

  const addTemplate = (id: string) => {
    const t = getTemplate(id);
    place(baseClip({ kind: 'template', name: t.name, templateId: id, values: { ...t.defaults }, duration: durationInFrames(t.defaults) }));
  };
  const addText = (p: TextPreset) =>
    place(baseClip({ kind: 'text', name: p.name, text: p.text, textSize: p.textSize, textWeight: p.textWeight, textBg: p.textBg, textFont: p.textFont, textColor: '#ffffff', duration: 120, y: p.name.startsWith('Lower') ? 32 : 0 }));
  const addMedia = (m: MediaItem) => place(baseClip({ kind: 'media', name: m.name, src: m.src, mediaType: m.type, fit: 'cover', duration: m.type === 'video' ? (m.frames ?? 150) : 150, volume: 100, inAnim: 'none', outAnim: 'none' }));
  const setBackground = (m: MediaItem) => {
    commit((s) => ({ ...s, background: { ...s.background, type: m.type, src: m.src, srcType: m.type }, duration: m.type === 'video' && m.frames ? Math.max(s.duration, m.frames) : s.duration }));
    setSelectedId(null);
  };

  const onUploadMedia = async (files: File[]) => {
    const items: MediaItem[] = [];
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const src = URL.createObjectURL(file);
        items.push({ id: uid(), name: file.name, src, type: 'video', frames: await videoFrames(src) });
      } else if (file.type.startsWith('image/')) {
        items.push({ id: uid(), name: file.name, src: await readAsDataURL(file), type: 'image' });
      }
    }
    setMedia((m) => [...items, ...m]);
    const imgs = files.filter((x) => x.type.startsWith('image/'));
    if (imgs.length) onUploadImages(imgs); // also available in template image pickers
    return items;
  };

  const loadDemo = () => {
    const title = getTemplate('title-blur-reveal');
    const lower = getTemplate('label-classic-bar');
    const c1 = baseClip({ kind: 'template', name: title.name, templateId: title.id, values: { ...title.defaults, title: 'Welcome to my channel', subtitle: 'Episode 01' }, start: 0, duration: 120, track: 0 });
    const c2 = baseClip({ kind: 'template', name: lower.name, templateId: lower.id, values: { ...lower.defaults }, start: 120, duration: 150, track: 0 });
    const c3 = baseClip({ kind: 'text', name: 'Caption', text: 'Subscribe for more', textSize: 56, textWeight: 700, textBg: '#000000', textFont: 'body', textColor: '#ffffff', start: 150, duration: 120, track: 1, y: -30, effects: ['pulse'], inAnim: 'pop', outAnim: 'fade' });
    commit((s) => ({ ...s, clips: [c1, c2, c3], duration: Math.max(s.duration, 300), background: { ...s.background, type: 'color', color: '#1d2433' }, overlays: ['vignette'] }));
    setSelectedId(null);
    seek(0);
    setTimeout(() => player.current?.play(), 100);
  };

  /* ── clip operations ── */
  const remove = () => {
    if (!selected) return;
    commit((s) => ({ ...s, clips: s.clips.filter((c) => c.id !== selected.id) }));
    setSelectedId(null);
  };
  const duplicate = () => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), start: selected.start + selected.duration };
    commit((s) => ({ ...s, clips: [...s.clips, copy], duration: Math.max(s.duration, copy.start + copy.duration) }));
    setSelectedId(copy.id);
  };
  const split = () => {
    if (!selected) return;
    const at = frame - selected.start;
    if (at <= 3 || at >= selected.duration - 3) return;
    const a = { ...selected, duration: at, outAnim: 'none' as const };
    const b = { ...selected, id: uid(), start: frame, duration: selected.duration - at, inAnim: 'none' as const, trim: (selected.trim ?? 0) + at };
    commit((s) => ({ ...s, clips: s.clips.flatMap((c) => (c.id === selected.id ? [a, b] : [c])) }));
    setSelectedId(b.id);
  };
  const canSplit = !!selected && frame - selected.start > 3 && frame < selected.start + selected.duration - 3;

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) remove();
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) split();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicate();
      } else if (e.key === 'ArrowLeft') seek(Math.max(0, frame - (e.shiftKey ? FPS : 1)));
      else if (e.key === 'ArrowRight') seek(Math.min(studio.duration - 1, frame + (e.shiftKey ? FPS : 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── preview sizing + drag to move ── */
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ar = f.width / f.height;
  const pw = Math.max(0, Math.min(size.w, size.h * ar));
  const ph = pw / ar;

  const onStageDown = (e: React.PointerEvent) => {
    if (!selected) return;
    snapshot();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const { x, y } = selected;
    const id = selected.id;
    const move = (ev: PointerEvent) => {
      let nx = x + ((ev.clientX - x0) / pw) * 100;
      let ny = y + ((ev.clientY - y0) / ph) * 100;
      if (Math.abs(nx) < 1.5) nx = 0; // snap to centre
      if (Math.abs(ny) < 1.5) ny = 0;
      dragClip(id, { x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="w-[340px] shrink-0 border-r border-ink-700 bg-ink-900">
          <LeftPanel
            tab={leftTab}
            setTab={setLeftTab}
            studio={studio}
            media={media}
            brand={brand}
            fonts={fonts}
            onUploadMedia={onUploadMedia}
            addMedia={addMedia}
            setBackground={setBackground}
            addText={addText}
            addTemplate={addTemplate}
            toggleOverlay={(id) => commit((s) => ({ ...s, overlays: s.overlays.includes(id) ? s.overlays.filter((o) => o !== id) : [...s.overlays, id] }))}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-ink-950">
          <div ref={box} className="relative min-h-0 flex-1 p-5">
            <div className="flex h-full w-full items-center justify-center">
              {pw > 0 && (
                <div className={`relative overflow-hidden rounded-lg ring-1 ring-white/5 ${BACKDROP_CLS[backdrop]}`} style={{ width: pw, height: ph }}>
                  <Player
                    key={format}
                    ref={(r: PlayerRef | null) => {
                      player.current = r;
                      setPlayerEl(r);
                    }}
                    component={StudioComp}
                    inputProps={props}
                    durationInFrames={Math.max(1, studio.duration)}
                    compositionWidth={f.width}
                    compositionHeight={f.height}
                    fps={FPS}
                    style={{ width: '100%', height: '100%' }}
                    loop
                    acknowledgeRemotionLicense
                  />
                  {selected && (
                    <div onPointerDown={onStageDown} className="absolute inset-0 cursor-move" title="Drag to move the selected clip">
                      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-lime">
                        {selected.name} · drag to move
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {studio.clips.length === 0 && studio.background.type === 'none' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto w-[420px] rounded-2xl border border-ink-700 bg-ink-900/95 p-5 text-center shadow-2xl">
                  <div className="text-base font-semibold">Start your edit</div>
                  <p className="mt-1 text-xs text-ink-400">Pick one to begin — everything lands on the timeline below.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => addTemplate('label-classic-bar')} className="rounded-xl border border-ink-700 px-3 py-3 text-left hover:border-lime/60">
                      <div className="text-sm">◆ Motion template</div>
                      <div className="text-[11px] text-ink-400">Adds a lower third</div>
                    </button>
                    <button type="button" onClick={() => addText(TEXT_PRESETS[0])} className="rounded-xl border border-ink-700 px-3 py-3 text-left hover:border-lime/60">
                      <div className="text-sm">T Text</div>
                      <div className="text-[11px] text-ink-400">Adds a big title</div>
                    </button>
                    <button type="button" onClick={() => importRef.current?.click()} className="rounded-xl border border-ink-700 px-3 py-3 text-left hover:border-lime/60">
                      <div className="text-sm">▶ Your video</div>
                      <div className="text-[11px] text-ink-400">Import & use as background</div>
                    </button>
                    <button type="button" onClick={loadDemo} className="rounded-xl bg-lime px-3 py-3 text-left text-ink-950 hover:brightness-110">
                      <div className="text-sm font-semibold">✦ Try a demo</div>
                      <div className="text-[11px] opacity-70">Ready-made 10s edit</div>
                    </button>
                  </div>
                  <input
                    ref={importRef}
                    type="file"
                    hidden
                    accept="video/*,image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = '';
                      const items = await onUploadMedia(files);
                      if (items[0]) setBackground(items[0]);
                      setLeftTab('media');
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* transport + tools */}
          <div className="flex h-11 shrink-0 items-center gap-1 border-t border-ink-700 bg-ink-900 px-3">
            <IconBtn title="Undo (Ctrl+Z)" onClick={undo}>↶</IconBtn>
            <IconBtn title="Redo (Ctrl+Shift+Z)" onClick={redo}>↷</IconBtn>
            <div className="mx-1 h-5 w-px bg-ink-700" />
            <IconBtn title="Split at playhead (S)" onClick={split} disabled={!canSplit}>✂ Split</IconBtn>
            <IconBtn title="Duplicate (Ctrl+D)" onClick={duplicate} disabled={!selected}>⧉ Duplicate</IconBtn>
            <IconBtn title="Delete (Del)" onClick={remove} disabled={!selected}>🗑 Delete</IconBtn>
            <div className="flex flex-1 items-center justify-center gap-3">
              <button type="button" onClick={() => seek(0)} className="text-ink-300 hover:text-ink-100" title="Go to start">⏮</button>
              <button type="button" onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink-950" title="Play / pause (Space)">
                {playing ? '❚❚' : '▶'}
              </button>
              <span className="font-mono text-xs text-ink-300">
                <span className="text-ink-100">{fmtTime(frame)}</span> / {fmtTime(studio.duration)}
              </span>
            </div>
            <span className="text-[11px] text-ink-400">Zoom</span>
            <input type="range" min={0.6} max={10} step={0.2} value={pxpf} onChange={(e) => setPxpf(Number(e.target.value))} className="w-28" />
          </div>
          <div className="h-[230px] shrink-0 border-t border-ink-700">
            <Timeline studio={studio} frame={frame} pxpf={pxpf} selectedId={selectedId} onSeek={seek} onSelect={setSelectedId} onDrag={dragClip} onDragStart={snapshot} />
          </div>
        </main>

        <aside className="w-[320px] shrink-0 border-l border-ink-700 bg-ink-900">
          {selected ? (
            <ClipInspector key={selected.id} clip={selected} update={(p) => updateClip(selected.id, p)} images={images} onUpload={onUploadImages} />
          ) : (
            <ProjectInspector studio={studio} commit={commit} brand={brand} />
          )}
        </aside>
      </div>
    </div>
  );
};
