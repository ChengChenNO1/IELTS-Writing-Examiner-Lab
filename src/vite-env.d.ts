/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILTIN_ARK_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
