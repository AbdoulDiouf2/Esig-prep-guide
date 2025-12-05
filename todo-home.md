# 🚀 TODO - Refonte Page Home (CPS Connect Alumni)

## 📋 Vue d'ensemble

Transformer la page Home de "ESIG-prep-guide" (focus CPS → ESIGELEC) vers "CPS Connect Alumni" (communauté CPS élargie : étudiants + alumni toutes écoles).

---

## ✅ PHASE 1 : Hero Section ✅ COMPLÉTÉE

### Objectif

Présenter clairement la double cible (étudiants CPS + alumni toutes écoles) avec un message inclusif.

### Tâches

- [x] **Titre principal** : "CPS Connect Alumni - La communauté qui réunit étudiants CPS et alumni"
- [x] **Sous-titre** : "Que tu sois en prépa, à l'ESIGELEC ou ailleurs en France, connecte-toi avec des alumni du parcours CPS pour du mentorat, des opportunités et du networking"
- [x] **Image hero** : Garder l'image actuelle ou trouver une image plus communautaire
- [x] **CTA différenciés** :
  - Bouton 1 : "Je suis étudiant CPS" → /register ou /applications (si connecté)
  - Bouton 2 : "Je suis alumni" → /register (avec indication type alumni)
- [x] **Animation d'entrée** : Garder le fade-in actuel

### Fichiers impactés

- `src/pages/Home.tsx` (lignes 18-65)

---

## ✅ PHASE 2 : Features Section (4 cartes) ✅ COMPLÉTÉE

### Objectif

Présenter les 4 piliers de la plateforme de manière équilibrée (étudiants + alumni).

### Tâches

- [x] **Carte 1 : Guides & Ressources** 
  - Icône : `Book` ou `FileText`
  - Titre : "Guides & Ressources"
  - Description : "Démarches administratives, ressources académiques et guides de vie en France pour tous les étudiants CPS"

- [x] **Carte 2 : Annuaire Alumni**
  - Icône : `Users` ou `Network`
  - Titre : "Annuaire Alumni"
  - Description : "Alumni des prépas CPS, ESIGELEC et autres écoles d'ingénieurs. Entrepreneurs, salariés, consultants de tous secteurs"

- [x] **Carte 3 : Mentorat & Networking**
  - Icône : `MessageCircle` ou `Handshake`
  - Titre : "Mentorat & Networking"
  - Description : "Trouve des mentors qui ont vécu le même parcours. Connecte-toi avec des alumni dans ton domaine"

- [x] **Carte 4 : Opportunités**
  - Icône : `Briefcase` ou `TrendingUp`
  - Titre : "Opportunités"
  - Description : "Stages, projets, collaborations et offres d'emploi partagées par la communauté alumni"

### Fichiers impactés

- `src/pages/Home.tsx` (lignes 68-133)

---

## ✅ PHASE 3 : Section "Qui peut rejoindre ?" ✅ COMPLÉTÉE

### Objectif

Clarifier explicitement qui peut utiliser la plateforme (lever toute ambiguïté).

### Tâches

- [x] **Créer nouvelle section** après Features
- [x] **Titre** : "Qui peut rejoindre CPS Connect Alumni ?"
- [x] **2 colonnes** :
  - Colonne 1 : "Pour les étudiants CPS"
    - Tu es actuellement en prépa CPS
    - Tu prépares ton départ pour la France
    - Tu cherches des conseils et du mentorat
  - Colonne 2 : "Pour les alumni"
    - Tu as fait les CPS (Dakar ou ailleurs)
    - Tu es à l'ESIGELEC, dans une autre école, ou déjà diplômé
    - Tu veux partager ton expérience et ton réseau
- [x] **Design** : 2 cartes côte à côte (responsive : stack sur mobile)
- [x] **Icônes** : `GraduationCap` pour étudiants, `Award` pour alumni

### Fichiers impactés

- `src/pages/Home.tsx` (nouvelle section après ligne 133)

---

## ✅ PHASE 4 : Section "Comment ça marche ?" ✅ COMPLÉTÉE

### Objectif

Expliquer les parcours utilisateurs (étudiants vs alumni) en 4 étapes simples.

### Tâches

- [x] **Remplacer** l'ancienne section "Les trois phases de votre parcours" (lignes 136-251)
- [x] **Titre** : "Comment ça marche ?"
- [x] **2 parcours en parallèle** :

  **Parcours Étudiant CPS :**
  1. Inscription → Accède aux guides et ressources
  2. Explore → Ressources académiques et administratives
  3. Connecte → Trouve des alumni mentors (toutes écoles)
  4. Participe → Forum, FAQ, événements

  **Parcours Alumni :**
  1. Inscription → Indique ton parcours (prépa + école)
  2. Profil → Partage ton expertise et ton secteur
  3. Validation → Profil vérifié et publié
  4. Engage → Mentorat, opportunités, networking

