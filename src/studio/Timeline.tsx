import { useRef } from 'react';
import { FPS } from '../lib/types';
import type { Clip, Studio } from './types';

const ROW = 46;
const HEAD = 72; // track label column

export const fmtTime = (f: number) => {
  const s = f / FPS;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const fr = Math.floor(f % FPS);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(fr).padStart(2, '0')}`;
};

const KIND_COLOR: Record<Clip['kind'], string> = {
  template: 'bg-[#3b5bff]/85 border-[#7d93ff]',
  text: 'bg-[#a855f7]/80 border-[#c99bff]',
  media: 'bg-[#0f9f7a]/80 border-[#4fd8b1]',
};

export const Timeline = ({
  studio,
  frame,
  pxpf,
  selectedId,
  onSeek,
  onSelect,
  onDrag,
  onDragStart,
}: {
  studio: Studio;
  frame: number;
  pxpf: number; // pixels per frame
  selectedId: string | null;
  onSeek: (f: number) => void;
  onSelect: (id: string | null) => void;
  onDrag: (id: string, patch: Partial<Clip>) => void;
  onDragStart: () => void;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const maxTrack = Math.max(0, ...studio.clips.map((c) => c.track));
  const rows = maxTrack + 2; // always one empty row on top to drop onto
  const width = studio.duration * pxpf;

  // ruler ticks: every second, labels every 1/2/5s depending on zoom
  const secPx = FPS * pxpf;
  const labelEvery = secPx > 80 ? 1 : secPx > 35 ? 2 : 5;
  const seconds = Math.ceil(studio.duration / FPS);

  const xToFrame = (clientX: number) => {
    const el = scroller.current!;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(studio.duration - 1, Math.round((clientX - rect.left - HEAD + el.scrollLeft) / pxpf)));
  };

  const seekDrag = (e: React.PointerEvent) => {
    onSeek(xToFrame(e.clientX));
    const move = (ev: PointerEvent) => onSeek(xToFrame(ev.clientX));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const clipDrag = (e: React.PointerEvent, clip: Clip, mode: 'move' | 'left' | 'right') => {
    e.stopPropagation();
    onSelect(clip.id);
    onDragStart();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const { start, duration, track } = clip;
    // snap targets: playhead, 0, other clip edges
    const snaps = [0, frame, ...studio.clips.filter((c) => c.id !== clip.id).flatMap((c) => [c.start, c.start + c.duration])];
    const snap = (f: number) => {
      for (const s of snaps) if (Math.abs(s - f) * pxpf < 8) return s;
      return f;
    };
    const move = (ev: PointerEvent) => {
      const df = Math.round((ev.clientX - x0) / pxpf);
      if (mode === 'move') {
        let ns = snap(Math.max(0, start + df));
        const endSnap = snap(ns + duration);
        if (endSnap !== ns + duration) ns = endSnap - duration;
        const dt = -Math.round((ev.clientY - y0) / ROW);
        onDrag(clip.id, { start: Math.max(0, ns), track: Math.max(0, Math.min(rows, track + dt)) });
      } else if (mode === 'left') {
        const ns = Math.min(start + duration - 5, snap(Math.max(0, start + df)));
        onDrag(clip.id, { start: ns, duration: duration + (start - ns) });
      } else {
        const ne = snap(start + duration + df);
        onDrag(clip.id, { duration: Math.max(5, ne - start) });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div ref={scroller} className="scroll-thin relative h-full overflow-auto bg-ink-950 select-none" onPointerDown={() => onSelect(null)}>
      <div style={{ width: width + HEAD + 80, minHeight: '100%' }} className="relative">
        {/* ruler */}
        <div className="sticky top-0 z-20 flex h-7 border-b border-ink-700 bg-ink-900">
          <div className="sticky left-0 z-10 shrink-0 border-r border-ink-700 bg-ink-900" style={{ width: HEAD }} />
          <div className="relative flex-1 cursor-ew-resize" onPointerDown={(e) => { e.stopPropagation(); seekDrag(e); }}>
            {Array.from({ length: seconds + 1 }, (_, s) => (
              <div key={s} className="absolute top-0 h-full" style={{ left: s * secPx }}>
                <div className={`w-px ${s % labelEvery === 0 ? 'h-3 bg-ink-400' : 'h-1.5 bg-ink-600'}`} />
                {s % labelEvery === 0 && <span className="absolute left-1 top-2.5 text-[10px] text-ink-400">{s}s</span>}
              </div>
            ))}
          </div>
        </div>

        {/* tracks, top row = highest track */}
        {Array.from({ length: rows }, (_, i) => {
          const track = rows - 1 - i;
          const clips = studio.clips.filter((c) => c.track === track);
          return (
            <div key={track} className="relative flex border-b border-ink-800" style={{ height: ROW }}>
              <div className="sticky left-0 z-10 flex shrink-0 items-center border-r border-ink-700 bg-ink-900 px-3 text-[10px] font-medium uppercase tracking-wider text-ink-400" style={{ width: HEAD }}>
                {clips.length ? `Track ${track + 1}` : '+ drop'}
              </div>
              <div className="relative flex-1">
                {clips.map((c) => {
                  const sel = c.id === selectedId;
                  return (
                    <div
                      key={c.id}
                      onPointerDown={(e) => clipDrag(e, c, 'move')}
                      className={`group absolute top-1 bottom-1 cursor-grab overflow-hidden rounded-md border ${KIND_COLOR[c.kind]} ${sel ? 'ring-2 ring-lime ring-offset-1 ring-offset-ink-950' : ''}`}
                      style={{ left: c.start * pxpf, width: Math.max(8, c.duration * pxpf) }}
                      title={c.name}
                    >
                      {c.kind === 'media' && c.mediaType === 'image' && c.src && (
                        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: `url(${c.src})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }} />
                      )}
                      <div className="relative flex h-full items-center gap-1.5 px-2.5 text-[11px] font-medium text-white">
                        <span className="opacity-70">{c.kind === 'template' ? '◆' : c.kind === 'text' ? 'T' : c.mediaType === 'video' ? '▶' : '▣'}</span>
                        <span className="truncate">{c.name}</span>
                        {c.effects.length > 0 && <span className="ml-auto shrink-0 rounded bg-black/30 px-1 text-[9px]">fx {c.effects.length}</span>}
                      </div>
                      <div onPointerDown={(e) => clipDrag(e, c, 'left')} className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-white/0 group-hover:bg-white/30" />
                      <div onPointerDown={(e) => clipDrag(e, c, 'right')} className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-white/0 group-hover:bg-white/30" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* end of project */}
        <div className="pointer-events-none absolute top-7 bottom-0 z-0 bg-black/40" style={{ left: HEAD + width, width: 80 }} />
        {/* playhead */}
        <div className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-lime" style={{ left: HEAD + frame * pxpf }}>
          <div className="absolute -left-[5px] top-0 h-3 w-[11px] rounded-b-sm bg-lime" />
        </div>
      </div>
    </div>
  );
};
