# PHASE 2 : OPPORTUNITÉS BUSINESS & EMPLOI 💼

## 🎯 Vision & Objectifs

### Problématique
- Les étudiants CPS et alumni cherchent des opportunités (stages, emplois, missions)
- Les alumni entrepreneurs ont des besoins en recrutement/collaboration
- Manque de visibilité sur les opportunités au sein de la communauté ESIG
- Processus de candidature dispersé (LinkedIn, emails, bouche-à-oreille)

### Solution
**Plateforme centralisée d'opportunités** où :
- Alumni/entreprises publient des offres (emploi, stage, mission, partenariat)
- Étudiants/alumni candidatent directement
- Système de cooptation pour recommander des candidats
- Suivi transparent des candidatures

---

## 📊 STRUCTURE DE DONNÉES

### 1️⃣ JobOpportunity (Collection Firestore)

```typescript
interface JobOpportunity {
  // Identifiants
  id: string;
  createdBy: string;              // UID de l'alumni/admin qui poste
  createdByName: string;          // Nom du créateur
  createdByEmail: string;
  
  // Informations de base
  title: string;                  // "Développeur React Senior"
  company: string;                // "TechCorp"
  companyLogo?: string;           // URL du logo
  
  // Type d'opportunité
  type: 'emploi' | 'stage' | 'alternance' | 'mission' | 'partenariat' | 'freelance';
  
  // Description
  description: string;            // Description complète (rich text)
  responsibilities: string[];     // ["Développer features", "Code review"]
  requirements: string[];         // ["3 ans exp React", "Maîtrise TypeScript"]
  niceToHave?: string[];         // ["Exp GraphQL", "Connaissance Docker"]
  
  // Détails pratiques
  location: {
    city: string;
    country: string;
    remote: boolean;              // Télétravail possible
    hybrid: boolean;              // Hybride
  };
  
  // Contrat
  contractType: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance' | 'Autre';
  duration?: string;              // "6 mois", "2 ans", etc.
  startDate?: Timestamp;          // Date de début souhaitée
  
  // Rémunération
  salary?: {
    min?: number;
    max?: number;
    currency: string;             // "EUR", "USD"
    period: 'annuel' | 'mensuel' | 'horaire' | 'mission';
    negotiable: boolean;
  };
  
  // Compétences & Tags
  skills: string[];               // ["React", "TypeScript", "Node.js"]
  sectors: string[];              // ["Tech", "Startup"]
  
  // Niveau requis
  experienceLevel: 'junior' | 'intermediaire' | 'senior' | 'expert' | 'debutant';
  educationLevel?: string;        // "Bac+5", "Master"
  
  // Candidatures
  applicationsCount: number;      // Nombre de candidatures
  maxApplications?: number;       // Limite de candidatures (optionnel)
  
  // Statut & Visibilité
  status: 'draft' | 'active' | 'closed' | 'filled';
  visibility: 'public' | 'alumni-only' | 'students-only';
  
  // Métadonnées
  dateCreated: Timestamp;
  dateUpdated: Timestamp;
  dateExpiration?: Timestamp;     // Date de fin de l'offre
  featured: boolean;              // Mise en avant (admin)
  
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  applicationUrl?: string;        // URL externe si candidature hors plateforme
  
  // Cooptation
  cooptationBonus?: {
    amount: number;
    currency: string;
    description: string;
  };
  
  // Analytics
  views: number;
  clicks: number;
}
```

### 2️⃣ JobApplication (Collection Firestore)

```typescript
interface JobApplication {
  // Identifiants
  id: string;
  jobId: string;                  // Référence à JobOpportunity
  applicantId: string;            // UID du candidat
  
  // Informations candidat
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantPhoto?: string;
  
  // Profil candidat
  currentPosition?: string;
  currentCompany?: string;
  yearPromo: number;
  
  // Candidature
  coverLetter: string;            // Lettre de motivation
  resume?: string;                // URL du CV (Firebase Storage)
  portfolio?: string;             // URL portfolio
  linkedin?: string;
  github?: string;
  
  // Réponses aux questions (optionnel)
  customAnswers?: {
    question: string;
    answer: string;
  }[];
  
  // Cooptation
  referredBy?: string;            // UID de l'alumni qui recommande
  referredByName?: string;
  referralNote?: string;          // Note du coopteur
  
  // Statut
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'accepted';
  
  // Communication
  recruiterNotes?: string;        // Notes internes du recruteur
  feedback?: string;              // Feedback au candidat
  
  // Métadonnées
  dateApplied: Timestamp;
  dateUpdated: Timestamp;
  dateReviewed?: Timestamp;
  reviewedBy?: string;            // UID du recruteur
  
  // Historique
  statusHistory: {
    status: string;
    date: Timestamp;
    note?: string;
  }[];
}
```

