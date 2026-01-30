import { useTranslation } from "react-i18next";

export function CodexLogo() {
  const { t } = useTranslation();

  return (
    <header className="flex w-full flex-col items-center gap-5 text-center md:items-start md:text-left">
      <img
        src="/UNEFA.png"
        alt={t("common.appName")}
        className="h-28 w-28 select-none object-contain sm:h-32 sm:w-32"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold uppercase tracking-[0.35em] text-white sm:text-[28px] md:text-left">
          {t("common.appName")}
        </h1>
        <p className="text-xs font-semibold uppercase tracking-[0.6em] text-codex-gold/80 sm:text-sm">
          {t("common.tagline")}
        </p>
      </div>
    </header>
  );
}
