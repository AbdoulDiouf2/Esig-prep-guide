import { useEffect, useState } from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

export function Analytics() {
  const [mounted, setMounted] = useState(false);
  const { hasConsent } = useCookieConsent();
  const [shouldTrack, setShouldTrack] = useState(false);

  // Vérifier le consentement après le montage côté client
  useEffect(() => {
    setMounted(true);
    if (hasConsent('analytics')) {
      setShouldTrack(true);
    }
  }, [hasConsent]);

  // Ne rien afficher lors du rendu côté serveur ou si pas de consentement
  if (!mounted || !shouldTrack) {
    return null;
  }

  return <VercelAnalytics />;
}

export default Analytics;
