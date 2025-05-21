/**
 * Utilitaires pour l'intégration Dropbox
 */

/**
 * Récupère un access token Dropbox depuis la fonction Netlify
 * @returns Promise contenant l'access token
 */
export async function getDropboxAccessToken(): Promise<string> {
  try {
    // Déterminer l'URL correcte selon l'environnement
    let tokenUrl: string;
    
    if (window.location.hostname.includes('netlify.app')) {
      // Sur Netlify en production
      tokenUrl = '/.netlify/functions/dropbox-token';
    } else {
      // En développement local OU sur GitHub Pages
      // Toujours utiliser l'URL de production pour l'endpoint Netlify
      tokenUrl = 'https://esig-prep-guide.netlify.app/.netlify/functions/dropbox-token';
    }
    
    console.log(`Récupération du token Dropbox depuis: ${tokenUrl}`);
    const response = await fetch(tokenUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token Dropbox:", error);
    throw error;
  }
}
