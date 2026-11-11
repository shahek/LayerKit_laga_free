import { Composition, type CalculateMetadataFunction } from 'remotion';
import { DEFAULT_BRAND, TEMPLATES } from '../templates/registry';
import { FORMATS, FPS, durationInFrames, type CompProps, type FormatId } from '../lib/types';

type RenderProps = CompProps & { format: FormatId };

const calc: CalculateMetadataFunction<RenderProps> = ({ props }) => {
  const f = FORMATS[props.format] ?? FORMATS['16:9'];
  return { width: f.width, height: f.height, durationInFrames: durationInFrames(props.values) };
};

/**
 * Remotion entry used for rendering transparent video from the command line.
 * Each template is one composition; size and length come from the props.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {TEMPLATES.map((t) => (
      <Composition
        key={t.id}
        id={t.id}
        component={t.component as unknown as React.FC<RenderProps>}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={150}
        defaultProps={{ values: t.defaults, brand: DEFAULT_BRAND, fonts: [], format: '16:9' } as RenderProps}
        calculateMetadata={calc}
      />
    ))}
  </>
);
