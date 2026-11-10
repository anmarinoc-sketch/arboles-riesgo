/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./", // permite desplegar en subcarpetas (GitHub Pages, etc.)
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Riesgo de árboles urbanos",
        short_name: "Riesgo árboles",
        description: "Calificación del riesgo de caída de árboles urbanos, en campo y sin conexión",
        lang: "es",
        theme_color: "#1f6f43",
        background_color: "#f6f7f4",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        // Las teselas que ya viste en pantalla quedan guardadas para verlas sin señal
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "teselas-osm",
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"] },
});
