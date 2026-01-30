import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { checkInstallState, hasTauriBridge, type InstallDetectionResult } from "../lib/tauri";

export type WorkspaceConfig = {
  id: string;
  label: string;
  href: string;
};

export type WorkspaceDetection = {
  installed: boolean;
  baseUrl: string;
  workspaces: WorkspaceConfig[];
};

type DetectionSource = "tauri" | "static" | "unknown";

function normalizeBaseUrl(candidate?: string | null): string {
  const fallback = "http://127.0.0.1";
  if (!candidate) {
    return fallback;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.replace(/\/+$/, "");
}

function buildHref(segment: string): string {
  const trimmed = segment.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) {
    return "/";
  }
  return `/${trimmed}/`;
}

function fromTauriResult(raw: InstallDetectionResult): WorkspaceDetection {
  return {
    installed: raw.installed,
    baseUrl: normalizeBaseUrl(raw.baseUrl),
    workspaces: raw.workspaces.map((workspace) => ({
      id: workspace.id,
      label: workspace.label,
      href: buildHref(workspace.href)
    }))
  };
}

function fromStaticConfig(fallback: { baseUrl?: string; workspaces?: Array<{ id: string; label?: string }> }): WorkspaceDetection {
  const workspaces = (fallback.workspaces ?? [])
    .filter((workspace) => Boolean(workspace.id))
    .map((workspace, index) => ({
      id: workspace.id,
      label: workspace.label ?? `Workspace ${index + 1}`,
      href: buildHref(workspace.id)
    }));

  return {
    installed: workspaces.length > 0,
    baseUrl: normalizeBaseUrl(fallback.baseUrl),
    workspaces
  };
}

export function useWorkspaceConfig() {
  const [config, setConfig] = useState<WorkspaceDetection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<DetectionSource>("unknown");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (hasTauriBridge()) {
      try {
        const detection = await checkInstallState();
        setConfig(fromTauriResult(detection));
        setSource("tauri");
      } catch (err) {
        console.error("Failed to detect Codex installation", err);
        setError("workspaces.loadError");
        setConfig(null);
        setSource("tauri");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch("/workspaces.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const fallback = (await response.json()) as { baseUrl?: string; workspaces?: Array<{ id: string; label?: string }> };
      setConfig(fromStaticConfig(fallback));
      setSource("static");
    } catch (err) {
      console.error("Failed to load workspaces.json", err);
      setError("workspaces.loadError");
      setConfig(null);
      setSource("unknown");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (loading) {
      return;
    }

    if (config?.installed) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchConfig();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [config?.installed, fetchConfig, loading]);

  return {
    config,
    error,
    installed: config?.installed ?? false,
    loading,
    refresh: fetchConfig,
    source
  };
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
