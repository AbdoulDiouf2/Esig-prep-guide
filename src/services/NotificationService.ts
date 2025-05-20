import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { FAQItem } from '../contexts/ContentContext';

// Interface pour les données d'email
interface EmailData {
  to_email: string;
  to_name: string;
  question: string;
  answer: string;
  app_name: string;
  faq_url: string;
  [key: string]: string; // Pour les propriétés additionnelles qui pourraient être nécessaires
}

/**
 * Service pour gérer les notifications utilisateurs, notamment lors des réponses FAQ
 */
export const NotificationService = {
  /**
   * Envoie une notification par email à l'utilisateur quand sa question est répondue
   * @param faqId ID de la question FAQ qui vient d'être répondue
   * @param questionText Texte de la question
   * @param answerText Texte de la réponse
   */
  async sendFaqAnswerNotification(faqId: string, questionText: string, answerText: string): Promise<boolean> {
    try {
      // 1. Récupérer les détails de la question FAQ
      const faqRef = doc(db, 'faqItems', faqId);
      const faqDoc = await getDoc(faqRef);
      
      if (!faqDoc.exists()) {
        console.error('FAQ item not found:', faqId);
        return false;
      }
      
      const faqData = faqDoc.data() as FAQItem;
      
      // 2. Vérifier si un userEmail est associé à cette question
      if (!faqData.userEmail) {
        console.log('No user email associated with this FAQ item');
        return false;
      }

      // 3. Récupérer les informations de l'utilisateur pour personnaliser l'email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', faqData.userEmail));
      const userSnapshot = await getDocs(q);
      
      let userName = 'Utilisateur';
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        userName = userData.displayName || 'Utilisateur';
      }

      // 4. Préparer les données pour l'email
      const emailData: EmailData = {
        to_email: faqData.userEmail,
        to_name: userName,
        question: questionText,
        answer: answerText,
        app_name: 'ESIG-prep-guide',
        faq_url: `${window.location.origin}/Esig-prep-guide/faq`
      };

      // 5. Appel au service d'email existant
      // Note: Cette partie doit être adaptée selon le service d'email existant
      return await sendEmailNotification(emailData);
    } catch (error) {
      console.error('Error sending FAQ answer notification:', error);
      return false;
    }
  }
};

/**
 * Configuration EmailJS
 * 
 * Remplacez ces valeurs par celles obtenues sur votre compte EmailJS :
 * 1. SERVICE_ID : Trouvé sous "Email Services" (format: service_xxxxxx)
 * 2. TEMPLATE_ID : Trouvé sous "Email Templates" (format: template_xxxxxx)
 * 3. PUBLIC_KEY : Trouvé sous "Account > API Keys"
 * 
 * Détails sur la configuration :
 * https://www.emailjs.com/docs/sdk/installation/
 */
export const EMAILJS_CONFIG = {
  // ID du service email (sous "Email Services")
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID, // TODO: Remplacer par votre ID de service
  
  // ID du template d'email (sous "Email Templates")
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID, // TODO: Remplacer par votre ID de template
  
  // Clé publique API (sous "Account > API Keys")
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
};

/**
 * Fonction qui envoie un email via EmailJS
 */
const sendEmailNotification = async (emailData: EmailData): Promise<boolean> => {
  // Afficher les valeurs des variables d'environnement (sans la clé publique complète pour des raisons de sécurité)
  console.log('Configuration EmailJS utilisée:', {
    SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
    TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID,
    PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? 'Configuré (commence par ' + EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 3) + '...)' : 'Non configuré'
  });
  
  console.log('Préparation de l\'envoi d\'email avec les données:', emailData);
  
  // Vérifier que toutes les données nécessaires sont présentes
  if (!emailData.to_email) {
    console.error('Erreur: email du destinataire manquant');
    return false;
  }
  
  try {
    // Mapper les données au format attendu par le template EmailJS
    const templateParams = {
      to_email: emailData.to_email,
      to_name: emailData.to_name || 'Utilisateur',
      question: emailData.question,
      answer: emailData.answer,
      app_name: emailData.app_name || 'ESIG-prep-guide',
      faq_url: emailData.faq_url || window.location.origin + '/Esig-prep-guide/faq'
    };
    
    console.log('Paramètres du template:', templateParams);
    console.log('Tentative d\'envoi d\'email via EmailJS...');
    
    // Vérifier qu'on est en environnement de développement
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Configurer EmailJS pour utiliser le proxy en développement
    if (isDevelopment) {
      // On définit l'URL de base pour les requêtes EmailJS
      // Ceci permet d'utiliser notre proxy configuré dans vite.config.ts
      emailjs.init({
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
        // Utiliser le proxy pour éviter les erreurs CORS en développement
        blockHeadless: false,
        limitRate: {
          // Limiter à 3 emails par seconde
          id: 'faq_responses',
          throttle: 3000
        }
      });
    }
    
    // Envoyer l'email via EmailJS
    console.log('Envoi via EmailJS avec les paramètres:', {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      template_params: templateParams,
      user_id: EMAILJS_CONFIG.PUBLIC_KEY?.substring(0, 3) + '...' // Pour ne pas afficher la clé complète dans les logs
    });
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    console.log('Résultat de l\'envoi d\'email:', response.status, response.text);
    
    // EmailJS renvoie un status 200 en cas de succès
    return response.status === 200;
  } catch (error) {
    // Afficher des informations plus détaillées sur l'erreur
    console.error('Détails de l\'erreur lors de l\'envoi d\'email:');
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Nom de l\'erreur:', error.name);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Erreur inconnue:', error);
    }
    return false;
  }
};

export default NotificationService;
