"use client";

export function LiveDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading live dashboard">
      <div className="h-28 animate-pulse rounded-2xl bg-[var(--color-wash)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-[var(--color-wash)]"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="h-10 w-48 animate-pulse rounded-md bg-[var(--color-wash)]" />
          <div className="h-36 animate-pulse rounded-xl bg-[var(--color-wash)]" />
          <div className="h-36 animate-pulse rounded-xl bg-[var(--color-wash)]" />
        </div>
        <div className="space-y-3">
          <div className="h-10 w-40 animate-pulse rounded-md bg-[var(--color-wash)]" />
          <div className="h-64 animate-pulse rounded-xl bg-[var(--color-wash)]" />
        </div>
      </div>
    </div>
  );
}
