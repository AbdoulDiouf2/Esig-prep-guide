# Connexion Discord (OAuth) — CPS Connect

## Objectif

Remplacer la saisie manuelle du `discordId` (champ texte libre, actuellement en place) par un vrai flux d'autorisation Discord — un bouton **« Connecter mon Discord »** dans le profil alumni. La personne prouve qu'elle possède réellement le compte Discord, au lieu de simplement déclarer un identifiant que personne ne vérifie.

Ce n'est **pas** une nouvelle méthode de connexion à CPS Connect (on ne remplace pas l'authentification Firebase existante). C'est un lien secondaire, qui vient enrichir un profil déjà connecté — même logique qu'un bouton « Connecter mon GitHub » ou « Connecter mon Spotify » ailleurs.

## Principe de sécurité central — à ne jamais casser

**Le statut admin continue d'être déterminé exclusivement par l'appel à `GET /members/{discord_id}/access` côté API SkillUp.** Ce flux OAuth ne sert qu'à *prouver l'identité* et *enrichir l'affichage* — il ne doit **jamais** devenir une deuxième source de décision sur qui est admin ou participant. Ne pas utiliser le scope `guilds.members.read` (qui donnerait accès aux rôles Discord) dans ce but : ça créerait deux chemins différents pour répondre à la même question, avec le risque qu'ils finissent par diverger silencieusement — un piège déjà rencontré plusieurs fois dans ce projet (`schema.sql`/`schema_postgres.sql`, `wave=active`/`vague=`).

## Scope OAuth à demander

**`identify` uniquement.** Suffisant pour récupérer :
- L'ID Discord (`id`) — vérifié, plus déclaré.
- Le nom d'utilisateur (`username` / `global_name`).
- L'avatar (`avatar` hash, à combiner avec l'ID pour construire l'URL de l'image).

Pas besoin de `guilds` ni de `guilds.members.read` pour cette V1 — inutile vu le principe ci-dessus, et ça évite de demander plus de permissions que nécessaire à l'utilisateur au moment de l'autorisation.

## Ce qui est récupéré et stocké

| Donnée | Utilisation prévue |
|---|---|
| `discordId` | Remplace le champ actuel — désormais vérifié, pas déclaré |
| `discordUsername` | Affiché à côté du statut de connexion (« Connecté en tant que @pseudo ») pour confirmation visuelle |
| `discordAvatarUrl` | **Récupéré et stocké, mais pas utilisé pour l'instant.** Pas d'affichage prévu dans cette version — gardé en base pour un usage futur (ex. un jour, afficher l'avatar Discord à côté du nom dans les listes membres/sessions de la Vue admin, ou ailleurs). Ne pas remplacer l'avatar de profil CPS Connect existant avec ça. |
| `discordLinkedAt` | Horodatage de la liaison — utile pour savoir depuis quand le lien existe, et distinguer une liaison ancienne (manuelle) d'une nouvelle (vérifiée) |
| `discordVerified` | Booléen — `true` si obtenu via ce flux OAuth, `false`/absent pour les profils qui ont encore l'ancien `discordId` saisi à la main (cf. migration ci-dessous) |

## Flux technique

1. Bouton **« Connecter mon Discord »** dans `AlumniProfileForm.tsx` (remplace l'input texte actuel), redirige vers :
   `https://discord.com/api/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code&scope=identify&state=<jeton anti-CSRF>`
2. Discord affiche l'écran d'autorisation standard, la personne accepte.
3. Discord redirige vers une nouvelle Cloud Function (callback), avec `code` et `state` en paramètres.
4. La fonction :
   - Vérifie que `state` correspond à celui généré à l'étape 1 (protection anti-CSRF — sans ça, un lien piégé pourrait faire lier le compte Discord d'un attaquant au profil d'une victime).
   - Échange `code` contre un `access_token` (appel serveur à serveur vers `discord.com/api/oauth2/token`, avec le `client_secret` — jamais exposé au frontend).
   - Appelle `GET https://discord.com/api/users/@me` avec ce token pour récupérer `id`, `username`, `avatar` — ces données viennent de Discord lui-même, pas de ce que l'utilisateur a saisi.
   - Écrit `discordId`, `discordUsername`, `discordAvatarUrl`, `discordLinkedAt`, `discordVerified: true` dans `alumni/{uid}`.
5. Redirection vers le profil CPS Connect, avec confirmation (« Discord connecté : @pseudo »).

## Configuration Discord nécessaire

**Pas besoin d'une nouvelle application Discord** — réutiliser celle du bot SkillUp existant. Il suffit d'ajouter une **URL de redirection OAuth2** dans le Developer Portal (onglet OAuth2 → Redirects), pointant vers la nouvelle Cloud Function. Le `client_secret` de cette même application (visible dans l'onglet OAuth2) devient un nouveau secret Firebase (`defineSecret`), au même titre que `SKILLUP_API_KEY`.

## Migration — profils déjà liés manuellement

Certains profils (dont celui de l'admin principal, déjà testé) ont un `discordId` saisi à la main avant la mise en place de ce flux. Deux options, à trancher :

- **Option A — coexistence simple.** Le champ manuel reste utilisable en secours (ex. si Discord OAuth est temporairement indisponible), mais le bouton « Connecter mon Discord » devient la voie recommandée et écrase toute saisie manuelle antérieure une fois utilisé. `discordVerified` distingue les deux cas dans l'affichage (« Vérifié » vs « Saisi manuellement »).
- **Option B — migration forcée.** Retirer complètement la possibilité de saisie manuelle ; les profils existants avec un `discordId` non vérifié perdent l'accès à l'onglet SkillUp tant qu'ils n'ont pas reconnecté via le bouton.

Recommandation : **Option A pour cette V1** — moins de friction pour les 8 membres déjà actifs, migration douce plutôt que brutale.

## Ce que ce flux ne change pas

- L'endpoint `/access` et la logique `is_participant`/`is_admin` restent identiques, aucune modification côté API SkillUp.
- La visibilité de l'onglet SkillUp reste conditionnée par la réponse de `/access`, pas par la présence d'un `discordId` vérifié en soi.
- Aucun impact sur le bot Discord lui-même.

## Questions ouvertes

1. **Option A ou B pour la migration** — à trancher.
2. **Que faire si quelqu'un déconnecte/change de compte Discord** — faut-il un bouton « Déconnecter mon Discord » qui vide `discordId`/`discordVerified`, ou seulement la possibilité de reconnecter (écrase l'ancien) ?
3. **Faut-il afficher l'avatar Discord quelque part dès cette version**, ou vraiment le garder en réserve sans aucun affichage pour l'instant ? (Le tableau ci-dessus part du principe que oui, réserve pure — à confirmer.)
