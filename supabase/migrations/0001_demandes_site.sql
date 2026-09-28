-- SOTGEC — enregistrement des demandes envoyées depuis les formulaires du site
-- (contact, BTP, Immobilier, Consulting) + notification email automatique.
-- Corrige l'écart d'audit n°1 : "Rien n'est enregistré sur ce site."
--
-- Architecture : le site appelle directement la fonction Edge "notify-lead"
-- (voir supabase/functions/notify-lead), qui enregistre la ligne avec la clé
-- service_role PUIS envoie l'email interne. Le site n'a donc besoin d'aucune
-- clé pour écrire dans la table (pas d'INSERT anonyme côté client), ce qui
-- évite de dépendre du schéma interne supabase_functions/pg_net (webhooks
-- DB) qui n'est pas toujours provisionné sur un projet tout juste créé.

create table if not exists public.demandes_site (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- quelle activité / boîte mail visée (correspond à data-mailbox du formulaire)
  entite text not null check (entite in ('contact','btp','immobilier','consulting')),
  page_source text,              -- url de la page d'origine, ex: https://sotgec.com/immobilier/
  langue text default 'fr',      -- 'fr' ou 'en'

  -- contenu du formulaire
  nom text not null,
  contact text not null,         -- téléphone ou email saisi par le visiteur
  sujet text,                    -- option choisie (ex: "Diagnostic HSE")
  pays text check (pays in ('td','ci')),
  message text not null,

  -- canal choisi par le visiteur
  canal text not null check (canal in ('whatsapp','email')),

  -- suivi de la notification interne (rempli par la fonction notify-lead)
  notifie boolean not null default false,
  notifie_a timestamptz,
  notifie_erreur text,

  -- suivi commercial manuel (rempli plus tard par l'équipe)
  statut text not null default 'nouveau' check (statut in ('nouveau','contacte','en_cours','gagne','perdu')),
  note_interne text
);

comment on table public.demandes_site is 'Demandes envoyées depuis les formulaires du site sotgec.com (tous les métiers). Insérée par la fonction Edge notify-lead (clé service_role) — le site n''écrit jamais directement dans cette table.';

-- Row Level Security : personne ne peut lire, modifier ou supprimer avec la
-- clé publique du site. Seule la clé "service role" (utilisée par la
-- fonction notify-lead et par l'équipe via le tableau de bord Supabase) a
-- accès. Aucune police pour "anon" : la table est fermée par défaut dès que
-- RLS est activée, ce qui est le comportement voulu ici.
alter table public.demandes_site enable row level security;

-- Index utiles pour le suivi (tableau de bord, tri par date/entité/statut)
create index if not exists demandes_site_created_at_idx on public.demandes_site (created_at desc);
create index if not exists demandes_site_entite_idx on public.demandes_site (entite);
create index if not exists demandes_site_statut_idx on public.demandes_site (statut);
