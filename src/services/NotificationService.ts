import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { Webinar } from '../pages/Webinars'; // Import du type Webinar

// Interface pour les données d'email
interface EmailData {
  to_email: string;
  to_name: string;
  question?: string;
  answer?: string;
  app_name?: string;
  faq_url?: string;
  email_subject?: string; // Sujet personnalisé pour l'email
  cc_list?: string; // Liste d'emails en copie (CC) séparés par des virgules
  bcc_list?: string; // Liste d'emails en copie cachée (CCI) séparés par des virgules
  message?: string; // Contenu du message pour les emails personnalisés
  is_test?: boolean; // Indique s'il s'agit d'un email de test
  [key: string]: string | boolean | undefined; // Pour les propriétés additionnelles qui pourraient être nécessaires
}

/**
 * Service pour gérer les notifications utilisateurs, notamment lors des réponses FAQ
 */
// Interface pour le suivi de la progression de l'envoi
interface EmailProgress {
  total: number;
  success: number;
  failed: number;
  processed: number;
  errors: Array<{email: string, error: string}>;
}

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
      
      // Formater la liste des intervenants
      const speakersList = webinar.speakers && webinar.speakers.length > 0 
        ? webinar.speakers.map(speaker => 
            `• ${speaker.name}${speaker.title ? `, ${speaker.title}` : ''}`
          ).join('\n')
        : 'Aucun intervenant spécifié';
      
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

          -----------------------------------------------

          📝 Description: 
          ${webinar.description}

          -----------------------------------------------

          📅 Date: ${dateFormatted} à ${timeFormatted} heure de France
          ⏱ Durée: ${webinar.duration} minutes
          
          👥 Intervenant(s):
          ${speakersList}
          
          📊 Niveau: ${webinar.level}

          -----------------------------------------------

          Pour vous inscrire, rendez-vous sur notre plateforme et accédez à la section webinaires.

          Ceci est une notification automatique, merci de ne pas y répondre directement.
        `,
        app_name: 'ESIG-prep-guide',
        faq_url: `${window.location.origin}/Esig-prep-guide/webinars`,
        // bcc_list: userEmails.join(',') // Cci pour l'envoi réel
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
  },

  /**
   * Envoie un email personnalisé à un utilisateur
   * @param toEmail Email du destinataire
   * @param subject Sujet de l'email
   * @param message Contenu du message (peut inclure du HTML)
   * @param toName Nom du destinataire (optionnel)
   * @param isTest Indique s'il s'agit d'un email de test
   * @param ccList Liste des adresses en copie (CC) (optionnel)
   * @param bccList Liste des adresses en copie cachée (CCI) (optionnel)
   */
  async sendCustomEmail(
    toEmail: string, 
    subject: string, 
    message: string, 
    toName?: string, 
    isTest = false,
    ccList?: string[],
    bccList?: string[]
  ): Promise<boolean> {
    try {
      // Préparer les données de l'email
      const emailData: EmailData = {
        to_email: toEmail,
        to_name: "",
        email_subject: isTest ? `[TEST] ${subject}` : subject,
        message: message,
        is_test: isTest,
        app_name: 'ESIG-prep-guide',
        question: 'Message',
        answer: message // Pour assurer la compatibilité avec le template existant
      };
      
      console.log('Contenu du message à envoyer:', message);

      // Ajouter les CC si fournis
      if (ccList && ccList.length > 0) {
        emailData.cc_list = ccList.join(',');
      }

      // Ajouter les CCI si fournis
      if (bccList && bccList.length > 0) {
        emailData.bcc_list = bccList.join(',');
      }

      // Envoyer l'email via EmailJS
      return await sendEmailNotification(emailData);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email personnalisé:', error);
      return false;
    }
  },

  /**
   * Récupère la liste des emails des utilisateurs filtrés par statut
   * @param status Statut des utilisateurs à filtrer ('tous', 'esigelec', 'cps', 'alumni', 'autres')
   */
  async getUsersByStatus(status: string = 'tous'): Promise<Array<{email: string, displayName: string}>> {
    try {
      let usersQuery = query(collection(db, 'users'));
      
      // Appliquer le filtre de statut si spécifié et différent de 'tous'
      if (status !== 'tous') {
        usersQuery = query(usersQuery, where('status', '==', status));
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      const users: Array<{email: string, displayName: string}> = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          users.push({
            email: userData.email,
            displayName: userData.displayName || userData.email.split('@')[0]
          });
        }
      });
      
      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  },

  /**
   * Envoie un email en masse à un groupe d'utilisateurs
   * @param users Liste des utilisateurs à qui envoyer l'email
   * @param subject Sujet de l'email
   * @param message Contenu du message (peut inclure du HTML)
   * @param batchSize Nombre d'emails à envoyer par lot (par défaut: 5)
   * @param progressCallback Fonction de rappel pour suivre la progression
   * @param ccList Liste optionnelle d'adresses email en copie carbone (CC)
   */
  async sendBulkEmail(
    users: Array<{email: string, displayName: string}>,
    subject: string,
    message: string,
    batchSize: number = 5,
    progressCallback?: (progress: EmailProgress) => void,
    ccList?: string[]
  ): Promise<EmailProgress> {
    const result: EmailProgress = {
      total: users.length,
      success: 0,
      failed: 0,
      processed: 0,
      errors: []
    };

    // Si aucun utilisateur, retourner immédiatement
    if (users.length === 0) {
      return result;
    }


    // Envoyer les emails par lots
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(user => 
        this.sendCustomEmail(
          user.email, 
          subject, 
          message, 
          user.displayName, 
          false,
          ccList
        )
        .then(success => ({
          email: user.email,
          success,
          error: success ? undefined : 'Erreur inconnue'
        }))
        .catch(error => ({
          email: user.email,
          success: false,
          error: error.message || 'Erreur inconnue'
        }))
      );

      // Attendre que tous les emails du lot soient envoyés
      const batchResults = await Promise.all(batchPromises);
      
      // Mettre à jour les résultats
      batchResults.forEach(r => {
        if (r.success) {
          result.success++;
        } else {
          result.failed++;
          if (r.error) {
            result.errors.push({
              email: r.email,
              error: r.error
            });
          }
        }
        result.processed++;
      });

      // Appeler le callback de progression si fourni
      if (progressCallback) {
        progressCallback({...result});
      }

      // Petite pause entre les lots pour éviter de surcharger le serveur
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }


    return result;
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
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  
  // ID du template d'email (sous "Email Templates")
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  
  // Clé publique API (sous "Account > API Keys")
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
};

/**
 * Fonction qui envoie un email via EmailJS
 */
const sendEmailNotification = async (emailData: EmailData): Promise<boolean> => {
  console.log('Préparation de l\'envoi d\'email à:', emailData.to_email);
  console.log('Sujet:', emailData.email_subject);
  console.log('Contenu du message:', emailData.message);
  if (emailData.bcc_list) {
    console.log(`Avec ${emailData.bcc_list.split(',').length} destinataires en Cci`);
  }
  
  try {
    // Mapper les données au format attendu par le template EmailJS
    const templateParams: {
      to_email: string;
      to_name: string;
      email_subject: string;
      question?: string;
      answer?: string;
      message?: string;
      app_name?: string;
      faq_url?: string;
      cc_list?: string;
      bcc_list?: string;
      is_test?: boolean;
    } = {
      to_email: emailData.to_email,
      to_name: '',
      email_subject: emailData.email_subject || 'Notification ESIG-prep-guide'
    };

    // Ajouter les champs optionnels s'ils sont définis
    if (emailData.question) templateParams.question = emailData.question;
    if (emailData.answer) templateParams.answer = emailData.answer;
    if (emailData.message) templateParams.message = emailData.message;
    if (emailData.app_name) templateParams.app_name = emailData.app_name;
    if (emailData.faq_url) templateParams.faq_url = emailData.faq_url;
    if (emailData.cc_list) templateParams.cc_list = emailData.cc_list;
    if (emailData.bcc_list) templateParams.bcc_list = emailData.bcc_list;
    if (emailData.is_test !== undefined) templateParams.is_test = emailData.is_test;
    
    // Vérification des paramètres obligatoires
    if (!templateParams.to_email) {
      console.error('Email du destinataire manquant');
      return false;
    }
    
    // Vérifier la configuration EmailJS
    if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
      console.error('Configuration EmailJS manquante');
      return false;
    }
    
    // Envoyer l'email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    // Succès avec plus de détails sur les destinataires
    if (response.status === 200) {
      let logMessage = `Email envoyé avec succès à ${emailData.to_email}`;
      
      if (emailData.cc_list) {
        const ccCount = emailData.cc_list.split(',').filter(Boolean).length;
        logMessage += `, ${ccCount} destinataire(s) en CC`;
      }
      
      if (emailData.bcc_list) {
        const bccCount = emailData.bcc_list.split(',').filter(Boolean).length;
        logMessage += `, ${bccCount} destinataire(s) en CCI`;
      }
      
      console.log(logMessage);
    }
    
    // EmailJS renvoie un status 200 en cas de succès
    return response.status === 200;
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return false;
  }
};

export default NotificationService;
