/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    CONTACT_TO_EMAIL?: string;
    CONTACT_SITE_URL?: string;
    RESEND_TEMPLATE_CONTACT_USER?: string;
    RESEND_TEMPLATE_CONTACT_ADMIN?: string;
    RECAPTCHA_SECRET_KEY?: string;
    RECAPTCHA_MIN_SCORE?: string;
  }
}
