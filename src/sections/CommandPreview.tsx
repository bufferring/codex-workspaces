import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { TerminalIcon } from "../components/icons/TerminalIcon";

export type CommandPreviewProps = {
  command: string;
};

export function CommandPreview({ command }: CommandPreviewProps) {
  const { t } = useTranslation();

  if (!command) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/70">
        {t("commandPreview.empty")}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/60 p-6 text-sm text-white/80 shadow-inner">
      <div className="absolute right-6 top-6 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
        <TerminalIcon className="h-4 w-4" />
        {t("commandPreview.terminalLabel")}
      </div>
      <pre className={clsx("whitespace-pre-wrap break-words text-white/90", "font-mono text-sm leading-relaxed")}>{command}</pre>
    </div>
  );
}
