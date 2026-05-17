import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Button disabled variant="ghost" className="w-fit gap-2">
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Button>

        <div className="grid gap-6 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid flex-1 gap-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <section className="grid gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid min-h-72 gap-3 rounded-xl border bg-muted/20 p-3">
            <Skeleton className="h-14 w-2/3 rounded-xl" />
            <Skeleton className="ml-auto h-14 w-2/3 rounded-xl" />
            <Skeleton className="h-14 w-1/2 rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
        </section>
      </div>
    </main>
  );
}
