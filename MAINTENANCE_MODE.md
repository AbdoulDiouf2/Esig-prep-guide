# Mode Maintenance - Documentation

## 📋 Vue d'ensemble

Le système de mode maintenance permet au superadmin de mettre le site en maintenance pour tous les utilisateurs (sauf lui-même) pendant des opérations de maintenance, mises à jour ou corrections de bugs.

## 🎯 Fonctionnalités

### Pour le Superadmin

- **Toggle ON/OFF** : Activer/désactiver le mode maintenance en un clic
- **Accès complet** : Le superadmin peut toujours accéder au site même en mode maintenance
- **Message personnalisé** : Possibilité d'ajouter un message personnalisé (fonctionnalité future)
- **Historique** : Suivi de qui a activé/désactivé la maintenance et quand

### Pour les utilisateurs

- **Page de maintenance élégante** : Design moderne et professionnel
- **Informations claires** : Explication de ce qui se passe
- **Contact** : Email de support disponible pour les urgences

## 🔧 Architecture technique

### Fichiers créés

1. **`src/pages/Maintenance.tsx`**
   - Page de maintenance affichée aux utilisateurs
   - Design moderne avec animations
   - Informations de contact

2. **`src/services/maintenanceService.ts`**
   - `getMaintenanceStatus()` : Récupère l'état du mode maintenance
   - `setMaintenanceStatus()` : Active/désactive le mode (superadmin uniquement)

3. **`src/hooks/useMaintenance.ts`**
   - Hook personnalisé pour vérifier le mode maintenance
   - Vérifie automatiquement si l'utilisateur est superadmin

4. **`src/pages/admin/MaintenanceToggle.tsx`**
   - Interface d'administration pour gérer le mode maintenance
   - Toggle avec confirmation
   - Affichage du statut actuel

### Structure Firestore

**Collection** : `settings`  
**Document** : `maintenance`

```typescript
{
  enabled: boolean,        // true = maintenance active
  message?: string,        // Message personnalisé (optionnel)
  updatedAt: Timestamp,    // Date de dernière modification
  updatedBy: string        // UID du superadmin qui a modifié
}
```

### Règles Firestore

```javascript
match /settings/{settingId} {
  // Lecture : tout le monde (pour vérifier le mode maintenance)
  allow read: if true;
  
  // Écriture : superadmin uniquement
  allow write: if isSuperAdmin();
}
```

## 🚀 Utilisation

### Activer le mode maintenance

1. Se connecter en tant que superadmin
2. Aller sur `/admin/maintenance` ou via le tableau de bord admin
3. Cliquer sur "Activer la maintenance"
4. Confirmer l'action

**Résultat** : Tous les utilisateurs (sauf superadmin) voient la page de maintenance

### Désactiver le mode maintenance

1. Sur la même page `/admin/maintenance`
2. Cliquer sur "Désactiver la maintenance"
3. Confirmer l'action

**Résultat** : Le site redevient accessible à tous

## 🔒 Sécurité

- ✅ Seul le **superadmin** peut activer/désactiver le mode maintenance
- ✅ Le superadmin peut **toujours** accéder au site en mode maintenance
- ✅ Les règles Firestore empêchent toute modification non autorisée
- ✅ Vérification côté client ET serveur (règles Firestore)

## 📱 Routes

| Route | Accès | Description |
|-------|-------|-------------|
| `/admin/maintenance` | Superadmin uniquement | Page de gestion du mode maintenance |
| Toutes les autres routes | Bloquées si maintenance active | Redirigent vers la page de maintenance |

## 🎨 Design

La page de maintenance utilise :
- Gradient de fond moderne (bleu → blanc → violet)
- Icône animée (clé à molette qui rebondit)
- Cartes d'information avec bordures colorées
- Animation de chargement (3 points qui rebondissent)
- Design responsive (mobile-friendly)

## 🔄 Flux utilisateur

### Utilisateur normal (non-superadmin)

```
1. Utilisateur se connecte
2. Hook useMaintenance vérifie le statut
3. Si maintenance = true → Affiche page Maintenance
4. Si maintenance = false → Accès normal au site
```

### Superadmin

```
1. Superadmin se connecte
2. Hook useMaintenance vérifie le statut
3. Même si maintenance = true → Accès normal (bypass)
4. Peut gérer le mode via /admin/maintenance
```

## 📝 Notes importantes

- Le mode maintenance est vérifié à **chaque chargement de page**
- Les utilisateurs déjà connectés verront la page de maintenance au prochain rechargement
- Le superadmin voit toujours le site normalement
- Les règles Firestore garantissent la sécurité même si le code client est modifié

## 🚧 Améliorations futures

- [ ] Message personnalisé affiché sur la page de maintenance
- [ ] Planification de maintenance (date/heure de début et fin)
- [ ] Notification email automatique aux utilisateurs
- [ ] Historique des maintenances avec durée
- [ ] Mode "lecture seule" (accès en lecture, pas d'écriture)
