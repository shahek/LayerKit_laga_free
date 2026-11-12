import { Thumbnail } from '@remotion/player';
import { useMemo, useRef, useState } from 'react';
import { inputCls } from '../editor/ui';
import { FPS, durationInFrames, type Brand, type CustomFont } from '../lib/types';
import { TEMPLATES } from '../templates/registry';
import { OVERLAYS } from './effects';
import type { MediaItem } from './store';
import type { Studio } from './types';

export type LeftTab = 'media' | 'text' | 'templates' | 'overlays';
type Tab = LeftTab;

export const TEXT_PRESETS = [
  { name: 'Big title', text: 'Big Title', textSize: 140, textWeight: 900, textBg: null as string | null, textFont: 'heading' as const },
  { name: 'Subtitle', text: 'A short subtitle', textSize: 64, textWeight: 600, textBg: null, textFont: 'body' as const },
  { name: 'Caption box', text: 'Caption on a box', textSize: 56, textWeight: 700, textBg: '#000000', textFont: 'body' as const },
  { name: 'Lower caption', text: 'Spoken words go here', textSize: 48, textWeight: 600, textBg: '#00000099', textFont: 'body' as const },
];

export type TextPreset = (typeof TEXT_PRESETS)[number];

export const LeftPanel = ({
  tab,
  setTab,
  studio,
  media,
  brand,
  fonts,
  onUploadMedia,
  addMedia,
  setBackground,
  addText,
  addTemplate,
  toggleOverlay,
}: {
  tab: LeftTab;
  setTab: (t: LeftTab) => void;
  studio: Studio;
  media: MediaItem[];
  brand: Brand;
  fonts: CustomFont[];
  onUploadMedia: (files: File[]) => unknown;
  addMedia: (m: MediaItem) => void;
  setBackground: (m: MediaItem) => void;
  addText: (p: TextPreset) => void;
  addTemplate: (id: string) => void;
  toggleOverlay: (id: string) => void;
}) => {
  const [q, setQ] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const list = useMemo(() => TEMPLATES.filter((t) => (t.name + t.category).toLowerCase().includes(q.toLowerCase())), [q]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'media', label: 'Media', icon: '▣' },
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'templates', label: 'Motion', icon: '◆' },
    { id: 'overlays', label: 'Overlays', icon: '✦' },
  ];

  return (
    <div className="flex h-full">
      <div className="flex w-16 shrink-0 flex-col gap-1 border-r border-ink-700 p-1.5">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-[10px] font-medium transition ${tab === t.id ? 'bg-ink-800 text-lime' : 'text-ink-400 hover:text-ink-100'}`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="scroll-thin min-w-0 flex-1 overflow-y-auto p-3">
        {tab === 'media' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                onUploadMedia(Array.from(e.dataTransfer.files));
              }}
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-3 py-6 text-center ${over ? 'border-lime bg-lime/5' : 'border-ink-600 hover:border-ink-400'}`}
            >
              <div className="text-sm font-medium">Import video or image</div>
              <div className="text-[11px] text-ink-400">Click or drop · .mp4 .webm .mov .png .jpg</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept="video/*,image/*"
              onChange={(e) => {
                onUploadMedia(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              {media.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
                  <div className="checker relative aspect-video">
                    {m.type === 'image' ? <img src={m.src} className="h-full w-full object-cover" alt="" /> : <video src={m.src} className="h-full w-full object-cover" muted />}
                    {m.type === 'video' && <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px]">{((m.frames ?? 0) / FPS).toFixed(1)}s</span>}
                  </div>
                  <div className="truncate px-2 pt-1.5 text-[10px] text-ink-300">{m.name}</div>
                  <div className="flex gap-1 p-1.5">
                    <button type="button" onClick={() => addMedia(m)} className="flex-1 rounded bg-lime py-1 text-[10px] font-semibold text-ink-950">
                      + Add
                    </button>
                    <button type="button" onClick={() => setBackground(m)} className="flex-1 rounded bg-ink-800 py-1 text-[10px] hover:bg-ink-700" title="Use as background">
                      BG
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {media.length === 0 && <p className="text-xs text-ink-400">Your imported clips show here. “+ Add” puts it on the timeline, “BG” makes it the background.</p>}
            <p className="text-[11px] leading-relaxed text-ink-400">Videos stay in this tab only — re-import them after a page reload.</p>
          </div>
        )}

        {tab === 'text' && (
          <div className="space-y-2">
            {TEXT_PRESETS.map((p) => (
              <button
                type="button"
                key={p.name}
                onClick={() => addText(p)}
                className="bg-footage flex h-20 w-full items-center justify-center rounded-lg border border-ink-700 px-3 hover:border-lime/60"
              >
                <span
                  style={{
                    fontWeight: p.textWeight,
                    fontSize: Math.min(26, p.textSize / 4),
                    background: p.textBg ?? undefined,
                    padding: p.textBg ? '2px 8px' : undefined,
                    borderRadius: 4,
                    color: '#fff',
                  }}
                >
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === 'templates' && (
          <div>
            <input className={inputCls + ' mb-3'} placeholder={`Search ${TEMPLATES.length} motion templates…`} value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {list.map((t) => {
                const dur = durationInFrames(t.defaults);
                return (
                  <button type="button" key={t.id} onClick={() => addTemplate(t.id)} className="overflow-hidden rounded-lg border border-ink-700 text-left hover:border-lime/60" title={t.description}>
                    <div className="bg-footage aspect-video w-full">
                      <Thumbnail component={t.component} inputProps={{ values: t.defaults, brand, fonts }} compositionWidth={1920} compositionHeight={1080} frameToDisplay={Math.min(dur - 20, 60)} durationInFrames={dur} fps={FPS} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div className="truncate px-2 py-1 text-[10px]">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'overlays' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-400">Overlays sit on top of the whole video.</p>
            {OVERLAYS.map((o) => {
              const on = studio.overlays.includes(o.id);
              return (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => toggleOverlay(o.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${on ? 'border-lime bg-lime/10' : 'border-ink-700 hover:border-ink-600'}`}
                >
                  {o.name}
                  <span className={`h-3.5 w-3.5 rounded-full border-2 ${on ? 'border-lime bg-lime' : 'border-ink-600'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
