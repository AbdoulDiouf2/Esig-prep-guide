# CPS Connect 📚

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
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

**CPS Connect** (anciennement ESIG-prep-guide) est une plateforme multi-modules conçue pour centraliser les outils et ressources destinés aux étudiants CPS et à la communauté Alumni de l'ESIGELEC.

### Volets actuels et futurs

- **Volet Étudiants CPS** ✅ : Accompagne les étudiants des Classes Préparatoires Scientifiques (CPS) de Dakar dans leur transition vers l'ESIGELEC à Rouen, structuré selon trois phases (post-CPS, démarches administratives, pré-arrivée).
- **Volet Alumni** ✅ : Annuaire alumni avec profils professionnels, système de validation, statistiques, forum communautaire, webinaires, et networking entre anciens étudiants.

### Objectifs du projet

- Faciliter l'accès à l'information pour les étudiants admis à l'ESIGELEC
- Centraliser les ressources et documents nécessaires à chaque étape du processus
- Créer une communauté d'entraide entre les différentes promotions
- Réduire les incertitudes liées à l'expatriation et à l'intégration dans un nouvel environnement académique
- Poser les bases d'une plateforme évolutive capable d'accueillir de nouveaux modules (Alumni, entrepreneuriat, mentorat, etc.)

## ✨ Fonctionnalités clés

### 🏠 Centre d'applications
- **Hub centralisé** regroupant tous les modules et fonctionnalités disponibles
- **Navigation intuitive** par catégories (Alumni, Modules étudiants CPS, Administration, Édition, Outils, Fonctionnalités avancées)
- **Filtrage dynamique** selon le rôle de l'utilisateur (étudiant, éditeur, administrateur)
- **Catégorie Alumni par défaut** pour mettre en avant le networking
- **Affichage des modules futurs** avec statut "Bientôt disponible"

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
- FAQ organisées par catégories et phases du processus (post-CPS, démarches, pré-arrivée)
- Possibilité pour les utilisateurs de **soumettre leurs propres questions** avec catégorisation
- **Message de confirmation** après soumission d'une question avec informations sur le suivi
- **Vue personnalisée** des questions pour les utilisateurs connectés (questions répondues vs. en attente)
- Filtrage par type de question (spécifique à une phase, liée au site, ou générale)
- Recherche textuelle dans les questions, réponses et catégories
- Stockage de l'**identifiant (uid)** et de l'**email** de l'utilisateur lors de la soumission pour le suivi

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
- **Tableau de bord éditeur** pour les rôles d'édition (sans accès aux données sensibles)

### 📜 Conformité légale
- Documentation légale complète (CGU, Politique de confidentialité, etc.)
- Système de consentement conforme au RGPD
- Registre RGPD accessible aux administrateurs

### 👥 Annuaire Alumni (Nouveau !)
- **Profils alumni complets** : Informations professionnelles, secteurs, expertises, localisation
- **Système de validation** : Workflow d'approbation/rejet avec notifications email
- **Recherche et filtrage avancés** : Par secteur, expertise, année de promo, localisation
- **Statistiques détaillées** : KPIs, top secteurs/pays/expertises, distribution par promo
- **Export de données** : CSV et PDF pour analyse
- **Gestion des statuts** : Pending → Approved/Rejected avec possibilité de révocation
- **Auto-gestion** : Les alumni peuvent modifier ou supprimer leur propre profil
- **Liens professionnels** : LinkedIn, GitHub, Twitter, site web personnel

### 🎓 Forum & Webinaires
- **Forum communautaire** : Discussions entre étudiants et alumni
- **Gestion des webinaires** : Création, inscription, suivi des participants
- **Propositions d'ateliers** : Les utilisateurs peuvent proposer des ateliers

### 🚀 Roadmap & Évolutivité
La plateforme continue d'évoluer avec de nouveaux modules :
- **Phase 1** ✅ : Annuaire alumni complet avec validation et statistiques
- **Phase 2** (En cours) : Amélioration de l'expérience utilisateur et quick wins
- **Phase 3** (Planifié) : Système de matching mentorat, opportunités business ciblées
- **Futures améliorations** : Intelligence artificielle communautaire, Internationalisation, Gamification, Application mobile

## 🔧 Technologies

### Frontend
- **React 18** avec TypeScript pour l'interface utilisateur
- **Tailwind CSS** pour le styling responsive
- **React Router v6** pour la navigation
- **Context API** pour la gestion d'état (AuthContext, ContentContext)
- **Lucide React** pour les icônes

### Backend & Services
- **Firebase**
  - Authentication pour la gestion des utilisateurs (email/mot de passe, Google, GitHub)
  - Firestore pour le stockage structuré des données (utilisateurs, ressources, FAQ, sections)
  - Analytics pour le suivi de l'utilisation
- **Dropbox API** pour la gestion des fichiers et ressources
- **EmailJS** pour l'envoi de notifications par email
- **Options de déploiement**: GitHub Pages, Netlify, Firebase Hosting

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
VITE_EMAILJS_PUBLIC_KEY=votre_cle_emailjs
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
│   └── ui/                # Composants d'interface utilisateur
├── contexts/              # Contextes React pour la gestion d'état global
│   ├── AuthContext.tsx    # Gestion de l'authentification et des utilisateurs
│   └── ContentContext.tsx # Gestion du contenu (ressources, guide, FAQ)
├── hooks/                 # Hooks personnalisés pour la réutilisation de logique
├── pages/                 # Pages principales de l'application
│   ├── admin/             # Interface d'administration complète
│   ├── legal/             # Pages juridiques (CGU, confidentialité)
│   ├── Dashboard.tsx      # Tableau de bord utilisateur
│   ├── FAQ.tsx            # Système de FAQ interactif
│   ├── ResourceLibrary.tsx # Bibliothèque de ressources
│   └── ...                # Autres pages
├── services/              # Services d'accès aux données et APIs
│   ├── dropbox/           # Intégration avec Dropbox
│   └── firebase/          # Services Firebase spécifiques
├── types/                 # Types TypeScript partagés dans l'application
├── utils/                 # Fonctions utilitaires et helpers
├── firebase.ts            # Configuration centrale Firebase
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

### Déploiement sur Netlify

1. **Connecter votre dépôt GitHub à Netlify**

2. **Configurer les paramètres de build**
   - Build command: `npm run build` ou `yarn build`
   - Publish directory: `dist`
   - Variables d'environnement: Ajoutez les mêmes variables que dans votre fichier `.env`

3. **Configurer les redirections pour SPA**
   Créez un fichier `netlify.toml` à la racine du projet:

   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Déploiement sur Firebase Hosting

1. **Installer Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Connexion à Firebase**

   ```bash
   firebase login
   ```

3. **Initialiser Firebase dans le projet**

   ```bash
   firebase init
   ```

   Sélectionnez Hosting et suivez les instructions.

4. **Déployer**

   ```bash
   firebase deploy
   ```

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📬 Contact

Abdoul Ahad Mbacké DIOUF - ESIGELEC (Promo 2025) - CPS (Promo 2022)

Projet: [https://github.com/AbdoulDiouf2/Esig-prep-guide](https://github.com/AbdoulDiouf2/Esig-prep-guide)

---

Développé par Abdoul Ahad Mbacké DIOUF - ESIGELEC (Promo 2025) - CPS (Promo 2022) pour faciliter le parcours des étudiants sénégalais à l'ESIGELEC

Dernière mise à jour: 27 Avril 2026
