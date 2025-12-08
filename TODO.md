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
  - [x] **Phase 1.5.6 : Message d'information et branding**
    - [x] Mise à jour du message d'information important
      - Nouveau branding : "CPS Connect"
      - Ajout mention annuaire alumni
      - Ajout sources officielles (Campus France, ESIGELEC)
      - 5 points clés au lieu de 4
    - [x] Déplacement du modal d'information
      - Suppression du modal à la connexion (App.tsx)
      - Ajout du modal sur la page Dashboard uniquement
      - Affichage une fois par jour par utilisateur
      - localStorage : `dashboardInfoSeen_${uid}`
    - [x] Mise à jour du titre Dashboard
      - Ancien : "Tableau de bord"
      - Nouveau : "CPS Connect · Guide de préparation"
    - [x] URLs des emails corrigées
      - Remplacement de `window.location.origin` par constante `PRODUCTION_URL`
      - URL : `https://esig-prep-guide.vercel.app`
      - Emails concernés : approbation et rejet de profil alumni
    - [x] Fichiers : `src/pages/Dashboard.tsx`, `src/App.tsx`, `src/services/alumniService.ts`
  - [ ] **Phase 1.6 : Expérience Alumni & Quick Wins (Valeur perçue immédiate)**
    - [ ] **Onboarding & Motivation**
      - [ ] Ajouter section "Pourquoi compléter ta fiche ?" dans `ApplicationsDashboard.tsx`
        - 3 bénéfices concrets : "Être visible pour missions", "Accès au mentorat", "Opportunités business"
      - [ ] Ajouter banneau "Nouveaux profils publiés" dans `AlumniDirectory.tsx`
        - Afficher 3 derniers profils approuvés
        - Bouton "Découvrir tous les profils"
      - [x] Ajouter indicateur de complétion de profil (ex: 60%)
        - Dans `CompleteAlumniProfile.tsx` (EditAlumniProfile redirige vers ce composant)
        - Encourage à remplir les sections manquantes
        - Barre de progression visuelle
        - Suggestions d'amélioration du profil
        - Calcul automatique du pourcentage via `profileCompletion.ts`
      - [x] Ajouter mini-callout "En complétant ton profil, tu seras éligible aux futures fonctionnalités : matching mentorat, opportunités business, etc."
        - Intégré dans l'indicateur de complétion
    - [ ] **Networking Passif → Actif**
      - [ ] Ajouter bouton "Demander un contact / une intro" sur `AlumniDetail.tsx`
        - Ouvre un formulaire simple (objet + message)
        - Envoie email à l'alumni + enregistre la demande
        - ⭐ **Ajouter feedback de confirmation** : "Merci ! Ta demande a été envoyée, on te répond dans les meilleurs délais"
      - [x] Ajouter bloc "Je cherche / Je propose" dans le formulaire `AlumniProfileForm.tsx`
        - Tags prédéfinis : "Collaborateur", "Développeur", "Designer", "Mentor", "Opportunité", etc.
        - Tags personnalisés possibles
        - Affichage avec badges colorés (bleu pour "Je cherche", vert pour "Je propose")
        - Intégré dans CompleteAlumniProfile.tsx
    - [x] **Mise en avant & Découverte**
      - [x] Créer composant `NewProfilesHighlight.tsx` (3 cartes des derniers profils)
        - Affiche les 3 derniers profils approuvés
        - Design responsive avec cartes
        - Liens vers les profils détaillés
        - État de chargement
      - [x] Intégrer `NewProfilesHighlight` dans `ApplicationsDashboard.tsx` (section Alumni)
        - Affichage conditionnel uniquement dans la catégorie alumni
        - Meilleur contexte : découverte avant d'accéder à l'annuaire complet
      - [ ] Ajouter section "À découvrir cette semaine" (profils aléatoires)
        - Rotation hebdomadaire
    - [x] **Système de Contact**
      - [x] Créer composant `ContactRequestForm.tsx`
        - Formulaire avec objet et message
        - Validation des champs
        - Message de succès après envoi
        - Gestion d'erreurs
      - [x] Créer fonction `sendContactRequest` dans `alumniService.ts`
        - Enregistrement dans Firestore (collection `contactRequests`)
        - Envoi d'email au destinataire
        - Statuts : pending, sent, failed
      - [x] Intégrer dans `AlumniDetail.tsx`
        - Bouton "Demander un contact / une intro"
        - Formulaire intégré avec toggle
        - Email direct en option secondaire
        - Affichage de "Je cherche / Je propose"
    - [x] **Notifications & Engagement**
      - [ ] Envoyer email de bienvenue après validation de profil (futur)
        - "Ton profil est maintenant visible ! Voici comment en tirer profit..."
      - [x] Ajouter notification dans `ApplicationsDashboard.tsx` si profil pending
        - Notification jaune pour profil en attente
        - Notification verte pour profil approuvé
        - Notification rouge pour profil rejeté
        - ✅ Notification bleue pour profil en brouillon (draft)
    - [x] **Copy & Promesse (UX/Messaging)**
      - [x] ⭐ Ajouter phrase d'accroche dans `AlumniDirectory.tsx` (en haut)
        - "Trouve en 2 clics des alumni par secteur, pays, promo ou type d'aide (je cherche / je propose)"
      - [x] ⭐ Ajouter phrase d'accroche dans `ApplicationsDashboard.tsx` (section Alumni)
        - "Connecte-toi avec des alumni : trouve des collaborateurs, des mentors, des opportunités"
      - [x] ⭐ Clarifier le CTA du formulaire de contact
        - Avant : "Envoyer"
        - Après : "Envoyer ma demande" (intégré dans ContactRequestForm.tsx)
    - [x] **Fichiers créés** :
      - [x] `src/components/alumni/NewProfilesHighlight.tsx`
      - [x] `src/components/alumni/ContactRequestForm.tsx`
      - [x] `src/utils/profileCompletion.ts`
    - [x] **Fichiers modifiés** :
      - [x] `src/components/alumni/AlumniProfileForm.tsx` (ajout seeking/offering + bouton annuler)
      - [x] `src/pages/CompleteAlumniProfile.tsx` (indicateur de complétion + bouton soumission)
      - [x] `src/services/alumniService.ts` (fonction sendContactRequest + submitAlumniProfileForValidation)
      - [x] `src/pages/AlumniDirectory.tsx` (copy + NewProfilesHighlight)
      - [x] `src/pages/AlumniDetail.tsx` (intégration ContactRequestForm + seeking/offering)
      - [x] `src/pages/ApplicationsDashboard.tsx` (copy + notifications draft/pending/approved/rejected)
      - [x] `src/pages/MyAlumniProfile.tsx` (gestion statut draft avec message et icône)
      - [x] `src/types/alumni.ts` (ajout statut 'draft')
      - [x] `firebase.rules` (autorisation suppression profil + transition draft→pending)
  - [x] **Phase 1.7 : Système de Statut Draft (Workflow amélioré)**
    - [x] **Backend & Types**
      - [x] Ajouter statut 'draft' au type `AlumniProfileStatus`
        - Statuts : 'draft' | 'pending' | 'approved' | 'rejected'
      - [x] Modifier création de profil pour statut initial 'draft'
        - Fonction `createAlumniProfileOnSignup` dans `alumniService.ts`
      - [x] Créer fonction `submitAlumniProfileForValidation(uid)`
        - Change statut de 'draft' à 'pending'
        - Envoie email de confirmation à l'utilisateur
      - [x] Créer fonction `getDraftAlumniProfiles()` pour admin
        - Récupération des profils en brouillon
    - [x] **Interface Utilisateur**
      - [x] Modifier `CompleteAlumniProfile.tsx`
        - Bouton "Enregistrer les modifications" (sauvegarde sans soumettre)
        - Bouton "Soumettre pour validation" (visible si draft + complétion ≥ 30%)
        - Messages de succès différenciés
        - Bouton "Annuler" pour retour à la page profil
      - [x] Modifier `MyAlumniProfile.tsx`
        - Ajout cas 'draft' dans `getStatusConfig()`
        - Badge bleu avec icône Edit
        - Message : "Profil en brouillon - Non soumis"
      - [x] Modifier `ApplicationsDashboard.tsx`
        - Notification bleue pour profils en brouillon
        - Lien vers complétion de profil
    - [x] **Administration**
      - [x] Modifier `AdminAlumniValidation.tsx`
        - Ajout onglet "Brouillons" (bleu)
        - Badges de statut pour chaque profil (draft/pending/approved/rejected)
        - Panneau de détail adapté par statut
        - Message informatif pour profils draft
      - [x] Modifier `AlumniStats.tsx`
        - Ajout filtre "Brouillons"
        - Compteur de profils draft
        - Chargement des profils draft
      - [x] Modifier `exportService.ts`
        - Ajout compteur 'draft' dans `calculateAlumniStats`
    - [x] **Sécurité Firebase**
      - [x] Règles Firestore mises à jour
        - Création de profil avec statut 'draft' uniquement
        - Autorisation transition draft → pending par le propriétaire
        - Autorisation suppression de profil par le propriétaire
        - Admin peut tout modifier/supprimer
    - [x] **Fichiers modifiés** :
      - [x] `src/types/alumni.ts`
      - [x] `src/services/alumniService.ts`
      - [x] `src/pages/CompleteAlumniProfile.tsx`
      - [x] `src/components/alumni/AlumniProfileForm.tsx`
      - [x] `src/pages/MyAlumniProfile.tsx`
      - [x] `src/pages/ApplicationsDashboard.tsx`
      - [x] `src/pages/admin/AdminAlumniValidation.tsx`
      - [x] `src/pages/admin/AlumniStats.tsx`
      - [x] `src/utils/exportService.ts`
      - [x] `firebase.rules`
  - [x] **Intégration au Centre d'Applications**
    - [x] Ajouter carte "Annuaire Alumni" dans `ApplicationsDashboard.tsx`
      - Icône Users (violet)
      - Description : "Connecte-toi avec des alumni : trouve des collaborateurs, des mentors, des opportunités"
      - Accessible à tous les rôles (admin, editor, user)
    - [x] Route `/alumni` pointant vers `AlumniDirectory.tsx`
      - Route fonctionnelle et accessible

