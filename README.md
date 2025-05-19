# ESIGELEC Preparation Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Une plateforme complète pour accompagner les étudiants des Classes Préparatoires Scientifiques (CPS) de Dakar dans leur transition vers l'ESIGELEC à Rouen.

## 🚀 Fonctionnalités

- 📚 Bibliothèque de ressources documentaires (guides, formulaires, conseils)
- 📅 Tableau de bord personnalisé suivant les étapes du processus
- ❓ Foire aux questions interactive
- 🔒 Espace membre avec authentification sécurisée
- 👨‍💻 Interface d'administration pour la gestion du contenu

## 🛠 Technologies utilisées

- **Frontend**: React 18 avec TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Firebase (Authentification + Firestore)
- **Déploiement**: GitHub Pages
- **Gestion d'état**: Context API

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
├── components/      # Composants réutilisables
├── contexts/        # Contextes React (Auth, Content)
├── pages/           # Pages de l'application
│   ├── admin/       # Interface d'administration
│   └── ...
├── App.tsx         # Composant racine
└── main.tsx         # Point d'entrée
```

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

---

Développé avec ❤️ par l'équipe ESIGELEC Prep Guide
