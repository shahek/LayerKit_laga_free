import { canRenderMediaOnWeb, renderMediaOnWeb } from '@remotion/web-renderer';
import { FORMATS, FPS, durationInFrames, type CompProps, type FormatId, type TemplateDef } from './types';

/**
 * Remotion license: free for individuals and teams up to 3 people.
 * Bigger companies need a key from https://remotion.pro — put it here.
 */
const REMOTION_LICENSE_KEY = 'free-license';

export type WebExportFormat = { id: 'webm-vp9'; label: string; ext: 'webm' };
export const WEBM_VP9: WebExportFormat = { id: 'webm-vp9', label: 'WebM VP9 (alpha)', ext: 'webm' };

/** Checks whether this browser can encode transparent VP9 (Chrome/Edge: yes; Safari/Firefox: often not). */
export async function checkWebExport(format: FormatId) {
  const f = FORMATS[format];
  try {
    const r = await canRenderMediaOnWeb({
      container: 'webm',
      videoCodec: 'vp9',
      width: f.width,
      height: f.height,
      transparent: true,
      muted: true,
    });
    return {
      ok: r.canRender,
      reason: r.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' '),
    };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Renders the current design to a transparent WebM (VP9) Blob, fully in the browser. */
export async function renderWebm({
  template,
  props,
  format,
  onProgress,
  signal,
}: {
  template: TemplateDef;
  props: CompProps;
  format: FormatId;
  onProgress: (p: number) => void;
  signal: AbortSignal;
}): Promise<Blob> {
  const f = FORMATS[format];
  const result = await renderMediaOnWeb({
    composition: {
      id: template.id,
      component: template.component as unknown as React.ComponentType<Record<string, unknown>>,
      width: f.width,
      height: f.height,
      fps: FPS,
      durationInFrames: durationInFrames(props.values),
    },
    inputProps: props as unknown as Record<string, unknown>,
    container: 'webm',
    videoCodec: 'vp9',
    transparent: true,
    muted: true,
    videoBitrate: 'high',
    signal,
    onProgress: (p) => onProgress(p.progress),
    licenseKey: REMOTION_LICENSE_KEY,
  });
  return result.getBlob();
}

type DownloadsNS = {
  save: (r: { filename: string; data: Blob }) => Promise<{ status: 'saved' | 'delivered' }>;
};

/**
 * Saves a file to the device.
 * - Inside a Claude artifact: uses the platform's download prompt.
 * - Anywhere else (localhost, your own domain): a normal browser download.
 */
export async function saveFile(blob: Blob, filename: string): Promise<'saved' | 'declined' | 'failed'> {
  const claude = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
  if (claude?.use) {
    const downloads = (await claude.use('downloads').catch(() => null)) as DownloadsNS | null;
    if (downloads) {
      try {
        await downloads.save({ filename, data: blob });
        return 'saved';
      } catch (e) {
        const code = (e as { code?: string }).code;
        return code === 'declined' ? 'declined' : 'failed';
      }
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'saved';
  } catch {
    return 'failed';
  }
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'overlay';