---

## PHASE 2 : OPPORTUNITÉS BUSINESS & EMPLOI 💼

**📄 Documentation complète** : `docs/PHASE2_OPPORTUNITES.md`

### Phase 2.0 : Vision & Objectifs

**Problématique**
- Les étudiants CPS et alumni cherchent des opportunités (stages, emplois, missions)
- Les alumni entrepreneurs ont des besoins en recrutement/collaboration
- Manque de visibilité sur les opportunités au sein de la communauté ESIG
- Processus de candidature dispersé (LinkedIn, emails, bouche-à-oreille)

**Solution**
Plateforme centralisée d'opportunités où alumni/entreprises publient des offres (emploi, stage, mission, partenariat), étudiants/alumni candidatent directement, système de cooptation pour recommander des candidats, et suivi transparent des candidatures.

---

### Phase 2.1 : Structure de Données

#### 1️⃣ JobOpportunity (Collection Firestore)
- [ ] Créer interface TypeScript `JobOpportunity` dans `src/types/opportunities.ts`
  - [ ] Identifiants : id, createdBy, createdByName, createdByEmail
  - [ ] Informations de base : title, company, companyLogo
  - [ ] Type : 'emploi' | 'stage' | 'alternance' | 'mission' | 'partenariat' | 'freelance'
  - [ ] Description : description, responsibilities[], requirements[], niceToHave[]
  - [ ] Localisation : location { city, country, remote, hybrid }
  - [ ] Contrat : contractType, duration, startDate
  - [ ] Rémunération : salary { min, max, currency, period, negotiable }
  - [ ] Compétences : skills[], sectors[]
  - [ ] Niveau : experienceLevel, educationLevel
  - [ ] Candidatures : applicationsCount, maxApplications
  - [ ] Statut : status ('draft' | 'active' | 'closed' | 'filled')
  - [ ] Visibilité : visibility ('public' | 'alumni-only' | 'students-only')
  - [ ] Métadonnées : dateCreated, dateUpdated, dateExpiration, featured
  - [ ] Contact : contactEmail, contactPhone, applicationUrl
  - [ ] Cooptation : cooptationBonus { amount, currency, description }
  - [ ] Analytics : views, clicks

