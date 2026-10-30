// Unique intro text and FAQ per /beste list (traffic plan 2026-10-29). Rules: Dutch, informal "je",
// 120 to 200 words of intro, 3 to 5 questions, no claim about one shop, no personal names, no
// self-promotion. `keyword` is the search phrase the page aims at: an estimate from the traffic plan,
// not a measured volume; the SEO/Growth Analyst replaces it with Search Console data from month 4.
import type { Faq } from "../seo/faq";

export type TopicContent = { keyword: string; intro: string[]; faq: Faq[] };

const ORDER_A = "Alleen op de echtheidsscore, van hoog naar laag. Betaling, affiliatelinks of een badge veranderen niets aan de volgorde.";

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  meubels: {
    keyword: "handgemaakte meubels webshop",
    intro: [
      "Op zoek naar een tafel, kast of stoel die je niet in elke woonwinkel ziet? Deze lijst toont Nederlandse webshops voor meubels, van meubelmakers met een eigen werkplaats tot kleine ontwerplabels die in series laten maken. Grote platforms met tienduizenden artikelen vind je hier niet bovenaan.",
      "Bij meubels zegt de herkomst veel. Een shop die laat zien in welke werkplaats een tafel ontstaat, welk hout er gebruikt wordt en of je maten kunt aanpassen, verdient meer punten dan een shop die hetzelfde model van een groothandel doorverkoopt. Let ook op levertijd: maatwerk duurt vaak weken, en een eerlijke shop zegt dat vooraf. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd, zodat je zelf kunt nagaan wat er staat.",
    ],
    faq: [
      { q: "Hoe herken je een webshop van een echte meubelmaker?", a: "Kijk of de site een werkplaats of atelier noemt, foto's van het maken laat zien en de houtsoort per meubel vermeldt. Een klein, vast assortiment past ook bij een maker. Die kenmerken tellen mee in de echtheidsscore." },
      { q: "Waarom is maatwerk vaak duurder en trager?", a: "Een meubel op maat wordt pas gemaakt na je bestelling. Daardoor is de levertijd langer en de prijs hoger dan bij voorraad uit een magazijn. Een goede shop noemt de levertijd vooraf." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
      { q: "Staat elke meubelwebshop op deze lijst?", a: "Nee. Een shop staat hier pas als hij een definitieve score heeft. Shops die nog in beoordeling zijn, vind je in de categorie Meubels." },
    ],
  },
  verlichting: {
    keyword: "design lamp nederlands",
    intro: [
      "Een goede lamp bepaalt hoe een kamer voelt, overdag en 's avonds. Deze lijst toont Nederlandse webshops voor verlichting: hanglampen, vloerlampen, tafellampen en wandlampen van ontwerpers en kleine merken die je niet bij de grote bouwmarkten vindt.",
      "Online lijken veel lampen op elkaar, en dat is vaak geen toeval: hetzelfde model uit dezelfde fabriek wordt onder verschillende namen verkocht. Shops die zelf ontwerpen, in kleine series laten maken of de maker en het land van herkomst noemen, scoren daarom hoger. Kijk bij het kopen ook naar de fitting, de lichtkleur en of de lamp met een dimmer werkt; een specialist zet dat duidelijk bij elk product. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Hoe zie je of een designlamp echt van de ontwerper is?", a: "Een shop die zelf ontwerpt, noemt dat op de site en laat vaak schetsen of het maakproces zien. Staat hetzelfde model op veel andere sites onder een andere naam, dan is het meestal een fabrieksontwerp." },
      { q: "Waar let je op bij het kiezen van een lamp?", a: "Op de fitting, de lichtkleur in kelvin, de lichtsterkte in lumen en of de lamp dimbaar is. Een specialist zet die gegevens bij elk product." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  woontextiel: {
    keyword: "wollen vloerkleed handgemaakt",
    intro: [
      "Kussens, plaids, gordijnen, tafelkleden en vloerkleden: textiel maakt een huis warm. Deze lijst toont Nederlandse webshops voor woontextiel, van weverijen en naaiateliers tot kleine labels met een eigen collectie. Grote ketens met duizenden artikelen staan hier zelden bovenaan.",
      "Bij textiel is de herkomst vaak goed na te gaan. Een shop die schrijft waar een vloerkleed geweven is, van welk materiaal en door welke werkplaats, geeft je meer houvast dan een shop met alleen sfeerfoto's. Natuurlijke materialen zoals wol, linnen en katoen gedragen zich anders dan kunststof: ze slijten langzamer, maar vragen soms meer zorg. Een goede shop zet de wasvoorschriften en de samenstelling bij elk product. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Waar let je op bij een vloerkleed van wol of jute?", a: "Op de samenstelling, hoe het kleed gemaakt is (handgeknoopt, handgeweven of machinaal) en waar het gemaakt is. Een shop die dat per kleed noemt, kun je daarop controleren." },
      { q: "Hoe weet je of textiel handgeweven is?", a: "De shop noemt het weefproces of de werkplaats, en kleine verschillen tussen exemplaren worden uitgelegd. Die tekst op de site telt mee in de echtheidsscore." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  woonaccessoires: {
    keyword: "unieke woonaccessoires online",
    intro: [
      "Vazen, kaarsen, spiegels, schalen en wanddecoratie: met kleine dingen geef je een huis karakter. Deze lijst toont Nederlandse webshops voor woonaccessoires die je niet in elke winkelstraat tegenkomt, van keramisten tot kaarsenmakers.",
      "In deze categorie verkopen veel webshops hetzelfde aanbod van dezelfde groothandels. Daarom tellen een kleine, duidelijke collectie, een eigen atelier en een eerlijke uitleg over de herkomst hier zwaar mee. Een keramist die zelf draait of een kaarsenmaker die zelf giet, scoort hoger dan een shop met duizenden artikelen. Dat zegt niets over de prijs: ook betaalbare shops kunnen hoog scoren als ze zelf maken. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd, zodat je zelf kunt controleren wat er staat.",
    ],
    faq: [
      { q: "Waarom zie ik hetzelfde product op veel webshops?", a: "Veel woonaccessoires komen van dezelfde groothandels en worden door veel shops tegelijk verkocht. Shops met een eigen ontwerp of eigen atelier hebben dat minder." },
      { q: "Betekent een hoge score een dure shop?", a: "Nee. De score gaat over maker, focus, herkomst en hoe groot het assortiment is, niet over de prijs." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "keuken-en-tafelen": {
    keyword: "handgemaakt servies webshop",
    intro: [
      "Servies, glaswerk, snijplanken, messen en tafellinnen: aan tafel gebruik je ze elke dag. Deze lijst toont Nederlandse webshops voor keuken en tafelen, van keramisten en houtbewerkers tot kleine merken met een eigen collectie. Het gaat om spullen die lang meegaan en die je niet overal ziet.",
      "Handgemaakt servies is nooit helemaal gelijk: kleine verschillen in glazuur en vorm horen erbij. Een goede shop legt dat uit en noemt of het servies vaatwasserbestendig is. Bij hout en messen zegt de herkomst van het materiaal veel. Shops die zelf draaien, bakken, slijpen of schaven, of de werkplaats noemen waar het gebeurt, scoren daarom hoger dan doorverkopers van bekende merken. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Kan handgemaakt servies in de vaatwasser?", a: "Dat hangt af van de klei en het glazuur. Een goede shop zet het bij elk product. Staat het er niet, vraag het dan voor je bestelt." },
      { q: "Waarom verschilt handgemaakt servies per stuk?", a: "Elk stuk wordt los gedraaid of gevormd en gebakken. Kleine verschillen in kleur en vorm zijn daardoor normaal en geen fout." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  slapen: {
    keyword: "natuurlijk beddengoed webshop",
    intro: [
      "Een bed, matras, dekbed of beddengoed koop je voor jaren, en je gebruikt het elke nacht. Deze lijst toont Nederlandse webshops voor slapen, van matrasmakers en vullers tot kleine labels voor linnen en katoenen beddengoed.",
      "Bij slapen draait veel om materiaal en afwerking. Een shop die zegt waar een matras gemaakt wordt, welke vulling erin zit en hoe lang je mag proefslapen, geeft je meer om op te vertrouwen dan een shop met alleen een lage prijs. Natuurlijke vullingen zoals wol, kapok en latex voelen anders dan synthetisch schuim. Shops die zelf vullen, naaien of in een eigen werkplaats maken, scoren hier hoger dan doorverkopers van dezelfde merken. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Waar let je op bij een matras online kopen?", a: "Op de vulling, de hardheid, de proefslaapperiode en de retourregels. Een goede shop zet die duidelijk op de site." },
      { q: "Wat is het verschil tussen linnen en katoenen beddengoed?", a: "Linnen voelt koeler en wordt zachter na elke was. Katoen is gladder en vaak goedkoper. Beide kunnen lang meegaan als de kwaliteit goed is." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "tuin-en-buiten": {
    keyword: "unieke tuinwebshops",
    intro: [
      "Tuinmeubels, plantenbakken, vuurschalen, buitenverlichting en tuingereedschap: deze lijst toont Nederlandse webshops voor tuin en buiten. Het gaat om makers en specialisten, niet om de bouwmarkt met alles onder één dak.",
      "Buitenspullen moeten jaren tegen regen, zon en vorst. Daarom zegt de herkomst van hout en staal hier veel, net als een eerlijke uitleg over onderhoud. Een shop die laat zien in welke werkplaats een tuinbank gelast of getimmerd wordt, of die noemt waar het hout vandaan komt, krijgt meer punten dan een shop met een groot assortiment van andere merken. Kijk ook naar de garantie en of onderdelen later nog te krijgen zijn. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Welke materialen houden het lang uit in de tuin?", a: "Hardhout zoals eiken of robinia, cortenstaal en gegalvaniseerd staal gaan lang mee als je ze goed onderhoudt. Een goede shop legt uit welk onderhoud nodig is." },
      { q: "Waarom staat de bouwmarkt niet op deze lijst?", a: "De lijst rangschikt op echtheidsscore. Winkels met een zeer groot en breed assortiment krijgen daarop weinig punten, omdat ze zelden zelf maken." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  tuinmeubels: {
    keyword: "handgemaakte tuinmeubels",
    intro: [
      "Een tuintafel, bank of ligbed die jaren buiten kan staan: deze lijst toont Nederlandse webshops voor tuinmeubels, van meubelmakers met een eigen werkplaats tot kleine ontwerplabels.",
      "Let bij tuinmeubels op het hout, het staal en de afwerking. Een eiken of robinia bank die van één werkplaats komt, gedraagt zich anders dan een goedkope set uit een container. Goede shops vertellen hoe je het meubel onderhoudt, of het buiten mag blijven staan in de winter en wat de levertijd is. Shops die zelf ontwerpen of maken, of de herkomst van hun materiaal noemen, scoren hier hoger dan doorverkopers van dezelfde collecties. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd, zodat je die zelf kunt nalezen.",
    ],
    faq: [
      { q: "Mogen tuinmeubels de hele winter buiten staan?", a: "Hardhout en gegalvaniseerd staal kunnen dat meestal, kussens en sommige houtsoorten niet. Volg het advies van de maker; een goede shop zet dat bij het product." },
      { q: "Hoe herken je een tuinmeubel uit een eigen werkplaats?", a: "De site noemt de werkplaats, de houtsoort en vaak maatwerk. Die tekst telt mee in de echtheidsscore, en je ziet hem bij de shop op deze lijst." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "potten-en-plantenbakken": {
    keyword: "cortenstaal plantenbak op maat",
    intro: [
      "Van cortenstaal en hout tot handgedraaid aardewerk: deze lijst toont Nederlandse webshops voor potten en plantenbakken, voor binnen en buiten. Je vindt hier makers met een eigen werkplaats en specialisten met een kleine, duidelijke collectie.",
      "Veel plantenbakken online komen uit dezelfde fabrieken en worden onder verschillende namen verkocht. Een eigen werkplaats, maatwerk of een duidelijke herkomst zegt hier meer. Denk bij het kiezen aan vorstbestendigheid, een afwateringsgat en het gewicht als de bak vol aarde zit, zeker op een balkon. Cortenstaal krijgt na een paar weken een roestlaag; dat hoort zo, maar het kan afgeven op tegels. Een goede shop legt dat uit. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd, zodat je zelf kunt nagaan wat er staat.",
    ],
    faq: [
      { q: "Geeft cortenstaal roest af op de tegels?", a: "In de eerste weken kan dat, tot de roestlaag stabiel is. Een onderlegger of een paar weken laten verweren op een andere plek helpt. Een goede shop zegt dat vooraf." },
      { q: "Is aardewerk vorstbestendig?", a: "Niet altijd. Het hangt af van de klei en de bakking. Kijk of de shop het product vorstbestendig noemt voordat je het buiten laat staan." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  buitenverlichting: {
    keyword: "design buitenverlichting",
    intro: [
      "Lampen voor tuin, terras, oprit en gevel: deze lijst toont Nederlandse webshops voor buitenverlichting, van ontwerpers met een eigen collectie tot specialisten in tuinverlichting. Grote bouwmarkten met duizenden lampen staan hier zelden bovenaan.",
      "Buitenlampen moeten tegen regen, vorst en zon. Kijk daarom naar de IP-waarde: hoe hoger het tweede cijfer, hoe beter de lamp tegen water kan. Let ook op het materiaal, zoals messing, koper of gecoat staal, en of je de lamp zelf mag aansluiten of een installateur nodig hebt. Shops die hun lampen zelf ontwerpen of in kleine series maken, scoren hier hoger dan shops met een groot assortiment van andere merken. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Welke IP-waarde heeft een buitenlamp nodig?", a: "Voor een lamp onder een overkapping is IP44 meestal genoeg. Voor een lamp in de grond of vol in de regen kies je een hogere waarde, zoals IP65 of IP67." },
      { q: "Mag ik buitenverlichting zelf aansluiten?", a: "Lampen op 230 volt laat je bij twijfel aansluiten door een installateur. Systemen op 12 of 24 volt zijn meestal bedoeld om zelf aan te leggen." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "vuurschalen-en-bbq": {
    keyword: "handgemaakte vuurschaal",
    intro: [
      "Vuurschalen, vuurkorven, buitenkeukens en barbecues: deze lijst toont Nederlandse webshops voor vuur en bbq, van smeden en lassers tot kleine merken met een eigen ontwerp. Het gaat om stukken die jaren buiten kunnen staan.",
      "Een vuurschaal of barbecue moet hitte, regen en jaren gebruik aankunnen. Dik staal en goede lasnaden maken het verschil, en die zie je niet altijd op een foto. Shops die hun vuurschalen of barbecues zelf maken, of een duidelijke herkomst en staaldikte noemen, scoren hier hoger. Denk ook aan de regels in je gemeente: niet overal mag je een open vuur stoken, en bij droogte kan een stookverbod gelden. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Waar let je op bij een vuurschaal?", a: "Op de staaldikte, de lasnaden, een afvoer voor regenwater en een stevige voet. Een maker noemt die gegevens meestal bij het product." },
      { q: "Mag ik overal een vuurschaal gebruiken?", a: "Nee. Gemeenten hebben eigen regels voor open vuur, en bij droogte kan een stookverbod gelden. Kijk op de site van je gemeente." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "eten-en-drinken": {
    keyword: "ambachtelijke webshops eten",
    intro: [
      "Koffie, thee, chocolade, kaas en honing van Nederlandse makers: deze lijst toont webshops voor eten en drinken die zelf branden, maken, laten rijpen of oogsten.",
      "Ambachtelijk is geen beschermd woord, dus iedereen mag het gebruiken. Daarom kijken we naar wat de site echt zegt: een eigen branderij, chocolademakerij, kaasmakerij of eigen bijenvolken. Een shop die per product de herkomst noemt, krijgt meer punten dan een shop die vooral andere merken doorverkoopt. Let bij het bestellen op de verzending: chocolade en kaas zijn gevoelig voor warmte, en een goede shop zegt hoe hij dat oplost. Webshops die vooral alcohol verkopen, staan niet in deze lijst. Bij elke shop zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat betekent ambachtelijk bij eten?", a: "Het woord is niet beschermd. Daarom tellen we alleen wat de site concreet noemt, zoals een eigen branderij, makerij of eigen bijenvolken." },
      { q: "Waarom staan er geen wijn- of bierwebshops op de lijst?", a: "Webshops die vooral alcohol verkopen, nemen we niet op. Voor alcohol gelden aparte regels voor leeftijdscontrole." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "koffie-en-thee": {
    keyword: "koffiebranderij webshop",
    intro: [
      "Vers gebrande bonen en losse thee: deze lijst toont Nederlandse webshops voor koffie en thee, van kleine branderijen tot theespecialisten met een eigen selectie.",
      "Koffie smaakt het best in de weken na het branden. Een branderij die de branddatum op de zak zet, de herkomst per boon noemt en zelf inkoopt, geeft je meer zekerheid dan een winkel die vooral bekende merken doorverkoopt. Bij thee zegt de herkomst per tuin of regio veel, net als of de thee los of in zakjes komt. Branders die in een eigen branderij branden, scoren hier hoger. Bestel bij voorkeur hele bonen als je thuis kunt malen; die blijven langer vers. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Hoe lang blijft vers gebrande koffie goed?", a: "Hele bonen smaken het best in de eerste weken na het branden. Gemalen koffie verliest sneller smaak. Een goede branderij zet de branddatum op de verpakking." },
      { q: "Wat is het verschil tussen een branderij en een koffiewinkel?", a: "Een branderij brandt de bonen zelf. Een winkel verkoopt koffie die elders gebrand is. Dat verschil telt mee in de echtheidsscore." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  chocolade: {
    keyword: "ambachtelijke chocolade online",
    intro: [
      "Bonbons, repen en koek: deze lijst toont Nederlandse webshops voor chocolade, van bean-to-bar makers die zelf branden tot ateliers die bonbons met de hand vullen.",
      "Bean-to-bar betekent dat de maker zelf de cacaobonen brandt, maalt en concheert. Dat is iets anders dan een atelier dat bonbons maakt van ingekochte chocolade; beide zijn vakwerk, maar de site moet zeggen wat er gebeurt. Een shop die de herkomst van de cacao per reep noemt, krijgt meer punten. Let bij het bestellen op het weer: chocolade wordt zacht boven ongeveer 25 graden, en een goede shop zegt hoe hij in de zomer verstuurt. Shops die alles doorverkopen van bekende merken, scoren hier lager. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat betekent bean-to-bar?", a: "De maker doet alles zelf: van de cacaoboon branden en malen tot de reep gieten. Een shop die dat doet, noemt het op de site." },
      { q: "Kun je chocolade in de zomer laten bezorgen?", a: "Ja, maar met zorg. Veel shops versturen met koelelementen of slaan warme dagen over. Kijk op de site hoe de shop dat regelt." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "kaas-en-delicatessen": {
    keyword: "boerenkaas online bestellen",
    intro: [
      "Boerenkaas, gerijpte kazen en andere delicatessen: deze lijst toont Nederlandse webshops voor kaas en delicatessen, van kaasmakers op de boerderij tot kleine affineurs.",
      "Boerenkaas is in Nederland een beschermde naam: hij wordt op de boerderij gemaakt van rauwe melk. Een shop die zegt van welke boerderij een kaas komt, hoe lang hij gerijpt is en of hij van rauwe of gepasteuriseerde melk is, geeft je meer om op te vertrouwen. Shops die zelf kaas maken of laten rijpen, of hun herkomst per product noemen, scoren hier hoger. Let bij bestellen op de verzending: kaas reist het best gekoeld en goed verpakt. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat is het verschil tussen boerenkaas en andere Goudse kaas?", a: "Boerenkaas wordt op de boerderij gemaakt van rauwe melk. Andere Goudse kaas komt meestal uit een fabriek en wordt van gepasteuriseerde melk gemaakt." },
      { q: "Hoe blijft kaas goed tijdens de verzending?", a: "Gekoeld en goed verpakt. Een goede shop zegt welke dagen hij verstuurt en hoe hij de kaas koel houdt." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "sieraden-en-accessoires": {
    keyword: "webshops handgemaakte accessoires",
    intro: [
      "Sieraden, tassen, sjaals en mutsen van Nederlandse makers: deze lijst toont webshops voor sieraden en accessoires met een eigen atelier of werkplaats.",
      "In deze categorie is het verschil tussen maker en doorverkoper groot. Een goudsmid die zelf smeedt, een leerbewerker die zelf snijdt en naait of een breier met een eigen collectie scoort hoger dan een winkel die vooral bekende merken verkoopt. Kijk bij sieraden naar het materiaal en het gehalte, zoals 925 zilver of 14 karaat goud, en bij leer naar de looiing en herkomst. Een goede shop zet dat bij elk product en zegt of je iets op maat kunt laten maken. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Hoe herken je een webshop met een eigen atelier?", a: "De site noemt het atelier of de werkplaats, laat het maken zien en noemt materiaal en herkomst per product. Die tekst telt mee in de echtheidsscore." },
      { q: "Wat betekent 925 zilver?", a: "Dat het sieraad voor 92,5 procent uit zilver bestaat. Het is de gebruikelijke standaard voor zilveren sieraden." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "handgemaakte-sieraden": {
    keyword: "webshops handgemaakte sieraden",
    intro: [
      "Ringen, kettingen, armbanden en oorbellen: deze lijst toont Nederlandse webshops voor sieraden, van goud- en zilversmeden met een eigen atelier tot kleine ontwerplabels. Je vindt hier stukken die je niet in een warenhuis tegenkomt.",
      "Handgemaakt betekent bij sieraden dat het stuk in een atelier gezaagd, gesmeed, gegoten of gezet wordt, niet uit een catalogus komt. Een smid die laat zien hoe een ring ontstaat, het gehalte van het metaal noemt en zegt waar het materiaal vandaan komt, krijgt meer punten. Sommige makers werken met gerecycled goud en zilver; een goede shop zegt dat concreet in plaats van alleen duurzaam. Vraag bij een verlovings- of trouwring naar maatwerk en levertijd. Bij elke shop op de lijst zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat is het verschil tussen handgemaakt en ontworpen?", a: "Handgemaakt betekent dat het sieraad in het atelier zelf gemaakt wordt. Ontworpen kan ook betekenen dat het ontwerp elders in productie gaat. De site hoort te zeggen welke van de twee het is." },
      { q: "Kun je een sieraad op maat laten maken?", a: "Bij veel goud- en zilversmeden wel. Reken op een langere levertijd dan bij een sieraad uit voorraad." },
      { q: "Wat betekent 14 karaat goud?", a: "Dat het metaal voor 58,5 procent uit goud bestaat. 18 karaat is 75 procent goud." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "leren-tassen": {
    keyword: "handgemaakte leren tas",
    intro: [
      "Tassen, portemonnees, riemen en kleine lederwaren: deze lijst toont Nederlandse webshops voor tassen en leer, van leerbewerkers met een eigen werkplaats tot kleine labels met een eigen ontwerp.",
      "Bij leer zegt de looiing veel. Plantaardig gelooid leer kleurt mooi bij met de jaren; chroomgelooid leer is soepeler en goedkoper. Een shop die noemt waar het leer vandaan komt, hoe het gelooid is en of de tas met de hand gestikt wordt, geeft je meer houvast dan een shop met alleen het woord echt leer. Makers die hun tassen zelf snijden en naaien, scoren hier hoger dan doorverkopers van bekende merken. Vraag ook of de maker reparaties doet; dat zegt iets over hoe lang een tas mee moet gaan. Bij elke shop zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Wat is plantaardig gelooid leer?", a: "Leer dat met looistof uit schors of bladeren is bewerkt in plaats van met chroomzouten. Het wordt donkerder en mooier met de jaren." },
      { q: "Hoe herken je een handgemaakte leren tas?", a: "De site noemt de werkplaats, het soort leer en vaak handgestikte naden. Die tekst telt mee in de echtheidsscore." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "met-showroom": {
    keyword: "woonwinkels met showroom",
    intro: [
      "Wil je een bank, tafel of lamp eerst zien en voelen voor je hem koopt? Deze lijst toont Nederlandse woonwebshops die ook een fysieke winkel of showroom hebben.",
      "Een showroom helpt vooral bij grote aankopen: je ziet de echte kleur van een stof, voelt hoe hard een bank zit en ziet hoe groot een tafel in het echt is. Een shop staat hier alleen als zijn eigen site een winkel of showroom noemt. Noemt de site ook de plaats, dan zie je die op de pagina van de shop. Bel of mail voor je gaat: kleine makers hebben soms alleen open op afspraak of op vaste dagen. De volgorde is ook hier alleen de echtheidsscore; een showroom zelf geeft geen extra punten. Bij elke shop zie je de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Kan ik zonder afspraak langs bij de showroom?", a: "Dat verschilt per shop. Kleine makers zijn vaak alleen open op afspraak. Kijk op de site van de shop of neem contact op voor je gaat." },
      { q: "Geeft een showroom extra punten in de score?", a: "Nee. Een showroom is een filter voor deze lijst, geen onderdeel van de echtheidsscore." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "vintage-interieur": {
    keyword: "vintage interieur webshop",
    intro: [
      "Zoek je een vintage stoel, een lamp uit de jaren zestig of servies van vroeger, maar liever niet via een grote marktplaats? Deze lijst toont Nederlandse webshops die zelf vintage verkopen, met een eigen site en een eigen collectie.",
      "Een shop staat hier alleen als vintage, antiek of tweedehands design het hoofdaanbod is. Dat hebben we op de eigen site van de shop nagekeken. Een winkel met alleen een klein vintagehoekje telt niet mee. Veel van deze shops kopen hun stukken in, knappen ze op en verkopen ze per stuk. Ze maken dus meestal geen nieuwe producten. Daardoor is hun echtheidsscore vaak lager dan die van een meubelmaker, ook als ze veel zelf restaureren. De volgorde is ook hier alleen de echtheidsscore. Bij elke shop zie je de feiten die we zelf hebben gecontroleerd.",
    ],
    faq: [
      { q: "Waarom geen marktplaatsen zoals Marktplaats of Catawiki?", a: "Op een marktplaats verkopen veel verschillende verkopers. Deze lijst toont alleen shops met een eigen site en een eigen collectie." },
      { q: "Waarom scoren vintage shops vaak lager dan makers?", a: "De echtheidsscore geeft de meeste punten aan shops die zelf maken of ontwerpen. Een vintage shop verkoopt bestaande stukken, ook als hij die zelf opknapt." },
      { q: "Hoe weten jullie dat een shop vintage verkoopt?", a: "Een mens heeft de eigen site van de shop bekeken en een zin bewaard waarin de shop dat zelf zegt. Alleen shops waar vintage het hoofdaanbod is, staan op de lijst." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "handgemaakt-servies": {
    keyword: "handgemaakt servies",
    intro: [
      "Zoek je borden, kommen of mokken die met de hand zijn gemaakt, in plaats van servies uit de fabriek? Deze lijst toont Nederlandse webshops die handgemaakt servies verkopen: van een pottenbakker met een eigen atelier tot een merk dat zijn servies met de hand laat beschilderen.",
      "Een shop staat hier alleen als zijn eigen site zegt dat het servies met de hand wordt gemaakt of beschilderd, en als borden, kommen of bekers een vast deel van het aanbod zijn. Dat hebben we op de site van de shop nagekeken. Handgemaakt betekent ook: elk stuk is net iets anders, en een set is vaak in kleine aantallen te krijgen. Vraag bij een grote bestelling eerst na hoeveel er op voorraad is. Sommige merken laten hun servies maken in een atelier in het buitenland; dat zie je op de pagina van de shop. De volgorde is alleen de echtheidsscore.",
    ],
    faq: [
      { q: "Is handgemaakt servies vaatwasserbestendig?", a: "Dat verschilt per maker en per glazuur. Kijk bij het product op de site van de shop; veel makers zetten het erbij." },
      { q: "Waarom ziet elk bord er net anders uit?", a: "Omdat het met de hand is gedraaid, gevormd of beschilderd. Kleine verschillen in vorm en kleur horen daarbij." },
      { q: "Hoe weten jullie dat het servies handgemaakt is?", a: "Een mens heeft de eigen site van de shop bekeken en een zin bewaard waarin de shop dat zelf zegt. Shops zonder zo'n zin staan niet op de lijst." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  koffiebranderijen: {
    keyword: "koffiebranders nederland",
    intro: [
      "Wil je koffie die kort geleden is gebrand, rechtstreeks van de brander? Deze lijst toont Nederlandse webshops van koffiebranderijen die hun bonen zelf branden, van kleine branderijen met een paar soorten tot specialty-branders met een abonnement.",
      "Een shop staat hier alleen als zijn eigen site zegt dat hij de koffie zelf brandt. Dat hebben we op de site van de shop nagekeken. Een winkel die gebrande koffie van anderen verkoopt, staat er niet op. Let bij het bestellen op de branddatum: veel branders zetten die op de zak, en hele bonen smaken het best in de weken daarna. Vraag je je af welke maling je nodig hebt, kijk dan bij het product: veel branders malen op bestelling voor filter, espresso of French press. De volgorde is alleen de echtheidsscore.",
    ],
    faq: [
      { q: "Waarom koffie bij een branderij kopen?", a: "Een branderij brandt in kleine hoeveelheden en verstuurt kort daarna. Daardoor is de koffie vaak verser dan koffie die lang in een magazijn heeft gelegen." },
      { q: "Hoe weten jullie dat een shop zelf brandt?", a: "Een mens heeft de eigen site van de shop bekeken en een zin bewaard waarin de shop dat zelf zegt. Shops zonder zo'n zin staan niet op de lijst." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
  "met-keurmerk": {
    keyword: "woonwebshops met keurmerk",
    intro: [
      "Een keurmerk geeft extra zekerheid bij betalen, retourneren en klachten. Deze lijst toont Nederlandse woonwebshops waarvan we het keurmerk zelf hebben gecontroleerd.",
      "Een logo op een site zegt nog niet dat het keurmerk geldig is. Daarom tellen we een keurmerk alleen als de site van de keurmerkorganisatie de webshop zelf noemt, op naam en domein. Bekende keurmerken in Nederland zijn onder meer Thuiswinkel Waarborg en WebwinkelKeur; elk heeft eigen regels voor bijvoorbeeld bedenktijd en geschillen. Een keurmerk zegt iets over de afspraken met klanten, niet over wie de producten maakt. Daarom is de volgorde ook hier de echtheidsscore. Bij elke shop zie je welk keurmerk we hebben gecontroleerd en de zin van zijn eigen site waarop de punten zijn gebaseerd.",
    ],
    faq: [
      { q: "Hoe controleren jullie een keurmerk?", a: "We zoeken de webshop op bij de keurmerkorganisatie zelf. Alleen als die de shop op naam en domein noemt, tellen we het keurmerk." },
      { q: "Wat levert een keurmerk mij op?", a: "Afspraken over onder meer betalen, bedenktijd en klachten, en vaak een geschillenregeling als je er met de shop niet uitkomt. De precieze regels staan bij de keurmerkorganisatie." },
      { q: "Telt een keurmerk mee in de score?", a: "Ja, een gecontroleerd keurmerk geeft een minimum aan punten. Het bepaalt de volgorde niet alleen; de echtheidsscore doet dat." },
      { q: "Hoe is de volgorde van deze lijst bepaald?", a: ORDER_A },
    ],
  },
};
