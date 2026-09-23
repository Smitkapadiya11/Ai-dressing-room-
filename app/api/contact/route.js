// Demo enquiries from the home page → email, through Resend's HTTP API.
// Env: RESEND_API_KEY, CONTACT_TO_EMAIL, and optionally CONTACT_FROM_EMAIL
// (a sender on a domain verified in Resend; defaults to Resend's test sender).

export const runtime = "nodejs";

const FIELDS = ["name", "shop", "city", "phone", "outlets", "message"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return Response.json({ ok: true }); // honeypot: bots fill every field

  const data = Object.fromEntries(FIELDS.map((k) => [k, String(body[k] || "").trim().slice(0, k === "message" ? 2000 : 120)]));
  if (!data.name || !data.phone) {
    return Response.json({ error: "Please add your name and a phone or WhatsApp number." }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set; enquiry not sent:", data.shop || data.name);
    return Response.json({ error: "The form isn't connected yet." }, { status: 503 });
  }

  const rows = FIELDS.map((k) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${esc(data[k] || "—")}</td></tr>`).join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "Kapadiya & Sons <onboarding@resend.dev>",
      to: [to],
      subject: `Demo enquiry — ${data.shop || data.name}${data.city ? `, ${data.city}` : ""}`,
      html: `<table>${rows}</table>`,
    }),
  });
  if (!res.ok) {
    console.error("[contact] Resend failed:", res.status, (await res.text()).slice(0, 300));
    return Response.json({ error: "That didn't send. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
