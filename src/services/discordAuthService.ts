import { getIdToken } from 'firebase/auth';
import { auth } from '../firebase';

const DISCORD_OAUTH_INITIATE_URL = import.meta.env.VITE_DISCORD_OAUTH_INITIATE_URL as string;

/**
 * Démarre le flux OAuth Discord : demande une URL d'autorisation signée côté serveur,
 * puis redirige le navigateur vers Discord. Le retour se fait sur /profile.
 */
export const connectDiscordAccount = async (): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Non connecté');
  }
  const idToken = await getIdToken(auth.currentUser);
  const response = await fetch(DISCORD_OAUTH_INITIATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body?.error) detail = body.error;
    } catch {
      // corps non-JSON, on garde statusText
    }
    throw new Error(detail);
  }

  const { url } = await response.json();
  window.location.href = url;
};
