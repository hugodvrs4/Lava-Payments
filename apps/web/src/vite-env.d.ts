/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_TESTNET?: string
  readonly VITE_PUBLIC_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
