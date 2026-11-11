import { Thumbnail } from '@remotion/player';
import { useMemo, useState } from 'react';
import { FPS, durationInFrames, type Brand, type CustomFont, type Values } from '../lib/types';
import { TEMPLATES } from '../templates/registry';
import { inputCls } from './ui';

export const TemplateList = ({
  activeId,
  onSelect,
  values,
  brand,
  fonts,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  values: Record<string, Values>;
  brand: Brand;
  fonts: CustomFont[];
}) => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const cats = ['All', ...new Set(TEMPLATES.map((t) => t.category))];
  const groups = useMemo(() => {
    const list = TEMPLATES.filter(
      (t) => (cat === 'All' || t.category === cat) && (t.name + t.category + t.description).toLowerCase().includes(q.toLowerCase()),
    );
    const map = new Map<string, typeof list>();
    list.forEach((t) => map.set(t.category, [...(map.get(t.category) ?? []), t]));
    return [...map.entries()];
  }, [q, cat]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-3">
        <input className={inputCls} placeholder={`Search ${TEMPLATES.length} templates…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 flex gap-1.5">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${cat === c ? 'bg-lime text-ink-950' : 'bg-ink-800 text-ink-300 hover:text-ink-100'}`}
            >
              {c}
              <span className="ml-1 opacity-60">{c === 'All' ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === c).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-4 pb-6">
        {groups.map(([cat, items]) => (
          <div key={cat}>
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">
              <span>{cat}</span>
              <span>{items.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((t) => {
                const v = values[t.id] ?? t.defaults;
                const dur = durationInFrames(v);
                const active = t.id === activeId;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    title={t.description}
                    className={`group block w-full overflow-hidden rounded-lg border text-left transition ${
                      active ? 'border-lime/70 bg-ink-800' : 'border-ink-700 bg-ink-900 hover:border-ink-600'
                    }`}
                  >
                    <div className="bg-footage aspect-video w-full">
                      <Thumbnail
                        component={t.component}
                        inputProps={{ values: v, brand, fonts }}
                        compositionWidth={1920}
                        compositionHeight={1080}
                        frameToDisplay={Math.min(dur - 20, 60)}
                        durationInFrames={dur}
                        fps={FPS}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <div className="truncate px-2 py-1.5 text-[11px] font-medium">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-xs text-ink-400">No templates match “{q}”.</p>}
      </div>
    </div>
  );
};
