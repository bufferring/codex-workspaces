#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{path::Path, path::PathBuf, process::Command};
use tauri::{Manager, PathResolver};

#[derive(Debug, Deserialize)]
struct SetupOptions {
    mode: u8,
    num_users: Option<u8>,
    domain: Option<String>,
    script_path: String,
    confirm_uninstall: bool,
}

#[derive(Debug, Serialize)]
struct LaunchResult {
    command: String,
    terminal: String,
}

fn escape_for_double_quotes(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('`', "\\`")
        .replace('$', "\\$")
}

fn validate_user_count(value: Option<u8>) -> Result<u8, String> {
    let count = value.ok_or_else(|| "Debes indicar la cantidad de workspaces.".to_string())?;
    if (1..=30).contains(&count) {
        Ok(count)
    } else {
        Err("La cantidad de workspaces debe estar entre 1 y 30.".into())
    }
}

fn build_inputs(options: &SetupOptions) -> Result<Vec<String>, String> {
    match options.mode {
        1 => {
            let num = validate_user_count(options.num_users)?;
            let domain = options
                .domain
                .as_ref()
                .ok_or_else(|| "Debes especificar el dominio Tailscale.".to_string())?;
            Ok(vec!["1".into(), num.to_string(), domain.trim().into()])
        }
        2 => {
            let num = validate_user_count(options.num_users)?;
            Ok(vec!["2".into(), num.to_string()])
        }
        3 => {
            if !options.confirm_uninstall {
                return Err("Marca la casilla de confirmación para desinstalar.".into());
            }
            Ok(vec!["3".into(), "YES".into()])
        }
        _ => Err("Modo no soportado.".into()),
    }
}

fn spawn_terminal(command_str: &str) -> Result<String, String> {
    if let Ok(custom_terminal) = std::env::var("TERMINAL") {
        if !custom_terminal.trim().is_empty() {
            let args = ["-e", "bash", "-lc", command_str];
            if Command::new(&custom_terminal).args(args).spawn().is_ok() {
                return Ok(custom_terminal);
            }
        }
    }

    let candidates: [(&str, &[&str]); 15] = [
        ("x-terminal-emulator", &["-e", "bash", "-lc", command_str]),
        ("gnome-terminal", &["--", "bash", "-lc", command_str]),
        ("mate-terminal", &["-e", "bash", "-lc", command_str]),
        ("konsole", &["-e", "bash", "-lc", command_str]),
        ("kitty", &["bash", "-lc", command_str]),
        ("tilix", &["-e", "bash", "-lc", command_str]),
        ("xfce4-terminal", &["-e", "bash", "-lc", command_str]),
        ("wezterm", &["start", "--", "bash", "-lc", command_str]),
        ("foot", &["-e", "bash", "-lc", command_str]),
        ("terminator", &["-e", "bash", "-lc", command_str]),
        ("alacritty", &["-e", "bash", "-lc", command_str]),
        ("xterm", &["-e", "bash", "-lc", command_str]),
        ("urxvt", &["-e", "bash", "-lc", command_str]),
        ("qterminal", &["-e", "bash", "-lc", command_str]),
        ("lxterminal", &["-e", "bash", "-lc", command_str]),
    ];

    let mut last_err: Option<std::io::Error> = None;

    for (binary, args) in candidates {
        match Command::new(binary).args(args).spawn() {
            Ok(_) => return Ok(binary.to_string()),
            Err(err) => last_err = Some(err),
        }
    }

    Err(last_err
        .map(|err| format!("No pude abrir un terminal: {}", err))
        .unwrap_or_else(|| "No se encontró un emulador de terminal compatible.".into()))
}

