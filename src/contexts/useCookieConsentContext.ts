import { useContext } from 'react';
import CookieConsentContext from './CookieConsentContext';

const useCookieConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
};

export default useCookieConsentContext;
