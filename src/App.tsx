import { useTranslation } from "react-i18next";
import { CodexLogo } from "./components/logo/CodexLogo";
import { GlassPanel } from "./components/layout/GlassPanel";
import { LanguageSwitcher } from "./components/ui/LanguageSwitcher";
import { SetupForm } from "./sections/SetupForm";

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-codex-blue/45 px-4 py-4 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(3,11,166,0.45),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,_rgba(255,211,0,0.15),_transparent_65%)]" />
        <div className="mx-auto flex w-full max-w-[840px] flex-col gap-10">
          <GlassPanel>
            <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="grid gap-8 md:grid-cols-[minmax(0,_280px)_minmax(0,_1fr)] md:gap-10">
            <aside className="flex flex-col items-center gap-8 md:items-start">
              <CodexLogo />
              <hr className="hidden w-full border-white/10 md:block" />
              <div className="hidden text-left text-sm text-white/60 md:block">
                <p className="font-semibold uppercase tracking-[0.3em] text-codex-gold/80">{t("hero.introLabel")}</p>
                <p className="mt-2 leading-relaxed text-white/60">{t("hero.introDescription")}</p>
              </div>
            </aside>
            <main className="flex flex-col gap-6">
              <SetupForm />
            </main>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
