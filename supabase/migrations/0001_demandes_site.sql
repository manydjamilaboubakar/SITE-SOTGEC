-- SOTGEC — enregistrement des demandes envoyées depuis les formulaires du site
-- (contact, BTP, Immobilier, Consulting) + notification email automatique.
--
-- À appliquer une fois le projet Supabase réactivé (il est en pause au 28/09/2026).
-- Corrige l'écart d'audit n°1 : "Rien n'est enregistré sur ce site."

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

comment on table public.demandes_site is 'Demandes envoyées depuis les formulaires du site sotgec.com (tous les métiers). Alimentée côté client par assets/js/site.js.';

-- Row Level Security : le site (clé publique/anon) peut seulement AJOUTER une ligne.
-- Personne ne peut lire, modifier ou supprimer avec la clé publique : seule la
-- clé "service role" (utilisée par la fonction notify-lead et par l'équipe via
-- le tableau de bord Supabase) a accès en lecture.
alter table public.demandes_site enable row level security;

create policy "le site peut enregistrer une demande"
  on public.demandes_site
  for insert
  to anon
  with check (true);

-- Index utiles pour le suivi (tableau de bord, tri par date/entité/statut)
create index if not exists demandes_site_created_at_idx on public.demandes_site (created_at desc);
create index if not exists demandes_site_entite_idx on public.demandes_site (entite);
create index if not exists demandes_site_statut_idx on public.demandes_site (statut);

-- Déclenche automatiquement la fonction "notify-lead" (email interne) à chaque
-- nouvelle demande. supabase_functions.http_request est fournie par défaut
-- par Supabase (même mécanisme que les Database Webhooks créés depuis le
-- tableau de bord).
create trigger on_nouvelle_demande
  after insert on public.demandes_site
  for each row
  execute function supabase_functions.http_request(
    'https://icjpmboahhsovvcijvhs.supabase.co/functions/v1/notify-lead',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
