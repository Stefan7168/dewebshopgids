import Link from "next/link";
import { TextPage } from "@/components/text-page";

export const metadata = { title: "Pagina niet gevonden", robots: { index: false } };

export default function NotFound() {
  return (
    <TextPage title="Deze pagina bestaat niet">
      <p>De link klopt niet meer, of de pagina is verplaatst of offline gehaald.</p>
      <p>
        Zoek verder via de <Link href="/">homepage</Link>, bekijk alle <Link href="/categorie/wonen">webshops voor wonen en interieur</Link> of{" "}
        <Link href="/zoeken">zoek een webshop</Link>.
      </p>
    </TextPage>
  );
}
