import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    join(__dirname, "index.html"),
    join(__dirname, "src/**/*.{ts,tsx}")
  ],
  theme: {
    extend: {
      colors: {
        codex: {
          blue: "#030BA6",
          gold: "#FFD300",
          slate: "#0B1533"
        }
      },
      boxShadow: {
        panel: "0 30px 80px -40px rgba(3, 11, 166, 0.65)",
        focus: "0 0 0 4px rgba(3, 11, 166, 0.18)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite"
      }
    }
  },
  plugins: []
};
