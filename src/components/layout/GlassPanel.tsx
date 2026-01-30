import type { PropsWithChildren } from "react";

export function GlassPanel({ children }: PropsWithChildren) {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur-2xl sm:p-8">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent sm:inset-x-10" />
      {children}
    </section>
  );
}