### 3️⃣ JobAlert (Collection Firestore)

```typescript
interface JobAlert {
  id: string;
  userId: string;
  
  // Critères de recherche
  keywords?: string[];
  types?: string[];               // ['emploi', 'stage']
  sectors?: string[];
  skills?: string[];
  locations?: string[];
  remote?: boolean;
  
  // Préférences
  minSalary?: number;
  experienceLevel?: string[];
  
  // Notifications
  frequency: 'instant' | 'daily' | 'weekly';
  lastSent?: Timestamp;
  active: boolean;
  
  dateCreated: Timestamp;
}
```

---

## 🎨 INTERFACES UTILISATEUR

### 1️⃣ Page Opportunités (`/opportunities`)

**Checklist**
- [ ] Créer composant `OpportunitiesPage.tsx`
- [ ] Header avec titre et bouton "Créer une offre"
- [ ] Sidebar de filtres
  - [ ] Type d'opportunité (checkboxes)
  - [ ] Secteur (multi-select)
  - [ ] Localisation (search + télétravail/hybride)
  - [ ] Niveau d'expérience (checkboxes)
  - [ ] Compétences (tags search)
  - [ ] Salaire minimum (input)
  - [ ] Bouton réinitialiser
- [ ] Liste des offres (cards)
  - [ ] Logo entreprise
  - [ ] Titre + entreprise + localisation + type contrat + salaire
  - [ ] Compétences (tags)
  - [ ] Date publication + vues
  - [ ] Bouton "Voir détails"
- [ ] Pagination (20 offres/page)
- [ ] Tri (plus récent, salaire, pertinence)

### 2️⃣ Page Détails Offre (`/opportunities/:id`)

**Checklist**
- [ ] Créer composant `OpportunityDetails.tsx`
- [ ] Header
  - [ ] Logo entreprise
  - [ ] Titre + entreprise + localisation
  - [ ] Type contrat + salaire
  - [ ] Publié par (nom alumni + promo)
  - [ ] Stats (date, vues, candidatures)
  - [ ] Boutons : Postuler, Sauvegarder, Partager
- [ ] Sections
  - [ ] Description complète
  - [ ] Responsabilités (liste)
  - [ ] Compétences requises (liste)
  - [ ] Nice to have (liste)
  - [ ] Compétences (tags)
  - [ ] Localisation détaillée
  - [ ] Rémunération
  - [ ] Bonus cooptation (si applicable)
  - [ ] Contact
- [ ] Bouton "Recommander quelqu'un" (si bonus cooptation)

### 3️⃣ Formulaire de Candidature (Modal)

**Checklist**
- [ ] Créer composant `ApplicationModal.tsx`
- [ ] Informations personnelles (pré-remplies)
  - [ ] Nom, email, téléphone
- [ ] Profil professionnel
  - [ ] Poste actuel, entreprise
- [ ] Documents
  - [ ] Upload CV (PDF, max 5MB)
  - [ ] Portfolio URL
  - [ ] LinkedIn URL
  - [ ] GitHub URL
- [ ] Lettre de motivation (textarea, min 100 caractères)
- [ ] Cooptation (optionnel)
  - [ ] Rechercher alumni recommandeur
- [ ] Boutons : Annuler, Envoyer candidature
- [ ] Validation formulaire
- [ ] Upload fichiers vers Firebase Storage
- [ ] Création document JobApplication dans Firestore

### 4️⃣ Mes Candidatures (`/my-applications`)

**Checklist**
- [ ] Créer composant `MyApplications.tsx`
- [ ] Onglets de filtrage
  - [ ] Toutes, En attente, En cours, Refusées
