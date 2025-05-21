# ESIG-prep-guide 📚

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📋 Sommaire

- [Aperçu](#-aperçu)
- [Fonctionnalités clés](#-fonctionnalités-clés)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Structure du projet](#-structure-du-projet)
- [Déploiement](#-déploiement)
- [Licence](#-licence)
- [Contact](#-contact)

## 🔍 Aperçu

**ESIG-prep-guide** est une plateforme complète conçue pour accompagner les étudiants des Classes Préparatoires Scientifiques (CPS) de Dakar dans leur transition vers l'ESIGELEC à Rouen. Structurée selon les trois phases principales du parcours étudiant (post-CPS, démarches administratives, pré-arrivée), la plateforme offre des ressources organisées, des guides pratiques et un système interactif de FAQ.

### Objectifs du projet

- Faciliter l'accès à l'information pour les étudiants admis à l'ESIGELEC
- Centraliser les ressources et documents nécessaires à chaque étape du processus
- Créer une communauté d'entraide entre les différentes promotions
- Réduire les incertitudes liées à l'expatriation et à l'intégration dans un nouvel environnement académique

## ✨ Fonctionnalités clés

### 📚 Gestion des ressources
- **Bibliothèque documentaire** organisée par phases et catégories
- **Prévisualisation** des documents directement dans l'interface
- **Téléchargement** facile des ressources
- **Intégration Dropbox** pour le stockage et la gestion des fichiers

### 🧭 Navigation par phase
- **Phase Post-CPS**: Ressources pour les étudiants venant de recevoir leur admission
- **Phase During-Process**: Guides pour les démarches administratives (visa, logement, etc.)
- **Phase Pre-Arrival**: Informations pour préparer l'arrivée en France et à l'ESIGELEC

### ❓ Système de FAQ interactif
- FAQ organisées par catégories et phases du processus
- Possibilité pour les utilisateurs de **soumettre leurs propres questions**
- **Message de confirmation** après soumission d'une question
- Stockage de l'**identifiant (uid)** et de l'**email** de l'utilisateur lors de la soumission

### 👤 Gestion des utilisateurs
- **Authentification** via email/mot de passe, Google ou GitHub
- **Profils utilisateurs** personnalisables
- **Système de rôles** (utilisateurs standard et administrateurs)
- **Vérification d'email** pour sécuriser les comptes

### 🛠️ Interface d'administration
- **Tableau de bord administrateur** avec statistiques et activités récentes
- **Gestion du contenu** (FAQ, ressources, sections de guide)
- **Gestionnaire Dropbox** intégré pour les fichiers
- **Gestion des utilisateurs** avec promotion/rétrogradation des rôles

### 📜 Conformité légale
- Documentation légale complète (CGU, Politique de confidentialité, etc.)
- Système de consentement conforme au RGPD
- Registre RGPD accessible aux administrateurs

## 🔧 Technologies

### Frontend
- **React 18** avec TypeScript pour l'interface utilisateur
- **Tailwind CSS** pour le styling responsive
- **React Router v6** pour la navigation
- **Context API** pour la gestion d'état (AuthContext, ContentContext)
- **Lucide React** pour les icônes

### Backend & Services
- **Firebase**
  - Authentication pour la gestion des utilisateurs
  - Firestore pour le stockage des données
- **Dropbox API** pour la gestion des fichiers
- **GitHub Pages** pour le déploiement

## 💻 Installation

### Prérequis
- Node.js (v16.0 ou supérieur)
- npm ou yarn
- Un compte Firebase
- Un compte Dropbox (pour l'intégration complète)

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/AbdoulDiouf2/Esig-prep-guide.git
cd Esig-prep-guide
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet avec les variables suivantes:
```env
VITE_FIREBASE_API_KEY=votre_cle_api
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_MEASUREMENT_ID=votre_measurement_id
VITE_DROPBOX_ACCESS_TOKEN=votre_token_dropbox
```

4. **Lancer l'application en mode développement**
```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible à l'adresse [http://localhost:5173](http://localhost:5173).

## 📁 Structure du projet

```
src/
├── components/            # Composants réutilisables
│   ├── auth/              # Composants d'authentification
│   ├── layout/            # Composants structurels (Header, Footer)
│   ├── legal/             # Composants liés aux aspects juridiques
│   └── notifications/     # Composants de notification
├── contexts/              # Contextes React
│   ├── AuthContext.tsx    # Gestion de l'authentification
│   └── ContentContext.tsx # Gestion du contenu (ressources, guide, FAQ)
├── hooks/                 # Hooks personnalisés
├── pages/                 # Pages principales
│   ├── admin/             # Interface d'administration
│   └── legal/             # Pages juridiques
├── services/              # Services externes (Firebase, Dropbox)
├── utils/                 # Fonctions utilitaires
├── firebase.ts            # Configuration Firebase
└── App.tsx                # Point d'entrée avec routage
```

## 🚀 Déploiement

### Déploiement sur GitHub Pages

1. **Configurer le basename dans App.tsx**
   Assurez-vous que le routeur est configuré avec le bon basename:
   ```jsx
   <Router basename="/Esig-prep-guide">
   ```

2. **Construire l'application**
   ```bash
   npm run build
   # ou
   yarn build
   ```

3. **Déployer**
   ```bash
   npm run deploy
   # ou
   yarn deploy
   ```

### Déploiement sur d'autres plateformes

Le projet peut également être déployé sur d'autres plateformes comme Netlify, Vercel ou Firebase Hosting avec des configurations minimales.

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📬 Contact

Abdoul Ahad Mbacké DIOUF - ESIGELEC (Promo 2025) - CPS (Promo 2022)

Projet: [https://github.com/AbdoulDiouf2/Esig-prep-guide](https://github.com/AbdoulDiouf2/Esig-prep-guide)

---

Développé avec ❤️ pour faciliter le parcours des étudiants sénégalais à l'ESIGELEC

Dernière mise à jour: Mai 2025
