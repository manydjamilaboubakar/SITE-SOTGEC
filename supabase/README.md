# SOTGEC — enregistrement des demandes du site + notification email

Corrige l'écart d'audit : les formulaires (Contact, BTP, Immobilier, Consulting)
ouvraient WhatsApp ou l'email du visiteur sans rien enregistrer. Ils enregistrent
maintenant chaque demande dans Supabase, puis déclenchent un email interne.

Projet Supabase actif : **SITE-SOTGEC** (`zgxvihvyjaeomezpwngq`, région
eu-central-1, organisation « sotgec »). L'ancien projet
(`icjpmboahhsovvcijvhs`) est resté en pause plus de 400 jours et n'a pas pu
être restauré (limite définitive de Supabase) ; il a été supprimé et
remplacé par celui-ci le 28/09/2026.

## État : ce qui est déjà fait

- Table `demandes_site` créée (migration `0001_demandes_site.sql`), RLS
  activée, fermée par défaut (aucun accès avec la clé publique du site).
- Fonction Edge `notify-lead` déployée et active
  (`https://zgxvihvyjaeomezpwngq.supabase.co/functions/v1/notify-lead`,
  sans vérification JWT — c'est un point d'entrée public, comme n'importe
  quel formulaire de contact). Elle fait deux choses à chaque appel :
  1. enregistre la demande dans `demandes_site` avec la clé `service_role`
     (le site n'a besoin d'aucune clé secrète pour ça) ;
  2. envoie un email interne via l'**API Hostinger**, depuis la vraie boîte
     du domaine `manydjamilaboubakar@sotgec.com` (déjà active chez
     l'hébergeur du site), vers `sotgec.btp@gmail.com` — la boîte déjà
     surveillée par l'équipe.
- `assets/js/site.js` appelle cette fonction à chaque clic WhatsApp/email
  des formulaires, avec l'URL et la clé publique du projet déjà renseignées
  (`site.js?v=5` sur les 19 pages du site).

### Pourquoi Hostinger plutôt que Gmail

La première version envoyait via Gmail SMTP (`sotgec.btp@gmail.com` +
mot de passe d'application). En creusant la question « pourquoi pas une
adresse @sotgec.com ? », on a trouvé que `manydjamilaboubakar@sotgec.com`
est déjà une boîte active chez l'hébergeur Hostinger, avec une API d'envoi
directe. On a donc basculé dessus : l'email affiche maintenant l'expéditeur
« SOTGEC Site » sur le domaine `sotgec.com` (plus professionnel qu'un
Gmail), et il n'y a plus besoin de gérer un mot de passe d'application
Google. Limite à connaître : l'API Hostinger n'accepte pas d'en-tête
Reply-To personnalisé — le contact du visiteur reste affiché dans le corps
de l'email, mais l'équipe doit le copier manuellement pour répondre plutôt
que de cliquer « Répondre ».

## Ce qu'il reste à faire (≈ 5 minutes)

1. **Générer un jeton API Hostinger** :
   - Se connecter à [hPanel](https://hpanel.hostinger.com).
   - Dans le menu de gauche, ouvrir **Dev Tools → API**.
   - Cliquer **Generate Token**, lui donner un nom (« SOTGEC site »), choisir
     la date d'expiration la plus longue proposée (à renouveler avant cette
     date — Hostinger n'offre pas toujours une option « sans expiration »).
   - Cliquer **Generate**, puis copier immédiatement le jeton affiché : il
     ne sera plus jamais réaffiché après un rafraîchissement de la page.
2. **Ajouter le secret dans Supabase** (tableau de bord Supabase → projet
   SITE-SOTGEC → Edge Functions → `notify-lead` → Secrets, ou en ligne de
   commande depuis un poste avec la CLI Supabase installée) :
   ```
   supabase secrets set HOSTINGER_API_TOKEN=xxxxxxxxxxxxxxxx --project-ref zgxvihvyjaeomezpwngq
   ```
3. **Tester** : soumettre le formulaire sur sotgec.com/contact/ et vérifier
   qu'un email arrive dans la minute à `sotgec.btp@gmail.com`.

Tant que `HOSTINGER_API_TOKEN` n'est pas défini, la demande est quand même
enregistrée dans Supabase (le point le plus important) ; seul l'email
échoue, silencieusement, et la ligne reste marquée « non notifiée »
(colonnes `notifie` / `notifie_erreur` dans la table).

## Ce que ça change pour l'équipe

- Chaque demande reste visible dans Supabase même si le visiteur ferme
  WhatsApp sans envoyer, ou change d'avis pour l'email.
- Un email arrive automatiquement à `sotgec.btp@gmail.com`, affiché comme
  venant de « SOTGEC Site » sur le domaine `sotgec.com`, dès que le jeton
  API (étape 1-2 ci-dessus) est configuré.
- La colonne `statut` (nouveau / contacté / en cours / gagné / perdu) permet
  un suivi commercial simple directement dans la table (visible dans le
  tableau de bord Supabase → Table Editor → demandes_site).
- Aucune donnée n'est lisible avec la clé publique utilisée sur le site :
  seule l'équipe (accès Supabase) peut consulter les demandes.
