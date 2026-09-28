// SOTGEC — notify-lead
// Point d'entrée unique appelé directement par le site (assets/js/site.js)
// à chaque soumission de formulaire (Contact, BTP, Immobilier, Consulting) :
//   1. enregistre la demande dans public.demandes_site (clé service_role —
//      le site n'a besoin d'aucune clé pour écrire dans la table) ;
//   2. envoie un email interne via l'API Hostinger, depuis la vraie boîte
//      du domaine manydjamilaboubakar@sotgec.com (déjà active chez
//      l'hébergeur du site). Destinataire principal : sotgec.btp@gmail.com
//      (la boîte déjà surveillée par l'équipe, jamais retirée — garantit
//      qu'aucune demande n'est manquée). Copie (cc) : l'alias du
//      département concerné (btp@/immobilier@/consulting@/contact@
//      sotgec.com), pour que chaque département reçoive et puisse répondre
//      directement à ses propres demandes dès que ces boîtes existent
//      réellement chez l'hébergeur — voir la remarque plus bas.
//
// Secret à définir avant que l'email fonctionne (voir supabase/README.md) :
//   supabase secrets set HOSTINGER_API_TOKEN=xxxxxxxx --project-ref zgxvihvyjaeomezpwngq
//
// Tant que ce secret n'est pas défini, la demande est quand même
// enregistrée (le point le plus important) ; seul l'email échoue,
// silencieusement, et la ligne reste marquée "non notifiée".
//
// Limite connue n°1 : l'API Hostinger "send" n'accepte pas d'en-tête
// Reply-To personnalisé. Le contact du visiteur reste bien visible dans le
// corps de l'email ; il faut le copier manuellement pour répondre, plutôt
// que de cliquer "Répondre".
//
// Limite connue n°2 (à vérifier) : au 28/09/2026, seule la boîte
// manydjamilaboubakar@sotgec.com est confirmée comme mailbox Hostinger
// réelle (interrogée via l'API). Les adresses btp@/immobilier@/
// consulting@/contact@sotgec.com utilisées ci-dessous en copie n'ont pas pu
// être confirmées comme boîtes existantes — si elles n'existent pas
// encore, la copie échoue silencieusement côté Hostinger (l'email
// principal vers sotgec.btp@gmail.com part quand même) et il suffira de
// les créer dans hPanel pour que le routage par département s'active tout
// seul, sans autre changement de code.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const HOSTINGER_API_TOKEN = Deno.env.get("HOSTINGER_API_TOKEN");
const HOSTINGER_MAILBOX_ID = Deno.env.get("HOSTINGER_MAILBOX_ID") ?? "ACc2442f9422dc0b4168109c49c0c9"; // manydjamilaboubakar@sotgec.com
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "sotgec.btp@gmail.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ENTITE_LABEL: Record<string, string> = {
  contact: "SOTGEC Contact",
  btp: "SOTGEC BTP",
  immobilier: "SOTGEC Immobilier",
  consulting: "SOTGEC Consulting",
};

// Alias de département — copiés sur chaque notification pour que le bon
// département reçoive ses propres demandes. Correspond aux data-mailbox
// utilisés côté site (assets/js/site.js).
const ENTITE_CC: Record<string, string> = {
  contact: "contact@sotgec.com",
  btp: "btp@sotgec.com",
  immobilier: "immobilier@sotgec.com",
  consulting: "consulting@sotgec.com",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const input = await req.json();

    // Validation minimale : on refuse d'enregistrer une ligne vide, mais on
    // ne bloque jamais le visiteur pour un champ optionnel manquant.
    if (!input.entite || !input.nom || !input.contact || !input.message || !input.canal) {
      return new Response(JSON.stringify({ ok: false, error: "Champs requis manquants" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: record, error: insertError } = await supabase
      .from("demandes_site")
      .insert({
        entite: input.entite,
        page_source: input.page_source ?? null,
        langue: input.langue ?? "fr",
        nom: String(input.nom).slice(0, 200),
        contact: String(input.contact).slice(0, 200),
        sujet: input.sujet ? String(input.sujet).slice(0, 200) : null,
        pays: input.pays ?? null,
        message: String(input.message).slice(0, 5000),
        canal: input.canal,
      })
      .select()
      .single();

    if (insertError || !record) {
      return new Response(JSON.stringify({ ok: false, error: insertError?.message ?? "insert failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (!HOSTINGER_API_TOKEN) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: "HOSTINGER_API_TOKEN non configuré" })
        .eq("id", record.id);
      return new Response(JSON.stringify({ ok: true, id: record.id, emailed: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const entiteLabel = ENTITE_LABEL[record.entite] ?? record.entite;
    const sujet = `Nouvelle demande SOTGEC — ${entiteLabel}${record.sujet ? " · " + record.sujet : ""}`;
    const pays = record.pays === "ci" ? "Côte d'Ivoire" : record.pays === "td" ? "Tchad" : "—";

    const html = `
      <h2>${sujet}</h2>
      <p><strong>Nom :</strong> ${escapeHtml(record.nom)}<br/>
      <strong>Contact :</strong> ${escapeHtml(record.contact)}<br/>
      <strong>Pays du projet :</strong> ${pays}<br/>
      <strong>Canal choisi par le visiteur :</strong> ${record.canal === "whatsapp" ? "WhatsApp" : "Email"}<br/>
      <strong>Page :</strong> ${escapeHtml(record.page_source ?? "")}</p>
      <p><strong>Message :</strong><br/>${escapeHtml(record.message).replace(/\n/g, "<br/>")}</p>
      <hr/>
      <p style="color:#666;font-size:12px">Enregistré automatiquement dans Supabase (table demandes_site, id ${record.id}). Pour répondre au visiteur, utilisez directement son contact ci-dessus (l'API d'envoi ne permet pas de Reply-To personnalisé).</p>
    `;
    const text = [
      sujet,
      "",
      `Nom : ${record.nom}`,
      `Contact : ${record.contact}`,
      `Pays du projet : ${pays}`,
      `Canal choisi par le visiteur : ${record.canal === "whatsapp" ? "WhatsApp" : "Email"}`,
      `Page : ${record.page_source ?? ""}`,
      "",
      "Message :",
      record.message,
      "",
      `— Enregistré automatiquement dans Supabase (id ${record.id})`,
    ].join("\n");

    const ccAddress = ENTITE_CC[record.entite];
    const cc = ccAddress && ccAddress !== NOTIFY_TO ? [ccAddress] : undefined;

    try {
      const res = await fetch(
        `https://api.mail.hostinger.com/api/v1/mailboxes/${HOSTINGER_MAILBOX_ID}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HOSTINGER_API_TOKEN}`,
          },
          body: JSON.stringify({
            to: [NOTIFY_TO],
            ...(cc ? { cc } : {}),
            displayName: entiteLabel,
            subject: sujet,
            html,
            text,
          }),
        },
      );
      if (res.status !== 204) {
        const detail = await res.text();
        throw new Error(`Hostinger API ${res.status}: ${detail.slice(0, 500)}`);
      }
    } catch (mailErr) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: `Hostinger: ${String(mailErr).slice(0, 500)}` })
        .eq("id", record.id);
      return new Response(JSON.stringify({ ok: true, id: record.id, emailed: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    await supabase
      .from("demandes_site")
      .update({ notifie: true, notifie_a: new Date().toISOString(), notifie_erreur: null })
      .eq("id", record.id);

    return new Response(JSON.stringify({ ok: true, id: record.id, emailed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
