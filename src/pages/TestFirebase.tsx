import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, FirestoreError } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  User as FirebaseUser,
  AuthError 
} from 'firebase/auth';
import DropboxUploader from '../components/dropbox';
import { Dropbox } from 'dropbox';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../services/NotificationService';

// Interface pour les fichiers Dropbox
interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
  size?: number;
  client_modified?: string;
  is_downloadable?: boolean;
  shared_link?: {
    url: string;
  }
}

const TestFirebase: React.FC = () => {
  const [testData, setTestData] = useState<string>('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('test1234');
  const [dropboxStatus, setDropboxStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dropboxError, setDropboxError] = useState<string>('');
  const [dropboxFiles, setDropboxFiles] = useState<DropboxFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  
  // États pour les tests d'envoi d'email
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailTestError, setEmailTestError] = useState<string>('');
  const [testEmail, setTestEmail] = useState<string>('');
  const [testSubject, setTestSubject] = useState<string>('Test EmailJS depuis ESIG-prep-guide');
  const [testMessage, setTestMessage] = useState<string>('Ceci est un email de test pour vérifier la configuration d\'EmailJS.');

  // États pour les tests Dropbox Token
  const [dropboxTokenStatus, setDropboxTokenStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dropboxToken, setDropboxToken] = useState<string>('');
  const [dropboxTokenError, setDropboxTokenError] = useState<string>('');

  // Tester la récupération de l'access token Dropbox depuis Netlify Function
  const testDropboxToken = async () => {
    setDropboxTokenStatus('loading');
    setDropboxToken('');
    setDropboxTokenError('');
    
    try {
      // Créer différentes variantes d'URL à tester
      const urls = [
        // URL absolue de Netlify (fonctionne quel que soit l'hébergement)
        'https://esig-prep-guide.netlify.app/.netlify/functions/dropbox-token',
        
        // URLs locales avec CORS (pour le dev local)
        'http://localhost:8888/.netlify/functions/dropbox-token',
        'http://localhost:8888/.netlify/functions/dropbox-token.cjs',
        
        // URLs relatives ajustées selon l'environnement
        window.location.hostname.includes('netlify.app') 
          ? '/.netlify/functions/dropbox-token' 
          : '/Esig-prep-guide/.netlify/functions/dropbox-token',
          
        window.location.hostname.includes('netlify.app') 
          ? '/.netlify/functions/dropbox-token.cjs' 
          : '/Esig-prep-guide/.netlify/functions/dropbox-token.cjs'
      ];
      
      console.log('Environnement :', {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        protocol: window.location.protocol,
        urls: urls
      });
      
      let success = false;
      let lastError = '';
      
      // Essayer les deux URLs
      for (const url of urls) {
        try {
          const response = await fetch(url);
          console.log(`Test ${url} - Status:`, response.status);
          
          if (response.ok) {
            // Vérifier le Content-Type pour déterminer comment traiter la réponse
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const data = await response.json();
                console.log(`Test ${url} - Data:`, data);
                
                if (data.access_token) {
                  setDropboxToken(data.access_token);
                  setDropboxTokenStatus('success');
                  success = true;
                  break; // Sortir de la boucle si on a réussi
                } else {
                  lastError = `Réponse reçue de ${url} mais pas d'access_token trouvé: ${JSON.stringify(data)}`;
                }
              } catch (parseError) {
                const text = await response.clone().text();
                const preview = text.substring(0, 100) + '...';
                lastError = `Erreur de parsing JSON pour ${url}: ${preview}`;
                console.error('Erreur de parsing JSON:', parseError);
                console.log('Contenu de la réponse (début):', preview);
              }
            } else {
              // La réponse n'est pas du JSON
              const text = await response.text();
              const preview = text.substring(0, 150) + '...';
              lastError = `Réponse reçue de ${url} mais pas au format JSON (${contentType}): ${preview}`;
              console.log('Réponse complète:', text);
            }
          } else {
            const text = await response.text();
            const preview = text.length > 150 ? text.substring(0, 150) + '...' : text;
            lastError = `Erreur HTTP ${response.status} pour ${url}: ${preview}`;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          lastError = `Exception lors de l'appel à ${url}: ${errorMessage}`;
        }
      }
      
      if (!success) {
        setDropboxTokenError(lastError);
        setDropboxTokenStatus('error');
      }
    } catch (err: unknown) {
      console.error('Erreur lors du test de récupération de token:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setDropboxTokenError(`Erreur générale: ${errorMessage}`);
      setDropboxTokenStatus('error');
    }
  };
  
  // Tester la connexion à Firestore
  const testFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'test'));
      if (querySnapshot.empty) {
        // Créer un document de test s'il n'existe pas
        await addDoc(collection(db, 'test'), {
          message: 'Connexion à Firestore réussie!',
          timestamp: new Date().toISOString()
        });
        setTestData('Document créé avec succès!');
      } else {
        setTestData('Connexion à Firestore réussie!');
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Erreur Firestore:', firestoreError);
      setTestData(`Erreur Firestore: ${firestoreError.message}`);
    }
  };

  // Tester la connexion à Dropbox
  const testDropboxConnection = async () => {
    const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
    
    if (!DROPBOX_ACCESS_TOKEN) {
      setDropboxStatus('error');
      setDropboxError('Erreur : Token Dropbox non trouvé dans les variables d\'environnement (VITE_DROPBOX_ACCESS_TOKEN)');
      return;
    }
    
    setDropboxStatus('loading');
    setDropboxError('');
    
    try {
      // Créer une instance Dropbox
      const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
      
      // Test simple : récupérer les informations du compte
      const response = await dbx.usersGetCurrentAccount();
      
      // Si on arrive ici, la connexion est réussie
      setDropboxStatus('success');
      setTestData(prev => prev + '\n\nConnexion Dropbox réussie! Compte: ' + 
        response.result.name.display_name + ' (Email: ' + 
        response.result.email + ')');

      // Une fois connecté, récupérons la liste des fichiers
      await listDropboxFiles();
    } catch (error) {
      console.error('Erreur de connexion Dropbox:', error);
      setDropboxStatus('error');
      if (error instanceof Error) {
        setDropboxError(`Erreur de connexion Dropbox: ${error.message}`);
        setTestData(prev => prev + '\n\nErreur de connexion Dropbox: ' + error.message);
      } else {
        setDropboxError(`Erreur de connexion Dropbox: ${String(error)}`);
        setTestData(prev => prev + '\n\nErreur de connexion Dropbox: ' + String(error));
      }
    }
  };

  // Récupérer la liste des fichiers Dropbox
  const listDropboxFiles = async () => {
    const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
    if (!DROPBOX_ACCESS_TOKEN) return;
    
    setLoadingFiles(true);
    setTestData(prev => prev + '\n\nChargement des fichiers Dropbox...');
    
    try {
      const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
      
      // Lister le contenu du dossier racine
      const response = await dbx.filesListFolder({
        path: '',
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      });
      
      const files = response.result.entries.filter(entry => entry['.tag'] === 'file');
      
      // Convertir au format DropboxFile
      const formattedFiles: DropboxFile[] = files.map(file => ({
        id: file.id,
        name: file.name,
        path_lower: file.path_lower || '',
        path_display: file.path_display || file.name,
        size: 'size' in file ? file.size : undefined,
        client_modified: 'client_modified' in file ? file.client_modified : undefined,
        is_downloadable: true
      }));
      
      setDropboxFiles(formattedFiles);
      setTestData(prev => prev + `\n\n${formattedFiles.length} fichiers trouvés dans Dropbox.`);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      if (error instanceof Error) {
        setTestData(prev => prev + '\n\nErreur lors de la récupération des fichiers: ' + error.message);
      } else {
        setTestData(prev => prev + '\n\nErreur lors de la récupération des fichiers: ' + String(error));
      }
    } finally {
      setLoadingFiles(false);
    }
  };
  
  // Créer un lien de partage pour un fichier
  const createShareLink = async (file: DropboxFile) => {
    const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
    if (!DROPBOX_ACCESS_TOKEN) return;
    
    setTestData(prev => prev + `\n\nCréation d'un lien de partage pour ${file.name}...`);
    
    try {
      const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
      
      const response = await dbx.sharingCreateSharedLinkWithSettings({
        path: file.path_lower,
      });
      
      const rawUrl = response.result.url.replace("?dl=0", "?raw=1");
      setTestData(prev => prev + `\n\nLien de partage créé avec succès: ${rawUrl}`);
      
      // Mise à jour du fichier sélectionné avec le lien
      setSelectedFile({
        ...file,
        shared_link: {
          url: rawUrl
        }
      });
      
      return rawUrl;
    } catch (error) {
      console.error('Erreur lors de la création du lien de partage:', error);
      if (error instanceof Error) {
        setTestData(prev => prev + '\n\nErreur lors de la création du lien de partage: ' + error.message);
      } else {
        setTestData(prev => prev + '\n\nErreur lors de la création du lien de partage: ' + String(error));
      }
    }
  };

  // Tester l'authentification
  const testAuth = async () => {
    try {
      // Création ou connexion d'un utilisateur de test
      if (email) {
        // Essayer de créer l'utilisateur d'abord
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          setUser(userCredential.user);
          setTestData(prev => prev + `\n\nCréation de l'utilisateur réussie! UID: ${userCredential.user.uid}`);
        } catch (error) {
          // Si l'utilisateur existe déjà, essayer de se connecter
          console.log('Erreur lors de la création, tentative de connexion...', error);
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            setTestData(prev => prev + `\n\nConnexion réussie! UID: ${userCredential.user.uid}`);
          } catch (loginError) {
            const authError = loginError as AuthError;
            console.error('Erreur d\'authentification:', authError);
            setTestData(prev => prev + `\n\nErreur d'authentification: ${authError.message}`);
          }
        }
      } else {
        setTestData(prev => prev + '\n\nErreur: Veuillez entrer une adresse email.');
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      if (error instanceof Error) {
        setTestData(prev => prev + `\n\nErreur inattendue: ${error.message}`);
      } else {
        setTestData(prev => prev + `\n\nErreur inattendue: ${String(error)}`);
      }
    }
  };

  // Tester l'envoi d'email avec EmailJS
  const testEmailSending = async () => {
    if (!testEmail) {
      setEmailTestError('Veuillez entrer une adresse email de destination');
      return;
    }

    setEmailTestStatus('loading');
    setEmailTestError('');
    setTestData(prev => prev + '\n\nEnvoi d\'email en cours...');

    try {
      // Préparation des données pour le template
      const templateParams = {
        to_email: testEmail,
        to_name: 'Utilisateur de test',
        subject: testSubject,
        message: testMessage,
        app_name: 'ESIG-prep-guide',
        faq_url: window.location.origin + '/faq'
      };

      // Envoi d'email via EmailJS
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Email envoyé avec succès!', response);
      setEmailTestStatus('success');
      setTestData(prev => prev + `\n\nEmail envoyé avec succès! ID: ${response.status}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email:', error);
      setEmailTestStatus('error');
      
      if (error instanceof Error) {
        setEmailTestError(`Erreur lors de l'envoi d'email: ${error.message}`);
        setTestData(prev => prev + `\n\nErreur lors de l'envoi d'email: ${error.message}`);
      } else {
        setEmailTestError(`Erreur lors de l'envoi d'email: ${String(error)}`);
        setTestData(prev => prev + `\n\nErreur lors de l'envoi d'email: ${String(error)}`);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setEmail(user.email || '');
      }
      setLoading(false);
    });

    // Nettoyer l'abonnement
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test d'intégration Firebase</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Statut de connexion</h2>
        <p>Utilisateur: {user ? user.email : 'Non connecté'}</p>
        <p>UID: {user?.uid || 'N/A'}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Firestore</h2>
        <button
          onClick={testFirestore}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
        >
          Tester Firestore
        </button>
        <button
          onClick={async () => {
            setTestData('Initialisation en cours...');
            try {
              // guideSections
              await addDoc(collection(db, 'guideSections'), {
                title: 'Préparer son dossier Campus France',
                content: 'Voici comment préparer...',
                phase: 'pre-cps',
                order: 1
              });
              await addDoc(collection(db, 'guideSections'), {
                title: 'Demander son visa',
                content: 'Procédure détaillée...',
                phase: 'post-cps',
                order: 2
              });
              // resources
              await addDoc(collection(db, 'resources'), {
                title: 'Formulaire Visa',
                description: 'Document officiel pour la demande de visa.',
                phase: 'post-cps',
                category: 'visa',
                fileUrl: 'https://...',
                createdAt: new Date().toISOString()
              });
              // faq
              await addDoc(collection(db, 'faq'), {
                question: 'Comment obtenir un logement ?',
                answer: 'Contactez le service logement de l\'ESIGELEC...',
                phase: 'arrivée',
                createdAt: new Date().toISOString()
              });
              setTestData('Base initialisée avec succès !');
            } catch (e) {
              setTestData('Erreur lors de l\'initialisation : ' + (e as unknown as Error).message);
            }
          }}
          className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
        >
          Initialiser la base
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test d'authentification</h2>
        <div className="mb-4">
          <label className="block mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full max-w-md"
            placeholder="email@example.com"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Mot de passe (test):</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full max-w-md"
          />
        </div>
        <button
          onClick={testAuth}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={!email || !password}
        >
          {user ? 'Se connecter' : 'Créer un compte'}
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test d'envoi d'email</h2>
        <div className="mb-4">
          <label className="block mb-2">Adresse email de destination:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="border p-2 w-full max-w-md"
            placeholder="email@example.com"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Sujet:</label>
          <input
            type="text"
            value={testSubject}
            onChange={(e) => setTestSubject(e.target.value)}
            className="border p-2 w-full max-w-md"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Message:</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="border p-2 w-full max-w-md"
          />
        </div>
        <button
          onClick={testEmailSending}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          disabled={!testEmail}
        >
          Envoyer l'email
        </button>
        {emailTestStatus === 'error' && (
          <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
            ❌ {emailTestError}
          </div>
        )}
        {emailTestStatus === 'success' && (
          <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
            ✅ Email envoyé avec succès!
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Résultats des tests</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {testData || 'Aucun test effectué'}
        </pre>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Dropbox</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">1. Tester l'endpoint Netlify Function pour Dropbox Token</h3>
          <button
            onClick={testDropboxToken}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
            disabled={dropboxTokenStatus === 'loading'}
          >
            {dropboxTokenStatus === 'loading' ? 'Chargement...' : 'Tester l\'endpoint Dropbox Token'}
          </button>
          
          {dropboxTokenStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
              <h4 className="font-semibold mb-1">❌ Erreur lors de la récupération du token</h4>
              <p className="text-sm">{dropboxTokenError}</p>
            </div>
          )}
          
          {dropboxTokenStatus === 'success' && (
            <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
              <h4 className="font-semibold mb-1">✅ Access token récupéré avec succès !</h4>
              <p className="text-sm break-all">Token: {dropboxToken.substring(0, 20)}...{dropboxToken.substring(dropboxToken.length - 10)}</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">2. Tester la connectivité Dropbox</h3>
          <p className="text-sm text-gray-600 mb-2">
            Vérifiez d'abord si vos identifiants Dropbox sont correctement configurés et si la connexion fonctionne.
          </p>
          <button
            onClick={testDropboxConnection}
            className={`flex items-center justify-center py-2 px-4 rounded-md font-medium text-white transition-colors ${
              dropboxStatus === 'loading' 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={dropboxStatus === 'loading'}
          >
            {dropboxStatus === 'loading' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vérification en cours...
              </>
            ) : (
              'Tester la connectivité Dropbox'
            )}
          </button>
          
          {dropboxStatus === 'success' && (
            <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
              ✅ Connexion Dropbox établie avec succès!
            </div>
          )}
          
          {dropboxStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
              ❌ {dropboxError}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">2. Explorer les fichiers Dropbox</h3>
          <p className="text-sm text-gray-600 mb-2">
            Afficher la liste des fichiers disponibles dans votre compte Dropbox et créer des liens partageables.
          </p>
          
          <button
            onClick={listDropboxFiles}
            className="flex items-center justify-center py-2 px-4 rounded-md font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 mb-4"
            disabled={loadingFiles || dropboxStatus !== 'success'}
          >
            {loadingFiles ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement des fichiers...
              </>
            ) : (
              'Lister les fichiers Dropbox'
            )}
          </button>
          
          {dropboxFiles.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700 border-b">
                Fichiers disponibles dans Dropbox ({dropboxFiles.length})
              </div>
              <div className="divide-y max-h-60 overflow-auto">
                {dropboxFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className={`px-4 py-3 flex items-center justify-between hover:bg-blue-50 cursor-pointer ${
                      selectedFile?.id === file.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex-1 mr-4 truncate">
                      <div className="font-medium text-gray-800">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {file.size ? `${Math.round(file.size / 1024)} Ko` : ''}
                        {file.client_modified ? ` • Modifié le ${new Date(file.client_modified).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    <button
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        createShareLink(file);
                      }}
                    >
                      Créer un lien
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Fichier sélectionné : {selectedFile.name}</h4>
              {selectedFile.shared_link ? (
                <div className="flex items-center">
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedFile.shared_link.url} 
                    className="flex-1 py-2 px-3 bg-white border rounded-l-md focus:outline-none text-sm"
                  />
                  <button 
                    className="bg-blue-600 text-white py-2 px-3 rounded-r-md text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFile.shared_link!.url);
                      setTestData(prev => prev + '\n\nLien copié dans le presse-papier!');
                    }}
                  >
                    Copier
                  </button>
                </div>
              ) : (
                <button
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  onClick={() => createShareLink(selectedFile)}
                >
                  Générer un lien partageable
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">3. Tester l'upload de fichiers</h3>
          <p className="text-sm text-gray-600 mb-2">
            Uploadez un nouveau fichier vers votre compte Dropbox.
          </p>
          <DropboxUploader 
            buttonText="Uploader un fichier test" 
            onSuccess={(url) => {
              setTestData(prev => prev + `\n\nFichier uploadé avec succès! URL: ${url}`);
              // Rafraîchir la liste des fichiers
              listDropboxFiles();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestFirebase;
