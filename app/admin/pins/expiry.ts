// G3 default (plan v3 section 4): a batch nobody taps expires after 7 days. Older drafts are
// neither shown nor approvable; the post job only reads approved rows, so they are never posted.
export const DRAFT_DAYS = 7;

export function draftCutoff(now = Date.now()): string {
  return new Date(now - DRAFT_DAYS * 86_400_000).toISOString();
}
