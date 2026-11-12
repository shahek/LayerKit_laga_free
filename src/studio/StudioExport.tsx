import { useEffect, useRef, useState } from 'react';
import { Button } from '../editor/ui';
import { checkContainer, renderVideo, saveFile } from '../lib/exportWeb';
import { FORMATS, FPS, type FormatId } from '../lib/types';
import { StudioComp, type StudioProps } from './StudioComp';

type Phase = { s: 'idle' } | { s: 'rendering'; p: number } | { s: 'done'; blob: Blob; url: string; saved: string | null } | { s: 'error'; msg: string };

export const StudioExport = ({ props, format, onClose }: { props: StudioProps; format: FormatId; onClose: () => void }) => {
  const f = FORMATS[format];
  const hasBg = props.studio.background.type !== 'none';
  const hasAudio = props.studio.clips.some((c) => c.mediaType === 'video' && (c.volume ?? 100) > 0) || (props.studio.background.type === 'video' && props.studio.background.volume > 0);
  const [container, setContainer] = useState<'webm' | 'mp4'>(hasBg ? 'mp4' : 'webm');
  const [phase, setPhase] = useState<Phase>({ s: 'idle' });
  const [support, setSupport] = useState<{ ok: boolean; reason: string } | null>(null);
  const ac = useRef<AbortController | null>(null);
  const filename = `layerkit-studio-${format.replace(':', 'x')}.${container}`;
  const busy = phase.s === 'rendering';

  useEffect(() => {
    setSupport(null);
    checkContainer(container, f.width, f.height).then(setSupport);
  }, [container, f.width, f.height]);
  useEffect(() => () => ac.current?.abort(), []);

  const start = async () => {
    const c = new AbortController();
    ac.current = c;
    setPhase({ s: 'rendering', p: 0 });
    try {
      const blob = await renderVideo({
        id: 'studio',
        component: StudioComp as unknown as React.ComponentType<Record<string, unknown>>,
        inputProps: props as unknown as Record<string, unknown>,
        width: f.width,
        height: f.height,
        frames: props.studio.duration,
        container,
        muted: !hasAudio,
        signal: c.signal,
        onProgress: (p) => setPhase({ s: 'rendering', p }),
      });
      const url = URL.createObjectURL(blob);
      setPhase({ s: 'done', blob, url, saved: null });
      const saved = await saveFile(blob, filename);
      setPhase({ s: 'done', blob, url, saved });
    } catch (e) {
      setPhase(c.signal.aborted ? { s: 'idle' } : { s: 'error', msg: (e as Error).message });
    }
  };

  const opt = (id: 'webm' | 'mp4', title: string, sub: string) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => setContainer(id)}
      className={`rounded-xl border p-3 text-left ${container === id ? 'border-lime/70 bg-lime/5' : 'border-ink-700 hover:border-ink-600'}`}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-ink-400">{sub}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Export video</h2>
        <p className="mt-1 text-sm text-ink-400">
          {f.width}×{f.height} · {(props.studio.duration / FPS).toFixed(1)}s · {props.studio.clips.length} clips{hasAudio ? ' · with sound' : ''}
        </p>
        <div className="my-5 grid grid-cols-2 gap-2">
          {opt('mp4', 'MP4 (H.264)', 'Plays everywhere · no transparency')}
          {opt('webm', 'WebM VP9', hasBg ? 'Keeps alpha (your background is solid)' : 'Transparent background')}
        </div>

        {support && !support.ok && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            This browser can't encode {container.toUpperCase()} here. Use Chrome or Edge on desktop{container === 'mp4' ? ', or try WebM' : ''}.
          </div>
        )}
        {phase.s === 'rendering' && (
          <div className="rounded-xl bg-ink-900 p-4">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-ink-300">Rendering…</span>
              <span className="font-mono">{Math.round(phase.p * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${phase.p * 100}%` }} />
            </div>
          </div>
        )}
        {phase.s === 'done' && (
          <div className="flex gap-3 rounded-xl bg-ink-900 p-3">
            <video src={phase.url} autoPlay loop muted playsInline className="checker h-24 max-w-[45%] rounded-lg object-contain" />
            <div className="flex flex-col justify-center text-xs">
              <div className="text-sm font-medium">{filename}</div>
              <div className="text-ink-400">{(phase.blob.size / 1e6).toFixed(1)} MB</div>
              <div className="mt-2">{phase.saved === 'saved' ? <span className="text-lime">Sent to your device ✓</span> : phase.saved ? <span className="text-ink-300">Not saved — click Download.</span> : 'Confirm the download…'}</div>
            </div>
          </div>
        )}
        {phase.s === 'error' && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">Render failed: {phase.msg}</div>}
        {phase.s === 'idle' && <div className="rounded-xl bg-ink-900 p-3 text-xs text-ink-300">Renders in your browser and downloads the file. Keep this tab open while it works.</div>}

        <div className="mt-5 flex justify-end gap-2">
          {busy ? <Button onClick={() => ac.current?.abort()}>Cancel</Button> : <Button onClick={onClose}>Close</Button>}
          {phase.s === 'done' ? (
            <Button variant="primary" onClick={async () => setPhase({ ...phase, saved: await saveFile(phase.blob, filename) })}>
              Download
            </Button>
          ) : (
            <Button variant="primary" onClick={busy || support?.ok === false ? undefined : start} className={busy || support?.ok === false ? 'pointer-events-none opacity-50' : ''}>
              {busy ? 'Rendering…' : 'Render & download'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
