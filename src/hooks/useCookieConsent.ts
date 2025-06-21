import { useState, useEffect, useCallback } from 'react';

// Types pour les événements Google Analytics
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

export type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: Date | null;
};

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si on est côté client (navigateur)
  const isClient = typeof window !== 'undefined';

  // Charger les préférences au démarrage
  useEffect(() => {
    if (!isClient) return;

    const applyConsentPreferences = (preferences: ConsentPreferences) => {
      // Analytics
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          'analytics_storage': preferences.analytics ? 'granted' : 'denied',
          'ad_storage': preferences.marketing ? 'granted' : 'denied',
        });
      }

      // Facebook Pixel
      if (typeof window.fbq === 'function') {
        window.fbq('consent', preferences.marketing ? 'grant' : 'revoke');
      }
    };

    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        const consentData = {
          ...parsedConsent,
          acceptedAt: parsedConsent.acceptedAt ? new Date(parsedConsent.acceptedAt) : null
        };
        setConsent(consentData);
        applyConsentPreferences(consentData);
      } catch (error) {
        console.error('Error loading cookie consent:', error);
      }
    }
    setIsLoading(false);
  }, [isClient]);

  // Sauvegarder les préférences
  const saveConsent = useCallback((preferences: Omit<ConsentPreferences, 'acceptedAt'>) => {
    if (!isClient) return null;

    const newConsent = { 
      ...preferences,
      acceptedAt: new Date() 
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    setConsent(newConsent);
    
    // Appliquer immédiatement les nouvelles préférences
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
      });
    }

    if (typeof window.fbq === 'function') {
      window.fbq('consent', preferences.marketing ? 'grant' : 'revoke');
    }
    
    return newConsent;
  }, [isClient]);

  return {
    consent,
    isLoading,
    saveConsent,
    hasConsent: (category: keyof Omit<ConsentPreferences, 'acceptedAt'>) => {
      if (!consent) return false;
      if (category === 'essential') return true;
      return consent[category] === true;
    }
  };
};

export default useCookieConsent;
