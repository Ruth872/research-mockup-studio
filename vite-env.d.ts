/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** FastAPI base URL; defaults to the "/api/" dev proxy. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
