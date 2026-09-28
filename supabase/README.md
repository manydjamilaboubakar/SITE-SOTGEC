# SOTGEC — enregistrement des demandes du site + notification email

Corrige l'écart d'audit : les formulaires (Contact, BTP, Immobilier, Consulting)
ouvraient WhatsApp ou l'email du visiteur sans rien enregistrer. Ils enregistrent
maintenant chaque demande dans Supabase, puis déclenchent un email interne.

## Ce qui est prêt dans ce dépôt

- `supabase/migrations/0001_demandes_site.sql` — table `demandes_site`, RLS
  (le site ne peut qu'AJOUTER une ligne, jamais lire), déclencheur d'email.
- `supabase/functions/notify-lead/index.ts` — fonction qui envoie l'email
  interne à chaque nouvelle demande, via le compte Gmail existant
  `sotgec.btp@gmail.com` (SMTP + mot de passe d'application — aucun nouveau
  prestataire, aucun nouveau compte à créer).
- `assets/js/site.js` — les formulaires enregistrent la demande avant
  d'ouvrir WhatsApp ou l'email (silencieux et sans régression tant que la
  clé publique n'est pas renseignée : `SUPABASE_ANON_KEY=''`).

## Pour activer (≈ 10 minutes), dans cet ordre

1. **Réactiver le projet Supabase** `sotgec.btp@gmail.com's Project`
   (`icjpmboahhsovvcijvhs`, région eu-west-3) : il est en pause pour
   inactivité. Réactivation depuis le tableau de bord supabase.com, ou en me
   redonnant la main ici.
2. **Appliquer la migration** `0001_demandes_site.sql` (crée la table).
3. **Générer un mot de passe d'application Gmail** pour
   `sotgec.btp@gmail.com` :
   - Activer la validation en deux étapes sur ce compte si ce n'est pas déjà
     fait (myaccount.google.com/security).
   - Puis créer un mot de passe d'application sur
     [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
     (choisir « Autre », nommer « SOTGEC site »). Google donne un code à
     16 caractères — c'est lui qu'il faut copier, jamais le mot de passe du
     compte Gmail.
4. **Définir les secrets** de la fonction :
   ```
   supabase secrets set GMAIL_USER=sotgec.btp@gmail.com --project-ref icjpmboahhsovvcijvhs
   supabase secrets set GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx --project-ref icjpmboahhsovvcijvhs
   supabase secrets set NOTIFY_TO=sotgec.btp@gmail.com --project-ref icjpmboahhsovvcijvhs
   ```
5. **Déployer la fonction** `notify-lead`.
6. **Récupérer la clé publique** (publishable/anon key) du projet et la
   coller dans `assets/js/site.js`, ligne `SUPABASE_ANON_KEY=''`.

Pourquoi Gmail plutôt que Resend : aucun nouveau compte tiers, aucune
vérification de domaine à faire, et l'adresse `sotgec.btp@gmail.com` est déjà
celle que l'équipe surveille. Limite Gmail SMTP : 500 emails/jour, largement
suffisant pour le volume de demandes actuel.

## Ce que ça change pour l'équipe

- Chaque demande reste visible dans Supabase même si le visiteur ferme
  WhatsApp sans envoyer, ou change d'avis pour l'email.
- Un email arrive automatiquement à `sotgec.btp@gmail.com` (ou l'adresse
  choisie) à chaque nouvelle demande.
- La colonne `statut` (nouveau / contacté / en cours / gagné / perdu) permet
  un suivi commercial simple directement dans la table.
- Aucune donnée personnelle n'est lisible avec la clé publique utilisée sur
  le site : seule l'équipe (accès Supabase) peut consulter les demandes.
