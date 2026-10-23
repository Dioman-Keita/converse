# Converse

Chat temps réel **auto-hébergé** : ton PC (ou n'importe quelle machine avec Docker) fait office de serveur, et n'importe qui sur Internet peut l'utiliser depuis un navigateur.

- Comptes (email + mot de passe), conversations directes et de groupe, messages en temps réel, historique.
- Une seule commande pour tout lancer : `docker compose up -d`.
- Toutes les données restent chez toi (Postgres) avec sauvegarde automatique quotidienne.
- Accès public **sans configurer ta box** grâce à un tunnel Cloudflare sortant.

Détails techniques (API REST, protocole WebSocket, choix d'architecture) : [ARCHITECTURE.md](ARCHITECTURE.md).

```
Navigateur (iOS, Android, PC)
        │ HTTPS / WSS
        ▼
  Cloudflare Tunnel ◄── connexion sortante depuis ton PC (aucun port ouvert)
        │
┌───────┴──────── docker compose (ton PC) ─────────┐
│ quick-tunnel / tunnel  → expose l'app            │
│ app      → site web + API + WebSocket (Node 24)  │
│ db       → Postgres 17 (jamais exposé)           │
│ backup   → pg_dump quotidien dans ./backups      │
└──────────────────────────────────────────────────┘
```

---

## Sommaire

1. [Prérequis](#prérequis)
2. [Lancer le serveur](#lancer-le-serveur)
3. [Rendre l'app accessible depuis Internet](#rendre-lapp-accessible-depuis-internet)
4. [Avoir une URL fixe](#avoir-une-url-fixe)
5. [Utiliser l'app](#utiliser-lapp)
6. [Exploitation au quotidien](#exploitation-au-quotidien)
7. [Sauvegardes et restauration](#sauvegardes-et-restauration)
8. [Développement](#développement)
9. [Dépannage](#dépannage)
10. [Limites connues](#limites-connues)

---

## Prérequis

| Outil | Pour quoi | Version |
| --- | --- | --- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Faire tourner le serveur | récente |
| [Node.js](https://nodejs.org/) | Développement uniquement | **24 LTS** (voir `.nvmrc`) |
| Git | Récupérer le code | — |

Aucun compte Cloudflare n'est nécessaire pour démarrer (Quick Tunnel).

---

## Lancer le serveur

```bash
git clone https://github.com/Dioman-Keita/converse.git
cd converse
cp .env.example .env
```

Ouvre `.env` et remplace `DB_PASSWORD=change-me` par un mot de passe long et aléatoire. Il ne sert qu'entre les conteneurs, tu n'auras jamais à le taper.

```bash
docker compose up -d
```

Le premier lancement construit l'image (quelques minutes). Ensuite :

- l'app est disponible sur **http://localhost:3000** (sur ton PC uniquement) ;
- la base est créée et mise à jour automatiquement au démarrage ;
- une première sauvegarde est écrite dans `./backups`.

Vérifier que tout tourne :

```bash
docker compose ps
```

---

## Rendre l'app accessible depuis Internet

### Option rapide : Quick Tunnel (aucun compte, aucun domaine)

```bash
docker compose --profile quick-tunnel up -d
```

Récupérer l'adresse publique :

```bash
docker compose logs quick-tunnel | grep trycloudflare.com
```

Tu obtiens une adresse du type `https://mots-au-hasard.trycloudflare.com` : c'est celle à partager. Elle fonctionne en HTTPS, en 4G comme en Wi-Fi, sans rien configurer sur ta box.

> ⚠️ **L'adresse change à chaque redémarrage** du tunnel (redémarrage du PC, de Docker, ou `docker compose down`). Il faut alors repartager la nouvelle. Pour une adresse permanente, voir [Avoir une URL fixe](#avoir-une-url-fixe).

### Option durable : tunnel nommé Cloudflare (ton domaine)

Voir la section suivante.

---

## Avoir une URL fixe

Une adresse qui ne change jamais est indispensable pour partager un lien durable et pour la future app Android. Il faut que **quelque chose** sur Internet ait une adresse permanente ; voici les options, de la plus recommandée à la moins adaptée.

### 1. Un nom de domaine + tunnel nommé Cloudflare — recommandé

**Coût : ~10 €/an pour le domaine. Le tunnel reste gratuit (plan Free Cloudflare).**

Un tunnel nommé exige un domaine dont les DNS sont gérés par Cloudflare. Tu obtiens une adresse comme `https://chat.mondomaine.com`.

1. Achète un domaine (par exemple via Cloudflare Registrar, vendu à prix coûtant) ou ajoute à Cloudflare un domaine que tu possèdes déjà (plan **Free**).
2. Dans le tableau de bord Cloudflare : **Zero Trust → Networks → Tunnels → Create a tunnel** → type **Cloudflared**.
3. Donne-lui un nom (`converse`), puis copie le **token** affiché (la longue chaîne après `--token`).
4. Onglet **Public Hostname** : sous-domaine `chat`, domaine `mondomaine.com`, service `HTTP` → `app:3000`.
5. Colle le token dans `.env` :
   ```
   TUNNEL_TOKEN=eyJhIjoi...
   ```
6. Lance le profil `tunnel` (à la place de `quick-tunnel`) :
   ```bash
   docker compose --profile quick-tunnel down
   docker compose --profile tunnel up -d
   ```

L'adresse `https://chat.mondomaine.com` reste la même pour toujours, même si tu changes de PC.

### 2. Tailscale Funnel — gratuit, sans domaine (pas encore intégré)

Tailscale propose gratuitement une adresse fixe du type `https://mon-pc.nom-du-reseau.ts.net`. C'est la meilleure option **gratuite et sans domaine**, mais elle n'est pas encore intégrée au `docker-compose.yml` et le fonctionnement du WebSocket à travers Funnel reste à vérifier. Le domaine `ts.net` ne peut pas être personnalisé.

### 3. ngrok (domaine statique gratuit) — déconseillé pour l'app web

ngrok offre un domaine statique gratuit, mais sur le plan gratuit **chaque visiteur voit d'abord une page d'avertissement ngrok** avant d'arriver sur l'app. Acceptable pour l'API d'une app mobile (contournable par un en-tête), pas pour des amis qui ouvrent un lien dans leur navigateur.

---

## Utiliser l'app

1. Ouvre l'adresse (locale ou publique) et clique sur **Create account**.
2. Une fois connecté, clique sur l'icône **New conversation** (en haut à gauche) :
   - **Direct** : l'email d'une personne déjà inscrite ;
   - **Group** : un nom de groupe + les emails des membres, séparés par des virgules.
3. Les messages arrivent en temps réel. `Entrée` envoie, `Maj + Entrée` fait un retour à la ligne.
4. Une pastille indique les messages non lus ; le point sous ton nom indique l'état de la connexion (**Online**, **Connecting…**, **Offline — reconnecting**).

Bon à savoir :
- les personnes doivent **s'inscrire avant** qu'on puisse démarrer une conversation avec elles ;
- ouvrir une conversation directe qui existe déjà la rouvre au lieu d'en créer une deuxième ;
- un message non parti s'affiche en rouge : touche-le pour le renvoyer.

---

## Exploitation au quotidien

| Action | Commande |
| --- | --- |
| Démarrer (avec Quick Tunnel) | `docker compose --profile quick-tunnel up -d` |
| Voir l'adresse publique | `docker compose logs quick-tunnel \| grep trycloudflare.com` |
| État des services | `docker compose ps` |
| Logs du serveur | `docker compose logs -f app` |
| Arrêter (les données sont conservées) | `docker compose --profile quick-tunnel down` |
| Couper seulement l'accès public | `docker compose stop quick-tunnel` |
| Mettre à jour après un `git pull` | `docker compose --profile quick-tunnel up -d --build` |

### Garder le PC disponible

Le chat n'est accessible que si ton PC est **allumé et éveillé** :

- Windows : *Paramètres → Système → Alimentation → Mise en veille* → **Jamais** (au moins sur secteur).
- Docker Desktop : *Settings → General* → **Start Docker Desktop when you sign in**. Les conteneurs redémarrent seuls (`restart: unless-stopped`), mais l'adresse Quick Tunnel, elle, change.

### Supprimer les comptes de test

```bash
docker compose exec db psql -U converse -d converse -c "delete from users where email like '%@test.local' or email like '%@t.l';"
```

Leurs sessions, adhésions et messages sont supprimés en cascade.

---

## Sauvegardes et restauration

Le service `backup` écrit un dump Postgres compressé dans `./backups` **au démarrage puis toutes les 24 h**, et garde les **7 derniers** (réglable via `BACKUP_KEEP` et `BACKUP_INTERVAL` dans `.env`).

Forcer une sauvegarde immédiate :

```bash
docker compose restart backup
```

Pour mettre tes sauvegardes à l'abri, synchronise le dossier `backups/` avec OneDrive ou Google Drive. Ne synchronise **jamais** `data/` : c'est la base en cours d'utilisation, la copier pendant qu'elle tourne peut la corrompre.

### Restaurer une sauvegarde

```bash
docker compose stop app
docker compose exec -T db pg_restore -U converse -d converse --clean --if-exists < backups/converse-AAAAMMJJ-HHMMSS.dump
docker compose start app
```

### Changer de machine

1. Sur la nouvelle machine : `git clone`, puis copie ton `.env` et le dernier fichier de `backups/`.
2. `docker compose up -d`, puis restaure la sauvegarde (commande ci-dessus).
3. Avec un tunnel nommé, l'adresse publique reste la même ; avec Quick Tunnel, une nouvelle adresse est générée.

---

## Développement

```bash
npm install
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

Renseigne dans `.env` une `DATABASE_URL` qui pointe vers `localhost:5432` avec ton `DB_PASSWORD` (voir `.env.example`), puis :

```bash
npm run dev
```

L'app de dev tourne sur http://localhost:3000 : arrête d'abord le conteneur `app` (`docker compose stop app`) pour libérer le port, ou lance `npm run dev -- --port 3001`.

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de dev (Vite + Nitro, rechargement à chaud) |
| `npm run build` | Build de production dans `.output/` |
| `npm run lint` / `npm run format` / `npm run check` | ESLint et Prettier |
| `npm run generate-routes` | Régénère `src/routeTree.gen.ts` |
| `npm run db:generate` | Crée une migration après modification de `server/db/schema.ts` |
| `npm run db:studio` | Explorateur de base Drizzle Studio |
| `npm run test:e2e` | Tests d'intégration du serveur (REST + WebSocket) contre le build et un vrai Postgres |

Les migrations sont appliquées automatiquement au démarrage du serveur.

### Tests d'intégration

`tests/e2e/` lance le serveur buildé (`node .output/server/index.mjs`) sur le port 3123 et le teste contre une base Postgres **dédiée** : les tests y créent des comptes et des salons, ne les pointe jamais vers la vraie base.

```bash
docker run -d --name converse-e2e-db -p 127.0.0.1:55432:5432 -e POSTGRES_USER=converse -e POSTGRES_PASSWORD=converse -e POSTGRES_DB=converse_test postgres:17
```

```bash
npm run build
```

```bash
npm run test:e2e
```

Variables facultatives : `E2E_DATABASE_URL` (par défaut `postgres://converse:converse@127.0.0.1:55432/converse_test`), `E2E_PORT` (par défaut `3123`) et `E2E_SERVER_LOG=1` pour afficher les logs du serveur. Pense à relancer `npm run build` après une modification de `server/`.

La CI GitHub Actions (`.github/workflows/ci.yml`) exécute sur chaque PR et chaque push sur `main` : vérification des types, ESLint, build puis ces tests avec un service `postgres:17`.

### Organisation du code

```
server/          # backend Nitro
  api/           # REST → /api/*
  routes/ws.ts   # WebSocket → /ws
  db/            # schéma Drizzle, client, migrations
  utils/         # auth, hub temps réel, salons, messages
src/             # client web — Feature-Sliced Design
  app/ pages/ widgets/ features/ entities/ shared/
  routes/        # routes TanStack (fines, délèguent aux pages)
tests/e2e/       # tests d'intégration du serveur (Vitest)
```

---

## Dépannage

**`failed to fetch oauth token … auth.docker.io … getaddrinfow`** pendant un `docker compose up`
Docker Desktop n'arrive pas à résoudre Docker Hub (DNS). Réessaie quelques fois ; si ça persiste, règle le DNS de ta connexion Windows sur `1.1.1.1` ou `8.8.8.8`.

**`listen EACCES: permission denied` sur un port**
Windows réserve certaines plages de ports (Hyper-V). Choisis un autre port.

**L'app affiche « Offline — reconnecting »**
Le WebSocket est coupé ; il se reconnecte seul (et immédiatement au retour sur l'onglet). Les messages envoyés pendant ce temps passent par HTTP. Si ça dure : `docker compose ps` et `docker compose logs app`.

**L'adresse trycloudflare ne répond plus**
Le tunnel a redémarré et l'adresse a changé : récupère la nouvelle avec `docker compose logs quick-tunnel | grep trycloudflare.com`.

**Redirigé vers la page de connexion**
La session a expiré (30 jours) ou tu t'es déconnecté ailleurs : reconnecte-toi.

---

## Limites connues

- **PC éteint = chat hors ligne.** Pour du 24 h/24, la même stack tourne telle quelle sur un petit VPS ou un Raspberry Pi.
- **Pas de notifications push** : un message n'est visible qu'avec l'app ouverte (prévu ainsi pour l'app web et la future app Android).
- **Pas de mot de passe oublié** ni de connexion Google.
- **Un seul serveur** : le temps réel est géré en mémoire, adapté à un usage entre amis ou en petite équipe.
