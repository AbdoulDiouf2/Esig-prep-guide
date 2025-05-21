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
      const faqRef = doc(db, 'faq', faqId);
      const faqDoc = await getDoc(faqRef);
      
      if (!faqDoc.exists()) {
        console.error(`FAQ item not found (ID: ${faqId}) dans la collection 'faq'. Vérifiez le nom de collection.`);
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
  console.log('Préparation de l\'envoi d\'email avec les données:', emailData);
  
  try {
    // Mapper les données au format attendu par le template EmailJS
    const templateParams = {
      to_email: emailData.to_email,
      to_name: emailData.to_name || 'Utilisateur',
      question: emailData.question,
      answer: emailData.answer,
      app_name: emailData.app_name,
      faq_url: emailData.faq_url
    };
    
    // Envoyer l'email via EmailJS
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
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return false;
  }
};

export default NotificationService;
