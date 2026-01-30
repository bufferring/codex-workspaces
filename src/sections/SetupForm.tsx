import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Checkbox, Field, TextInput } from "../components/ui/Field";
import { useFormState } from "../hooks/useFormState";
import { useStatus } from "../hooks/useStatus";
import { buildSurfaceCommand } from "../lib/command";
import { invokeTauri, type LaunchCodexOptions } from "../lib/tauri";
import { useWorkspaceConfig } from "../components/WorkspaceSelect";
import { CommandPreview } from "./CommandPreview";
import { StatusBar } from "../components/feedback/StatusBar";

export function SetupForm() {
  const { state, setMode, setDomain, setUsers, setScriptPath, toggleUninstall, visibility } = useFormState();
  const { status, setStatus, clearStatus } = useStatus();
  const { error } = useWorkspaceConfig();
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

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {t(error)}
        </div>
      ) : null}

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

      <CommandPreview command={command} />

      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-white/60">{t("statusPanel.title")}</h3>
        <div className="mt-3">
          <StatusBar status={status} />
        </div>
      </div>
    </div>
  );
}
