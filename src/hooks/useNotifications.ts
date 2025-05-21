import { useState } from 'react';
import { NotificationService } from '../services/NotificationService';

/**
 * Hook personnalisé pour gérer les notifications utilisateurs
 */
export const useNotifications = () => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Envoie une notification par email à l'utilisateur lorsque sa question FAQ a été répondue
   */
  const sendFaqAnswerNotification = async (
    faqId: string, 
    questionText: string, 
    answerText: string
  ): Promise<boolean> => {
    setIsSending(true);
    setSendSuccess(null);
    setErrorMessage(null);
    
    try {
      const result = await NotificationService.sendFaqAnswerNotification(
        faqId,
        questionText,
        answerText
      );
      
      setSendSuccess(result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'envoi de la notification';
      setErrorMessage(errorMsg);
      console.error('Failed to send FAQ answer notification:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendSuccess,
    errorMessage,
    sendFaqAnswerNotification
  };
};

export default useNotifications;
