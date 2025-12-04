# TODO – ESIG-prep-guide

**Source fonctionnelle** : `public/doc.md` (Documentation Officielle – Novembre 2025)

---

## 1. Fonctionnalités déjà réalisées

- **Authentification & Profil**
  - [x] Connexion email/mot de passe, Google, GitHub
  - [x] Réinitialisation du mot de passe
  - [x] Profil utilisateur (personnalisation de base)
  - [x] Vérification email
  - [x] Système de rôles multi-niveaux (user, editor, admin, superadmin)

- **Tableau de bord & Suivi**
  - [x] Tableau de bord étudiant avec phases (post-cps, during-process, pre-arrival)
  - [x] Suivi de progression par phases et progression globale
  - [x] Notifications de chat (badge messages non lus)
  - [x] Navigation de parcours étudiant via ApplicationsDashboard
  - [x] Logique visa (sections acceptation/refus, surcoche automatique via IDs)

- **Gestion de contenu interactif**
  - [x] Guides interactifs avec sous-sections (`bulletList`, `checkList`, `inputField`)
  - [x] Sauvegarde automatique des réponses utilisateur (Firestore)
  - [x] Calcul automatique de complétion de section
  - [x] Association de ressources aux sections de guide

- **Bibliothèque de ressources**
  - [x] Organisation documentaire par phases
  - [x] Listing et filtrage des documents
  - [x] Intégration Dropbox (admin/editor) via navigateur de fichiers
  - [x] Téléchargement / ouverture des ressources

- **Ressources académiques**
  - [x] Page dédiée "Ressources Académiques" (1A–3A)
  - [x] Liens vers cours, TD, TP
  - [x] Filtrage par année, département, spécialisation

- **Système de FAQ**
  - [x] Consultation des questions par phase/type
  - [x] Soumission de questions par les utilisateurs
  - [x] Stockage uid/email de l’utilisateur
  - [x] Modération/validation des questions (Admin/Éditeur)
  - [x] Vue personnalisée des questions de l’utilisateur

- **Forum communautaire**
  - [x] Catégories de forum
  - [x] Création de threads et réponses
  - [x] Nettoyage/normalisation des catégories
  - [x] Modération par les rôles (éditeur/admin)

- **Webinaires & ateliers**
  - [x] Listing des webinaires
  - [x] Détail d’un webinaire
  - [x] Propositions d’ateliers (ProposerAtelier, MesPropositions)
  - [x] Gestion admin des webinaires et propositions

- **Chat & communication**
  - [x] Chat utilisateur ↔ admin (UserChat + AdminChatInterface + services)
  - [x] Notifications de chat en temps réel / non lus
  - [x] Chat IA réservé aux superadmins (ChatAI)

- **Feedback & support**
  - [x] Formulaire de feedback côté utilisateur
  - [x] Interface admin pour consulter les feedbacks
  - [x] Tutoriel utilisateur et page d’aide
  - [x] Tutoriel admin

- **Interfaces d’administration / édition**
  - [x] Tableau de bord Admin
  - [x] Gestion du contenu (sections de guide, FAQ)
  - [x] Gestion des ressources documentaires
  - [x] Gestion des utilisateurs et rôles
  - [x] Vue progression globale (AdminProgressionOverview)
  - [x] Logs d’activité admin
  - [x] Gestion Dropbox (AdminDropboxManager)
  - [x] Gestion webinaires & propositions
  - [x] Tableau de bord Éditeur (sans données sensibles)

- **Centre d’applications**
  - [x] Hub centralisé (ApplicationsDashboard)
  - [x] Catégories par type de fonctionnalités (Principales, Administration, Édition, Voyage, Outils, Avancées)
  - [x] Filtrage dynamique par rôle (user, editor, admin)
  - [x] Marquage "Bientôt disponible" pour les modules futurs

- **Pages légales & conformité**
  - [x] CGU
  - [x] Politique de confidentialité
  - [x] Mentions légales
  - [x] Charte de modération
  - [x] Registre RGPD (admin-only)
  - [x] Disclaimers et consentement cookies

- **Autres**
  - [x] Page d’accueil
  - [x] Gestion des notifications globales (bannières)
  - [x] Page 404 personnalisée
  - [x] Intégration analytics (Vercel)

---

## 2. Fonctionnalités confirmées à implémenter (Roadmap)

Ces éléments sont décrits comme "Fonctionnalités à venir confirmées".

