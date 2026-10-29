// Unique intro text and FAQ per category page (traffic plan 2026-10-29). Same rules as the /beste
// lists (lib/beste/content.ts): Dutch, informal "je", 120 to 200 words, 3 to 5 questions, no claim
// about one shop, no personal names, no self-promotion. The text differs from the list pages: a
// category shows every published shop, including shops still in review, and has filters.
// `keyword` is an estimate from the traffic plan, not a measured volume.
import { AUDIT_BAND_MAX, LABEL_BELOW } from "../scoring/weights";
import type { Faq } from "../seo/faq";

export type CategoryContent = { keyword: string; intro: string[]; faq: Faq[] };

const REVIEW_Q: Faq = {
  q: "Wat betekent 'In beoordeling' bij een shop?",
  a: `De score van die shop ligt tussen ${LABEL_BELOW} en ${AUDIT_BAND_MAX} en krijgt eerst een tweede controle. Tot die klaar is, tonen we geen getal en staat de shop onder de shops met een score.`,
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  wonen: {
    keyword: "leuke woonwebshops",
    intro: [
      "Wonen & interieur is de grootste categorie van De Webshopgids. Je vindt hier Nederlandse webshops voor meubels, verlichting, woontextiel, woonaccessoires, keuken en tafelen en slapen. Bovenaan staan de shops met de hoogste echtheidsscore: makers, ontwerpers en specialisten met een eigen collectie.",
      "Gebruik de subcategorieën om sneller te vinden wat je zoekt, of de filters om bijvoorbeeld alleen shops met een gecontroleerd keurmerk of een fysieke winkel te zien. Bij elke shop staan dezelfde feiten: hoe lang het domein bestaat, ongeveer hoeveel producten hij verkoopt en of het keurmerk klopt. Die feiten meten we zelf. De echtheidsscore zegt hoe sterk een shop zelf maakt of ontwerpt, niet hoe goed de producten bij jouw smaak passen. Shops die alles doorverkopen, staan lager, maar je vindt ze hier wel.",
    ],
    faq: [
      { q: "Welke soorten woonwebshops staan hier?", a: "Meubelmakers, lampenontwerpers, weverijen, keramisten, beddenmakers en kleine labels met een eigen collectie. Grote platforms staan er ook, maar met een lage score of het label voor grote winkels." },
      { q: "Kan ik alleen shops met een winkel of showroom zien?", a: "Ja. Zet het filter voor een fysieke winkel aan. Dat filter gebruikt wat de shop zelf op zijn site zegt." },
      REVIEW_Q,
    ],
  },
  meubels: {
    keyword: "meubelmakers webshop",
    intro: [
      "Hier staan alle Nederlandse meubelwebshops die we hebben bekeken: van tafels en kasten tot stoelen, banken en bureaus. De volgorde is de echtheidsscore, dus meubelmakers met een eigen werkplaats en ontwerpers met een vaste collectie staan bovenaan.",
      "Anders dan op onze lijsten staan hier ook shops waarvan de score nog in beoordeling is. Met de filters zie je bijvoorbeeld alleen shops met een gecontroleerd keurmerk of met een showroom waar je kunt gaan zitten. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft; een klein aantal past vaak bij een maker. Zoek je maatwerk, kijk dan op de pagina van de shop of de site maatwerk noemt en welke levertijd erbij hoort. Zo vergelijk je snel wie zelf maakt en wie doorverkoopt.",
    ],
    faq: [
      { q: "Wat zegt het aantal producten over een meubelwebshop?", a: "Een maker heeft meestal een kleine collectie, soms met maatwerk. Shops met duizenden meubels verkopen vaak voorraad van groothandels. Het aantal telt mee in de score." },
      { q: "Waar zie ik of een shop maatwerk levert?", a: "Op de pagina van de shop, bij de zinnen van zijn eigen site waarop de punten zijn gebaseerd. Noemt de site maatwerk niet, vraag het dan aan de shop." },
      REVIEW_Q,
    ],
  },
  verlichting: {
    keyword: "lampen webshop nederland",
    intro: [
      "Alle Nederlandse webshops voor verlichting die we hebben bekeken: hanglampen, vloerlampen, wandlampen, tafellampen en losse kappen. De shops met de hoogste echtheidsscore staan bovenaan; dat zijn meestal ontwerpers en kleine merken die hun lampen zelf maken of in kleine series laten maken.",
      "Lampen zijn een categorie waarin veel webshops hetzelfde fabrieksmodel onder een andere naam verkopen. Daarom kijken we naar wat de site zegt over ontwerp en herkomst, en tellen we hoeveel producten een shop heeft. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel waar je de lampen kunt zien branden. Zoek je verlichting voor buiten, kijk dan in de categorie Buitenverlichting onder Tuin & buiten. Daar gelden andere eisen, zoals de bescherming tegen regen en vocht.",
    ],
    faq: [
      { q: "Waarom zie ik soms dezelfde lamp bij verschillende shops?", a: "Veel lampen komen uit dezelfde fabrieken en worden onder verschillende namen verkocht. Shops met een eigen ontwerp hebben dat minder, en scoren hoger." },
      { q: "Waar vind ik lampen voor buiten?", a: "In de categorie Buitenverlichting, onder Tuin & buiten." },
      REVIEW_Q,
    ],
  },
  woonaccessoires: {
    keyword: "woonaccessoires webshop",
    intro: [
      "Alle Nederlandse webshops voor woonaccessoires die we hebben bekeken: vazen, kaarsen, spiegels, schalen, kunst en andere kleine dingen voor in huis. Bovenaan staan shops met de hoogste echtheidsscore, zoals keramisten, kaarsenmakers en kleine ateliers.",
      "Woonaccessoires is de categorie met de meeste doorverkopers: veel shops hebben hetzelfde aanbod van dezelfde groothandels. Je ziet dat terug in het aantal producten en in de score. Een lage score betekent niet dat een shop slecht is, alleen dat hij weinig zelf maakt. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een fysieke winkel. Klik op een shop om de zinnen van zijn eigen site te lezen waarop de punten zijn gebaseerd, en om te zien hoe lang hij al online is.",
    ],
    faq: [
      { q: "Betekent een lage score dat een shop slecht is?", a: "Nee. De score zegt hoe sterk een shop zelf maakt of ontwerpt. Een doorverkoper kan prima service geven en toch laag scoren." },
      { q: "Hoe vind ik shops die zelf maken?", a: "Die staan bovenaan, omdat de volgorde de echtheidsscore is. Op de pagina van een shop zie je de zin van zijn site waarop dat gebaseerd is." },
      REVIEW_Q,
    ],
  },
  woontextiel: {
    keyword: "woontextiel webshop",
    intro: [
      "Alle Nederlandse webshops voor woontextiel die we hebben bekeken: kussens, plaids, gordijnen, tafellinnen en vloerkleden. Weverijen, naaiateliers en labels met een eigen collectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Bij textiel kun je veel zelf controleren: noemt de shop het materiaal, de samenstelling en waar het gemaakt is? Die zinnen tellen mee in de score, en je leest ze terug op de pagina van elke shop. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een fysieke winkel, handig als je een stof eerst wilt voelen. Shops waarvan de score nog een tweede controle krijgt, staan onderaan met 'In beoordeling'. Zoek je beddengoed, kijk dan ook in de categorie Slapen. Daar vind je dekbedovertrekken, lakens en kussenslopen.",
    ],
    faq: [
      { q: "Waar vind ik beddengoed?", a: "In de categorie Slapen. Woontextiel gaat over kussens, plaids, gordijnen, tafellinnen en vloerkleden." },
      { q: "Kan ik een stof eerst voelen voor ik bestel?", a: "Sommige shops sturen stalen of hebben een winkel. Zet het filter voor een fysieke winkel aan, of kijk op de site van de shop of hij stalen stuurt." },
      REVIEW_Q,
    ],
  },
  "keuken-tafelen": {
    keyword: "keuken en tafelen webshop",
    intro: [
      "Alle Nederlandse webshops voor keuken en tafelen die we hebben bekeken: servies, glaswerk, bestek, messen, snijplanken en tafellinnen. Keramisten, houtbewerkers en kleine merken met een eigen collectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Veel keukenspullen online zijn merkartikelen die bij tientallen shops te koop zijn. Daar is niets mis mee, maar zoek je iets dat je niet overal ziet, begin dan bovenaan. Bij elke shop zie je ongeveer hoeveel producten hij heeft en hoe lang hij online is. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel. Klik door naar een shop om te lezen op welke zin van zijn site de punten zijn gebaseerd, bijvoorbeeld een eigen atelier of werkplaats. Zo zie je snel wie zelf maakt en wie vooral merken doorverkoopt.",
    ],
    faq: [
      { q: "Staan hier ook shops met bekende merken?", a: "Ja, maar ze scoren lager dan shops die zelf maken. De volgorde is de echtheidsscore." },
      { q: "Hoe zie ik of servies handgemaakt is?", a: "Op de pagina van de shop staat de zin van zijn eigen site waarop de punten voor herkomst zijn gebaseerd. Zegt de site niets over maken, dan krijgt de shop daar geen punten voor." },
      REVIEW_Q,
    ],
  },
  slapen: {
    keyword: "slaapwinkel online",
    intro: [
      "Alle Nederlandse webshops voor slapen die we hebben bekeken: bedden, matrassen, dekbedden, kussens en beddengoed. Bovenaan staan matrasmakers, vullers en kleine labels die zelf maken of naaien, omdat zij de hoogste echtheidsscore halen.",
      "Slapen is een categorie met grote verschillen: van werkplaatsen die elke matras met de hand vullen tot shops die dezelfde merken doorverkopen als de grote ketens. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Met de filters zie je alleen shops met een gecontroleerd keurmerk, of shops met een winkel waar je kunt proefliggen. Lees op de pagina van een shop op welke zin van zijn site de punten zijn gebaseerd, en kijk op zijn eigen site naar de proefslaapperiode en de retourregels.",
    ],
    faq: [
      { q: "Kan ik ergens proefliggen?", a: "Zet het filter voor een fysieke winkel aan. Of een shop proefliggen aanbiedt, staat op zijn eigen site." },
      { q: "Telt een proefslaapperiode mee in de score?", a: "Nee. De score gaat over maker, focus, identiteit, schaal en herkomst. Service zoals proefslapen staat los daarvan." },
      REVIEW_Q,
    ],
  },
  "tuin-buiten": {
    keyword: "tuinwebshops nederland",
    intro: [
      "Tuin & buiten bundelt Nederlandse webshops voor tuinmeubels, potten en plantenbakken, buitenverlichting, vuur en bbq en tuinaccessoires. De shops met de hoogste echtheidsscore staan bovenaan: smeden, timmerwerkplaatsen, ontwerpers en specialisten met een kleine, duidelijke collectie.",
      "Kies een subcategorie om gerichter te zoeken, of gebruik de filters om alleen shops met een gecontroleerd keurmerk of een fysieke winkel te zien. Bij buitenspullen is een winkel of showroom handig: je ziet de dikte van het staal en de afwerking van het hout beter in het echt. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij verkoopt. Grote tuincentra en bouwmarkten staan er ook in, maar met een lage score, omdat ze zelden zelf maken. Zoek je lampen voor in huis, kijk dan bij Verlichting.",
    ],
    faq: [
      { q: "Welke subcategorieën heeft Tuin & buiten?", a: "Tuinmeubels, potten en plantenbakken, buitenverlichting, vuur en bbq, en tuinaccessoires." },
      { q: "Staan tuincentra ook in deze categorie?", a: "Ja, als we ze hebben bekeken. Ze scoren meestal laag, omdat ze een breed assortiment van andere merken verkopen." },
      REVIEW_Q,
    ],
  },
  tuinmeubels: {
    keyword: "tuinmeubels webshop",
    intro: [
      "Alle Nederlandse webshops voor tuinmeubels die we hebben bekeken: tuintafels, banken, stoelen, loungesets en ligbedden. Bovenaan staan meubelmakers en ontwerpers die zelf maken of in kleine series laten maken, omdat zij de hoogste echtheidsscore halen.",
      "Tuinmeubels zie je bij veel webshops onder verschillende namen terug, vaak uit dezelfde fabriek. Het aantal producten en wat de site zegt over werkplaats en herkomst van het hout, helpen je het verschil te zien. Met de filters zie je alleen shops met een gecontroleerd keurmerk of met een showroom waar je kunt gaan zitten. Klik op een shop om de zinnen van zijn eigen site te lezen waarop de punten zijn gebaseerd, en kijk op zijn site naar onderhoud en garantie. Zo vergelijk je makers en doorverkopers naast elkaar.",
    ],
    faq: [
      { q: "Hoe herken ik tuinmeubels uit een fabriek?", a: "Hetzelfde model staat bij veel shops onder andere namen, en de site zegt niets over werkplaats of herkomst. Zulke shops scoren lager." },
      { q: "Waar zie ik de garantie?", a: "Op de site van de shop zelf. Garantie telt niet mee in de echtheidsscore." },
      REVIEW_Q,
    ],
  },
  "potten-plantenbakken": {
    keyword: "plantenbakken webshop",
    intro: [
      "Alle Nederlandse webshops voor potten en plantenbakken die we hebben bekeken: cortenstaal, hout, beton, terracotta en handgedraaid aardewerk, voor binnen en buiten. Werkplaatsen met maatwerk en makers met een eigen collectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Plantenbakken worden vaak op maat gemaakt, en dat zie je terug in de score: een shop die zelf last of zaagt, krijgt meer punten dan een shop die standaardmaten van een groothandel doorverkoopt. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een fysieke winkel. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Lees op de pagina van de shop op welke zin van zijn site de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Kan ik een plantenbak op maat laten maken?", a: "Bij veel werkplaatsen wel. Of een shop maatwerk doet, staat op zijn site en vaak ook bij de zinnen op zijn pagina hier." },
      { q: "Staan hier ook binnenpotten?", a: "Ja. De categorie gaat over potten en plantenbakken voor binnen en buiten." },
      REVIEW_Q,
    ],
  },
  buitenverlichting: {
    keyword: "buitenverlichting webshop",
    intro: [
      "Alle Nederlandse webshops voor buitenverlichting die we hebben bekeken: wandlampen, staande lampen, grondspots, terrasverlichting en tuinverlichting op laagspanning. Ontwerpers en specialisten met een eigen collectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "In buitenverlichting verkopen veel shops dezelfde merken, en sommige verkopen duizenden lampen. Zulke shops staan lager dan een ontwerper met een kleine collectie. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel waar je de lampen kunt zien. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Lampen voor binnen staan in de categorie Verlichting onder Wonen & interieur. Zoek je een lamp met een bijzonder ontwerp, begin dan bovenaan de lijst. Shops die nog een tweede controle krijgen, staan onderaan.",
    ],
    faq: [
      { q: "Waar vind ik lampen voor binnen?", a: "In de categorie Verlichting, onder Wonen & interieur." },
      { q: "Waarom staan grote lampenwinkels lager?", a: "Een zeer groot assortiment van andere merken geeft weinig punten voor schaal en focus. De volgorde is de echtheidsscore." },
      REVIEW_Q,
    ],
  },
  "vuur-bbq": {
    keyword: "vuurschalen webshop",
    intro: [
      "Alle Nederlandse webshops voor vuur en bbq die we hebben bekeken: vuurschalen, vuurkorven, tuinhaarden, barbecues en buitenkeukens. Smeden, lassers en kleine merken met een eigen ontwerp staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Veel vuurschalen online komen uit dezelfde fabrieken, terwijl er in Nederland ook werkplaatsen zijn die ze zelf zetten en lassen. Wat de site zegt over werkplaats, staaldikte en herkomst telt mee in de score. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een showroom. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik op een shop om te lezen op welke zin van zijn eigen site de punten zijn gebaseerd. Daar staan vaak ook de staaldikte en de maten.",
    ],
    faq: [
      { q: "Staan barbecuemerken ook in deze categorie?", a: "Ja, als we de webshop hebben bekeken. Doorverkopers van bekende merken scoren lager dan shops die zelf maken." },
      { q: "Telt de staaldikte mee in de score?", a: "Niet als getal. Wel telt mee of de site zegt dat de shop zelf maakt en waar het materiaal vandaan komt." },
      REVIEW_Q,
    ],
  },
  tuinaccessoires: {
    keyword: "tuinaccessoires webshop",
    intro: [
      "Alle Nederlandse webshops voor tuinaccessoires die we hebben bekeken: tuingereedschap, vogelhuisjes, regentonnen, tuinbeelden, windlichten en andere kleine dingen voor buiten. Bovenaan staan makers en specialisten met een eigen collectie, omdat zij de hoogste echtheidsscore halen.",
      "Tuinaccessoires is een brede categorie met veel doorverkopers. Daarom tellen het aantal producten en een duidelijke focus hier zwaar mee: een smid die zelf schoffels smeedt of een timmerman die vogelhuisjes maakt, staat boven een shop met duizenden artikelen. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een fysieke winkel. Bij elke shop zie je hoe lang hij online is. Lees op zijn pagina op welke zin van zijn site de punten zijn gebaseerd. Zoek je meubels of potten, kijk dan in de andere subcategorieën.",
    ],
    faq: [
      { q: "Wat valt onder tuinaccessoires?", a: "Alles voor buiten dat geen meubel, pot, lamp of vuurschaal is: gereedschap, vogelhuisjes, regentonnen, beelden en windlichten." },
      { q: "Waarom tellen focus en aantal producten hier zwaar?", a: "Ze tellen in elke categorie even zwaar. In deze brede categorie maken ze alleen meer verschil, omdat er veel shops met een groot aanbod zijn." },
      REVIEW_Q,
    ],
  },
  "eten-drinken": {
    keyword: "ambachtelijke producten webshop",
    intro: [
      "Eten & drinken bundelt Nederlandse webshops voor koffie en thee, chocolade en koek, kaas en delicatessen en honing. Bovenaan staan branderijen, chocolademakers, kaasmakers en imkers die zelf maken of oogsten, omdat zij de hoogste echtheidsscore halen.",
      "Webshops die vooral alcohol verkopen, nemen we niet op. Kies een subcategorie om gerichter te zoeken, of gebruik de filters om alleen shops met een gecontroleerd keurmerk of een winkel te zien. Veel makers hebben een winkel bij de branderij of makerij; dat is een mooie reden voor een uitje. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik op een shop om te lezen op welke zin van zijn eigen site de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Welke subcategorieën heeft Eten & drinken?", a: "Koffie en thee, chocolade en koek, kaas en delicatessen, en honing." },
      { q: "Waarom staan er geen wijn- of biershops?", a: "Webshops die vooral alcohol verkopen, nemen we niet op, omdat daarvoor aparte regels voor leeftijdscontrole gelden." },
      REVIEW_Q,
    ],
  },
  "koffie-thee": {
    keyword: "koffie en thee webshop",
    intro: [
      "Alle Nederlandse webshops voor koffie en thee die we hebben bekeken: koffiebonen, gemalen koffie, losse thee en theezakjes. Branderijen die zelf branden en theespecialisten met een eigen selectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "In deze categorie zie je goed het verschil tussen een branderij en een winkel: de een brandt zelf, de ander verkoopt koffie die elders gebrand is. Wat de site daarover zegt, telt mee in de score, net als de herkomst per boon of thee. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel, vaak met een proeverij. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik door om de zin te lezen waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Verkopen deze shops ook koffiemachines?", a: "Sommige wel. De score kijkt naar het hele aanbod, en een breed aanbod geeft minder punten voor focus." },
      { q: "Hoe weet ik of een shop zelf brandt?", a: "Op de pagina van de shop staat de zin van zijn eigen site waarop de punten voor maken zijn gebaseerd." },
      REVIEW_Q,
    ],
  },
  "chocolade-koek": {
    keyword: "chocolade webshop nederland",
    intro: [
      "Alle Nederlandse webshops voor chocolade en koek die we hebben bekeken: repen, bonbons, hagelslag, koekjes en banket. Bean-to-bar makers, chocolatiers en bakkers die zelf maken staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Een chocolatier die bonbons vult met ingekochte chocolade en een maker die zelf cacaobonen brandt, doen allebei vakwerk. In de score telt wat de site daarover zegt, net als de herkomst van de cacao. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Bestel je in de zomer, kijk dan op de site van de shop hoe hij warme dagen aanpakt. Op de pagina van elke shop lees je op welke zin van zijn site de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat is het verschil tussen een chocolatier en een bean-to-bar maker?", a: "Een chocolatier maakt bonbons en repen van ingekochte chocolade. Een bean-to-bar maker maakt de chocolade zelf, vanaf de cacaoboon." },
      { q: "Staan hier ook koekjes en banket?", a: "Ja. De categorie heet Chocolade & koek en gaat over beide." },
      REVIEW_Q,
    ],
  },
  "kaas-delicatessen": {
    keyword: "kaas webshop",
    intro: [
      "Alle Nederlandse webshops voor kaas en delicatessen die we hebben bekeken: boerenkaas, geitenkaas, gerijpte kazen, worst, olie, mosterd en andere streekproducten. Kaasmakers op de boerderij en kleine affineurs staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Kaas verkopen is iets anders dan kaas maken. Een shop die zegt van welke boerderij een kaas komt en hoe lang hij rijpt, krijgt meer punten dan een shop die vooral fabriekskaas doorverkoopt. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel, bijvoorbeeld op de boerderij. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik op een shop om de zin van zijn eigen site te lezen waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat valt onder delicatessen?", a: "Streekproducten naast kaas, zoals worst, olie, mosterd, jam en zoutjes." },
      { q: "Kan ik kaas ook op de boerderij kopen?", a: "Bij veel kaasmakers wel. Zet het filter voor een fysieke winkel aan, of kijk op de site van de shop." },
      REVIEW_Q,
    ],
  },
  honing: {
    keyword: "honing kopen bij imker",
    intro: [
      "Alle Nederlandse webshops voor honing die we hebben bekeken: bloemenhoning, heidehoning, raathoning en producten met bijenwas. Imkers met eigen bijenvolken staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Honing uit de supermarkt is vaak een mengsel uit verschillende landen. Een imker die zegt waar zijn bijenvolken staan en wanneer hij slingert, geeft je meer houvast. Wat de site daarover zegt, telt mee in de score, net als de herkomst per pot. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel, soms een stal aan huis. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik door om de zin te lezen waarop de punten zijn gebaseerd. Noemt de site een winkel en een plaats, dan zie je die op de pagina van de shop.",
    ],
    faq: [
      { q: "Waarom wordt honing hard?", a: "Honing kristalliseert vanzelf; hoe snel hangt af van de bloemen. Dat is geen teken van slechte kwaliteit. Au bain-marie op lage temperatuur maakt hem weer vloeibaar." },
      { q: "Hoe weet ik of honing uit Nederland komt?", a: "De imker noemt waar de bijenvolken staan. Die zin zie je terug op de pagina van de shop als hij punten voor herkomst oplevert." },
      REVIEW_Q,
    ],
  },
  "sieraden-accessoires": {
    keyword: "webshops sieraden en accessoires",
    intro: [
      "Sieraden & accessoires bundelt Nederlandse webshops voor sieraden, tassen en leer, en sjaals en mutsen. Goud- en zilversmeden, leerbewerkers en breiers met een eigen atelier staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Kies een subcategorie om gerichter te zoeken, of gebruik de filters om alleen shops met een gecontroleerd keurmerk of een winkel te zien. Bij een sieraad op maat of een tas die lang mee moet, is een atelier waar je langs kunt een pre. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft; een kleine collectie past vaak bij een maker. Klik op een shop om te lezen op welke zin van zijn eigen site de punten zijn gebaseerd. Zo zie je snel wie zelf maakt en wie vooral merken doorverkoopt.",
    ],
    faq: [
      { q: "Welke subcategorieën heeft Sieraden & accessoires?", a: "Sieraden, tassen en leer, en sjaals en mutsen." },
      { q: "Staan hier ook bekende sieradenmerken?", a: "Ja, als we de webshop hebben bekeken. Ze scoren meestal lager dan een smid met een eigen atelier." },
      REVIEW_Q,
    ],
  },
  sieraden: {
    keyword: "sieraden webshop nederland",
    intro: [
      "Alle Nederlandse webshops voor sieraden die we hebben bekeken: ringen, kettingen, armbanden, oorbellen en trouwringen. Goud- en zilversmeden met een eigen atelier en ontwerpers die zelf maken staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "In sieraden is het verschil tussen maker en doorverkoper groot. Veel sieraden online komen uit dezelfde fabrieken, terwijl een smid elk stuk zelf zaagt of giet. Wat de site zegt over het atelier, het metaal en de herkomst telt mee in de score. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel waar je kunt passen. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik door om de zin te lezen waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Kan ik een ring passen voor ik bestel?", a: "Bij shops met een winkel of atelier vaak wel. Zet het filter voor een fysieke winkel aan. Veel smeden sturen ook een ringmaat op." },
      { q: "Telt gerecycled goud mee in de score?", a: "Niet apart. Wel telt mee wat de site zegt over herkomst en of de shop zelf maakt." },
      REVIEW_Q,
    ],
  },
  "tassen-leer": {
    keyword: "leren tassen webshop",
    intro: [
      "Alle Nederlandse webshops voor tassen en leer die we hebben bekeken: handtassen, rugzakken, laptoptassen, portemonnees en riemen. Leerbewerkers met een eigen werkplaats en labels die zelf ontwerpen staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Tassen zijn een categorie met veel bekende merken en veel doorverkopers. Een shop die zegt waar het leer vandaan komt, hoe het gelooid is en of de tas in een eigen werkplaats gestikt wordt, krijgt meer punten. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft. Klik op een shop om de zin van zijn eigen site te lezen waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Staan hier ook tassen van ander materiaal dan leer?", a: "Ja, zoals canvas en vilt. De naam van de categorie volgt het meest gebruikte materiaal." },
      { q: "Doen makers ook reparaties?", a: "Sommige wel. Dat staat op hun eigen site. Reparatie telt niet mee in de echtheidsscore." },
      REVIEW_Q,
    ],
  },
  "sjaals-mutsen": {
    keyword: "handgebreide sjaals en mutsen",
    intro: [
      "Alle Nederlandse webshops voor sjaals en mutsen die we hebben bekeken: gebreide mutsen, sjaals, omslagdoeken, wanten en handschoenen. Breiers, wevers en labels met een eigen collectie staan bovenaan, omdat zij de hoogste echtheidsscore halen.",
      "Gebreid en geweven textiel kun je goed controleren: noemt de shop het garen, zoals merinowol, alpaca of katoen, en zegt hij waar en door wie het gemaakt is? Die zinnen tellen mee in de score, en je leest ze terug op de pagina van elke shop. Met de filters zie je alleen shops met een gecontroleerd keurmerk of een winkel. Bij elke shop zie je hoe lang hij online is en ongeveer hoeveel producten hij heeft; een kleine collectie past vaak bij een maker. Klik op een shop om de zin te lezen waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Hoe zie ik of een sjaal handgebreid is?", a: "Op de pagina van de shop staat de zin van zijn eigen site waarop de punten voor herkomst zijn gebaseerd. Zegt de site niets over maken, dan krijgt de shop daar geen punten voor." },
      { q: "Zijn er ook sjaals van gerecycled garen?", a: "Bij sommige shops wel. Wat de site over materiaal zegt, zie je op zijn eigen productpagina's." },
      REVIEW_Q,
    ],
  },
};
