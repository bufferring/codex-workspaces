import type { PropsWithChildren } from "react";
import { clsx } from "clsx";

export type FieldProps = PropsWithChildren<{
  label: string;
  description?: string;
  hidden?: boolean;
  htmlFor?: string;
}>;

export function Field({ label, description, hidden, htmlFor, children }: FieldProps) {
  if (hidden) {
    return null;
  }
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-white/90" htmlFor={htmlFor}>
      <span className="flex items-center gap-2">
        {label}
        {description ? <span className="text-xs font-normal text-white/60">{description}</span> : null}
      </span>
      {children}
    </label>
  );
}

export type InputProps = {
  id: string;
  type?: string;
  value: string | number;
  onChange: (next: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
};

export function TextInput({ id, type = "text", value, onChange, min, max, placeholder }: InputProps) {
  return (
    <input
      id={id}
      type={type}
      className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-base text-white shadow-inner shadow-black/20 backdrop-blur transition focus:border-codex-gold focus:outline-none focus:ring-2 focus:ring-codex-gold/50"
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function Checkbox({ id, checked, onChange }: { id: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <input
      id={id}
      type="checkbox"
      className={clsx(
        "h-4 w-4 rounded border border-white/10 bg-white/10 text-codex-gold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codex-gold focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      )}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
