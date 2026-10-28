import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Over De Webshopgids",
  description:
    "Wie wij zijn en hoe De Webshopgids Nederlandse webshops beoordeelt.",
};

export default function OverPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <article className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Over De Webshopgids</h1>
        <p>
          De Webshopgids helpt je unieke en betrouwbare Nederlandse webshops te
          vinden, te beginnen met wonen en interieur. Per webshop tonen we
          feiten: hoe lang de shop online is, hoeveel producten er ongeveer
          zijn, welk keurmerk er is, en een echtheidsscore van 1 tot 100.
        </p>
        <h2 className="text-xl font-semibold mt-4">Hoe wij werken</h2>
        <p>
          Wij verzamelen openbare gegevens van de webshop zelf en van keurmerkregisters. AI helpt ons de teksten
          van de webshop te lezen; de score zelf berekenen we met een vast rekenmodel, en elke getoonde bewering
          staat letterlijk op de site van de webshop. Een tweede, onafhankelijke controle kijkt steekproefsgewijs
          mee. Klopt er iets niet over jouw webshop? Mail ons via{" "}
          <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
        </p>
        <h2 className="text-xl font-semibold mt-4">Hoe wij geld verdienen</h2>
        <p>
          Opname is gratis. Wij verdienen geld via affiliatecommissies: als je
          via onze link iets koopt, kunnen wij een vergoeding ontvangen. Dat
          heeft geen invloed op de score.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
