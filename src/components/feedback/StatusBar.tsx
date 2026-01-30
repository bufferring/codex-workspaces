import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import type { Status } from "../../hooks/useStatus";

export function StatusBar({ status }: { status: Status }) {
  const { t } = useTranslation();
  const displayMessage = status.message || t("statusPanel.placeholder");
  const tone = status.message ? status.tone : "info";

  return (
    <div
      className={clsx(
        "min-h-[20px] rounded-lg px-4 py-2 text-sm font-medium transition",
        tone === "info" && "bg-white/10 text-white",
        tone === "error" && "bg-red-500/20 text-red-200"
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {displayMessage}
    </div>
  );
}
