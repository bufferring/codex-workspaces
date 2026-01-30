import type { InvokeArgs } from "@tauri-apps/api/core";

export type LaunchCodexOptions = {
  mode: number;
  num_users: number | null;
  domain: string | null;
  script_path: string;
  confirm_uninstall: boolean;
};

export type LaunchCodexResult = {
  command: string;
  terminal: string;
};

const candidates = [
  () => (window as any).__TAURI__?.invoke,
  () => (window as any).__TAURI__?.tauri?.invoke,
  () => (window as any).__TAURI__?.core?.invoke,
  () => (window as any).__TAURI_INTERNALS__?.invoke,
  () => (window as any).__TAURI_INVOKE__
];

function resolveInvoke(): ((command: string, args?: InvokeArgs) => Promise<any>) | null {
  for (const candidate of candidates) {
    const fn = candidate();
    if (typeof fn === "function") {
      return fn.bind((window as any).__TAURI__ ?? window);
    }
  }
  return null;
}

export async function invokeTauri<T = unknown>(command: string, args?: InvokeArgs): Promise<T> {
  const fn = resolveInvoke();
  if (!fn) {
    throw new Error("Tauri bridge no disponible. Ejecuta manualmente el comando generado.");
  }
  return fn(command, args);
}

export function hasTauriBridge(): boolean {
  return resolveInvoke() !== null;
}

export type InstallDetectionResult = {
  installed: boolean;
  baseUrl: string;
  workspaces: Array<{
    id: string;
    label: string;
    href: string;
  }>;
};

export async function checkInstallState(): Promise<InstallDetectionResult> {
  return invokeTauri<InstallDetectionResult>("check_install_state");
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) {
    return;
  }

  if (hasTauriBridge()) {
    try {
      await invokeTauri("open_workspace_url", { url });
      return;
    } catch (err) {
      console.error("Failed to open URL via Tauri command", err);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
