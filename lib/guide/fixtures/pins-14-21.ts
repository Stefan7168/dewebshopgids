// Reference Pinterest pins for gids issues 14 to 21 (one per issue, board "gids"). They link to the
// issue page on our own site, never to a shop. They name the theme, not the shops, so they stay true
// when the Editor swaps a shop that is not published yet. They are not in the database: in the week an
// issue publishes, the SEO/Growth Analyst drafts its pin with `analyst.ts pin`, and Stefan approves it in
// /admin/pins (G3) like any other pin. Drafts expire after 7 days, so they cannot be queued earlier.
export type ReferencePin = { issue: number; path: string; title: string; description: string; board: "gids" };

export const referencePins: readonly ReferencePin[] = [
  {
    issue: 14,
    path: "/gids/2027-week-06",
    title: "Sieraden uit eigen atelier",
    description:
      "Ringen, oorbellen en kettingen van Nederlandse goudsmeden die alles zelf ontwerpen en maken, vaak van gerecycled goud en zilver. In De Webshopgids van deze week lees je welke ateliers dat zijn en waar ze zitten.",
    board: "gids",
  },
  {
    issue: 15,
    path: "/gids/2027-week-07",
    title: "Leren tassen en riemen uit eigen werkplaats",
    description:
      "Een goede leren tas koop je voor jaren. In De Webshopgids van deze week vind je Nederlandse leerateliers die hun tassen en riemen zelf snijden en stikken.",
    board: "gids",
  },
  {
    issue: 16,
    path: "/gids/2027-week-08",
    title: "Plantenbakken en potten voor het voorjaar",
    description:
      "Wie nu bestelt, kan straks planten. In De Webshopgids van deze week: Nederlandse makers van plantenbakken in hout, beton en cortenstaal, gemaakt in eigen werkplaats.",
    board: "gids",
  },
  {
    issue: 17,
    path: "/gids/2027-week-09",
    title: "Licht en vuur voor de eerste avonden buiten",
    description:
      "De avonden worden langer. In De Webshopgids van deze week vind je Nederlandse makers van buitenlampen, vuurtafels en barbecues, zodat je eerder in het jaar buiten kunt zitten.",
    board: "gids",
  },
  {
    issue: 18,
    path: "/gids/2027-week-10",
    title: "Honing en kaas van eigen bedrijf",
    description:
      "Honing van de eigen imkerij en kaas van de eigen boerderij, rechtstreeks bij de maker besteld. In De Webshopgids van deze week lees je welke Nederlandse imkers en kaasmakers je thuis laten bezorgen.",
    board: "gids",
  },
  {
    issue: 19,
    path: "/gids/2027-week-11",
    title: "Tuinmeubels uit eigen werkplaats",
    description:
      "Wie in de zomer buiten wil zitten, bestelt nu. In De Webshopgids van deze week: Nederlandse makers die tuinbanken, tafels en loungesets zelf bouwen, vaak van duurzaam hout.",
    board: "gids",
  },
  {
    issue: 20,
    path: "/gids/2027-week-12",
    title: "Een gedekte tafel voor Pasen",
    description:
      "Servies van de pottenbakker, linnen van de weverij en houten planken voor op tafel. In De Webshopgids van deze week vind je Nederlandse makers voor een paastafel die je niet overal ziet.",
    board: "gids",
  },
  {
    issue: 21,
    path: "/gids/2027-week-13",
    title: "Groen en kaarslicht in huis",
    description:
      "Het voorjaar begint, ook binnen. In De Webshopgids van deze week: Nederlandse makers van kaarsen, vazen en plantenpotten, met de hand gemaakt in eigen atelier.",
    board: "gids",
  },
];
