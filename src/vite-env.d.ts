/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  // 添加其他以 VITE_ 开头的环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
