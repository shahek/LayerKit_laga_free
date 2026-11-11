import { Player } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { FORMATS, FPS, durationInFrames, type CompProps, type FormatId, type TemplateDef } from '../lib/types';
import type { Backdrop } from './store';

const BACKDROP_CLS: Record<Backdrop, string> = {
  checker: 'checker',
  footage: 'bg-footage',
  dark: 'bg-black',
  light: 'bg-white',
};

/** Live preview that always fits the available space for any aspect ratio. */
export const Preview = ({ template, props, format, backdrop }: { template: TemplateDef; props: CompProps; format: FormatId; backdrop: Backdrop }) => {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const f = FORMATS[format];

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ar = f.width / f.height;
  const controlsH = 0;
  const w = Math.max(0, Math.min(size.w, (size.h - controlsH) * ar));
  const h = w / ar;

  return (
    <div ref={box} className="flex h-full w-full items-center justify-center">
      {w > 0 && (
        <div className={`overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/5 ${BACKDROP_CLS[backdrop]}`} style={{ width: w, height: h }}>
          <Player
            key={`${template.id}-${format}`}
            component={template.component}
            inputProps={props}
            durationInFrames={durationInFrames(props.values)}
            compositionWidth={f.width}
            compositionHeight={f.height}
            fps={FPS}
            style={{ width: '100%', height: '100%' }}
            controls
            loop
            autoPlay
            clickToPlay
            spaceKeyToPlayOrPause
            acknowledgeRemotionLicense
          />
        </div>
      )}
    </div>
  );
};
