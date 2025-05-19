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

const TestFirebase: React.FC = () => {
  const [testData, setTestData] = useState<string>('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('test1234');

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

  // Tester l'authentification
  const testAuth = async () => {
    try {
      // Créer un utilisateur de test
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      
      // Se connecter avec le même utilisateur
      await signInWithEmailAndPassword(auth, email, password);
      setTestData(prev => prev + '\nAuthentification réussie!');
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        // Si l'utilisateur existe déjà, on se connecte simplement
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setTestData(prev => prev + '\nConnexion réussie (utilisateur existant)!');
      } else {
        console.error('Erreur d\'authentification:', error);
setTestData(prev => prev + `\nErreur d'authentification: ${authError.message}`);
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

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Résultats des tests</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {testData || 'Aucun test effectué'}
        </pre>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Upload Dropbox</h2>
        <DropboxUploader />
      </div>
    </div>
  );
};

export default TestFirebase;
