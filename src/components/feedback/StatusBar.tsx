import { clsx } from "clsx";
import type { Status } from "../../hooks/useStatus";

export function StatusBar({ status }: { status: Status }) {
  if (!status.message) {
    return <div className="min-h-[20px]" aria-live="polite" aria-atomic="true" />;
  }

  return (
    <div
      className={clsx(
        "min-h-[20px] rounded-lg px-4 py-2 text-sm font-medium transition",
        status.tone === "info" && "bg-white/10 text-white",
        status.tone === "error" && "bg-red-500/20 text-red-200"
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {status.message}
    </div>
  );
}
