// SOTGEC — notify-lead
// Point d'entrée unique appelé directement par le site (assets/js/site.js)
// à chaque soumission de formulaire (Contact, BTP, Immobilier, Consulting) :
//   1. enregistre la demande dans public.demandes_site (clé service_role —
//      le site n'a besoin d'aucune clé pour écrire dans la table) ;
//   2. envoie un email interne via le compte Gmail existant
//      sotgec.btp@gmail.com (SMTP + mot de passe d'application).
//
// Secrets à définir avant que l'email fonctionne (voir supabase/README.md) :
//   supabase secrets set GMAIL_USER=sotgec.btp@gmail.com --project-ref zgxvihvyjaeomezpwngq
//   supabase secrets set GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx --project-ref zgxvihvyjaeomezpwngq
//
// Tant que ces secrets ne sont pas définis, la demande est quand même
// enregistrée (le point le plus important) ; seul l'email échoue,
// silencieusement, et la ligne reste marquée "non notifiée".

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "sotgec.btp@gmail.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ENTITE_LABEL: Record<string, string> = {
  contact: "Contact général",
  btp: "SOTGEC BTP",
  immobilier: "SOTGEC Immobilier",
  consulting: "SOTGEC Consulting",
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

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: "GMAIL_USER / GMAIL_APP_PASSWORD non configurés" })
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
      <p style="color:#666;font-size:12px">Enregistré automatiquement dans Supabase (table demandes_site, id ${record.id}).</p>
    `;

    try {
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
        },
      });
      await client.send({
        from: `SOTGEC Site <${GMAIL_USER}>`,
        to: NOTIFY_TO,
        replyTo: isEmail(record.contact) ? record.contact : undefined,
        subject: sujet,
        html,
        content: "auto",
      });
      await client.close();
    } catch (smtpErr) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: `SMTP: ${String(smtpErr).slice(0, 500)}` })
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
function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s ?? ""));
}
