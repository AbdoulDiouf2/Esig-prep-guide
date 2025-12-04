# Phase 1 : Annuaire Alumni - Architecture et Flux de Données

## 📋 Vue d'ensemble

Créer un annuaire alumni flexible et ouvert permettant aux alumni de se présenter (profil riche : bio, secteurs, expertise, portfolio, services, réseaux sociaux) et de se connecter entre eux.

## 🔄 Flux d'inscription

### Nouveaux utilisateurs

```
1. Inscription (Register.tsx)
   ├─ Étape 1 : Email, mot de passe, nom, année promo (obligatoire)
   ├─ Étape 2 : "Êtes-vous entrepreneur/alumni ?" (Oui/Non)
   │   ├─ Si NON → Compte basique créé → /applications
   │   └─ Si OUI → Étape 3
   ├─ Étape 3 : Infos entrepreneur (entreprise, secteur, etc.)
   └─ Étape 4 : Résumé → Création compte + profil alumni (status: pending)

2. Après inscription
   └─ Redirection /applications
       └─ Notification : "Ton profil est en attente de validation"
```

### Utilisateurs existants (Migration)

```
1. Login utilisateur existant
   ├─ Middleware détecte : pas de yearPromo
   └─ Redirection /complete-profile

2. CompleteUserProfile.tsx
   ├─ Formulaire : Année de promotion (obligatoire)
   ├─ Question : "Veux-tu créer ton profil alumni ?"
   │   ├─ Si NON → Sauvegarder yearPromo → /applications
   │   └─ Si OUI → /complete-alumni-profile
   └─ Profil complété (profileComplete = true)
```

## 📊 Modèle de données

### AppUser (existant + ajouts)

```typescript
interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'editor' | 'admin' | 'superadmin';
  
  // NOUVEAUX CHAMPS
  yearPromo?: number;              // Année de sortie de prépa
  profileComplete?: boolean;       // Flag de migration
  hasAlumniProfile?: boolean;      // A un profil alumni
  
  // ... autres champs existants
}
```

### AlumniProfile (nouveau)

```typescript
interface AlumniProfile {
  // Infos de base (OBLIGATOIRES)
  uid: string;
  name: string;
  email: string;
  yearPromo: number;
  
  // Profil professionnel (OPTIONNELS)
  headline?: string;              // "Développeur React | Startup Founder"
  bio?: string;                   // Description détaillée
  photo?: string;                 // URL photo (Firebase Storage)
  
  // Secteurs & Expertise (FLEXIBLES)
  sectors: string[];              // ["Tech", "Startup", "Finance"]
  expertise: string[];            // Tags libres ["React", "Node.js", "Levée de fonds"]
  
  // Professionnel
  company?: string;
  position?: string;
  companyDescription?: string;
  website?: string;
  
  // Portfolio (FLEXIBLE)
  portfolio?: {
    title: string;
    description: string;
    url?: string;
    image?: string;
  }[];
  
  // Services offerts (FLEXIBLE)
  services?: {
    name: string;
    description: string;
    category: string;
  }[];
  
  // "Je cherche / Je propose" (NOUVEAU)
  seeking?: string[];             // ["Collaborateur", "Mentor", "Opportunité"]
  offering?: string[];            // ["Conseil", "Mentorat", "Service"]
  
  // Réseaux sociaux
  linkedin?: string;
  github?: string;
  twitter?: string;
  
  // Localisation
  city?: string;
  country?: string;
  
  // Métadonnées
  status: 'pending' | 'approved' | 'rejected';
  dateCreated: Timestamp;
  dateUpdated?: Timestamp;
  dateValidation?: Timestamp;
  validatedBy?: string;           // UID admin
  rejectionReason?: string;
}
```

### ContactRequest (nouveau)

```typescript
interface ContactRequest {
  id: string;
  fromUid: string;                // Qui demande
  fromName: string;
  fromEmail: string;
  toUid: string;                  // Qui reçoit
  toName: string;
  toEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  dateCreated: Timestamp;
}
```

## 🗂️ Collections Firestore

```
/users/{uid}                     // AppUser (existant)
/alumni/{uid}                    // AlumniProfile (nouveau)
/contactRequests/{requestId}     // ContactRequest (nouveau)
```

## 🔐 Règles de sécurité Firestore

```javascript
// Collection alumni
match /alumni/{alumniId} {
  // Lecture : tout le monde peut voir les profils approuvés
  allow read: if resource.data.status == 'approved';
  
  // Lecture : l'alumni peut voir son propre profil (tous statuts)
  allow read: if request.auth.uid == alumniId;
  
  // Lecture : les admins peuvent tout voir
  allow read: if request.auth.token.role in ['admin', 'superadmin'];
  
  // Écriture : l'alumni peut créer/modifier son propre profil
  allow create, update: if request.auth.uid == alumniId;
  
  // Écriture : les admins peuvent tout modifier (validation)
  allow update: if request.auth.token.role in ['admin', 'superadmin'];
}

// Collection contactRequests
match /contactRequests/{requestId} {
  // Lecture : l'expéditeur ou le destinataire
  allow read: if request.auth.uid == resource.data.fromUid 
              || request.auth.uid == resource.data.toUid;
  
  // Écriture : l'expéditeur peut créer
  allow create: if request.auth.uid == request.resource.data.fromUid;
}
```

