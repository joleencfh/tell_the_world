import Skeleton from '@/components/ui/Skeleton'

export default function BriefLoading() {
  return (
    <div aria-busy="true" className="min-h-screen bg-parchment font-ui text-umber">
      <header className="sticky top-0 z-20 border-b border-rule bg-parchment">
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-2 md:px-gutter md:py-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-14">
          {/* Header skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>

          {/* Section skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-36" />
                <div className="h-px flex-1 bg-rule" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-9/12" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