- [x] **Design** : Timeline verticale ou cartes numérotées
- [x] **Responsive** : Stack sur mobile

### Fichiers impactés

- `src/pages/Home.tsx` (remplacer lignes 136-251)

---

## ✅ PHASE 5 : Section "Annuaire Alumni" (Aperçu) ✅ COMPLÉTÉE

### Objectif

Donner un aperçu visuel de l'annuaire alumni pour inciter à l'exploration.

### Tâches

- [x] **Créer nouvelle section** après "Comment ça marche ?"
- [x] **Titre** : "Découvre les alumni de la communauté CPS"
- [x] **Sous-titre** : "Des alumni de toutes les écoles, tous les secteurs, tous prêts à t'aider"
- [x] **Afficher 3-4 profils alumni** (mockup ou vrais profils si disponibles) :
  - Photo (ou avatar)
  - Nom
  - École (ESIGELEC, Centrale, INSA, etc.)
  - Secteur/Expertise
  - Badge "Disponible pour mentorat"
- [x] **Filtres visibles** (non fonctionnels, juste visuels) : Non implémentés (pas nécessaires pour l'aperçu)
- [x] **CTA** : "Découvrir tous les alumni" → /alumni-directory
- [x] **Design** : Grille de cartes avec hover effects

### Fichiers impactés

- `src/pages/Home.tsx` (nouvelle section)

---

## ✅ PHASE 6 : Section Stats (Optionnel mais impactant) ✅ COMPLÉTÉE

### Objectif

Montrer l'impact et la taille de la communauté avec des chiffres.

### Tâches

- [x] **Créer nouvelle section** (fond coloré, ex: bleu clair)
- [x] **Titre** : "La communauté CPS Connect en chiffres"
- [x] **4 stats en grille** :
  - 📚 **50+ étudiants CPS** actifs sur la plateforme
  - 🎓 **25+ alumni** de toutes les écoles dans l'annuaire
  - 🏫 **8+ écoles** représentées (ESIGELEC, Centrale, INSA, etc.)
  - 🤝 **30+ connexions** mentorat réalisées
- [x] **Animations** : Hover effects (counter animation non implémentée)
- [x] **Design** : 4 cartes avec gros chiffres + icônes

### Fichiers impactés

- `src/pages/Home.tsx` (nouvelle section)

### Notes

- Stats peuvent être hardcodées pour V1, puis dynamiques plus tard
- Si pas de vraies données, utiliser des chiffres réalistes (ex: 50 étudiants, 20 alumni, 5 écoles, 15 connexions)

---

## ✅ PHASE 7 : Section Témoignages (Optionnel)

### Objectif

Humaniser la plateforme avec des témoignages d'utilisateurs réels.

### Tâches

- [ ] **Créer nouvelle section** après Stats
- [ ] **Titre** : "Ce que dit la communauté"
- [ ] **3 témoignages** :
  - Témoignage 1 : Étudiant CPS qui a trouvé un mentor
  - Témoignage 2 : Alumni ESIGELEC qui aide des étudiants
  - Témoignage 3 : Alumni autre école (Centrale, INSA, etc.)
- [ ] **Format** : Photo + Citation + Nom + Statut (ex: "CPS Dakar 2024", "Alumni ESIGELEC 2020")
- [ ] **Design** : Cartes avec quotes, responsive

### Fichiers impactés

- `src/pages/Home.tsx` (nouvelle section)

### Notes

- Pour V1, utiliser des témoignages fictifs mais réalistes
- Plus tard, remplacer par de vrais témoignages

---

## ✅ PHASE 8 : Section CTA finale ✅ COMPLÉTÉE

### Objectif

Inciter à l'inscription avec un double CTA clair (étudiants + alumni).

### Tâches

- [x] **Modifier** la section CTA actuelle (lignes 270-304)
- [x] **Titre** : "Rejoins la communauté CPS Connect Alumni"
- [x] **Sous-titre** : "Que tu sois étudiant CPS ou alumni (ESIGELEC, Centrale, INSA, ou autre), cette plateforme est pour toi"
- [x] **2 CTA différenciés** :
  - Si non connecté :
    - Bouton 1 : "Commencer en tant qu'étudiant" → /register
    - Bouton 2 : "Rejoindre en tant qu'alumni" → /register
  - Si connecté :
    - Bouton unique : "Accéder au centre d'applications" → /applications
- [x] **Couleur** : Garder le gradient vert ou passer à bleu pour cohérence
- [x] **Design** : Centré, boutons côte à côte (stack sur mobile)

### Fichiers impactés

- `src/pages/Home.tsx` (lignes 270-304)

---

## ✅ PHASE 9 : Nettoyage & Optimisation

### Objectif

Supprimer les références à l'ancien concept et optimiser le code.

### Tâches

- [ ] **Supprimer** toutes les mentions "ESIG-prep-guide" → remplacer par "CPS Connect Alumni"
- [ ] **Supprimer** la section "Les trois phases de votre parcours" (déjà remplacée en Phase 4)
- [ ] **Garder** la section Feedback (lignes 254-267)
- [ ] **Garder** le logo slider (ligne 307)
- [ ] **Vérifier** tous les liens internes (s'assurer qu'ils pointent vers les bonnes routes)
- [ ] **Optimiser** les imports (supprimer icônes non utilisées)
- [ ] **Responsive** : Tester sur mobile, tablette, desktop
- [ ] **Accessibilité** : Vérifier alt texts, contrastes, navigation clavier

### Fichiers impactés

- `src/pages/Home.tsx` (ensemble du fichier)

---

## 📦 PHASE 10 : Tests & Validation

### Tâches

- [ ] **Test visuel** : Vérifier l'apparence sur différentes tailles d'écran
- [ ] **Test navigation** : Vérifier que tous les liens fonctionnent
- [ ] **Test performance** : Vérifier temps de chargement (images optimisées)
- [ ] **Test accessibilité** : Lighthouse audit
- [ ] **Validation contenu** : Relire tous les textes pour cohérence
- [ ] **Feedback utilisateur** : Montrer à quelqu'un de la cible (étudiant CPS ou alumni)

---

## 🎨 Assets nécessaires

### Images

- [ ] Image hero (communautaire, diverse) - optionnel si on garde l'actuelle
- [ ] Photos profils alumni pour section aperçu (3-4 photos) - peut être mockup
- [ ] Photos témoignages (3 photos) - peut être mockup

### Icônes (déjà disponibles via lucide-react)

- `Book`, `FileText` → Guides & Ressources
- `Users`, `Network` → Annuaire Alumni
- `MessageCircle`, `Handshake` → Mentorat
- `Briefcase`, `TrendingUp` → Opportunités
- `GraduationCap` → Étudiants
- `Award` → Alumni

---

## 🚀 Ordre d'implémentation recommandé

1. ✅ **Phase 1** : Hero Section (impact immédiat)
2. ✅ **Phase 2** : Features Section (clarifier l'offre)
3. ✅ **Phase 3** : "Qui peut rejoindre ?" (lever ambiguïtés)
4. ✅ **Phase 4** : "Comment ça marche ?" (expliquer parcours)
5. ✅ **Phase 8** : CTA finale (conversion)
6. ✅ **Phase 9** : Nettoyage (cohérence)
7. ⚠️ **Phase 5** : Aperçu annuaire (si données disponibles)
8. ⚠️ **Phase 6** : Stats (si chiffres disponibles)
9. ⚠️ **Phase 7** : Témoignages (nice-to-have)
10. ✅ **Phase 10** : Tests & Validation

---

## 📝 Notes importantes

### Ton & Voix

- **Inclusif** : Pas que ESIGELEC, TOUTES les écoles post-CPS
- **Communautaire** : Accent sur l'entraide et le partage
- **Accessible** : Langage simple, pas de jargon
- **Motivant** : Inspirer à rejoindre et participer

### Cohérence visuelle

- Garder la palette de couleurs actuelle (bleus)
- Utiliser les mêmes espacements et ombres
- Responsive-first (mobile d'abord)
- Animations subtiles (fade-in, hover effects)

### Performance

- Lazy load images
- Optimiser taille des images
- Minimiser re-renders inutiles

---

## ✅ Checklist finale avant merge

- [ ] Tous les textes sont cohérents avec "CPS Connect Alumni"
- [ ] Aucune mention de "ESIG-prep-guide" (sauf dans les routes si nécessaire)
- [ ] Tous les liens fonctionnent
- [ ] Responsive sur mobile, tablette, desktop
- [ ] Pas d'erreurs console
- [ ] Images optimisées
- [ ] Accessibilité validée (alt texts, contrastes)
- [ ] Code propre (pas de console.log, imports inutiles)

---

## 🎯 Objectif final

Une page Home qui :

1. ✅ Présente clairement la double cible (étudiants CPS + alumni toutes écoles)
2. ✅ Explique la valeur ajoutée pour chaque segment
3. ✅ Incite à l'inscription avec des CTA clairs
4. ✅ Montre l'impact de la communauté (stats, témoignages)
5. ✅ Donne envie d'explorer la plateforme

**Résultat attendu** : Augmentation du taux d'inscription et meilleure compréhension de la plateforme par les nouveaux visiteurs.
