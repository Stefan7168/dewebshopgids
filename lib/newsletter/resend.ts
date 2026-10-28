import "server-only";
// Minimal Resend REST calls for the newsletter and the dispute form (no SDK: three endpoints).
// Docs: https://resend.com/docs/api-reference/contacts/create-contact

const API = "https://api.resend.com";

function key(): string {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error("RESEND_API_KEY is not set");
  return k;
}

async function call(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${key()}`,
      "content-type": "application/json",
      ...(init.idempotencyKey ? { "idempotency-key": init.idempotencyKey } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
}

/** Creates the contact unsubscribed (not yet confirmed), or returns the existing contact's id. */
export async function ensureContact(email: string): Promise<string> {
  const created = await call("/contacts", { method: "POST", body: JSON.stringify({ email, unsubscribed: true }) });
  if (created.ok) return ((await created.json()) as { id: string }).id;
  const existing = await call(`/contacts/${encodeURIComponent(email)}`);
  if (existing.ok) return ((await existing.json()) as { id: string }).id;
  throw new Error(`Resend contact ${created.status}: ${(await created.text()).slice(0, 200)}`);
}

export async function setUnsubscribed(contactId: string, unsubscribed: boolean): Promise<void> {
  const res = await call(`/contacts/${encodeURIComponent(contactId)}`, { method: "PATCH", body: JSON.stringify({ unsubscribed }) });
  if (!res.ok) throw new Error(`Resend update ${res.status}`);
}

/** Sends to the contact id's address without us ever storing it: Resend resolves the email. */
export async function sendToContact(contactId: string, msg: { subject: string; text: string }, idempotencyKey: string): Promise<void> {
  const contact = await call(`/contacts/${encodeURIComponent(contactId)}`);
  if (!contact.ok) throw new Error(`Resend contact ${contact.status}`);
  const { email } = (await contact.json()) as { email: string };
  await sendEmail(email, msg, idempotencyKey);
}

/** Plain transactional send, also used by the dispute form. */
export async function sendEmail(to: string, msg: { subject: string; text: string }, idempotencyKey: string): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");
  const res = await call("/emails", { method: "POST", idempotencyKey, body: JSON.stringify({ from, to: [to], subject: msg.subject, text: msg.text }) });
  if (!res.ok) throw new Error(`Resend send ${res.status}`);
}

/**
 * Puts a confirmed subscriber in the gids segment the Thursday Broadcast goes to.
 * Docs: https://resend.com/docs/api-reference/contacts/add-contact-to-segment
 * Without RESEND_GUIDE_SEGMENT_ID (not set up yet) it does nothing.
 */
export async function addToGuideSegment(contactId: string): Promise<void> {
  const segment = process.env.RESEND_GUIDE_SEGMENT_ID;
  if (!segment) return;
  const res = await call(`/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segment)}`, { method: "POST" });
  if (!res.ok) throw new Error(`Resend segment ${res.status}`);
}
