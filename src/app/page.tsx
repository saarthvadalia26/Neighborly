import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="mx-auto grid w-full max-w-3xl gap-8 text-center">
        <div className="grid gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            Hyper-local barter powered by Credits
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Community Swap
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground">
            Trade useful items, errands, lessons, repairs, and neighborly help
            without money changing hands.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Create account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
