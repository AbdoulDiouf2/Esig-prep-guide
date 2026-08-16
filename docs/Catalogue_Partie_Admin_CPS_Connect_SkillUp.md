# Catalogue — Partie admin du dashboard SkillUp (CPS Connect)

## Contexte et principe directeur

La V1 de CPS Connect (livrée) est **lecture seule** — elle affiche les mêmes données que Discord, mais ne permet aucune action. Ce document catalogue tout ce qu'il faudrait construire pour que l'admin puisse **agir** depuis CPS Connect, pas seulement consulter — l'ambition initiale du projet.

**Principe non négociable, déjà établi tout au long du projet : Postgres reste l'unique source de vérité, l'API SkillUp reste l'unique porte d'entrée.** Aucune action admin ne doit jamais écrire directement dans la base depuis CPS Connect — tout passe par l'API, exactement comme pour la lecture. Concrètement, ça veut dire que **l'API SkillUp doit d'abord gagner des endpoints d'écriture** (`POST`/`PATCH`/`DELETE`) — elle n'en a aucun aujourd'hui, elle n'a été construite qu'en lecture (`GET`).

**Auth réutilisée telle quelle :** mêmes en-têtes (`X-API-Key` + `X-Discord-Id`), même vérification `is_admin()` côté API (rôle Discord `Admin SkillUp`). Pas de nouveau système de permission à inventer côté CPS Connect — un admin sur Discord doit être admin sur CPS Connect, point.

---

## 1. Gestion des vagues ✅ FAIT

Équivalent Discord : `/vague-creer`, `/vague-activer`, `/vague-cloturer`, `/vague-lister`.

- **Créer une vague** ✅ — nom, date de début, date de fin. Créée en `brouillon`, jamais activée automatiquement (RG-14).
  - API : `POST /vagues` (`api/routers/admin.py`, `resolve_vague_creer` dans `bot/services/admin_service.py`, réutilise `create_wave`). Dates reçues en ISO (`AAAA-MM-JJ`, `<input type="date">`), `400` explicite si format invalide.
  - Proxy : action `vagueCreer`. Frontend : `createSkillupVague()`, modale "Créer une vague" (nom + deux dates).
- **Activer une vague** ✅ — fait passer une vague `brouillon` à `active`. Refuse si une autre vague est déjà active (`WaveError` existant côté bot, remonté en 404).
  - API : `PATCH /vagues/{id}/activer` (`resolve_vague_activer`, réutilise `activate_wave`).
  - Proxy : action `vagueActiver`. Frontend : bouton "Activer" contextuel (visible seulement sur les vagues `brouillon`) dans le tableau du sous-onglet Vagues.
- **Clôturer une vague** ✅ — fait passer la vague active (ou une vague donnée) à `cloturee`, **avec modale de confirmation** (irréversible).
  - API : `PATCH /vagues/cloturer` (`resolve_vague_cloturer`, réutilise `close_wave`).
  - Proxy : action `vagueCloturer`. Frontend : bouton "Clôturer" contextuel (visible seulement sur la vague `active`).
- **Lister les vagues** ✅ — nouvel endpoint `GET /vagues` (`resolve_vagues_lister`, réutilise `list_waves`) : liste **toutes** les vagues du système, pas juste celles de l'appelant. Frontend : `getSkillupVaguesAdmin()`, tableau avec badge de statut (brouillon/active/clôturée) dans le nouveau sous-onglet "Vagues" de la Vue admin.

**Vérifié en direct (curl, API locale)** — les deux refus explicitement voulus :
- `POST /vagues` avec date malformée (`31/12/2026` au lieu de `AAAA-MM-JJ`) → `400 {"detail":"Format de date invalide..."}`. ✅
- `PATCH /vagues/{id}/activer` sur une vague brouillon alors qu'une autre est déjà active (RG-14) → `404`, message `WaveError` d'origine préservé ("Une vague est déjà active (**Vague Août 2026**) — clôture-la d'abord..."). ✅
- Reliquat du test : une vague brouillon "Test double-active (a supprimer)" (id 34) a été créée pour ce test et traîne en base — pas d'endpoint `DELETE /vagues` (hors périmètre) pour la nettoyer par API ; à supprimer à la main côté DB si besoin, sinon inoffensive (jamais activée).

