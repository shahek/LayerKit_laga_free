import type { Field, ImageAsset, Value, Values } from '../lib/types';
import { ImagePicker } from './ImagePicker';
import { ColorInput, Row, Select, Toggle, inputCls } from './ui';

/** Builds the editing form for any template straight from its field list. */
export const FieldsForm = ({
  fields,
  values,
  onChange,
  images,
  onUpload,
}: {
  fields: Field[];
  values: Values;
  onChange: (key: string, v: Value) => void;
  images: ImageAsset[];
  onUpload: (files: File[]) => Promise<ImageAsset[]>;
}) => (
  <div className="space-y-4">
    {fields.map((f) => {
      const v = values[f.key];
      switch (f.type) {
        case 'text':
          return (
            <Row key={f.key} label={f.label}>
              <input className={inputCls} value={String(v ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
            </Row>
          );
        case 'textarea':
          return (
            <Row key={f.key} label={f.label}>
              <textarea rows={2} className={inputCls + ' resize-none'} value={String(v ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
            </Row>
          );
        case 'color':
          return (
            <Row key={f.key} label={f.label}>
              <ColorInput value={String(v ?? '#ffffff')} onChange={(c) => onChange(f.key, c)} />
            </Row>
          );
        case 'number':
          return (
            <Row key={f.key} label={f.label} hint={`${v ?? f.min}${f.suffix ?? ''}`}>
              <input
                type="range"
                className="w-full"
                min={f.min}
                max={f.max}
                step={f.step ?? 1}
                value={Number(v ?? f.min)}
                onChange={(e) => onChange(f.key, Number(e.target.value))}
              />
            </Row>
          );
        case 'select':
          return (
            <Row key={f.key} label={f.label}>
              <Select value={String(v ?? f.options[0].value)} options={f.options} onChange={(x) => onChange(f.key, x)} />
            </Row>
          );
        case 'toggle':
          return <Toggle key={f.key} label={f.label} checked={Boolean(v)} onChange={(x) => onChange(f.key, x)} />;
        case 'image':
          return (
            <Row key={f.key} label={f.label}>
              <ImagePicker value={(v as string | null) ?? null} images={images} onChange={(src) => onChange(f.key, src)} onUpload={onUpload} />
            </Row>
          );
      }
    })}
  </div>
);
