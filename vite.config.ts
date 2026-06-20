import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages のプロジェクトサイトは /<repo>/ 配下で配信されるため、
// 本番ビルド時のみ DEPLOY_BASE（例: "/handmade/"）を受け取る。
// ローカル開発やルート配信のホスティングでは "/" のまま。
const base = process.env.DEPLOY_BASE ?? "/";

// PWA manifest is tuned for TWA packaging (Bubblewrap / PWABuilder) so the
// same build can ship to Google Play as an Android App Bundle.
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "ハンドメイド原価計算 — 赤字にならない価格",
        short_name: "原価計算",
        description:
          "材料費・制作時間・販売手数料から、赤字にならない価格と実質時給をかんたん計算。ハンドメイド作家のための価格・利益計算アプリ。",
        lang: "ja",
        dir: "ltr",
        theme_color: "#e26d8a",
        background_color: "#fff7f9",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        categories: ["business", "productivity", "finance"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: base + "index.html",
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
  },
});