**Limite historique corrigée :** l'ancien sélecteur de vague (§3/§4) réutilisait `/members/{discord_id}/vagues` (scope "vagues de l'appelant"), pas toutes les vagues du système. `GET /vagues` existe désormais mais **n'a pas encore remplacé** ce sélecteur — reste une piste d'amélioration future (basculer `vagueParamFor`/le dropdown participant+admin sur la nouvelle liste complète), pas fait dans ce lot pour limiter le risque de régression sur un flux déjà stable.

## 2. Gestion des membres ✅ FAIT

Équivalent Discord : `/membre-ajouter`, `/membre-editer`, `/membre-lier-thread`, `/membres-lister`.

- **Ajouter un membre** ✅ — discord_id, profil (liste des 5 valeurs autorisées, validée contre la même liste fermée que côté bot), certif/projet en cours (optionnel). Rattaché à une vague (active par défaut). Refuse explicitement si déjà membre de cette vague (même règle que `/membre-ajouter`).
  - API : `POST /members` (`api/routers/admin.py`, `resolve_membre_ajouter` dans `bot/services/admin_service.py`, réutilise `add_member`).
  - Proxy : action `membreAjouter`.
  - Frontend : `addSkillupMember()` (`skillupService.ts`), modale "Ajouter un membre" (ID Discord, nom, profil, certif optionnel) → vue recap avec statut du DM de bienvenue, dans `SkillUp.tsx`.
- **Éditer un membre** ✅ — corrige un champ (nom, profil, certif_ou_projet, objectif_vague) après coup, mêmes règles que `/membre-editer`.
  - API : `PATCH /members/{discord_id}` (`resolve_membre_editer`, nouvelle fonction `update_field` ajoutée dans `bot/db/members.py` — mirroir de celle déjà existante dans `bot/db/sessions.py`).
  - Proxy : action `membreEditer`.
  - Frontend : `editSkillupMember()`, modale d'édition (select champ + input/select selon le champ) via crayon sur chaque ligne du tableau membres.
- **Lier un thread objectif** ✅ FAIT (livré après ce lot, doc corrigée) — rattachement manuel d'un post objectif existant (rattrapage pour les membres dont le post a été créé à la main avant l'automatisation `/objectif-vague`).
  - API : `PATCH /members/{discord_id}/thread-objectif` (`api/routers/admin.py`, `resolve_membre_lier_thread` dans `bot/services/admin_service.py`, réutilise `set_thread_objectif_id` déjà en base ; parseur `parse_thread_id` — accepte un ID brut ou un lien `discord.com/channels/...` — dupliqué depuis `bot/cogs/admin.py::_parse_thread_id`, fonction pure, pour ne pas faire dépendre le service layer de `discord.py`).
  - Proxy : action `membreLierThread`. Frontend : `linkSkillupMemberThread()`, icône 🔗 sur chaque ligne du tableau membres → modale "Rattacher le post objectif" (un champ texte, lien ou ID).
- **Lister les membres** ✅ — déjà en lecture (V1).
- **Définir/modifier son objectif de vague (self-service membre)** ✅ FAIT (livré après ce lot) — sur Discord, `/objectif-vague` permet à un membre de définir son propre objectif sans passer par un admin ; côté web, seul un admin pouvait l'éditer (champ `objectif_vague` via l'éditeur générique de membre). Trou identifié lors du même audit delta.
  - **Limite de scope assumée** : le bot fait aussi vivre un fil dans le forum Discord `objectifs` (créé/édité automatiquement, `_post_or_edit_objectif` dans `bot/cogs/journal.py`) — ça touche l'API Discord Guild/Forum, disponible uniquement côté process bot (`discord.py` vivant), pas côté process API FastAPI. **CPS Connect ne gère que le champ `objectif_vague` en base**, pas le fil forum — la modale le précise explicitement ("utilise `/objectif-vague` sur Discord si tu veux aussi synchroniser ton post").
  - API : `GET`/`PATCH /members/{discord_id}/objectif-vague` (`api/routers/journal.py`, `resolve_own_member`/`resolve_objectif_vague_set` dans `bot/services/journal_service.py`, réutilise `update_objectif` déjà en base), protégé par `require_self_or_admin()`.
  - Proxy : actions `objectifVagueLire`/`objectifVagueDefinir`, mêmes garanties d'identité que les endpoints self-service de sessions (discordId résolu côté proxy, jamais fourni par le client).
  - Frontend : `getSkillupMyObjectif()`/`setSkillupObjectifVague()`, nouvelle carte "Mon objectif de vague" en haut de l'onglet "Ma vague" (`SkillUp.tsx`), crayon → modale (textarea).