- [ ] Liste des candidatures
  - [ ] Titre offre + entreprise
  - [ ] Statut (badge coloré)
  - [ ] Date candidature + dernière mise à jour
  - [ ] Boutons : Voir détails, Retirer candidature
  - [ ] Historique des statuts (timeline)
  - [ ] Feedback recruteur (si disponible)
- [ ] Compteurs (total, par statut)

### 5️⃣ Créer une Offre (`/opportunities/create`)

**Checklist - Formulaire Multi-Étapes**
- [ ] Créer composant `CreateOpportunity.tsx`
- [ ] **Étape 1/4 : Informations de base**
  - [ ] Type d'opportunité (radio buttons)
  - [ ] Titre du poste
  - [ ] Entreprise
  - [ ] Upload logo entreprise
  - [ ] Bouton "Suivant"
- [ ] **Étape 2/4 : Description & Exigences**
  - [ ] Description (rich text editor)
  - [ ] Responsabilités (liste dynamique)
  - [ ] Compétences requises (liste dynamique)
  - [ ] Nice to have (liste dynamique)
  - [ ] Boutons : Précédent, Suivant
- [ ] **Étape 3/4 : Détails pratiques**
  - [ ] Localisation (ville, pays)
  - [ ] Télétravail/Hybride (checkboxes)
  - [ ] Type de contrat (select)
  - [ ] Durée (si CDD/Stage)
  - [ ] Date de début (date picker)
  - [ ] Rémunération (min, max, devise, période, négociable)
  - [ ] Niveau d'expérience (select)
  - [ ] Compétences techniques (tags)
  - [ ] Secteurs (tags)
  - [ ] Boutons : Précédent, Suivant
- [ ] **Étape 4/4 : Paramètres & Publication**
  - [ ] Visibilité (radio buttons)
  - [ ] Limite de candidatures (optionnel)
  - [ ] Date d'expiration (date picker)
  - [ ] Contact (email, téléphone)
  - [ ] URL candidature externe (optionnel)
  - [ ] Bonus cooptation (montant, devise, description)
  - [ ] Boutons : Précédent, Sauvegarder brouillon, Publier
- [ ] Validation à chaque étape
- [ ] Indicateur de progression (1/4, 2/4, etc.)
- [ ] Sauvegarde automatique (brouillon)

### 6️⃣ Gestion des Candidatures (`/opportunities/:id/applications`)

**Checklist**
- [ ] Créer composant `ManageApplications.tsx` (pour recruteurs)
- [ ] Header avec titre de l'offre
- [ ] Onglets de filtrage
  - [ ] Toutes, En attente, Présélectionnés, Entretien, Refusées
- [ ] Tri (plus récent, pertinence)
- [ ] Filtres (compétences)
- [ ] Liste des candidatures (cards)
  - [ ] Photo + nom candidat
  - [ ] Poste actuel + entreprise
  - [ ] Promo + localisation
  - [ ] Compétences (tags)
  - [ ] Date candidature
  - [ ] Badge "Recommandé par" (si cooptation)
  - [ ] Boutons : Voir CV, Voir profil, Contacter
  - [ ] Dropdown changement de statut
  - [ ] Textarea notes internes
  - [ ] Bouton "Envoyer feedback au candidat"
- [ ] Compteurs par statut

### 7️⃣ Système de Cooptation

**Checklist**
- [ ] Créer composant `ReferralModal.tsx`
  - [ ] Affichage offre + bonus
  - [ ] Recherche candidat (annuaire alumni)
  - [ ] Ou invitation par email
  - [ ] Textarea note de recommandation
  - [ ] Message d'information
  - [ ] Boutons : Annuler, Envoyer recommandation
  - [ ] Envoi notification au candidat
  - [ ] Création lien candidature avec référence

- [ ] Créer page `MyReferrals.tsx` (`/my-referrals`)
  - [ ] Stats globales
    - [ ] Total recommandations
    - [ ] Candidats recrutés
    - [ ] Bonus gagnés
  - [ ] Liste des cooptations
    - [ ] Candidat + offre
    - [ ] Date recommandation
    - [ ] Statut (en cours, recruté, refusé)
    - [ ] Bonus (potentiel ou versé)
  - [ ] Filtres par statut