## 🎨 Statuts de profil alumni

| Statut | Description | Visible dans annuaire | Actions possibles |
|--------|-------------|----------------------|-------------------|
| `pending` | En attente de validation admin | ❌ Non | Admin peut approuver/rejeter |
| `approved` | Validé par admin | ✅ Oui | Alumni peut éditer (repasse à pending si majeur) |
| `rejected` | Rejeté par admin | ❌ Non | Alumni peut voir raison + re-soumettre |

## 🔄 Workflow de validation

```
1. Alumni crée/modifie son profil
   └─ Status = pending

2. Admin voit la liste des profils pending
   └─ AdminAlumniValidation.tsx

3. Admin examine le profil
   ├─ Option A : Approuver
   │   ├─ Status = approved
   │   ├─ dateValidation = now
   │   ├─ validatedBy = adminUid
   │   └─ Email : "Ton profil est maintenant visible !"
   │
   └─ Option B : Rejeter
       ├─ Status = rejected
       ├─ rejectionReason = "..."
       └─ Email : "Ton profil a été rejeté : [raison]"

4. Alumni voit son statut
   └─ MyAlumniProfile.tsx
       ├─ Si approved : "Ton profil est visible"
       ├─ Si pending : "En attente de validation (X jours)"
       └─ Si rejected : "Rejeté : [raison]" + bouton "Modifier"
```

## 🔍 Recherche et filtrage

### Recherche full-text

```typescript
// Champs indexés pour la recherche
searchableFields = [
  'name',
  'headline',
  'bio',
  'company',
  'sectors',
  'expertise'
]
```

### Filtres disponibles

- **Secteur** : multi-select (Tech, Finance, Design, etc.)
- **Expertise** : multi-select avec autocomplete
- **Année de promo** : range slider (2020-2030)
- **Localisation** : multi-select (city, country)
- **Type d'aide** : "Je cherche" / "Je propose"
- **Services offerts** : si applicable

### Tri

- Par nom (A-Z)
- Par date de création (plus récent)
- Par pertinence (recherche)

## 📁 Structure des fichiers

```
src/
├── types/
│   └── alumni.ts                    # AlumniProfile, ContactRequest
├── services/
│   ├── alumniService.ts             # CRUD alumni
│   └── contactService.ts            # Gestion demandes de contact
├── contexts/
│   └── AuthContext.tsx              # Ajout middleware migration
├── pages/
│   ├── Register.tsx                 # Multi-étapes (modifié)
│   ├── CompleteUserProfile.tsx      # Migration utilisateurs existants
│   ├── CompleteAlumniProfile.tsx    # Complétion profil alumni
│   ├── EditAlumniProfile.tsx        # Édition profil alumni
│   ├── MyAlumniProfile.tsx          # Vue profil personnel + statut
│   ├── AlumniDirectory.tsx          # Annuaire public
│   ├── AlumniDetail.tsx             # Détail profil alumni
│   └── admin/
│       └── AdminAlumniValidation.tsx # Validation admin
├── components/
│   ├── forms/
│   │   └── MultiStepForm.tsx        # Formulaire multi-étapes réutilisable
│   └── alumni/
│       ├── AlumniProfileForm.tsx    # Formulaire profil alumni
│       ├── AlumniCard.tsx           # Carte profil
│       ├── AlumniFilters.tsx        # Sidebar filtres
│       ├── NewProfilesHighlight.tsx # Mise en avant nouveaux profils
│       └── ContactRequestForm.tsx   # Formulaire demande de contact
└── utils/
    └── exportService.ts             # Export CSV/PDF
```

## 🚀 Ordre d'implémentation

### Phase 1.0.1 : Inscription dynamique
1. MultiStepForm.tsx
2. Register.tsx (multi-étapes)
3. AuthContext.tsx (modification)

### Phase 1.0.2 : Migration utilisateurs
1. CompleteUserProfile.tsx
2. Middleware AuthContext.tsx

### Phase 1.1 : Modèle de données
1. types/alumni.ts
2. services/alumniService.ts
3. Règles Firestore

### Phase 1.2 : Interface profil
1. AlumniProfileForm.tsx
2. CompleteAlumniProfile.tsx
3. EditAlumniProfile.tsx
4. MyAlumniProfile.tsx

### Phase 1.3 : Annuaire public
1. AlumniDirectory.tsx
2. AlumniCard.tsx
3. AlumniFilters.tsx
4. AlumniDetail.tsx

### Phase 1.4 : Validation admin
1. AdminAlumniValidation.tsx
2. Fonctions approve/reject

### Phase 1.5 : Stats & export
1. AlumniStats.tsx
2. exportService.ts

### Phase 1.6 : UX & Quick Wins
1. NewProfilesHighlight.tsx
2. ContactRequestForm.tsx
3. Copy & promesses
4. Notifications

## 📝 Notes importantes

- **Année de promotion** = Année de sortie de prépa (fin 2ème année)
- **Migration** : Tous les utilisateurs existants doivent compléter leur profil
- **Validation** : Obligatoire pour apparaître dans l'annuaire
- **Flexibilité** : Champs optionnels, tags libres, pas de catégories fermées
