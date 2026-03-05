import { BackLink } from "@/components/BackLink";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackLink href="/dashboard" label="Retour à l'accueil" />

      <div className="flex flex-col gap-4">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted/70" />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-muted/20 p-5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
