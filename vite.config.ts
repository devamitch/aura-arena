import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      "process.env": env,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "icons/*.png", "sounds/*.mp3"],
        manifest: {
          name: "AURA ARENA",
          short_name: "AURA",
          description: "The AI-powered movement performance arena",
          theme_color: "#04060f",
          background_color: "#04060f",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
            { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
            { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
            { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
            { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
          categories: ["sports", "fitness", "health"],
          screenshots: [
            {
              src: "/screenshots/mobile.png",
              sizes: "390x844",
              type: "image/png",
              form_factor: "narrow",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,mp3}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-cache",
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "image-cache",
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              },
            },
            {
              urlPattern: /\.(woff2|woff|ttf|eot)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "font-cache",
                expiration: { maxAgeSeconds: 604800 },
              },
            },
          ],
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@app": path.resolve(__dirname, "./src/app"),
        "@features": path.resolve(__dirname, "./src/features"),
        "@shared": path.resolve(__dirname, "./src/features/shared"),
        "@store": path.resolve(__dirname, "./src/store"),
        "@lib": path.resolve(__dirname, "./src/lib"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@types": path.resolve(__dirname, "./src/types"),
        "@styles": path.resolve(__dirname, "./src/styles"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            router: ["react-router-dom"],
            framer: ["framer-motion"],
            supabase: ["@supabase/supabase-js"],
            tanstack: [
              "@tanstack/react-query",
              "@tanstack/react-virtual",
              "@tanstack/react-table",
            ],
            recharts: ["recharts"],
            mediapipe: [
              "@mediapipe/pose",
              "@mediapipe/hands",
              "@mediapipe/face_mesh",
            ],
          },
        },
      },
      target: "es2020",
      sourcemap: false,
      minify: "esbuild",
    },
    optimizeDeps: {
      include: ["react", "react-dom", "framer-motion", "zustand"],
    },
    server: {
      // port: 8082,
      host: true,
    },
  };
});