**DM de bienvenue** ✅ — envoyé à l'ajout, best-effort via `send_dm()` (même mécanisme que §3), statut (`dm_ok`) affiché dans la vue recap plutôt que silencieusement ignoré.

## 3. Gestion des binômes ✅ FAIT

Équivalent Discord : `/binome-definir`, `/binome-retirer`, `/binomes-semaine`.

- **Définir un binôme** ✅ — deux membres + semaine. Respecte la contrainte déjà en base (`UNIQUE(member_id, wave_id, semaine)`) — refus explicite (message reprenant le nom du partenaire actuel) si l'un des deux est déjà en binôme cette semaine-là, via l'exception `BinomeError` déjà existante côté bot, remontée telle quelle en HTTP 404.
  - API : `POST /binomes` (`api/routers/admin.py`, `resolve_binome_definir` dans `bot/services/admin_service.py`, réutilise `define_binome`).
  - Proxy : action `binomeDefinir` dans `functions/index.js`.
  - Frontend : `defineSkillupBinome()` (`skillupService.ts`), modale "Définir un binôme" (sélection des deux membres + semaine) dans `SkillUp.tsx`.
- **Retirer un binôme** ✅ — dissout une paire existante, **avec modale de confirmation** (cohérent avec la décision prise pour les sessions, cf. §4 et question ouverte #1).
  - API : `DELETE /binomes` (`resolve_binome_retirer`, réutilise `remove_binome`/`get_partner_id`).
  - Proxy : action `binomeRetirer`.
  - Frontend : `removeSkillupBinome()`, modale de confirmation.
- **Lister les binômes de la semaine** ✅ — déjà en lecture (V1), passée d'un dump JSON brut à un vrai tableau (Membre A / Membre B / Actions).

**Point de cohérence — DM automatiques** ✅ Traité : `api/discord_client.py` gagne `send_dm()` (REST Discord pur — `POST /users/@me/channels` puis `POST /channels/{id}/messages`, l'API SkillUp n'a pas de client `discord.py` vivant comme le bot). Appelé dans les deux endpoints, best-effort (jamais fatal si DM fermés), avec le même wording que côté Discord. Les échecs de DM sont renvoyés au frontend (`dm_echecs`) et affichés en warning plutôt que silencieusement ignorés.

## 4. Gestion des sessions ✅ FAIT

Équivalent Discord : `/session-corriger` (côté admin — corriger la session d'un autre membre), `/sessions-lister`.

- **Corriger une session** ✅ — éditer un champ (objectif, bilan, blocages, créneau) d'une session existante.
  - API : `PATCH /sessions/{id}` (`api/routers/admin.py`, `resolve_session_corriger` dans `bot/services/admin_service.py`, réutilise `update_field`/`get_by_id` déjà en base).
  - Proxy : action `sessionCorriger` dans `functions/index.js` (`SKILLUP_ACTIONS` généralisé pour porter méthode HTTP + body, pas juste des `GET`).
  - Frontend : `patchSkillupSession()` (`skillupService.ts`), modale d'édition (select champ + textarea) dans `SkillUp.tsx`.
- **Supprimer une session** ✅ — avec **confirmation explicite** (modale "Es-tu sûr ?", décision tranchée : oui, cf. question ouverte #1 ci-dessous).
  - API : `DELETE /sessions/{id}` (`resolve_session_supprimer`, réutilise `delete_session`).
  - Proxy : action `sessionSupprimer`.
  - Frontend : `deleteSkillupSession()`, modale de confirmation destructive.
- **Lister/filtrer les sessions** ✅ — déjà en lecture (V1), boutons d'action (crayon/poubelle) ajoutés par ligne dans la vue admin.
- **Corriger/supprimer sa propre session (membre)** ✅ FAIT (livré après ce lot) — sur Discord, `/session-corriger` n'est pas admin-only : un membre peut corriger/supprimer ses propres sessions (vérification de propriété, `bot/cogs/session.py:210-227`). La version web n'avait que la variante admin (aucune vérification de propriétaire) — trou identifié lors d'un audit delta Discord ↔ CPS Connect.
  - API : `PATCH /members/{discord_id}/sessions/{session_id}` et `DELETE /members/{discord_id}/sessions/{session_id}` (`api/routers/journal.py`, `resolve_session_corriger_self`/`resolve_session_supprimer_self` dans `bot/services/journal_service.py`) — vérifie que la session appartient bien à l'appelant sur la vague active avant d'autoriser la modification, protégé par `require_self_or_admin()` (même dépendance que `/journal`/`/bilan`).
  - Proxy : actions `sessionCorrigerSelf`/`sessionSupprimerSelf` — utilisent le `discordId` résolu côté proxy (Firestore), jamais un id fourni par le client, pour garantir qu'un membre ne peut agir que sur lui-même.
  - Frontend : `patchSkillupMySession()`/`deleteSkillupMySession()`, crayon/poubelle réutilisés sur la carte "Journal de la semaine" (Ma vague) — même modale que la version admin (`SkillUp.tsx`), un flag `editSessionScope`/`deleteSessionScope` fait bifurquer vers l'endpoint self plutôt qu'admin.

C'est probablement le domaine le plus utile au quotidien pour un admin — corriger une faute de frappe ou un oubli, sans devoir remettre la main sur Discord.

**Non fait dans ce lot** : pas de journal d'audit (cf. §6) — la correction/suppression n'est pas tracée côté CPS Connect au-delà des logs Cloud Functions standards.

### Polish UI ajouté après coup (hors périmètre initial du catalogue)

- **Sélecteur semaine + vague sur la vue admin** — navigateur ◀ Semaine N ▶ et dropdown vague, désormais **propre à chaque sous-onglet Sessions/Binômes** (états et chargements indépendants) — Dashboard et Membres n'en ont pas besoin. A révélé un bug de fond : `/sessions` sans `semaine` liste **toutes** les semaines (contrairement à `/binomes`/`/journal` qui résolvent la semaine courante par défaut) — corrigé en résolvant la semaine via `/binomes` d'abord puis en la passant explicitement à `/sessions`.
- **Vue admin réorganisée en sous-onglets** (`antd` `Tabs`) : **Dashboard | Membres | Sessions | Binômes**, Dashboard par défaut. Correction de trajectoire par rapport à l'entrée précédente de ce journal : la page était repassée en Tailwind pur après un premier essai Ant Design jugé trop simpliste — `antd` (déjà une dépendance du projet) a finalement été réintroduit spécifiquement pour ces sous-onglets et pour `@ant-design/plots` (nouvelle dépendance) sur le Dashboard ; le reste de la page (tableaux, modales, cards) reste en Tailwind pur.
- **Dashboard** (cf. §6, capacité proposée mais jamais construite — faite ici) : 5 cartes chiffres (membres, sessions semaine/vague, taux de complétion, binômes actifs, durée cumulée) + 4 graphiques (`Column` sessions/jour, `Bar` horizontal sessions/membre, 2 `Pie` donut statut/créneau). Tout calculé côté frontend depuis `/sessions` (sans `semaine` = toutes les semaines de la vague) et `/members`, zéro nouvel endpoint. Limite connue : la carte "Sessions (semaine)" réutilise l'état déjà chargé par le sous-onglet Sessions (exact par défaut, semaine courante ; devient obsolète si l'admin navigue ailleurs dans Sessions sans revenir sur Dashboard).
- **Membres du serveur Discord vs membres inscrits à la vague** — nouvelle capacité, toggle "Membres de la vague" / "Tous les membres du serveur" dans le sous-onglet Membres. Nécessite le Server Members Intent (privilégié, activé côté Developer Portal) :
  - `bot/main.py` — `intents.members = True` était déjà présent dans le code, seul manquait le toggle Developer Portal.
  - API : `GET /discord/members` (`api/routers/admin.py`), nouvelle fonction `get_guild_members()` dans `api/discord_client.py` — pagine (`after`, tant qu'une page pleine de 1000 revient), cache mémoire 300s (même schéma que `_get_role_id_to_name`), **exclut les comptes bot** (`user.bot`, sinon le bot SkillUp lui-même apparaîtrait comme "membre non inscrit"). Renvoie la liste brute, sans croiser avec Postgres — le croisement par `discord_id` se fait côté frontend.
  - Proxy : action `discordMembers`. Frontend : `getSkillupDiscordMembers()`, badge vert "Inscrit à la vague" / ambre "Pas inscrit à la vague" par ligne.
  - **Non testé en conditions réelles** : le serveur de dev n'a que 3 comptes non-bot dessus (les 8 lignes Postgres viennent d'un backfill, pas d'une vraie adhésion Discord) — le croisement n'aura de sens qu'une fois pointé sur le vrai serveur Alumni CPS. **Toujours vrai à ce jour** — reste une hypothèse de fonctionnement (le code suit le même pattern éprouvé que `is_admin()`/`send_dm()`, mais n'a pas été exercé en conditions réelles), pas une certitude tant que ce test n'a pas été fait sur le vrai serveur.
- **5ᵉ sous-onglet "Vagues"** ajouté dans la Vue admin (Dashboard | Membres | Sessions | Binômes | **Vagues**) — regroupe la gestion des vagues (§1) et des salons de coworking (§5), chargés à la demande au premier affichage (usage rare). Tableau vagues avec bouton Activer/Clôturer contextuel, modale de création ; tableau salons avec modale d'ajout et confirmation de retrait.
- **Cards binômes** — grille de cards (avatars initiales colorés, connecteur visuel) à la place du tableau brut.
- **Membres déjà en binôme désactivés** dans le sélecteur "Définir un binôme" — check live contre `/binomes?semaine=` de la semaine tapée.
- **Badge "En binôme avec X"** sur l'onglet membre (exploite `partenaire_nom`, déjà renvoyé par `/binome-journal` mais jamais affiché avant).
- **Retours à la ligne préservés** (`whitespace-pre-line`) dans les colonnes objectif/bilan/blocages, ignorés par défaut en HTML.
- **Avatars Discord vérifiés sur les cards binômes** — ne passe pas par l'API SkillUp : la Cloud Function proxy (action `discordAvatars`) vérifie `is_admin` auprès de l'API SkillUp puis lit directement Firestore (`alumni`, `discordVerified == true`) avec les privilèges admin SDK, contourne les règles Firestore (qui ne connaissent pas la notion d'admin SkillUp). Croisé côté frontend par `discord_id`.
- **Dashboard — sélecteur de portée par défaut sur la vague active** — au premier chargement seulement (pas d'écrasement si l'admin repasse sur "Toutes les vagues" ensuite).
- **Dashboard — filtre semaine** ajouté (indépendant du sélecteur vague), défaut sur la semaine courante (résolue via `adminCurrentSemaineNumber`, même mécanisme que Sessions/Binômes). Sessions n'ayant pas de champ `semaine` exploitable côté client, le filtre refetch `/sessions` avec le paramètre `semaine` par vague concernée.
- **Dashboard — chart comparaison masqué si non pertinent** : "Sessions totales par vague" (mode "Toutes les vagues") ne s'affiche plus si une seule vague a des données — message "Pas assez de vagues avec des données pour comparer" à la place.
- **Dashboard — KPI "Binômes actifs" scopé dynamiquement** : recalculé selon la portée vague + semaine choisies (au lieu de réutiliser l'état statique du sous-onglet Binômes), avec la semaine courante comme proxy en mode "Toutes les semaines" (un binôme n'existe que pour une semaine donnée).
- **Dashboard — statut delta et couleurs stables** : `STATUT_COLORS` (lookup + fallback gris) au lieu d'un mapping 2 couleurs codé en dur — gère n'importe quelle valeur de statut. Sous-carte "X complètes · Y incomplètes · Z autres" sous le taux de complétion.
- **Sessions — filtres tableau** : membre, salon, créneau, statut (dropdowns, options dérivées des sessions actuellement affichées) + date (input natif), bouton "Réinitialiser". Purement client-side, la semaine/vague reste filtrée côté API en amont.
- **Ajouter un membre — dropdown au lieu de saisie ID manuelle** : liste les membres du serveur Discord (`getSkillupDiscordMembers`), exclut ceux déjà rattachés à la vague sélectionnée, pré-remplit le nom à la sélection.
- **`GET /sessions` — bug de troncature à 50 lignes corrigé** : `bot/db/sessions.py::list_filtered` défaut historique `limit=50` (dimensionné pour tenir dans un message Discord) était hérité tel quel côté API web. `resolve_sessions_lister` prend désormais un `limit` explicite, l'API web passe `limit=2000` (`api/routers/admin.py`) — le chemin Discord (`/sessions-lister`) garde `limit=50` par défaut, inchangé.
- **`VITE_SKILLUP_PROXY_URL` migré en `.env`** (`VITE_SKILLUP_PROXY_URL`) au lieu d'une constante en dur dans `skillupService.ts` — même convention que les autres URLs de Cloud Functions du projet.

## 5. Gestion des salons de coworking ✅ FAIT

Équivalent Discord : `/salon-coworking-ajouter`, `/salon-coworking-retirer`, `/salons-coworking-lister`.

- **Ajouter un salon** ✅ — canal_id + nom, scopé par vague (idempotent côté DB : `add_channel` fait un upsert sur `UNIQUE(canal_id, wave_id)`, réactive si déjà présent mais inactif).
  - API : `POST /salons` (`resolve_salon_ajouter`, réutilise `add_channel`).
  - Proxy : action `salonAjouter`. Frontend : `addSkillupSalon()`, modale "Ajouter un salon" (ID + nom saisis manuellement).
- **Retirer un salon** ✅ — soft-delete (`actif = FALSE`, pas une suppression), **avec modale de confirmation**.
  - API : `DELETE /salons` (`resolve_salon_retirer`, réutilise `remove_channel`).
  - Proxy : action `salonRetirer`. Frontend : `removeSkillupSalon()`.
- **Lister les salons** ✅ — sans `vague`, liste TOUTES les vagues (même comportement que `/salons-coworking-lister` côté Discord).
  - API : `GET /salons` (`resolve_salons_lister`, réutilise `list_channels`).
  - Frontend : `getSkillupSalons()`, tableau (salon/ID/vague/statut) dans le sous-onglet "Vagues".

**Picker Discord live** ✅ FAIT (livré après ce lot, doc corrigée) — l'hypothèse initiale ("saisie manuelle suffisante") a été abandonnée. `GET /discord/voice-channels` (`api/routers/admin.py`, `get_voice_channels()` dans `api/discord_client.py`, filtre `type == 2`, cache 300s même schéma que `get_guild_members()`). Proxy : action `discordVoiceChannels`. Frontend : `getSkillupDiscordVoiceChannels()`, modale renommée "Rattacher un salon à la vague" — dropdown des salons vocaux du serveur, exclut ceux déjà rattachés (actifs) à la vague active. Ajout d'une section "Tous les salons vocaux du serveur" (lecture seule, badges rattaché/non-rattaché), distincte du tableau "Salons de coworking".

---

## 6. Fonctionnalités propres à CPS Connect (sans équivalent Discord)

Des capacités qui n'existent nulle part côté bot, mais qui ont du sens **uniquement** dans un dashboard visuel :

- **Vue synthétique / statistiques** ✅ FAIT — cf. Dashboard sous §4 (cartes chiffres + 4 graphiques). "Membres les moins actifs" (repérer qui décroche) pas encore isolé comme métrique dédiée — le graphique "Sessions par membre" permet de le repérer visuellement, mais pas de tri/alerte automatique.
- **Export de données (CSV + PDF)** ✅ FAIT — élargi au-delà du CSV initialement envisagé : bouton "Exporter" (dropdown CSV/PDF, `src/utils/tableExport.ts`, `papaparse`/`jsPDF`+`jspdf-autotable`, déjà des dépendances du projet) sur **chaque tableau** de la Vue admin (Membres — vague et serveur, Sessions, Binômes, Vagues, Salons) **et** sur le Dashboard (indicateurs + les 4 répartitions + comparaison par vague si pertinente). Respecte toujours les filtres/portée actifs au moment de l'export (scope vague, semaine, filtres membre/salon/créneau/statut du tableau Sessions) — jamais un export "toutes données" qui ignorerait ce que l'admin regarde à l'écran. Composant générique `ExportButtons` réutilisé partout, pas une implémentation par tableau.
- **Journal d'audit des actions admin** — qui a fait quoi, quand, depuis CPS Connect. Sur Discord, la traçabilité existe implicitement (les logs des commandes restent visibles dans le salon). Depuis un dashboard web, si aucune trace n'est gardée, une action destructive (suppression de session, par exemple) devient plus difficile à investiguer après coup. À voir si c'est un vrai besoin ou une sur-ingénierie pour 8-10 utilisateurs.

---

## 7. Prérequis techniques, dans l'ordre logique

1. **L'API SkillUp doit gagner des endpoints d'écriture** — aucun n'existe aujourd'hui (elle est 100% `GET`). Chaque domaine ci-dessus nécessite un ou plusieurs `POST`/`PATCH`/`DELETE`, avec la même rigueur que côté lecture (codes d'erreur explicites, jamais de refus silencieux, réutilisation des fonctions déjà extraites dans `bot/services/`). ✅ FAIT — sessions, binômes, membres, vagues et salons ont désormais tous leurs endpoints d'écriture.
2. **La Cloud Function proxy** doit gérer les méthodes HTTP en écriture, pas seulement relayer des `GET`. ✅ Fait — `SKILLUP_ACTIONS` dans `functions/index.js` porte désormais méthode + body par action, plus seulement des chemins `GET`.
3. **Le frontend** a besoin de vrais formulaires (pas juste des tableaux de lecture) — inputs, validations, retours d'erreur lisibles. ✅ FAIT — les 5 domaines ont chacun leurs modales/formulaires dans `SkillUp.tsx`.

---

## Priorité proposée (à valider/réordonner)

Reprend la logique déjà discutée : une action à la fois, pas les treize d'un coup.

1. **`/session-corriger` (admin)** ✅ FAIT — le plus utile au quotidien, corrige une vraie friction déjà rencontrée (cf. `bf-026`, jamais corrigée faute d'interface simple).
2. **`/binome-definir` / `/binome-retirer`** ✅ FAIT — geste hebdomadaire récurrent, gain de confort réel.
3. **Gestion des membres** (ajout/édition) ✅ FAIT — moins fréquent, mais complète le tableau de bord.
4. **Gestion des vagues** et **salons coworking** ✅ FAIT — les plus rares, faits en dernier comme prévu.

**Les 4 priorités du catalogue sont maintenant toutes livrées.** Un audit delta Discord ↔ CPS Connect (24 commandes bot passées en revue) a ensuite identifié 3 trous restants, tous comblés depuis : `/membre-lier-thread` (§2), `/objectif-vague` en self-service (§2, champ DB uniquement — pas le fil forum, cf. limite de scope documentée), `/session-corriger` en self-service (§4). Reste hors périmètre : journal d'audit (§6, jamais évalué comme prioritaire). Export CSV/PDF (§6) et picker Discord live pour les salons (§5) ont aussi été livrés entre-temps.

---

## Questions ouvertes — à trancher avant de lancer le développement

1. **Confirmation avant action destructive** (suppression de session, retrait de binôme) — ✅ Tranché et implémenté pour les deux (§3 et §4).
2. **Notifications DM** — ✅ Tranché et implémenté (recommandation suivie) : les DM automatiques partent bien depuis CPS Connect, best-effort, cf. §3.
3. **Journal d'audit** — vrai besoin ou complexité inutile à cette échelle (8-10 membres) ?
4. **Ordre de priorité** — le classement proposé en section précédente vous convient-il, ou un autre domaine est plus urgent de votre point de vue (ex. côté gestionnaire du serveur prod) ?
5. **Actions groupées** (ex. ajouter plusieurs membres d'un coup) — utile seulement si de nouvelles vagues arrivent souvent avec beaucoup de monde d'un coup ; pas la peine si l'ajout reste ponctuel et individuel comme aujourd'hui.
