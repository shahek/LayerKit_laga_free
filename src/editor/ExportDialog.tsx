import { useEffect, useMemo, useRef, useState } from 'react';
import { checkWebExport, renderWebm, saveFile, slug } from '../lib/exportWeb';
import { FORMATS, type CompProps, type FormatId, type TemplateDef } from '../lib/types';
import { Button } from './ui';

type Kind = 'webm' | 'prores';
type Phase =
  | { s: 'idle' }
  | { s: 'rendering'; progress: number }
  | { s: 'done'; blob: Blob; url: string; saved: 'saved' | 'declined' | 'failed' | null }
  | { s: 'error'; message: string };

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);

export const ExportDialog = ({
  template,
  props,
  format,
  onClose,
}: {
  template: TemplateDef;
  props: CompProps;
  format: FormatId;
  onClose: () => void;
}) => {
  const [kind, setKind] = useState<Kind>('webm');
  const [phase, setPhase] = useState<Phase>({ s: 'idle' });
  const [support, setSupport] = useState<{ ok: boolean; reason: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const f = FORMATS[format];
  const json = useMemo(() => JSON.stringify({ ...props, format }, null, 2), [props, format]);
  const cmd = `npx remotion render src/remotion/index.ts ${template.id} out/${template.id}.mov --props=project.json`;
  const firstText = String(props.values.name ?? props.values.title ?? template.name);
  const filename = `${slug(template.name)}-${slug(firstText)}-${format.replace(':', 'x')}.webm`;
  const busy = phase.s === 'rendering';

  useEffect(() => {
    checkWebExport(format).then(setSupport);
  }, [format]);

  // Clean up blob URL and stop rendering when the dialog closes
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );
  useEffect(() => () => void (phase.s === 'done' && URL.revokeObjectURL(phase.url)), [phase]);

  const start = async () => {
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase({ s: 'rendering', progress: 0 });
    try {
      const blob = await renderWebm({
        template,
        props,
        format,
        signal: ac.signal,
        onProgress: (p) => setPhase({ s: 'rendering', progress: p }),
      });
      const url = URL.createObjectURL(blob);
      setPhase({ s: 'done', blob, url, saved: null });
      const saved = await saveFile(blob, filename);
      setPhase({ s: 'done', blob, url, saved });
    } catch (e) {
      if (ac.signal.aborted) setPhase({ s: 'idle' });
      else setPhase({ s: 'error', message: (e as Error).message || 'Render failed' });
    }
  };

  const downloadAgain = async () => {
    if (phase.s !== 'done') return;
    const saved = await saveFile(phase.blob, filename);
    setPhase({ ...phase, saved });
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      jsonRef.current?.select();
    }
  };

  const close = () => {
    if (busy) abortRef.current?.abort();
    onClose();
  };

  const card = (k: Kind, title: string, sub: string) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => setKind(k)}
      className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${
        kind === k ? 'border-lime/70 bg-lime/5' : 'border-ink-700 hover:border-ink-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className={`h-3.5 w-3.5 rounded-full border-2 ${kind === k ? 'border-lime bg-lime' : 'border-ink-600'}`} />
      </div>
      <div className="mt-0.5 text-xs text-ink-400">{sub}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={close}>
      <div className="w-full max-w-xl rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Export</h2>
            <p className="mt-1 text-sm text-ink-400">
              {template.name} · {f.width}×{f.height} · {String(props.values.duration)}s · transparent
            </p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {card('webm', 'WebM VP9', 'Alpha · renders in browser · CapCut, web, Premiere')}
          {card('prores', 'ProRes 4444 .mov', 'Alpha · desktop render · Premiere, Resolve, FCP')}
        </div>

        {kind === 'webm' && (
          <div>
            {support && !support.ok && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
                This browser can't encode transparent VP9. Open Layerkit in Chrome or Edge on desktop.
                {support.reason && <div className="mt-1 text-amber-200/70">{support.reason}</div>}
              </div>
            )}

            {phase.s === 'idle' && (
              <div className="rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-ink-300">
                Renders frame by frame in your browser, then saves <span className="text-ink-100">{filename}</span> to your device. Keep this tab open while it works.
              </div>
            )}

            {phase.s === 'rendering' && (
              <div className="rounded-xl bg-ink-900 p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-ink-300">Rendering frames…</span>
                  <span className="font-mono text-ink-100">{Math.round(phase.progress * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-lime transition-[width] duration-200" style={{ width: `${phase.progress * 100}%` }} />
                </div>
              </div>
            )}

            {phase.s === 'done' && (
              <div className="flex gap-4 rounded-xl bg-ink-900 p-3">
                <video src={phase.url} autoPlay loop muted playsInline className="checker h-24 w-auto max-w-[45%] rounded-lg object-contain" />
                <div className="flex min-w-0 flex-1 flex-col justify-center text-xs">
                  <div className="truncate text-sm font-medium text-ink-100">{filename}</div>
                  <div className="mt-0.5 text-ink-400">{fmtSize(phase.blob.size)} · VP9 with alpha</div>
                  <div className="mt-2">
                    {phase.saved === 'saved' && <span className="text-lime">Sent to your device ✓</span>}
                    {phase.saved === 'declined' && <span className="text-ink-300">Download cancelled — click Download to try again.</span>}
                    {phase.saved === 'failed' && <span className="text-amber-300">Couldn't save here — click Download to try again.</span>}
                    {phase.saved === null && <span className="text-ink-300">Confirm the download prompt…</span>}
                  </div>
                </div>
              </div>
            )}

            {phase.s === 'error' && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">Render failed: {phase.message}</div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {busy ? (
                <Button onClick={() => abortRef.current?.abort()}>Cancel</Button>
              ) : (
                <Button onClick={close}>Close</Button>
              )}
              {phase.s === 'done' ? (
                <>
                  <Button onClick={start}>Render again</Button>
                  <Button variant="primary" onClick={downloadAgain}>
                    Download
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={busy || support?.ok === false ? undefined : start} className={busy || support?.ok === false ? 'pointer-events-none opacity-50' : ''}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {busy ? 'Rendering…' : phase.s === 'error' ? 'Try again' : 'Render & download'}
                </Button>
              )}
            </div>
          </div>
        )}

        {kind === 'prores' && (
          <div>
            <div className="mb-4 rounded-xl bg-ink-900 p-3 text-xs leading-relaxed text-ink-300">
              Browsers can't encode ProRes, so this one renders on your computer. Save the project JSON as{' '}
              <code className="text-ink-100">project.json</code> in the Layerkit folder and run:
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 font-mono text-[11px] text-lime">
                <span className="flex-1 break-all">{cmd}</span>
                <button type="button" className="shrink-0 text-ink-300 hover:text-ink-100" onClick={() => copy(cmd, 'cmd')}>
                  {copied === 'cmd' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <textarea ref={jsonRef} readOnly value={json} className="scroll-thin h-32 w-full resize-none rounded-xl border border-ink-700 bg-ink-950 p-3 font-mono text-[11px] text-ink-300 outline-none" />
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={close}>Close</Button>
              <Button variant="primary" onClick={() => copy(json, 'json')}>
                {copied === 'json' ? 'Copied!' : 'Copy project JSON'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
