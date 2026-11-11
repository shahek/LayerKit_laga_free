import { useMemo, useRef, useState } from 'react';
import { FORMATS, type CompProps, type FormatId, type TemplateDef } from '../lib/types';
import { Button } from './ui';

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
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const json = useMemo(() => JSON.stringify({ ...props, format }, null, 2), [props, format]);
  const f = FORMATS[format];
  const cmd = `npx remotion render src/remotion/index.ts ${template.id} out/${template.id}.mov --props=project.json`;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      ref.current?.select();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Export</h2>
            <p className="mt-1 text-sm text-ink-400">
              {template.name} · {f.width}×{f.height} · {props.values.duration}s · transparent
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-lime/40 bg-lime/5 p-3">
            <div className="text-sm font-medium">ProRes 4444 .mov</div>
            <div className="text-xs text-ink-400">Alpha · Premiere, Resolve, FCP</div>
          </div>
          <div className="rounded-xl border border-ink-700 p-3">
            <div className="text-sm font-medium">WebM VP9</div>
            <div className="text-xs text-ink-400">Alpha · CapCut, web</div>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-ink-900 p-3 text-xs leading-relaxed text-ink-300">
          One-click rendering arrives in Phase 3 (render server). For now, save the project JSON below as{' '}
          <code className="text-ink-100">project.json</code> in the repo and run:
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 font-mono text-[11px] text-lime">
            <span className="flex-1 break-all">{cmd}</span>
            <button type="button" className="shrink-0 text-ink-300 hover:text-ink-100" onClick={() => copy(cmd, 'cmd')}>
              {copied === 'cmd' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <textarea ref={ref} readOnly value={json} className="scroll-thin h-40 w-full resize-none rounded-xl border border-ink-700 bg-ink-950 p-3 font-mono text-[11px] text-ink-300 outline-none" />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => copy(json, 'json')}>
            {copied === 'json' ? 'Copied!' : 'Copy project JSON'}
          </Button>
        </div>
      </div>
    </div>
  );
};
