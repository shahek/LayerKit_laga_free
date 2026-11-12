import { useMemo, useRef, useState } from 'react';
import { familyFromFile, registerFont } from '../lib/fonts';
import { FORMATS, type CompProps, type FormatId, type ImageAsset } from '../lib/types';
import { getTemplate } from '../templates/registry';
import { AssetsPanel } from './AssetsPanel';
import { BrandPanel } from './BrandPanel';
import { ExportDialog } from './ExportDialog';
import { FieldsForm } from './FieldsForm';
import { Preview } from './Preview';
import { TemplateList } from './TemplateList';
import { isFontFile, isImageFile, readAsDataURL, useProject, type Backdrop } from './store';
import { Button } from './ui';
import { StudioView } from '../studio/StudioView';
import { StudioExport } from '../studio/StudioExport';
import { useStudio } from '../studio/store';

type Tab = 'content' | 'brand' | 'assets';

const BACKDROPS: { id: Backdrop; label: string; cls: string }[] = [
  { id: 'footage', label: 'Sample footage', cls: 'bg-footage' },
  { id: 'checker', label: 'Transparent', cls: 'checker' },
  { id: 'dark', label: 'Black', cls: 'bg-black' },
  { id: 'light', label: 'White', cls: 'bg-white' },
];

export default function App() {
  const { project, update, setValue, setBrand, resetTemplate, setProject } = useProject();
  const [tab, setTab] = useState<Tab>('content');
  const [mode, setMode] = useState<'templates' | 'studio'>(() => {
    try {
      return location.hash === '#studio' ? 'studio' : 'templates';
    } catch {
      return 'templates';
    }
  });
  const st = useStudio();
  const switchMode = (m: 'templates' | 'studio') => {
    setMode(m);
    try {
      history.replaceState(null, '', m === 'studio' ? '#studio' : '#');
    } catch {
      /* ignore */
    }
  };
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);

  const template = getTemplate(project.templateId);
  const values = project.values[template.id] ?? template.defaults;
  const props: CompProps = useMemo(
    () => ({ values, brand: project.brand, fonts: project.fonts }),
    [values, project.brand, project.fonts],
  );

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /** Handles any mix of font and image files. Returns the images added. */
  const handleFiles = async (files: File[]): Promise<ImageAsset[]> => {
    const fontFiles = files.filter(isFontFile);
    const imageFiles = files.filter(isImageFile);
    const newFonts = await Promise.all(
      fontFiles.map(async (f) => ({ family: familyFromFile(f.name), src: await readAsDataURL(f) })),
    );
    await Promise.all(newFonts.map(registerFont));
    const newImages: ImageAsset[] = await Promise.all(
      imageFiles.map(async (f) => ({ id: crypto.randomUUID(), name: f.name, src: await readAsDataURL(f) })),
    );
    setProject((p) => ({
      ...p,
      fonts: [...p.fonts.filter((x) => !newFonts.some((n) => n.family === x.family)), ...newFonts],
      images: [...newImages, ...p.images],
    }));
    const parts = [
      newFonts.length && `${newFonts.length} font${newFonts.length > 1 ? 's' : ''}`,
      newImages.length && `${newImages.length} image${newImages.length > 1 ? 's' : ''}`,
    ].filter(Boolean);
    if (parts.length) flash(`Added ${parts.join(' and ')}`);
    else if (files.length) flash('Unsupported file type');
    return newImages;
  };

  const onFontInput = async (files: File[]) => {
    const before = project.fonts.length;
    await handleFiles(files);
    // Apply the first uploaded font as the heading font right away
    const fam = files.find(isFontFile);
    if (fam && before >= 0) setBrand({ headingFont: familyFromFile(fam.name) });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink-700 bg-ink-900 px-4">
        <div className="flex w-[440px] items-center gap-2.5">
          <div className="relative h-7 w-7">
            <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-md bg-lime" />
            <span className="absolute inset-0 rounded-md border-2 border-ink-100 bg-ink-900" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">Layerkit</span>
          <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-300">Beta</span>
          <div className="ml-3 flex rounded-lg bg-ink-950 p-1">
            {(['templates', 'studio'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${mode === m ? 'bg-lime text-ink-950' : 'text-ink-400 hover:text-ink-100'}`}
              >
                {m === 'studio' ? '✂ Studio' : 'Templates'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <div className="flex rounded-lg bg-ink-950 p-1">
            {(Object.keys(FORMATS) as FormatId[]).map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => update({ format: id })}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  project.format === id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-100'
                }`}
                title={FORMATS[id].label}
              >
                <span
                  className="inline-block rounded-[2px] border-[1.5px] border-current"
                  style={{ width: id === '9:16' ? 8 : 14, height: id === '16:9' ? 8 : 14 }}
                />
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-[300px] items-center justify-end gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label="Preview background">
            {BACKDROPS.map((b) => (
              <button
                type="button"
                key={b.id}
                title={b.label}
                onClick={() => update({ backdrop: b.id })}
                className={`h-6 w-6 rounded-md ${b.cls} ring-offset-2 ring-offset-ink-900 transition ${
                  project.backdrop === b.id ? 'ring-2 ring-lime' : 'ring-1 ring-ink-600 hover:ring-ink-400'
                }`}
              />
            ))}
          </div>
          <Button variant="primary" onClick={() => setExporting(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </Button>
        </div>
      </header>

      {mode === 'studio' ? (
        <StudioView st={st} brand={project.brand} fonts={project.fonts} images={project.images} onUploadImages={handleFiles} format={project.format} backdrop={project.backdrop} />
      ) : (
      <div className="flex min-h-0 flex-1">
        {/* Templates */}
        <aside className="w-[300px] shrink-0 border-r border-ink-700 bg-ink-900">
          <TemplateList
            activeId={template.id}
            onSelect={(id) => update({ templateId: id })}
            values={project.values}
            brand={project.brand}
            fonts={project.fonts}
          />
        </aside>

        {/* Stage */}
        <main className="flex min-w-0 flex-1 flex-col bg-ink-950">
          <div className="flex items-center justify-between px-6 pt-5">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">{template.category}</div>
              <h1 className="text-lg font-semibold">{template.name}</h1>
            </div>
            <div className="text-xs text-ink-400">
              {FORMATS[project.format].width}×{FORMATS[project.format].height} · 30 fps · {String(values.duration)}s
            </div>
          </div>
          <div className="min-h-0 flex-1 p-6">
            <Preview template={template} props={props} format={project.format} backdrop={project.backdrop} />
          </div>
        </main>

        {/* Inspector */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-ink-700 bg-ink-900">
          <div className="flex gap-1 border-b border-ink-700 p-2">
            {(['content', 'brand', 'assets'] as Tab[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-2 text-xs font-medium capitalize transition ${
                  tab === t ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {t}
                {t === 'assets' && project.fonts.length + project.images.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-ink-700 px-1.5 text-[10px]">{project.fonts.length + project.images.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="scroll-thin flex-1 overflow-y-auto p-4">
            {tab === 'content' && (
              <>
                <FieldsForm fields={template.fields} values={values} onChange={setValue} images={project.images} onUpload={handleFiles} />
                <Button variant="subtle" className="mt-6 w-full" onClick={resetTemplate}>
                  Reset template
                </Button>
              </>
            )}
            {tab === 'brand' && (
              <BrandPanel
                brand={project.brand}
                setBrand={setBrand}
                fonts={project.fonts}
                images={project.images}
                onUpload={handleFiles}
                onFontUpload={() => fontRef.current?.click()}
              />
            )}
            {tab === 'assets' && (
              <AssetsPanel
                fonts={project.fonts}
                images={project.images}
                onFiles={handleFiles}
                pickFiles={() => fileRef.current?.click()}
                usedFonts={[project.brand.headingFont, project.brand.bodyFont]}
                removeFont={(family) =>
                  setProject((p) => ({
                    ...p,
                    fonts: p.fonts.filter((f) => f.family !== family),
                    brand: {
                      ...p.brand,
                      headingFont: p.brand.headingFont === family ? 'Space Grotesk' : p.brand.headingFont,
                      bodyFont: p.brand.bodyFont === family ? 'Inter' : p.brand.bodyFont,
                    },
                  }))
                }
                removeImage={(id) => setProject((p) => ({ ...p, images: p.images.filter((i) => i.id !== id) }))}
              />
            )}
          </div>
        </aside>
      </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept=".ttf,.otf,.woff,.woff2,image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          handleFiles(files);
        }}
      />
      <input
        ref={fontRef}
        type="file"
        multiple
        hidden
        accept=".ttf,.otf,.woff,.woff2"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          onFontInput(files);
        }}
      />

      {exporting && mode === 'studio' && (
        <StudioExport props={{ studio: st.studio, brand: project.brand, fonts: project.fonts }} format={project.format} onClose={() => setExporting(false)} />
      )}
      {exporting && mode === 'templates' && <ExportDialog template={template} props={props} format={project.format} onClose={() => setExporting(false)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-100 px-4 py-2 text-sm font-medium text-ink-950 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
