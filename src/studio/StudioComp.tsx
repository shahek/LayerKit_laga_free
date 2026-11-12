import { Video } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontStack, useCustomFonts } from '../lib/fonts';
import type { Brand, CustomFont } from '../lib/types';
import { getTemplate } from '../templates/registry';
import { clipEffectStyle, Overlays, useTransition } from './effects';
import { filterCss } from './filters';
import type { Clip, Studio } from './types';

export type StudioProps = { studio: Studio; brand: Brand; fonts: CustomFont[] };

const ClipContent = ({ clip, brand, fonts, u }: { clip: Clip; brand: Brand; fonts: CustomFont[]; u: number }) => {
  if (clip.kind === 'template' && clip.templateId) {
    const T = getTemplate(clip.templateId).component;
    return <T values={clip.values ?? {}} brand={brand} fonts={fonts} />;
  }
  if (clip.kind === 'media' && clip.src) {
    const style = { width: '100%', height: '100%', objectFit: clip.fit ?? 'cover' } as const;
    return (
      <AbsoluteFill>
        {clip.mediaType === 'video' ? (
          <Video src={clip.src} style={style} objectFit={clip.fit ?? 'cover'} trimBefore={clip.trim || undefined} volume={(clip.volume ?? 100) / 100} muted={(clip.volume ?? 100) === 0} />
        ) : (
          <Img src={clip.src} style={style} />
        )}
      </AbsoluteFill>
    );
  }
  if (clip.kind === 'text') {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80 * u }}>
        <div
          style={{
            fontFamily: fontStack(clip.textFont === 'body' ? brand.bodyFont : brand.headingFont),
            fontSize: (clip.textSize ?? 90) * u,
            fontWeight: clip.textWeight ?? 800,
            color: clip.textColor ?? brand.text,
            lineHeight: 1.1,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            background: clip.textBg ?? undefined,
            padding: clip.textBg ? `${0.15 * (clip.textSize ?? 90) * u}px ${0.4 * (clip.textSize ?? 90) * u}px` : undefined,
            borderRadius: clip.textBg ? 14 * u : undefined,
            textShadow: clip.textBg ? undefined : `0 ${4 * u}px ${24 * u}px rgba(0,0,0,.45)`,
          }}
        >
          {clip.text}
        </div>
      </AbsoluteFill>
    );
  }
  return null;
};

const ClipLayer = ({ clip, brand, fonts }: { clip: Clip; brand: Brand; fonts: CustomFont[] }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const anim = useTransition(clip.inAnim, clip.outAnim, clip.animFrames, u);
  const fx = clipEffectStyle(clip.effects, { f: frame, d: durationInFrames, u, accent: brand.accent });
  const look = [filterCss(clip.filter, u), fx.filter].filter(Boolean).join(' ') || undefined;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${clip.x}%, ${clip.y}%) rotate(${clip.rotation}deg) scale(${clip.scale / 100})`,
        opacity: clip.opacity / 100,
      }}
    >
      <AbsoluteFill style={anim}>
        <AbsoluteFill style={{ transform: fx.transform, opacity: fx.opacity, filter: look }}>
          <ClipContent clip={clip} brand={brand} fonts={fonts} u={u} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The whole edit: background → clips (by track, low to high) → global overlays. */
export const StudioComp: React.FC<StudioProps> = ({ studio, brand, fonts }) => {
  useCustomFonts(fonts);
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const bg = studio.background;
  const bgFilter = filterCss(bg.filter, u);
  const clips = [...studio.clips].sort((a, b) => a.track - b.track);

  return (
    <AbsoluteFill>
      {bg.type === 'color' && <AbsoluteFill style={{ background: bg.color }} />}
      {bg.type === 'image' && bg.src && (
        <AbsoluteFill style={{ filter: bgFilter }}>
          <Img src={bg.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      {bg.type === 'video' && bg.src && (
        <AbsoluteFill style={{ filter: bgFilter }}>
          <Video src={bg.src} style={{ width: '100%', height: '100%' }} objectFit="cover" loop volume={bg.volume / 100} muted={bg.volume === 0} />
        </AbsoluteFill>
      )}
      {clips.map((c) => (
        <Sequence key={c.id} from={c.start} durationInFrames={Math.max(1, c.duration)} layout="none">
          <ClipLayer clip={c} brand={brand} fonts={fonts} />
        </Sequence>
      ))}
      <Overlays ids={studio.overlays} accent={brand.accent} />
    </AbsoluteFill>
  );
};
