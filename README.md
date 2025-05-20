# ESIGELEC Preparation Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Une plateforme complète pour accompagner les étudiants des Classes Préparatoires Scientifiques (CPS) de Dakar dans leur transition vers l'ESIGELEC à Rouen.

## 🚀 Fonctionnalités

- 📚 **Bibliothèque de ressources documentaires** (guides, formulaires, conseils)
  - 🔍 Prévisualisation des documents directement dans l'interface
  - 📥 Téléchargement facile des ressources
  - 🗂️ Organisation catégorisée pour une navigation intuitive
- 📅 **Tableau de bord personnalisé** suivant les étapes du processus
- ❓ **Foire aux questions interactive**
  - ✏️ Possibilité pour les utilisateurs de soumettre leurs propres questions
  - 🔔 Notification de confirmation après soumission d'une question
- 🔒 **Espace membre avec authentification sécurisée**
  - 👤 Profils utilisateurs personnalisables
  - 🔐 Authentification via Firebase
- 👨‍💻 **Interface d'administration complète**
  - 📤 Upload de fichiers directement vers Dropbox
  - 🔄 Gestion simplifiée des ressources (PDF, Documents, Images)
  - 📊 Statistiques d'utilisation et tableau de bord analytique
- 🧑‍💼 **Gestion avancée des utilisateurs/admins** :
  - 🖼️ Page de profil utilisateur moderne et responsive
  - 👁️ Visualisation, édition, promotion/déclassement admin, suppression d'utilisateurs
  - 🧩 Avatar stylé, informations claires, boutons d'action élégants
  - 🛡️ Sécurité renforcée (un admin ne peut pas se supprimer lui-même, confirmation systématique avant action critique)
- 🕓 **Historique d'activité admin** :
  - 📜 Affichage de l'activité récente avec un scroll automatique si plus de 5 actions
  - 🔍 Suivi détaillé des modifications (ajout, suppression, édition de contenu)
- 📜 **Documentation légale complète** :
  - 📃 Conditions Générales d'Utilisation (CGU)
  - 🔒 Politique de Confidentialité
  - ⚖️ Mentions Légales
  - 🛡️ Charte de Modération
  - 📋 Registre de Traitement RGPD (accès administrateur uniquement)
- 🍪 **Système de gestion des consentements**
  - 🔔 Bannière de consentement aux cookies conforme au RGPD
  - ⚙️ Personnalisation des préférences de confidentialité
  - 📝 Suivi et stockage sécurisé des consentements utilisateurs

<!--
![Capture d’écran Profil Admin](./docs/screenshot-profile.png)
-->

## 🛠 Technologies utilisées

- **Frontend**: React 18 avec TypeScript
- **Styling**: Tailwind CSS avec composants sur mesure
- **Routing**: React Router v6
- **Backend**: Firebase (Authentification + Firestore Database)
- **Stockage de fichiers**: Dropbox API (upload et partage de fichiers)
- **Déploiement**: GitHub Pages
- **Gestion d'état**: Context API (AuthContext, ContentContext)
- **UI Components**: Lucide React pour les icônes
- **Performance**: Code splitting et lazy loading
- **Accessibilité**: Composants conformes aux standards WCAG

## Installation

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/AbdoulDiouf2/Esig-prep-guide.git
cd Esig-prep-guide
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Créer un fichier `.env` à la racine

Créez un fichier `.env` à la racine du projet avec les variables d'environnement Firebase :

```env
VITE_FIREBASE_API_KEY=votre_cle_api
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_MEASUREMENT_ID=votre_measurement_id
VITE_DROPBOX_ACCESS_TOKEN=votre_token_dropbox  # Pour l'intégration Dropbox
```

### Étape 4 : Démarrer l'application en mode développement

```bash
npm run dev
```

## Déploiement

Pour déployer sur GitHub Pages :

```bash
npm run build
npm run deploy
```

## Structure du projet

```text
src/
├── components/       # Composants réutilisables
│   ├── admin/        # Composants spécifiques à l'administration
│   ├── auth/         # Composants liés à l'authentification
│   ├── layout/       # Composants de mise en page (Header, Footer, etc.)
│   ├── legal/        # Composants liés aux aspects juridiques
│   └── ui/           # Composants d'interface utilisateur génériques
├── contexts/         # Contextes React (Auth, Content)
├── hooks/            # Hooks personnalisés
├── pages/            # Pages de l'application
│   ├── admin/        # Interface d'administration
│   ├── auth/         # Pages d'authentification
│   ├── legal/        # Pages juridiques
│   └── ...          
├── types/            # Types TypeScript
├── utils/            # Fonctions utilitaires
├── App.tsx           # Composant racine avec routage
└── main.tsx          # Point d'entrée
```

## Historique des changements récents

- ✨ **Nouvelle fonctionnalité** : Ajout complet des pages légales (CGU, Politique de confidentialité, etc.)
- ✨ **Nouvelle fonctionnalité** : Système de gestion des consentements conforme au RGPD
- ✨ **Nouvelle fonctionnalité** : Registre RGPD accessible uniquement aux administrateurs
- ✨ **Amélioration** : Refonte visuelle et structurelle des documents légaux
- ✨ **Amélioration** : Footer légal avec liens vers toutes les pages juridiques
- ✨ **Amélioration** : Expérience utilisateur optimisée pour la soumission de questions FAQ
- ✨ **Amélioration** : Authentification sécurisée avec stockage des informations utilisateur
- ✨ **Amélioration** : Système d'icônes intelligentes pour les différents types de contenu
- 🐛 **Correction** : Résolution des problèmes de lint et optimisation du code

## Contribution

Les contributions sont les bienvenues ! Voici comment procéder :

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- Aux étudiants des CPS de Dakar pour leur retour précieux
- À la communauté open source pour les outils incroyables
- Aux enseignants de l'ESIGELEC pour leur soutien et conseils
- À tous les contributeurs qui ont aidé à améliorer cette plateforme

## 🔒 Conformité et sécurité

- Application conforme au RGPD (Règlement Général sur la Protection des Données)
- Mécanisme de consentement transparent pour les utilisateurs
- Documentation légale complète et accessible
- Sécurisation des données utilisateurs et des interactions

---

Développé avec ❤️ par Abdoul Ahad Mbacké DIOUF - PROMO 2025 (ESIGELEC) - PROMO 2022 (CPS)

Dernière mise à jour : Mai 2025