- **Refonte plateforme avant modules Alumni (Phase 0)**
  - [x] **Redéfinir le point d'entrée après connexion**
    - [x] Modifier `RedirectIfAuthenticated` dans `App.tsx` pour que la route par défaut après connexion soit `"/applications"` au lieu de `"/dashboard"` (si aucune route précédente n'est stockée dans `state.from`).
    - [x] Vérifier que toutes les routes protégées (FAQ, Forum, Webinaires, etc.) continuent de fonctionner correctement avec cette logique.
  - [x] **Positionner clairement le centre d'applications comme hub de la plateforme**
    - [x] Adapter les textes de `ApplicationsDashboard` pour le présenter comme "Accueil plateforme / Centre d'applications" (et non comme une simple fonctionnalité secondaire).
    - [x] S'assurer que le module Étudiants CPS est clairement identifié comme un module parmi d'autres (ex. carte "Module Étudiants CPS – Guide de préparation").
  - [x] **Clarifier la navigation principale (Header)**
    - [x] Mettre un lien explicite vers le hub (ex. "Plateforme" ou "Applications") pointant vers `"/applications"`.
    - [x] Mettre un lien explicite vers le module Étudiants CPS (ex. "Étudiants CPS" ou "Guide CPS") pointant vers `"/dashboard"`.
    - [x] Prévoir un emplacement futur pour le volet Alumni (ex. lien ou menu désactivé / "Bientôt disponible").
  - [x] **Aligner la page d'accueil publique (/)**
    - [x] Mettre à jour la page `Home.tsx` pour présenter ESIG-prep-guide comme **plateforme multi-modules** (Étudiants, Alumni, Admin, etc.).
    - [x] Expliquer le découpage : volet Étudiants CPS, futur volet Alumni (annuaire, opportunités, mentorat, IA communautaire, etc.).
  - [x] **Mettre à jour la documentation produit**
    - [x] Adapter `README.md` pour décrire ESIG-prep-guide comme plateforme, avec liste des modules existants et futurs.
    - [x] Vérifier/coordonner avec `public/doc.md` et `TODO.md` pour que la vision plateforme et les phases (Phase 0 refonte, Phase 1 Annuaire, Phase 2 Opportunités & Networking, Phase 3 IA & Événements) soient cohérentes.

- **Phase 1 : Annuaire Alumni - Réseau Professionnel et Compétences (Système Hybrid)**
  
  **📋 Résumé Phase 1** : Créer un annuaire alumni flexible et ouvert permettant aux alumni de se présenter (profil riche : bio, secteurs, expertise, portfolio, services, réseaux sociaux) et de se connecter entre eux. Système hybrid : inscription basique OU avec profil entrepreneur (validation admin avant publication). Recherche full-text + filtres avancés (secteur, expertise, année promo, localisation, type d'aide). Mise en avant des nouveaux profils, indicateur de complétion, demandes de contact simples, et notifications pour engagement. V1 complète : technique solide + valeur immédiate pour alumni.
  
  - [x] **Phase 1.0 : Architecture et flux de données (Hybrid)**
    - [x] Définir le flux d'inscription alumni (création profil auto + complétion infos)
    - [x] Définir les statuts de fiche : `pending` (en attente), `approved` (validée), `rejected` (refusée)
    - [x] Définir les champs obligatoires vs optionnels
    - [x] Documenter le workflow : inscription → complétion → validation → publication
  - [x] **Phase 1.0.1 : Formulaire d'inscription dynamique et progressif**
    - [x] Restructurer `Register.tsx` en formulaire multi-étapes :
      - **Étape 1 (Basique)** : Email, mot de passe, nom, année de promotion (OBLIGATOIRE pour tous)
        - Année de promotion = **Année de sortie de prépa** (fin 2ème année)
        - Input number : min=2000, max=2050 (saisie libre pour toutes les promos)
        - Helper text : "Ex: Si tu as fini la prépa en 2022, ta promo est 2022. Si tu es en 1ère année, indique ton année de sortie estimée."
      - **Étape 2 (Décision)** : Question "Êtes-vous entrepreneur/alumni ?" (Oui/Non)
        - Si OUI → Étape 3
        - Si NON → Créer compte basique + redirection /applications
      - **Étape 3 (Entrepreneur)** : Entreprise, secteur, localisation, description, photo
      - **Étape 4 (Résumé)** : Afficher résumé avant validation
    - [x] Implémenter composant `MultiStepForm.tsx` (réutilisable)
      - Navigation Suivant/Précédent
      - Indicateur de progression (étape X/Y)
      - Validation par étape
    - [x] Modifier `AuthContext.tsx` - fonction `register()` :
      - Ajouter paramètre `yearPromo` à la fonction
      - Sauvegarder `yearPromo` et `profileComplete` dans Firestore
      - TODO: Si entrepreneur, créer profil alumni avec `createAlumniProfileOnSignup()`
    - [x] Modifier `ApplicationsDashboard.tsx` :
      - Afficher notification si profil alumni pending (jaune)
      - Afficher notification si profil alumni approved (vert)
      - Afficher notification si profil alumni rejected (rouge) avec lien vers édition
    - [x] Fichiers : `src/pages/Register.tsx`, `src/components/forms/MultiStepForm.tsx`, `src/contexts/AuthContext.tsx`, `src/pages/ApplicationsDashboard.tsx`
  - [x] **Phase 1.0.2 : Migration des utilisateurs existants**
    - [x] Ajouter champ `profileComplete?: boolean` au type `AppUser` dans `AuthContext.tsx`
    - [x] Ajouter champ `yearPromo?: number` au type `AppUser` (optionnel pour compatibilité)
    - [x] Créer page `CompleteUserProfile.tsx` (migration utilisateurs existants)
      - Formulaire simple : Année de promotion (input number min=2000 max=2050, obligatoire)
        - Label : "Année de promotion (année de sortie de prépa)"
        - Helper text : "Ex: Si tu as fini la prépa en 2022, ta promo est 2022. Si tu es en 1ère année, indique ton année de sortie estimée."
      - Question : "Veux-tu créer ton profil alumni ?" (Oui/Non)
      - Si Oui → Créer profil alumni avec `createAlumniProfileOnSignup()`
      - Si Non → Sauvegarder année promo + `profileComplete = true` + redirection `/applications`
    - [x] Ajouter middleware dans `App.tsx` (AuthWrapper) pour détecter profils incomplets
      - Si `currentUser.profileComplete === false` ou `!currentUser.yearPromo` → Redirection `/complete-profile`
    - [x] Route `/complete-profile` ajoutée dans `App.tsx`
    - [x] Fichiers : `src/contexts/AuthContext.tsx`, `src/pages/CompleteUserProfile.tsx`, `src/App.tsx`
    - [ ] Ajouter banner de notification dans `ApplicationsDashboard.tsx` (si profil incomplet)
      - "🎉 Nouvelle fonctionnalité ! Complète ton profil pour accéder à l'annuaire alumni"
      - Bouton "Compléter maintenant"
    - [x] Tester le flux de migration avec utilisateurs existants
    - [x] Fichiers : `src/pages/CompleteUserProfile.tsx`, `src/types/user.ts`, `src/contexts/AuthContext.tsx`, `src/services/userService.ts`, `src/pages/ApplicationsDashboard.tsx`
  - [x] **Phase 1.1 : Modèle de données et structure Firestore (Flexible & Ouvert)**
    - [x] Créer type TypeScript `AlumniProfile` avec champs :
      - **Infos personnelles** : nom, email, année promo, photo, headline (titre professionnel)
      - **Bio & Description** : bio (texte long), domaines d'intérêt
      - **Secteurs & Expertise** : secteurs[] (Tech, Finance, Design, etc.), expertise[] (tags libres)
      - **Professionnel** : company, position, companyDescription, website
      - **Portfolio** : portfolio[] (titre, description, URL, image)
      - **Services** : services[] (nom, description, catégorie)
      - **Réseaux sociaux** : linkedin, github, twitter, website
      - **Localisation** : city, country
      - **Métadonnées** : status, dateCreated, dateValidation, validatedBy, rejectionReason
    - [x] Créer collection Firestore `alumni` avec règles de sécurité
    - [x] Créer service `alumniService.ts` (CRUD : create, update, get, list, updateStatus, search, filter)
    - [x] Implémenter fonction `createAlumniProfileOnSignup()` (création auto à l'inscription)
    - [x] Implémenter fonction `searchAlumni()` (recherche full-text sur nom, bio, expertise)
    - [x] Implémenter fonction `filterAlumni()` (filtrage multi-critères)
    - [x] Fichiers : `src/types/alumni.ts`, `src/services/alumniService.ts`
  - [x] **Phase 1.2 : Interface de complétion/édition de profil Alumni (Flexible & Ouvert)**
    - [x] Créer composant `AlumniProfileForm.tsx` (formulaire dynamique avec sections)
      - **Section 1 : Infos de base** (headline, bio, photo)
      - **Section 2 : Secteurs & Expertise** (tags dynamiques avec secteurs prédéfinis + custom)
      - **Section 3 : Professionnel** (company, position, companyDescription, website)
      - **Section 4 : Portfolio** (ajouter/supprimer projets avec titre, description, URL)
      - **Section 5 : Services** (ajouter/supprimer services avec nom, description, catégorie)
      - **Section 6 : Réseaux sociaux** (linkedin, github, twitter)
      - **Section 7 : Localisation** (city, country)
    - [x] Implémenter upload de photo (Firebase Storage via `storageService.ts`)
    - [x] Créer page `CompleteAlumniProfile.tsx` (complétion profil après inscription)
      - Pré-remplie avec : nom, email, année promo
      - À compléter : tous les champs optionnels
      - Statut remis à `pending` après soumission
    - [x] Créer page `EditAlumniProfile.tsx` (édition fiche personnelle)
      - Utilise le même composant que `CompleteAlumniProfile`
      - Remet le statut à `pending` après modification
    - [x] Ajouter messages succès/erreur et notifications
    - [x] Ajouter bouton "Soumettre pour validation" (change status à `pending`)
    - [x] Routes ajoutées : `/complete-alumni-profile`, `/edit-alumni-profile`
    - [x] Fichiers : `src/components/alumni/AlumniProfileForm.tsx`, `src/pages/CompleteAlumniProfile.tsx`, `src/pages/EditAlumniProfile.tsx`, `src/services/storageService.ts`, `src/App.tsx`
  - [x] **Phase 1.3 : Annuaire Alumni avec recherche/filtrage avancé (Fiches approuvées)**
    - [x] Créer page `AlumniDirectory.tsx` (grille fiches + recherche + filtres)
      - Afficher UNIQUEMENT les fiches avec status `approved`
      - Utilise `getApprovedAlumniProfiles()` et `searchAlumni()` avec filtres
    - [x] Implémenter barre de recherche (recherche full-text)
      - Chercher sur : nom, bio, expertise, company, headline via `searchAlumni()`
    - [x] Ajouter filtres multi-critères (panel déroulant) :
      - **Secteur** (Tech, Finance, Design, etc.) - multi-select avec boutons
      - **Année de promo** (range avec inputs min/max)
      - **Localisation** (ville, pays)
    - [x] Créer composant `AlumniCard.tsx` (affichage fiche)
      - Afficher : photo, headline, bio courte, secteurs, expertise, localisation, réseaux sociaux
      - Bouton "Voir le profil" (lien vers `/alumni/:uid`)
    - [x] Route `/alumni` ajoutée (accessible sans authentification)
    - [x] Fichiers : `src/pages/AlumniDirectory.tsx`, `src/components/alumni/AlumniCard.tsx`, `src/App.tsx`
    - [x] Créer page détail `AlumniDetail.tsx` (fiche complète)
      - Afficher tous les champs : bio, portfolio, services, réseaux sociaux, entreprise, localisation
      - Bouton "Envoyer un email" (mailto)
      - Bouton retour vers l'annuaire
    - [x] Route `/alumni/:uid` ajoutée (accessible sans authentification)
    - [x] Fichiers : `src/pages/AlumniDetail.tsx`, `src/App.tsx`
  - [x] **Phase 1.4 : Système de validation admin pour fiches alumni**
    - [x] Créer interface admin `AdminAlumniValidation.tsx` avec :
      - Liste des fiches en attente (status = `pending`) à gauche
      - Aperçu fiche détaillé à droite (sélection au clic)
      - Boutons : Approuver / Rejeter
      - Champ raison de rejet (obligatoire pour rejeter)
    - [x] Utiliser fonction `updateAlumniStatus()` existante dans `alumniService.ts`
      - Accepte : uid, status, validatedBy, rejectionReason (optionnel)
      - Met à jour : status, dateValidation, validatedBy, rejectionReason
    - [x] Route `/admin/alumni-validation` ajoutée (protégée AdminRoute)
    - [x] Boutons ajoutés dans AdminDashboard (Valider profils + Voir annuaire)
    - [x] Fichiers : `src/pages/admin/AdminAlumniValidation.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/App.tsx`
    - [x] Créer page `MyAlumniProfile.tsx` pour l'alumni :
      - Affiche son profil et son statut (pending, approved, rejected)
      - Affiche le commentaire de rejet si applicable
      - Boutons : "Modifier", "Voir profil public" (si approuvé), "Voir annuaire"
      - Badges de statut colorés (vert/rouge/jaune)
    - [x] Route `/my-alumni-profile` ajoutée (protégée AuthWrapper)
    - [x] Lien "Mon profil alumni" ajouté dans le menu déroulant du header (desktop + mobile)
    - [x] Fichiers : `src/pages/MyAlumniProfile.tsx`, `src/App.tsx`, `src/components/layout/Header.tsx`
    - [x] Implémenter notifications email :
      - Email d'approbation : "Votre profil alumni a été approuvé !" avec lien vers profil public
      - Email de rejet : "Votre profil alumni nécessite des modifications" avec raison + lien pour modifier
      - Intégré dans `updateAlumniStatus()` avec gestion d'erreur (n'empêche pas la validation)
      - Utilise `NotificationService.sendCustomEmail()` existant
    - [x] Fichier : `src/services/alumniService.ts`
  - [x] **Phase 1.5 : Export des données et statistiques (visible que pour l'admin)**
    - [x] Créer page `AlumniStats.tsx` (statistiques + graphiques)
      - KPIs : Total, Approuvés, En attente, Taux d'approbation
      - Top 5 Secteurs avec barres de progression
      - Top 5 Pays avec barres de progression
      - Top 10 Expertises
      - Distribution par année de promotion
      - Filtres : Tous, Approuvés, En attente, Rejetés
    - [x] Implémenter export CSV (nom, secteur, expertise, localisation, email)
      - Fonction `exportToCSV()` avec encodage UTF-8
      - Téléchargement automatique du fichier
    - [x] Implémenter export PDF (rapport complet)
      - Fonction `exportToPDF()` générant un rapport HTML imprimable
      - Résumé, liste des profils, footer
      - Bouton d'impression intégré
    - [x] Ajouter filtres sur les stats
      - Filtrage par statut (tous/approuvés/pending/rejetés)
      - Recalcul automatique des stats selon le filtre
    - [x] Intégration dans AdminDashboard
      - Composant AlumniStats affiché dans l'onglet Alumni
      - Route `/admin/alumni-stats` également disponible
      - Boutons d'action : "Valider des profils", "Voir l'annuaire", "Retour"
    - [x] Fichiers : `src/pages/admin/AlumniStats.tsx`, `src/utils/exportService.ts`, `src/App.tsx`, `src/pages/admin/AdminDashboard.tsx`
  - [x] **Phase 1.5.1 : Améliorations page de validation**
    - [x] Système d'onglets dans AdminAlumniValidation
      - Onglet "À valider" (profils pending)
      - Onglet "Validés" (profils approved)
      - Onglet "Tous" (tous les profils)
      - Compteurs dynamiques toujours basés sur les totaux
    - [x] Badge de statut sur les profils validés
    - [x] Actions conditionnelles selon le statut
      - Profils pending : boutons Approuver/Rejeter
      - Profils approved : message "Profil déjà validé"
    - [x] Fonction de suppression de profil (superadmin uniquement)
      - Service `deleteAlumniProfile()` dans `alumniService.ts`
      - Vérification du rôle superadmin
      - Modal de confirmation personnalisé (ConfirmationModal)
      - Modal d'accès refusé pour les admins simples
      - Bouton grisé avec indicateur 🔒 pour non-superadmins
    - [x] Remplacement des popups natives
      - `window.confirm` → `ConfirmationModal` (danger)
      - `alert` accès refusé → Modal personnalisé (warning)
    - [x] Fichiers : `src/pages/admin/AdminAlumniValidation.tsx`, `src/services/alumniService.ts`, `src/components/ConfirmationModal.tsx`
  - [x] **Phase 1.5.2 : Mise en avant Alumni dans le centre d'applications**
    - [x] Création de la catégorie "Alumni" dans ApplicationsDashboard
      - Icône : Users (violet)
      - 4 modules : Annuaire Alumni, Mon profil Alumni, Forum, Webinaires
    - [x] Réorganisation des modules
      - Forum et Webinaires déplacés de "Étudiants CPS" vers "Alumni"
      - Catégorie Alumni positionnée en premier
      - Catégorie Alumni définie par défaut à l'ouverture
    - [x] Mise à jour du branding
      - Titre : "Plateforme CPS Connect · Centre d'applications"
      - Nom d'utilisateur en gras dans le message de bienvenue
    - [x] Fichier : `src/pages/ApplicationsDashboard.tsx`
  - [x] **Phase 1.5.3 : Mise à jour de la documentation et des pages d'aide**
    - [x] Tutoriel utilisateur (UserTutorial.tsx)
      - Nouvelle section "🆕 Annuaire Alumni & Networking" en première position
      - 4 sous-sections : Annuaire, Profil Alumni, Forum, Webinaires
      - Liens directs vers chaque fonctionnalité
    - [x] Page d'aide (Help.tsx)
      - Nouvelle carte "🆕 Annuaire Alumni" dans les accès rapides
      - 2 nouvelles FAQ : "Comment accéder à l'annuaire" et "Validation profil alumni"
      - Grille passée de 3 à 4 colonnes
    - [x] Tutoriel admin (AdminTutorial.tsx)
      - Nouvelle section "🆕 2. Gestion des profils Alumni"
      - Documentation complète : validation, actions, statistiques, export
      - Renumérotation des sections suivantes (3 à 9)
    - [x] Pages légales
      - Politique de confidentialité : ajout données profil alumni, finalités
      - CGU : description annuaire alumni, consentement publication
      - Encadrés informatifs sur les profils alumni
    - [x] Footer
      - Colonne "Liens rapides" : ajout Centre d'applications, Annuaire Alumni, Forum
      - Colonne "Phases" → "Communauté" : Profil Alumni, Webinaires, Aide, Tutoriels
      - Badge "🆕" sur Annuaire Alumni
    - [x] Page MyAlumniProfile
      - Ajout affichage du poste actuel (position)
      - Ajout liens sociaux : LinkedIn, GitHub, Twitter, Site web
      - Boutons colorés avec icônes pour chaque plateforme
    - [x] Fichiers : `src/pages/UserTutorial.tsx`, `src/pages/Help.tsx`, `src/pages/admin/AdminTutorial.tsx`, `src/pages/legal/PrivacyPolicy.tsx`, `src/pages/legal/CGU.tsx`, `src/components/layout/Footer.tsx`, `src/pages/MyAlumniProfile.tsx`
  - [x] **Phase 1.5.4 : Gestion complète des statuts de profils alumni**
    - [x] Nouvel onglet "Rejetés" dans AdminAlumniValidation
      - Affichage du nombre de profils rejetés
      - Liste des profils avec statut "rejected"
    - [x] Service getRejectedAlumniProfiles
      - Fonction dans `alumniService.ts`
      - Récupération des profils rejetés triés par date
    - [x] Révocation des profils approuvés
      - Section "Révoquer l'approbation" pour profils validés
      - Champ raison obligatoire
      - Bouton "Révoquer et rejeter le profil"
      - Profil retiré immédiatement de l'annuaire
    - [x] Ré-approbation des profils rejetés
      - Affichage de la raison du rejet
      - Section "Ré-approuver ce profil"
      - Bouton pour approuver un profil précédemment rejeté
    - [x] Flux complet de gestion des statuts
      - Pending → Approved (approuver)
      - Pending → Rejected (rejeter)
      - Approved → Rejected (révoquer et rejeter)
      - Rejected → Approved (ré-approuver)
      - Any → Deleted (supprimer - superadmin uniquement)
    - [x] Fichiers : `src/pages/admin/AdminAlumniValidation.tsx`, `src/services/alumniService.ts`
  - [x] **Phase 1.5.5 : Auto-gestion du profil alumni par l'utilisateur**
    - [x] Suppression de profil par l'alumni lui-même
      - Section "Zone de danger" dans MyAlumniProfile
      - Bouton "Supprimer mon profil alumni" (rouge avec icône Trash2)
      - Avertissement clair sur l'irréversibilité
    - [x] Modal de confirmation personnalisé
      - Titre : "Supprimer votre profil alumni ?"
      - Message détaillé sur les conséquences
      - Bouton confirmer (danger) : "Oui, supprimer mon profil"
      - Bouton annuler : "Annuler"
      - État de chargement : "Suppression..."
    - [x] Fonction handleDeleteProfile
      - Appel à `deleteAlumniProfile(uid)`
      - Redirection vers `/complete-alumni-profile` après suppression
      - Gestion des erreurs avec feedback utilisateur
    - [x] Sécurité et UX
      - Double confirmation (bouton + modal)
      - Séparation visuelle (bordure, zone de danger)
      - Feedback de chargement pendant la suppression
    - [x] Fichier : `src/pages/MyAlumniProfile.tsx`
  - [ ] **Phase 1.6 : Expérience Alumni & Quick Wins (Valeur perçue immédiate)**
    - [ ] **Onboarding & Motivation**
      - [ ] Ajouter section "Pourquoi compléter ta fiche ?" dans `ApplicationsDashboard.tsx`
        - 3 bénéfices concrets : "Être visible pour missions", "Accès au mentorat", "Opportunités business"
      - [ ] Ajouter banneau "Nouveaux profils publiés" dans `AlumniDirectory.tsx`
        - Afficher 3 derniers profils approuvés
        - Bouton "Découvrir tous les profils"
      - [ ] Ajouter indicateur de complétion de profil (ex: 60%)
        - Dans `EditAlumniProfile.tsx`
        - Encourage à remplir les sections manquantes
      - [ ] Ajouter mini-callout "En complétant ton profil, tu seras éligible aux futures fonctionnalités : matching mentorat, opportunités business, etc."
    - [ ] **Networking Passif → Actif**
      - [ ] Ajouter bouton "Demander un contact / une intro" sur `AlumniDetail.tsx`
        - Ouvre un formulaire simple (objet + message)
        - Envoie email à l'alumni + enregistre la demande
        - ⭐ **Ajouter feedback de confirmation** : "Merci ! Ta demande a été envoyée, on te répond dans les meilleurs délais"
      - [ ] Ajouter bloc "Je cherche / Je propose" dans le formulaire `AlumniProfileForm.tsx`
        - Tags simples : "Je cherche collaborateur", "Je propose conseil", "Je cherche mentor", etc.
        - Affichage dans la fiche
    - [ ] **Mise en avant & Découverte**
      - [ ] Créer composant `NewProfilesHighlight.tsx` (3 cartes des derniers profils)
        - Afficher dans `AlumniDirectory.tsx` en haut
      - [ ] Ajouter section "À découvrir cette semaine" (profils aléatoires)
        - Rotation hebdomadaire
    - [ ] **Notifications & Engagement**
      - [ ] Envoyer email de bienvenue après validation de profil
        - "Ton profil est maintenant visible ! Voici comment en tirer profit..."
      - [ ] Ajouter notification dans `ApplicationsDashboard.tsx` si profil pending
        - "Ton profil est en attente de validation (X jours)"
    - [ ] **Copy & Promesse (UX/Messaging)**
      - [ ] ⭐ Ajouter phrase d'accroche dans `AlumniDirectory.tsx` (en haut)
        - "Trouve en 2 clics des alumni par secteur, pays, promo ou type d'aide (je cherche / je propose)"
      - [ ] ⭐ Ajouter phrase d'accroche dans `ApplicationsDashboard.tsx` (section Alumni)
        - "Connecte-toi avec des alumni : trouve des collaborateurs, des mentors, des opportunités"
      - [ ] ⭐ Clarifier le CTA du formulaire de contact
        - Avant : "Envoyer"
        - Après : "Envoyer ma demande"
    - [ ] **Fichiers** : `src/components/alumni/NewProfilesHighlight.tsx`, `src/components/alumni/ContactRequestForm.tsx`, modifications `AlumniDirectory.tsx`, `AlumniDetail.tsx`, `AlumniProfileForm.tsx`, `ApplicationsDashboard.tsx`
  - [ ] **Intégration au Centre d'Applications**
    - [ ] Ajouter carte "Annuaire Alumni" dans `ApplicationsDashboard.tsx`
    - [ ] Route `/alumni` pointant vers `AlumniDirectory.tsx`

- **Module opportunités business & emploi**
  - [ ] Espace pour offres d’emploi et partenariats B2B
  - [ ] Système de candidatures directes (étudiant ↔ offre)
  - [ ] Suivi des candidatures (statut, historique)
  - [ ] Mécanisme de cooptation / recommandation interne

- **Espace mentorat & networking**
  - [ ] Modèle mentor/mentee (étudiants ↔ alumni)
  - [ ] Matching basé sur intérêts/parcours
  - [ ] Calendrier et planification de sessions
  - [ ] Feedback de mentorat et historique
  - [ ] Événements de networking virtuels/physiques

- **Intelligence Artificielle communautaire**
  - [ ] Chatbot IA pour recherche de profils / ressources
  - [ ] Recommandations de contenus, mentors, opportunités
  - [ ] Automatisation de notifications, rappels, suggestions

- **Connexion événements & initiatives**
  - [ ] Calendrier centralisé des événements (webinaires, rencontres, ateliers)
  - [ ] Gestion des inscriptions
  - [ ] Suivi des présences et historique de participation
  - [ ] Statistiques par événement

- **Gestion avancée de la communauté**
  - [ ] Profils alumni enrichis (certifications, diplômes, projets, expériences)
  - [ ] Système de réputation/badges
  - [ ] Groupes thématiques (clubs, promos, domaines)
  - [ ] Notifications intelligentes par centre d’intérêt

- **Analytics & reporting avancés**
  - [ ] Tableaux de bord analytiques détaillés (étudiants, alumni, activités)
  - [ ] Rapports personnalisables (export PDF/Excel)
  - [ ] Visualisations interactives

- **Améliorations techniques & infrastructure**
  - [ ] Scalabilité (optimisation requêtes, pagination, index Firestore)
  - [ ] Recherche full-text (Firestore + éventuellement moteur externe)
  - [ ] Sécurité renforcée (2FA, audit des accès sensibles)
  - [ ] API externe pour intégrations tierces
  - [ ] Application mobile (iOS/Android ou PWA avancée)
  - [ ] Notifications push mobiles

- **Internationalisation**
  - [ ] Support complet multilingue (FR/EN/AR, etc.)
  - [ ] Gestion fuseaux horaires pour événements & notifications
  - [ ] Gestion devises / localisation si besoin (offres, avantages)

- **Fonctionnalités de croissance de la communauté**
  - [ ] Gamification (points, badges, défis)
  - [ ] Systèmes de recommandations (personnes, contenus, offres)
  - [ ] Parrainage et referral alumni

---

## 3. Suggestions avancées (Backlog / à prioriser)

Ces éléments sont des idées avancées décrites dans la section "Suggestions Fonctionnelles Avancées".

- **Gestion des recommandations écrites & témoignages**
  - [ ] Système de demandes de recommandations (alumni, employeurs, enseignants, mentors)
  - [ ] Rédaction et validation de recommandations
  - [ ] Affichage sur les profils (type LinkedIn)

- **Place de marché de services entre alumni**
  - [ ] Marketplace interne (missions freelances, coaching, relecture CV, traduction, conseils)
  - [ ] Système de mise en relation et éventuellement de paiement

- **Module d’aide à la mobilité internationale**
  - [ ] Guides interactifs spécifiques mobilité (logement, démarches, assurances)
  - [ ] Système de buddy pour nouveaux arrivants

- **Table ronde vidéo / café virtuel aléatoire**
  - [ ] Matchmaking aléatoire de participants
  - [ ] Intégration vidéo (ou lien vers outils tiers) et gestion des sessions

- **Centre d’échange de matériel et bons plans**
  - [ ] Annonces (vente/don) de matériel d’occasion
  - [ ] Partage de logements courte durée, bons plans

- **Outils de job hunting avancés**
  - [ ] Agrégation d’offres externes (LinkedIn, Welcome to the Jungle, etc.)
  - [ ] Alertes personnalisées IA
  - [ ] Suggestion automatique de candidatures

- **Portefeuille de projets open source communautaires**
  - [ ] Espace projets (publication, appel à contributions)
  - [ ] Suivi des contributions

- **Bibliothèque vidéo d’expériences & retours d’alumni**
  - [ ] Hébergement/catalogue de mini-vidéos
  - [ ] Outils de soumission/modération

- **Gestion intelligente des recommandations LinkedIn**
  - [ ] Automatisation de demandes de recommandations/endorsements LinkedIn

- **Vérification & optimisation de CV (IA/mentors)**
  - [ ] Analyse IA des CV + scoring
  - [ ] Workflow revue par mentor

- **Offres “alumni only” (logement, services, avantages)**
  - [ ] Annuaire offres privées réservées aux alumni

- **Carte interactive mondiale des alumni & buddy system**
  - [ ] Carte géographique des membres
  - [ ] Opt-in buddy system

- **Skill matrix & mapping dynamique des compétences**
  - [ ] Visualisation des compétences de la communauté
  - [ ] Outil de création rapide d’équipes projet

- **Micro-certifications & badges internes**
  - [ ] Système de badges/micro-certifications lié aux actions sur la plateforme

- **Bibliothèque podcasts / témoignages audio**
  - [ ] Système de podcasts/témoignages audio

- **Coaching carrière / entrepreneuriat validé**
  - [ ] Catalogue de coachs (spécialistes ou alumni)
  - [ ] Système de réservation/suivi de sessions

- **Donation & levée de fonds à l’association alumni**
  - [ ] Module de dons en ligne et campagnes

- **Consultation participative & roadmap publique**
  - [ ] Module de suggestions/vote
  - [ ] Affichage roadmap publique

- **Marketplace publique d’API pour automatisations**
  - [ ] Référentiel d’API internes/externes partagées

- **Portefeuille associatif & suivi d’engagement**
  - [ ] Historique d’engagement associatif dans le profil

- **Bibliothèque d’offres de stages/emplois passés avec évaluations anonymes**
  - [ ] Base d’offres passées + avis anonymes

---

Ce fichier doit servir de référence centrale pour la roadmap. Pour raffiner, on pourra ajouter des priorités (P0/P1/P2) et des jalons (MVP, V1, V2, etc.).
