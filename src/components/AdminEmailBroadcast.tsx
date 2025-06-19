import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/NotificationService';
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface pour les données d'email
interface EmailData {
  to_email: string;
  to_name: string;
  email_subject: string;
  message: string;
  is_test?: boolean;
  cc_list?: string;
  bcc_list?: string;
}

interface UserEmail {
  email: string;
  displayName: string;
}

const AdminEmailBroadcast: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<Array<{email: string, error: string}>>([]);
  const [recipientsPreview, setRecipientsPreview] = useState<UserEmail[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    status: 'esigelec', // Valeur par défaut pour le CCI
    subject: '',
    message: '',
    recipient: 'aad.mbacke691@gmail.com',
    cc: '',
    bcc: '',
    useCC: false,
    useBCC: false,
    sendTest: false
  });

  // Récupérer les utilisateurs pour le CCI
  const fetchRecipients = useCallback(async (status: string): Promise<UserEmail[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('status', '==', status));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || ''
        };
      }).filter(user => user.email); // Filtrer les utilisateurs sans email
    } catch (error) {
      console.error('Erreur lors de la récupération des destinataires CCI:', error);
      return [];
    }
  }, []);

  // Mettre à jour l'aperçu des destinataires
  const updateRecipientsPreview = useCallback(async (status: string) => {
    setIsLoadingRecipients(true);
    try {
      const users = await fetchRecipients(status);
      setRecipientsPreview(users);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'aperçu des destinataires:', error);
      setRecipientsPreview([]);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [fetchRecipients]);

  // Mettre à jour l'aperçu quand le statut change
  useEffect(() => {
    if (formData.status) {
      updateRecipientsPreview(formData.status);
    }
  }, [formData.status, updateRecipientsPreview]);

  // Gestion du changement des champs du formulaire
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    
    const newValue = type === 'checkbox' ? target.checked : value;
    await setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Si le statut change, mettre à jour l'aperçu
    if (name === 'status' && typeof newValue === 'string') {
      await updateRecipientsPreview(newValue);
    }
  };

  // Envoyer un email de test
  const handleSendTest = async () => {
    if (sending) return;
    
    if (!formData.recipient || !formData.subject || !formData.message) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSending(true);
    
    try {
      // Préparer les données de l'email de test
      const emailData: EmailData = {
        to_email: formData.recipient,
        to_name: formData.recipient.split('@')[0],
        email_subject: `[TEST] ${formData.subject}`,
        message: formData.message,
        is_test: true
      };

      // Ajouter les CC si activé
      if (formData.useCC && formData.cc) {
        const ccEmails = formData.cc.split(',').map(email => email.trim()).filter(Boolean);
        if (ccEmails.length > 0) {
          emailData.cc_list = ccEmails.join(',');
        }
      }

      // Ajouter les CCI si activé (uniquement manuels pour le test)
      if (formData.useBCC && formData.bcc) {
        const bccEmails = formData.bcc.split(',').map(email => email.trim()).filter(Boolean);
        if (bccEmails.length > 0) {
          emailData.bcc_list = bccEmails.join(',');
        }
      }

      // Envoyer l'email de test
      const result = await NotificationService.sendCustomEmail(
        emailData.to_email,
        emailData.email_subject,
        emailData.message,
        emailData.to_name,
        true,
        emailData.cc_list ? emailData.cc_list.split(',') : undefined,
        emailData.bcc_list ? emailData.bcc_list.split(',') : undefined
      );

      if (result) {
        alert("Email de test envoyé avec succès !");
      } else {
        alert("Échec de l'envoi de l'email de test");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      alert(`Une erreur est survenue : ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  // Envoyer les emails en masse
  const handleSendBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setSending(true);
    setSuccessCount(0);
    setErrorCount(0);
    setErrors([]);

    try {
      // Récupérer les utilisateurs pour le CCI si activé
      let bccUsers: UserEmail[] = [];
      if (formData.useBCC) {
        bccUsers = await fetchRecipients(formData.status);
        
        if (bccUsers.length === 0) {
          alert('Aucun utilisateur trouvé pour le statut sélectionné en CCI.');
          return;
        }
      }

      // Préparer les adresses CCI (manuelles + liste déroulante)
      const manualBccEmails = formData.bcc 
        ? formData.bcc.split(',').map(email => email.trim()).filter(Boolean)
        : [];
      
      // Préparer les adresses CC
      const ccEmails = formData.useCC && formData.cc 
        ? formData.cc.split(',').map(email => email.trim()).filter(Boolean)
        : [];

      // Préparer les données de l'email principal
      const emailData: EmailData = {
        to_email: formData.recipient,
        to_name: formData.recipient.split('@')[0],
        email_subject: formData.subject,
        message: formData.message,
        is_test: false
      };

      // Ajouter les CC si activé
      if (ccEmails.length > 0) {
        emailData.cc_list = ccEmails.join(',');
      }

      // Ajouter les CCI (manuelles + liste déroulante)
      const allBccEmails = [
        ...manualBccEmails,
        ...bccUsers.map(user => user.email)
      ].filter((email, index, self) => 
        email && self.indexOf(email) === index
      );

      if (allBccEmails.length > 0) {
        emailData.bcc_list = allBccEmails.join(',');
      }

      // Envoyer l'email principal avec les CC et CCI
      console.log('Envoi de l\'email avec les paramètres:', {
        to: emailData.to_email,
        subject: emailData.email_subject,
        cc: emailData.cc_list,
        bcc: emailData.bcc_list
      });
      
      const result = await NotificationService.sendCustomEmail(
        emailData.to_email,
        emailData.email_subject,
        emailData.message,
        emailData.to_name,
        false,
        emailData.cc_list ? emailData.cc_list.split(',').filter(Boolean) : undefined,
        emailData.bcc_list ? emailData.bcc_list.split(',').filter(Boolean) : undefined
      );
      
      if (!result) {
        throw new Error("Échec de l'envoi de l'email principal");
      }

      // Afficher un récapitulatif
      let summary = `Email envoyé avec succès à :\n${formData.recipient}\n\n`;
      
      if (ccEmails.length > 0) {
        summary += `Copie (CC) :\n${ccEmails.join('\n')}\n\n`;
      }
      
      if (allBccEmails.length > 0) {
        summary += `Copie cachée (CCI) :\n${allBccEmails.join('\n')}\n\n`;
        summary += `Total destinataires CCI : ${allBccEmails.length}`;
      }
      
      alert(summary);
      
      // Réinitialiser le formulaire
      setFormData(prev => ({
        ...prev,
        subject: '',
        message: '',
        cc: '',
        bcc: '',
        useCC: false,
        useBCC: false
      }));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      alert(`Une erreur est survenue : ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  // Vérifier les droits d'accès
  useEffect(() => {
    const checkAccess = async () => {
      if (currentUser) {
        const isSuper = await isSuperAdmin();
        if (!isSuper) {
          navigate('/admin');
        }
      }
      setLoading(false);
    };
    checkAccess();
  }, [currentUser, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour admin
          </button>
          <h1 className="text-2xl font-bold">Diffusion d'emails</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nouvelle diffusion</h2>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (sending) return;
            setSending(true);
            setSuccessCount(0);
            setErrorCount(0);
            setErrors([]);

            if (formData.sendTest) {
              handleSendTest();
            } else {
              handleSendBatch(e);
            }
            
            setSending(false);
          }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                  Destinataire principal
                </label>
                <input
                  type="email"
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={sending}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sujet de l'email"
                  disabled={sending}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useCC"
                      name="useCC"
                      checked={formData.useCC}
                      onChange={(e) => setFormData(prev => ({ ...prev, useCC: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={sending}
                    />
                    <label htmlFor="useCC" className="ml-2 block text-sm font-medium text-gray-700">
                      Copie (CC)
                    </label>
                  </div>
                  {formData.useCC && (
                    <div className="ml-6">
                      <input
                        type="text"
                        name="cc"
                        value={formData.cc}
                        onChange={handleChange}
                        placeholder="email1@exemple.com, email2@exemple.com"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={sending}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Séparez les adresses par des virgules
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useBCC"
                      name="useBCC"
                      checked={formData.useBCC}
                      onChange={(e) => setFormData(prev => ({ ...prev, useBCC: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={sending}
                    />
                    <label htmlFor="useBCC" className="ml-2 block text-sm font-medium text-gray-700">
                      Destinataires en copie cachée (CCI)
                    </label>
                  </div>
                  {formData.useBCC && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          Sélectionner un groupe
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          disabled={sending}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="esigelec">Étudiants ESIGELEC</option>
                          <option value="cps">Étudiants CPS</option>
                          <option value="alumni">Alumni</option>
                          <option value="autres">Autres statuts</option>
                        </select>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">
                            {isLoadingRecipients ? (
                              <span>Chargement des destinataires...</span>
                            ) : (
                              <span>{recipientsPreview.length} destinataire(s) trouvé(s) pour le statut "{formData.status}"</span>
                            )}
                          </p>
                          
                          {recipientsPreview.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-1">Destinataires :</p>
                              <ul className="text-xs space-y-1 max-h-96 overflow-y-auto">
                                {recipientsPreview.map((user, index) => (
                                  <li key={index} className="flex items-center py-1 px-2 hover:bg-gray-100 rounded">
                                    <span className="truncate" title={`${user.displayName} <${user.email}>`}>
                                      <span className="font-medium">{user.displayName}</span> 
                                      <span className="text-gray-500">&lt;{user.email}&gt;</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                          Ou saisir des adresses manuellement
                        </label>
                        <input
                          type="text"
                          name="bcc"
                          value={formData.bcc}
                          onChange={handleChange}
                          placeholder="email1@exemple.com, email2@exemple.com"
                          className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          disabled={sending}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Séparez les adresses par des virgules
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={sending}
                rows={10}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Contenu de l'email (le HTML est supporté)"
              ></textarea>
              <p className="mt-1 text-sm text-gray-500">
                Vous pouvez utiliser du HTML pour formater votre message. Les variables disponibles :<br />
                <code className="bg-gray-100 px-1 rounded">{"{{displayName}}"}</code> - Affiche le nom de l'utilisateur<br />
                <code className="bg-gray-100 px-1 rounded">{"{{email}}"}</code> - Affiche l'email de l'utilisateur
              </p>
            </div>

            {/* Affichage des erreurs */}
            {errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.length} erreur(s) survenue(s) lors de l'envoi
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.slice(0, 3).map((err, index) => (
                          <li key={index}>
                            {err.email}: {err.error}
                          </li>
                        ))}
                        {errors.length > 3 && (
                          <li>...et {errors.length - 3} erreur(s) supplémentaires</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Barre de progression */}
            {sending && (
              <div className="pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Envoi en cours...</span>
                  <span>
                    {successCount > 0 ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${successCount > 0 ? 100 : 50}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> {successCount} email(s) envoyé(s)
                  </span>
                  {errorCount > 0 && (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" /> {errorCount} erreur(s)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                disabled={sending}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending || !formData.subject || !formData.message}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="-ml-1 mr-2 h-4 w-4" />
                    Envoyer à tous
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section d'aide et d'informations */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Conseils pour l'envoi d'emails</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Testez toujours votre email avant de l'envoyer à tous les utilisateurs</li>
                  <li>Évitez d'utiliser des images hébergées sur votre ordinateur</li>
                  <li>Vérifiez que vos liens sont absolus (commencent par http:// ou https://)</li>
                  <li>Limitez la taille de vos emails pour éviter les problèmes de délivrabilité</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailBroadcast;