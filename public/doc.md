# Documentation Officielle – ESIG-prep-guide

**Version :** Décembre 2025  
**Scopé :** Plateforme Multi-Modules (Étudiants CPS, Alumni, Admin, Éditeur)

---

## Vision Globale

**ESIG-prep-guide** est une plateforme multi-modules conçue pour centraliser les outils et ressources destinés aux étudiants CPS et à la communauté Alumni de l'ESIGELEC. Elle ambitionne de devenir un écosystème complet, fédérant étudiants et alumni autour de quatre axes majeurs : accompagnement du parcours, réseau professionnel, mentorat, et opportunités de croissance (carrière, entrepreneuriat, solidarité).

### Architecture Plateforme

La plateforme s'organise autour d'un **Centre d'applications** centralisé qui agrège plusieurs modules :

- **Volet Étudiants CPS** (actuellement disponible) : Guide de préparation interactif, ressources, FAQ, forum, webinaires
- **Volet Alumni** (en développement progressif) : Annuaire, opportunités, mentorat, IA communautaire, événements
- **Interfaces d'Administration** : Gestion de contenu, utilisateurs, statistiques (Admin & Éditeur)
- **Fonctionnalités Transversales** : Authentification, profil, notifications, analytics, conformité légale

---

## Fonctionnalités Actuelles (Phase 0 - Refonte Plateforme)

### Centre d'Applications (Hub Plateforme)

- **Hub centralisé** regroupant tous les modules et fonctionnalités disponibles
- **Navigation intuitive** par catégories (Modules étudiants CPS, Administration, Édition, Outils, Fonctionnalités avancées)
- **Filtrage dynamique** selon le rôle de l'utilisateur (étudiant, éditeur, administrateur)
- **Affichage des modules futurs** avec statut "Bientôt disponible"
- **Point d'entrée par défaut** après authentification

### Authentification & Profil

- Connexion email/mot de passe, Google, GitHub
- Réinitialisation du mot de passe
- Profil personnalisable et vérification email
- Système de rôles multi-niveaux (utilisateur, éditeur, administrateur, super-administrateur)

### Module Étudiants CPS – Guide de Préparation

#### Tableau de Bord & Suivi
- Suivi de progression par phases (Post-CPS, During-Process, Pre-Arrival)
- Notifications de chat
- Navigation de parcours étudiant

#### Gestion de Contenu Interactif
- Guides interactifs, cases à cocher, champs typés
- Sauvegarde utilisateur automatique
- Ressources associées

#### Bibliothèque de Ressources
- Organisation documentaire par phases
- Intégration Dropbox, téléchargement, prévisualisation

#### Ressources Académiques
- Liens vers cours, TD, TP
- Filtrage par année, département, spécialisation

#### Système de FAQ
- Organisation thématique, soumission et suivi de questions
- Filtrage des FAQ, vue personnalisée

#### Forum Communautaire
- Catégorisation, threads et réponses
- Modération du forum

#### Webinaires et Ateliers
- Gestion, proposition et suivi d'ateliers/webinaires

#### Chat & Communication
- Chat utilisateurs-admin, chat IA (admin)

#### Feedback & Support
- Formulaire feedback, gestion par les admins
- Tutoriels et page d'aide

### Interfaces Administratives (Admin/Éditeur)

- **Tableau de bord administrateur** avec statistiques et activités récentes
- **Gestion de contenu** (FAQ, ressources, sections de guide)
- **Gestionnaire Dropbox** intégré pour les fichiers
- **Gestion des utilisateurs** avec promotion/rétrogradation des rôles
- **Tableau de bord éditeur** pour les rôles d'édition (sans accès aux données sensibles)
- **Broadcast email** pour les communications de masse
- **Statistiques & logs** pour le suivi des activités

### Pages Légales & Conformité

- CGU, RGPD, mentions légales, disclaimer
- Système de consentement conforme au RGPD
- Registre RGPD accessible aux administrateurs

### Autres Fonctionnalités Transversales

- Page d'accueil (homepage) présentant la plateforme multi-modules
- Gestion des notifications
- Analytics (Firebase Analytics)
- Gestion des erreurs 404
- Navigation responsive (Desktop & Mobile)

---

## Fonctionnalités à Venir Confirmées (Phases 1-3 & Évolutions)

### Phase 1 : Annuaire des Entrepreneurs (Alumni)

- Création/gestion de fiches alumni, validation admin
- Recherche avancée et filtrage multiple (secteur, localisation, année promo)
- Export des données, statistiques, rapport
- Profils enrichis alumni (certifications, diplômes, projets)
- Système de réputation/badges

### Phase 2 : Opportunités Business & Emploi + Mentorat & Networking

#### Module Opportunités Business & Emploi
- Offres d'emploi et partenariats B2B
- Système de candidatures directes, suivi, cooptation
- Agrégation d'offres externes (LinkedIn, Welcome to the Jungle, etc.)
- Alertes IA personnalisées

#### Espace Mentorat & Networking
- Matching étudiants ↔ alumni basé sur intérêts
- Calendrier, planification, feedback de mentorat
- Événements de networking virtuel/physique
- Système de buddy pour l'expatriation

#### Connexion Événements & Initiatives
- Calendrier centralisé, gestion des inscriptions
- Suivi d'événements, historique, statistiques

### Phase 3 : Intelligence Artificielle Communautaire & Avancées