### 8️⃣ Alertes Emploi (`/job-alerts`)

**Checklist**
- [ ] Créer composant `JobAlerts.tsx`
- [ ] Bouton "Créer nouvelle alerte"
- [ ] Liste des alertes
  - [ ] Nom/description de l'alerte
  - [ ] Critères affichés
  - [ ] Fréquence
  - [ ] Dernière notification
  - [ ] Nouvelles offres
  - [ ] Statut (actif/désactivé)
  - [ ] Boutons : Modifier, Activer/Désactiver, Supprimer
- [ ] Modal création/édition alerte
  - [ ] Mots-clés (tags)
  - [ ] Types d'opportunité (checkboxes)
  - [ ] Secteurs (multi-select)
  - [ ] Compétences (tags)
  - [ ] Localisations (tags)
  - [ ] Télétravail (checkbox)
  - [ ] Salaire minimum
  - [ ] Niveau d'expérience (checkboxes)
  - [ ] Fréquence (radio buttons)
  - [ ] Boutons : Annuler, Sauvegarder

---

## 🔧 FONCTIONNALITÉS TECHNIQUES

### 1️⃣ Recherche & Filtrage

**Checklist**
- [ ] Implémenter moteur de recherche
  - [ ] Full-text search (titre, description, compétences)
  - [ ] Filtres combinés (type, secteur, localisation, salaire, etc.)
  - [ ] Tri (plus récent, salaire, pertinence)
  - [ ] Pagination (20 offres/page)
  - [ ] Index Firestore optimisés

- [ ] Algorithme de matching
  - [ ] Score de pertinence basé sur :
    - [ ] Compétences profil vs compétences requises
    - [ ] Localisation préférée vs localisation offre
    - [ ] Niveau d'expérience
    - [ ] Secteurs d'intérêt
  - [ ] Recommandations personnalisées

### 2️⃣ Notifications

**Checklist**
- [ ] Système de notifications
  - [ ] Événements déclencheurs :
    - [ ] Nouvelle offre correspondant aux alertes
    - [ ] Candidature reçue (pour recruteur)
    - [ ] Changement de statut candidature
    - [ ] Cooptation acceptée/refusée
    - [ ] Offre bientôt expirée
    - [ ] Bonus cooptation versé
  - [ ] Canaux :
    - [ ] In-app (badge notification)
    - [ ] Email (EmailJS)
    - [ ] Push (si PWA activée)
  - [ ] Templates d'emails
  - [ ] Préférences utilisateur (fréquence, canaux)

### 3️⃣ Analytics

**Checklist**
- [ ] Analytics pour recruteurs
  - [ ] Vues de l'offre
  - [ ] Taux de conversion (vues → candidatures)
  - [ ] Temps moyen de réponse
  - [ ] Source des candidatures (direct, cooptation, alerte)
  - [ ] Dashboard recruteur

- [ ] Analytics pour candidats
  - [ ] Taux de réponse aux candidatures
  - [ ] Temps moyen avant réponse
  - [ ] Offres sauvegardées vs candidatures envoyées
  - [ ] Dashboard candidat

- [ ] Analytics pour admins
  - [ ] Offres les plus populaires
  - [ ] Secteurs les plus actifs
  - [ ] Taux de placement
  - [ ] ROI des cooptations
  - [ ] Statistiques globales

### 4️⃣ Sécurité & Permissions

**Checklist**
- [ ] Règles Firestore
  - [ ] User : Consulter offres, postuler, créer alertes
  - [ ] Alumni : + Publier offres, gérer candidatures, coopter
  - [ ] Editor : + Modérer offres, statistiques
  - [ ] Admin : + Mettre en avant offres, analytics complet
  - [ ] Seul créateur peut modifier/supprimer son offre
  - [ ] Seul candidat voit ses candidatures
  - [ ] Seul recruteur voit candidatures à ses offres

- [ ] Validation des données
  - [ ] Validation côté client (formulaires)
  - [ ] Validation côté serveur (Cloud Functions)
  - [ ] Sanitization des inputs
  - [ ] Limite taille fichiers (CV max 5MB)

### 5️⃣ Intégrations

