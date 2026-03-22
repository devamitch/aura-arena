/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ─── Required ──────────────────────────────────────────────────────────────
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly GOOGLE_CLIENT_ID: string;

  // ─── Optional — AI ────────────────────────────────────────────────────────
  readonly GEMINI_API_KEY?: string;

  // ─── Optional — Payments ──────────────────────────────────────────────────
  readonly STRIPE_PUBLISHABLE_KEY?: string;
  /** Direct Stripe Payment Link URL for premium subscriptions */
  readonly STRIPE_PAYMENT_LINK?: string;

  // ─── Optional — Feature flags ─────────────────────────────────────────────
  readonly ENABLE_BLOCKCHAIN?: string;
  readonly ENABLE_PREMIUM?: string;
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