#### Intelligence Artificielle Communautaire
- Chatbot IA : recherche de profils, recommandations
- Analyse prédictive et automation (notifications, rappels, suggestions)
- Vérification et optimisation de CV via IA
- Gestion intelligente des recommandations LinkedIn

#### Gestion Avancée de la Communauté
- Groupes thématiques, notifications intelligentes
- Skill matrix & mapping dynamique des compétences
- Micro-certifications et badges internes
- Système de réputation avancé

#### Analytics & Reporting Avancés
- Tableaux de bord détaillés, rapports personnalisés
- Export statistiques, dashboards interactifs

### Améliorations Techniques & Infrastructure (Transversales)

- Scalabilité, recherche full-text, sécurité 2FA, API externe
- Application mobile (iOS, Android, PWA), notifications push
- Internationalisation (FR/EN/AR), fuseaux horaires, devises, localisation
- Gamification (points, badges, défis)
- Systèmes de recommandations avancés
- Parrainage et referral alumni

---

## Suggestions Fonctionnelles Avancées pour ESIG-prep-guide

### Plateforme de gestion des recommandations écrites et témoignages

Permettre aux membres de demander, rédiger et afficher des recommandations personnelles (alumni, employeurs, enseignants, mentors) visibles sur leur profil, valorisant ainsi leur parcours à la manière de LinkedIn.

### Place de marché de services entre alumni

Créer une marketplace interne où les alumni peuvent proposer ou rechercher des services professionnels ou entraide : missions freelances, relectures de CV, coaching, traduction, conseils spécialisés, etc.

### Module d’aide à la mobilité internationale

Outils et guides interactifs rédigés par les alumni pour accompagner ceux qui partent à l’étranger : trouver un logement, gérer les démarches, accéder à des assurances, développer un réseau local, ou activer un système de buddy pour nouveaux arrivants.

### Table ronde vidéo/café virtuel aléatoire

Fonction permettant d’organiser des rencontres vidéo aléatoires (“café virtuel”) entre alumni/étudiants pour élargir son réseau et échanger en petit groupe, renforçant le brassage inter-promos ou inter-sectoriel.

### Centre d’échange de matériel et bons plans

Espace d’annonces dédié à la vente ou don de matériels d’occasion (livres, matériel informatique), au partage de logements de courte durée, ou à la diffusion de bons plans utiles à la communauté.

### Outils de job hunting avancés (alertes IA externes)

Module agrégeant des offres d’emploi issues de portails externes (LinkedIn, Welcome to the Jungle, etc.), avec alertes personnalisées pilotées par IA et suggestion automatique de candidatures.

### Portefeuille de projets open source communautaires

Espace où chacun peut publier, proposer ou contribuer à des projets open source, organiser des hackathons, lancer des appels à compétences, et suivre les contributions via la plateforme.

### Bibliothèque vidéo d’expériences et retours d’alumni

Plateforme d’hébergement de mini-vidéos “micro-learning” où les alumni partagent en 2 minutes leur parcours, conseils ou expériences pays/métiers.

### Gestion intelligente des recommandations/références LinkedIn

Outil pour automatiser l’envoi de demandes de recommandations LinkedIn ou d’endorsements directement via la plateforme afin d’accroître la visibilité collective de la promo/club.

### Vérification et optimisation de CV via IA ou par alumni-mentor

Système d’analyse automatique (et/ou par mentor) pour corriger, améliorer et valoriser le CV des membres, avec retours personnalisés et comparatifs sectoriels.

### Partage d’offres “alumni only” (logement, services, avantages exclusifs)

Annuaire spécial d’offres réservées à la communauté alumni, incluant logements, avantages professionnels négociés, codes promo, services de relocation, etc.

### Carte interactive mondiale des alumni et “buddy system”

Carte mondiale indiquant la localisation des alumni, avec activation possible d’un système d’entraide à l’expatriation (buddy), notamment pour faciliter l’intégration à l’étranger.

### Skill matrix & mapping dynamique des compétences

Visualisation des compétences présentes dans la communauté et outil de constitution rapide d’équipes projet (hackathons, challenges, missions bénévoles).

### Micro-certifications et badges internes

Distribution de badges ou micro-certifications internes pour reconnaître la participation à des projets, formations internes, mentoring, ou défis lancés sur la plateforme.

### Bibliothèque podcasts/témoignages vidéo alumni

Collection de contenus audio ou vidéo produits par les alumni témoignant de leurs parcours, de leur secteur ou de leur vie à l’international.

### Coaching carrière/entrepreneuriat externe validé

Accès à du coaching carrière, orientation, ou entrepreneuriat assuré par des spécialistes ou alumni volontaires, avec validation par l’administration.

### Donation et levée de fonds à l’association alumni

Outil intégré pour faire un don ou participer à des campagnes de financement associatif, avec historique et suivi des dons.

### Consultation participative et roadmap publique

Module permettant à la communauté de voter ou suggérer l’évolution des fonctionnalités, avec roadmap publique pour une gestion participative et transparente.

### Marketplace publique d’API pour automatisations

Place de marché interne pour partager des API développées par la communauté favorisant l’automatisation (emploi, matching, notifications push...).

### Portefeuille associatif & suivi historique engagement

Section retraçant l’historique et l’engagement dans les activités associatives et événements pour chaque membre, valorisable sur le profil.

### Bibliothèque d’offres de stages/emplois passés avec évaluations anonymes

Accès à une base d’offres de stages/emplois historiques, enrichie d’évaluations anonymes pour orienter les nouveaux candidats.
