/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ─── Required ──────────────────────────────────────────────────────────────
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;

  // ─── Optional — AI ────────────────────────────────────────────────────────
  readonly VITE_GEMINI_API_KEY?: string;

  // ─── Optional — Payments ──────────────────────────────────────────────────
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Direct Stripe Payment Link URL for premium subscriptions */
  readonly VITE_STRIPE_PAYMENT_LINK?: string;

  // ─── Optional — Feature flags ─────────────────────────────────────────────
  readonly VITE_ENABLE_BLOCKCHAIN?: string;
  readonly VITE_ENABLE_PREMIUM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js" {
  export * from "@mediapipe/tasks-vision";
}

declare module "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs" {
  export * from "@mediapipe/tasks-vision";
}

declare module "/mediapipe-wasm/vision_bundle.mjs" {
  export * from "@mediapipe/tasks-vision";
}