fn resolve_script_path(script_candidate: &str, path_resolver: &PathResolver) -> Result<PathBuf, String> {
    let trimmed = script_candidate.trim();
    let fallback = if trimmed.is_empty() {
        "codex-setup.sh"
    } else {
        trimmed
    };

    let raw_path = Path::new(fallback);

    if raw_path.is_absolute() {
        if raw_path.exists() {
            return raw_path
                .canonicalize()
                .map_err(|err| format!("No pude resolver la ruta del script: {}", err));
        }
        return Err(format!("No encontré el script en: {}", raw_path.display()));
    }

    let current_dir = std::env::current_dir()
        .map_err(|err| format!("No pude determinar el directorio actual: {}", err))?;

    let mut candidates: Vec<PathBuf> = Vec::new();

    // Try joining the relative path against up to six ancestor directories.
    let mut ancestor = Some(current_dir.as_path());
    let mut depth = 0;
    while let Some(dir) = ancestor {
        let joined = dir.join(raw_path);
        if !candidates.iter().any(|existing| existing == &joined) {
            candidates.push(joined);
        }
        ancestor = dir.parent();
        depth += 1;
        if depth >= 6 {
            break;
        }
    }

    // If we have only a filename, also try it directly on the ancestors.
    if let Some(file_name) = raw_path.file_name() {
        let mut ancestor = Some(current_dir.as_path());
        let mut depth = 0;
        while let Some(dir) = ancestor {
            let joined = dir.join(file_name);
            if !candidates.iter().any(|existing| existing == &joined) {
                candidates.push(joined);
            }
            ancestor = dir.parent();
            depth += 1;
            if depth >= 6 {
                break;
            }
        }
    }

    for candidate in candidates {
        if candidate.exists() {
            return candidate
                .canonicalize()
                .map_err(|err| format!("No pude resolver la ruta del script: {}", err));
        }
    }

    let resource_candidates = [fallback, "codex-setup.sh", "resources/codex-setup.sh"];
    for resource in resource_candidates {
        if let Some(resolved) = path_resolver.resolve_resource(resource) {
            if resolved.exists() {
                return resolved
                    .canonicalize()
                    .map_err(|err| format!("No pude resolver la ruta del script: {}", err));
            }
        }
    }

    Err(format!(
        "No encontré el script. Ajusta la ruta manualmente (valor actual: {}).",
        fallback
    ))
}

#[tauri::command]
async fn launch_codex(app_handle: tauri::AppHandle, options: SetupOptions) -> Result<LaunchResult, String> {
    println!("launch_codex invoked with: {:?}", options);
    let script_candidate = if options.script_path.trim().is_empty() {
        "codex-setup.sh".to_string()
    } else {
        options.script_path.trim().to_string()
    };

    let path_resolver = app_handle.path_resolver();
    let script_abs = resolve_script_path(&script_candidate, &path_resolver)?;

    let answers = build_inputs(&options)?;

    let mut env_exports = Vec::new();
    if matches!(options.mode, 1 | 2) {
        if let Some(num) = options.num_users {
            env_exports.push(format!("export CODEX_NUM_USERS=\"{}\"; ", num));
        }
    }
    if options.mode == 1 {
        if let Some(domain) = options.domain.as_ref() {
            let sanitized = escape_for_double_quotes(domain.trim());
            env_exports.push(format!("export CODEX_DOMAIN=\"{}\"; ", sanitized));
        }
    }

    let export_block = env_exports.concat();
    let printf_parts: Vec<String> = answers
        .iter()
        .map(|value| format!("\"{}\"", escape_for_double_quotes(value)))
        .collect();
    let printf_block = format!("printf '%s\\n' {} | ", printf_parts.join(" "));

    let mut command_body = format!(
        "{}{}sudo -E /bin/bash \"{}\"",
        export_block,
        printf_block,
        script_abs.display()
    );

    command_body.push_str(
        "; echo \"\"; echo \"Proceso completado.\"; read -p \"Pulsa Enter para cerrar...\" _",
    );

    println!("launch_codex computed command: {}", command_body);

    let terminal = spawn_terminal(&command_body)?;

    Ok(LaunchResult {
        command: command_body,
        terminal,
    })
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main");
            if let Some(window) = window {
                // Center the window on launch for nicer UX.
                let _ = window.center();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![launch_codex])
        .run(tauri::generate_context!())
        .expect("failed to run Codex frontend");
}
