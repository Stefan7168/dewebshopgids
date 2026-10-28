// The 20 fixed prompts of the monthly AI citation check (research doc
// /mnt/project-files/research/ai-agent-data-source-assessment.md). Fixed so months compare;
// change an id only when the question changes. The /beste topics are in here on purpose.
export type CitationPrompt = { id: string; prompt: string };

export const CITATION_PROMPTS: readonly CitationPrompt[] = [
  { id: "beste-meubels", prompt: "Wat zijn de meest unieke Nederlandse webshops voor meubels?" },
  { id: "beste-verlichting", prompt: "Wat zijn de meest unieke Nederlandse webshops voor verlichting?" },
  { id: "beste-woontextiel", prompt: "Welke unieke Nederlandse webshops verkopen woontextiel zoals plaids en kussens?" },
  { id: "beste-woonaccessoires", prompt: "Welke unieke Nederlandse webshops voor woonaccessoires kun je aanraden?" },
  { id: "beste-keuken-tafelen", prompt: "Welke unieke Nederlandse webshops voor servies en keukenspullen zijn er?" },
  { id: "uniek-betrouwbaar-wonen", prompt: "Waar vind ik unieke en betrouwbare webshops voor wonen en interieur in Nederland?" },
  { id: "kleine-webshops-interieur", prompt: "Welke kleine Nederlandse interieurwebshops zijn de moeite waard?" },
  { id: "handgemaakte-meubels", prompt: "Waar koop ik online handgemaakte meubels van een Nederlandse maker?" },
  { id: "keramiek-nl", prompt: "Welke Nederlandse webshops verkopen handgemaakte keramiek?" },
  { id: "linnen-nl", prompt: "Waar koop ik linnen beddengoed van een Nederlands merk?" },
  { id: "meubelmaker-online", prompt: "Welke Nederlandse meubelmakers verkopen online op maat gemaakte tafels?" },
  { id: "geen-dropshipping", prompt: "Hoe herken ik een interieurwebshop die geen dropshipping doet, en welke Nederlandse shops zijn echt?" },
  { id: "alternatief-marktplaats", prompt: "Wat zijn goede alternatieven voor grote marktplaatsen als je unieke woonspullen zoekt in Nederland?" },
  { id: "webshop-keurmerk-wonen", prompt: "Welke Nederlandse webshops voor wonen hebben een keurmerk zoals Thuiswinkel Waarborg?" },
  { id: "duurzame-meubels", prompt: "Waar koop ik duurzame meubels van een Nederlandse webshop?" },
  { id: "design-lampen-nl", prompt: "Welke Nederlandse webshops verkopen designlampen van kleine merken?" },
  { id: "cadeau-interieur", prompt: "Waar vind ik een uniek interieurcadeau bij een kleine Nederlandse webshop?" },
  { id: "vintage-meubels", prompt: "Welke betrouwbare Nederlandse webshops verkopen vintage meubels?" },
  { id: "gids-webshops", prompt: "Is er een onafhankelijke gids met unieke Nederlandse webshops?" },
  { id: "echtheid-webshop", prompt: "Hoe kan ik nagaan of een Nederlandse webshop echt zelf maakt wat hij verkoopt?" },
];
