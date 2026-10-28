// Legal identity shown in the footer (art. 3:15d BW). Fill in once the KvK
// registration exists; until then the footer says the registration is pending.
export const SITE = {
  name: "De Webshopgids",
  domain: "dewebshopgids.nl",
  url: "https://dewebshopgids.nl", // canonical origin for JSON-LD and canonical links
  email: "info@dewebshopgids.nl",
  legalName: null as string | null, // e.g. "Peek Media" (trade name from the KvK extract)
  kvk: null as string | null, // 8 digits
  address: null as string | null, // visiting address, or the KvK-registered address
};

/** The crawler name in our User-Agent (scripts/pipeline/fetch-polite.ts), shown to shops so they can block it. */
export const USER_AGENT_TOKEN = "DeWebshopgidsBot";
