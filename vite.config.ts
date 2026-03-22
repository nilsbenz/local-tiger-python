import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

const host = process.env.TAURI_DEV_HOST;

const PYODIDE_EXCLUDE = ["!**/*.{md,html}", "!**/*.d.ts", "!**/node_modules"];

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*")].concat(PYODIDE_EXCLUDE),
        dest: "pyodide",
      },
    ],
  });
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  optimizeDeps: { exclude: ["pyodide"] },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopyPyodide(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ["**/*"],
      manifest: {
        theme_color: "#0a0a0a",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        short_name: "LocalTP",
        description: "LocalTP",
        name: "LocalTP",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  worker: {
    format: "es" as const,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
