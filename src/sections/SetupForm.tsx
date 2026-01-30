import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Checkbox, Field, TextInput } from "../components/ui/Field";
import { useFormState } from "../hooks/useFormState";
import { useStatus } from "../hooks/useStatus";
import { buildSurfaceCommand } from "../lib/command";
import { invokeTauri, openExternalUrl, type LaunchCodexOptions } from "../lib/tauri";
import { useWorkspaceConfig, WorkspaceSelect } from "../components/WorkspaceSelect";
import { StatusBar } from "../components/feedback/StatusBar";

export function SetupForm() {
  const { state, setMode, setDomain, setUsers, setScriptPath, toggleUninstall, visibility } = useFormState();
  const { status, setStatus, clearStatus } = useStatus();
  const {
    config: workspaceConfig,
    error: workspaceError,
    loading: workspaceLoading,
    refresh: refreshWorkspaces
  } = useWorkspaceConfig();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState<boolean>(false);
  const refreshTimers = useRef<number[]>([]);
  const { t } = useTranslation();

  const modeOptions = useMemo(
    () => [
      {
        value: 1,
        title: t("form.options.tailscale.title"),
        desc: t("form.options.tailscale.description")
      },
      {
        value: 2,
        title: t("form.options.lan.title"),
        desc: t("form.options.lan.description")
      },
      {
        value: 3,
        title: t("form.options.uninstall.title"),
        desc: t("form.options.uninstall.description")
      }
    ],
    [t]
  );

  useEffect(() => {
    if (workspaceConfig?.workspaces.length) {
      setSelectedWorkspace((current) => {
        if (current && workspaceConfig.workspaces.some((workspace) => workspace.id === current)) {
          return current;
        }
        return workspaceConfig.workspaces[0].id;
      });
    } else {
      setSelectedWorkspace("");
    }
  }, [workspaceConfig]);

    useEffect(() => {
      return () => {
        if (typeof window !== "undefined") {
          refreshTimers.current.forEach((id) => window.clearTimeout(id));
        }
        refreshTimers.current = [];
      };
    }, []);

    const scheduleWorkspaceRefresh = useCallback(() => {
      if (typeof window === "undefined") {
        void refreshWorkspaces();
        return;
      }

      refreshTimers.current.forEach((id) => window.clearTimeout(id));
      refreshTimers.current = [];

      const delays = [0, 5000, 15000, 30000];
      delays.forEach((delay) => {
        const timerId = window.setTimeout(() => {
          void refreshWorkspaces();
        }, delay);
        refreshTimers.current.push(timerId);
      });
    }, [refreshWorkspaces]);

    useEffect(() => {
      scheduleWorkspaceRefresh();
    }, [scheduleWorkspaceRefresh]);

  const buildWorkspaceUrl = (baseUrl: string, href: string) => {
    const sanitizedBase = baseUrl.replace(/\/+$/, "");
    const normalizedHref = href.startsWith("/") ? href : `/${href}`;
    return `${sanitizedBase}${normalizedHref}`;
  };

  const [command, payload] = useMemo(() => {
    const options: LaunchCodexOptions = {
      mode: state.mode,
      num_users: visibility.showUsers ? state.numUsers : null,
      domain: visibility.showDomain ? state.domain.trim() : null,
      script_path: state.scriptPath.trim(),
      confirm_uninstall: state.confirmUninstall
    };
    return [buildSurfaceCommand(options), options] as const;
  }, [state, visibility]);

  const disabled = status.message === t("form.status.openingTerminal");

  const handleSubmit = async () => {
    clearStatus();

    if (visibility.showUsers && (state.numUsers < 1 || state.numUsers > 30)) {
      setStatus(t("form.status.usersRange"), "error");
      return;
    }

    if (visibility.showDomain && !state.domain.trim()) {
      setStatus(t("form.status.domainRequired"), "error");
      return;
    }

    if (visibility.showUninstall && !state.confirmUninstall) {
      setStatus(t("form.status.confirmUninstall"), "error");
      return;
    }

    setStatus(t("form.status.openingTerminal"));

      try {
        const result = await invokeTauri<{ command: string; terminal: string } | null>("launch_codex", { options: payload });
      if (result) {
        setStatus(
          t("form.status.terminalOpened", {
            terminal: result.terminal ?? t("form.status.unknownTerminal")
          })
        );
      } else {
        setStatus(t("form.status.noResponse"), "error");
      }
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : t("form.status.executionFailed"), "error");
      } finally {
        scheduleWorkspaceRefresh();
    }
  };

  const handleOpenWorkspace = async () => {
    if (!workspaceConfig || !selectedWorkspace) {
      return;
    }

    const workspace = workspaceConfig.workspaces.find((candidate) => candidate.id === selectedWorkspace);
    if (!workspace) {
      return;
    }

    const targetUrl = buildWorkspaceUrl(workspaceConfig.baseUrl, workspace.href);

    setIsOpeningWorkspace(true);
    try {
      await openExternalUrl(targetUrl);
      setStatus(t("workspaces.opened", { workspace: workspace.label }));
    } catch (error) {
      console.error("Failed to open workspace", error);
      setStatus(t("workspaces.openError"), "error");
    } finally {
      setIsOpeningWorkspace(false);
        scheduleWorkspaceRefresh();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner sm:p-6">
        <h2 className="text-lg font-semibold tracking-wide text-white">{t("form.title")}</h2>
        <p className="mt-2 text-sm text-white/70">{t("form.description")}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={`rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codex-gold sm:py-5 ${
                state.mode === option.value
                  ? "border-codex-gold/80 bg-codex-blue/20 text-white shadow-xl shadow-codex-blue/40"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="block text-lg font-semibold tracking-wide">{option.title}</span>
              <span className="mt-2 block text-sm text-white/60 sm:text-white/70">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t("form.fields.domainLabel")} hidden={!visibility.showDomain} htmlFor="domain">
          <TextInput
            id="domain"
            value={state.domain}
            placeholder={t("form.fields.domainPlaceholder")}
            onChange={setDomain}
          />
        </Field>

        <Field
          label={t("form.fields.usersLabel")}
          description={t("form.fields.usersDescription")}
          hidden={!visibility.showUsers}
          htmlFor="num-users"
        >
          <TextInput
            id="num-users"
            type="number"
            value={state.numUsers}
            min={1}
            max={30}
            onChange={(value) => setUsers(Number.parseInt(value, 10) || 1)}
          />
        </Field>

        <Field label={t("form.fields.scriptLabel")} htmlFor="script-path" hidden={false}>
          <TextInput
            id="script-path"
            value={state.scriptPath}
            onChange={setScriptPath}
            placeholder={t("form.fields.scriptPlaceholder")}
          />
        </Field>

        <Field label={t("form.fields.uninstallLabel")} hidden={!visibility.showUninstall}>
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <Checkbox id="confirm-uninstall" checked={state.confirmUninstall} onChange={toggleUninstall} />
            <span className="text-sm text-red-100">
              {t("form.fields.uninstallConfirmation")}
            </span>
          </div>
        </Field>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold tracking-wide text-white sm:text-lg">{t("form.actions.heading")}</h3>
            <p className="text-sm text-white/70">{t("form.actions.description")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleSubmit} disabled={disabled}>
              {t("form.actions.run")}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(command);
                  setStatus(t("form.status.copySuccess"));
                } catch (clipboardError) {
                  console.error(clipboardError);
                  setStatus(t("form.status.copyError"), "error");
                }
              }}
              disabled={!command}
            >
              {t("form.actions.copy")}
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold tracking-wide text-white sm:text-lg">{t("workspaces.sectionTitle")}</h3>
            <p className="text-sm text-white/70">
              {workspaceLoading
                ? t("workspaces.detecting")
                : workspaceConfig?.installed
                  ? t("workspaces.readyDescription", { count: workspaceConfig.workspaces.length })
                  : t("workspaces.notInstalled")}
            </p>
            {workspaceConfig?.installed ? (
              <p className="text-xs text-white/50">{t("workspaces.baseUrl", { baseUrl: workspaceConfig.baseUrl })}</p>
            ) : null}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              scheduleWorkspaceRefresh();
            }}
            disabled={workspaceLoading}
          >
            {workspaceLoading ? t("workspaces.refreshing") : t("workspaces.refresh")}
          </Button>
        </div>
        {workspaceError ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
            {t(workspaceError)}
          </div>
        ) : null}
        {workspaceConfig?.installed && workspaceConfig.workspaces.length > 0 ? (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="sm:w-2/3">
              <WorkspaceSelect workspaces={workspaceConfig.workspaces} selectedId={selectedWorkspace} onChange={setSelectedWorkspace} />
            </div>
            <Button onClick={handleOpenWorkspace} disabled={!selectedWorkspace || isOpeningWorkspace} className="sm:w-auto">
              {isOpeningWorkspace ? t("workspaces.opening") : t("workspaces.openButton")}
            </Button>
          </div>
        ) : !workspaceLoading ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            {t("workspaces.notInstalledHint")}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-white/60">{t("statusPanel.title")}</h3>
        <div className="mt-3">
          <StatusBar status={status} />
        </div>
      </div>
    </div>
  );
}