#### 2️⃣ JobApplication (Collection Firestore)
- [ ] Créer interface TypeScript `JobApplication` dans `src/types/opportunities.ts`
  - [ ] Identifiants : id, jobId, applicantId
  - [ ] Informations candidat : applicantName, applicantEmail, applicantPhone, applicantPhoto
  - [ ] Profil : currentPosition, currentCompany, yearPromo
  - [ ] Candidature : coverLetter, resume, portfolio, linkedin, github
  - [ ] Questions : customAnswers[] { question, answer }
  - [ ] Cooptation : referredBy, referredByName, referralNote
  - [ ] Statut : status ('pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'accepted')
  - [ ] Communication : recruiterNotes, feedback
  - [ ] Métadonnées : dateApplied, dateUpdated, dateReviewed, reviewedBy
  - [ ] Historique : statusHistory[] { status, date, note }

#### 3️⃣ JobAlert (Collection Firestore)
- [ ] Créer interface TypeScript `JobAlert` dans `src/types/opportunities.ts`
  - [ ] Identifiants : id, userId
  - [ ] Critères : keywords[], types[], sectors[], skills[], locations[], remote
  - [ ] Préférences : minSalary, experienceLevel[]
  - [ ] Notifications : frequency ('instant' | 'daily' | 'weekly'), lastSent, active
  - [ ] Métadonnées : dateCreated

---

### Phase 2.2 : Interfaces Utilisateur

#### 1️⃣ Page Opportunités (`/opportunities`)
- [ ] Créer composant `src/pages/opportunities/OpportunitiesPage.tsx`
  - [ ] **Header**
    - [ ] Titre "Opportunités Business & Emploi"
    - [ ] Bouton "Créer une offre" (visible pour alumni/admin)
    - [ ] Barre de recherche globale
  - [ ] **Sidebar de filtres**
    - [ ] Type d'opportunité (checkboxes : emploi, stage, alternance, mission, partenariat, freelance)
    - [ ] Secteur (multi-select avec tags)
    - [ ] Localisation (search input + checkboxes télétravail/hybride)
    - [ ] Niveau d'expérience (checkboxes : débutant, junior, intermédiaire, senior, expert)
    - [ ] Compétences (tags search avec autocomplete)
    - [ ] Salaire minimum (input number)
    - [ ] Bouton "Réinitialiser les filtres"
  - [ ] **Liste des offres**
    - [ ] Cards avec : logo entreprise, titre, entreprise, localisation, type contrat, salaire
    - [ ] Tags compétences (max 5 visibles)
    - [ ] Métadonnées : date publication, nombre de vues
    - [ ] Bouton "Voir détails"
    - [ ] Badge "🆕" si offre < 7 jours
    - [ ] Badge "💎" si bonus cooptation
  - [ ] **Pagination**
    - [ ] 20 offres par page
    - [ ] Boutons Précédent/Suivant
    - [ ] Indicateur "Page X sur Y"
  - [ ] **Tri**
    - [ ] Dropdown : Plus récent, Salaire croissant, Salaire décroissant, Pertinence

#### 2️⃣ Page Détails Offre (`/opportunities/:id`)
- [ ] Créer composant `src/pages/opportunities/OpportunityDetails.tsx`
  - [ ] **Header**
    - [ ] Logo entreprise (grande taille)
    - [ ] Titre du poste (h1)
    - [ ] Entreprise + localisation (ville, pays)
    - [ ] Type de contrat + salaire
    - [ ] Publié par : Nom alumni (Promo XXXX)
    - [ ] Stats : Date publication, vues, nombre de candidatures
    - [ ] **Boutons d'action**
      - [ ] "Postuler maintenant" (bouton principal)
      - [ ] "💾 Sauvegarder" (bouton secondaire)
      - [ ] "📤 Partager" (dropdown : LinkedIn, Twitter, Copier lien)
  - [ ] **Sections de contenu**
    - [ ] 📋 Description complète (rich text)
    - [ ] 🎯 Responsabilités (liste à puces)
    - [ ] ✅ Compétences requises (liste à puces)
    - [ ] 🌟 Nice to have (liste à puces)
    - [ ] 💼 Compétences techniques (tags colorés)
    - [ ] 📍 Localisation détaillée (ville, pays, remote/hybride)
    - [ ] 💰 Rémunération (fourchette + négociable)
    - [ ] 💎 Bonus cooptation (si applicable, encadré mis en avant)
    - [ ] 📧 Contact (email, téléphone)
  - [ ] **Bouton "Recommander quelqu'un"** (si bonus cooptation)
    - [ ] Ouvre modal de cooptation

#### 3️⃣ Formulaire de Candidature (Modal)
- [ ] Créer composant `src/components/opportunities/ApplicationModal.tsx`
  - [ ] **Informations personnelles** (pré-remplies depuis profil)
    - [ ] Nom (disabled)
    - [ ] Email (disabled)
    - [ ] Téléphone (input)
  - [ ] **Profil professionnel**
    - [ ] Poste actuel (input)
    - [ ] Entreprise actuelle (input)
  - [ ] **Documents**
    - [ ] Upload CV (drag & drop, PDF max 5MB)
    - [ ] Portfolio URL (input)
    - [ ] LinkedIn URL (input)
    - [ ] GitHub URL (input)
  - [ ] **Lettre de motivation**
    - [ ] Textarea (min 100 caractères)
    - [ ] Compteur de caractères
  - [ ] **Cooptation** (optionnel)
    - [ ] Recherche alumni recommandeur (autocomplete)
    - [ ] Affichage alumni sélectionné
  - [ ] **Boutons**
    - [ ] "Annuler" (ferme modal)
    - [ ] "Envoyer ma candidature" (bouton principal)
  - [ ] **Validation**
    - [ ] Vérification tous les champs requis
    - [ ] Validation format email/URL
    - [ ] Vérification taille fichier CV
  - [ ] **Actions**
    - [ ] Upload CV vers Firebase Storage (`cvs/{jobId}/{applicantId}/`)
    - [ ] Création document JobApplication dans Firestore
    - [ ] Envoi notification email au recruteur
    - [ ] Message de succès + redirection vers `/my-applications`

#### 4️⃣ Mes Candidatures (`/my-applications`)
- [ ] Créer composant `src/pages/opportunities/MyApplications.tsx`
  - [ ] **Header**
    - [ ] Titre "Mes Candidatures"
    - [ ] Compteurs globaux (Total, En attente, En cours, Refusées, Acceptées)
  - [ ] **Onglets de filtrage**
    - [ ] Toutes (badge avec nombre)
    - [ ] En attente (badge avec nombre)
    - [ ] En cours (badge avec nombre)
    - [ ] Refusées (badge avec nombre)
    - [ ] Acceptées (badge avec nombre)
  - [ ] **Liste des candidatures** (cards)
    - [ ] Titre offre + entreprise
    - [ ] Badge statut (coloré selon statut)
    - [ ] Date candidature
    - [ ] Dernière mise à jour
    - [ ] **Boutons d'action**
      - [ ] "Voir détails de l'offre"
      - [ ] "Retirer ma candidature" (si pending/reviewed)
    - [ ] **Timeline historique** (expandable)
      - [ ] Liste des changements de statut avec dates
      - [ ] Notes du recruteur (si disponibles)
    - [ ] **Feedback recruteur** (si disponible)
      - [ ] Affichage du message de feedback
  - [ ] **État vide**
    - [ ] Message "Aucune candidature pour le moment"
    - [ ] Bouton "Découvrir les opportunités"

#### 5️⃣ Créer une Offre (`/opportunities/create`)
- [ ] Créer composant `src/pages/opportunities/CreateOpportunity.tsx`
  - [ ] **Formulaire multi-étapes (4 étapes)**
  - [ ] **Indicateur de progression**
    - [ ] Stepper visuel (1/4, 2/4, 3/4, 4/4)
    - [ ] Titres des étapes cliquables (si étape déjà validée)
  
  - [ ] **Étape 1/4 : Informations de base**
    - [ ] Type d'opportunité (radio buttons avec icônes)
      - [ ] Emploi (CDI/CDD)
      - [ ] Stage
      - [ ] Alternance
      - [ ] Mission/Freelance
      - [ ] Partenariat B2B
    - [ ] Titre du poste (input, requis)
    - [ ] Entreprise (input, requis)
    - [ ] Upload logo entreprise (drag & drop, PNG/JPG max 2MB)
    - [ ] Bouton "Suivant" (validation avant passage)
  
  - [ ] **Étape 2/4 : Description & Exigences**
    - [ ] Description du poste (rich text editor, requis)
    - [ ] Responsabilités (liste dynamique)
      - [ ] Input + bouton "Ajouter"
      - [ ] Liste avec bouton supprimer par item
      - [ ] Minimum 2 responsabilités
    - [ ] Compétences requises (liste dynamique)
      - [ ] Input + bouton "Ajouter"
      - [ ] Liste avec bouton supprimer par item
      - [ ] Minimum 2 compétences
    - [ ] Nice to have (liste dynamique, optionnel)
      - [ ] Input + bouton "Ajouter"
      - [ ] Liste avec bouton supprimer par item
    - [ ] Boutons "Précédent" | "Suivant"
  
  - [ ] **Étape 3/4 : Détails pratiques**
    - [ ] **Localisation**
      - [ ] Ville (input, requis)
      - [ ] Pays (select, requis)
      - [ ] ☐ Télétravail possible (checkbox)
      - [ ] ☐ Hybride (checkbox)
    - [ ] Type de contrat (select : CDI, CDD, Stage, Alternance, Freelance, Autre)
    - [ ] Durée (input, visible si CDD/Stage/Alternance)
    - [ ] Date de début souhaitée (date picker)
    - [ ] **Rémunération**
      - [ ] Salaire minimum (input number)
      - [ ] Salaire maximum (input number)
      - [ ] Devise (select : EUR, USD, GBP, etc.)
      - [ ] Période (select : annuel, mensuel, horaire, mission)
      - [ ] ☐ Négociable (checkbox)
    - [ ] Niveau d'expérience (select : débutant, junior, intermédiaire, senior, expert)
    - [ ] Compétences techniques (tags input avec autocomplete)
    - [ ] Secteurs (tags input : Tech, Finance, Santé, etc.)
    - [ ] Boutons "Précédent" | "Suivant"
  
  - [ ] **Étape 4/4 : Paramètres & Publication**
    - [ ] **Visibilité** (radio buttons)
      - [ ] Public (tout le monde)
      - [ ] Alumni uniquement
      - [ ] Étudiants uniquement
    - [ ] Limite de candidatures (input number, optionnel)
    - [ ] Date d'expiration (date picker, optionnel)
    - [ ] **Contact**
      - [ ] Email (input, pré-rempli)
      - [ ] Téléphone (input, optionnel)
    - [ ] URL de candidature externe (input, optionnel)
    - [ ] **Bonus cooptation** (optionnel)
      - [ ] Montant (input number)
      - [ ] Devise (select)
      - [ ] Description (textarea)
    - [ ] Boutons "Précédent" | "💾 Sauvegarder brouillon" | "✅ Publier"
  
  - [ ] **Fonctionnalités transversales**
    - [ ] Validation à chaque étape
    - [ ] Sauvegarde automatique (brouillon) toutes les 30 secondes
    - [ ] Récupération du brouillon au retour
    - [ ] Messages d'erreur contextuels

#### 6️⃣ Gestion des Candidatures (`/opportunities/:id/applications`)
- [ ] Créer composant `src/pages/opportunities/ManageApplications.tsx`
  - [ ] **Vérification des permissions** (seul le créateur de l'offre)
  - [ ] **Header**
    - [ ] Titre de l'offre
    - [ ] Lien "Voir l'offre publique"
    - [ ] Compteurs par statut
  - [ ] **Onglets de filtrage**
    - [ ] Toutes (badge avec nombre)
    - [ ] En attente (badge avec nombre)
    - [ ] Présélectionnés (badge avec nombre)
    - [ ] Entretien (badge avec nombre)
    - [ ] Refusées (badge avec nombre)
    - [ ] Acceptées (badge avec nombre)
  - [ ] **Tri & Filtres**
    - [ ] Dropdown tri : Plus récent, Plus ancien, Pertinence
    - [ ] Filtre par compétences (multi-select)
  - [ ] **Liste des candidatures** (cards expandables)
    - [ ] **Vue compacte**
      - [ ] Photo + nom candidat
      - [ ] Poste actuel @ Entreprise
      - [ ] Promo + localisation
      - [ ] Tags compétences (3 max)
      - [ ] Date candidature
      - [ ] Badge "🤝 Recommandé par [Nom]" (si cooptation)
      - [ ] Bouton "Voir plus"
    - [ ] **Vue détaillée** (expandable)
      - [ ] Lettre de motivation (texte complet)
      - [ ] Liens : CV, Portfolio, LinkedIn, GitHub
      - [ ] **Actions recruteur**
        - [ ] Dropdown changement de statut
          - [ ] Marquer comme "Examiné"
          - [ ] Marquer comme "Présélectionné"
          - [ ] Inviter à un entretien
          - [ ] Refuser
          - [ ] Accepter
        - [ ] Textarea "Notes internes" (sauvegarde auto)
        - [ ] Textarea "Feedback au candidat" + bouton "Envoyer"
      - [ ] Boutons : "📄 Télécharger CV" | "💼 Voir profil" | "✉️ Contacter"
  - [ ] **Notifications**
    - [ ] Email au candidat lors du changement de statut
    - [ ] Email au candidat lors de l'envoi de feedback

#### 7️⃣ Système de Cooptation
- [ ] **Modal de Recommandation** (`src/components/opportunities/ReferralModal.tsx`)
  - [ ] Affichage de l'offre (titre, entreprise, bonus)
  - [ ] **Recherche candidat**
    - [ ] Option 1 : Rechercher dans l'annuaire alumni (autocomplete)
    - [ ] Option 2 : Inviter par email (input)
  - [ ] Note de recommandation (textarea, requis)
    - [ ] "Pourquoi recommandez-vous cette personne ?"
    - [ ] Min 50 caractères
  - [ ] Message d'information
    - [ ] "Le candidat recevra une invitation à postuler avec votre recommandation"
  - [ ] Boutons : "Annuler" | "Envoyer la recommandation"
  - [ ] **Actions**
    - [ ] Envoi email au candidat avec lien unique
    - [ ] Création référence dans JobApplication (referredBy)
    - [ ] Notification au recruteur

- [ ] **Page Mes Cooptations** (`src/pages/opportunities/MyReferrals.tsx`)
  - [ ] **Header avec stats globales**
    - [ ] Total recommandations
    - [ ] Candidats recrutés
    - [ ] Bonus gagnés (montant total)
  - [ ] **Filtres**
    - [ ] Toutes
    - [ ] En cours
    - [ ] Recrutées
    - [ ] Non retenues
  - [ ] **Liste des cooptations** (cards)
    - [ ] Candidat recommandé (nom + photo)
    - [ ] Offre (titre + entreprise)
    - [ ] Date de recommandation
    - [ ] **Statut** (badge coloré)
      - [ ] 🟡 En cours d'entretien
      - [ ] ✅ Recruté
      - [ ] 🔴 Non retenu
    - [ ] **Bonus** (si recruté)
      - [ ] Montant + devise
      - [ ] Date de versement
    - [ ] Bouton "Voir détails"

#### 8️⃣ Alertes Emploi (`/job-alerts`)
- [ ] Créer composant `src/pages/opportunities/JobAlerts.tsx`
  - [ ] **Header**
    - [ ] Titre "Mes Alertes Emploi"
    - [ ] Bouton "Créer une nouvelle alerte"
  - [ ] **Liste des alertes** (cards)
    - [ ] Nom/description de l'alerte
    - [ ] **Critères affichés** (tags)
      - [ ] Mots-clés
      - [ ] Types d'opportunité
      - [ ] Secteurs
      - [ ] Localisation
    - [ ] Fréquence (Instantanée, Quotidienne, Hebdomadaire)
    - [ ] Dernière notification (date)
    - [ ] Badge "X nouvelles offres"
    - [ ] Toggle Actif/Désactivé
    - [ ] Boutons : "✏️ Modifier" | "🗑️ Supprimer"
  
  - [ ] **Modal Création/Édition Alerte**
    - [ ] Nom de l'alerte (input)
    - [ ] **Critères de recherche**
      - [ ] Mots-clés (tags input)
      - [ ] Types d'opportunité (checkboxes)
      - [ ] Secteurs (multi-select)
      - [ ] Compétences (tags input avec autocomplete)
      - [ ] Localisations (tags input)
      - [ ] ☐ Télétravail uniquement (checkbox)
      - [ ] Salaire minimum (input number)
      - [ ] Niveau d'expérience (checkboxes)
    - [ ] **Fréquence de notification** (radio buttons)
      - [ ] Instantanée (dès qu'une offre correspond)
      - [ ] Quotidienne (résumé journalier)
      - [ ] Hebdomadaire (résumé hebdomadaire)
    - [ ] Boutons : "Annuler" | "Sauvegarder l'alerte"

---

### Phase 2.3 : Fonctionnalités Techniques

#### 1️⃣ Services Firebase
- [ ] **opportunitiesService.ts** (`src/services/opportunitiesService.ts`)
  - [ ] `createOpportunity(data)` - Créer une offre
  - [ ] `updateOpportunity(id, data)` - Modifier une offre
  - [ ] `deleteOpportunity(id)` - Supprimer une offre
  - [ ] `getOpportunityById(id)` - Récupérer une offre
  - [ ] `getOpportunities(filters, pagination)` - Liste avec filtres
  - [ ] `getMyOpportunities(userId)` - Mes offres créées
  - [ ] `incrementViews(id)` - Incrémenter les vues
  - [ ] `incrementClicks(id)` - Incrémenter les clics

- [ ] **applicationsService.ts** (`src/services/applicationsService.ts`)
  - [ ] `createApplication(data)` - Créer une candidature
  - [ ] `updateApplicationStatus(id, status, note)` - Changer statut
  - [ ] `getApplicationById(id)` - Récupérer une candidature
  - [ ] `getMyApplications(userId)` - Mes candidatures
  - [ ] `getApplicationsForJob(jobId)` - Candidatures pour une offre
  - [ ] `withdrawApplication(id)` - Retirer une candidature
  - [ ] `sendFeedback(id, feedback)` - Envoyer feedback

- [ ] **alertsService.ts** (`src/services/alertsService.ts`)
  - [ ] `createAlert(data)` - Créer une alerte
  - [ ] `updateAlert(id, data)` - Modifier une alerte
  - [ ] `deleteAlert(id)` - Supprimer une alerte
  - [ ] `getMyAlerts(userId)` - Mes alertes
  - [ ] `toggleAlert(id, active)` - Activer/désactiver
  - [ ] `checkAlertsForNewOpportunity(opportunityId)` - Matching

#### 2️⃣ Recherche & Filtrage
- [ ] **Moteur de recherche**
  - [ ] Full-text search sur titre, description, compétences
  - [ ] Filtres combinés (type, secteur, localisation, salaire, etc.)
  - [ ] Tri (plus récent, salaire croissant/décroissant, pertinence)
  - [ ] Pagination (20 offres par page)
  - [ ] Index Firestore optimisés
    - [ ] Index composite : status + dateCreated
    - [ ] Index composite : type + status + dateCreated
    - [ ] Index composite : sectors + status + dateCreated

- [ ] **Algorithme de matching**
  - [ ] Créer `src/utils/matchingAlgorithm.ts`
  - [ ] Score de pertinence basé sur :
    - [ ] Compétences profil vs compétences requises (40%)
    - [ ] Localisation préférée vs localisation offre (20%)
    - [ ] Niveau d'expérience (20%)
    - [ ] Secteurs d'intérêt (20%)
  - [ ] Recommandations personnalisées sur page d'accueil

#### 3️⃣ Notifications
- [ ] **Système de notifications**
  - [ ] Créer `src/services/notificationsService.ts`
  - [ ] **Événements déclencheurs**
    - [ ] Nouvelle offre correspondant aux alertes
    - [ ] Candidature reçue (pour recruteur)
    - [ ] Changement de statut candidature
    - [ ] Cooptation acceptée/refusée
    - [ ] Offre bientôt expirée (7 jours avant)
    - [ ] Bonus cooptation versé
  - [ ] **Canaux**
    - [ ] In-app (badge notification dans header)
    - [ ] Email (EmailJS)
    - [ ] Push (si PWA activée)
  - [ ] **Templates d'emails**
    - [ ] Email nouvelle candidature
    - [ ] Email changement statut
    - [ ] Email feedback recruteur
    - [ ] Email alerte emploi
    - [ ] Email cooptation
  - [ ] **Préférences utilisateur**
    - [ ] Page paramètres notifications
    - [ ] Choix fréquence par type de notification
    - [ ] Choix canaux (email, push)

#### 4️⃣ Analytics
- [ ] **Analytics pour recruteurs**
  - [ ] Dashboard dans page de gestion candidatures
  - [ ] Vues de l'offre (graphique temporel)
  - [ ] Taux de conversion (vues → candidatures)
  - [ ] Temps moyen de réponse
  - [ ] Source des candidatures (direct, cooptation, alerte)
  - [ ] Répartition par statut (pie chart)

- [ ] **Analytics pour candidats**
  - [ ] Dashboard dans page "Mes candidatures"
  - [ ] Taux de réponse aux candidatures
  - [ ] Temps moyen avant réponse
  - [ ] Offres sauvegardées vs candidatures envoyées
  - [ ] Statistiques par type d'offre

- [ ] **Analytics pour admins**
  - [ ] Page dédiée `AdminOpportunitiesAnalytics.tsx`
  - [ ] Offres les plus populaires (top 10)
  - [ ] Secteurs les plus actifs
  - [ ] Taux de placement (candidatures → recrutements)
  - [ ] ROI des cooptations
  - [ ] Statistiques globales (graphiques temporels)
  - [ ] Export rapports (PDF)

#### 5️⃣ Sécurité & Permissions
- [ ] **Règles Firestore** (firebase.rules)
  - [ ] Collection `opportunities`
    - [ ] User : Lecture offres actives, création interdite
    - [ ] Alumni : Lecture + création + modification (si créateur)
    - [ ] Editor : Lecture + modération
    - [ ] Admin : Lecture + écriture complète
  - [ ] Collection `applications`
    - [ ] User : Lecture (si candidat) + création
    - [ ] Alumni : Lecture (si recruteur de l'offre)
    - [ ] Admin : Lecture complète
  - [ ] Collection `alerts`
    - [ ] User : Lecture + écriture (si propriétaire)
    - [ ] Admin : Lecture complète

- [ ] **Validation des données**
  - [ ] Validation côté client (React Hook Form + Zod)
  - [ ] Validation côté serveur (Cloud Functions)
  - [ ] Sanitization des inputs (DOMPurify pour rich text)
  - [ ] Limite taille fichiers (CV max 5MB, logo max 2MB)

#### 6️⃣ Intégrations
- [ ] **Import/Parse CV**
  - [ ] Créer `src/utils/cvParser.ts`
  - [ ] Bibliothèque : pdf-parse ou pdf.js
  - [ ] Extraction : nom, email, téléphone, compétences
  - [ ] Pré-remplissage automatique du formulaire
  - [ ] Gestion des erreurs de parsing

- [ ] **Export données**
  - [ ] Export candidatures en CSV
  - [ ] Export candidatures en Excel (xlsx)
  - [ ] Export analytics en PDF (jsPDF)
  - [ ] Génération rapports personnalisés

- [ ] **Partage**
  - [ ] Lien direct vers offre (copy to clipboard)
  - [ ] Partage sur LinkedIn (LinkedIn Share API)
  - [ ] Partage sur Twitter (Twitter Web Intent)
  - [ ] QR Code pour offre (qrcode.react)
  - [ ] Embed offre (iframe avec paramètres)

- [ ] **Storage Firebase**
  - [ ] Organisation dossiers : `cvs/{jobId}/{applicantId}/cv.pdf`
  - [ ] Organisation dossiers : `logos/{opportunityId}/logo.png`
  - [ ] Nettoyage fichiers orphelins (Cloud Function)
  - [ ] Règles de sécurité Storage

---

### Phase 2.4 : Métriques de Succès

#### KPIs à suivre
- [ ] **Engagement**
  - [ ] Nombre d'offres publiées/mois
  - [ ] Nombre de candidatures/mois
  - [ ] Taux de conversion (vues → candidatures)
  - [ ] Temps moyen de réponse recruteur

- [ ] **Qualité**
  - [ ] Taux de placement (candidatures → recrutements)
  - [ ] Satisfaction candidats (système de feedback)
  - [ ] Satisfaction recruteurs (système de feedback)
  - [ ] Taux de cooptation réussie

- [ ] **Croissance**
  - [ ] Nouveaux recruteurs/mois
  - [ ] Nouveaux candidats actifs/mois
  - [ ] Nombre d'offres actives
  - [ ] Nombre de secteurs représentés

#### Implémentation tracking
- [ ] Firebase Analytics (événements personnalisés)
- [ ] Vercel Analytics (pages vues)
- [ ] Custom events (actions utilisateurs)
- [ ] Dashboards de suivi (admin)

---

### Phase 2.5 : Roadmap de Développement

#### Phase 2.5.1 : MVP (4-6 semaines)

**Semaine 1-2 : Structure de données & Backend**
- [ ] Créer interfaces TypeScript (JobOpportunity, JobApplication, JobAlert)
- [ ] Configurer collections Firestore
- [ ] Définir règles de sécurité Firestore
- [ ] Créer opportunitiesService.ts (CRUD complet)
- [ ] Créer applicationsService.ts (CRUD complet)
- [ ] Créer alertsService.ts (CRUD complet)
- [ ] Tests unitaires des services

**Semaine 3-4 : Interfaces principales**
- [ ] OpportunitiesPage.tsx (liste + filtres basiques)
- [ ] OpportunityDetails.tsx (détails complets)
- [ ] ApplicationModal.tsx (formulaire candidature)
- [ ] MyApplications.tsx (suivi candidatures)
- [ ] Composants réutilisables (OpportunityCard, ApplicationCard)
- [ ] Responsive mobile

**Semaine 5-6 : Création offres & Notifications**
- [ ] CreateOpportunity.tsx (formulaire 4 étapes)
- [ ] Upload logo entreprise (Firebase Storage)
- [ ] Upload CV (Firebase Storage)
- [ ] Notifications email basiques (EmailJS)
- [ ] Tests & corrections bugs
- [ ] Documentation utilisateur

#### Phase 2.5.2 : Fonctionnalités Avancées (3-4 semaines)

**Semaine 7-8 : Cooptation**
- [ ] ReferralModal.tsx (recommandation)
- [ ] MyReferrals.tsx (suivi cooptations)
- [ ] Système de tracking bonus
- [ ] Notifications cooptation (email)
- [ ] Tests du flux complet

**Semaine 9-10 : Alertes & Gestion**
- [ ] JobAlerts.tsx (gestion alertes)
- [ ] Matching offres ↔ alertes (algorithme)
- [ ] Envoi notifications alertes (Cloud Function cron job)
- [ ] ManageApplications.tsx (gestion recruteur)
- [ ] Système de statuts + historique
- [ ] Feedback candidats

**Semaine 11 : Analytics**
- [ ] Analytics de base (vues, clics, candidatures)
- [ ] Dashboard recruteur (graphiques)
- [ ] Dashboard candidat (statistiques)
- [ ] AdminOpportunitiesAnalytics.tsx
- [ ] Export rapports

#### Phase 2.5.3 : Optimisations (2-3 semaines)

**Semaine 12-13 : Features avancées**
- [ ] Import/parse CV automatique (cvParser.ts)
- [ ] Recherche avancée full-text
- [ ] Algorithme de matching (matchingAlgorithm.ts)
- [ ] Recommandations personnalisées
- [ ] Export données (CSV, Excel, PDF)

**Semaine 14 : UX & Mobile**
- [ ] Notifications push (PWA)
- [ ] Partage social (LinkedIn, Twitter)
- [ ] QR Code offres
- [ ] Optimisations responsive mobile
- [ ] Optimisations performance (lazy loading, code splitting)

#### Phase 2.5.4 : Intelligence (3-4 semaines)

**Semaine 15-16 : IA & Recommandations**
- [ ] Recommandations IA (offres pour candidat)
- [ ] Suggestions candidats (pour recruteur)
- [ ] Auto-complétion compétences (ML)
- [ ] Matching intelligent (score avancé)

**Semaine 17-18 : Analytics avancés & Tests**
- [ ] Analytics avancés (prédictions, tendances)
- [ ] A/B testing offres
- [ ] Tests utilisateurs (feedback)
- [ ] Optimisations finales
- [ ] Documentation complète (technique + utilisateur)

---

### Phase 2.6 : Notes d'Implémentation

#### Stack Technique
- [ ] React Hook Form (gestion formulaires)
- [ ] Zod (validation schémas)
- [ ] Lucide React (icônes)
- [ ] Recharts (graphiques analytics)
- [ ] DOMPurify (sanitization)
- [ ] pdf-parse (parsing CV)
- [ ] qrcode.react (QR codes)
- [ ] jsPDF (export PDF)
- [ ] xlsx (export Excel)

#### Fichiers à Créer

**Types**
- [ ] `src/types/opportunities.ts`

**Services**
- [ ] `src/services/opportunitiesService.ts`
- [ ] `src/services/applicationsService.ts`
- [ ] `src/services/alertsService.ts`
- [ ] `src/services/notificationsService.ts`

**Pages**
- [ ] `src/pages/opportunities/OpportunitiesPage.tsx`
- [ ] `src/pages/opportunities/OpportunityDetails.tsx`
- [ ] `src/pages/opportunities/CreateOpportunity.tsx`
- [ ] `src/pages/opportunities/MyApplications.tsx`
- [ ] `src/pages/opportunities/ManageApplications.tsx`
- [ ] `src/pages/opportunities/MyReferrals.tsx`
- [ ] `src/pages/opportunities/JobAlerts.tsx`
- [ ] `src/pages/admin/AdminOpportunitiesAnalytics.tsx`

**Composants**
- [ ] `src/components/opportunities/ApplicationModal.tsx`
- [ ] `src/components/opportunities/ReferralModal.tsx`
- [ ] `src/components/opportunities/OpportunityCard.tsx`
- [ ] `src/components/opportunities/ApplicationCard.tsx`
- [ ] `src/components/opportunities/OpportunityFilters.tsx`
- [ ] `src/components/opportunities/ApplicationStatusBadge.tsx`

**Utilitaires**
- [ ] `src/utils/cvParser.ts`
- [ ] `src/utils/matchingAlgorithm.ts`

**Cloud Functions**
- [ ] `functions/sendApplicationNotification.js`
- [ ] `functions/sendStatusChangeNotification.js`
- [ ] `functions/checkJobAlerts.js` (cron job)
- [ ] `functions/cleanOrphanFiles.js` (cron job)

#### Design System

**Couleurs par Type d'Opportunité**
- Emploi (CDI/CDD) : Bleu (#3B82F6)
- Stage : Vert (#10B981)
- Alternance : Violet (#8B5CF6)
- Mission/Freelance : Orange (#F59E0B)
- Partenariat : Rose (#EC4899)

**Couleurs par Statut Candidature**
- Pending : Gris (#6B7280)
- Reviewed : Bleu (#3B82F6)
- Shortlisted : Jaune (#F59E0B)
- Interview : Violet (#8B5CF6)
- Rejected : Rouge (#EF4444)
- Accepted : Vert (#10B981)

**Icônes (Lucide React)**
- Opportunités : Briefcase
- Candidatures : FileText
- Cooptation : Users
- Alertes : Bell
- Filtres : Filter
- Recherche : Search
- Upload CV : Upload
- Localisation : MapPin
- Salaire : DollarSign
- Compétences : Code

---

- **Espace mentorat & networking**
  - [ ] Modèle mentor/mentee (étudiants ↔ alumni)
  - [ ] Matching basé sur intérêts/parcours
  - [ ] Calendrier et planification de sessions
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
