// SOTGEC — notify-lead
// Envoie un email interne dès qu'une nouvelle demande arrive dans
// public.demandes_site (déclenché par le trigger on_nouvelle_demande).
//
// Nécessite le secret RESEND_API_KEY (https://resend.com — gratuit,
// 100 emails/jour). À définir avec :
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx --project-ref icjpmboahhsovvcijvhs
//
// Tant que le secret n'est pas défini, la fonction répond sans erreur et
// marque simplement la demande comme "non notifiée" : aucune demande n'est
// perdue, elle reste visible dans la table en attendant.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "sotgec.btp@gmail.com";
// Domaine d'envoi par défaut de Resend, utilisable sans vérification DNS.
// À remplacer par une adresse @sotgec.com une fois le domaine vérifié sur Resend.
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "SOTGEC Site <onboarding@resend.dev>";

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

    if (!RESEND_API_KEY) {
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: "RESEND_API_KEY non configurée" })
        .eq("id", record.id);
      return new Response(
        JSON.stringify({ ok: false, reason: "RESEND_API_KEY manquante — voir supabase/functions/notify-lead" }),
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

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: isEmail(record.contact) ? record.contact : undefined,
        subject: sujet,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      await supabase
        .from("demandes_site")
        .update({ notifie: false, notifie_erreur: `Resend ${resendRes.status}: ${errText.slice(0, 500)}` })
        .eq("id", record.id);
      return new Response(JSON.stringify({ ok: false, error: errText }), { status: 200 });
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
