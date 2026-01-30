import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: false,
      includeAssets: ["UNEFA.png", "workspaces.json"],
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,png,svg,json,ico,txt}"]
      }
    })
  ],
  resolve: {
    alias: {
      "@": join(__dirname, "src")
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
});