**Checklist**
- [ ] Import/Parse CV
  - [ ] Parse automatique du CV (nom, email, compétences)
  - [ ] Extraction des compétences techniques
  - [ ] Pré-remplissage du formulaire
  - [ ] Bibliothèque de parsing (pdf-parse, etc.)

- [ ] Export données
  - [ ] Export candidatures en CSV
  - [ ] Export candidatures en Excel
  - [ ] Export analytics en PDF
  - [ ] Génération rapports

- [ ] Partage
  - [ ] Lien direct vers offre
  - [ ] Partage sur LinkedIn
  - [ ] Partage sur Twitter
  - [ ] QR Code pour offre
  - [ ] Embed offre (iframe)

- [ ] Storage Firebase
  - [ ] Upload CV (PDF)
  - [ ] Upload logo entreprise (PNG/JPG)
  - [ ] Organisation par dossiers (cvs/, logos/)
  - [ ] Nettoyage fichiers orphelins

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Checklist KPIs
- [ ] Définir KPIs
  - **Engagement**
    - [ ] Nombre d'offres publiées/mois
    - [ ] Nombre de candidatures/mois
    - [ ] Taux de conversion (vues → candidatures)
    - [ ] Temps moyen de réponse recruteur
  - **Qualité**
    - [ ] Taux de placement (candidatures → recrutements)
    - [ ] Satisfaction candidats (feedback)
    - [ ] Satisfaction recruteurs (feedback)
    - [ ] Taux de cooptation réussie
  - **Croissance**
    - [ ] Nouveaux recruteurs/mois
    - [ ] Nouveaux candidats actifs/mois
    - [ ] Offres actives
    - [ ] Secteurs représentés

- [ ] Implémenter tracking
  - [ ] Firebase Analytics
  - [ ] Vercel Analytics
  - [ ] Custom events
  - [ ] Dashboards de suivi

---

## 🚀 ROADMAP DE DÉVELOPPEMENT

### Phase 2.1 : MVP (4-6 semaines)

#### Semaine 1-2 : Structure de données & Backend
- [ ] Créer interfaces TypeScript (JobOpportunity, JobApplication, JobAlert)
- [ ] Configurer collections Firestore
- [ ] Définir règles de sécurité Firestore
- [ ] Créer services Firebase (opportunitiesService.ts, applicationsService.ts)
- [ ] Implémenter CRUD opportunités
- [ ] Implémenter CRUD candidatures

#### Semaine 3-4 : Interfaces principales
- [ ] Page liste opportunités (`OpportunitiesPage.tsx`)
- [ ] Filtres de base (type, secteur, localisation)
- [ ] Page détails offre (`OpportunityDetails.tsx`)
- [ ] Formulaire candidature simple (`ApplicationModal.tsx`)
- [ ] Page "Mes candidatures" (`MyApplications.tsx`)

#### Semaine 5-6 : Création offres & Notifications
- [ ] Formulaire création offre basique (`CreateOpportunity.tsx`)
- [ ] Upload logo entreprise (Firebase Storage)
- [ ] Notifications email basiques (EmailJS)
- [ ] Tests & corrections bugs
- [ ] Documentation

### Phase 2.2 : Fonctionnalités Avancées (3-4 semaines)

#### Semaine 7-8 : Cooptation
- [ ] Système de cooptation complet
- [ ] Modal recommandation (`ReferralModal.tsx`)
- [ ] Page "Mes cooptations" (`MyReferrals.tsx`)
- [ ] Tracking bonus cooptation
- [ ] Notifications cooptation

#### Semaine 9-10 : Alertes & Gestion
- [ ] Système d'alertes emploi (`JobAlerts.tsx`)
- [ ] Matching offres ↔ alertes
- [ ] Envoi notifications alertes (cron job)
- [ ] Gestion candidatures recruteur (`ManageApplications.tsx`)
- [ ] Statuts & historique candidatures
- [ ] Feedback candidats

#### Semaine 11 : Analytics
- [ ] Analytics de base (vues, clics, candidatures)
- [ ] Dashboard recruteur
- [ ] Dashboard candidat
- [ ] Statistiques globales (admin)

### Phase 2.3 : Optimisations (2-3 semaines)

