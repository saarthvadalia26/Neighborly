import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Button disabled variant="ghost" className="w-fit gap-2">
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Button>

        <header className="grid gap-3 border-b pb-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-44" />
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {Array.from({ length: 2 }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <div className="grid gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-64" />
              </div>
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="grid gap-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid flex-1 gap-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
