import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </header>

        <section className="grid gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(220px,320px)_auto_auto]">
              <Skeleton className="h-9 w-full xl:w-80" />
              <Skeleton className="h-9 w-full xl:w-80" />
              <Skeleton className="h-9 w-full xl:w-64" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-44 gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid flex-1 gap-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
