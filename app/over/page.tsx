import Link from "next/link";
import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Over De Webshopgids",
  description:
    "Wie wij zijn en hoe De Webshopgids Nederlandse webshops beoordeelt.",
};

export default function OverPage() {
  return (
    <TextPage title="Over De Webshopgids">
      <p>
        De Webshopgids helpt je unieke en betrouwbare Nederlandse webshops te
        vinden, te beginnen met wonen en interieur. Per webshop tonen we feiten:
        hoe lang de shop online is, hoeveel producten er ongeveer zijn, welk
        keurmerk er is, en een echtheidsscore van 1 tot 100.
      </p>
      <h2 className="text-xl font-semibold mt-4">Hoe wij werken</h2>
      <p>
        Wij verzamelen openbare gegevens van de webshop zelf en van
        keurmerkregisters. AI helpt ons de teksten van de webshop te lezen; de
        score zelf berekenen we met een vast rekenmodel, en elke getoonde
        bewering staat letterlijk op de site van de webshop. Een tweede,
        onafhankelijke controle kijkt steekproefsgewijs mee. Klopt er iets niet
        over jouw webshop? Klik onderaan de pagina van je webshop op &ldquo;Klopt
        er iets niet?&rdquo;. Hoe dat werkt, lees je bij{" "}
        <Link href="/informatie-voor-webshops" className="underline">
          informatie voor webshops
        </Link>
        . Lukt dat niet, mail dan naar{" "}
        <a href={`mailto:${SITE.email}`} className="underline">
          {SITE.email}
        </a>
        .
      </p>
      <h2 className="text-xl font-semibold mt-4">Hoe wij geld verdienen</h2>
      <p>
        Opname is gratis. Wij verdienen geld via affiliatecommissies: als je via
        onze link iets koopt, kunnen wij een vergoeding ontvangen. Dat heeft
        geen invloed op de score.
      </p>
    </TextPage>
  );
}