#### Semaine 12-13 : Features avancées
- [ ] Import/parse CV automatique
- [ ] Recherche avancée (full-text)
- [ ] Algorithme de matching
- [ ] Recommandations personnalisées
- [ ] Export données (CSV, Excel, PDF)

#### Semaine 14 : UX & Mobile
- [ ] Notifications push (PWA)
- [ ] Partage social (LinkedIn, Twitter)
- [ ] QR Code offres
- [ ] Responsive mobile
- [ ] Optimisations performance

### Phase 2.4 : Intelligence (3-4 semaines)

#### Semaine 15-16 : IA & Recommandations
- [ ] Recommandations IA (offres pour candidat)
- [ ] Suggestions candidats (pour recruteur)
- [ ] Auto-complétion compétences
- [ ] Matching intelligent

#### Semaine 17-18 : Analytics avancés & Tests
- [ ] Analytics avancés
- [ ] A/B testing offres
- [ ] Tests utilisateurs
- [ ] Optimisations finales
- [ ] Documentation complète

---

## 📝 NOTES D'IMPLÉMENTATION

### Stack Technique
- [ ] React Hook Form pour tous les formulaires
- [ ] Implémenter validation avec Zod
- [ ] Utiliser Lucide React pour les icônes
- [ ] Composants réutilisables (Card, Badge, Modal, etc.)
- [ ] Gestion d'état avec Context API ou Zustand
- [ ] Optimisation images (lazy loading, compression)
- [ ] SEO (meta tags, sitemap)
- [ ] Accessibilité (ARIA labels, keyboard navigation)
- [ ] Tests unitaires (Vitest)
- [ ] Tests E2E (Playwright)

### Fichiers à Créer

**Types**
- [ ] `src/types/opportunities.ts` (JobOpportunity, JobApplication, JobAlert)

**Services**
- [ ] `src/services/opportunitiesService.ts`
- [ ] `src/services/applicationsService.ts`
- [ ] `src/services/alertsService.ts`

**Pages**
- [ ] `src/pages/opportunities/OpportunitiesPage.tsx`
- [ ] `src/pages/opportunities/OpportunityDetails.tsx`
- [ ] `src/pages/opportunities/CreateOpportunity.tsx`
- [ ] `src/pages/opportunities/MyApplications.tsx`
- [ ] `src/pages/opportunities/ManageApplications.tsx`
- [ ] `src/pages/opportunities/MyReferrals.tsx`
- [ ] `src/pages/opportunities/JobAlerts.tsx`

**Composants**
- [ ] `src/components/opportunities/ApplicationModal.tsx`
- [ ] `src/components/opportunities/ReferralModal.tsx`
- [ ] `src/components/opportunities/OpportunityCard.tsx`
- [ ] `src/components/opportunities/ApplicationCard.tsx`
- [ ] `src/components/opportunities/OpportunityFilters.tsx`

**Utilitaires**
- [ ] `src/utils/cvParser.ts`
- [ ] `src/utils/matchingAlgorithm.ts`

---

## 🎨 DESIGN SYSTEM

### Couleurs par Type d'Opportunité
- **Emploi (CDI/CDD)** : Bleu (#3B82F6)
- **Stage** : Vert (#10B981)
- **Alternance** : Violet (#8B5CF6)
- **Mission/Freelance** : Orange (#F59E0B)
- **Partenariat** : Rose (#EC4899)

### Couleurs par Statut Candidature
- **Pending** : Gris (#6B7280)
- **Reviewed** : Bleu (#3B82F6)
- **Shortlisted** : Jaune (#F59E0B)
- **Interview** : Violet (#8B5CF6)
- **Rejected** : Rouge (#EF4444)
- **Accepted** : Vert (#10B981)

### Icônes (Lucide React)
- **Opportunités** : Briefcase
- **Candidatures** : FileText
- **Cooptation** : Users
- **Alertes** : Bell
- **Filtres** : Filter
- **Recherche** : Search
- **Upload CV** : Upload
- **Localisation** : MapPin
- **Salaire** : DollarSign
- **Compétences** : Code

---

**Date de création** : 8 décembre 2024  
**Dernière mise à jour** : 8 décembre 2024  
**Statut** : En planification
