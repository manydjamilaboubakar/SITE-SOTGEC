// SOTGEC — notify-lead
// Envoie un email interne dès qu'une nouvelle demande arrive dans
// public.demandes_site (déclenché par le trigger on_nouvelle_demande).
//
// Envoi via le compte Gmail existant sotgec.btp@gmail.com, avec un mot de
// passe d'application (pas le mot de passe du compte). Aucun nouveau
// prestataire à créer. Secrets à définir :
//   supabase secrets set GMAIL_USER=sotgec.btp@gmail.com --project-ref icjpmboahhsovvcijvhs
//   supabase secrets set GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx --project-ref icjpmboahhsovvcijvhs
//
// Le mot de passe d'application se génère sur myaccount.google.com/apppasswords
// (nécessite la validation en deux étapes activée sur le compte Gmail).
//
// Tant que les secrets ne sont pas définis, la fonction répond sans erreur et
// marque simplement la demande comme "non notifiée" : aucune demande n'est
// perdue, elle reste visible dans la table en attendant.

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

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const record = body.record ?? body; // compat direct-call en test

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: "GMAIL_USER / GMAIL_APP_PASSWORD non configurés" })
        .eq("id", record.id);
      return new Response(
        JSON.stringify({ ok: false, reason: "Identifiants Gmail manquants — voir supabase/functions/notify-lead" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const entiteLabel = ENTITE_LABEL[record.entite] ?? record.entite;
    const sujet = `Nouvelle demande SOTGEC — ${entiteLabel}${record.sujet ? " · " + record.sujet : ""}`;
    const pays = record.pays === "ci" ? "Côte d'Ivoire" : "Tchad";

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

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
      },
    });

    try {
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
      try { await client.close(); } catch (_) { /* déjà fermé */ }
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: `SMTP: ${String(smtpErr).slice(0, 500)}` })
        .eq("id", record.id);
      return new Response(JSON.stringify({ ok: false, error: String(smtpErr) }), { status: 200 });
    }

    await supabase
      .from("demandes_site")
      .update({ notifie: true, notifie_a: new Date().toISOString(), notifie_erreur: null })
      .eq("id", record.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200 });
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
