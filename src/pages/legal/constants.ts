// Types pour les constantes partagées
type SecurityMeasures = {
  organizational: string[];
  technical: string[];
};

type FirebaseInfo = {
  name: string;
  address: string;
  website: string;
  privacyPolicy: string;
  dataLocation: string;
};

// Constantes partagées pour les pages légales
export const CONTACT_EMAIL: string = 'aad.mbacke691@gmail.com';
export const CONTACT_PHONE: string = '+33 7 49 05 18 79';
export const ADDRESS: string = '76800; Saint-Etienne-Du-Rouvray, France';

export const FIREBASE_INFO: FirebaseInfo = {
  name: 'Google Ireland Limited (pour les services Firebase)',
  address: 'Gordon House, Barrow Street, Dublin 4, Irlande',
  website: 'https://firebase.google.com/',
  privacyPolicy: 'https://firebase.google.com/support/privacy',
  dataLocation: 'France (région europe-west1 - Belgique) et États-Unis'
};

export const SECURITY_MEASURES: SecurityMeasures = {
  organizational: [
    'Accès restreint aux seules personnes habilitées',
    'Formation du personnel aux enjeux de protection des données',
    'Procédures documentées de gestion des incidents de sécurité',
    'Audits de sécurité réguliers'
  ],
  technical: [
    'Authentification forte à deux facteurs pour les comptes administrateurs',
    'Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)',
    'Journalisation des accès et des actions sensibles',
    'Sauvegardes régulières et sécurisées',
    'Mises à jour de sécurité automatiques',
    'Protection contre les attaques par force brute',
    'Surveillance continue des activités suspectes'
  ]
};

// Exporter les types pour une utilisation dans d'autres fichiers
export type { SecurityMeasures, FirebaseInfo };
