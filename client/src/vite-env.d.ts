/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_STAND: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  API_URL: string;
  DEALER_INSTRUCTION: string;
  MANAGER_INSTRUCTION: string;
  DEALER_TITLE: string;
  MANAGER_TITLE: string;
  LOGIN: string;
  PASSWORD: string;
}
