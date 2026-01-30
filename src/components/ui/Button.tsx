import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-slate-950",
        variant === "primary" &&
          "bg-codex-blue text-white shadow-lg shadow-codex-blue/40 hover:bg-codex-blue/90 focus-visible:ring-codex-gold",
        variant === "secondary" &&
          "bg-white/10 text-white shadow-sm hover:bg-white/15 focus-visible:ring-codex-gold",
        disabled && "pointer-events-none opacity-60",
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}
