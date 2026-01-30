import type { LaunchCodexOptions } from "./tauri";

function escapeForQuotes(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

export function buildSurfaceCommand(payload: LaunchCodexOptions): string {
  const segments: string[] = [];

  if (payload.mode !== 3 && typeof payload.num_users === "number") {
    segments.push(`export CODEX_NUM_USERS="${escapeForQuotes(`${payload.num_users}`)}"; `);
  }

  if (payload.mode === 1 && payload.domain) {
    segments.push(`export CODEX_DOMAIN="${escapeForQuotes(payload.domain)}"; `);
  }

  const answers: string[] = [];
  if (payload.mode === 1) {
    answers.push("1", `${payload.num_users ?? ""}`, payload.domain ?? "");
  } else if (payload.mode === 3) {
    answers.push("3", "YES");
  } else if (payload.mode === 2) {
    answers.push("2", `${payload.num_users ?? ""}`);
  }

  if (answers.length > 0) {
    const printfValues = answers
      .map((item) => `"${escapeForQuotes(item)}"`)
      .join(" ");
    segments.push(`printf '%s\\n' ${printfValues} | `);
  }

  const scriptPath = payload.script_path?.trim() || "codex-setup.sh";
  segments.push(`sudo -E /bin/bash "${escapeForQuotes(scriptPath)}"`);

  return segments.join("");
}
