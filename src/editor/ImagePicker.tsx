import { useRef, useState } from 'react';
import type { ImageAsset } from '../lib/types';

/** Choose an image from the library, upload a new one, or clear it. */
export const ImagePicker = ({
  value,
  images,
  onChange,
  onUpload,
}: {
  value: string | null;
  images: ImageAsset[];
  onChange: (src: string | null) => void;
  onUpload: (files: File[]) => Promise<ImageAsset[]>;
}) => {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 p-2">
      <div className="flex items-center gap-3">
        <div className="checker flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md">
          {value ? <img src={value} className="h-full w-full object-cover" alt="" /> : <span className="text-[10px] text-ink-400">None</span>}
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          <button type="button" className="rounded-md bg-ink-800 px-2.5 py-1.5 text-xs hover:bg-ink-700" onClick={() => fileRef.current?.click()}>
            Upload
          </button>
          {images.length > 0 && (
            <button type="button" className="rounded-md bg-ink-800 px-2.5 py-1.5 text-xs hover:bg-ink-700" onClick={() => setOpen((o) => !o)}>
              Library ({images.length})
            </button>
          )}
          {value && (
            <button type="button" className="rounded-md px-2.5 py-1.5 text-xs text-ink-400 hover:text-ink-100" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {open && images.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {images.map((img) => (
            <button
              type="button"
              key={img.id}
              title={img.name}
              onClick={() => {
                onChange(img.src);
                setOpen(false);
              }}
              className={`checker aspect-square overflow-hidden rounded-md border-2 ${value === img.src ? 'border-lime' : 'border-transparent hover:border-ink-600'}`}
            >
              <img src={img.src} className="h-full w-full object-cover" alt={img.name} />
            </button>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          const added = await onUpload(files);
          if (added[0]) onChange(added[0].src);
        }}
      />
    </div>
  );
};
