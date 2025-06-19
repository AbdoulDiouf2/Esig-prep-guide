import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { Webinar } from '../pages/Webinars'; // Import du type Webinar

// Interface pour les données d'email
interface EmailData {
  to_email: string;
  to_name: string;
  question: string;
  answer: string;
  app_name: string;
  faq_url: string;
  email_subject?: string; // Sujet personnalisé pour l'email
  bcc_list?: string; // Liste d'emails en Cci séparés par des virgules
  [key: string]: string | undefined; // Pour les propriétés additionnelles qui pourraient être nécessaires
}

/**
 * Service pour gérer les notifications utilisateurs, notamment lors des réponses FAQ
 */
export const NotificationService = {
  /**
   * Envoie une notification par email à l'utilisateur dont la question FAQ a été répondue.
   * @param faqId - L'ID de l'entrée FAQ
   * @param questionText - Le texte de la question (peut être passé directement pour éviter une requête supplémentaire)
   * @param answerText - Le texte de la réponse (peut être passé directement)
   * @returns Promise<boolean> - Succès ou échec de l'envoi
   */
  async sendFaqAnswerNotification(faqId: string, questionText: string, answerText: string): Promise<boolean> {
    try {
      console.log(`Préparation de la notification FAQ pour l'ID: ${faqId}`);
      
      // 1. Récupérer les détails de la FAQ
      const faqRef = doc(db, 'faq', faqId);
      const faqDoc = await getDoc(faqRef);
      const faqData = faqDoc.data();
      
      // Vérifier si la FAQ existe et contient un userId
      if (!faqData || !faqData.userId) {
        console.error('FAQ introuvable ou sans utilisateur associé');
        return false;
      }
      
      // 2. Récupérer les détails de l'utilisateur
      const userId = faqData.userId;
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Vérifier si l'utilisateur existe et possède un email
      if (!userData || !userData.email) {
        console.error('Utilisateur introuvable ou sans email');
        return false;
      }
      
      // 3. Préparer les données de l'email avec un format texte simple et émoji
      const emailData: EmailData = {
        to_email: userData.email,
        to_name: userData.displayName || userData.email.split('@')[0], // Utiliser le nom d'affichage ou la partie locale de l'email
        question: "Réponse à votre question",
        email_subject: "[ESIG-prep-guide] Votre question a été répondue",
        answer: `
          Nous avons le plaisir de vous informer que votre question a reçu une réponse de notre équipe.

          -----------------------------------------------

          💬 VOTRE QUESTION:

          ${questionText}

          -----------------------------------------------

          📝 NOTRE RÉPONSE:

          ${answerText}

          -----------------------------------------------

          Si vous avez d'autres questions, n'hésitez pas à les poser sur notre plateforme.

          Ceci est une notification automatique, merci de ne pas y répondre directement.
        `,
        app_name: 'ESIG-prep-guide',
        faq_url: `${window.location.origin}/Esig-prep-guide/faq`
      };
      
      // 4. Envoyer l'email et retourner le résultat
      return await sendEmailNotification(emailData);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification FAQ:', error);
      return false;
    }
  },

  /**
   * Envoie une notification par email à tous les étudiants lors de la création d'un webinaire
   * @param webinar Le webinaire nouvellement créé
   * @param userLimit Limite éventuelle du nombre d'utilisateurs à notifier (pour tests ou envois progressifs)
   */
  async sendWebinarCreationNotification(webinar: Webinar, userLimit?: number): Promise<{success: number, failed: number}> {
    try {
      console.log('Préparation de la notification pour la création du webinaire:', webinar.title);
      
      // 1. Récupérer la liste des utilisateurs pour les Cci
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef);
      const usersSnapshot = await getDocs(usersQuery);
      
      // Informations basiques sur le nombre d'utilisateurs
      if (usersSnapshot.docs.length === 0) {
        console.warn(`Aucun utilisateur trouvé dans la collection 'users'`);
      }
      
      // 2. Obtenir le format de date et d'heure pour le webinaire
      const startDate = new Date(webinar.date);
      
      // Format français pour la date (JJ/MM/AAAA)
      const dateFormatted = startDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Format d'heure (HH:MM)
      const timeFormatted = startDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      // Limiter le nombre d'utilisateurs si spécifié (pour tests)
      const users = usersSnapshot.docs;
      const limitedUsers = userLimit ? users.slice(0, userLimit) : users;
      
      // Email principal pour la notification (votre email)
      const mainEmail = 'aad.mbacke691@gmail.com';
      
      // Extraire les emails des utilisateurs pour les mettre en Cci
      const userEmails = limitedUsers
        .map(userDoc => userDoc.data().email)
        .filter(email => email && email !== mainEmail); // Filtrer les emails valides et différents de l'email principal
      
      // Log détaillé pour voir la liste des emails qui seraient en Cci
      console.log(`Préparation d'un email pour ${userEmails.length + 1} destinataires (1 principal + ${userEmails.length} en Cci)`);
      console.log('Liste des emails qui seraient en Cci:', userEmails);
      
      // 3. Préparer le contenu de l'email pour notification webinaire
      const emailData: EmailData = {
        to_email: mainEmail,
        to_name: "",
        question: `Nouveau webinaire disponible`,
        email_subject: `[ESIG-prep-guide] Nouveau webinaire : ${webinar.title}`,
        // Format sans HTML complexe pour garantir la compatibilité avec tous les clients email
        answer: `
          Nous avons le plaisir de vous informer qu'un nouveau webinaire a été programmé sur la plateforme ESIG-prep-guide.

          -----------------------------------------------

          🏛️ ${webinar.title}

          📝 Description: ${webinar.description.substring(0, 150)}${webinar.description.length > 150 ? '...' : ''}

          📅 Date: ${dateFormatted} à ${timeFormatted}
          ⏱ Durée: ${webinar.duration} minutes
          👨‍🏫 Présentateur: ${webinar.speaker.name}, ${webinar.speaker.title}
          📊 Niveau: ${webinar.level}

          -----------------------------------------------

          Pour vous inscrire, rendez-vous sur notre plateforme et accédez à la section webinaires.

          Ceci est une notification automatique, merci de ne pas y répondre directement.
        `,
        app_name: 'ESIG-prep-guide',
        faq_url: `${window.location.origin}/Esig-prep-guide/webinars`,
        bcc_list: userEmails.join(',') // Cci pour l'envoi réel
      };
      
      // 4. Envoi de l'email unique avec Cci
      const success = await sendEmailNotification(emailData);
      
      // Rapporter le résultat
      const successCount = success ? 1 : 0; // Un seul email envoyé, donc 0 ou 1 succès
      const failureCount = success ? 0 : 1;
      
      // Calculer le nombre réel de destinataires notifiés
      const totalRecipients = success ? userEmails.length + 1 : 0;
      
      console.log(`Notification webinaire envoyée - Email envoyé avec succès: ${successCount}, Destinataires: ${totalRecipients}`);
      return { success: totalRecipients, failed: failureCount };
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications webinaire:', error);
      return { success: 0, failed: 0 };
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
  console.log('Préparation de l\'envoi d\'email à:', emailData.to_email);
  if (emailData.bcc_list) {
    console.log(`Avec ${emailData.bcc_list.split(',').length} destinataires en Cci`);
  }
  
  try {
    // Mapper les données au format attendu par le template EmailJS
    const templateParams = {
      to_email: emailData.to_email,
      to_name: emailData.to_name || 'Utilisateur',
      question: emailData.question,
      answer: emailData.answer,
      app_name: emailData.app_name,
      faq_url: emailData.faq_url,
      email_subject: emailData.email_subject || 'Notification ESIG-prep-guide',
      bcc_list: emailData.bcc_list || '' // Ajout du champ pour les destinataires en Cci
    };
    
    // Vérification des paramètres obligatoires
    if (!templateParams.to_email) {
      console.error('Email du destinataire manquant');
      return false;
    }
    
    // Envoyer l'email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    // Succès avec plus de détails si des destinataires Cci sont présents
    if (response.status === 200) {
      if (emailData.bcc_list) {
        console.log(`Email envoyé avec succès à ${emailData.to_email} et ${emailData.bcc_list.split(',').length} destinataires en Cci`);
      } else {
        console.log(`Email envoyé avec succès à ${emailData.to_email}`);
      }
    }
    
    // EmailJS renvoie un status 200 en cas de succès
    return response.status === 200;
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return false;
  }
};

export default NotificationService;
