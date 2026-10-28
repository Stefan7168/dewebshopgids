import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Fixed text only: the ?error= value comes from the URL, so showing it would let anyone put
// their own words on our domain. Supabase's message is in the server logs.
export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              <h1>Deze link werkt niet</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>De link is verlopen of al gebruikt.</p>
            <p>
              <Link href="/auth/forgot-password" className="underline">
                Vraag een nieuwe link aan
              </Link>{" "}
              of ga naar de{" "}
              <Link href="/" className="underline">
                homepage
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
