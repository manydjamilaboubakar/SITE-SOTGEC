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
  2. envoie un email interne via le compte Gmail existant
     `sotgec.btp@gmail.com` (SMTP + mot de passe d'application — pas de
     nouveau compte tiers).
- `assets/js/site.js` appelle cette fonction à chaque clic WhatsApp/email
  des formulaires, avec l'URL et la clé publique du nouveau projet déjà
  renseignées (`site.js?v=5` sur les 19 pages du site).

## Ce qu'il reste à faire (≈ 5 minutes)

1. **Fusionner la pull request** qui contient tout ce qui précède :
   https://github.com/manydjamilaboubakar/SITE-SOTGEC/pull/1 — bouton vert
   « Merge pull request » sur GitHub. Sans risque : tant que ce n'est pas
   fusionné, le site en ligne continue d'utiliser l'ancien comportement
   (WhatsApp/email uniquement).
2. **Générer un mot de passe d'application Gmail** pour
   `sotgec.btp@gmail.com`, pour que l'email interne parte réellement (sans
   ça, la demande est quand même enregistrée dans Supabase — seul l'email
   ne part pas) :
   - Activer la validation en deux étapes sur ce compte si ce n'est pas déjà
     fait (myaccount.google.com/security).
   - Créer un mot de passe d'application sur
     [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
     (choisir « Autre », nommer « SOTGEC site »). Google donne un code à
     16 caractères — c'est lui qu'il faut copier, jamais le mot de passe du
     compte Gmail.
   - Définir les secrets de la fonction (depuis un poste avec la CLI
     Supabase installée, ou via le tableau de bord Supabase → Edge
     Functions → notify-lead → Secrets) :
     ```
     supabase secrets set GMAIL_USER=sotgec.btp@gmail.com --project-ref zgxvihvyjaeomezpwngq
     supabase secrets set GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx --project-ref zgxvihvyjaeomezpwngq
     ```

Pourquoi Gmail plutôt que Resend : aucun nouveau compte tiers, aucune
vérification de domaine à faire, et l'adresse `sotgec.btp@gmail.com` est déjà
celle que l'équipe surveille. Limite Gmail SMTP : 500 emails/jour, largement
suffisant pour le volume de demandes actuel.

## Ce que ça change pour l'équipe

- Chaque demande reste visible dans Supabase même si le visiteur ferme
  WhatsApp sans envoyer, ou change d'avis pour l'email.
- Un email arrive automatiquement à `sotgec.btp@gmail.com` dès que le mot
  de passe d'application (étape 2 ci-dessus) est configuré.
- La colonne `statut` (nouveau / contacté / en cours / gagné / perdu) permet
  un suivi commercial simple directement dans la table (visible dans le
  tableau de bord Supabase → Table Editor → demandes_site).
- Aucune donnée n'est lisible avec la clé publique utilisée sur le site :
  seule l'équipe (accès Supabase) peut consulter les demandes.
