import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      common: {
        appName: "UNEFA Codex",
        tagline: "Development Environments + AI"
      },
      hero: {
        introLabel: "UNEFA Codex",
        introDescription: "Select the mode, tweak parameters, and launch the assistant without leaving this view."
      },
      language: {
        label: "Language",
        english: "English",
        spanish: "Spanish"
      },
      form: {
        title: "Operation mode",
        description: "Choose how to deploy Codex. The options will adapt automatically based on your selection.",
        options: {
          tailscale: {
            title: "Tailscale",
            description: "Public domain via funnel"
          },
          lan: {
            title: "Local network",
            description: "LAN only"
          },
          uninstall: {
            title: "Uninstall",
            description: "Removes all resources"
          }
        },
        fields: {
          domainLabel: "Tailscale domain",
          domainPlaceholder: "example.ts.net",
          usersLabel: "Workspace count",
          usersDescription: "1 - 30",
          scriptLabel: "Script path",
          scriptPlaceholder: "codex-setup.sh",
          uninstallLabel: "Confirm uninstall",
          uninstallConfirmation: "I confirm I want to remove the existing installation."
        },
        actions: {
          heading: "Launch assistant",
          description: "The assistant will open a terminal with the generated parameters. Copy the command to run it manually if you prefer.",
          run: "Execute",
          copy: "Copy command"
        },
        status: {
          copySuccess: "Command copied.",
          copyError: "Could not copy. Copy it manually.",
          openingTerminal: "Opening terminal...",
          terminalOpened: "Terminal opened: {{terminal}}. Continue there.",
          noResponse: "No response from Tauri.",
          executionFailed: "The script could not be executed.",
          usersRange: "Workspace count must be between 1 and 30.",
          domainRequired: "Enter the Tailscale domain.",
          confirmUninstall: "Select the confirmation to uninstall.",
          unknownTerminal: "unknown"
        }
      },
      commandPreview: {
        empty: "The generated command will appear here.",
        terminalLabel: "Terminal"
      },
      statusPanel: {
        title: "Status"
      },
      workspaces: {
        label: "Workspaces",
        loadError: "Could not load workspaces.json."
      }
    }
  },
  es: {
    translation: {
      common: {
        appName: "UNEFA Codex",
        tagline: "Entornos de Desarrollo + IA"
      },
      hero: {
        introLabel: "UNEFA Codex",
        introDescription: "Selecciona el modo, ajusta parámetros y lanza el asistente sin cambiar de vista."
      },
      language: {
        label: "Idioma",
        english: "Inglés",
        spanish: "Español"
      },
      form: {
        title: "Modo de operación",
        description: "Elige cómo desplegar Codex. Las opciones se ajustarán automáticamente según tu selección.",
        options: {
          tailscale: {
            title: "Tailscale",
            description: "Dominio público vía funnel"
          },
          lan: {
            title: "Red local",
            description: "Solo LAN"
          },
          uninstall: {
            title: "Desinstalar",
            description: "Limpia todos los recursos"
          }
        },
        fields: {
          domainLabel: "Dominio Tailscale",
          domainPlaceholder: "ejemplo.ts.net",
          usersLabel: "Cantidad de workspaces",
          usersDescription: "1 - 30",
          scriptLabel: "Ruta del script",
          scriptPlaceholder: "codex-setup.sh",
          uninstallLabel: "Confirmar desinstalación",
          uninstallConfirmation: "Confirmo que deseo eliminar la instalación existente."
        },
        actions: {
          heading: "Lanzar asistente",
          description: "El asistente abrirá un terminal con los parámetros generados. Copia el comando para usarlo manualmente si lo prefieres.",
          run: "Ejecutar",
          copy: "Copiar comando"
        },
        status: {
          copySuccess: "Comando copiado.",
          copyError: "No se pudo copiar. Hazlo manualmente.",
          openingTerminal: "Abriendo terminal...",
          terminalOpened: "Terminal abierta: {{terminal}}. Continúa allí.",
          noResponse: "No se obtuvo respuesta de Tauri.",
          executionFailed: "No se pudo ejecutar el script.",
          usersRange: "La cantidad de workspaces debe estar entre 1 y 30.",
          domainRequired: "Ingresa el dominio de Tailscale.",
          confirmUninstall: "Para desinstalar marca la confirmación.",
          unknownTerminal: "desconocida"
        }
      },
      commandPreview: {
        empty: "El comando generado aparecerá aquí.",
        terminalLabel: "Terminal"
      },
      statusPanel: {
        title: "Estado"
      },
      workspaces: {
        label: "Espacios de trabajo",
        loadError: "No se pudo cargar workspaces.json."
      }
    }
  }
};

type SupportedLanguage = "en" | "es";

const storageKey = "codex-lang";

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(storageKey) as SupportedLanguage | null;
  if (stored && ["en", "es"].includes(stored)) {
    return stored;
  }
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("es")) {
    return "es";
  }
  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    load: "languageOnly",
    interpolation: {
      escapeValue: false
    }
  })
  .catch((error) => {
    console.error("Failed to initialize i18next", error);
  });

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (lng) => {
    if (["en", "es"].includes(lng)) {
      window.localStorage.setItem(storageKey, lng);
    }
  });
}

export const supportedLanguages: { code: SupportedLanguage; labelKey: string }[] = [
  { code: "en", labelKey: "language.english" },
  { code: "es", labelKey: "language.spanish" }
];

export default i18n;
