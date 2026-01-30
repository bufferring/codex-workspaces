import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../i18n";

type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLanguage = useMemo<SupportedLanguage>(() => {
    const resolved = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];
    return supportedLanguages.some(({ code }) => code === resolved) ? (resolved as SupportedLanguage) : "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleToggle = useCallback(() => {
    const nextLanguage: SupportedLanguage = currentLanguage === "en" ? "es" : "en";
    void i18n.changeLanguage(nextLanguage);
  }, [currentLanguage, i18n]);

  return (
    <button
      type="button"
      aria-label={t("language.label")}
      onClick={handleToggle}
      className="inline-flex h-7 w-9 items-center justify-center rounded-[10%] text-xs font-bold uppercase tracking-[0.35em] text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.45)] transition hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codex-gold focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {currentLanguage.toUpperCase()}
    </button>
  );
}
