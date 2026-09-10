# Guide de Déploiement Local / Self-Hosted : Khatt-GPT + Supabase sur Coolify (Disque 2 To)

Ce document fournit le protocole complet et le **prompt prêt à l'emploi** pour déployer Khatt-GPT et l'ensemble de la suite Supabase (Postgres avec pgvector, Auth, REST, Storage) sur votre VPS sous Coolify, en raccordant directement le stockage au disque dur de **2 To**.

---

## 1. Préparation du Disque 2 To sur le VPS

Avant de lancer le projet dans Coolify, identifiez le point de montage de votre disque de 2 To sur votre serveur :

```bash
# 1. Lister les disques et partitions
lsblk
df -h
```

Repérez votre disque de 2 To (par exemple `/mnt/data2tb` ou `/mnt/storage`).
Créez les répertoires dédiés à Khatt-GPT avec les permissions requises :

```bash
# Remplacez /mnt/data2tb par le chemin réel de votre disque
sudo mkdir -p /mnt/data2tb/khatt-gpt/postgres
sudo mkdir -p /mnt/data2tb/khatt-gpt/storage
sudo chmod -R 777 /mnt/data2tb/khatt-gpt
```

---

## 2. Déploiement dans Coolify (Projet Unique)

### Étape A : Création de la ressource dans Coolify
1. Dans l'interface Coolify, créez un nouveau projet : **Khatt-GPT**.
2. Cliquez sur **+ New Resource** -> **Docker Compose**.
3. Liez votre dépôt Git (ex: `git@github.com:h-yassin-ai/waraka.git`) ou collez directement le contenu du fichier `docker-compose.coolify.yml`.

### Étape B : Variables d'environnement Coolify
Dans l'onglet **Environment Variables** de votre ressource Coolify, renseignez :

| Variable | Valeur recommandée | Description |
| :--- | :--- | :--- |
| `DATA_PATH` | `/mnt/data2tb/khatt-gpt` | **Point de montage de votre disque 2 To** |
| `SITE_URL` | `https://khatt.mondomaine.com` | URL publique de votre instance |
| `POSTGRES_PASSWORD` | *(Mot de passe sécurisé)* | Mot de passe base de données |
| `JWT_SECRET` | *(Chaîne aléatoire 32+ car.)* | Secret pour les tokens Supabase |
| `ANON_KEY` | *(Clé anon générée via JWT)* | Clé publique anonyme Supabase |
| `SERVICE_ROLE_KEY` | *(Clé service générée)* | Clé administrateur Supabase |
| `ADMIN_EMAILS` | `votre-email@domaine.com` | Liste des administrateurs de Khatt-GPT |

---

## 3. Initialisation de la Base de Données

Une fois le conteneur `supabase-db` démarré :
1. Accédez à Supabase Studio sur le port `3001` (ex: `http://votre-ip-vps:3001`).
2. Ouvrez l'éditeur SQL (**SQL Editor**) et exécutez dans l'ordre les scripts du dossier `docs/` :
   - `docs/supabase_setup.sql` (Tables de profils, gamification et triggers utilisateurs).
   - `docs/migration_manuscript_resources.sql` (Ressources PDF et flags de signalement).
   - `docs/migration_manuscript_proposals.sql` (Système de propositions ouvertes et métadonnées académiques).

---

## 4. Le Prompt Prêt à l'Emploi pour le VPS

Lorsque vous me donnerez l'accès au terminal de votre VPS ou à une invite de commande serveur, copiez et collez simplement ce prompt :

```text
Bonjour ! Tu es maintenant connecté à mon VPS Linux disposant d'un disque dur de 2 To. 
Le projet Khatt-GPT (dépôt h-yassin-ai/waraka) doit y être déployé sous Coolify / Docker avec sa stack Supabase locale complète.

Tâches à exécuter :
1. Vérifie le point de montage de mon disque dur de 2 To avec `lsblk` et `df -h` et prépare le répertoire persistant `khatt-gpt/postgres` et `khatt-gpt/storage` avec les bonnes permissions.
2. Déploie la stack en utilisant le fichier `docker-compose.coolify.yml` et le `Dockerfile` présents à la racine du projet.
3. Assure-toi que les variables d'environnement (DATA_PATH, POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, ADMIN_EMAILS) sont correctement injectées.
4. Exécute les migrations SQL initiales (`docs/supabase_setup.sql`, `docs/migration_manuscript_resources.sql`, `docs/migration_manuscript_proposals.sql`) dans le conteneur PostgreSQL.
5. Vérifie que les services (Khatt-GPT Next.js, Postgres pgvector, Auth, PostgREST, Storage sur disque 2To, Kong Gateway) sont tous UP et fonctionnels.
```
