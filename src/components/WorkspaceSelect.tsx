import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type WorkspaceConfig = {
  id: string;
  label: string;
};

export type WorkspacesJson = {
  baseUrl: string;
  workspaces: WorkspaceConfig[];
};

export function useWorkspaceConfig() {
  const [config, setConfig] = useState<WorkspacesJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/workspaces.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as WorkspacesJson;
        setConfig(data);
      })
      .catch((err) => {
        console.error("Failed to load workspaces.json", err);
        setError("workspaces.loadError");
      });
  }, []);

  return { config, error };
}

export type WorkspaceSelectProps = {
  workspaces: WorkspaceConfig[];
  selectedId: string;
  onChange: (value: string) => void;
};

export function WorkspaceSelect({ workspaces, selectedId, onChange }: WorkspaceSelectProps) {
  const { t } = useTranslation();

  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium">
      <span>{t("workspaces.label")}</span>
      <select
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base font-semibold text-white shadow-sm transition hover:border-white/20 focus:border-codex-gold focus:outline-none focus:ring-2 focus:ring-codex-gold/50"
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.label}
          </option>
        ))}
      </select>
    </label>
  );
}
