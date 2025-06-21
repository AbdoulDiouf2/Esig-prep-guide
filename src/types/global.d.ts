// Déclaration des types globaux pour l'application

export {}; // Ceci est important pour traiter le fichier comme un module

// Types pour Google Analytics
type GTagEvent = {
  event: string;
  [key: string]: string | number | boolean | null | undefined;
};

type GTagConsentParams = {
  analytics_storage?: 'granted' | 'denied';
  ad_storage?: 'granted' | 'denied';
  wait_for_update?: number;
  [key: string]: string | number | boolean | undefined;
};

type GTagConfigParams = {
  page_path?: string;
  send_page_view?: boolean;
  [key: string]: string | number | boolean | undefined;
};

type GTagEventParams = {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
};

// Types pour Facebook Pixel
type FbqEvent = [
  'track', 
  string, 
  Record<string, unknown>?
] | [
  'trackCustom', 
  string, 
  Record<string, unknown>?
] | [
  'consent', 
  'grant' | 'revoke'
];

declare global {
  interface Window {
    // Google Analytics - Surcharges de type pour gtag
    gtag: {
      // Pour la configuration
      (command: 'config', targetId: string, config?: GTagConfigParams): void;
      // Pour les événements
      (command: 'event', action: string, eventParams?: GTagEventParams): void;
      // Pour le consentement
      (command: 'consent', consent: 'update', consentParams: GTagConsentParams): void;
      // Signature par défaut pour d'autres cas
      (command: string, ...args: unknown[]): void;
    };
    
    dataLayer: GTagEvent[];
    
    // Facebook Pixel
    fbq: (
      ...args: FbqEvent
    ) => void;
    
    _fbq: {
      push: (args: FbqEvent) => void;
      loaded: boolean;
    };
    
    // Autres variables globales
    [key: string]: unknown;
  }
}

// Déclarations pour les modules CSS/SCSS
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
