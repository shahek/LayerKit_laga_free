import type { ReactNode } from 'react';

export const Row = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">{label}</span>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
    </div>
    {children}
  </label>
);

export const inputCls =
  'w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none transition placeholder:text-ink-400 focus:border-lime/60 focus:ring-2 focus:ring-lime/15';

export const Select = ({
  value,
  onChange,
  options,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}) => (
  <div className="relative">
    <select
      className={inputCls + ' cursor-pointer appearance-none pr-8'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ fontFamily: style?.fontFamily ? o.value : undefined }}>
          {o.label}
        </option>
      ))}
    </select>
    <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 transition hover:border-ink-600"
  >
    <span>{label}</span>
    <span className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-lime' : 'bg-ink-600'}`}>
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px] bg-ink-950' : 'left-0.5'}`}
      />
    </span>
  </button>
);

export const ColorInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 p-1.5 pr-3 focus-within:border-lime/60">
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 shrink-0" />
    <input
      className="w-full bg-transparent font-mono text-xs uppercase text-ink-100 outline-none"
      value={value}
      onChange={(e) => {
        const v = e.target.value.trim();
        if (/^#[0-9a-f]{0,6}$/i.test(v)) onChange(v);
      }}
    />
  </div>
);

export const Button = ({
  children,
  onClick,
  variant = 'ghost',
  className = '',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'subtle';
  className?: string;
  title?: string;
}) => {
  const v = {
    primary: 'bg-lime text-ink-950 hover:brightness-110 font-semibold',
    ghost: 'border border-ink-700 text-ink-100 hover:border-ink-600 hover:bg-ink-800',
    subtle: 'text-ink-300 hover:bg-ink-800 hover:text-ink-100',
  }[variant];
  return (
    <button type="button" title={title} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${v} ${className}`}>
      {children}
    </button>
  );
};

export const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-xs font-semibold text-ink-100">{children}</h3>
    {action}
  </div>
);
