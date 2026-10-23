/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do backend, quando ele fica em outro domínio. Vazio = mesmo domínio. */
  readonly VITE_API_URL?: string;
}
