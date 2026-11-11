import { useState } from 'react';
import { fontStack } from '../lib/fonts';
import type { CustomFont, ImageAsset } from '../lib/types';
import { SectionTitle } from './ui';

export const AssetsPanel = ({
  fonts,
  images,
  onFiles,
  removeFont,
  removeImage,
  pickFiles,
  usedFonts,
}: {
  fonts: CustomFont[];
  images: ImageAsset[];
  onFiles: (files: File[]) => void;
  removeFont: (family: string) => void;
  removeImage: (id: string) => void;
  pickFiles: () => void;
  usedFonts: string[];
}) => {
  const [over, setOver] = useState(false);

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={pickFiles}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition ${
          over ? 'border-lime bg-lime/5' : 'border-ink-600 hover:border-ink-400 hover:bg-ink-800/40'
        }`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-ink-300">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-sm font-medium">Drop fonts or images</div>
        <div className="text-xs text-ink-400">.ttf .otf .woff .woff2 · .png .jpg .svg .webp</div>
      </div>

      <section>
        <SectionTitle>Fonts ({fonts.length})</SectionTitle>
        {fonts.length === 0 ? (
          <p className="text-xs text-ink-400">No uploaded fonts yet. They show up in Brand → Typography.</p>
        ) : (
          <ul className="space-y-1.5">
            {fonts.map((f) => (
              <li key={f.family} className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
                <span className="w-9 text-xl" style={{ fontFamily: fontStack(f.family) }}>
                  Aa
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{f.family}</span>
                  {usedFonts.includes(f.family) && <span className="text-[11px] text-lime">In use</span>}
                </span>
                <button type="button" className="text-xs text-ink-400 hover:text-red-400" onClick={() => removeFont(f.family)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Images ({images.length})</SectionTitle>
        {images.length === 0 ? (
          <p className="text-xs text-ink-400">Upload photos, logos or icons to use in templates.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group checker relative aspect-square overflow-hidden rounded-lg">
                <img src={img.src} alt={img.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-ink-950/80 text-xs text-ink-100 group-hover:flex"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
