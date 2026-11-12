import { useState } from 'react';
import { FieldsForm } from '../editor/FieldsForm';
import { ColorInput, Row, Select, Toggle, inputCls } from '../editor/ui';
import type { Brand, ImageAsset } from '../lib/types';
import { FPS } from '../lib/types';
import { getTemplate } from '../templates/registry';
import { CLIP_EFFECTS, TRANSITIONS } from './effects';
import { FILTER_PRESETS, filterCss } from './filters';
import { DEFAULT_FILTER, type Clip, type FilterState, type Studio } from './types';

type Tab = 'edit' | 'transform' | 'filters' | 'effects' | 'animate';

const Slider = ({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) => (
  <Row label={label} hint={`${Math.round(value * 10) / 10}${suffix}`}>
    <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </Row>
);

/** Filter presets as swatches + manual adjustments. Also used for the background. */
export const FilterPanel = ({ value, onChange, sample }: { value: FilterState; onChange: (f: FilterState) => void; sample?: string | null }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-2">
      {FILTER_PRESETS.map((p) => {
        const active = value.preset === p.id;
        return (
          <button type="button" key={p.id} onClick={() => onChange({ ...value, preset: p.id })} className={`overflow-hidden rounded-lg border text-left ${active ? 'border-lime' : 'border-ink-700 hover:border-ink-600'}`}>
            <div
              className="bg-footage aspect-square w-full"
              style={{
                filter: filterCss({ ...DEFAULT_FILTER, preset: p.id }, 0.3),
                backgroundImage: sample ? `url(${sample})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="truncate px-1.5 py-1 text-[10px]">{p.name}</div>
          </button>
        );
      })}
    </div>
    {value.preset !== 'none' && <Slider label="Filter strength" value={value.intensity} min={0} max={100} suffix="%" onChange={(v) => onChange({ ...value, intensity: v })} />}
    <div className="space-y-4 border-t border-ink-700 pt-4">
      <div className="text-xs font-semibold">Adjust</div>
      <Slider label="Brightness" value={value.brightness} min={30} max={180} suffix="%" onChange={(v) => onChange({ ...value, brightness: v })} />
      <Slider label="Contrast" value={value.contrast} min={30} max={200} suffix="%" onChange={(v) => onChange({ ...value, contrast: v })} />
      <Slider label="Saturation" value={value.saturation} min={0} max={250} suffix="%" onChange={(v) => onChange({ ...value, saturation: v })} />
      <Slider label="Hue" value={value.hue} min={-180} max={180} suffix="°" onChange={(v) => onChange({ ...value, hue: v })} />
      <Slider label="Blur" value={value.blur} min={0} max={30} step={0.5} suffix="px" onChange={(v) => onChange({ ...value, blur: v })} />
      <button type="button" className="w-full rounded-lg py-2 text-xs text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => onChange({ ...DEFAULT_FILTER })}>
        Reset filter
      </button>
    </div>
  </div>
);

export const ClipInspector = ({
  clip,
  update,
  images,
  onUpload,
}: {
  clip: Clip;
  update: (patch: Partial<Clip>) => void;
  images: ImageAsset[];
  onUpload: (files: File[]) => Promise<ImageAsset[]>;
}) => {
  const [tab, setTab] = useState<Tab>('edit');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'transform', label: 'Move' },
    { id: 'filters', label: 'Filters' },
    { id: 'effects', label: 'Effects' },
    { id: 'animate', label: 'Animate' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-0.5 border-b border-ink-700 p-1.5">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md py-1.5 text-[11px] font-medium transition ${tab === t.id ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:text-ink-100'}`}
          >
            {t.label}
            {t.id === 'effects' && clip.effects.length > 0 && <span className="ml-1 text-lime">{clip.effects.length}</span>}
          </button>
        ))}
      </div>
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        {tab === 'edit' && (
          <>
            <Row label="Clip name">
              <input className={inputCls} value={clip.name} onChange={(e) => update({ name: e.target.value })} />
            </Row>
            {clip.kind === 'template' && clip.templateId && (
              <FieldsForm
                fields={getTemplate(clip.templateId).fields.filter((f) => f.key !== 'duration')}
                values={clip.values ?? {}}
                onChange={(k, v) => update({ values: { ...clip.values, [k]: v } })}
                images={images}
                onUpload={onUpload}
              />
            )}
            {clip.kind === 'text' && (
              <>
                <Row label="Text">
                  <textarea rows={3} className={inputCls + ' resize-none'} value={clip.text ?? ''} onChange={(e) => update({ text: e.target.value })} />
                </Row>
                <Row label="Font">
                  <Select
                    value={clip.textFont ?? 'heading'}
                    options={[
                      { value: 'heading', label: 'Brand heading font' },
                      { value: 'body', label: 'Brand body font' },
                    ]}
                    onChange={(v) => update({ textFont: v as 'heading' | 'body' })}
                  />
                </Row>
                <Slider label="Size" value={clip.textSize ?? 90} min={20} max={260} suffix="px" onChange={(v) => update({ textSize: v })} />
                <Slider label="Weight" value={clip.textWeight ?? 800} min={300} max={900} step={100} onChange={(v) => update({ textWeight: v })} />
                <Row label="Color">
                  <ColorInput value={clip.textColor ?? '#ffffff'} onChange={(v) => update({ textColor: v })} />
                </Row>
                <Toggle label="Background box" checked={!!clip.textBg} onChange={(on) => update({ textBg: on ? '#000000' : null })} />
                {clip.textBg && (
                  <Row label="Box color">
                    <ColorInput value={clip.textBg} onChange={(v) => update({ textBg: v })} />
                  </Row>
                )}
              </>
            )}
            {clip.kind === 'media' && (
              <>
                <Row label="Fit">
                  <Select
                    value={clip.fit ?? 'cover'}
                    options={[
                      { value: 'cover', label: 'Fill frame (crop)' },
                      { value: 'contain', label: 'Fit inside' },
                    ]}
                    onChange={(v) => update({ fit: v as 'cover' | 'contain' })}
                  />
                </Row>
                {clip.mediaType === 'video' && <Slider label="Volume" value={clip.volume ?? 100} min={0} max={100} suffix="%" onChange={(v) => update({ volume: v })} />}
              </>
            )}
            <div className="grid grid-cols-2 gap-3 border-t border-ink-700 pt-4">
              <Row label="Start (s)">
                <input type="number" step={0.1} min={0} className={inputCls} value={Math.round((clip.start / FPS) * 10) / 10} onChange={(e) => update({ start: Math.max(0, Math.round(Number(e.target.value) * FPS)) })} />
              </Row>
              <Row label="Length (s)">
                <input type="number" step={0.1} min={0.2} className={inputCls} value={Math.round((clip.duration / FPS) * 10) / 10} onChange={(e) => update({ duration: Math.max(6, Math.round(Number(e.target.value) * FPS)) })} />
              </Row>
            </div>
          </>
        )}

        {tab === 'transform' && (
          <>
            <p className="rounded-lg bg-ink-800/60 px-3 py-2 text-xs text-ink-300">Tip: drag on the preview to move the selected clip.</p>
            <Slider label="Position X" value={clip.x} min={-60} max={60} step={0.5} suffix="%" onChange={(v) => update({ x: v })} />
            <Slider label="Position Y" value={clip.y} min={-60} max={60} step={0.5} suffix="%" onChange={(v) => update({ y: v })} />
            <Slider label="Scale" value={clip.scale} min={10} max={300} suffix="%" onChange={(v) => update({ scale: v })} />
            <Slider label="Rotation" value={clip.rotation} min={-180} max={180} suffix="°" onChange={(v) => update({ rotation: v })} />
            <Slider label="Opacity" value={clip.opacity} min={0} max={100} suffix="%" onChange={(v) => update({ opacity: v })} />
            <button type="button" className="w-full rounded-lg py-2 text-xs text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => update({ x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 })}>
              Reset position
            </button>
          </>
        )}

        {tab === 'filters' && <FilterPanel value={clip.filter} onChange={(f) => update({ filter: f })} sample={clip.kind === 'media' && clip.mediaType === 'image' ? clip.src : null} />}

        {tab === 'effects' && (
          <>
            <p className="text-xs text-ink-400">Tap to turn on. Combine as many as you like.</p>
            <div className="grid grid-cols-2 gap-2">
              {CLIP_EFFECTS.map((e) => {
                const on = clip.effects.includes(e.id);
                return (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => update({ effects: on ? clip.effects.filter((x) => x !== e.id) : [...clip.effects, e.id] })}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${on ? 'border-lime bg-lime/10 text-ink-100' : 'border-ink-700 text-ink-300 hover:border-ink-600'}`}
                  >
                    <span className="w-4 text-center">{e.icon}</span>
                    {e.name}
                  </button>
                );
              })}
            </div>
            {clip.effects.length > 0 && (
              <button type="button" className="w-full rounded-lg py-2 text-xs text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => update({ effects: [] })}>
                Clear effects
              </button>
            )}
          </>
        )}

        {tab === 'animate' && (
          <>
            {clip.kind === 'template' && <p className="rounded-lg bg-ink-800/60 px-3 py-2 text-xs text-ink-300">Templates already animate in and out. Add extra motion here if you want.</p>}
            {(['inAnim', 'outAnim'] as const).map((k) => (
              <div key={k}>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">{k === 'inAnim' ? 'In animation' : 'Out animation'}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {TRANSITIONS.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => update({ [k]: t.id })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] ${clip[k] === t.id ? 'border-lime bg-lime/10' : 'border-ink-700 text-ink-300 hover:border-ink-600'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Slider label="Animation length" value={clip.animFrames / FPS} min={0.1} max={2} step={0.1} suffix="s" onChange={(v) => update({ animFrames: Math.round(v * FPS) })} />
          </>
        )}
      </div>
    </div>
  );
};

export const ProjectInspector = ({
  studio,
  commit,
  brand,
}: {
  studio: Studio;
  commit: (fn: (s: Studio) => Studio) => void;
  brand: Brand;
}) => {
  const bg = studio.background;
  const setBg = (patch: Partial<Studio['background']>) => commit((s) => ({ ...s, background: { ...s.background, ...patch } }));
  return (
    <div className="scroll-thin h-full space-y-5 overflow-y-auto p-4">
      <div>
        <div className="text-sm font-semibold">Project</div>
        <p className="mt-1 text-xs text-ink-400">Select a clip on the timeline to edit it.</p>
      </div>
      <Slider label="Video length" value={studio.duration / FPS} min={2} max={120} step={0.5} suffix="s" onChange={(v) => commit((s) => ({ ...s, duration: Math.round(v * FPS) }))} />
      <div className="space-y-3 border-t border-ink-700 pt-4">
        <div className="text-xs font-semibold">Background</div>
        <Select
          value={bg.type}
          options={[
            { value: 'none', label: 'Transparent' },
            { value: 'color', label: 'Solid color' },
            ...(bg.src && bg.srcType ? [{ value: bg.srcType, label: bg.srcType === 'video' ? 'Video (from Media)' : 'Image (from Media)' }] : []),
          ]}
          onChange={(v) => setBg({ type: v as Studio['background']['type'] })}
        />
        {bg.type === 'color' && <ColorInput value={bg.color} onChange={(v) => setBg({ color: v })} />}
        {bg.type === 'video' && <Slider label="Background volume" value={bg.volume} min={0} max={100} suffix="%" onChange={(v) => setBg({ volume: v })} />}
        {(bg.type === 'image' || bg.type === 'video') && (
          <details className="rounded-lg border border-ink-700 p-3">
            <summary className="cursor-pointer text-xs font-medium">Background filter</summary>
            <div className="mt-3">
              <FilterPanel value={bg.filter} onChange={(f) => setBg({ filter: f })} sample={bg.type === 'image' ? bg.src : null} />
            </div>
          </details>
        )}
        {bg.type === 'none' && <p className="text-xs text-ink-400">Transparent background — export as WebM to keep it see-through.</p>}
      </div>
      <div className="text-[11px] text-ink-400">
        Accent color for glow & frame comes from Brand: <span style={{ color: brand.accent }}>■</span> {brand.accent}
      </div>
    </div>
  );
};
