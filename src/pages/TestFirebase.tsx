import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, FirestoreError } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  User as FirebaseUser,
  AuthError 
} from 'firebase/auth';
import R2Uploader from '../components/R2Uploader';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../services/NotificationService';


const TestFirebase: React.FC = () => {
  const [testData, setTestData] = useState<string>('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('test1234');
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);

  // États pour les tests d'envoi d'email
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailTestError, setEmailTestError] = useState<string>('');
  const [testEmail, setTestEmail] = useState<string>('');
  const [testSubject, setTestSubject] = useState<string>('Test EmailJS depuis ESIG-prep-guide');
  const [testMessage, setTestMessage] = useState<string>('Ceci est un email de test pour vérifier la configuration d\'EmailJS.');

  // États pour les tests R2 Worker
  const [r2WorkerStatus, setR2WorkerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [r2WorkerError, setR2WorkerError] = useState<string>('');

  // Tester la connexion au Worker Cloudflare R2
  const testR2Worker = async () => {
    setR2WorkerStatus('loading');
    setR2WorkerError('');
    
    try {
      const workerUrl = import.meta.env.VITE_R2_WORKER_URL;
      if (!workerUrl) throw new Error('VITE_R2_WORKER_URL non défini dans .env');
      const res = await fetch(`${workerUrl}/health`);
      if (res.ok) {
        setR2WorkerStatus('success');
        setTestData(prev => prev + '\n\nWorker Cloudflare R2 opérationnel !');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setR2WorkerError(msg);
      setR2WorkerStatus('error');
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

  // Lister les fichiers R2 (test)
  const listR2Files = async () => {
    setLoadingFiles(true);
    setTestData(prev => prev + '\n\nChargement des fichiers R2...');
    try {
      const workerUrl = import.meta.env.VITE_R2_WORKER_URL;
      const res = await fetch(`${workerUrl}/list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { objects: Array<{ name: string }> };
      setTestData(prev => prev + `\n\n${data.objects.length} fichiers trouvés dans R2.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestData(prev => prev + `\n\nErreur R2 list: ${msg}`);
    } finally {
      setLoadingFiles(false);
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
        <h2 className="text-xl font-semibold mb-2">Test Cloudflare R2</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">1. Tester la connexion au Worker R2</h3>
          <button
            onClick={testR2Worker}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded mr-4"
            disabled={r2WorkerStatus === 'loading'}
          >
            {r2WorkerStatus === 'loading' ? 'Vérification...' : 'Tester le Worker R2'}
          </button>
          {r2WorkerStatus === 'success' && <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md">✅ Worker opérationnel</div>}
          {r2WorkerStatus === 'error' && <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md">❌ {r2WorkerError}</div>}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">2. Lister les fichiers R2</h3>
          <button
            onClick={listR2Files}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
            disabled={loadingFiles}
          >
            {loadingFiles ? 'Chargement...' : 'Lister les fichiers R2'}
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">3. Tester l'upload vers R2</h3>
          <p className="text-sm text-gray-600 mb-2">Uploadez un fichier vers Cloudflare R2.</p>
          <R2Uploader
            buttonText="Uploader un fichier test vers R2"
            onSuccess={(url) => {
              setTestData(prev => prev + `\n\nFichier uploadé sur R2! URL: ${url}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestFirebase;
