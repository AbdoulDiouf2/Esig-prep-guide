import React, { createContext, ReactNode } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

const CookieConsentContext = createContext<ReturnType<typeof useCookieConsent> | null>(null);

const CookieConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const consent = useCookieConsent();
  
  return (
    <CookieConsentContext.Provider value={consent}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export { CookieConsentProvider };
export default CookieConsentContext;
